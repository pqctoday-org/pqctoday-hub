// SPDX-License-Identifier: AGPL-3.0-only
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const path = join(root, 'README.md')
const readme = readFileSync(path, 'utf8')
const sitemap = readFileSync(join(root, 'public', 'sitemap.xml'), 'utf8')
const failures = []

const forbidden = [
  /GRC command cent(?:er|re)/i,
  /real[- ]time compliance tracking/i,
  /automated data scraping/i,
  /local archive links/i,
  /WIP badge/i,
]
for (const phrase of forbidden) {
  if (phrase.test(readme)) failures.push(`obsolete or misleading phrase: ${phrase}`)
}

for (const match of readme.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
  const target = match[1].trim().replace(/^<|>$/g, '')
  if (target.startsWith('https://www.pqctoday.com/')) {
    const canonical = target.split(/[?#]/)[0]
    if (!sitemap.includes(`<loc>${canonical}</loc>`)) {
      failures.push(`live product route is absent from the generated sitemap: ${target}`)
    }
    continue
  }
  if (/^(https?:|mailto:|#)/.test(target)) continue
  if (target.startsWith('/')) {
    failures.push(`product route must use the canonical live-site URL: ${target}`)
    continue
  }
  const local = target.split('#')[0]
  if (local && !existsSync(join(root, local))) failures.push(`broken repository link: ${target}`)
}

for (const marker of [
  '<!-- BEGIN GENERATED README FACTS -->',
  '<!-- END GENERATED README FACTS -->',
]) {
  if (readme.split(marker).length !== 2) failures.push(`expected exactly one ${marker}`)
}
if (readme.split('\n').length > 400)
  failures.push('README exceeds the 400-line orientation-document limit')
if (!/education and demonstration platform/i.test(readme))
  failures.push('education boundary is missing')
if (!/not (?:a )?production cryptographic system/i.test(readme))
  failures.push('safety boundary is missing')

if (failures.length) {
  console.error(`✗ README audit failed:\n- ${failures.join('\n- ')}`)
  process.exit(1)
}
console.log('✓ README claims, markers and links pass the documentation contract')
