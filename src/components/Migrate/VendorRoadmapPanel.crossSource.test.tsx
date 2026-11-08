// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { VendorRoadmapPanel } from './VendorRoadmapPanel'
import { HELD_ANALYSIS_SOURCES } from '@/data/heldAnalysisSources'
import type { VendorRoadmap, VendorRoadmapEnrichment } from '@/types/MigrateTypes'

// A vendor whose roadmap row links the PDF while the analysis was written from
// the web page of the same paper. Fixture data: the shipped files may change.
const ROW_URL = 'https://card.example/content/dam/white-paper.pdf'
const ANALYSIS_URL = 'https://www.card.example/insights/white-paper.html'

const roadmap: VendorRoadmap = {
  vendorId: 'VND-FIXTURE',
  vendorName: 'Card Example',
  roadmapUrl: ROW_URL,
  roadmapTitle: 'Migration white paper',
  roadmapType: 'whitepaper',
  publishDate: '',
  lastVerifiedDate: '2026-10-01',
  coverageNotes: '',
  compositeId: `VND-FIXTURE|${ROW_URL}`,
}

function analysis(overrides: Partial<VendorRoadmapEnrichment> = {}): VendorRoadmapEnrichment {
  return {
    vendorId: 'VND-FIXTURE',
    roadmapUrl: ANALYSIS_URL,
    roadmapScope: 'Portfolio-wide strategy',
    pqcAlgorithms: ['ML-KEM'],
    targetMigrationDates: 'Pilot in 2027',
    productsCovered: '',
    complianceFrameworks: ['NIST'],
    hybridModeSupport: 'Yes; adopt hybrid where practical',
    currentGaStatus: 'Preview',
    customerActionRequired: '',
    keyQuotes: ['Plan for quantum-safe practices.'],
    extractionQuality: 'LOW',
    sourceTitle: 'Migration to post-quantum cryptography',
    ...overrides,
  }
}

describe('VendorRoadmapPanel: analysis from another source', () => {
  it('shows the labelled block, a link to the analysis own page, and its facts inside it', () => {
    render(<VendorRoadmapPanel roadmap={roadmap} enrichment={undefined} crossSource={analysis()} />)

    const block = screen.getByRole('region', { name: 'Analysis from another source' })
    expect(
      within(block).getByText(/written from a different page than the roadmap linked above/i)
    ).toBeInTheDocument()

    const link = within(block).getByRole('link', {
      name: /Analysis source: Migration to post-quantum cryptography.*opens in a new tab/i,
    })
    expect(link).toHaveAttribute('href', ANALYSIS_URL)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link).toHaveTextContent('card.example')

    expect(within(block).getByText('ML-KEM')).toBeInTheDocument()
    expect(within(block).getByText('Pilot in 2027')).toBeInTheDocument()
    expect(within(block).getByText('Preview')).toBeInTheDocument()
  })

  it("keeps the row's own link pointing at the row, and puts no fact from the other page outside the block", () => {
    const { container } = render(
      <VendorRoadmapPanel roadmap={roadmap} enrichment={undefined} crossSource={analysis()} />
    )
    const open = screen.getByRole('link', { name: 'Open Card Example PQC roadmap' })
    expect(open).toHaveAttribute('href', ROW_URL)

    const block = screen.getByRole('region', { name: 'Analysis from another source' })
    // Every fact of the other page, and its availability chip, sits inside the block.
    for (const text of ['ML-KEM', 'Pilot in 2027', 'Preview', 'NIST']) {
      for (const node of screen.getAllByText(text, { exact: false })) {
        expect(block.contains(node), `"${text}" appears outside the block`).toBe(true)
      }
    }
    expect(container.textContent).toContain('Last verified 2026-10-01')
  })

  it("lists the row's own link before the analysis link in the tab order", () => {
    render(<VendorRoadmapPanel roadmap={roadmap} enrichment={undefined} crossSource={analysis()} />)
    const links = screen.getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual([ROW_URL, ANALYSIS_URL])
  })

  it('names the site when the analysis recorded no page title', () => {
    render(
      <VendorRoadmapPanel
        roadmap={roadmap}
        enrichment={undefined}
        crossSource={analysis({ sourceTitle: undefined })}
      />
    )
    expect(
      screen.getByRole('link', { name: /Analysis source: card\.example.*opens in a new tab/i })
    ).toHaveAttribute('href', ANALYSIS_URL)
  })

  it('shows no block for a row whose own analysis matches its link', () => {
    render(
      <VendorRoadmapPanel
        roadmap={roadmap}
        enrichment={analysis({ roadmapUrl: ROW_URL })}
        crossSource={undefined}
      />
    )
    expect(screen.queryByRole('region', { name: 'Analysis from another source' })).toBeNull()
    expect(screen.queryByText('Analysis from another source')).toBeNull()
    // The row's own analysis still shows, with no source line of its own.
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()
    expect(screen.queryByText('Analysis source')).toBeNull()
  })

  it('shows no block when the analysis records an address that is not http or https', () => {
    render(
      <VendorRoadmapPanel
        roadmap={roadmap}
        enrichment={undefined}
        crossSource={analysis({ roadmapUrl: 'javascript:alert(1)' })}
      />
    )
    expect(screen.queryByText('Analysis from another source')).toBeNull()
    expect(screen.queryByText('ML-KEM')).toBeNull()
  })
})

