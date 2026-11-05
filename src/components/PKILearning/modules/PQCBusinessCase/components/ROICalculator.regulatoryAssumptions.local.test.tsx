// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ROICalculator } from './ROICalculator'
import type { ExecutiveModuleData } from '@/hooks/useExecutiveModuleData'
import { computeAnnualComplianceSavings } from '@/utils/roiMath'

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
  ExportableArtifact: ({ exportData }: { exportData: string }) => (
    <pre aria-label="Generated ROI Markdown">{exportData}</pre>
  ),
}))
vi.mock('@/hooks/useSavedArtifactInputs', () => ({ useSavedArtifactInputs: () => undefined }))
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
  it('labels default penalty and incident-rate inputs as illustrative rather than enforcement statistics', () => {
    render(
      <MemoryRouter>
        <ROICalculator />
      </MemoryRouter>
    )
    expect(screen.getByLabelText('Penalty per Incident (Illustrative Amount)')).toHaveValue(
      '2000000'
    )
    expect(screen.getByLabelText('Applicable Frameworks (Scenario Count)')).toHaveValue('5')
    expect(screen.getByText(/editable scenario penalty per incident/)).toHaveTextContent(
      'a fixed 10% illustrative annual incident rate'
    )
    const md = screen.getByLabelText('Generated ROI Markdown')
    expect(md).toHaveTextContent('Illustrative penalty per incident: $2.0M')
    expect(md).toHaveTextContent('10% per framework per year (illustrative assumption)')
    expect(md).toHaveTextContent('Annual modeled contribution: $1.0M')
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
