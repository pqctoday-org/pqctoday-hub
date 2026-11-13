// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { libraryEnrichments } from './libraryEnrichmentData'
import { catalogEnrichments } from './catalogEnrichmentData'
import { threatEnrichmentData } from './threatEnrichmentData'
import { getTimelineEnrichment } from './timelineEnrichmentData'

describe('balanced names reach all four existing enrichment consumers', () => {
  it('keeps the library symmetric-parameter group as one item', () => {
    expect(
      libraryEnrichments['3GPP-Post-Quantum-Cryptography-SA3-Overview'].securityLevels
    ).toContain('256-bit symmetric algorithms (256-NEA4/5/6, 256-NIA4/5/6, 256-NCA4/5/6)')
  })
  it('keeps the catalogue phase list inside its named approach', () => {
    expect(catalogEnrichments['Akamai Connected Cloud'].hybridApproaches).toContain(
      'phased approach (Akamai-to-origin, Client-to-Akamai, Akamai-to-Akamai)'
    )
  })
  it('retains the threat record’s complete security-level acronyms', () => {
    expect(threatEnrichmentData['ENERGY-004'].securityLevels).toContain(
      'Security Levels 1-4 (SL-C, SL-T, SL-A)'
    )
  })
  it('uses the regenerated timeline value through the real event lookup', () => {
    const entry = getTimelineEnrichment(
      'australia-asd-ism-december-2024-update',
      'Australia',
      'ASD',
      'ISM December 2024 Update'
    )
    expect(entry?.securityLevels).toContain(
      'Effective security strength targets: 112 bits (non-classified, OFFICIAL: Sensitive, PROTECTED)'
    )
    expect(
      getTimelineEnrichment(
        'australia-asd-ism-december-2024-update',
        'changed label',
        'changed label',
        'changed label'
      )?.securityLevels
    ).toEqual(entry?.securityLevels)
    expect(getTimelineEnrichment('unknown-event', 'unknown', 'unknown', 'unknown')).toBeUndefined()
  })
})
