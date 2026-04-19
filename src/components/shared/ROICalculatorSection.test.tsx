// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ROICalculatorSection, type ROISummary } from './ROICalculatorSection'
import type { AssessmentResult } from '@/hooks/assessmentTypes'

// ── Mocks ──────────────────────────────────────────────────────────────────

// Recharts needs a mock because jsdom can't measure the SVG container.
vi.mock('recharts', () => ({
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Cell: () => null,
}))

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeResult(overrides: Partial<AssessmentResult> = {}): AssessmentResult {
  return {
    riskScore: 60,
    riskLevel: 'medium',
    algorithmMigrations: [
      {
        classical: 'RSA-2048',
        quantumVulnerable: true,
        replacement: 'ML-KEM-768',
        urgency: 'near-term',
        notes: '',
      },
    ],
    complianceImpacts: [
      { framework: 'GDPR', requiresPQC: true, deadline: '2030', notes: '' },
      { framework: 'HIPAA', requiresPQC: true, deadline: '2030', notes: '' },
    ],
    recommendedActions: [],
    narrative: '',
    generatedAt: '2026-04-18T00:00:00Z',
    assessmentProfile: {
      industry: 'Finance & Banking',
      algorithmsSelected: ['RSA-2048'],
      algorithmUnknown: false,
      sensitivityLevels: ['high'],
      sensitivityUnknown: false,
      complianceFrameworks: ['GDPR', 'HIPAA'],
      complianceUnknown: false,
      migrationStatus: 'planning',
      migrationUnknown: false,
      mode: 'comprehensive',
      useCasesUnknown: false,
      retentionUnknown: false,
      credentialLifetimeUnknown: false,
      infrastructureUnknown: false,
      agilityUnknown: false,
      vendorUnknown: false,
      scaleUnknown: false,
      timelineUnknown: false,
      systemScale: '51-200',
      teamSize: '11-50',
      vendorDependency: 'mixed',
      cryptoAgility: 'partially-abstracted',
      infrastructure: ['Security Stack', 'Application'],
    },
    ...overrides,
  }
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('ROICalculatorSection', () => {
  it('renders the five Phase-2 KPI cards including NPV and Cost of Inaction', () => {
    // Print-only table and on-screen cards duplicate some labels; both presences are fine.
    render(
      <ROICalculatorSection
        result={makeResult()}
        industry="Finance & Banking"
        defaultOpen
        onSummaryChange={() => {}}
      />
    )
    expect(screen.getAllByText(/Total Cost \(3yr\)/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Cost of Inaction/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/NPV @ 10%/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Net ROI \(3yr\)/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Payback/i).length).toBeGreaterThan(0)
  })

  it('emits a ROISummary that includes totalCost, costOfInaction, and npv', () => {
    let latest: ROISummary | null = null
    render(
      <ROICalculatorSection
        result={makeResult()}
        industry="Finance & Banking"
        defaultOpen
        onSummaryChange={(s) => {
          latest = s
        }}
      />
    )
    expect(latest).not.toBeNull()
    expect(latest!.totalCost).toBeDefined()
    expect(latest!.costOfInaction).toBeDefined()
    expect(latest!.npv).toBeDefined()
    expect(latest!.migrationCost).toBeGreaterThan(0)
  })

  it('payback uses annual (not horizon-scaled) benefit — scales with horizon consistently', () => {
    // Capture the summaries across horizon changes to verify F1 fix.
    const summaries: ROISummary[] = []
    const Wrapper: React.FC = () => {
      return (
        <ROICalculatorSection
          result={makeResult()}
          industry="Finance & Banking"
          defaultOpen
          onSummaryChange={(s) => {
            summaries.push(s)
          }}
        />
      )
    }
    render(<Wrapper />)
    const horizonInput = screen.getByLabelText(/Planning horizon/i) as HTMLInputElement

    // Baseline (horizon=3)
    expect(horizonInput.value).toBe('3')
    const base = summaries[summaries.length - 1]

    // Change to horizon=5 — payback should NOT change (it uses annual benefit).
    fireEvent.change(horizonInput, { target: { value: '5' } })
    const extended = summaries[summaries.length - 1]
    expect(extended.paybackMonths).toBeCloseTo(base.paybackMonths, 5)
    // totalCost and costOfInaction SHOULD scale with horizon.
    expect(extended.totalCost! - base.totalCost!).toBeGreaterThan(0)
    expect(extended.costOfInaction! - base.costOfInaction!).toBeGreaterThan(0)
  })

  it('including annual opex reduces the net ROI vs zero opex', () => {
    const summaries: ROISummary[] = []
    render(
      <ROICalculatorSection
        result={makeResult()}
        industry="Finance & Banking"
        defaultOpen
        onSummaryChange={(s) => {
          summaries.push(s)
        }}
      />
    )
    const opexInput = screen.getByLabelText(/Annual opex/i) as HTMLInputElement

    fireEvent.change(opexInput, { target: { value: '0' } })
    const zeroOpex = summaries[summaries.length - 1].netRoiPercent
    fireEvent.change(opexInput, { target: { value: '500000' } })
    const withOpex = summaries[summaries.length - 1].netRoiPercent
    expect(withOpex).toBeLessThan(zeroOpex)
  })

  it('changing the discount rate changes NPV but not nominal ROI%', () => {
    const summaries: ROISummary[] = []
    render(
      <ROICalculatorSection
        result={makeResult()}
        industry="Finance & Banking"
        defaultOpen
        onSummaryChange={(s) => {
          summaries.push(s)
        }}
      />
    )
    const rateInput = screen.getByLabelText(/Discount rate/i) as HTMLInputElement

    fireEvent.change(rateInput, { target: { value: '5' } })
    const low = summaries[summaries.length - 1]
    fireEvent.change(rateInput, { target: { value: '20' } })
    const high = summaries[summaries.length - 1]

    // Higher discount rate → lower NPV (same nominal ROI since undiscounted).
    expect(high.npv!).toBeLessThan(low.npv!)
    expect(high.netRoiPercent).toBeCloseTo(low.netRoiPercent, 6)
  })
})
