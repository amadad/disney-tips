import { render } from '@react-email/render'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import WeeklyTopTips, { type TipEmail } from './templates/WeeklyTopTips.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const sampleTips: TipEmail[] = [
  {
    text: 'Head to Frozen Ever After in Epcot first thing in the morning using Early Theme Park Entry to minimize waits.',
    category: 'parks',
    park: 'epcot',
    priority: 'high',
    source: { channelName: 'DFBGuide', videoId: 'abc123' },
  },
  {
    text: 'Mobile order your meals at quick-service restaurants to skip the line entirely — order 30-60 minutes before you want to eat.',
    category: 'dining',
    park: 'all-parks',
    priority: 'high',
    source: { channelName: 'AllEars.net', videoId: 'def456' },
  },
  {
    text: 'Book your Lightning Lane reservations at 7 AM sharp — the most popular rides sell out within minutes.',
    category: 'planning',
    park: 'magic-kingdom',
    priority: 'high',
    source: { channelName: 'DFBGuide', videoId: 'ghi789' },
  },
  {
    text: 'Visit Animal Kingdom on a weekday for significantly shorter wait times, especially for Flight of Passage.',
    category: 'parks',
    park: 'animal-kingdom',
    priority: 'medium',
    source: { channelName: 'TPMVids', videoId: 'jkl012' },
  },
  {
    text: 'The Skyliner gondola is free transportation between Epcot and Hollywood Studios with no wait most of the day.',
    category: 'transportation',
    priority: 'medium',
    source: { channelName: 'Provost Park Pass', videoId: 'mno345' },
  },
  {
    text: 'Bring a portable phone charger — Disney parks drain battery fast with the My Disney Experience app running all day.',
    category: 'planning',
    priority: 'low',
    source: { channelName: 'SuperEnthused', videoId: 'pqr678' },
  },
]

async function main(): Promise<void> {
  const props = {
    weekOf: 'February 17, 2026',
    tips: sampleTips,
    totalNewTips: 42,
  }

  const html = await render(WeeklyTopTips(props))
  const outPath = resolve(__dirname, '../preview.html')
  writeFileSync(outPath, html)
  console.log(`Preview written to ${outPath}`)
  console.log(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`)
}

main()
