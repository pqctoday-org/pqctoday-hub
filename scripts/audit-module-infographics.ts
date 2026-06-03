#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-module-infographics.ts
 *
 * Coverage gate for learn-module infographics.
 *
 * Every entry in MODULE_CATALOG must have a matching
 * `public/images/infographics/pqcstd_<id>.png`. The CuriousSummaryBanner
 * component no longer carries a fallback chain — a missing pqcstd_ file
 * renders as a broken image. This audit fails the build if any module is
 * missing its infographic, preventing the regression at PR time.
 *
 * Exit codes:
 *   0 — all modules covered
 *   1 — one or more modules missing pqcstd_*.png
 *   2 — unable to parse MODULE_CATALOG (script error)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MODULE_DATA = path.join(REPO_ROOT, 'src/components/PKILearning/moduleData.ts')
const INFOGRAPHIC_DIR = path.join(REPO_ROOT, 'public/images/infographics')

function extractModuleIds(): string[] {
  const src = fs.readFileSync(MODULE_DATA, 'utf-8')
  const catalogStart = src.indexOf('export const MODULE_CATALOG')
  if (catalogStart < 0) {
    console.error('audit-module-infographics: could not find MODULE_CATALOG export')
    process.exit(2)
  }
  // Slice to the closing brace of MODULE_CATALOG by tracking brace depth from the
  // first `{` after the export statement.
  const openIdx = src.indexOf('{', catalogStart)
  let depth = 0
  let endIdx = -1
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === '{') depth++
    else if (src[i] === '}') {
      depth--
      if (depth === 0) {
        endIdx = i
        break
      }
    }
  }
  if (endIdx < 0) {
    console.error('audit-module-infographics: unbalanced braces parsing MODULE_CATALOG')
    process.exit(2)
  }
  const body = src.slice(openIdx, endIdx + 1)
  // Top-level keys only (one indent inside the catalog object): `^  '<id>':`.
  const ids = new Set<string>()
  for (const m of body.matchAll(/^ {2}'([a-z0-9-]+)':/gm)) {
    ids.add(m[1])
  }
  return [...ids].sort()
}

function main() {
  const ids = extractModuleIds()
  const missing: string[] = []
  for (const id of ids) {
    const file = path.join(INFOGRAPHIC_DIR, `pqcstd_${id}.png`)
    if (!fs.existsSync(file)) missing.push(id)
  }

  if (missing.length === 0) {
    console.log(
      `PASS Module infographic coverage: ${ids.length}/${ids.length} modules have pqcstd_*.png`
    )
    process.exit(0)
  }

  console.error(`FAIL ${missing.length}/${ids.length} module(s) missing pqcstd_<id>.png:`)
  for (const id of missing) {
    console.error(`     - public/images/infographics/pqcstd_${id}.png`)
  }
  console.error('')
  console.error('Add the missing PNG(s) to public/images/infographics/ or')
  console.error(
    'remove the module from MODULE_CATALOG in src/components/PKILearning/moduleData.ts.'
  )
  process.exit(1)
}

main()
