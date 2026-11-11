// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { join } from 'node:path'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { mergeEnrichmentFiles } from '../../src/data/enrichmentParse'
import {
  NEWEST_ONLY_FAMILIES,
  datedFamilyFiles,
  decidePrune,
  entryKeys,
  newestEnrichmentOnlyPlugin,
} from './newestEnrichmentOnly'

const doc = (...keys: string[]) => keys.map((k) => `## ${k}\n\n- **Main Topic**: x\n`).join('\n')

function fakeDir(files: Record<string, string>) {
  return {
    list: () => Object.keys(files),
    read: (p: string) => files[p.split('/').pop() as string],
  }
}

describe('datedFamilyFiles', () => {
  it('orders by date then revision as numbers, not as strings', () => {
    const names = [
      'library_doc_enrichments_10162026.md',
      'library_doc_enrichments_01052027.md',
      'library_doc_enrichments_10162026_r10.md',
      'library_doc_enrichments_10162026_r9.md',
      'threats_doc_enrichments_10162026.md',
      'library_doc_enrichments_notes.md',
    ]
    expect(datedFamilyFiles(names, 'library_doc_enrichments')).toEqual([
      'library_doc_enrichments_10162026.md',
      'library_doc_enrichments_10162026_r9.md',
      'library_doc_enrichments_10162026_r10.md',
      'library_doc_enrichments_01052027.md',
    ])
  })
})

describe('entryKeys', () => {
  it('reads the ## headings and skips separators', () => {
    expect([...entryKeys('---\nfoo\n---\n\n## A\n- x\n\n## B \n\n## ---\n')]).toEqual(['A', 'B'])
  })
})

describe('decidePrune', () => {
  const fam = ['library_doc_enrichments']

  it('prunes every file but the newest when the newest repeats all earlier entries', () => {
    const { list, read } = fakeDir({
      'library_doc_enrichments_10142026.md': doc('A', 'B'),
      'library_doc_enrichments_10162026.md': doc('A', 'B', 'C'),
      'library_doc_enrichments_10152026.md': doc('A'),
    })
    const [d] = decidePrune('/d', fam, read, list)
    expect(d.pruned).toEqual([
      'library_doc_enrichments_10142026.md',
      'library_doc_enrichments_10152026.md',
    ])
    expect(d.keptWholeBecause).toBeNull()
  })

  it('keeps the family whole when an older file has an entry the newest lacks', () => {
    const { list, read } = fakeDir({
      'library_doc_enrichments_10142026.md': doc('A', 'OLD-ONLY'),
      'library_doc_enrichments_10162026.md': doc('A', 'C'),
    })
    const [d] = decidePrune('/d', fam, read, list)
    expect(d.pruned).toEqual([])
    expect(d.keptWholeBecause).toContain('OLD-ONLY')
  })

  it('keeps a covering snapshot and all subsequent incremental corrections', () => {
    const files = {
      'library_doc_enrichments_10142026.md': doc('A'),
      'library_doc_enrichments_10152026.md': doc('A', 'B'),
      'library_doc_enrichments_10162026.md': doc('A').replace('x', 'corrected'),
      'library_doc_enrichments_10162026_r2.md': doc('C'),
    }
    const { list, read } = fakeDir(files)
    const [d] = decidePrune('/d', fam, read, list)
    expect(d.pruned).toEqual(['library_doc_enrichments_10142026.md'])
    expect(d.keptWholeBecause).toBeNull()
    const retained = Object.fromEntries(
      Object.entries(files).filter(([n]) => !d.pruned.includes(n))
    )
    expect(mergeEnrichmentFiles(retained)).toEqual(mergeEnrichmentFiles(files))
    expect(mergeEnrichmentFiles(retained).A.mainTopic).toBe('corrected')
  })

  it('does not treat the union of partial files as a covering snapshot', () => {
    const { list, read } = fakeDir({
      'library_doc_enrichments_10142026.md': doc('A', 'B'),
      'library_doc_enrichments_10152026.md': doc('A'),
      'library_doc_enrichments_10162026.md': doc('B'),
    })
    const [d] = decidePrune('/d', fam, read, list)
    expect(d.pruned).toEqual([])
    expect(d.keptWholeBecause).toContain('A')
  })

  it('uses the latest covering snapshot even after an earlier incremental file', () => {
    const { list, read } = fakeDir({
      'library_doc_enrichments_10142026.md': doc('A', 'B'),
      'library_doc_enrichments_10152026.md': doc('A'),
      'library_doc_enrichments_10162026.md': doc('A', 'B', 'C'),
      'library_doc_enrichments_10162026_r2.md': doc('C'),
    })
    const [d] = decidePrune('/d', fam, read, list)
    expect(d.pruned).toEqual([
      'library_doc_enrichments_10142026.md',
      'library_doc_enrichments_10152026.md',
    ])
    expect(d.keptWholeBecause).toBeNull()
  })

  it('leaves an empty family alone', () => {
    const { list, read } = fakeDir({})
    expect(decidePrune('/d', fam, read, list)[0]).toEqual({
      family: fam[0],
      files: 0,
      pruned: [],
      keptWholeBecause: null,
    })
  })

  it('leaves a single-file family alone', () => {
    const { list, read } = fakeDir({ 'library_doc_enrichments_10162026.md': doc('A') })
    const [d] = decidePrune('/d', fam, read, list)
    expect(d).toMatchObject({ files: 1, pruned: [], keptWholeBecause: null })
  })
})

