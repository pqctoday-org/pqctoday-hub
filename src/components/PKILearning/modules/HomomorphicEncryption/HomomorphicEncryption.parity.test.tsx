// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render test for the HomomorphicEncryption module (split out of
 * ConfidentialComputing, LM-076): header, description, and the five useful tabs.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HomomorphicEncryptionModule } from './index'

describe('HomomorphicEncryption render', () => {
  it('renders the header, the in-page description, and no empty products tab', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HomomorphicEncryptionModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Homomorphic Encryption (FHE)' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Understand fully homomorphic encryption/)).toBeInTheDocument()
    for (const name of ['Learn', 'Visual', 'Workshop', 'Exercises', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
    expect(screen.queryByRole('tab', { name: 'Tools & Products' })).not.toBeInTheDocument()
  })
})
