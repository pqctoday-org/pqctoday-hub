// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import {
  DataDrivenScorecard,
  type ScorecardDimension,
  type ScorecardObservation,
} from './DataDrivenScorecard'
import { effectiveScorecardWeight, scoredWeightShare } from './scorecardCoverage'

const dimensions: ScorecardDimension[] = [
  {
    id: 'readiness',
    label: 'Sample readiness',
    description: 'Independent sample result',
    weight: 1,
    autoScore: 50,
    valueSource: 'calculated',
  },
  {
    id: 'budget',
    label: 'Budget Utilization',
    description: 'Reported spend for the declared scope',
    weight: 0,
    reportingOnly: true,
    valueSource: 'manual',
    notYetScored: true,
  },
]

function Worksheet() {
  const [observations, setObservations] = useState<Record<string, ScorecardObservation>>({})
  return (
    <DataDrivenScorecard
      title="Budget reporting sample"
      dimensions={dimensions}
      initialWeights={{ budget: 1 }}
      minimumCoverageForOverall={0.7}
      allowWeightEditing
      exportFormats={['markdown', 'csv']}
      observations={observations}
      onObservationChange={(id, value) => setObservations((prev) => ({ ...prev, [id]: value }))}
    />
  )
}

describe('reporting measures cannot buy readiness', () => {
  it('excludes reporting values and saved weights from score and coverage, retaining ordinary weights', () => {
    expect(effectiveScorecardWeight(dimensions[1], { budget: 1 })).toBe(0)
    expect(effectiveScorecardWeight(dimensions[0], { readiness: 0.4 })).toBe(0.4)
    expect(
      scoredWeightShare(
        dimensions,
        (d) => effectiveScorecardWeight(d, { budget: 1 }),
        (d) => d.id === 'budget'
      )
    ).toBe(0)
    expect(
      scoredWeightShare(
        dimensions,
        (d) => effectiveScorecardWeight(d, { budget: 1 }),
        (d) => d.id === 'readiness'
      )
    ).toBe(1)
  })

  it('keeps 0, 80, 100 and 125 raw while the headline stays fixed, and ordinary scoring still works', () => {
    render(<Worksheet />)
    const budget = screen.getByRole('spinbutton', { name: 'Budget Utilization reported percent' })
    expect(budget).toHaveValue(null)
    expect(screen.getByText('Period: Unknown · Scope: Unknown')).toBeInTheDocument()
    for (const value of [0, 80, 100, 125]) {
      fireEvent.change(budget, { target: { value: String(value) } })
      expect(budget).toHaveValue(value)
      expect(screen.getByText('50', { selector: 'p' })).toBeInTheDocument()
    }
    fireEvent.click(screen.getByRole('button', { name: 'Customise Weights' }))
    expect(
      within(screen.getByTestId('kpi-dim-budget')).queryByRole('slider')
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByRole('slider', { name: 'Sample readiness score' }), {
      target: { value: '70' },
    })
    expect(screen.getByText('70', { selector: 'p' })).toBeInTheDocument()
    fireEvent.change(budget, { target: { value: '' } })
    expect(budget).toHaveValue(null)
    expect(within(screen.getByTestId('kpi-dim-budget')).getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('70', { selector: 'p' })).toBeInTheDocument()
  })

  it('does not unlock a headline from finance alone', () => {
    render(
      <DataDrivenScorecard
        title="Pending readiness"
        minimumCoverageForOverall={0.7}
        dimensions={[
          { ...dimensions[0], autoScore: undefined, notYetScored: true, valueSource: 'manual' },
          dimensions[1],
        ]}
        initialScores={{ budget: 100 }}
        initialValueOrigins={{ budget: 'learner-entered' }}
        initialWeights={{ budget: 1 }}
        showExport={false}
      />
    )
    expect(screen.getByText('Not yet available')).toBeInTheDocument()
    expect(screen.getByText(/Scored-value coverage: 0%/)).toBeInTheDocument()
  })

  it('exports the actual CSV Blob with raw value, period and scope but no active finance score', async () => {
    let exported: Blob | undefined
    const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
      exported = blob as Blob
      return 'blob:budget'
    })
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    try {
      render(<Worksheet />)
      fireEvent.change(
        screen.getByRole('spinbutton', { name: 'Budget Utilization reported percent' }),
        { target: { value: '125' } }
      )
      const row = within(screen.getByTestId('kpi-dim-budget'))
      fireEvent.click(row.getByText('Sample measure notes'))
      fireEvent.change(row.getByRole('textbox', { name: 'Budget Utilization Reporting period' }), {
        target: { value: '2026 Q4' },
      })
      fireEvent.change(row.getByRole('textbox', { name: 'Reporting scope' }), {
        target: { value: 'Fictional service, A' },
      })
      fireEvent.click(screen.getByRole('button', { name: '.csv' }))
      expect(exported?.type).toBe('text/csv')
      const csv = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsText(exported!)
      })
      const parsed = Papa.parse<string[]>(csv, { delimiter: ',', skipEmptyLines: true })
      expect(parsed.errors).toEqual([])
      const index = parsed.data.findIndex((row) => row[0] === 'Dimension ID')
      const headers = parsed.data.at(index)!
      const budget = parsed.data.slice(index + 1).find((row) => row[0] === 'budget')!
      const record = Object.fromEntries(headers.map((key, i) => [key, budget.at(i)]))
      expect(record).toMatchObject({
        Score: '',
        'Weight %': '0',
        'Raw worksheet value (not an assessed score)': '125',
        'Reporting Period': '2026 Q4',
        Scope: 'Fictional service, A',
        'Included in overall calculation': 'false',
      })
      fireEvent.click(screen.getByRole('button', { name: '.md' }))
      const md = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsText(exported!)
      })
      expect(md).toContain('125% — reporting only; excluded from readiness')
      expect(md).toContain('scope: Fictional service, A')
      expect(md).toContain('**Overall Score: 50/100**')
    } finally {
      create.mockRestore()
      revoke.mockRestore()
      click.mockRestore()
    }
  })
})

