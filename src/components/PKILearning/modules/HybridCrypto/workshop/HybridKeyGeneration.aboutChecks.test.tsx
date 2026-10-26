// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The "About these checks" note under the Hybrid Key Generation known-answer area says what
 * NIST publishes for hybrid key exchange. The CAVP prerequisites page (updated 22 September
 * 2026) lists X-Wing keyGen and encapDecap tests, but the ACVP specification index and the
 * ACVP sample set carry no hybrid KEM, so the note must not say that NIST's ACVP does not
 * cover hybrids at all.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: false,
    initialize: vi.fn(),
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
  }),
}))

import { HybridKeyGeneration } from './HybridKeyGeneration'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('Hybrid Key Generation: About these checks', () => {
  it('names the X-Wing tests on the CAVP prerequisites page and says X25519MLKEM768 has none', () => {
    render(<HybridKeyGeneration />)
    const note = flat(screen.getByText(/About these checks:/).closest('p')?.textContent ?? '')
    expect(note).toContain(
      'the CAVP prerequisites page (updated 22 September 2026) lists X-Wing keyGen and encapDecap tests but no test for X25519MLKEM768'
    )
    expect(note).not.toContain('NIST publishes no ACVP specification')
    expect(note).toContain('the ML-KEM checks use NIST’s published samples')
    expect(note).not.toContain('ACVP does not yet cover hybrids')
  })
})
