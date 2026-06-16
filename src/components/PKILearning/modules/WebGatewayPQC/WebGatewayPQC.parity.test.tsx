// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the WebGatewayPQC ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * WebGatewayPQC adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { WebGatewayPQCModule } from './index'

describe('WebGatewayPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <WebGatewayPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (matches the manifest title)
    expect(screen.getByRole('heading', { name: 'Web Gateway PQC' })).toBeInTheDocument()
    // in-page description (the override slot)
    expect(screen.getByText(/PQC deployment at the infrastructure edge/)).toBeInTheDocument()
    // the standard six-tab set (triggers render as buttons)
    for (const name of [
      'Learn',
      'Visual',
      'Workshop',
      'Exercises',
      'References',
      'Tools & Products',
    ]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })
})
