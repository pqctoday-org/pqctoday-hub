// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react'
import { AlgorithmFamilyWorkshop } from './AlgorithmFamilyWorkshop'

const flat = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ')
const search = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Search the 64 displayed points' }))
function received() {
  const bits = screen.getAllByLabelText(/^encoded bit /)
  expect(bits).toHaveLength(24)
  return bits.map((bit) => Number(bit.textContent))
}
function majority(bits: number[]) {
  return Array.from({ length: 8 }, (_, i) =>
    bits.slice(i * 3, i * 3 + 3).reduce((a, b) => a + b, 0) >= 2 ? 1 : 0
  ).join('')
}
describe('Actual foundational workshop enumerations', () => {
  it('executes the visible finite-grid inputs and invalidates results on dimension/noise/target changes', async () => {
    render(<AlgorithmFamilyWorkshop />)
    fireEvent.change(screen.getByRole('slider', { name: 'Noise level' }), {
      target: { value: '0' },
    })
    search()
    expect(flat(screen.getByRole('status'))).toContain('Candidates visited: 64')
    expect(flat(screen.getByRole('status'))).toContain('Coordinate checks: 128 (2 per candidate)')
    expect(flat(screen.getByRole('status'))).toContain(
      'Minimum squared distance (display units²): 0'
    )
    const target = screen.getByLabelText('Toy target coordinates').textContent
    fireEvent.click(screen.getByRole('button', { name: '256D' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    search()
    expect(flat(screen.getByRole('status'))).toContain('Candidates visited: 64')
    expect(flat(screen.getByRole('status'))).toContain(
      'Coordinate checks: 16384 (256 per candidate)'
    )
    expect(flat(screen.getByRole('status'))).toContain(
      'Minimum squared distance (display units²): 0'
    )
    expect(screen.getByLabelText('Toy target coordinates')).toHaveTextContent(target ?? '')
    fireEvent.change(screen.getByRole('slider', { name: 'Noise level' }), {
      target: { value: '1' },
    })
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    const [x, y] = (screen.getByLabelText('Toy target coordinates').textContent ?? '')
      .split(',')
      .map(Number)
    // Independent oracle: nearest finite point per coordinate, rather than product helper.
    const distance =
      Math.min(...Array.from({ length: 8 }, (_, i) => (x - (i + 0.5) * 12.5) ** 2)) +
      Math.min(...Array.from({ length: 8 }, (_, i) => (y - (i + 0.5) * 12.5) ** 2))
    expect(distance).toBeGreaterThan(0)
    search()
    expect(flat(screen.getByRole('status'))).toContain(
      `Minimum squared distance (display units²): ${distance}`
    )
    fireEvent.click(screen.getByRole('button', { name: 'Randomize Target' }))
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Toy target coordinates').textContent).not.toBe(`${x}, ${y}`)
    await waitFor(() => expect(screen.getByText(/candidate count stays 64/)).toBeVisible())
  })
  it('runs the actual public decoder on visible bits, including recovery, failed recovery and reset', async () => {
    render(<AlgorithmFamilyWorkshop />)
    fireEvent.click(screen.getByText('Code-Based'))
    fireEvent.click(screen.getByRole('button', { name: 'Encode with Redundancy' }))
    const decoded = () => screen.getByLabelText('Executed public toy decoders')
    expect(flat(decoded())).toContain('Public majority-decoder output: 10110010')
    for (const count of ['1', '8', '0']) {
      fireEvent.change(screen.getByRole('slider', { name: 'Error injection count' }), {
        target: { value: count },
      })
      const bits = received()
      const actual = majority(bits)
      expect(flat(decoded())).toContain(`Public majority-decoder output: ${actual}`)
      expect(flat(decoded())).toContain(`Nearest candidate message: ${actual}`)
      expect(flat(decoded())).toContain('Exhaustive candidate messages visited: 256')
      expect(flat(decoded())).toContain('Bit comparisons: 6144')
      expect(flat(decoded())).toContain('Majority-decoder bit reads: 24')
      await waitFor(() =>
        expect(
          within(decoded()).getByText(
            actual === '10110010'
              ? 'The decoded message matches the original.'
              : /The decoded message differs from the original/
          )
        ).toBeVisible()
      )
      if (count === '1') expect(actual).toBe('10110010')
      if (count === '8') expect(actual).not.toBe('10110010')
      if (count === '0') expect(actual).toBe('10110010')
    }
    expect(screen.queryByText(/C\(24,/)).not.toBeInTheDocument()
  })
})