describe('plugin', () => {
  const dir = '/data/doc-enrichments'
  const old = join(dir, 'library_doc_enrichments_10142026.md')
  const newest = join(dir, 'library_doc_enrichments_10162026.md')
  const started = () => {
    const plugin = newestEnrichmentOnlyPlugin(dir, () => [
      {
        family: 'library_doc_enrichments',
        files: 2,
        pruned: ['library_doc_enrichments_10142026.md'],
        keptWholeBecause: null,
      },
    ]) as unknown as { buildStart: () => void; load: (id: string) => string | null }
    plugin.buildStart()
    return plugin
  }

  it('applies to production builds and the dev server, not to Vitest', () => {
    const apply = newestEnrichmentOnlyPlugin(dir).apply as (
      c: object,
      e: { command: 'build' | 'serve'; mode: string }
    ) => boolean
    const build = { command: 'build', mode: 'production' } as const
    const serve = { command: 'serve', mode: 'development' } as const
    expect(apply({}, build)).toBe(true)
    expect(apply({}, serve)).toBe(!process.env.VITEST)
    vi.stubEnv('VITEST', '')
    expect(apply({}, serve)).toBe(true)
    vi.stubEnv('VITEST', 'true')
    expect(apply({}, serve)).toBe(false)
    expect(apply({}, build)).toBe(true)
    vi.unstubAllEnvs()
  })

  it('blanks a pruned file imported as raw text', () => {
    expect(started().load(`${old}?raw`)).toBe('export default ""')
  })

  it('passes the newest file, other queries and other files through', () => {
    const plugin = started()
    expect(plugin.load(`${newest}?raw`)).toBeNull()
    expect(plugin.load(old)).toBeNull()
    expect(plugin.load(`${old}?url`)).toBeNull()
    expect(plugin.load(join(dir, 'catalog_doc_enrichments_10142026.md') + '?raw')).toBeNull()
  })

  it('blanks nothing before the build starts', () => {
    const plugin = newestEnrichmentOnlyPlugin(dir) as unknown as {
      load: (id: string) => string | null
    }
    expect(plugin.load(`${old}?raw`)).toBeNull()
  })
})

describe('the committed enrichment files', () => {
  it('ships only the covering snapshot and later corrections with every merged value unchanged', () => {
    const dir = join(process.cwd(), 'src', 'data', 'doc-enrichments')
    const decisions = decidePrune(dir)
    expect(decisions.map((d) => d.family)).toEqual([...NEWEST_ONLY_FAMILIES])
    for (const d of decisions) {
      expect(d.keptWholeBecause, d.family).toBeNull()
      const files = datedFamilyFiles(readdirSync(dir), d.family)
      const retained = files.filter((name) => !d.pruned.includes(name))
      // Pin pruning and the exact retained snapshot/overlay sequence: bundling
      // superseded history fails, as does silently dropping any correction.
      expect(d.pruned.length, d.family).toBeGreaterThan(0)
      expect(retained, d.family).toEqual(
        d.family === 'library_doc_enrichments'
          ? [
              'library_doc_enrichments_11092026.md',
              'library_doc_enrichments_11112026.md',
              'library_doc_enrichments_11112026_r2.md',
              'library_doc_enrichments_11112026_r3.md',
              'library_doc_enrichments_11112026_r4.md',
            ]
          : [files[files.length - 1]]
      )
      const modules = Object.fromEntries(
        files.map((name) => [name, readFileSync(join(dir, name), 'utf8')])
      )
      const prunedModules = Object.fromEntries(
        Object.entries(modules).filter(([name]) => !d.pruned.includes(name))
      )
      expect(mergeEnrichmentFiles(prunedModules), d.family).toEqual(mergeEnrichmentFiles(modules))
      const fullBytes = files.reduce((n, name) => n + statSync(join(dir, name)).size, 0)
      const retainedBytes = retained.reduce((n, name) => n + statSync(join(dir, name)).size, 0)
      expect(retainedBytes, d.family).toBeLessThan(fullBytes / 2)
    }
  })
})
