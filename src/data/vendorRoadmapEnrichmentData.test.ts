// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  crossSourceEnrichmentForRoadmap,
  enrichmentByVendorId,
  enrichmentForRoadmap,
  ownEnrichmentForVendor,
  parseFileDate,
  pickCrossSourceEnrichment,
  pickEnrichmentForRoadmap,
} from './vendorRoadmapEnrichmentData'
import { roadmapByVendorId, vendorRoadmaps } from './vendorRoadmapData'
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

  it('a url-less legacy analysis is the answer for a vendor whose only record it is', () => {
    // Sections written before roadmapUrl was recorded carry '' — there is no
    // url on them to contradict the row's.
    const legacy = makeEnrichment({ roadmapUrl: '' })
    expect(pickEnrichmentForRoadmap([legacy], undefined)).toBe(legacy)
    expect(pickEnrichmentForRoadmap([legacy], 'https://example.com/now-known')).toBe(legacy)
  })

  it('a row with no url does not adopt an analysis that was extracted from some specific page', () => {
    // The analysis names its own source page; a row that links to nothing
    // cannot show that it is the same document.
    expect(pickEnrichmentForRoadmap([general], undefined)).toBeUndefined()
    expect(pickEnrichmentForRoadmap([general], '')).toBeUndefined()
  })

  // Same vendor, but the only analysis was extracted from a different page
  // than the one the row now links to. Showing it would attribute one page's
  // algorithms, dates and quotes to another page's card.
  it.each([
    {
      case: 'a company page analysed, the row now links a filing',
      analysed: 'https://vendor.example/company/our-approach',
      row: 'https://vendor.example/investors/annual-report.pdf',
    },
    {
      case: 'a product page analysed, the row now links a blog post',
      analysed: 'https://other.example/solutions/quantum-safe',
      row: 'https://other.example/blog/understanding-the-quantum-risk/',
    },
  ])('does not hand a sole analysis to a row linking to a different document: $case', (c) => {
    const analysis = makeEnrichment({ roadmapUrl: c.analysed, targetMigrationDates: 'Q4 2026' })
    expect(pickEnrichmentForRoadmap([analysis], c.row)).toBeUndefined()
    // The same analysis is still the answer for the page it came from.
    expect(pickEnrichmentForRoadmap([analysis], c.analysed)).toBe(analysis)
  })

  it('does not hand a legacy analysis to a row when the vendor also has an analysis of another page', () => {
    // Two records and no exact match: there is no basis to say which of them,
    // if either, belongs to this row.
    const legacy = makeEnrichment({ roadmapUrl: '', targetMigrationDates: 'old' })
    const specific = makeEnrichment({ roadmapUrl: 'https://vendor.example/a' })
    expect(pickEnrichmentForRoadmap([legacy, specific], 'https://vendor.example/b')).toBeUndefined()
  })
})

describe('enrichmentForRoadmap on the shipped data', () => {
  it('no roadmap card shows an analysis extracted from a different document than its own link', () => {
    for (const row of vendorRoadmaps) {
      const shown = enrichmentForRoadmap(row.vendorId, row.roadmapUrl)
      if (!shown) continue
      const sameDocument = shown.roadmapUrl === row.roadmapUrl
      const legacyWithoutUrl = shown.roadmapUrl === ''
      expect(
        sameDocument || legacyWithoutUrl,
        `${row.vendorId} links ${row.roadmapUrl} but would show an analysis of ${shown.roadmapUrl}`
      ).toBe(true)
    }
  })
})

