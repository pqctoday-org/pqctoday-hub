// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the EmailSigning ModuleShell conversion (A2
 * hard tail). Captured against the PRE-conversion module. NOTE: this module's
 * workshop is standardized to the shared stepper on conversion, so it GAINS the
 * standard step-circle bar (it was the outlier omitting it) — a deliberate
 * consistency normalization. This test pins the parts that MUST stay identical:
 * the (overridden) h1, the in-page description, and the standard 6-tab set.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { EmailSigningModule } from './index'

describe('EmailSigning render parity', () => {
  it('renders the (overridden) header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <EmailSigningModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // h1 differs from manifest.title ("Email & Document Signing") — override slot.
    // the &amp; entity renders as a literal &.
    expect(
      screen.getByRole('heading', { name: 'Email & Document Signing (S/MIME, CMS)' })
    ).toBeInTheDocument()
    // in-page <p> differs from the catalog description ("S/MIME and CMS: signing
    // workflows ...") — matching this proves the description override.
    expect(
      screen.getByText(/Master CMS structures for email signing and encryption/)
    ).toBeInTheDocument()
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
