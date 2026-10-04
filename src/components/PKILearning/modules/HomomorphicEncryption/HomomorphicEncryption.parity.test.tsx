// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render test for the HomomorphicEncryption module (split out of
 * ConfidentialComputing, LM-076): header, description, the standard six tabs.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HomomorphicEncryptionModule } from './index'

describe('HomomorphicEncryption render', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HomomorphicEncryptionModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Homomorphic Encryption (FHE) & HSM Key Custody' })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Fully homomorphic encryption, the ISO\/IEC 28033 draft schemes/)
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
