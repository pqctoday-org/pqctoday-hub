// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Production builds ship only the newest dated file of an enrichment family
 * whose newest file already holds every entry of the older ones.
 *
 * `src/data/doc-enrichments/library_doc_enrichments_MMDDYYYY.md` (and the threats
 * family) get a new dated file for every change, each one repeating all earlier
 * entries. The loaders glob every file, so the build used to inline all of them
 * (about 90 MB of the 98 MB `trustScoreData` chunk) although `mergeEnrichmentFiles`
 * lets the newest file win for every key. Only the newest is needed.
 *
 * The rule is checked, not assumed: a family is pruned only while the newest
 * file's `## ` entries include every entry of every older file. If a future file
 * carries fewer entries (an incremental file), that family is left whole and the
 * build prints why. Vitest keeps every file, so the tests that read the full set
 * are unchanged.
 *
 * The dev server prunes too. It served all 38 files (~170 MB of raw text) to every
 * page that reaches the enrichment loaders, so a fresh browser took 50 s or more
 * to boot /compliance or /threats and the local-tier E2E specs timed out on it.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/** Families verified to repeat every earlier entry in each newer file (16 Oct 2026). */
export const NEWEST_ONLY_FAMILIES = ['library_doc_enrichments', 'threats_doc_enrichments'] as const

/** `<family>_MMDDYYYY[_rN].md` file names, oldest first (date, then revision, as numbers). */
export function datedFamilyFiles(names: string[], family: string): string[] {
  const rx = new RegExp(`^${family}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.md$`)
  return names
    .map((name) => {
      const m = name.match(rx)
      return m ? { name, date: Number(m[3] + m[1] + m[2]), rev: Number(m[4] ?? 0) } : null
    })
    .filter((x): x is { name: string; date: number; rev: number } => x !== null)
    .sort((a, b) => a.date - b.date || a.rev - b.rev)
    .map((x) => x.name)
}

/** The entry keys of an enrichment file: its `## ` headings, as the loader reads them. */
export function entryKeys(markdown: string): Set<string> {
  const keys = new Set<string>()
  for (const m of markdown.matchAll(/^## (.+)$/gm)) {
    const key = m[1].trim()
    if (key && key !== '---') keys.add(key)
  }
  return keys
}

export interface PruneDecision {
  family: string
  files: number
  /** File names left out of the bundle (all but the newest), empty when the family is kept whole. */
  pruned: string[]
  /** Why the family is kept whole; null when it is pruned or has a single file. */
  keptWholeBecause: string | null
}

/** Decide, per family, which files can be left out of the bundle. */
export function decidePrune(
  dir: string,
  families: readonly string[] = NEWEST_ONLY_FAMILIES,
  read: (path: string) => string = (p) => readFileSync(p, 'utf8'),
  list: (dir: string) => string[] = (d) => readdirSync(d)
): PruneDecision[] {
  const names = list(dir)
  return families.map((family) => {
    const files = datedFamilyFiles(names, family)
    if (files.length <= 1) {
      return { family, files: files.length, pruned: [], keptWholeBecause: null }
    }
    const newest = files[files.length - 1]
    const newestKeys = entryKeys(read(join(dir, newest)))
    for (const older of files.slice(0, -1)) {
      for (const key of entryKeys(read(join(dir, older)))) {
        if (!newestKeys.has(key)) {
          return {
            family,
            files: files.length,
            pruned: [],
            keptWholeBecause: `${older} has entry "${key}" that ${newest} lacks`,
          }
        }
      }
    }
    return { family, files: files.length, pruned: files.slice(0, -1), keptWholeBecause: null }
  })
}

/** Vite plugin: in a production build, the pruned files import as an empty string. */
export function newestEnrichmentOnlyPlugin(
  enrichmentsDir: string,
  decide: (dir: string) => PruneDecision[] = (dir) => decidePrune(dir)
): Plugin {
  let pruned = new Set<string>()
  return {
    name: 'newest-enrichment-only',
    // Build and dev serve; Vitest reads the full set.
    apply: (_config, env) => env.command === 'build' || !process.env.VITEST,
    enforce: 'pre',
    buildStart() {
      const decisions = decide(enrichmentsDir)
      pruned = new Set(decisions.flatMap((d) => d.pruned.map((name) => join(enrichmentsDir, name))))
      for (const d of decisions) {
        const note = d.keptWholeBecause
          ? `kept whole: ${d.keptWholeBecause}`
          : `bundling 1 of ${d.files} files`
        console.log(`[newest-enrichment-only] ${d.family}: ${note}`)
      }
    },
    load(id) {
      const [file, query] = id.split('?')
      if (query === 'raw' && pruned.has(file)) return 'export default ""'
      return null
    },
  }
}
