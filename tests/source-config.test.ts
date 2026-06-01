import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  DISNEY_CHANNELS,
  DISNEY_CHANNEL_SOURCES,
  DISNEY_CHANNEL_URLS,
} from '../shared/types.js';

test('Disney channel source metadata is unique and feeds the RSS map', () => {
  const keys = DISNEY_CHANNEL_SOURCES.map((source) => source.key);
  const channelIds = DISNEY_CHANNEL_SOURCES.map((source) => source.channelId);

  assert.equal(new Set(keys).size, keys.length);
  assert.equal(new Set(channelIds).size, channelIds.length);
  assert.deepEqual(Object.keys(DISNEY_CHANNELS), keys);

  for (const source of DISNEY_CHANNEL_SOURCES) {
    assert.match(source.channelId, /^UC[A-Za-z0-9_-]+$/);
    assert.equal(DISNEY_CHANNELS[source.key], source.channelId);
    assert.equal(
      DISNEY_CHANNEL_URLS[source.key],
      `https://www.youtube.com/channel/${source.channelId}`
    );
  }
});

test('About page source list stays aligned with source metadata', () => {
  const aboutHtml = readFileSync(join(process.cwd(), 'about.html'), 'utf-8');

  for (const source of DISNEY_CHANNEL_SOURCES) {
    assert.match(aboutHtml, new RegExp(`>${escapeRegex(source.displayName)}<`));
    assert.match(
      aboutHtml,
      new RegExp(`https://www\\.youtube\\.com/channel/${escapeRegex(source.channelId)}`)
    );
  }
});

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
