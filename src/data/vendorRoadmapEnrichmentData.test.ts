// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { parseFileDate, pickEnrichmentForRoadmap } from './vendorRoadmapEnrichmentData'
import type { VendorRoadmapEnrichment } from '@/types/MigrateTypes'

function makeEnrichment(overrides: Partial<VendorRoadmapEnrichment>): VendorRoadmapEnrichment {
  return {
    vendorId: 'VND-057',
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

describe('parseFileDate', () => {
  // Regression: migrate-process remediation Phase 5 (U9) — sorting these
  // filenames as plain strings puts a 2027 file BEFORE a 2026 file
  // ("01152027" < "12312026" lexicographically), so a later-dated
  // enrichment file would silently lose to an earlier one when merged.
  it('a later year sorts after an earlier year, unlike plain string sort', () => {
    const early = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_12312026.md')
    const late = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_01152027.md')
    expect(late.date).toBeGreaterThan(early.date)
    // Sanity: confirm this is exactly the case plain string sort gets wrong.
    expect(
      'vendor_roadmap_enrichments_01152027.md' < 'vendor_roadmap_enrichments_12312026.md'
    ).toBe(true)
  })

  it('same-day files are ordered by _rN revision', () => {
    const base = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_07142026.md')
    const rev = parseFileDate('./doc-enrichments/vendor_roadmap_enrichments_07142026_r2.md')
    expect(rev.rev).toBeGreaterThan(base.rev)
    expect(rev.date).toBe(base.date)
  })

  it('an unparseable filename sorts first (date/rev both 0)', () => {
    expect(parseFileDate('./doc-enrichments/nonsense.md')).toEqual({ date: 0, rev: 0 })
  })
})

describe('pickEnrichmentForRoadmap', () => {
  // The Cloudflare case this whole change exists for: one vendor, two
  // concurrently-active roadmap rows (a general roadmap and a separate,
  // more specific announcement), each with its own extracted enrichment.
  const general = makeEnrichment({
    roadmapUrl: 'https://blog.cloudflare.com/pq-2025/',
    targetMigrationDates: '2029 full post-quantum security',
  })
  const dnssec = makeEnrichment({
    roadmapUrl: 'https://blog.cloudflare.com/post-quantum-dnssec-1111/',
    targetMigrationDates: 'ML-DSA-44 validation live 2026-09-10',
  })

  it('returns undefined with no candidates', () => {
    expect(pickEnrichmentForRoadmap(undefined, 'https://example.com')).toBeUndefined()
    expect(pickEnrichmentForRoadmap([], 'https://example.com')).toBeUndefined()
  })

  it('matches the exact roadmapUrl among several candidates', () => {
    expect(pickEnrichmentForRoadmap([general, dnssec], dnssec.roadmapUrl)).toBe(dnssec)
    expect(pickEnrichmentForRoadmap([general, dnssec], general.roadmapUrl)).toBe(general)
  })

  it("never returns the wrong row's enrichment when the url does not match either", () => {
    // Regression guard: falling back to "just pick one" with 2+ candidates
    // and no exact match would silently attribute one announcement's
    // enrichment (e.g. DNSSEC-specific migration dates) to the OTHER
    // announcement's card.
    expect(
      pickEnrichmentForRoadmap([general, dnssec], 'https://example.com/unrelated')
    ).toBeUndefined()
  })

  it('falls back to the single candidate when there is exactly one, url unset', () => {
    expect(pickEnrichmentForRoadmap([general], undefined)).toBe(general)
  })

  it('falls back to the single candidate when there is exactly one, url does not match (legacy content)', () => {
    // Covers enrichment sections written before roadmapUrl was recorded —
    // roadmapUrl on the stored record is '' but the row now has a real url.
    const legacy = makeEnrichment({ roadmapUrl: '' })
    expect(pickEnrichmentForRoadmap([legacy], 'https://example.com/now-known')).toBe(legacy)
  })
})
