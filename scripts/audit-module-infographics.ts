#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * scripts/audit-module-infographics.ts
 *
 * Coverage gate for learn-module infographics.
 *
 * Every module in the catalog must have a matching
 * `public/images/infographics/pqcstd_<id>.png`. The CuriousSummaryBanner
 * component no longer carries a fallback chain — a missing pqcstd_ file
 * renders as a broken image. This audit fails the build if any module is
 * missing its infographic, preventing the regression at PR time.
 *
 * MODULE_CATALOG is manifest-derived: moduleData.ts builds it via
 * buildCatalog(MANIFESTS) (src/components/PKILearning/manifest/derive.ts),
 * where MANIFESTS is the import.meta.glob of
 * src/components/PKILearning/modules/<Dir>/manifest.ts. This script mirrors
 * that source of truth by enumerating those manifest files on disk and
 * extracting each module's top-level `id`.
 *
 * Exit codes:
 *   0 — all modules covered
 *   1 — one or more modules missing pqcstd_*.png, or zero modules found
 *       (a 0/0 pass is impossible by design)
 *   2 — unable to parse a module manifest (script error)
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const MODULES_DIR = path.join(REPO_ROOT, 'src/components/PKILearning/modules')
const INFOGRAPHIC_DIR = path.join(REPO_ROOT, 'public/images/infographics')

function extractModuleIds(): string[] {
  if (!fs.existsSync(MODULES_DIR)) {
    console.error(`audit-module-infographics: modules directory not found: ${MODULES_DIR}`)
    process.exit(2)
  }
  const manifestFiles = fs
    .readdirSync(MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(MODULES_DIR, d.name, 'manifest.ts'))
    .filter((f) => fs.existsSync(f))

  const ids = new Set<string>()
  for (const file of manifestFiles) {
    const src = fs.readFileSync(file, 'utf-8')
    // Top-level id only: two-space indent inside `const manifest: ModuleManifest = {`.
    // Nested ids (learnSections, workshopSteps) sit at deeper indentation.
    const m = src.match(/^ {2}id:\s*'([a-z0-9-]+)',?\s*$/m)
    if (!m) {
      console.error(
        `audit-module-infographics: could not extract top-level id from ${path.relative(REPO_ROOT, file)}`
      )
      process.exit(2)
    }
    ids.add(m[1])
  }
  return [...ids].sort()
}

function main() {
  const ids = extractModuleIds()
  if (ids.length === 0) {
    console.error(
      'FAIL audit-module-infographics: 0 modules enumerated from ' +
        'src/components/PKILearning/modules/*/manifest.ts — the audit checked nothing. ' +
        'A 0/0 pass is not allowed; fix the enumeration or the module tree.'
    )
    process.exit(1)
  }
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
    'remove the module manifest under src/components/PKILearning/modules/<Module>/manifest.ts.'
  )
  process.exit(1)
}

main()