describe('VendorRoadmapPanel: vendor with an analysis and no roadmap row', () => {
  it('says where the analysis came from, with a link to that page', () => {
    render(<VendorRoadmapPanel roadmap={undefined} enrichment={analysis()} />)
    const source = screen.getByRole('group', { name: 'Analysis source' })
    expect(
      within(source).getByRole('link', {
        name: /Analysis source: Migration to post-quantum cryptography.*opens in a new tab/i,
      })
    ).toHaveAttribute('href', ANALYSIS_URL)
    // Not the "another source" wording: there is no roadmap here to differ from.
    expect(screen.queryByText('Analysis from another source')).toBeNull()
    // The facts stay where they were.
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()
  })

  it('is a group, not a landmark, so a list of many vendors adds no landmark per vendor', () => {
    render(<VendorRoadmapPanel roadmap={undefined} enrichment={analysis()} />)
    expect(screen.getByRole('group', { name: 'Analysis source' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Analysis source' })).toBeNull()
  })

  it('shows no source line when the analysis recorded no address', () => {
    render(<VendorRoadmapPanel roadmap={undefined} enrichment={analysis({ roadmapUrl: '' })} />)
    expect(screen.queryByText('Analysis source')).toBeNull()
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()
  })

  it('shows no source line on a vendor with a roadmap row', () => {
    render(<VendorRoadmapPanel roadmap={roadmap} enrichment={analysis({ roadmapUrl: ROW_URL })} />)
    expect(screen.queryByText('Analysis source')).toBeNull()
  })
})

describe('VendorRoadmapPanel: sources whose address did not resolve', () => {
  const held = HELD_ANALYSIS_SOURCES[0]

  it('shows no block, no link and none of its facts for a held cross-source analysis', () => {
    render(
      <VendorRoadmapPanel
        roadmap={roadmap}
        enrichment={undefined}
        crossSource={analysis({ roadmapUrl: held.url })}
      />
    )
    expect(screen.queryByText('Analysis from another source')).toBeNull()
    expect(screen.queryByText('ML-KEM')).toBeNull()
    expect(screen.queryByText('Pilot in 2027')).toBeNull()
    expect(screen.getAllByRole('link').map((a) => a.getAttribute('href'))).toEqual([ROW_URL])
  })

  it('shows no source link for a held analysis of a vendor with no roadmap row, and keeps its facts', () => {
    render(
      <VendorRoadmapPanel roadmap={undefined} enrichment={analysis({ roadmapUrl: held.url })} />
    )
    expect(screen.queryByText('Analysis source')).toBeNull()
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('ML-KEM')).toBeInTheDocument()
  })

  it('a different address of the same vendor is not held', () => {
    render(
      <VendorRoadmapPanel
        roadmap={roadmap}
        enrichment={undefined}
        crossSource={analysis({ roadmapUrl: `${held.url}-other` })}
      />
    )
    expect(screen.getByText('Analysis from another source')).toBeInTheDocument()
  })
})
