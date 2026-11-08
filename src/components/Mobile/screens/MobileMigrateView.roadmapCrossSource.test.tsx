// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileMigrateView } from './MobileMigrateView'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'
import { enrichmentByVendorId } from '@/data/vendorRoadmapEnrichmentData'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

// Fixture vendors added to the loaded maps for this file only, so the checks
// do not depend on which vendors the shipped files currently withhold.
//  - WITHHELD: the row links a PDF, the analysis was written from the web page.
//  - MATCHED:  the row and the analysis are the same address.
//  - NO_ROW:   an analysis and no roadmap row at all.
const WITHHELD = 'VND-ZZ-WITHHELD'
const MATCHED = 'VND-ZZ-MATCHED'
const NO_ROW = 'VND-ZZ-NOROW'

const NAMES: Record<string, string> = {
  [WITHHELD]: 'Zzfixture Withheld Card',
  [MATCHED]: 'Zzfixture Matched Card',
  // A vendor with no roadmap row and no vendor-list entry is listed by its id.
  [NO_ROW]: NO_ROW,
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
  enrichmentByVendorId.set(NO_ROW, [
    analysis(NO_ROW, NO_ROW_PAGE, 'Analysis-only rollout in 2029', 'A blog post'),
  ])
})

afterAll(() => {
  for (const id of [WITHHELD, MATCHED, NO_ROW]) {
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
    const source = within(sheet).getByRole('region', { name: 'Analysis source' })
    expect(
      within(source).getByRole('link', {
        name: 'Analysis source: A blog post (norow.example) (opens in a new tab)',
      })
    ).toHaveAttribute('href', NO_ROW_PAGE)
    expect(within(sheet).queryByText('Analysis from another source')).toBeNull()
  })
})
