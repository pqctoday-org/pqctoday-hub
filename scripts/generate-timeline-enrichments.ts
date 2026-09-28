// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-timeline-enrichments — the merged timeline enrichment lookup the
 * app imports, precomputed from every timeline_doc_enrichments_*.md generation.
 *
 *   npx tsx scripts/generate-timeline-enrichments.ts          # write
 *   npx tsx scripts/generate-timeline-enrichments.ts --check  # exit 1 if stale (gate)
 *
 * Why (27 Sep 2026): src/data/timelineEnrichmentData.ts eagerly globbed all 40
 * raw markdown generations (34.2 MB, across doc-enrichments/ and three archive
 * tiers) into the app bundle, which made timelineEnrichmentData-*.js an 86 MB
 * chunk and dominated the production build's memory. The merged result the app
 * actually uses is 338 entries, 1.1 MB. The merge-ALL-generations semantics are
 * unchanged — dropping the archive tiers once lost 6 live rows — this only moves
 * the merge from every page load to build time.
 *
 * Output (deterministic, no timestamps, listed in .prettierignore):
 *   src/data/generated/timelineEnrichments.generated.json
 *
 * timelineEnrichments.generated.test.ts proves the output is key-for-key and
 * value-for-value identical to mergeEnrichmentFiles over the same files, read
 * through Vite's glob exactly as the old loader read them.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mergeEnrichmentFiles } from '../src/data/enrichmentParse'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DATA = path.join(ROOT, 'src/data')
const OUT = path.join(DATA, 'generated/timelineEnrichments.generated.json')

/** The four tiers, in the order the old loader spread its globs. */
export const TIMELINE_ENRICHMENT_DIRS = [
  'doc-enrichments',
  'archive',
  'doc-enrichments/archive',
  'doc-enrichments/archive_v1',
] as const

const FILE_RE = /^timeline_doc_enrichments_.*\.md$/

function readModules(): Record<string, string> {
  const modules: Record<string, string> = {}
  for (const dir of TIMELINE_ENRICHMENT_DIRS) {
    const abs = path.join(DATA, dir)
    if (!fs.existsSync(abs)) continue
    for (const f of fs
      .readdirSync(abs)
      .filter((n) => FILE_RE.test(n))
      .sort()) {
      modules[`./${dir}/${f}`] = fs.readFileSync(path.join(abs, f), 'utf-8')
    }
  }
  return modules
}

function main() {
  const check = process.argv.includes('--check')
  const modules = readModules()
  const n = Object.keys(modules).length
  if (n === 0) {
    console.error('[gen:timeline-enrichments] ✗ no timeline_doc_enrichments_*.md found')
    process.exit(1)
  }
  const merged = mergeEnrichmentFiles(modules)
  const text = JSON.stringify(merged, null, 1) + '\n'
  const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf-8') : ''
  const rel = path.relative(ROOT, OUT)
  if (check) {
    if (current !== text) {
      console.error(
        `[gen:timeline-enrichments] ✗ ${rel} is stale — run npm run gen:timeline-enrichments`
      )
      process.exit(1)
    }
    console.log(
      `[gen:timeline-enrichments] OK — ${rel} current (${n} files, ${Object.keys(merged).length} entries)`
    )
    return
  }
  if (current !== text) fs.writeFileSync(OUT, text)
  console.log(
    `[gen:timeline-enrichments] wrote ${rel} (${n} files, ${Object.keys(merged).length} entries, ${(text.length / 1e6).toFixed(2)} MB)`
  )
}

main()
