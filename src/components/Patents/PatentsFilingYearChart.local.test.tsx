// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PatentsFilingYearChart } from './PatentsFilingYearChart'
import type { PatentItem } from '@/types/PatentTypes'
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  BarChart: ({ data, children }: { data: unknown; children: ReactNode }) => (
    <div>
      <output aria-label="Plotted year bins">{JSON.stringify(data)}</output>
      {children}
    </div>
  ),
  Bar: () => null,
  Cell: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
}))
const sample = (filingYear: number, pqc = false) =>
  ({
    filingYear,
    pqcAlgorithms: pqc ? ['ML-KEM'] : [],
    cryptoAgilityMode: pqc ? 'pqc_only' : 'classical_only',
  }) as PatentItem
const bins = () =>
  JSON.parse(screen.getByLabelText('Plotted year bins').textContent!) as {
    year: number
    pqc: number
    classical: number
  }[]
describe('Filing-year chart counts its plotted catalogue scope', () => {
  it('distinguishes known-year records from missing or invalid years in headline and series', () => {
    render(
      <PatentsFilingYearChart
        patents={[
          sample(2020, true),
          sample(2021),
          sample(0),
          sample(Number.NaN),
          sample(Number.POSITIVE_INFINITY),
        ]}
      />
    )
    expect(screen.getByText(/2 catalogue records with filing year/)).toHaveTextContent('2020–2021')
    expect(
      screen.getByText(/3 selected catalogue records have no usable filing year/)
    ).toBeInTheDocument()
    expect(bins()).toEqual([
      { year: 2020, pqc: 1, classical: 0 },
      { year: 2021, pqc: 0, classical: 1 },
    ])
    expect(bins().reduce((sum, row) => sum + row.pqc + row.classical, 0)).toBe(2)
  })
  it('keeps all-unplottable selected records visible as unknown rather than hiding the chart scope', () => {
    render(<PatentsFilingYearChart patents={[sample(0)]} />)
    expect(screen.getByText(/0 catalogue records with filing year/)).toBeInTheDocument()
    expect(
      screen.getByText(/1 selected catalogue record has no usable filing year/)
    ).toBeInTheDocument()
    expect(
      screen.getByText('No usable filing years in the selected catalogue records.')
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Plotted year bins')).not.toBeInTheDocument()
  })
  it('reconciles multiple records in one year and an unoccupied year without changing classification', () => {
    render(
      <PatentsFilingYearChart patents={[sample(2020, true), sample(2020), sample(2022, true)]} />
    )
    expect(screen.getByText(/3 catalogue records with filing year/)).toBeInTheDocument()
    expect(bins()).toEqual([
      { year: 2020, pqc: 1, classical: 1 },
      { year: 2021, pqc: 0, classical: 0 },
      { year: 2022, pqc: 1, classical: 0 },
    ])
    expect(bins().reduce((sum, row) => sum + row.pqc + row.classical, 0)).toBe(3)
    expect(screen.queryByText(/excluded from the chart/)).not.toBeInTheDocument()
  })
})
