// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  deriveVendorRoadmapDisplay,
  getGaStatusInfo,
  getScopeChipInfo,
  cleanHybridModeText,
} from './vendorRoadmapDisplay'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

function roadmap(overrides: Partial<VendorRoadmap> = {}): VendorRoadmap {
  return {
    vendorId: 'v1',
    vendorName: 'Acme Corp',
    roadmapUrl: '',
    roadmapTitle: '',
    roadmapType: '',
    publishDate: '',
    lastVerifiedDate: '',
    coverageNotes: '',
    compositeId: 'v1|',
    ...overrides,
  }
}

function enrichment(overrides: Partial<VendorRoadmapEnrichment> = {}): VendorRoadmapEnrichment {
  return {
    vendorId: 'v1',
    roadmapUrl: '',
    roadmapScope: '',
    pqcAlgorithms: [],
    targetMigrationDates: '',
    productsCovered: '',
    complianceFrameworks: [],
    hybridModeSupport: '',
    currentGaStatus: '',
    customerActionRequired: '',
    keyQuotes: [],
    extractionQuality: 'HIGH',
    ...overrides,
  }
}

describe('getGaStatusInfo', () => {
  it('recognizes ga/preview/beta/planned prefixes case-insensitively', () => {
    expect(getGaStatusInfo('GA since 2026')).toEqual({ kind: 'ga', label: 'GA' })
    expect(getGaStatusInfo('preview')).toEqual({ kind: 'preview', label: 'Preview' })
    expect(getGaStatusInfo('Beta program')).toEqual({ kind: 'beta', label: 'Beta' })
    expect(getGaStatusInfo('Planned Q4')).toEqual({ kind: 'planned', label: 'Planned' })
  })

  it('returns null for an unrecognized status', () => {
    expect(getGaStatusInfo('Unknown')).toBeNull()
    expect(getGaStatusInfo('')).toBeNull()
  })

  // A vendor sentence can report different states for different capabilities.
  // Windows: the algorithms and ADCS certificates are GA, while hybrid TLS key
  // exchange and composite algorithms are still Preview.
  const WINDOWS_MIXED =
    'GA (PQC algorithms on Windows 11/Server 2025; ML-DSA certificates in ADCS); Preview (TLS hybrid key exchange; composite algorithms in APIs)'

  it('reports both states for a status that is GA for some capabilities and Preview for others', () => {
    const info = getGaStatusInfo(WINDOWS_MIXED)
    expect(info?.label).toBe('GA + Preview')
    expect(info?.mixedKinds).toEqual(['ga', 'preview'])
    // Never reduced to its first word, and never coloured as if it were all GA.
    expect(info?.label).not.toBe('GA')
    expect(info?.kind).not.toBe('ga')
  })

  it('reports both states when the second is a trailing qualifier', () => {
    const info = getGaStatusInfo(
      'GA (General Availability), with CloudHSM ML-DSA support in preview.'
    )
    expect(info?.label).toBe('GA + Preview')
    expect(info?.mixedKinds).toEqual(['ga', 'preview'])
  })

  it('treats a pre-GA early-availability segment as not generally available', () => {
    const info = getGaStatusInfo('GA (R82 QSKE); Early Availability (R82.10 TLS Inspection)')
    expect(info?.mixedKinds).toEqual(['ga', 'preview'])
  })

  it('lists the states in the order the vendor gives them', () => {
    expect(getGaStatusInfo('Preview (hybrid TLS); GA (ML-DSA certificates)')?.label).toBe(
      'Preview + GA'
    )
  })

  it('a single-state status stays a single state, whatever its detail says', () => {
    // Words inside parentheses or quotations describe the status; they are not another status.
    expect(getGaStatusInfo('Planned (JDK 27 GA in September 2026; backports scheduled)')).toEqual({
      kind: 'planned',
      label: 'Planned',
    })
    expect(getGaStatusInfo('GA (previously in preview until 2025)')).toEqual({
      kind: 'ga',
      label: 'GA',
    })
    expect(getGaStatusInfo('GA; "available to everyone, no longer in preview"')).toEqual({
      kind: 'ga',
      label: 'GA',
    })
  })
})

describe('getScopeChipInfo', () => {
  it('recognizes portfolio/multi/single/algorithm prefixes', () => {
    expect(getScopeChipInfo('Portfolio-wide')).toEqual({
      kind: 'portfolio',
      label: 'Portfolio strategy',
    })
    expect(getScopeChipInfo('Multi-product suite')).toEqual({
      kind: 'multi',
      label: 'Multi-product',
    })
    expect(getScopeChipInfo('Single product')).toEqual({ kind: 'single', label: 'Single product' })
    expect(getScopeChipInfo('Algorithm-level only')).toEqual({
      kind: 'standard',
      label: 'Standard ref',
    })
  })

  it('returns null for undefined, "None detected", or unrecognized text', () => {
    expect(getScopeChipInfo(undefined)).toBeNull()
    expect(getScopeChipInfo('None detected')).toBeNull()
    expect(getScopeChipInfo('Something else entirely')).toBeNull()
  })
})

