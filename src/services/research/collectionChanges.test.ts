// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  buildLibraryIndex,
  collectionChanges,
  entryChanges,
  indexLookup,
  stateChanges,
  type IndexableRecord,
} from './collectionChanges'
import { collectionFromRecords, markSeen, type RecordStateSource } from './libraryCollection'

const NOW = new Date('2026-10-16T10:00:00.000Z')

// Fixture rows as they were when the user saved them.
const savedRows: RecordStateSource[] = [
  {
    referenceId: 'draft-ietf-tls-mlkem',
    documentTitle: 'ML-KEM for TLS 1.3',
    downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem-04',
    lifecycleLabel: 'Draft',
    lastVerified: '2026-09-01',
  },
  {
    referenceId: 'FIPS 203',
    documentTitle: 'ML-KEM',
    lastUpdateDate: '2024-08-13',
    lifecycleLabel: 'Released',
  },
  {
    referenceId: 'SP 800-90B',
    documentTitle: 'Entropy sources',
    lastUpdateDate: '2018-01-10',
    lifecycleLabel: 'Released',
  },
  { referenceId: 'OLD-DRAFT', documentTitle: 'Old draft', lifecycleLabel: 'Draft' },
  { referenceId: 'GONE-1', documentTitle: 'Gone', lifecycleLabel: 'Misc' },
  {
    referenceId: 'NIST-IR-OLD',
    documentTitle: 'Renamed report',
    lastUpdateDate: '2024-11-12',
    lifecycleLabel: 'Draft',
  },
  {
    referenceId: 'RFC 9999',
    documentTitle: 'Unchanged',
    lastUpdateDate: '2025-01-01',
    lifecycleLabel: 'Released',
  },
]

// The Library after a release: a new draft, a lifecycle change, a new
// successor, a newer verification, a deprecation, a removal and a rename.
const currentRows: IndexableRecord[] = [
  {
    referenceId: 'draft-ietf-tls-mlkem',
    documentTitle: 'ML-KEM for TLS 1.3',
    downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-tls-mlkem-05',
    lifecycleLabel: 'Draft',
    lastVerified: '2026-10-10',
  },
  {
    referenceId: 'FIPS 203',
    documentTitle: 'ML-KEM',
    lastUpdateDate: '2024-08-13',
    lifecycleLabel: 'Historical',
    supersededByRefs: ['FIPS 203-1'],
    children: [
      {
        referenceId: 'SP 800-90B',
        documentTitle: 'Entropy sources',
        lastUpdateDate: '2018-01-10',
        lifecycleLabel: 'Released',
      },
    ],
  },
  { referenceId: 'FIPS 203-1', documentTitle: 'ML-KEM rev 1', lifecycleLabel: 'Draft' },
  {
    referenceId: 'NEW-DRAFT',
    documentTitle: 'New draft',
    lifecycleLabel: 'Draft',
    priorRevisions: [
      {
        referenceId: 'OLD-DRAFT',
        supersededBy: 'NEW-DRAFT',
        deprecatedAt: '2026-10-01',
        deprecatedReason: 'replaced by -02',
      },
    ],
  },
  {
    referenceId: 'NIST IR NEW',
    documentTitle: 'Renamed report',
    lastUpdateDate: '2024-11-12',
    lifecycleLabel: 'Draft',
  },
  {
    referenceId: 'RFC 9999',
    documentTitle: 'Unchanged',
    lastUpdateDate: '2025-01-01',
    lifecycleLabel: 'Released',
  },
]

const index = buildLibraryIndex(currentRows, { 'NIST-IR-OLD': 'NIST IR NEW' })
const collection = collectionFromRecords('KEM sources', savedRows, NOW)
const changed = () => collectionChanges([{ moduleId: 'library-collection:1', collection }], index)

const kinds = (id: string) =>
  changed()
    .find((c) => c.referenceId === id)
    ?.changes.map((c) => c.kind)

describe('changed since you saved', () => {
  it('indexes child rows and the deprecated revisions kept on a survivor', () => {
    expect(index.active.has('SP 800-90B')).toBe(true)
    expect(index.retired.get('OLD-DRAFT')).toEqual({
      supersededBy: 'NEW-DRAFT',
      deprecatedAt: '2026-10-01',
      reason: 'replaced by -02',
    })
  })

  it('lists a new draft revision and a newer last-verified date', () => {
    const c = changed().find((x) => x.referenceId === 'draft-ietf-tls-mlkem')
    expect(c?.changes.map((x) => x.text)).toEqual([
      'New revision: draft -04 → draft -05',
      'Re-verified: 2026-09-01 → 2026-10-10',
    ])
    expect(c?.currentId).toBe('draft-ietf-tls-mlkem')
  })

  it('lists a lifecycle change and a new successor', () => {
    expect(kinds('FIPS 203')).toEqual(['lifecycle', 'superseded'])
    expect(changed().find((x) => x.referenceId === 'FIPS 203')?.changes[1].text).toBe(
      'Newly superseded by FIPS 203-1'
    )
  })

  it('lists a deprecated record with its successor to open', () => {
    const c = changed().find((x) => x.referenceId === 'OLD-DRAFT')
    expect(c?.changes[0].text).toBe(
      'Deprecated on 2026-10-01; replaced by NEW-DRAFT (replaced by -02)'
    )
    expect(c?.currentId).toBe('NEW-DRAFT')
  })

  it('lists a removed record with nothing to open', () => {
    const c = changed().find((x) => x.referenceId === 'GONE-1')
    expect(c?.changes.map((x) => x.kind)).toEqual(['removed'])
    expect(c?.currentId).toBeNull()
  })

  it('follows a rename and compares against the renamed row', () => {
    expect(kinds('NIST-IR-OLD')).toEqual(['renamed'])
    expect(changed().find((x) => x.referenceId === 'NIST-IR-OLD')?.currentId).toBe('NIST IR NEW')
  })

  it('leaves unchanged records out', () => {
    expect(kinds('RFC 9999')).toBeUndefined()
    expect(kinds('SP 800-90B')).toBeUndefined()
    expect(changed()).toHaveLength(5)
  })

  it('first verification and an older verification date', () => {
    const base = { title: 't', revision: 'r', lifecycle: 'Draft', supersededBy: [] }
    expect(
      stateChanges({ ...base, lastVerified: '' }, { ...base, lastVerified: '2026-01-01' })[0].text
    ).toBe('Verified for the first time on 2026-01-01')
    expect(
      stateChanges({ ...base, lastVerified: '2026-02-01' }, { ...base, lastVerified: '2026-01-01' })
    ).toEqual([])
  })

  it('mark as seen clears every change, renames take the new id', () => {
    const all = changed().map((c) => c.referenceId)
    const seen = markSeen(collection, all, indexLookup(index), NOW)
    expect(collectionChanges([{ moduleId: 'm', collection: seen }], index)).toEqual([])
    expect(seen.entries.map((e) => e.referenceId)).toContain('NIST IR NEW')
    const gone = seen.entries.find((e) => e.referenceId === 'GONE-1')
    expect(gone?.goneSeenAt).toBe(NOW.toISOString())
  })

  it('a removed record seen earlier comes back only through another change', () => {
    const entry = { ...collection.entries[4], goneSeenAt: NOW.toISOString() }
    expect(entryChanges(entry, index)).toEqual([])
  })
})
