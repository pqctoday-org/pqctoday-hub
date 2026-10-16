// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { join } from 'node:path'
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

  it('applies to production builds only', () => {
    expect(newestEnrichmentOnlyPlugin(dir).apply).toBe('build')
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
  it('library and threats repeat every earlier entry, so only the newest ships (otherwise ~90 MB returns to the bundle)', () => {
    const decisions = decidePrune(join(process.cwd(), 'src', 'data', 'doc-enrichments'))
    expect(decisions.map((d) => d.family)).toEqual([...NEWEST_ONLY_FAMILIES])
    for (const d of decisions) {
      expect(d.keptWholeBecause, d.family).toBeNull()
      expect(d.pruned.length, d.family).toBe(d.files - 1)
    }
  })
})
