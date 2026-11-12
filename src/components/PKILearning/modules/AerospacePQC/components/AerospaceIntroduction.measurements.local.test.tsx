// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EmbedProvider } from '@/embed/EmbedProvider'
import { AerospaceIntroduction } from './AerospaceIntroduction'

vi.mock('@/components/PKILearning/common/LearnSection', () => ({
  LearnSection: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section aria-label={title}>{children}</section>
  ),
}))

// Independent expected values: pqm4 published speed/stack records at
// 7a629261b9cb0c463ff4907255b092a6e2ff4ec4/results/{speed,stack}/ml-dsa.md.
// Speed source b6ec2a12; stack source 481b2e30. These are distinct builds.
const expected = [
  { implementation: 'm4f', mean: 1420317, max: 1420929, stack: 8912 },
  { implementation: 'm4fstack', mean: 3259593, max: 3295621, stack: 2712 },
]
const number = (value: number) => value.toLocaleString('en-US')
function example() {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <AerospaceIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    </EmbedProvider>
  )
}

describe('Aerospace measured verification example', () => {
  it('renders published operation counts and derives milliseconds at the measured 20 MHz', () => {
    example()
    const table = screen.getByRole('table', { name: /Published speed run/ })
    for (const sample of expected) {
      const row = within(table)
        .getAllByRole('row')
        .find((candidate) =>
          within(candidate).queryByRole('rowheader', { name: sample.implementation })
        )!
      const cells = within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
      expect(cells).toEqual([
        `${number(sample.mean)}${number(sample.max)}`,
        `${(sample.mean / 20000).toFixed(2)} / ${(sample.max / 20000).toFixed(2)}`,
      ])
    }
    // An independent 100 ms operation budget distinguishes the implementations.
    expect(expected.map(({ max }) => max <= 100 * 20000)).toEqual([true, false])
    expect(screen.getByText(/For a fictional 100 ms crypto-only/).textContent).toMatch(
      /m4f observed maximum is below the budget; m4fstack exceeds/
    )
  })

  it('keeps the separate stack measurement distinct from total RAM and the speed binary', () => {
    example()
    const table = screen.getByRole('table', { name: /Separate published stack run/ })
    for (const sample of expected) {
      const row = within(table)
        .getAllByRole('row')
        .find((candidate) =>
          within(candidate).queryByRole('rowheader', { name: sample.implementation })
        )!
      expect(within(row).getByRole('cell').textContent).toBe(number(sample.stack))
    }
    expect(screen.getByText(/Separate published stack run/).textContent).toContain(
      'not measurements of the speed run'
    )
    expect(screen.getByText(/Stack bytes alone are not total RAM/)).toBeTruthy()
  })

  it('links both published records and identifies the measured platform instead of asserting space-processor fit', () => {
    example()
    const links = screen
      .getAllByRole('link')
      .filter((link) => /results\/(speed|stack)\/ml-dsa.md/.test(link.getAttribute('href') ?? ''))
    expect(links).toHaveLength(2)
    for (const link of links)
      expect(link.getAttribute('href')).toContain('/7a629261b9cb0c463ff4907255b092a6e2ff4ec4/')
    expect(screen.getByText(/NUCLEO-L4R5ZI/)).toBeTruthy()
    expect(screen.queryByText(/Vorago class.*only run hash-based signatures/)).toBeNull()
    expect(
      screen.getByText(/An observed maximum over 100 executions is not a worst-case/)
    ).toBeTruthy()
  })
})
