// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render test for the CBOM ModuleShell module — asserts the gradient header,
 * the in-page description, and the standard six-tab set all render.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CbomModule } from './index'

describe('CBOM module render', () => {
  it('renders the header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CbomModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Cryptography Bill of Materials (CBOM)' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Choose a format, discover all your cryptography/)).toBeInTheDocument()
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
