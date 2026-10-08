#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * make-404.ts — writes dist/404.html, the page GitHub Pages serves (with a 404 status) for an address
 * that has no file, from the built dist/index.html. See scripts/lib/notFoundPage.ts.
 *
 * Runs in `npm run build` after the prerender step, in place of copying index.html to 404.html.
 *
 * Exit codes:
 *   0 — written and valid
 *   1 — the result does not hold (it is not written)
 *   2 — no dist/index.html
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { buildNotFoundPage, validateNotFoundPage } from '../lib/notFoundPage'

const DIST = path.resolve(process.cwd(), 'dist')
const INDEX = path.join(DIST, 'index.html')

if (!existsSync(INDEX)) {
  console.error(`\n✖ no ${INDEX} — run \`vite build\` first\n`)
  process.exit(2)
}

const html = buildNotFoundPage(readFileSync(INDEX, 'utf8'))
const errors = validateNotFoundPage(html)
if (errors.length > 0) {
  console.error('\n✖ dist/404.html would not be a valid not-found page:')
  for (const error of errors) console.error(`  • ${error}`)
  console.error('')
  process.exit(1)
}
writeFileSync(path.join(DIST, '404.html'), html)
console.log(
  '✔ dist/404.html is a not-found page (noindex, no canonical, the app still starts from it)'
)
