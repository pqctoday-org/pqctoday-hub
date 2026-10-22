// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity golden test for the Entropy ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after Entropy
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { EntropyModule } from './index'
import { EntropyIntroduction } from './components/EntropyIntroduction'

describe('Entropy render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <EntropyModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (renders the literal "&" — JSX entity in source only)
    expect(screen.getByRole('heading', { name: 'Entropy & Randomness' })).toBeInTheDocument()
    // in-page description (a stable substring of the override slot)
    expect(
      screen.getByText(/Entropy sources, SP 800-90A DRBGs, SP 800-90B entropy-source validation/)
    ).toBeInTheDocument()
    // the standard six-tab set (WS7: triggers expose role="tab")
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

  it('distinguishes input length from generator strength and the two ML-DSA inputs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <EntropyIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByTestId('pqc-length-example')).toHaveTextContent(
      'at least 192-bit security strength for ML-KEM-768'
    )
    const twoInputs = screen.getByTestId('mldsa-two-inputs')
    expect(twoInputs).toHaveTextContent('at least 192-bit strength for ML-DSA-65')
    expect(twoInputs).toHaveTextContent('generated inside the signing module (§5.4)')
    expect(twoInputs).toHaveTextContent('does not apply to key generation')
    expect(
      screen.queryByText(/signing randomness has no mandatory strength at all/)
    ).not.toBeInTheDocument()
  })
})
