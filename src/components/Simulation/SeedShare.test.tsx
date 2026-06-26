// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SeedShare } from './SeedShare'
import { useSimulationStore } from '@/store/useSimulationStore'
import { encodeScenario } from './scenarioCode'

describe('SeedShare (PR7)', () => {
  beforeEach(() => useSimulationStore.getState().setSeed(123456))

  it('shows the current run as a scenario code', () => {
    render(<SeedShare />)
    expect(screen.getByText(encodeScenario(123456))).toBeInTheDocument()
  })

  it('loading a pasted code sets the seed (reproducible run)', () => {
    render(<SeedShare />)
    const input = screen.getByLabelText(/Load a scenario code/i)
    fireEvent.change(input, { target: { value: encodeScenario(999) } })
    fireEvent.click(screen.getByRole('button', { name: /Load scenario code/i }))
    expect(useSimulationStore.getState().seed).toBe(999)
  })

  it('disables Load for an empty or malformed code', () => {
    render(<SeedShare />)
    const loadBtn = screen.getByRole('button', { name: /Load scenario code/i })
    expect(loadBtn).toBeDisabled() // empty
    fireEvent.change(screen.getByLabelText(/Load a scenario code/i), {
      target: { value: '!!!' },
    })
    expect(loadBtn).toBeDisabled() // malformed
  })
})
