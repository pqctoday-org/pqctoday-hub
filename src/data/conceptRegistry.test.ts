// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  conceptRegistry,
  conceptByCanonicalId,
  conceptIdByStoreKey,
  conceptIdForStoreKey,
} from './conceptRegistry'

describe('conceptRegistry', () => {
  it('loads at least 300 registry rows (xwalk has ~393 distinct concepts)', () => {
    expect(conceptRegistry.length).toBeGreaterThanOrEqual(300)
  })

  it('every row has concept_id + display_label + valid source_type', () => {
    const validTypes = new Set([
      'framework',
      'guidance',
      'standard',
      'algorithm',
      'timeline',
      'concept_only',
    ])
    for (const r of conceptRegistry) {
      expect(r.conceptId, `row missing conceptId`).toBeTruthy()
      expect(r.displayLabel, `row ${r.conceptId} missing displayLabel`).toBeTruthy()
      expect(validTypes.has(r.sourceType)).toBe(true)
    }
  })

  it('every concept_id is unique', () => {
    const ids = conceptRegistry.map((r) => r.conceptId)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every concept_id is prefixed by its source_type', () => {
    for (const r of conceptRegistry) {
      expect(
        r.conceptId.startsWith(`${r.sourceType}:`),
        `${r.conceptId} not prefixed by ${r.sourceType}:`
      ).toBe(true)
    }
  })

  it('NIST CSWP 39 resolves as a framework backed by the library', () => {
    const row = conceptByCanonicalId.get('framework:nist-cswp-39')
    expect(row).toBeDefined()
    expect(row?.sourceTable).toBe('library')
    expect(row?.sourceRowId).toBe('NIST CSWP 39')
  })

  it('FIPS 203 resolves as a standard backed by the library', () => {
    const row = conceptByCanonicalId.get('standard:fips-203')
    expect(row).toBeDefined()
    expect(row?.sourceTable).toBe('library')
  })

  it('Five Eyes peers are classified as guidance', () => {
    const peers = ['guidance:au-asd-ism-crypto-2024', 'guidance:ca-tbs-spin-pqc-2025']
    for (const id of peers) {
      const row = conceptByCanonicalId.get(id)
      expect(row, `missing ${id}`).toBeDefined()
      expect(row?.sourceType).toBe('guidance')
    }
  })

  it('non-concept_only rows have a backing source_table + source_row_id', () => {
    for (const r of conceptRegistry) {
      if (r.sourceType === 'concept_only') continue
      expect(r.sourceTable, `${r.conceptId} missing source_table`).toBeTruthy()
      expect(r.sourceRowId, `${r.conceptId} missing source_row_id`).toBeTruthy()
    }
  })

  it('conceptIdByStoreKey reverse lookup resolves a known library row', () => {
    const cid = conceptIdByStoreKey.get('library:NIST CSWP 39')
    expect(cid).toBe('framework:nist-cswp-39')
  })

  it('conceptIdForStoreKey helper resolves the same way', () => {
    expect(conceptIdForStoreKey('library', 'FIPS 203')).toBe('standard:fips-203')
  })
})