describe('pickCrossSourceEnrichment', () => {
  // A vendor whose row now links the PDF while the analysis was written from
  // the web page: the row gets no analysis of its own, but the page the
  // analysis came from is real and can be offered, labelled.
  const rowPdf = 'https://vendor.example/whitepaper.pdf'
  const page = 'https://vendor.example/insights/whitepaper.html'
  const fromPage = makeEnrichment({ roadmapUrl: page, sourceTitle: 'The white paper' })

  it('offers the analysis of another page for a row that has none of its own', () => {
    expect(pickCrossSourceEnrichment([fromPage], rowPdf)).toBe(fromPage)
  })

  it('offers nothing for a row that has its own analysis', () => {
    expect(pickCrossSourceEnrichment([fromPage], page)).toBeUndefined()
  })

  it('offers nothing when there is no analysis at all', () => {
    expect(pickCrossSourceEnrichment(undefined, rowPdf)).toBeUndefined()
    expect(pickCrossSourceEnrichment([], rowPdf)).toBeUndefined()
  })

  it('offers nothing for an analysis that records no address, since it has no page to link', () => {
    const legacy = makeEnrichment({ roadmapUrl: '' })
    // Two records and no exact match: the one with an address is offered, the other is not.
    expect(pickCrossSourceEnrichment([legacy, fromPage], 'https://vendor.example/other')).toBe(
      fromPage
    )
    expect(pickCrossSourceEnrichment([legacy], rowPdf)).toBeUndefined()
    expect(pickCrossSourceEnrichment([legacy, legacy], rowPdf)).toBeUndefined()
  })

  it('does not move an analysis that belongs to one of the vendor rows onto another row', () => {
    const rowA = 'https://vendor.example/a'
    const rowB = 'https://vendor.example/b'
    const analysisOfA = makeEnrichment({ roadmapUrl: rowA })
    expect(pickCrossSourceEnrichment([analysisOfA], rowA, [rowA, rowB])).toBeUndefined()
    expect(pickCrossSourceEnrichment([analysisOfA], rowB, [rowA, rowB])).toBeUndefined()
  })

  it('shows the same unattached analysis once for a vendor, on its first row without one', () => {
    const rowA = 'https://vendor.example/a'
    const rowB = 'https://vendor.example/b'
    expect(pickCrossSourceEnrichment([fromPage], rowA, [rowA, rowB])).toBe(fromPage)
    expect(pickCrossSourceEnrichment([fromPage], rowB, [rowA, rowB])).toBeUndefined()
  })

  it('never returns the analysis the row-matching rule would hand the row', () => {
    // The two accessors split the vendor's analyses; they never both answer.
    const own = makeEnrichment({ roadmapUrl: rowPdf })
    expect(pickEnrichmentForRoadmap([own, fromPage], rowPdf)).toBe(own)
    expect(pickCrossSourceEnrichment([own, fromPage], rowPdf)).toBeUndefined()
  })
})

describe('cross-source analysis on the shipped data', () => {
  it('a row gets at most one of its own analysis and a cross-source one, and the latter has its own address', () => {
    for (const row of vendorRoadmaps) {
      const own = enrichmentForRoadmap(row.vendorId, row.roadmapUrl)
      const other = crossSourceEnrichmentForRoadmap(row.vendorId, row.roadmapUrl)
      if (!other) continue
      const rowUrls = (roadmapByVendorId.get(row.vendorId) ?? []).map((r) => r.roadmapUrl)
      expect(own, `${row.vendorId} shows its own analysis and a cross-source one`).toBeUndefined()
      expect(other.roadmapUrl, `${row.vendorId} cross-source analysis has no address`).not.toBe('')
      expect(
        rowUrls,
        `${row.vendorId} cross-source analysis belongs to one of its rows`
      ).not.toContain(other.roadmapUrl)
    }
  })

  it('every vendor row whose analysis was written from another page is offered that page', () => {
    for (const [vendorId, rows] of roadmapByVendorId) {
      const analyses = enrichmentByVendorId.get(vendorId) ?? []
      const rowUrls = rows.map((r) => r.roadmapUrl)
      const unattached = analyses.filter(
        (a) => a.roadmapUrl !== '' && !rowUrls.includes(a.roadmapUrl)
      )
      const rowsWithoutOwn = rows.filter((r) => !enrichmentForRoadmap(vendorId, r.roadmapUrl))
      const offered = rows.filter((r) => crossSourceEnrichmentForRoadmap(vendorId, r.roadmapUrl))
      if (unattached.length > 0 && rowsWithoutOwn.length > 0) {
        expect(
          offered,
          `${vendorId} withholds an analysis and shows no source for it`
        ).toHaveLength(1)
        expect(offered[0]).toBe(rowsWithoutOwn[0])
      } else {
        expect(offered, `${vendorId} offers an analysis it has no reason to`).toHaveLength(0)
      }
    }
  })
})

describe('ownEnrichmentForVendor', () => {
  it('is the analysis the vendor panel shows as the vendor own, never a cross-source one', () => {
    for (const [vendorId, rows] of roadmapByVendorId) {
      const own = ownEnrichmentForVendor(vendorId)
      if (!own) continue
      const shownOnARow = rows.some((r) => enrichmentForRoadmap(vendorId, r.roadmapUrl) === own)
      expect(shownOnARow, `${vendorId} card would quote an analysis its panel withholds`).toBe(true)
    }
  })

  it('is the analysis the panel shows for a vendor with no roadmap row', () => {
    for (const [vendorId, list] of enrichmentByVendorId) {
      if (roadmapByVendorId.has(vendorId)) continue
      expect(ownEnrichmentForVendor(vendorId)).toBe(list[0])
    }
  })

  it('is nothing for a vendor whose only analysis was written from another page than its row', () => {
    for (const [vendorId, rows] of roadmapByVendorId) {
      const withheld = rows.every((r) => !enrichmentForRoadmap(vendorId, r.roadmapUrl))
      if (withheld) expect(ownEnrichmentForVendor(vendorId)).toBeUndefined()
    }
  })
})
