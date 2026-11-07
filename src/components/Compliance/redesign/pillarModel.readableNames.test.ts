// SPDX-License-Identifier: AGPL-3.0-only
//
// The "Related & overlapping" list and the traceability chain name the far end
// of each cross-walk relationship. The cross-walk stores some of those records
// as their id (`NIST-SP800-208`); the side panel shows the record's name.
import { describe, expect, it } from 'vitest'
import { complianceFrameworks } from '@/data/complianceData'
import { findLibraryItemByRef } from '@/data/libraryData'
import { buildDrawerDetail, readableEndpointName, type PillarId } from './pillarModel'

const PILLARS: PillarId[] = ['standardize', 'certify', 'comply']
const bareId = (s: string) => !/\s/.test(s) && /[-_]/.test(s)

describe('readableEndpointName', () => {
  it('shows the registry name for a record the cross-walk stores by id', () => {
    const name = readableEndpointName('guidance:nist-sp800-208', 'NIST-SP800-208')
    expect(name).not.toBe('NIST-SP800-208')
    expect(bareId(name)).toBe(false)
  })

  it('looks up the library title when the registry itself holds only the id', () => {
    const name = readableEndpointName('standard:cccs-itsap40018', 'CCCS-ITSAP40018')
    expect(name).not.toBe('CCCS-ITSAP40018')
    expect(name).toMatch(/\s/)
  })

  it('leaves text that already reads as a name exactly as stored', () => {
    // The registry row behind this id is a different record, so using it would change what the edge says.
    expect(readableEndpointName('guidance:cnssp-11', 'CNSSP 15')).toBe('CNSSP 15')
    expect(readableEndpointName('standard:fips-203', 'FIPS 203')).toBe('FIPS 203')
  })

  it('falls back to the stored id when nothing better is known', () => {
    expect(readableEndpointName('', 'NO-SUCH-RECORD-ID')).toBe('NO-SUCH-RECORD-ID')
    expect(readableEndpointName('standard:not-in-registry', 'NO-SUCH-RECORD-ID')).toBe(
      'NO-SUCH-RECORD-ID'
    )
  })
})

describe('buildDrawerDetail names the related records', () => {
  it('gives every related item a name to show, and keeps the stored text as the link target', () => {
    let items = 0
    let idsReplaced = 0
    for (const row of complianceFrameworks) {
      for (const pillar of PILLARS) {
        const d = buildDrawerDetail(row, pillar)
        for (const c of d.crosswalk) {
          items += 1
          expect(c.label.length, `${row.id}: empty label for ${c.name}`).toBeGreaterThan(0)
          expect(c.name.length).toBeGreaterThan(0)
          if (bareId(c.name) && c.label !== c.name) idsReplaced += 1
        }
        for (const node of d.chain) {
          if (node.label !== undefined) expect(node.label.length).toBeGreaterThan(0)
        }
      }
    }
    // The shipped cross-walk has records stored by id; if none is replaced this proves nothing.
    expect(items).toBeGreaterThan(50)
    expect(idsReplaced).toBeGreaterThan(10)
  })

  it('shows no record id in the list when that record has a different name on file', () => {
    for (const row of complianceFrameworks) {
      for (const pillar of PILLARS) {
        const d = buildDrawerDetail(row, pillar)
        const shown = [
          ...d.crosswalk.map((c) => c.label),
          ...d.chain.flatMap((n) => (n.label === undefined ? [] : [n.label])),
        ]
        for (const text of shown.filter(bareId)) {
          // "NSM-10" and "liboqs-v0.15.0" are hyphenated but are the tracked record's own label.
          if (complianceFrameworks.some((f) => f.label === text)) continue
          expect(
            findLibraryItemByRef(text)?.documentTitle,
            `${row.id}/${pillar}: "${text}" is a library id with a title`
          ).toBeUndefined()
        }
      }
    }
  })
})
