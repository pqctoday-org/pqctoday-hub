// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Production and dev builds omit enrichment generations superseded by a later
 * complete snapshot. Incremental files after that snapshot remain in order.
 *
 * A snapshot is checked, not assumed: its keys must include every key from all
 * earlier dated generations. If no later snapshot covers them, the family is
 * kept whole. Vitest reads every source file to verify the full merge.
 */
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import type { Plugin } from 'vite'

/** Families with complete snapshots and, optionally, later incremental corrections. */
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
  /** Older file names covered by the retained snapshot; later incremental files stay. */
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
    const earlierKeys = new Set<string>()
    let snapshotIndex = 0
    let missingFromNewest: { file: string; key: string } | null = null
    const firstSource = new Map<string, string>()
    for (let i = 0; i < files.length; i++) {
      const keys = entryKeys(read(join(dir, files[i])))
      const missing = [...earlierKeys].find((key) => !keys.has(key))
      if (missing === undefined) snapshotIndex = i
      if (i === files.length - 1 && missing !== undefined) {
        missingFromNewest = { file: firstSource.get(missing)!, key: missing }
      }
      for (const key of keys) {
        earlierKeys.add(key)
        if (!firstSource.has(key)) firstSource.set(key, files[i])
      }
    }
    return {
      family,
      files: files.length,
      pruned: files.slice(0, snapshotIndex),
      keptWholeBecause:
        snapshotIndex === 0 && missingFromNewest
          ? `${missingFromNewest.file} has entry "${missingFromNewest.key}" that ${files[files.length - 1]} lacks`
          : null,
    }
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
          : `bundling ${d.files - d.pruned.length} of ${d.files} files`
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
