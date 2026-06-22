// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the DatabaseEncryptionPQC ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after
 * DatabaseEncryptionPQC adopts <ModuleShell>, proving the conversion is
 * behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { DatabaseEncryptionPQCModule } from './index'

describe('DatabaseEncryptionPQC render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <DatabaseEncryptionPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity &amp; in source only)
    expect(screen.getByRole('heading', { name: 'Database Encryption & PQC' })).toBeInTheDocument()
    // in-page description (stable substring)
    expect(
      screen.getByText(/Migrate database encryption to quantum-safe algorithms/)
    ).toBeInTheDocument()
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
