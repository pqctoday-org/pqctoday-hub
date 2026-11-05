// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
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
  it('keeps restored unknown zeros out of coverage until explicitly chosen, then round trips them', () => {
    const origins = vi.fn()
    const scores = vi.fn()
    const view = render(
      <DataDrivenScorecard
        title="Legacy sample"
        dimensions={dimensions}
        initialScores={{ manual: 0, calc: 90 }}
        minimumCoverageForOverall={0.7}
        showExport={false}
        onValueOriginsChange={origins}
        onScoreChange={scores}
      />
    )
    expect(screen.getByText(/Scored-value coverage: 0%/)).toBeInTheDocument()
    expect(
      within(screen.getByTestId('kpi-dim-calc')).getByText(/Saved value: 90/)
    ).toBeInTheDocument()
    fireEvent.click(
      within(screen.getByTestId('kpi-dim-manual')).getByRole('button', {
        name: 'Use displayed sample value',
      })
    )
    expect(screen.getByText(/Scored-value coverage: 50%/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use current calculation (40)' }))
    expect(screen.getByText(/Scored-value coverage: 100%/)).toBeInTheDocument()
    expect(screen.getByText('20')).toBeInTheDocument()
    expect(scores.mock.lastCall?.[0]).toEqual({ manual: 0, calc: 40 })
    expect(origins.mock.lastCall?.[0]).toEqual({
      manual: 'learner-entered',
      calc: 'calculated-current',
    })
    const savedOrigins = origins.mock.lastCall![0]
    view.unmount()
    render(
      <DataDrivenScorecard
        title="Reopened sample"
        dimensions={dimensions}
        initialScores={{ manual: 0, calc: 40 }}
        initialValueOrigins={savedOrigins}
        minimumCoverageForOverall={0.7}
        showExport={false}
      />
    )
    expect(screen.getByText(/Scored-value coverage: 50%/)).toBeInTheDocument()
    expect(screen.getByText(/Saved calculated sample snapshot/)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Sample manual score' })).toHaveValue('0')
    fireEvent.click(screen.getByRole('button', { name: 'Use current calculation (40)' }))
    expect(screen.getByText(/Scored-value coverage: 100%/)).toBeInTheDocument()
  })

  it('preserves an entered nonzero snapshot but does not infer input matching from equal calculations', () => {
    render(
      <DataDrivenScorecard
        title="Saved calculation"
        dimensions={dimensions}
        initialScores={{ manual: 17, calc: 40 }}
        initialValueOrigins={{ manual: 'learner-entered', calc: 'calculated-current' }}
        minimumCoverageForOverall={0.7}
        showExport={false}
      />
    )
    expect(screen.getByText(/Scored-value coverage: 50%/)).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Sample manual score' })).toHaveValue('17')
    expect(screen.getByText(/Saved value: 40/)).toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'Sample calculation score' }), {
      target: { value: '50' },
    })
    expect(screen.getByText(/Learner override of calculated sample value/)).toBeInTheDocument()
    expect(screen.getByText(/Scored-value coverage: 100%/)).toBeInTheDocument()
  })
  it('keeps a saved zero visible when current inputs are unavailable without scoring it', () => {
    render(
      <DataDrivenScorecard
        title="Unavailable sample"
        dimensions={[{ ...dimensions[1], disabled: true }]}
        initialScores={{ calc: 0 }}
        initialValueOrigins={{ calc: 'calculated-current' }}
        minimumCoverageForOverall={0.7}
        showExport={false}
      />
    )
    expect(screen.getByText(/Saved value: 0 — current inputs unavailable/)).toBeInTheDocument()
    expect(screen.getByText(/Scored-value coverage: 0%/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Use current calculation/ })
    ).not.toBeInTheDocument()
  })
})
