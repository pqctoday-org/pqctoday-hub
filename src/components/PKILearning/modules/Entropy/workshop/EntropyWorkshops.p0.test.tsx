// SPDX-License-Identifier: GPL-3.0-only
//
// Render-level checks for the Entropy P0 remediation (2026-09-24):
// - the DRBG step's known-answer check runs the real HMAC_DRBG over the pinned
//   NIST vectors and reports the one-bit sabotage as NOT matching;
// - the Combining Sources step flags a failed raw source before conditioning
//   and its assessment can end in "Not enough evidence" or "Construction is
//   unsafe" — there is no "remains secure" conclusion.
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    phase: 'idle',
    error: null,
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    initialize: () => undefined,
  }),
}))

import { DrbgArchitectureDemo } from './DrbgArchitectureDemo'
import { SourceCombiningDemo } from './SourceCombiningDemo'

describe('DrbgArchitectureDemo — known-answer check', () => {
  it('matches all pinned NIST vectors and fails the sabotaged one', async () => {
    render(
      <MemoryRouter>
        <DrbgArchitectureDemo />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Run known-answer check/ }))
    const result = await screen.findByTestId('drbg-kat-result', {}, { timeout: 10000 })
    expect(result).toHaveTextContent('16/16 vectors matched byte for byte')
    expect(result).toHaveTextContent('Sabotage check passed')
  })

  it('no longer offers the XOR "CTR_DRBG" simulator', () => {
    render(
      <MemoryRouter>
        <DrbgArchitectureDemo />
      </MemoryRouter>
    )
    expect(screen.queryByText(/CTR_DRBG/)).toBeNull()
  })
})

describe('SourceCombiningDemo — raw-boundary health tests and assessment', () => {
  function renderDemo() {
    return render(
      <MemoryRouter>
        <SourceCombiningDemo />
      </MemoryRouter>
    )
  }

  it('flags a stuck source before conditioning and cannot conclude "secure"', async () => {
    renderDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Stuck source, detected' }))
    expect(await screen.findAllByText(/Failure signalled — samples excluded/)).toHaveLength(1)
    const verdict = screen.getByTestId('construction-verdict')
    expect(verdict).toHaveTextContent('Not enough evidence')
    expect(document.body.textContent?.toLowerCase()).not.toContain('remains secure')
  })

  it('conditioning a failed source ends in "Construction is unsafe"', async () => {
    renderDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Conditioned output from a failed source' }))
    await waitFor(() =>
      expect(screen.getByTestId('construction-verdict')).toHaveTextContent('Construction is unsafe')
    )
  })

  it('shows the malicious-cancellation XOR panel and an unsafe verdict', async () => {
    renderDemo()
    fireEvent.click(screen.getByRole('button', { name: 'Malicious cancellation' }))
    expect(await screen.findByText(/Attacker sets A = B/)).toBeInTheDocument()
    expect(screen.getByTestId('construction-verdict')).toHaveTextContent('Construction is unsafe')
  })
})
