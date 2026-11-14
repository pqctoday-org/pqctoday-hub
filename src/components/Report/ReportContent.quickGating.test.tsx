// SPDX-License-Identifier: AGPL-3.0-only
//
// A quick assessment keeps the per-domain scores locked everywhere they could
// appear: the report body, the Framework Risk Lens, the executive brief and the
// Quantum Readiness Assessment heatmap. The engine emits coarse scores on every
// track, so none of these may key off their mere presence.
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ReportContent } from './ReportContent'
import { BoardBriefSection } from './BoardBriefSection'
import { buildQRA } from '@/hooks/assessment/qra'
import {
  EXAMPLE_REPORT_RESULT,
  EXAMPLE_REPORT_GRC_RESULT,
  EXAMPLE_REPORT_SHARE_PAYLOAD,
} from '@/data/exampleReport'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
vi.mock('./sections/CbomSection', () => ({ CbomSection: () => null }))
vi.mock('./sections/SimulationOutcomesSection', () => ({ SimulationOutcomesSection: () => null }))
vi.mock('./MigrationToolkit', () => ({ MigrationToolkit: () => null }))
vi.mock('./KPITrendingSection', () => ({ KPITrendingSection: () => null }))
vi.mock('../shared/ROICalculatorSection', () => ({ ROICalculatorSection: () => null }))
vi.mock('./sections/ThreatLandscapeSection', () => ({ ThreatLandscapeSection: () => null }))

const quick = EXAMPLE_REPORT_RESULT
const full = EXAMPLE_REPORT_GRC_RESULT

describe('fixtures', () => {
  it('quick example is a quick report that still carries coarse engine scores', () => {
    expect(quick.assessmentProfile?.mode).not.toBe('comprehensive')
    expect(quick.categoryScores).toBeDefined()
    expect(quick.frameworkRisk).toBeDefined()
    expect(full.assessmentProfile?.mode).toBe('comprehensive')
  })
})

describe('Quantum Readiness Assessment heatmap', () => {
  it('has no domain cells for a quick result, and four for a comprehensive one', () => {
    expect(buildQRA(EXAMPLE_REPORT_SHARE_PAYLOAD, quick).heatmap).toEqual([])
    expect(buildQRA(EXAMPLE_REPORT_SHARE_PAYLOAD, full).heatmap).toHaveLength(4)
  })
})

describe('executive brief', () => {
  const brief = (result: typeof quick) =>
    render(
      <BoardBriefSection
        result={result}
        industry="Finance & Banking"
        country="United States"
        roiSummary={null}
        generatedAt={result.generatedAt}
        visible
      />
    )

  it('omits the four-domain breakdown on a quick assessment', () => {
    brief(quick)
    expect(screen.queryByText('Model Category Breakdown')).not.toBeInTheDocument()
    expect(screen.queryByText('Quantum Exposure')).not.toBeInTheDocument()
  })

  it('prints the breakdown on a comprehensive assessment', () => {
    brief(full)
    expect(screen.getByText('Model Category Breakdown')).toBeInTheDocument()
    expect(screen.getByText('Quantum Exposure')).toBeInTheDocument()
  })
})

describe('report body', () => {
  const body = (result: typeof quick, shared: boolean) =>
    render(
      <MemoryRouter>
        <ReportContent result={result} sharedView={shared ? { persona: 'executive' } : undefined} />
      </MemoryRouter>
    )

  it('quick: shows the locked preview, no Framework Risk Lens and no domain scores', () => {
    body(quick, false)
    expect(screen.getByText('Per-domain scores need the full assessment')).toBeInTheDocument()
    expect(screen.queryByText(/Framework Risk Lens/)).not.toBeInTheDocument()
    expect(screen.queryByText('Feasibility')).not.toBeInTheDocument()
  })

  it('comprehensive: shows the Framework Risk Lens', () => {
    body(full, false)
    expect(screen.getAllByText(/Framework Risk Lens/).length).toBeGreaterThan(0)
    expect(screen.queryByText('Per-domain scores need the full assessment')).not.toBeInTheDocument()
  })

  it('own quick report offers the unlock link, hidden from print', () => {
    body(quick, false)
    const group = screen.getByRole('group', {
      name: /Locked section: Per-domain scores need the full assessment/,
    })
    const unlock = within(group).getByRole('link', { name: /Unlock/ })
    expect(unlock).toHaveAttribute('href', '/assess?mode=comprehensive')
    expect(unlock.className).toContain('print:hidden')
  })

  it('shared quick report is locked but offers no unlock link anywhere', () => {
    body(quick, true)
    expect(screen.getByText('Per-domain scores need the full assessment')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Unlock/ })).not.toBeInTheDocument()
    expect(screen.queryByText(/Framework Risk Lens/)).not.toBeInTheDocument()
  })
})
