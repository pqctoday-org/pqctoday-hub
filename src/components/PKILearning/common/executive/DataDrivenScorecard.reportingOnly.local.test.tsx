// SPDX-License-Identifier: AGPL-3.0-only
import { useState } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Papa from 'papaparse'
import {
  DataDrivenScorecard,
  type ScorecardDimension,
  type ScorecardObservation,
} from './DataDrivenScorecard'
import { effectiveScorecardWeight, scoredWeightShare } from './scorecardCoverage'
import type { KpiValueOrigin } from './scorecardValueOrigin'
import { reportedPercentMessage } from './reportingOnlyMeasure'

/** How the reported-percent field is found by assistive technology. */
const BUDGET_INPUT = { name: /Reported utilization \(%\) — excluded from readiness/ }

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
    const budget = screen.getByRole('spinbutton', BUDGET_INPUT)
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
      fireEvent.change(screen.getByRole('spinbutton', BUDGET_INPUT), { target: { value: '125' } })
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
    const input = screen.getByRole('spinbutton', BUDGET_INPUT)
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

async function readBlob(blob: Blob): Promise<string> {
  return new Promise<string>((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.readAsText(blob)
  })
}

/** Click an export button and return what the page handed to the download. */
async function exportAs(button: '.csv' | '.md'): Promise<string> {
  let exported: Blob | undefined
  const create = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob) => {
    exported = blob as Blob
    return 'blob:export'
  })
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
  try {
    fireEvent.click(screen.getByRole('button', { name: button }))
    return await readBlob(exported!)
  } finally {
    create.mockRestore()
    revoke.mockRestore()
    click.mockRestore()
  }
}

function budgetCsvRecord(csv: string, id = 'budget'): Record<string, string> {
  const parsed = Papa.parse<string[]>(csv, { delimiter: ',', skipEmptyLines: true })
  expect(parsed.errors).toEqual([])
  const index = parsed.data.findIndex((row) => row.at(0) === 'Dimension ID')
  const headers = parsed.data.at(index)!
  const row = parsed.data.slice(index + 1).find((cells) => cells.at(0) === id)!
  return Object.fromEntries(headers.map((key, i) => [key, row.at(i) ?? '']))
}

describe('older saves and cleared fields keep missing distinct from zero', () => {
  it('restores a default 0 that nobody entered as missing on screen and in both exports', async () => {
    render(
      <DataDrivenScorecard
        title="Old save"
        dimensions={dimensions}
        initialScores={{ readiness: 50, budget: 0 }}
        initialValueOrigins={{ readiness: 'calculated-current', budget: 'not-entered' }}
        exportFormats={['markdown', 'csv']}
        minimumCoverageForOverall={0.7}
      />
    )
    expect(screen.getByRole('spinbutton', BUDGET_INPUT)).toHaveValue(null)
    const row = within(screen.getByTestId('kpi-dim-budget'))
    expect(row.getByText('Unknown')).toBeInTheDocument()
    expect(row.queryByText(/Saved value/)).not.toBeInTheDocument()
    expect(
      row.queryByRole('button', { name: 'Use displayed sample value' })
    ).not.toBeInTheDocument()
    expect(row.getByText('Origin: Manual sample input — not entered')).toBeInTheDocument()

    expect(budgetCsvRecord(await exportAs('.csv'))).toMatchObject({
      Score: '',
      'Raw worksheet value (not an assessed score)': '',
      'Original saved snapshot value': '',
      'Included in overall calculation': 'false',
    })
    const md = await exportAs('.md')
    expect(md).toContain(
      '| Budget Utilization | Unknown — reporting only; excluded from readiness |'
    )
    expect(md).not.toContain('0% — reporting only')
  })

  it('keeps a deliberate 0 through save and reload', () => {
    const scores = vi.fn()
    const origins = vi.fn()
    const view = render(
      <DataDrivenScorecard
        title="Zero"
        dimensions={dimensions}
        onScoreChange={scores}
        onValueOriginsChange={origins}
      />
    )
    fireEvent.change(screen.getByRole('spinbutton', BUDGET_INPUT), { target: { value: '0' } })
    const savedScores = scores.mock.calls.at(-1)![0] as Record<string, number>
    const savedOrigins = origins.mock.calls.at(-1)![0] as Record<string, KpiValueOrigin>
    expect(savedScores.budget).toBe(0)
    expect(savedOrigins.budget).toBe('learner-entered')
    view.unmount()

    render(
      <DataDrivenScorecard
        title="Zero"
        dimensions={dimensions}
        initialScores={savedScores}
        initialValueOrigins={savedOrigins}
      />
    )
    expect(screen.getByRole('spinbutton', BUDGET_INPUT)).toHaveValue(0)
    const row = within(screen.getByTestId('kpi-dim-budget'))
    expect(row.getByText('0%')).toBeInTheDocument()
    expect(row.queryByText('Unknown')).not.toBeInTheDocument()
  })

  it('returns a cleared field to not entered and out of the touched set', () => {
    const touched = vi.fn()
    const origins = vi.fn()
    render(
      <DataDrivenScorecard
        title="Cleared"
        dimensions={dimensions}
        onTouchedChange={touched}
        onValueOriginsChange={origins}
      />
    )
    const input = screen.getByRole('spinbutton', BUDGET_INPUT)
    fireEvent.change(input, { target: { value: '80' } })
    expect([...(touched.mock.calls.at(-1)![0] as Set<string>)]).toContain('budget')
    expect((origins.mock.calls.at(-1)![0] as Record<string, string>).budget).toBe('learner-entered')

    fireEvent.change(input, { target: { value: '' } })
    expect([...(touched.mock.calls.at(-1)![0] as Set<string>)]).not.toContain('budget')
    expect((origins.mock.calls.at(-1)![0] as Record<string, string>).budget).toBe('not-entered')
    expect(
      within(screen.getByTestId('kpi-dim-budget')).getByText(
        'Origin: Manual sample input — not entered'
      )
    ).toBeInTheDocument()
  })
})

