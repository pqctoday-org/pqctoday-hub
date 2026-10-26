// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The table of random inputs and RBG rules for FIPS 203, 204 and 205 must read on a phone: below
 * 640 px each operation is a stacked block with its column headings as labels, from 640 px up it is
 * a table. jsdom does not apply Tailwind, so these assertions pin the markup and classes that
 * produce that layout, not the pixels.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EntropyIntroduction } from './components/EntropyIntroduction'
import { PQC_RANDOM_INPUTS } from './utils/pqcRandomInputs'

const renderIntro = () =>
  render(
    <MemoryRouter>
      <EntropyIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )

describe('Entropy Learn tab: random-input table on a phone', () => {
  it('has a stacked twin with one block per operation, shown only below 640 px', () => {
    renderIntro()
    const stacked = screen.getByTestId('pqc-random-input-table-stacked')
    expect(stacked).toHaveClass('sm:hidden')
    expect(within(stacked).getAllByRole('listitem')).toHaveLength(PQC_RANDOM_INPUTS.length)
    // Every value after the operation sits under its own column heading.
    expect(
      within(stacked)
        .getAllByRole('term')
        .map((t) => t.textContent)
        .slice(0, 4)
    ).toEqual(['Random input', 'Length', 'RBG rule', 'Source'])
    expect(within(stacked).getAllByRole('term')).toHaveLength(PQC_RANDOM_INPUTS.length * 4)
  })

  it('shows the RBG rule and the source of every operation in the stacked blocks', () => {
    renderIntro()
    const stacked = within(screen.getByTestId('pqc-random-input-table-stacked'))
    for (const row of PQC_RANDOM_INPUTS) {
      expect(stacked.getByText(row.operation)).toBeInTheDocument()
      expect(stacked.getAllByText(row.ruleSummary).length).toBeGreaterThan(0)
      for (const section of new Set(row.sources.map((s) => s.section))) {
        expect(stacked.getAllByText(section).length).toBeGreaterThan(0)
      }
    }
  })

  it('keeps all five columns in the table from 640 px up, in a wrapper hidden on a phone', () => {
    renderIntro()
    const wrap = screen.getByTestId('pqc-random-input-table-table')
    expect(wrap).toHaveClass('hidden', 'sm:block')
    const table = within(within(wrap).getByRole('table'))
    expect(table.getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'Operation',
      'Random input',
      'Length',
      'RBG rule',
      'Source',
    ])
    expect(table.getAllByRole('row')).toHaveLength(PQC_RANDOM_INPUTS.length + 1)
  })
})