it('clears a recorded finance value to Unknown while retaining its original snapshot separately', async () => {
  let exported: Blob | undefined
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    exported = blob as Blob
    return 'blob:cleared'
  })
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  try {
    render(
      <DataDrivenScorecard
        title="Cleared report"
        dimensions={dimensions}
        initialScores={{ budget: 80 }}
        initialWeights={{ budget: 1 }}
        initialValueOrigins={{ budget: 'learner-entered' }}
        exportFormats={['csv']}
        minimumCoverageForOverall={0.7}
      />
    )
    const input = screen.getByRole('spinbutton', { name: 'Budget Utilization reported percent' })
    expect(input).toHaveValue(80)
    fireEvent.change(input, { target: { value: '0' } })
    expect(within(screen.getByTestId('kpi-dim-budget')).getByText('0%')).toBeInTheDocument()
    fireEvent.change(input, { target: { value: '' } })
    expect(input).toHaveValue(null)
    expect(within(screen.getByTestId('kpi-dim-budget')).getByText('Unknown')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: '.csv' }))
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsText(exported!)
    })
    const parsed = Papa.parse<string[]>(csv, { delimiter: ',', skipEmptyLines: true })
    expect(parsed.errors).toEqual([])
    const i = parsed.data.findIndex((row) => row.at(0) === 'Dimension ID')
    const headers = parsed.data.at(i)!,
      values = parsed.data.slice(i + 1).find((row) => row.at(0) === 'budget')!
    expect(Object.fromEntries(headers.map((key, index) => [key, values.at(index)]))).toMatchObject({
      Score: '',
      'Raw worksheet value (not an assessed score)': '',
      'Original saved snapshot value': '80',
      'Included in overall calculation': 'false',
    })
  } finally {
    create.mockRestore()
    revoke.mockRestore()
    click.mockRestore()
  }
})
