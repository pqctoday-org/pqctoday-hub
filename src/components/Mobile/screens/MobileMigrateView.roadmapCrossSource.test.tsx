// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileMigrateView } from './MobileMigrateView'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import { HELD_ANALYSIS_SOURCES } from '@/data/heldAnalysisSources'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

// Fixture vendors added to the loaded maps for this file only, so the checks
// do not depend on which vendors the shipped files currently withhold.
//  - WITHHELD: the row links a PDF, the analysis was written from the web page.
//  - MATCHED:  the row and the analysis are the same address.
//  - NO_ROW:   an analysis and no roadmap row at all.
const WITHHELD = 'VND-ZZ-WITHHELD'
const MATCHED = 'VND-ZZ-MATCHED'
const NO_ROW = 'VND-ZZ-NOROW'
//  - HELD_ROW / HELD_NOROW: the same two shapes, but the analysis address is one
//    that did not resolve (see heldAnalysisSources.ts).
const HELD_ROW = 'VND-ZZ-HELDROW'
const HELD_NOROW = 'VND-ZZ-HELDNOROW'
const HELD_URL = HELD_ANALYSIS_SOURCES[0].url

const NAMES: Record<string, string> = {
  [WITHHELD]: 'Zzfixture Withheld Card',
  [MATCHED]: 'Zzfixture Matched Card',
  // A vendor with no roadmap row and no vendor-list entry is listed by its id.
  [NO_ROW]: NO_ROW,
  [HELD_ROW]: 'Zzfixture Held Row Card',
  [HELD_NOROW]: HELD_NOROW,
}

const WITHHELD_ROW = 'https://withheld.example/files/paper.pdf'
const WITHHELD_PAGE = 'https://www.withheld.example/insights/paper.html'
const MATCHED_ROW = 'https://matched.example/roadmap'
const NO_ROW_PAGE = 'https://norow.example/blog/pqc'

function row(vendorId: string, roadmapUrl: string): VendorRoadmap {
  return {
    vendorId,
    vendorName: NAMES[vendorId],
    roadmapUrl,
    roadmapTitle: `${NAMES[vendorId]} roadmap`,
    roadmapType: 'official_doc',
    publishDate: '',
    lastVerifiedDate: '2026-10-01',
    coverageNotes: '',
    compositeId: `${vendorId}|${roadmapUrl}`,
    roadmapStatus: 'active',
  }
}

function analysis(
  vendorId: string,
  roadmapUrl: string,
  targetMigrationDates: string,
  sourceTitle?: string
): VendorRoadmapEnrichment {
  return {
    vendorId,
    roadmapUrl,
    roadmapScope: 'Portfolio-wide strategy',
    pqcAlgorithms: [],
    targetMigrationDates,
    productsCovered: '',
    complianceFrameworks: [],
    hybridModeSupport: '',
    currentGaStatus: 'Preview',
    customerActionRequired: '',
    keyQuotes: [],
    extractionQuality: 'LOW',
    sourceTitle,
  }
}

beforeAll(() => {
  roadmapByVendorId.set(WITHHELD, [row(WITHHELD, WITHHELD_ROW)])
  enrichmentByVendorId.set(WITHHELD, [
    analysis(WITHHELD, WITHHELD_PAGE, 'Withheld pilot in 2027', 'The paper, as a web page'),
  ])
  roadmapByVendorId.set(MATCHED, [row(MATCHED, MATCHED_ROW)])
  enrichmentByVendorId.set(MATCHED, [analysis(MATCHED, MATCHED_ROW, 'Matched rollout in 2028')])
  roadmapByVendorId.set(HELD_ROW, [row(HELD_ROW, 'https://heldrow.example/files/paper.pdf')])
  enrichmentByVendorId.set(HELD_ROW, [
    analysis(HELD_ROW, HELD_URL, 'Held cross-source rollout in 2031'),
  ])
  enrichmentByVendorId.set(HELD_NOROW, [
    analysis(HELD_NOROW, HELD_URL, 'Held analysis-only rollout in 2032', 'A held page'),
  ])
  enrichmentByVendorId.set(NO_ROW, [
    analysis(NO_ROW, NO_ROW_PAGE, 'Analysis-only rollout in 2029', 'A blog post'),
  ])
})

afterAll(() => {
  for (const id of [WITHHELD, MATCHED, NO_ROW, HELD_ROW, HELD_NOROW]) {
    roadmapByVendorId.delete(id)
    enrichmentByVendorId.delete(id)
  }
})

