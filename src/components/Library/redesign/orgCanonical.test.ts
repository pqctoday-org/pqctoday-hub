// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ORG_CANONICAL_MAP } from './useLibraryPipeline'
import { libraryData } from '../../../data/libraryData'

/** Canonical orgs reachable in the current data (an item's author maps to it). */
function reachable(canon: string): boolean {
  return libraryData.some((item) =>
    (item.authorsOrOrganization ?? '')
      .split(';')
      .some((token) => ORG_CANONICAL_MAP[token.trim()] === canon)
  )
}

describe('ORG_CANONICAL_MAP (W3)', () => {
  it('collapses known variant spellings to a canonical publisher', () => {
    expect(ORG_CANONICAL_MAP['BSI Germany']).toBe('BSI')
    expect(ORG_CANONICAL_MAP['ISO/IEC JTC 1/SC 27']).toBe('ISO')
    expect(ORG_CANONICAL_MAP['IETF TLS WG']).toBe('IETF')
    expect(ORG_CANONICAL_MAP['ETSI ISG QKD']).toBe('ETSI')
    expect(ORG_CANONICAL_MAP['Cybersecurity and Infrastructure Security Agency']).toBe('CISA')
  })

  it('makes high-frequency publishers individually filterable', () => {
    for (const canon of ['ENISA', 'ISO', 'BSI', 'ASD Australia', 'IETF', 'ETSI', 'GSMA', 'KISA']) {
      expect(reachable(canon), `canonical org "${canon}" matches no document`).toBe(true)
    }
  })

  it('keeps unmapped-publisher documents reachable via an "Other" bucket', () => {
    const hasUnmappedOnly = libraryData.some((item) => {
      const authors = item.authorsOrOrganization ?? ''
      if (!authors.trim()) return false
      return authors.split(';').every((token) => !ORG_CANONICAL_MAP[token.trim()])
    })
    expect(hasUnmappedOnly).toBe(true)
  })
})
