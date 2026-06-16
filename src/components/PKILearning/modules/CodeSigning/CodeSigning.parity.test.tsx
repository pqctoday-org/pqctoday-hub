// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the CodeSigning ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after CodeSigning
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CodeSigningModule } from './index'

describe('CodeSigning render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CodeSigningModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only); the
    // in-page <h1> ("Code Signing & Supply Chain Security") differs from the
    // manifest title ("Code Signing"), so it is supplied via the title slot.
    expect(
      screen.getByRole('heading', { name: 'Code Signing & Supply Chain Security' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(screen.getByText(/Protect software distribution/)).toBeInTheDocument()
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
