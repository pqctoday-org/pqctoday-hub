// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the EMVPaymentPQC ModuleShell conversion.
 * Captured against the PRE-conversion module; proves the ModuleShell
 * conversion is behaviour-preserving.
 *
 * UPDATED 2026-07-30: the title and in-page description are re-pinned because
 * the module deliberately grew from cards-only to the whole financial-services
 * estate (cards + banking + retail). The module id and route are unchanged —
 * only the copy moved, and this test exists to notice exactly that, so it is
 * re-pinned rather than loosened.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { EMVPaymentPQCModule } from './index'

describe('EMVPaymentPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <EMVPaymentPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(
      screen.getByRole('heading', { name: 'Financial Services & Payments PQC' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Card authentication, tokenization, authorization networks/)
    ).toBeInTheDocument()
    // the standard six-tab set (WS7: triggers expose role="tab")
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })
})