describe('cleanHybridModeText', () => {
  it('strips a leading Yes/No/Partial qualifier and punctuation', () => {
    expect(cleanHybridModeText('Yes; classical+PQC dual-stack')).toBe('classical+PQC dual-stack')
    expect(cleanHybridModeText('Partial, opt-in only')).toBe('opt-in only')
    expect(cleanHybridModeText('No qualifier here')).toBe('qualifier here')
  })
})

describe('deriveVendorRoadmapDisplay', () => {
  it('returns null when both roadmap and enrichment are undefined', () => {
    expect(deriveVendorRoadmapDisplay(undefined, undefined)).toBeNull()
  })

  it('prefers lastVerifiedDate over publishDate for the date line', () => {
    const d = deriveVendorRoadmapDisplay(
      roadmap({ lastVerifiedDate: '2026-08-01', publishDate: '2026-01-01' }),
      undefined
    )
    expect(d?.dateLine).toEqual({ label: 'verified', date: '2026-08-01' })
  })

  it('falls back to publishDate when lastVerifiedDate is absent', () => {
    const d = deriveVendorRoadmapDisplay(roadmap({ publishDate: '2026-01-01' }), undefined)
    expect(d?.dateLine).toEqual({ label: 'published', date: '2026-01-01' })
  })

  it('filters "None detected" migration dates to null, passes real ones through', () => {
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ targetMigrationDates: 'None detected' }))
        ?.migrationDates
    ).toBeNull()
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ targetMigrationDates: 'Q2 2027' }))
        ?.migrationDates
    ).toBe('Q2 2027')
  })

  it('filters "None detected" and "None..."-prefixed hybrid mode text to null, cleans real ones', () => {
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ hybridModeSupport: 'None detected' }))
        ?.hybridModeText
    ).toBeNull()
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ hybridModeSupport: 'None supported' }))
        ?.hybridModeText
    ).toBeNull()
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ hybridModeSupport: 'Yes; dual-stack' }))
        ?.hybridModeText
    ).toBe('dual-stack')
  })

  it('returns only the first key quote', () => {
    const d = deriveVendorRoadmapDisplay(
      undefined,
      enrichment({ keyQuotes: ['First quote', 'Second quote'] })
    )
    expect(d?.firstQuote).toBe('First quote')
  })

  it('isEmpty is true only when there is no URL and no enrichment at all', () => {
    expect(deriveVendorRoadmapDisplay(roadmap({ roadmapUrl: '' }), undefined)?.isEmpty).toBe(true)
    expect(
      deriveVendorRoadmapDisplay(roadmap({ roadmapUrl: 'https://example.com' }), undefined)?.isEmpty
    ).toBe(false)
    expect(deriveVendorRoadmapDisplay(undefined, enrichment())?.isEmpty).toBe(false)
  })

  it('keeps the product-specific status beside a mixed GA and Preview badge', () => {
    const status =
      'GA (PQC algorithms on Windows 11/Server 2025; ML-DSA certificates in ADCS); Preview (TLS hybrid key exchange; composite algorithms in APIs)'
    const d = deriveVendorRoadmapDisplay(undefined, enrichment({ currentGaStatus: status }))
    expect(d?.gaStatus?.label).toBe('GA + Preview')
    // The sentence that says WHICH capabilities are GA and which are Preview
    // is carried through whole, not cut to its first word.
    expect(d?.gaStatusDetail).toBe(status)
  })

  it('carries a single-state status scope through, and nothing extra for a bare badge', () => {
    expect(
      deriveVendorRoadmapDisplay(
        undefined,
        enrichment({
          currentGaStatus: 'GA (Post-quantum encryption enabled for all websites in 2022)',
        })
      )?.gaStatusDetail
    ).toBe('GA (Post-quantum encryption enabled for all websites in 2022)')
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ currentGaStatus: 'GA' }))?.gaStatusDetail
    ).toBeNull()
    expect(
      deriveVendorRoadmapDisplay(undefined, enrichment({ currentGaStatus: 'No PQC' }))
        ?.gaStatusDetail
    ).toBeNull()
    expect(deriveVendorRoadmapDisplay(roadmap(), undefined)?.gaStatusDetail).toBeNull()
  })

  it('defaults the title to "Vendor PQC Roadmap" when roadmapTitle is empty', () => {
    expect(deriveVendorRoadmapDisplay(roadmap({ roadmapTitle: '' }), undefined)?.title).toBe(
      'Vendor PQC Roadmap'
    )
    expect(
      deriveVendorRoadmapDisplay(roadmap({ roadmapTitle: 'Acme 2027 Migration' }), undefined)?.title
    ).toBe('Acme 2027 Migration')
  })
})
