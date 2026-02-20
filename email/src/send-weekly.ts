import { config } from 'dotenv'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import WeeklyTopTips, { type TipEmail } from './templates/WeeklyTopTips.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Load env from web-disney/.env.local
config({ path: resolve(__dirname, '../../.env.local') })

interface Tip {
  id: string
  text: string
  category: string
  park?: string
  priority: 'high' | 'medium' | 'low'
  source: {
    videoId: string
    channelName: string
    videoTitle: string
    publishedAt: string
  }
  extractedAt: string
}

interface TipsFile {
  lastUpdated: string
  totalTips: number
  tips: Tip[]
}

function parseArgs(): { to: string } {
  const args = process.argv.slice(2)
  const toIdx = args.indexOf('--to')
  if (toIdx === -1 || !args[toIdx + 1]) {
    console.error('Usage: tsx src/send-weekly.ts --to <email>')
    process.exit(1)
  }
  return { to: args[toIdx + 1] }
}

function loadTips(): TipsFile {
  const tipsPath = resolve(__dirname, '../../data/public/tips.json')
  return JSON.parse(readFileSync(tipsPath, 'utf-8'))
}

function getRecentTips(tipsFile: TipsFile, days: number = 7): Tip[] {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - days)

  return tipsFile.tips.filter(tip => {
    const extracted = new Date(tip.extractedAt)
    return extracted >= cutoff
  })
}

function selectTopTips(tips: Tip[], max: number = 7): TipEmail[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 }

  const sorted = [...tips].sort((a, b) => {
    return priorityOrder[a.priority] - priorityOrder[b.priority]
  })

  return sorted.slice(0, max).map(tip => ({
    text: tip.text,
    category: tip.category,
    park: tip.park,
    priority: tip.priority,
    source: {
      channelName: tip.source.channelName,
      videoId: tip.source.videoId,
    },
  }))
}

function formatWeekOf(): string {
  const now = new Date()
  return now.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

async function main(): Promise<void> {
  const { to } = parseArgs()

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('RESEND_API_KEY environment variable is required')
    process.exit(1)
  }

  const tipsFile = loadTips()
  const recentTips = getRecentTips(tipsFile)
  const topTips = selectTopTips(recentTips)

  if (topTips.length === 0) {
    console.error('No tips found from the last 7 days')
    process.exit(1)
  }

  const weekOf = formatWeekOf()

  const props = {
    weekOf,
    tips: topTips,
    totalNewTips: recentTips.length,
  }

  const html = await render(WeeklyTopTips(props))
  const plainText = await render(WeeklyTopTips(props), { plainText: true })

  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM || 'Disney Tips <disney@bound.tips>'

  const subject = `Top Disney Tips — Week of ${weekOf}`

  const { data, error } = await resend.emails.send({
    from,
    to: [to],
    subject,
    html,
    text: plainText,
  })

  if (error) {
    console.error('Send failed:', error)
    process.exit(1)
  }

  console.log(`Sent to ${to}`)
  console.log(`Message ID: ${data?.id}`)
  console.log(`Tips: ${topTips.length} selected from ${recentTips.length} recent`)
  console.log(`HTML: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`)
}

main()
