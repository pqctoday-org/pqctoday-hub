// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { NoRegretROIBuilder } from './NoRegretROIBuilder'

const usd = (text: string) => Number(text.replace(/[$,]/g, ''))
const rows = () =>
  Array.from(screen.getByRole('table').querySelectorAll('tbody tr')).map((row) =>
    within(row as HTMLElement)
      .getAllByRole('cell')
      .map((cell) => usd(cell.textContent ?? ''))
  )

describe('inspectable ROI cashflow schedule', () => {
  it('separates annual labour/outage from a single horizon stock and reconciles totals', () => {
    render(<NoRegretROIBuilder />)
    const annual = 6_527_400 + 2_639_569 * 0.74 + 1_200_000 + 744_000 + 1_400_000
    const values = rows()
    expect(values).toHaveLength(3)
    expect(values.map((row) => row.at(1))).toEqual([0, 0, 12_000_000])
    for (const row of values) {
      expect(row.at(0)).toBeCloseTo(annual, 2)
      expect(row.at(2)).toBe(1_800_000)
    }
    expect(values.reduce((sum, row) => sum + (row.at(4) ?? 0), 0)).toBeCloseTo(
      annual * 3 + 12_000_000 - 5_400_000,
      2
    )
    expect(
      within(screen.getByRole('region', { name: 'Scenario B results' })).getByText('$12.0M once')
    ).toBeInTheDocument()
  })
  it('extends recurring flows, caps finite M&A savings and leaves the stock unchanged', () => {
    render(<NoRegretROIBuilder />)
    fireEvent.change(screen.getByRole('slider', { name: 'Horizon' }), { target: { value: '6' } })
    const values = rows()
    expect(values).toHaveLength(6)
    expect(values.map((row) => row.at(1))).toEqual([0, 0, 0, 0, 0, 12_000_000])
    expect((values.at(2)?.at(0) ?? 0) - (values.at(3)?.at(0) ?? 0)).toBe(1_400_000)
    expect(values.reduce((sum, row) => sum + (row.at(0) ?? 0), 0)).toBeCloseTo(
      (6_527_400 + 2_639_569 * 0.74 + 1_200_000 + 744_000) * 6 + 4_200_000,
      2
    )
  })
  it('makes both cases identical when horizon probability is zero', () => {
    render(<NoRegretROIBuilder />)
    fireEvent.change(screen.getByRole('slider', { name: 'P(CRQC within horizon)' }), {
      target: { value: '0' },
    })
    for (const row of rows()) {
      expect(row.at(1)).toBe(0)
      expect(row.at(3)).toBe(row.at(4))
    }
  })
  it('exposes the exact annual labour benchmark without blending incident savings', () => {
    render(<NoRegretROIBuilder />)
    const heading = screen.getByText('CLM automation labor savings')
    const card = heading.closest('div.rounded-lg')
    if (!(card instanceof HTMLElement)) throw new Error('Missing CLM model card')
    fireEvent.click(within(card).getByRole('button', { name: 'Show math' }))
    expect(
      within(card).getByRole('slider', { name: 'Annual renewal-labour benchmark' })
    ).toHaveValue('2639569')
    expect(
      within(card).getByText(/excludes its incident, revenue and legacy-tool savings/)
    ).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: /Forrester TEI/ })).toHaveAttribute(
      'href',
      'https://tei.forrester.com/go/DigiCert/DigiCertONE/index.html'
    )
  })
  it('shows a loss and no crossover when costs exceed the operational benefit case', () => {
    render(<NoRegretROIBuilder />)
    for (const button of screen.getAllByRole('button', { name: 'Show math' }))
      fireEvent.click(button)
    for (const name of ['FTE count', 'Fully-loaded cost per FTE']) {
      const control = screen.getByRole('slider', { name })
      fireEvent.change(control, { target: { value: control.getAttribute('max') } })
    }
    fireEvent.change(screen.getByRole('slider', { name: 'Avoidance factor' }), {
      target: { value: '0' },
    })
    const output = within(screen.getByRole('region', { name: 'Scenario A results' }))
    expect(output.getByText(/^-\d+%$/)).toBeInTheDocument()
    expect(output.getByText('No crossover within horizon')).toBeInTheDocument()
    expect(rows().every((row) => (row.at(3) ?? 0) < 0)).toBe(true)
  })
})
