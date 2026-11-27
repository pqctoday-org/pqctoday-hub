#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * make-aliases.ts — saves a page for each alias address (src/seo/prerenderedAliases.ts), so a crawler
 * that asks the host for `/playground/cacp-kmip` gets the page of `/playground/cacp` with a 200 and
 * not a 404. Each alias is written both ways the prerender step writes a page: dist/<route>/index.html
 * and dist/<route>.html (the host answers `/route` from the second without a redirect).
 *
 * Runs in `npm run build` after the prerender step.
 *
 * Exit codes:
 *   0 — every alias written
 *   1 — a target page is missing or not valid (nothing is written for it)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { PRERENDERED_ALIASES } from '../../src/seo/prerenderedAliases'
import { buildAliasPage } from '../lib/aliasPage'

const DIST = path.resolve(process.cwd(), 'dist')
let failed = false

for (const { from, to } of PRERENDERED_ALIASES) {
  const targetFile = path.join(DIST, ...to.split('/').filter(Boolean), 'index.html')
  if (!existsSync(targetFile)) {
    console.error(
      `\n✖ ${from}: no saved page for ${to} (${targetFile}), run the prerender step first`
    )
    failed = true
    continue
  }
  const { html, errors } = buildAliasPage(readFileSync(targetFile, 'utf8'), to)
  if (errors.length > 0) {
    console.error(`\n✖ ${from} would not be a valid alias of ${to}:`)
    for (const error of errors) console.error(`  • ${error}`)
    failed = true
    continue
  }
  const dir = path.join(DIST, ...from.split('/').filter(Boolean))
  mkdirSync(dir, { recursive: true })
  writeFileSync(path.join(dir, 'index.html'), html)
  writeFileSync(`${dir}.html`, html)
  console.log(`✔ ${from} answers with the page of ${to} (canonical ${to})`)
}
process.exit(failed ? 1 : 0)
