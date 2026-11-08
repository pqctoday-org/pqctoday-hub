// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import type { MaturityRequirement } from '@/types/MaturityTypes'
import { CSWP39AgilityExplorer } from './CSWP39AgilityExplorer'

const fixture = vi.hoisted(() => ({ rows: [] as MaturityRequirement[] }))
vi.mock('@/data/maturityGovernanceData', () => ({ maturityRequirements: fixture.rows }))
vi.mock('../MaturityEvidenceGrid', () => ({ MaturityEvidenceGrid: () => null }))
const row = (overrides: Partial<MaturityRequirement> = {}): MaturityRequirement => ({
  refId: 'sample-cswp',
  sourceName: 'CSWP 39 sample',
  category: 'Technical Standards',
  sourceType: 'Teaching fixture',
  pillar: 'governance',
  maturityLevel: 1,
  assetClass: 'all',
  requirement: 'Illustrative extracted statement',
  evidenceQuote: 'Illustrative recorded passage',
  evidenceLocation: 'Example section',
  sourceUrl: 'https://example.test/source',
  confidence: 'low',
  extractionModel: 'Sample extractor',
  extractionDate: '2026-11-05',
  ...overrides,
})
const mount = () => {
  render(
    <MemoryRouter>
      <CSWP39AgilityExplorer />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('tab', { name: 'Evidence map' }))
}
beforeEach(() => fixture.rows.splice(0))

describe('governance extraction labels are not assurance measurements', () => {
  it('keeps the original label-score mean and populated-cell math with their actual scope', () => {
    fixture.rows.push(
      row(),
      row({ pillar: 'inventory', confidence: 'high' }),
      row({
        refId: 'other-example',
        sourceName: 'Other sample',
        pillar: 'lifecycle',
        confidence: 'high',
      })
    )
    mount()
    expect(
      screen.getByRole('heading', {
        name: 'Candidate governance mappings — 3 extracted records from 2 sources',
      })
    ).toBeVisible()
    // Two CSWP cells /20 =10%; (low25+high95)/2=60. Third source is not in either KPI.
    expect(screen.getByText('10%')).toBeVisible()
    expect(screen.getByText('2/20 cells populated; not organizational readiness')).toBeVisible()
    expect(screen.getByText('60/100')).toBeVisible()
    expect(
      screen.getByText(
        /Hub display rule: low 25, medium 60, high 95; not a measured probability or assurance score/
      )
    ).toBeVisible()
    expect(
      screen.getByText(/extraction and a source link do not establish independent review/)
    ).toBeVisible()
    expect(screen.queryByText(/Authoritative Evidence/)).not.toBeInTheDocument()
    expect(screen.queryByText('Mean confidence')).not.toBeInTheDocument()
  })

  it('does not present a missing CSWP extraction score as zero confidence', () => {
    fixture.rows.push(row({ refId: 'other', sourceName: 'Other sample' }))
    mount()
    expect(screen.getByText('Not available')).toBeVisible()
    expect(screen.getByText('no CSWP-39 records available for this display rule')).toBeVisible()
    expect(screen.queryByText('0/100')).not.toBeInTheDocument()
    expect(screen.getByText('0/20 cells populated; not organizational readiness')).toBeVisible()
  })
})
