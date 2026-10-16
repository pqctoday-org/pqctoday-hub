// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ExecutiveDocument } from '@/services/storage/types'
import {
  addToCollection,
  collectionFromRecords,
  collectionMarkdown,
  collectionSaveRequest,
  emptyCollection,
  LIBRARY_COLLECTION_SCHEMA,
  markSeen,
  readCollection,
  recordRevision,
  recordState,
  recordsForBookmarks,
  removeFromCollection,
  savedCollections,
  type RecordStateSource,
} from './libraryCollection'

const NOW = new Date('2026-10-16T10:00:00.000Z')

const draft: RecordStateSource = {
  referenceId: 'draft-ietf-tls-mlkem-04',
  documentTitle: 'ML-KEM for TLS 1.3',
  downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem/04/',
  lastUpdateDate: '2026-07-01',
  lifecycleLabel: 'Draft',
  lastVerified: '2026-09-01',
}

const fips: RecordStateSource = {
  referenceId: 'FIPS 203',
  documentTitle: 'ML-KEM',
  lastUpdateDate: '2024-08-13',
  lifecycleLabel: 'Released',
  supersededByRefs: [],
}

describe('record state', () => {
  it('reads the draft number, else the last update date', () => {
    expect(recordRevision(draft)).toBe('draft -04')
    expect(recordRevision(fips)).toBe('2024-08-13')
    expect(recordRevision({ referenceId: 'X' })).toBe('not stated')
  })

  it('keeps revision, lifecycle, successor and last verified', () => {
    expect(recordState({ ...fips, supersededByRefs: ['FIPS 203-1'] })).toEqual({
      title: 'ML-KEM',
      revision: '2024-08-13',
      lifecycle: 'Released',
      supersededBy: ['FIPS 203-1'],
      lastVerified: '',
    })
  })
})

describe('collections', () => {
  it('adds a record with its state as saved', () => {
    const c = addToCollection(emptyCollection('KEM drafts'), draft, '  hybrid group  ', NOW)
    expect(c.name).toBe('KEM drafts')
    expect(c.entries).toEqual([
      {
        referenceId: 'draft-ietf-tls-mlkem-04',
        annotation: 'hybrid group',
        addedAt: '2026-10-16T10:00:00.000Z',
        saved: {
          title: 'ML-KEM for TLS 1.3',
          revision: 'draft -04',
          lifecycle: 'Draft',
          supersededBy: [],
          lastVerified: '2026-09-01',
        },
      },
    ])
  })

  it('a re-add edits the annotation and keeps the saved state', () => {
    const c1 = addToCollection(emptyCollection('A'), draft, 'first', NOW)
    const moved = { ...draft, lastUpdateDate: '2026-10-01', lifecycleLabel: 'Released' }
    const c2 = addToCollection(c1, moved, 'second', NOW)
    expect(c2.entries).toHaveLength(1)
    expect(c2.entries[0].annotation).toBe('second')
    expect(c2.entries[0].saved.lifecycle).toBe('Draft')
  })

  it('removes a record', () => {
    const c = collectionFromRecords('A', [draft, fips], NOW)
    expect(removeFromCollection(c, 'FIPS 203').entries.map((e) => e.referenceId)).toEqual([
      'draft-ietf-tls-mlkem-04',
    ])
  })

  it('names an unnamed collection', () => {
    expect(emptyCollection('  ').name).toBe('Untitled collection')
  })

  it('mark as seen moves the saved state on, except for removed records', () => {
    const c = collectionFromRecords('A', [draft, fips], NOW)
    const now = { ...draft, lifecycleLabel: 'Released' }
    const seen = markSeen(
      c,
      ['draft-ietf-tls-mlkem-04', 'FIPS 203'],
      (id) => (id === draft.referenceId ? now : undefined),
      NOW
    )
    expect(seen.entries[0].saved.lifecycle).toBe('Released')
    expect(seen.entries[0].seenAt).toBe(NOW.toISOString())
    expect(seen.entries[1]).toEqual(c.entries[1])
  })

  it('renders a table with the saved state', () => {
    const md = collectionMarkdown(addToCollection(emptyCollection('A'), draft, 'a | b', NOW))
    expect(md).toContain('# A')
    expect(md).toContain(
      '| draft-ietf-tls-mlkem-04 | ML-KEM for TLS 1.3 | a \\| b | draft -04 | Draft | — | 2026-09-01 | 2026-10-16 |'
    )
  })

  it('finds bookmarked records anywhere in the tree, in order', () => {
    const tree = [{ referenceId: 'A', children: [{ referenceId: 'B' }] }, { referenceId: 'C' }]
    expect(recordsForBookmarks(tree, ['B', 'X', 'A'])).toEqual({
      records: [{ referenceId: 'B' }, tree[0]],
      missingIds: ['X'],
    })
  })
})

describe('stored collections', () => {
  const doc = (inputs: unknown, extra: Partial<ExecutiveDocument> = {}): ExecutiveDocument => ({
    id: 'd1',
    moduleId: 'library-collection:1',
    type: 'library-collection',
    title: 't',
    data: '',
    createdAt: 1,
    inputs,
    ...extra,
  })

  it('reads a saved collection and fills missing fields', () => {
    const c = readCollection(
      doc({
        schema: LIBRARY_COLLECTION_SCHEMA,
        name: 'A',
        entries: [{ referenceId: 'FIPS 203' }, { nope: 1 }],
      })
    )
    expect(c?.entries).toEqual([
      {
        referenceId: 'FIPS 203',
        annotation: '',
        addedAt: '',
        saved: {
          title: 'FIPS 203',
          revision: 'not stated',
          lifecycle: '',
          supersededBy: [],
          lastVerified: '',
        },
      },
    ])
  })

  it('rejects other documents', () => {
    expect(readCollection(doc({ name: 'A', entries: [] }))).toBeNull()
    expect(readCollection({ type: 'run-manifest', inputs: {} })).toBeNull()
  })

  it('lists saved collections oldest first', () => {
    const c = collectionFromRecords('A', [fips], NOW)
    const docs = [
      doc(c, { id: 'b', createdAt: 5 }),
      doc(c, { id: 'a', createdAt: 2 }),
      doc({}, { id: 'bad', createdAt: 1 }),
    ]
    expect(savedCollections(docs).map((x) => x.doc.id)).toEqual(['a', 'b'])
  })

  it('save request carries the Markdown and the collection', () => {
    const c = collectionFromRecords('A', [fips], NOW)
    const req = collectionSaveRequest(c, 'library-collection:9', 'edited')
    expect(req).toMatchObject({
      type: 'library-collection',
      moduleId: 'library-collection:9',
      title: 'A',
      inputs: c,
      revisionSummary: 'edited',
    })
    expect(req.data).toContain('| FIPS 203 | ML-KEM |')
  })
})
