// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
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
  it('keeps an explicitly refreshed calculation live as scoped inputs change and withdraws unavailable inputs', () => {
    const origins = vi.fn()
    const scores = vi.fn()
    const props = {
      title: 'Changing sample scope',
      initialScores: { manual: 0, calc: 90 },
      initialValueOrigins: {
        manual: 'learner-entered' as const,
        calc: 'calculated-current' as const,
      },
      minimumCoverageForOverall: 0.7,
      showExport: false,
      onScoreChange: scores,
      onValueOriginsChange: origins,
    }
    const view = render(<DataDrivenScorecard {...props} dimensions={dimensions} />)
    expect(screen.getByText(/Scored-value coverage: 50%/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Use current calculation (40)' }))
    expect(screen.getByRole('slider', { name: 'Sample calculation score' })).toHaveValue('40')
    const changed = dimensions.map((d) =>
      d.id === 'calc' ? { ...d, autoScore: 55, description: 'Different selected sample scope' } : d
    )
    view.rerender(<DataDrivenScorecard {...props} dimensions={changed} />)
    expect(screen.getByRole('slider', { name: 'Sample calculation score' })).toHaveValue('55')
    expect(screen.getByText(/Calculated from current selected sample inputs/)).toBeInTheDocument()
    expect(origins.mock.lastCall![0].calc).toBe('calculated-current')
    expect(scores.mock.lastCall![0].calc).toBe(55)
    // A new current scope with the same result remains current because the calculation
    // is live, not because equality proves that a saved scope matched.
    view.rerender(
      <DataDrivenScorecard
        {...props}
        dimensions={changed.map((d) => ({ ...d, description: 'Another current sample scope' }))}
      />
    )
    expect(screen.getByRole('slider', { name: 'Sample calculation score' })).toHaveValue('55')
    view.rerender(
      <DataDrivenScorecard
        {...props}
        dimensions={changed.map((d) => ({
          ...d,
          disabled: true,
          disabledReason: 'Current inputs unavailable',
        }))}
      />
    )
    expect(screen.getByText(/Scored-value coverage: 0%/)).toBeInTheDocument()
    expect(screen.getByText(/Saved value: 90 — current inputs unavailable/)).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /Use current calculation/ })
    ).not.toBeInTheDocument()
  })
  it('downloads CSV with active scores separated from unknown snapshots and unassessed raw values', async () => {
    let exported: Blob | undefined
    const NativeURL = URL
    vi.stubGlobal(
      'URL',
      class extends NativeURL {
        static createObjectURL(blob: Blob) {
          exported = blob
          return 'blob:sample-kpi'
        }
        static revokeObjectURL() {}
      }
    )
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      const rows: ScorecardDimension[] = [
        ...dimensions,
        { ...dimensions[0], id: 'legacy', label: 'Legacy "sample", unknown', weight: 0.2 },
        { ...dimensions[0], id: 'pending', label: 'Pending sample', weight: 0.2 },
        {
          ...dimensions[1],
          id: 'disabled',
          label: 'Unavailable sample',
          weight: 0.2,
          disabled: true,
        },
      ]
      render(
        <DataDrivenScorecard
          title="CSV sample"
          dimensions={rows}
          initialScores={{ manual: 0, calc: 40, legacy: 99, pending: 0, disabled: 77 }}
          initialValueOrigins={{
            manual: 'learner-entered',
            calc: 'calculated-current',
            pending: 'not-entered',
            disabled: 'calculated-current',
          }}
          exportFormats={['csv']}
        />
      )
      fireEvent.click(screen.getByRole('button', { name: 'Use current calculation (40)' }))
      fireEvent.click(screen.getByRole('button', { name: '.csv' }))
      expect(exported?.type).toBe('text/csv')
      const text = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsText(exported!)
      })
      const parsed = Papa.parse<string[]>(text.slice(text.indexOf('Dimension ID,')), {
        skipEmptyLines: true,
      })
      expect(parsed.errors).toEqual([])
      const headerIndex = parsed.data.findIndex((row) => row[0] === 'Dimension ID')
      const headers = parsed.data[headerIndex]
      const records = parsed.data
        .slice(headerIndex + 1)
        .map((row) => Object.fromEntries(headers.map((key, i) => [key, row[i]])))
      const byId = Object.fromEntries(records.map((row) => [row['Dimension ID'], row]))
      expect(byId.legacy).toMatchObject({
        Label: 'Legacy "sample", unknown',
        Score: '',
        'Raw worksheet value (not an assessed score)': '99',
        'Original saved snapshot value': '99',
        'Included in overall calculation': 'false',
        'Current-use status': 'Not assessed for current use',
      })
      expect(byId.manual).toMatchObject({ Score: '0', 'Included in overall calculation': 'true' })
      expect(byId.calc).toMatchObject({ Score: '40', 'Included in overall calculation': 'true' })
      expect(byId.pending).toMatchObject({
        Score: '',
        'Raw worksheet value (not an assessed score)': '0',
        'Included in overall calculation': 'false',
      })
      expect(byId.disabled).toMatchObject({
        Score: '',
        'Raw worksheet value (not an assessed score)': '77',
        'Included in overall calculation': 'false',
        'Current-use status': 'Required inputs unavailable',
      })
    } finally {
      click.mockRestore()
      vi.unstubAllGlobals()
    }
  })
})