describe('a persona lens that gains the budget row after the save was opened', () => {
  it('does not bring the never-entered default back into the screen or the exports', async () => {
    const budget: ScorecardDimension = { ...dimensions[1], id: 'budget-utilization' }
    const props = {
      title: 'Persona switch',
      initialScores: { readiness: 50, 'budget-utilization': 0 },
      initialValueOrigins: {
        readiness: 'calculated-current',
        'budget-utilization': 'not-entered',
      } as Record<string, KpiValueOrigin>,
      exportFormats: ['markdown', 'csv'] as ('markdown' | 'csv')[],
    }
    // Opened under a lens with no budget row, then switched to one that has it.
    const view = render(<DataDrivenScorecard {...props} dimensions={[dimensions[0]]} />)
    view.rerender(<DataDrivenScorecard {...props} dimensions={[dimensions[0], budget]} />)
    expect(screen.getByRole('spinbutton', BUDGET_INPUT)).toHaveValue(null)
    expect(
      within(screen.getByTestId('kpi-dim-budget-utilization')).getByText('Unknown')
    ).toBeInTheDocument()
    expect(budgetCsvRecord(await exportAs('.csv'), 'budget-utilization')).toMatchObject({
      Score: '',
      'Raw worksheet value (not an assessed score)': '',
      'Original saved snapshot value': '',
    })
    expect(await exportAs('.md')).toContain(
      '| Budget Utilization | Unknown — reporting only; excluded from readiness |'
    )
  })
})

