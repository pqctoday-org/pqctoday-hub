// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity test for the OTPQC module shell. Originally the golden for
 * the Energy & Utilities ModuleShell conversion; updated 2026-10-01 for the
 * IoT/OT split (ot-pqc, "OT & Industrial Control Systems PQC").
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { OTPQCModule } from './index'

describe('OTPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <OTPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(
      screen.getByRole('heading', { name: 'OT & Industrial Control Systems PQC' })
    ).toBeInTheDocument()
    // in-page description (stable substring)
    expect(
      screen.getByText(/PQC for operational technology across energy, water, rail/)
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
