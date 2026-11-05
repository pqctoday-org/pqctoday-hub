// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataDrivenScorecard, type ScorecardDimension } from './DataDrivenScorecard'
import { currentKpiValueOrigin, kpiValueOriginLabel } from './scorecardValueOrigin'

const dimensions: ScorecardDimension[] = [
  {
    id: 'manual',
    label: 'Sample manual',
    description: 'An entered example',
    autoScore: 0,
    notYetScored: true,
    valueSource: 'manual',
    weight: 0.5,
  },
  {
    id: 'calc',
    label: 'Sample calculation',
    description: 'A calculated example',
    autoScore: 40,
    valueSource: 'calculated',
    weight: 0.5,
  },
]

describe('KPI value labels describe the operation actually performed', () => {
  it('uses explicit source metadata rather than presence of placeholder zero', () => {
    expect(currentKpiValueOrigin(dimensions[0], false)).toBe('not-entered')
    expect(currentKpiValueOrigin(dimensions[0], true)).toBe('learner-entered')
    expect(currentKpiValueOrigin(dimensions[1], false)).toBe('calculated-current')
    expect(currentKpiValueOrigin(dimensions[1], true)).toBe('learner-override')
    expect(currentKpiValueOrigin(dimensions[0], true, true)).toBe('unrecorded')
    expect(kpiValueOriginLabel('calculated-current', true)).toBe('Required inputs unavailable')
  })

  it('keeps scoring arithmetic and coverage independent from fictional measure notes', () => {
    const view = render(
      <DataDrivenScorecard
        title="Sample worksheet"
        dimensions={dimensions}
        minimumCoverageForOverall={0.7}
        showExport={false}
      />
    )
    expect(screen.getByText(/Scored-value coverage: 50%/)).toBeInTheDocument()
    expect(
      within(screen.getByTestId('kpi-dim-manual')).getByText(/Manual sample input — not entered/)
    ).toBeInTheDocument()
    expect(screen.getByText('Not yet available')).toBeInTheDocument()
    view.rerender(
      <DataDrivenScorecard
        title="Sample worksheet"
        dimensions={dimensions}
        minimumCoverageForOverall={0.7}
        showExport={false}
        observations={{
          manual: {
            evidenceReference: 'Fictional reference',
            verificationState: 'independently-checked',
          },
        }}
      />
    )
    expect(screen.getByText(/Scored-value coverage: 50%/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'Sample manual score' }), {
      target: { value: '17' },
    })
    expect(screen.getByText(/Scored-value coverage: 100%/)).toBeInTheDocument()
    expect(screen.getByText('29')).toBeInTheDocument()
    expect(
      within(screen.getByTestId('kpi-dim-manual')).getByText(/Learner-entered sample value/)
    ).toBeInTheDocument()
  })

  it('does not infer historical learner entry from a restored numeric zero', () => {
    render(
      <DataDrivenScorecard
        title="Saved example"
        dimensions={dimensions}
        initialScores={{ manual: 0 }}
        showExport={false}
      />
    )
    expect(
      within(screen.getByTestId('kpi-dim-manual')).getByText(/Value origin not recorded/)
    ).toBeInTheDocument()
  })
})
