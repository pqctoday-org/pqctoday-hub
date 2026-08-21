// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render test for the Decommissioning & Program Closure ModuleShell module —
 * asserts the header, the in-page description, and the standard six-tab set.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { VerificationClosureModule } from './index'

describe('Verification & Closure module render', () => {
  it('renders the header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <VerificationClosureModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Decommissioning & Program Closure' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Retire classical cryptography on a defensible schedule/)
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
