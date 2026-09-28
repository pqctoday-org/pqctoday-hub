// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity smoke test for the PQCHardwareAcceleration module, mirroring
 * the pattern every other ModuleShell-based module uses.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { PQCHardwareAccelerationModule } from './index'

describe('PQCHardwareAccelerationModule render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <PQCHardwareAccelerationModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'PQC Hardware Acceleration' })).toBeInTheDocument()
    expect(
      screen.getByText(/How post-quantum signatures are accelerated on CPUs, GPUs, FPGAs/)
    ).toBeInTheDocument()
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
