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

// Modules whose infographics are KNOWN missing — assets require a Vertex AI
// Imagen run (priv scripts/generate-curious-visuals.mjs, needs GCLOUD_TOKEN),
// which cannot run in this environment. Each entry is debt, not acceptance:
// remove the id the moment its PNG is generated. The UI hides the visual
// pane for these (CuriousSummaryBanner imgFailed guard) so nothing renders
// broken. Any module NOT in this list still fails the audit.
// Listed 2026-07-09 (data-pipelines remediation).
// Exported (2026-07-19) so export-learn-manifest-snapshot.ts can reuse the
// single allowlist instead of duplicating it.
export const KNOWN_MISSING = new Set([
  'cbom',
  'crypto-registry',
  'pqc-grc',
  'quiz',
  'sbom',
  'skills-team-structure',
  'soc-implementation-pqc',
  'verification-closure',
])

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
  const knownMissing: string[] = []
  for (const id of ids) {
    const file = path.join(INFOGRAPHIC_DIR, `pqcstd_${id}.png`)
    if (!fs.existsSync(file)) {
      if (KNOWN_MISSING.has(id)) knownMissing.push(id)
      else missing.push(id)
    }
  }
  // Allowlisted entries whose PNG now exists are stale debt records — fail
  // so the list gets pruned.
  const stale = [...KNOWN_MISSING].filter((id) =>
    fs.existsSync(path.join(INFOGRAPHIC_DIR, `pqcstd_${id}.png`))
  )
  if (stale.length > 0) {
    console.error(
      `FAIL KNOWN_MISSING entries now have PNGs — remove them from the list: ${stale.join(', ')}`
    )
    process.exit(1)
  }

  if (missing.length === 0) {
    const covered = ids.length - knownMissing.length
    console.log(
      `PASS Module infographic coverage: ${covered}/${ids.length} modules have pqcstd_*.png`
    )
    if (knownMissing.length > 0) {
      console.log(
        `     ⚠ ${knownMissing.length} KNOWN-MISSING (need Vertex AI generation, UI hides pane): ${knownMissing.join(', ')}`
      )
    }
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

// Run only when invoked directly (`npx tsx scripts/audit-module-infographics.ts`),
// not when imported for its KNOWN_MISSING export — importing must never
// trigger the audit's process.exit.
const invokedDirectly =
  process.argv[1] !== undefined && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()
