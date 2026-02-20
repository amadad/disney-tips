/**
 * Cloudflare Worker: YouTube Transcript Proxy
 *
 * Fetches YouTube captions from Cloudflare edge (non-datacenter IP).
 * Uses YouTube's internal get_transcript API.
 *
 * POST /transcript { videoId: "xxx" } → { ok, transcript, language }
 * POST /batch { videoIds: ["xxx", ...] } → { results: { videoId: { ok, transcript } } }
 */

const BEARER = globalThis.YT_PROXY_BEARER;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const rateLimitStore = new Map();

function getClientIp(request) {
  return request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "unknown";
}

function isRateLimited(ip) {
  const now = Date.now();
  const current = rateLimitStore.get(ip);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  current.count += 1;
  if (current.count > RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  rateLimitStore.set(ip, current);
  return false;
}

async function fetchTranscript(videoId) {
  // Step 1: Fetch watch page to get innertube context
  const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml",
    },
  });

  const html = await pageRes.text();

  if (html.includes("Sign in to confirm you're not a bot")) {
    return { ok: false, error: "bot detection triggered" };
  }

  // Try Method 1: Caption tracks + direct fetch
  const captionResult = await tryCaptionTracks(html, videoId);
  if (captionResult && captionResult.ok) return captionResult;

  // Try Method 2: YouTubei get_transcript API
  const apiResult = await tryYouTubeiAPI(html, videoId);
  if (apiResult && apiResult.ok) return apiResult;

  return { ok: false, error: "all methods failed", debug: { caption: captionResult?.error, api: apiResult?.error } };
}

async function tryCaptionTracks(html, videoId) {
  const match = html.match(/"captionTracks":\s*(\[.*?\])/s);
  if (!match) return { ok: false, error: "no captionTracks" };

  const tracks = JSON.parse(match[1]);
  const enManual = tracks.find(t => t.languageCode === "en" && t.kind !== "asr");
  const enAuto = tracks.find(t => t.languageCode === "en");
  const track = enManual || enAuto || tracks[0];
  if (!track?.baseUrl) return { ok: false, error: "no baseUrl" };

  // Fetch with same cookies/context as the page
  const capRes = await fetch(track.baseUrl);
  const xml = await capRes.text();
  if (!xml || xml.length < 10) return { ok: false, error: "empty caption XML", xmlLen: xml.length };

  return parseXMLCaptions(xml, track);
}

function parseXMLCaptions(xml, track) {
  const parts = [];
  const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let m;
  while ((m = regex.exec(xml)) !== null) {
    parts.push(
      m[1]
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
        .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\n/g, " ")
    );
  }
  const transcript = parts.join(" ").replace(/\s+/g, " ").trim();
  if (!transcript) return { ok: false, error: "parsed empty transcript" };

  return {
    ok: true,
    transcript,
    language: track.languageCode,
    kind: track.kind || "manual",
    length: transcript.length,
    method: "captionTracks",
  };
}

async function tryYouTubeiAPI(html, videoId) {
  const apiKeyMatch = html.match(/"INNERTUBE_API_KEY":"([^"]+)"/);
  const clientVersionMatch = html.match(/"INNERTUBE_CLIENT_VERSION":"([^"]+)"/);
  if (!apiKeyMatch || !clientVersionMatch) return { ok: false, error: "no innertube credentials" };

  const apiKey = apiKeyMatch[1];
  const clientVersion = clientVersionMatch[1];

  // Encode params: protobuf-like encoding for transcript request
  // Field 1 (string) = videoId, nested in field 1
  const videoIdBytes = new TextEncoder().encode(videoId);
  const innerLen = 2 + videoIdBytes.length; // tag(1) + len + videoId
  const params = new Uint8Array(2 + innerLen);
  params[0] = 0x0a; // field 1, wire type 2 (length-delimited)
  params[1] = innerLen;
  params[2] = 0x0a; // field 1, wire type 2
  params[3] = videoIdBytes.length;
  params.set(videoIdBytes, 4);
  const paramsB64 = btoa(String.fromCharCode(...params));

  const res = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Origin": "https://www.youtube.com",
      "Referer": `https://www.youtube.com/watch?v=${videoId}`,
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: "WEB",
          clientVersion: clientVersion,
          hl: "en",
          gl: "US",
        },
      },
      params: paramsB64,
    }),
  });

  const data = await res.json();

  if (data.error) return { ok: false, error: `API error: ${data.error.message || JSON.stringify(data.error)}` };

  // Navigate response: actions[0].updateEngagementPanelAction.content.transcriptRenderer...
  const actions = data.actions || [];
  for (const action of actions) {
    const panel = action.updateEngagementPanelAction?.content;
    if (!panel) continue;

    // Try transcriptRenderer path
    const body = panel.transcriptRenderer?.body?.transcriptBodyRenderer;
    if (body?.cueGroups) {
      const text = body.cueGroups
        .map(g => g.transcriptCueGroupRenderer?.cues
          ?.map(c => c.transcriptCueRenderer?.cue?.simpleText).filter(Boolean).join(" "))
        .filter(Boolean)
        .join(" ");
      if (text) return { ok: true, transcript: text, length: text.length, method: "youtubei_cueGroups" };
    }

    // Try transcriptSearchPanelRenderer path
    const segments = panel.transcriptSearchPanelRenderer?.body?.transcriptSegmentListRenderer?.initialSegments;
    if (segments) {
      const text = segments
        .map(s => s.transcriptSegmentRenderer?.snippet?.runs?.map(r => r.text).join(""))
        .filter(Boolean)
        .join(" ");
      if (text) return { ok: true, transcript: text, length: text.length, method: "youtubei_segments" };
    }
  }

  return { ok: false, error: "no transcript in API response", responseKeys: Object.keys(data) };
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  const ip = getClientIp(request);
  const url = new URL(request.url);

  if (!BEARER) {
    console.error("Missing YT_PROXY_BEARER secret binding");
    return Response.json({ ok: false, error: "server misconfigured" }, { status: 500 });
  }

  if (url.pathname !== "/health" && isRateLimited(ip)) {
    console.warn(`Rate limit exceeded: ip=${ip} path=${url.pathname}`);
    return Response.json(
      { ok: false, error: "rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  const auth = request.headers.get("Authorization");
  if (auth !== `Bearer ${BEARER}`) {
    console.warn(`Unauthorized request: ip=${ip} path=${url.pathname}`);
    return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  if (request.method === "POST" && url.pathname === "/transcript") {
    const { videoId } = await request.json();
    if (!videoId) return Response.json({ ok: false, error: "videoId required" });
    const result = await fetchTranscript(videoId);
    return Response.json(result);
  }

  if (request.method === "POST" && url.pathname === "/batch") {
    const { videoIds } = await request.json();
    if (!videoIds?.length) return Response.json({ ok: false, error: "videoIds required" });

    const results = {};
    const promises = videoIds.slice(0, 20).map(async (id) => {
      results[id] = await fetchTranscript(id);
    });
    await Promise.all(promises);

    return Response.json({
      ok: true,
      results,
      fetched: Object.values(results).filter(r => r.ok).length,
      total: videoIds.length,
    });
  }

  if (url.pathname === "/health") {
    return Response.json({ ok: true, service: "yt-transcript-proxy" });
  }

  return Response.json({ ok: false, error: "not found" }, { status: 404 });
}
