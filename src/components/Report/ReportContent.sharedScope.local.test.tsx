// SPDX-License-Identifier: AGPL-3.0-only
import { Button } from '@/components/ui/button'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { ReportContent } from './ReportContent'
import { ReportThreatsAppendix, ASSESS_TO_THREATS_INDUSTRY } from './ReportThreatsAppendix'
import { threatsData } from '@/data/threatsData'
import { EXAMPLE_REPORT_RESULT } from '@/data/exampleReport'
import { useReportOwnershipStore } from '@/store/useReportOwnershipStore'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)
vi.mock('./sections/CbomSection', () => ({ CbomSection: () => <p>RECIPIENT-CBOM</p> }))
vi.mock('./sections/SimulationOutcomesSection', () => ({
  SimulationOutcomesSection: () => <p>RECIPIENT-SIMULATION</p>,
}))
vi.mock('./MigrationToolkit', () => ({ MigrationToolkit: () => <p>RECIPIENT-PRODUCTS</p> }))
vi.mock('./KPITrendingSection', () => ({ KPITrendingSection: () => <p>RECIPIENT-HISTORY</p> }))
vi.mock('./EngineeringPlanExport', () => ({
  EngineeringPlanExport: () => <Button>RECIPIENT-ENGINEERING-EXPORT</Button>,
}))
vi.mock('../shared/ROICalculatorSection', () => ({
  ROICalculatorSection: () => <p>RECIPIENT-ROI</p>,
}))
const threat = vi.hoisted(() => vi.fn())
vi.mock('./sections/ThreatLandscapeSection', () => ({
  ThreatLandscapeSection: (props: unknown) => {
    threat(props)
    return <p>Contextual threat catalogue</p>
  },
}))
const sample = {
  ...EXAMPLE_REPORT_RESULT,
  assessmentProfile: {
    ...EXAMPLE_REPORT_RESULT.assessmentProfile!,
    mode: 'comprehensive' as const,
  },
}

describe('shared report excludes local-only children and print ownership', () => {
  it('shows omissions instead of recipient saved components and leaves ownership unchanged', () => {
    useReportOwnershipStore.setState({
      programOwner: 'RECIPIENT-OWNER',
      budgetOwner: 'RECIPIENT-BUDGET',
      accountableExecutive: 'RECIPIENT-EXEC',
    })
    const before = JSON.stringify(useReportOwnershipStore.getState())
    const { container } = render(
      <MemoryRouter>
        <ReportContent result={sample} sharedView={{ persona: 'researcher' }} />
      </MemoryRouter>
    )
    expect(container.textContent).not.toContain('RECIPIENT-')
    expect(
      screen.getAllByText(/Not included in this shared assessment/).length
    ).toBeGreaterThanOrEqual(5)
    const props = threat.mock.calls.at(-1)![0] as {
      hiddenThreats: string[]
      hideThreat?: unknown
      restoreAllThreats?: unknown
    }
    expect(props.hiddenThreats).toEqual([])
    expect(props.hideThreat).toBeUndefined()
    expect(props.restoreAllThreats).toBeUndefined()
    expect(JSON.stringify(useReportOwnershipStore.getState())).toBe(before)
  })
  it('does not offer recipient engineering ZIP in shared developer/ops views', () => {
    for (const persona of ['developer', 'ops'] as const) {
      const { unmount } = render(
        <MemoryRouter>
          <ReportContent result={sample} sharedView={{ persona }} />
        </MemoryRouter>
      )
      expect(screen.queryByRole('button', { name: 'RECIPIENT-ENGINEERING-EXPORT' })).toBeNull()
      expect(screen.getByText(/Engineering migration plan not included/)).toBeTruthy()
      unmount()
    }
  })
  it('captures the real executive brief print DOM without local ownership', () => {
    let printed = ''
    vi.spyOn(window, 'print').mockImplementation(() => {
      printed = screen.getByText(/Shared assessment: programme ownership/).textContent ?? ''
      expect(screen.queryByText('RECIPIENT-OWNER')).toBeNull()
    })
    render(
      <MemoryRouter>
        <ReportContent result={sample} sharedView={{ persona: 'executive' }} />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Print Executive Brief' }))
    expect(printed).toContain('Shared assessment:')
    expect(printed).not.toContain('RECIPIENT-')
    vi.restoreAllMocks()
  })
  it('keeps own-report saved components and engineering export', () => {
    render(
      <MemoryRouter>
        <ReportContent result={sample} />
      </MemoryRouter>
    )
    expect(screen.getByText('RECIPIENT-CBOM')).toBeTruthy()
    expect(screen.getByText('RECIPIENT-SIMULATION')).toBeTruthy()
    expect(screen.getByText('RECIPIENT-ROI')).toBeTruthy()
  })
})

it('renders no shared threat mutator and preserves the own-report hide action', () => {
  const entry = Object.entries(ASSESS_TO_THREATS_INDUSTRY).find(([, names]) =>
    threatsData.some((t) => names.includes(t.industry))
  )!
  const [industry] = entry
  const { unmount } = render(
    <MemoryRouter>
      <ReportThreatsAppendix industry={industry} hiddenThreatIds={[]} />
    </MemoryRouter>
  )
  expect(screen.queryByRole('button', { name: 'Hide this threat' })).toBeNull()
  expect(screen.getAllByRole('link', { name: /on the Threats page/ }).length).toBeGreaterThan(0)
  unmount()
  const hide = vi.fn()
  render(
    <MemoryRouter>
      <ReportThreatsAppendix industry={industry} hiddenThreatIds={[]} onHideThreat={hide} />
    </MemoryRouter>
  )
  fireEvent.click(screen.getAllByRole('button', { name: 'Hide this threat' })[0])
  expect(hide).toHaveBeenCalledOnce()
})
