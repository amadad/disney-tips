import { config } from 'dotenv'
import { render } from '@react-email/render'
import { Resend } from 'resend'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import FamilyPlan, { sampleFamilyPlan } from './templates/FamilyPlan.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

config({ path: resolve(__dirname, '../../.env') })
config({ path: resolve(__dirname, '../../.env.local'), override: true })

function parseArgs(): { to: string; subject?: string } {
  const args = process.argv.slice(2)
  const toIdx = args.indexOf('--to')
  const subjectIdx = args.indexOf('--subject')

  if (toIdx === -1 || !args[toIdx + 1]) {
    console.error('Usage: tsx src/send-family-plan.ts --to <email> [--subject <subject>]')
    process.exit(1)
  }

  return {
    to: args[toIdx + 1],
    subject: subjectIdx === -1 ? undefined : args[subjectIdx + 1],
  }
}

function defaultSubject(): string {
  const sentAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  return `Sample Disney family trip plan - ${sentAt} UTC`
}

async function main(): Promise<void> {
  const { to, subject: subjectArg } = parseArgs()
  const apiKey = process.env.RESEND_API_KEY

  if (!apiKey) {
    console.error('RESEND_API_KEY environment variable is required')
    process.exit(1)
  }

  const plan = FamilyPlan(sampleFamilyPlan)
  const html = await render(plan)
  const plainText = await render(plan, { plainText: true })
  const resend = new Resend(apiKey)
  const from = process.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM || 'Disney Plans <plans@disney.bound.tips>'
  const subject = subjectArg || defaultSubject()

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
  console.log(`HTML: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`)
}

main()
