import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTranscriptRuntimeConfig, parseSrv1Transcript } from '../scripts/lib/transcript.js';

test('parseSrv1Transcript decodes entities and flattens whitespace', () => {
  const xml = `<transcript>
    <text start="0" dur="1">Hello &amp; welcome</text>
    <text start="1" dur="1">Use &lt;Lightning Lane&gt; &#39;wisely&#39;</text>
  </transcript>`;

  const parsed = parseSrv1Transcript(xml);
  assert.equal(parsed, "Hello & welcome Use <Lightning Lane> 'wisely'");
});

test('buildTranscriptRuntimeConfig uses socks5h proxy URLs', () => {
  const config = buildTranscriptRuntimeConfig({
    HOME: '/home/deploy',
    WARP_PROXY_HOST: '127.0.0.1',
    WARP_PROXY_PORT: '1080',
  });

  assert.equal(config.proxyUrl, 'socks5h://127.0.0.1:1080');
});
