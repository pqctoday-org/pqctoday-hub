// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ROICalculator } from './ROICalculator'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { computeAnnualComplianceSavings } from '@/utils/roiMath'
import { Button } from '@/components/ui/button'
const saved = vi.hoisted(() => ({
  inputs: undefined as Record<string, unknown> | undefined,
  add: vi.fn(),
}))

vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  Cell: () => null,
  ReferenceLine: () => null,
}))
vi.mock('@/components/PKILearning/common/executive/ExportableArtifact', () => ({
  ExportableArtifact: ({ exportData, onExport }: { exportData: string; onExport: () => void }) => (
    <>
      <pre aria-label="Generated ROI Markdown">{exportData}</pre>
      <Button onClick={onExport}>Save sample ROI</Button>
    </>
  ),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => saved.inputs }))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: (selector: (state: { addExecutiveDocument: typeof saved.add }) => unknown) =>
    selector({ addExecutiveDocument: saved.add }),
}))
beforeEach(() => {
  saved.inputs = undefined
  saved.add.mockReset()
})
vi.mock('@/hooks/useExecutiveModuleData', () => ({ useExecutiveModuleData: () => baseMockData }))

const baseMockData: ExecutiveModuleData = {
  threatsByIndustry: new Map(),
  criticalThreatCount: 0,
  totalThreatCount: 0,
  industryThreats: [],
  vendorsByDomain: new Map(),
  fipsValidatedCount: 0,
  pqcReadyCount: 0,
  vendorReadinessWeighted: 0,
  totalProducts: 10,
  frameworks: [],
  // @ts-expect-error — tests only need length; full ComplianceFramework shape isn't required
  frameworksByIndustry: [{}, {}, {}, {}, {}], // 5 frameworks
  countryDeadlines: [],
  userCountryData: null,
  assessmentResult: null,
  riskScore: null,
  industry: 'Finance & Banking',
  country: 'United States',
  complianceSelections: [],
  preBoostScore: null,
  boosts: [],
  hndlRiskWindow: null,
  tnflRiskWindow: null,
  categoryScores: null,
  categoryDrivers: null,
  migrationEffort: [],
  algorithmMigrations: [],
  keyFindings: [],
  assessmentProfile: null,
  myFrameworks: [],
  myProductIds: [],
  myProducts: [],
  myThreatIds: [],
  myThreats: [],
  myTimelineCountries: [],
  myTimelineCountryData: [],
  vendorReadinessByDomain: new Map(),
  isAssessmentComplete: false,
  migrationDeadlineYear: 2035,
}

describe('ROI regulatory assumptions attribution', () => {
  it.each([0, 3_000_000])(
    'retains an explicit %s scenario amount through save, remount and export',
    (amount) => {
      const view = render(
        <MemoryRouter>
          <ROICalculator />
        </MemoryRouter>
      )
      fireEvent.change(screen.getByLabelText('Applicable Frameworks (Scenario Count)'), {
        target: { value: '2' },
      })
      fireEvent.change(screen.getByLabelText('Penalty per Incident (Illustrative Amount)'), {
        target: { value: String(amount) },
      })
      fireEvent.click(screen.getByRole('button', { name: 'Save sample ROI' }))
      const document = saved.add.mock.lastCall?.[0]
      expect(document.inputs.penaltyPerIncident).toBe(amount)
      expect(document.inputs.applicableFrameworks).toBe(2)
      expect(document.data).toContain(
        `Annual modeled contribution: ${amount === 0 ? '$0' : '$600K'}`
      )
      saved.inputs = structuredClone(document.inputs)
      view.unmount()
      render(
        <MemoryRouter>
          <ROICalculator />
        </MemoryRouter>
      )
      expect(screen.getByLabelText('Penalty per Incident (Illustrative Amount)')).toHaveValue(
        String(amount)
      )
      expect(screen.getByLabelText('Generated ROI Markdown')).toHaveTextContent(
        `Annual modeled contribution: ${amount === 0 ? '$0' : '$600K'}`
      )
      fireEvent.click(screen.getByRole('button', { name: 'Save sample ROI' }))
      expect(saved.add.mock.lastCall?.[0].inputs.penaltyPerIncident).toBe(amount)
    }
  )

  it('restores an older draft with no penalty field using zero without inferring no liability', () => {
    saved.inputs = { applicableFrameworks: 2 }
    render(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    expect(screen.getByLabelText('Penalty per Incident (Illustrative Amount)')).toHaveValue('0')
    expect(screen.getByLabelText('Generated ROI Markdown')).toHaveTextContent(
      'Annual modeled contribution: $0'
    )
    expect(
      screen.getByText(/Zero is the starting scenario input/, { selector: 'p' })
    ).toHaveTextContent('not a finding of no liability')
  })

  it('labels default penalty and incident-rate inputs as illustrative rather than enforcement statistics', () => {
    render(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    expect(screen.getByLabelText('Penalty per Incident (Illustrative Amount)')).toHaveValue('0')
    expect(screen.getByLabelText('Penalty per Incident (Illustrative Amount)')).toHaveAttribute(
      'min',
      '0'
    )
    expect(screen.getByLabelText('Applicable Frameworks (Scenario Count)')).toHaveValue('5')
    expect(screen.getByText(/editable scenario penalty per incident/)).toHaveTextContent(
      'a fixed 10% illustrative annual incident rate'
    )
    const md = screen.getByLabelText('Generated ROI Markdown')
    expect(md).toHaveTextContent('Illustrative penalty per incident: $0')
    expect(md).toHaveTextContent('10% per framework per year (illustrative assumption)')
    expect(md).toHaveTextContent('Annual modeled contribution: $0')
    expect(md).toHaveTextContent('The penalty is not a sourced average')
    expect(md).toHaveTextContent('not sourced enforcement statistics')
    expect(md).not.toHaveTextContent('Compliance penalties: published regulatory enforcement data')
  })

  it('preserves selected assumptions and existing arithmetic in UI and generated Markdown', () => {
    const onOutput = vi.fn()
    render(
      <MemoryRouter>
        <ROICalculator onOutput={onOutput} />
      </MemoryRouter>
    )
    const initial = onOutput.mock.lastCall?.[0]
    fireEvent.change(screen.getByLabelText('Applicable Frameworks (Scenario Count)'), {
      target: { value: '2' },
    })
    fireEvent.change(screen.getByLabelText('Penalty per Incident (Illustrative Amount)'), {
      target: { value: '3000000' },
    })
    expect(2 * 3000000 * 0.1).toBe(600000)
    expect(
      computeAnnualComplianceSavings({
        frameworkCount: 2,
        penaltyPerIncident: 3000000,
        incidentRate: 0.1,
      })
    ).toBe(600000)
    const md = screen.getByLabelText('Generated ROI Markdown')
    expect(md).toHaveTextContent('Framework count selected for scenario: 2 of 5')
    expect(md).toHaveTextContent('Illustrative penalty per incident: $3.0M')
    expect(md).toHaveTextContent('Annual modeled contribution: $600K')
    expect(
      screen.getByText(
        /The selected framework count, editable penalty amount and fixed incident rate/,
        { selector: 'p' }
      )
    ).toBeVisible()
    expect(onOutput.mock.lastCall?.[0].totalCostUSD).toBe(initial.totalCostUSD)
    expect(onOutput.mock.lastCall?.[0].breachCostSavingsUSD).toBe(initial.breachCostSavingsUSD)
  })
})
