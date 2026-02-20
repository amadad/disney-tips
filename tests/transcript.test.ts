import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSrv1Transcript } from '../scripts/lib/transcript.js';

test('parseSrv1Transcript decodes entities and flattens whitespace', () => {
  const xml = `<transcript>
    <text start="0" dur="1">Hello &amp; welcome</text>
    <text start="1" dur="1">Use &lt;Lightning Lane&gt; &#39;wisely&#39;</text>
  </transcript>`;

  const parsed = parseSrv1Transcript(xml);
  assert.equal(parsed, "Hello & welcome Use <Lightning Lane> 'wisely'");
});
