// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import type { AssessmentResult } from '../../hooks/assessmentTypes'
import type { AssessmentSnapshot } from '../../store/useAssessmentStore'
import { getUrgencyTier } from '../../hooks/assessment/urgencyTiers'
import { KPITrendingSection } from './KPITrendingSection'

vi.mock('recharts', () => {
  const passthrough = ({ children }: { children?: ReactNode }) => <div>{children}</div>
  return {
    ResponsiveContainer: passthrough,
    LineChart: ({ children, data }: { children?: ReactNode; data: unknown }) => (
      <div data-testid="history-chart" data-points={JSON.stringify(data)}>
        {children}
      </div>
    ),
    ReferenceLine: ({ y, label }: { y: number; label: { value: string } }) => (
      <div data-testid="band-reference" data-score={y}>
        {label.value}
      </div>
    ),
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    RadarChart: passthrough,
    PolarGrid: () => null,
    PolarAngleAxis: () => null,
    Radar: () => null,
    Legend: () => null,
  }
})

const result: AssessmentResult = {
  riskScore: 76,
  riskLevel: 'critical',
  algorithmMigrations: [],
  complianceImpacts: [],
  recommendedActions: [],
  narrative: 'Fictional sample',
  generatedAt: '2026-11-05T00:00:00Z',
  keyFindings: [],
  categoryScores: {
    quantumExposure: 50,
    migrationComplexity: 50,
    regulatoryPressure: 50,
    organizationalReadiness: 50,
  },
}
const sample = (
  riskScore: number,
  riskLevel: AssessmentSnapshot['riskLevel']
): AssessmentSnapshot => ({
  completedAt: '2026-11-04T00:00:00Z',
  riskScore,
  riskLevel,
  industry: 'Sample',
  categoryScores: result.categoryScores!,
})

function show(history: AssessmentSnapshot[]) {
  return render(
    <MemoryRouter>
      <KPITrendingSection history={history} currentResult={result} defaultOpen />
    </MemoryRouter>
  )
}

describe('current model band references preserve historical observations', () => {
  it('uses the model upper bounds rather than unrelated 40/70 labels', () => {
    const history = [sample(0, 'critical'), sample(76, 'low')]
    show(history)
    expect(
      screen.getAllByTestId('band-reference').map((line) => [line.dataset.score, line.textContent])
    ).toEqual([
      ['25', 'Low ≤25'],
      ['55', 'Medium ≤55'],
      ['75', 'High ≤75'],
    ])
    // Deliberately different saved labels remain as recorded, including a genuine zero.
    const points = JSON.parse(screen.getByTestId('history-chart').dataset.points!)
    expect(
      points.map((p: { riskScore: number; riskLevel: string }) => [p.riskScore, p.riskLevel])
    ).toEqual([
      [0, 'critical'],
      [76, 'low'],
    ])
    const rows = screen.getAllByRole('row')
    expect(
      rows.some((row) => within(row).queryByText('0') && within(row).queryByText('Critical'))
    ).toBe(true)
    expect(screen.getByText(/current Hub model bands/).textContent).toContain(
      'Saved scores and labels remain as recorded'
    )
    expect(history).toEqual([sample(0, 'critical'), sample(76, 'low')])
  })

  it.each([
    [25, 4],
    [26, 3],
    [55, 3],
    [56, 2],
    [75, 2],
    [76, 1],
  ])('matches existing classification at score %s', (score, tier) => {
    expect(getUrgencyTier(score).tier).toBe(tier)
  })

  it('does not invent a historical score or band for empty history', () => {
    show([])
    expect(screen.queryByTestId('history-chart')).toBeNull()
    expect(screen.queryByTestId('band-reference')).toBeNull()
    expect(screen.getByText(/Complete another self-assessment/)).toBeTruthy()
  })
})
