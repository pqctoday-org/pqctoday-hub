// SPDX-License-Identifier: AGPL-3.0-only
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { InventoryLifecycleSimulator } from './InventoryLifecycleSimulator'
import { summarizeRemediationDurations } from './remediationDurations'

describe('mean of declared fictional remediation durations', () => {
  it.each([
    [['4', '8', '12'], 24, 8],
    [['4', '8', '12'], 24, 8],
    [['2', '4', '6'], 12, 4],
    [['6', '12', '18'], 36, 12],
    [['1.25', '2.5', '3.75'], 7.5, 2.5],
    [['0', '0', '0'], 0, 0],
  ] as const)('calculates visible inputs %j', (values, total, mean) => {
    expect(summarizeRemediationDurations(values)).toMatchObject({
      totalHours: total,
      meanHours: mean,
      valid: 3,
      missing: 0,
      invalid: 0,
    })
  })

  it.each(['', ' ', '-1', 'NaN', 'Infinity', '1e309', '0x10'])(
    'does not turn missing or invalid %j into zero',
    (bad) => {
      const result = summarizeRemediationDurations(['4', bad, '12'])
      expect(result.meanHours).toBeNull()
      expect(result.totalHours).toBeNull()
      expect(result.valid).toBe(2)
    }
  )

  it('keeps an empty case and an overflowing total unassessed', () => {
    expect(summarizeRemediationDurations([]).meanHours).toBeNull()
    expect(summarizeRemediationDurations(['', '', '']).meanHours).toBeNull()
    expect(summarizeRemediationDurations(['1e308', '1e308', '1e308'])).toMatchObject({
      aggregateInvalid: true,
      totalHours: null,
      meanHours: null,
    })
  })
})

function choose(label: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Duration dataset:' }))
  fireEvent.click(screen.getByRole('option', { name: label }))
}
const mean = () => screen.getByText(/^Sample mean remediation time:/)

describe('duration records remain independent from inventory clicks', () => {
  it('compares unchanged, faster and slower declared records rather than iteration counts', () => {
    render(<InventoryLifecycleSimulator />)
    expect(mean()).toHaveTextContent('8.0 h')
    choose('Unchanged sample')
    expect(mean()).toHaveTextContent('8.0 h')
    choose('Faster sample')
    expect(mean()).toHaveTextContent('4.0 h')
    expect(screen.getByText(/Difference from the fixed fictional baseline/)).toHaveTextContent(
      '-4.0 h'
    )
    choose('Slower sample')
    expect(mean()).toHaveTextContent('12.0 h')
    expect(screen.getByText(/Difference from the fixed fictional baseline/)).toHaveTextContent(
      '4.0 h'
    )
    fireEvent.click(screen.getByRole('button', { name: 'Advance all →' }))
    fireEvent.click(screen.getByRole('button', { name: 'Reassess · next iteration' }))
    expect(screen.getByText('Iteration 2')).toBeInTheDocument()
    expect(mean()).toHaveTextContent('12.0 h')
    expect(
      screen.getByRole('spinbutton', { name: 'Fictional record 3 elapsed hours' })
    ).toHaveValue(18)
  })

  it('recalculates edited inputs and preserves zero without inventing a result for blanks', () => {
    render(<InventoryLifecycleSimulator />)
    const first = screen.getByRole('spinbutton', { name: 'Fictional record 1 elapsed hours' })
    fireEvent.change(first, { target: { value: '' } })
    expect(mean()).toHaveTextContent('Not assessed')
    expect(screen.getByText(/valid duration inputs/)).toHaveTextContent('2 / 3')
    expect(screen.getByRole('button', { name: 'Duration dataset:' })).toHaveTextContent(
      'Edited sample durations'
    )
    fireEvent.change(first, { target: { value: '-1' } })
    expect(mean()).toHaveTextContent('Not assessed')
    for (const input of screen.getAllByRole('spinbutton')) {
      fireEvent.change(input, { target: { value: '0' } })
    }
    expect(mean()).toHaveTextContent('0.0 h')
    expect(screen.getByText(/valid duration inputs/)).toHaveTextContent('3 / 3')
    expect(screen.queryByText(/Infinity|NaN/)).not.toBeInTheDocument()
    expect(screen.getByText(/This compares the declared records/)).toHaveTextContent(
      'does not establish that an intervention caused the change'
    )
  })
})