function openVendors() {
  return render(
    <MemoryRouter initialEntries={['/migrate?tab=roadmaps']}>
      <MobileMigrateView />
    </MemoryRouter>
  )
}

function card(vendorId: string): HTMLElement {
  return screen.getByText(NAMES[vendorId]).closest<HTMLElement>('div.rounded-xl')!
}

function openSheet(vendorId: string): HTMLElement {
  openVendors()
  fireEvent.click(within(card(vendorId)).getAllByRole('button')[0])
  return screen.getByTestId('vendor-roadmap-sheet')
}

describe('phone vendor card target dates', () => {
  it('shows no date taken from an analysis the roadmap panel keeps under another source', () => {
    openVendors()
    expect(within(card(WITHHELD)).queryByText(/Withheld pilot in 2027/)).toBeNull()
  })

  it("still shows the date from the vendor's own analysis, matched to its roadmap link", () => {
    openVendors()
    expect(within(card(MATCHED)).getByText('Matched rollout in 2028')).toBeInTheDocument()
  })

  it('still shows the date of the analysis a vendor with no roadmap row opens to', () => {
    openVendors()
    expect(within(card(NO_ROW)).getByText('Analysis-only rollout in 2029')).toBeInTheDocument()
  })
})

describe('phone roadmap sheet', () => {
  it('puts the withheld analysis in its own labelled block with a 44 px link to its page', () => {
    const sheet = openSheet(WITHHELD)
    const block = within(sheet).getByRole('region', { name: 'Analysis from another source' })

    const link = within(block).getByRole('link', {
      name: 'Analysis source: The paper, as a web page (withheld.example) (opens in a new tab)',
    })
    expect(link).toHaveAttribute('href', WITHHELD_PAGE)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link.className).toContain('min-h-11')
    // Long titles wrap rather than push the sheet sideways at 390 px.
    expect(link.querySelector('span.break-words')).not.toBeNull()

    // The analysis dates are shown once, inside the block and nowhere else.
    expect(within(sheet).getAllByText('Withheld pilot in 2027')).toHaveLength(1)
    expect(block.contains(within(sheet).getByText('Withheld pilot in 2027'))).toBe(true)
  })

  it("keeps the row's own link first and pointing at the row", () => {
    const sheet = openSheet(WITHHELD)
    const links = within(sheet)
      .getAllByRole('link')
      .map((a) => a.getAttribute('href'))
    expect(links.slice(0, 2)).toEqual([WITHHELD_ROW, WITHHELD_PAGE])
  })

  it('has no such block for a row whose analysis is its own', () => {
    const sheet = openSheet(MATCHED)
    expect(within(sheet).queryByText('Analysis from another source')).toBeNull()
    expect(within(sheet).getByText('Matched rollout in 2028')).toBeInTheDocument()
  })

  it('says where the analysis of a vendor with no roadmap row came from', () => {
    const sheet = openSheet(NO_ROW)
    const source = within(sheet).getByRole('group', { name: 'Analysis source' })
    expect(
      within(source).getByRole('link', {
        name: 'Analysis source: A blog post (norow.example) (opens in a new tab)',
      })
    ).toHaveAttribute('href', NO_ROW_PAGE)
    expect(within(sheet).queryByText('Analysis from another source')).toBeNull()
  })
})

describe('phone roadmap sheet: sources whose address did not resolve', () => {
  it('shows no block, no link and none of the facts for a held cross-source analysis', () => {
    const sheet = openSheet(HELD_ROW)
    expect(within(sheet).queryByText('Analysis from another source')).toBeNull()
    expect(within(sheet).queryByText('Held cross-source rollout in 2031')).toBeNull()
    expect(
      within(sheet)
        .getAllByRole('link')
        .map((a) => a.getAttribute('href'))
    ).toEqual(['https://heldrow.example/files/paper.pdf'])
  })

  it('shows no source link for a held analysis of a vendor with no roadmap row, and keeps its facts', () => {
    const sheet = openSheet(HELD_NOROW)
    expect(within(sheet).queryByRole('group', { name: 'Analysis source' })).toBeNull()
    expect(within(sheet).queryByRole('link')).toBeNull()
    expect(within(sheet).getByText('Held analysis-only rollout in 2032')).toBeInTheDocument()
  })
})
