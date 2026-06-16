// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render-parity golden test for the CryptoMgmtModernization ModuleShell
 * conversion (A2 hard tail). Captured against the PRE-conversion module; must
 * stay green after it adopts <ModuleShell> (learnRaw + visual + cswp39Step +
 * FC-held cbomAssets), proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { CryptoMgmtModernizationModule } from './index'

describe('CryptoMgmtModernization render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <CryptoMgmtModernizationModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Cryptographic Management Modernization' })
    ).toBeInTheDocument()
    // in-page <p> DIFFERS from the catalog description: it uses
    // ". Iterative. Measurable. ROI-positive" where the catalog uses an em-dash.
    // Matching this distinguishing phrase proves the description override slot.
    expect(screen.getByText(/Iterative\. Measurable\. ROI-positive/)).toBeInTheDocument()
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
