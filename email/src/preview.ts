import { render } from '@react-email/render'
import { writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import FamilyPlan, { sampleFamilyPlan } from './templates/FamilyPlan.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main(): Promise<void> {
  const html = await render(FamilyPlan(sampleFamilyPlan))
  const outPath = resolve(__dirname, '../preview.html')
  writeFileSync(outPath, html)
  console.log(`Preview written to ${outPath}`)
  console.log(`Size: ${(Buffer.byteLength(html) / 1024).toFixed(1)} KB`)
}

main()
