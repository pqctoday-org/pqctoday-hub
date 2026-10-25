// SPDX-License-Identifier: AGPL-3.0-only
//
// The Related Products note on the Entropy Testing step points to the
// Compliance records for NIST entropy source validation (ESV) certificates,
// after the Migrate catalog sentence and before the "no standalone products" one.
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

vi.mock('@/components/shared/KatValidationPanel', () => ({
  KatValidationPanel: () => null,
}))

import { EntropyTestingDemo } from './EntropyTestingDemo'

describe('Entropy Testing - Related Products note', () => {
  it('links the entropy source validation certificates to the ESV records view', () => {
    render(
      <MemoryRouter>
        <EntropyTestingDemo />
      </MemoryRouter>
    )
    const note = screen.getByText(/Hardware entropy sources and HSMs/)
    const text = note.textContent ?? ''
    const migrate = text.indexOf('Migrate catalog')
    const esv = text.indexOf(
      'NIST entropy source validation certificates are listed under Compliance, Entropy (ESV).'
    )
    const standalone = text.indexOf('No standalone entropy-source products')
    expect(migrate).toBeGreaterThan(-1)
    expect(esv).toBeGreaterThan(migrate)
    expect(standalone).toBeGreaterThan(esv)
    expect(screen.getByRole('link', { name: 'Compliance, Entropy (ESV)' })).toHaveAttribute(
      'href',
      '/compliance?tab=records&rtab=esv'
    )
  })
})
