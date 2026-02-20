import { execFile } from 'child_process';
import { promisify } from 'util';
import { existsSync, readFileSync, unlinkSync } from 'fs';
import { Socket } from 'net';

const execFileAsync = promisify(execFile);

export type Logger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export type TranscriptRuntimeConfig = {
  proxyHost: string;
  proxyPort: number;
  proxyUrl?: string;
  denoPath: string;
  strictPreflight: boolean;
  useDenoRuntime: boolean;
  timeoutMs: number;
};

export type TranscriptPreflightResult = {
  ok: boolean;
  failures: string[];
  warnings: string[];
  config: TranscriptRuntimeConfig;
};

function envBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null) return defaultValue;
  const lower = value.toLowerCase().trim();
  if (['1', 'true', 'yes', 'on'].includes(lower)) return true;
  if (['0', 'false', 'no', 'off'].includes(lower)) return false;
  return defaultValue;
}

export function buildTranscriptRuntimeConfig(env: NodeJS.ProcessEnv = process.env): TranscriptRuntimeConfig {
  const home = env.HOME || '';
  const proxyHost = env.WARP_PROXY_HOST || '127.0.0.1';
  const proxyPort = Number(env.WARP_PROXY_PORT || '1080');
  const strictPreflight = envBool(env.TRANSCRIPT_STRICT_PREFLIGHT, true);
  const useDenoRuntime = envBool(env.TRANSCRIPT_USE_DENO_RUNTIME, true);
  const timeoutMs = Number(env.TRANSCRIPT_TIMEOUT_MS || '30000');
  const denoPath = env.DENO_PATH || `${home}/.deno/bin/deno`;

  return {
    proxyHost,
    proxyPort: Number.isFinite(proxyPort) && proxyPort > 0 ? proxyPort : 1080,
    proxyUrl: `socks5://${proxyHost}:${Number.isFinite(proxyPort) && proxyPort > 0 ? proxyPort : 1080}`,
    denoPath,
    strictPreflight,
    useDenoRuntime,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30000,
  };
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync(command, ['--version'], { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

async function isProxyReachable(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new Socket();
    const done = (ok: boolean) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(1500);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
    socket.connect(port, host);
  });
}

export async function runTranscriptPreflight(
  logger: Logger,
  env: NodeJS.ProcessEnv = process.env
): Promise<TranscriptPreflightResult> {
  const config = buildTranscriptRuntimeConfig(env);
  const failures: string[] = [];
  const warnings: string[] = [];

  const ytdlpOk = await commandExists('yt-dlp');
  if (!ytdlpOk) {
    failures.push('yt-dlp is not installed or not available in PATH');
  }

  if (config.useDenoRuntime && !existsSync(config.denoPath)) {
    warnings.push(`Deno runtime not found at ${config.denoPath}; continuing without --js-runtimes override`);
    config.useDenoRuntime = false;
  }

  const proxyOk = await isProxyReachable(config.proxyHost, config.proxyPort);
  if (!proxyOk) {
    warnings.push(`WARP proxy not reachable at ${config.proxyHost}:${config.proxyPort}; falling back to direct connection`);
    config.proxyUrl = undefined;
  }

  const ok = failures.length === 0 && (config.strictPreflight ? warnings.length === 0 : true);

  if (failures.length > 0) {
    failures.forEach(msg => logger.error(`[preflight] ${msg}`));
  }
  if (warnings.length > 0) {
    warnings.forEach(msg => logger.warn(`[preflight] ${msg}`));
  }
  if (ok) {
    logger.info('[preflight] transcript runtime checks passed');
  }

  return { ok, failures, warnings, config };
}

export function parseSrv1Transcript(xml: string): string {
  const parts: string[] = [];
  const regex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let m;

  while ((m = regex.exec(xml)) !== null) {
    parts.push(
      m[1]
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/\n/g, ' ')
    );
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

export async function fetchTranscriptViaYtdlp(
  videoId: string,
  config: TranscriptRuntimeConfig,
  logger: Logger
): Promise<string | null> {
  const outPath = `/tmp/yt-sub-${videoId}`;
  const subFile = `${outPath}.en.srv1`;

  try {
    try {
      unlinkSync(subFile);
    } catch {
      // ignore
    }

    const args = [
      '--geo-bypass-country', 'US',
      '--match-filter', 'duration > 60',
      '--write-sub', '--write-auto-sub',
      '--sub-lang', 'en',
      '--skip-download',
      '--sub-format', 'srv1',
      '--no-warnings',
      '-o', outPath,
      `https://www.youtube.com/watch?v=${videoId}`,
    ];

    if (config.proxyUrl) {
      args.unshift(config.proxyUrl);
      args.unshift('--proxy');
    }

    if (config.useDenoRuntime) {
      args.unshift(`deno:${config.denoPath}`);
      args.unshift('--js-runtimes');
    }

    await execFileAsync('yt-dlp', args, {
      timeout: config.timeoutMs,
      env: {
        ...process.env,
        PATH: `${process.env.HOME}/.deno/bin:${process.env.PATH}`,
      },
    });

    if (!existsSync(subFile)) return null;

    const xml = readFileSync(subFile, 'utf-8');
    unlinkSync(subFile);

    const text = parseSrv1Transcript(xml);
    return text.length > 50 ? text : null;
  } catch (err: any) {
    logger.debug(`yt-dlp failed for ${videoId}: ${err?.message || String(err)}`);
    return null;
  }
}