describe('the reported-percent field', () => {
  it('has an accessible name that contains its visible label, with period and scope as the description', () => {
    render(<Worksheet />)
    const input = screen.getByRole('spinbutton', BUDGET_INPUT)
    const visible = 'Reported utilization (%) — excluded from readiness'
    expect(screen.getByText(visible)).toBeInTheDocument()
    expect(input).toHaveAccessibleName(`Budget Utilization ${visible}`)
    expect(input).toHaveAccessibleDescription('Period: Unknown · Scope: Unknown')
    const row = within(screen.getByTestId('kpi-dim-budget'))
    fireEvent.click(row.getByText('Sample measure notes'))
    fireEvent.change(row.getByRole('textbox', { name: 'Budget Utilization Reporting period' }), {
      target: { value: '2026 Q4' },
    })
    fireEvent.change(row.getByRole('textbox', { name: 'Reporting scope' }), {
      target: { value: 'Fictional service A' },
    })
    expect(input).toHaveAccessibleDescription('Period: 2026 Q4 · Scope: Fictional service A')
  })

  it('rejects negative and oversized entries with a message, stores nothing, and shows the kept value after blur', () => {
    const onScoreChange = vi.fn()
    render(
      <DataDrivenScorecard
        title="Invalid entries"
        dimensions={dimensions}
        initialScores={{ budget: 80 }}
        initialValueOrigins={{ budget: 'learner-entered' }}
        onScoreChange={onScoreChange}
      />
    )
    const input = screen.getByRole('spinbutton', BUDGET_INPUT)
    for (const raw of ['-5', '-0.01', '1001', '1e300']) {
      fireEvent.change(input, { target: { value: raw } })
      expect(screen.getByRole('alert')).toHaveTextContent(reportedPercentMessage(true))
      expect(input).toBeInvalid()
      expect(input).toHaveAccessibleDescription(
        `Period: Unknown · Scope: Unknown ${reportedPercentMessage(true)}`
      )
      // What was typed stays in the box while the field has focus; nothing was stored.
      expect(input).toHaveValue(Number(raw))
    }
    expect(onScoreChange).not.toHaveBeenCalled()

    // Leaving the field shows what is stored, and the message stays to explain why.
    fireEvent.blur(input)
    expect(input).toHaveValue(80)
    expect(screen.getByRole('alert')).toHaveTextContent(reportedPercentMessage(true))

    fireEvent.change(input, { target: { value: '0' } })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(input).not.toBeInvalid()
    expect(input).toHaveValue(0)
    expect(onScoreChange).toHaveBeenLastCalledWith({ readiness: 50, budget: 0 })
  })

  it('does not turn a rejected entry into a stored 0 when the field was empty', async () => {
    render(<Worksheet />)
    const input = screen.getByRole('spinbutton', BUDGET_INPUT)
    fireEvent.change(input, { target: { value: '-5' } })
    // There was no previous value, so the message does not claim one was kept.
    expect(screen.getByRole('alert')).toHaveTextContent(reportedPercentMessage(false))
    expect(screen.getByRole('alert')).not.toHaveTextContent('previous value')
    expect(within(screen.getByTestId('kpi-dim-budget')).getByText('Unknown')).toBeInTheDocument()
    expect(budgetCsvRecord(await exportAs('.csv'))).toMatchObject({
      Score: '',
      'Raw worksheet value (not an assessed score)': '',
    })
    expect(await exportAs('.md')).toContain(
      '| Budget Utilization | Unknown — reporting only; excluded from readiness |'
    )
    // Empty again after leaving the field: no stale alert on an empty box.
    fireEvent.blur(input)
    expect(input).toHaveValue(null)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('clears the message when the field is emptied', async () => {
    const user = userEvent.setup()
    render(<Worksheet />)
    const input = screen.getByRole('spinbutton', BUDGET_INPUT)
    await user.type(input, '-5')
    expect(screen.getByRole('alert')).toHaveTextContent(reportedPercentMessage(false))
    await user.clear(input)
    expect(input).toHaveValue(null)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(input).not.toBeInvalid()
  })

  it('does not clear a stored value or rewrite the box for an unreadable entry; it judges the entry on blur', () => {
    const onScoreChange = vi.fn()
    render(
      <DataDrivenScorecard
        title="Half typed"
        dimensions={dimensions}
        initialScores={{ budget: 80 }}
        initialValueOrigins={{ budget: 'learner-entered' }}
        onScoreChange={onScoreChange}
      />
    )
    const input = screen.getByRole('spinbutton', BUDGET_INPUT) as HTMLInputElement
    // A browser reports half-typed text such as "-" or "1e", and an exponent such as
    // "1e999" that overflows to infinity, as an empty value with badInput set.
    Object.defineProperty(input, 'validity', { configurable: true, value: { badInput: true } })
    fireEvent.change(input, { target: { value: '' } })
    expect(onScoreChange).not.toHaveBeenCalled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(input.value).toBe('')
    fireEvent.blur(input)
    expect(screen.getByRole('alert')).toHaveTextContent(reportedPercentMessage(true))
    expect(input).toHaveValue(80)
    expect(onScoreChange).not.toHaveBeenCalled()
  })
})

/**
 * jsdom does not model badInput. Emulate a browser: a lone ".", "-" or "e" reads as
 * an empty value with badInput set until the next key arrives.
 */
function emulateBrowserBadInput(input: HTMLInputElement) {
  let lastKey = ''
  input.addEventListener('keydown', (event) => {
    lastKey = event.key
  })
  input.addEventListener('keyup', () => {
    lastKey = ''
  })
  Object.defineProperty(input, 'validity', {
    configurable: true,
    get: () => ({ badInput: input.value === '' && ['.', '-', 'e'].includes(lastKey) }),
  })
}

describe('typing over a selected value in the reported-percent field', () => {
  function renderStored(onScoreChange = vi.fn()) {
    render(
      <DataDrivenScorecard
        title="Typing"
        dimensions={dimensions}
        initialScores={{ budget: 80 }}
        initialValueOrigins={{ budget: 'learner-entered' }}
        onScoreChange={onScoreChange}
      />
    )
    const input = screen.getByRole('spinbutton', BUDGET_INPUT) as HTMLInputElement
    emulateBrowserBadInput(input)
    return { input, onScoreChange }
  }
  const budgets = (fn: ReturnType<typeof vi.fn>) =>
    fn.mock.calls.map(([scores]) => (scores as Record<string, number>).budget)

  it('keeps ".5" typed over a selection, instead of undoing the "." and ending at 805', async () => {
    const user = userEvent.setup()
    const { input, onScoreChange } = renderStored()
    await user.type(input, '.5', { initialSelectionStart: 0, initialSelectionEnd: 2 })
    expect(input).toHaveValue(0.5)
    expect(budgets(onScoreChange)).toEqual([0.5])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    // Leaving the field shows the stored value in its plain form.
    await user.tab()
    expect(input.value).toBe('0.5')
  })

  it('keeps "1e3" typed over a selection, instead of ending at 13', async () => {
    const user = userEvent.setup()
    const { input, onScoreChange } = renderStored()
    await user.type(input, '1e3', { initialSelectionStart: 0, initialSelectionEnd: 2 })
    expect(input).toHaveValue(1000)
    expect(budgets(onScoreChange)).toEqual([1, 1000])
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('still refuses an exponent that passes the ceiling, with the previous value named', async () => {
    const user = userEvent.setup()
    const { input, onScoreChange } = renderStored()
    await user.type(input, '1e4', { initialSelectionStart: 0, initialSelectionEnd: 2 })
    expect(budgets(onScoreChange)).toEqual([1])
    expect(screen.getByRole('alert')).toHaveTextContent(reportedPercentMessage(true))
    await user.tab()
    expect(input).toHaveValue(1)
  })
})

describe('exports of a restored value that has not been assessed for current use', () => {
  it('say so in Markdown and CSV, as the screen does', async () => {
    render(
      <DataDrivenScorecard
        title="Origin not recorded"
        dimensions={dimensions}
        initialScores={{ budget: 80 }}
        exportFormats={['markdown', 'csv']}
      />
    )
    expect(
      within(screen.getByTestId('kpi-dim-budget')).getByText(
        'Saved value: 80% — current use not assessed'
      )
    ).toBeInTheDocument()
    expect(budgetCsvRecord(await exportAs('.csv'))).toMatchObject({
      Score: '',
      'Raw worksheet value (not an assessed score)': '80',
      'Original saved snapshot value': '80',
      'Current-use status':
        'Reporting only — excluded from readiness; not assessed for current use',
      'Included in overall calculation': 'false',
    })
    expect(await exportAs('.md')).toContain(
      '| Budget Utilization | 80% — not assessed for current use; reporting only; excluded from readiness |'
    )
  })
})

describe('scope text in exports', () => {
  const withScope = (scope: string) => (
    <DataDrivenScorecard
      title="Scope text"
      dimensions={dimensions}
      initialScores={{ budget: 80 }}
      initialValueOrigins={{ budget: 'learner-entered' }}
      exportFormats={['markdown', 'csv']}
      observations={{ budget: { scope, verificationState: 'not-verified' } }}
    />
  )

  it('keeps a quote, a comma and a line break in the CSV scope as one cell', async () => {
    const scope = 'Fictional "payments" service, region A\nsecond line\r\nthird line'
    render(withScope(scope))
    expect(budgetCsvRecord(await exportAs('.csv')).Scope).toBe(scope)
  })

  it('stops a scope that starts like a formula from running in a spreadsheet', async () => {
    for (const scope of ['=HYPERLINK("https://example.test")', '+1', '-1', '@SUM(A1)']) {
      const view = render(withScope(scope))
      expect(budgetCsvRecord(await exportAs('.csv')).Scope).toBe(`'${scope}`)
      view.unmount()
    }
  })

  it('escapes a pipe and flattens a line break in the Markdown scope', async () => {
    render(withScope('Service A | B\nregion C'))
    expect(await exportAs('.md')).toContain('scope: Service A \\| B region C;')
  })
})
