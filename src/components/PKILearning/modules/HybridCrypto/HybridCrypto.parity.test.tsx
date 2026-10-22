// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity golden test for the HybridCrypto ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after HybridCrypto
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HybridCryptoModule } from './index'
import { HybridCryptoIntroduction } from './components/HybridCryptoIntroduction'
import { content } from './content'

describe('HybridCrypto render parity', () => {
  it('renders the gradient header, the in-page description, and all six tabs', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HybridCryptoModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    // header title (the &amp; entity renders as a literal "&")
    expect(
      screen.getByRole('heading', { name: 'Hybrid & Composite Cryptography' })
    ).toBeInTheDocument()
    // in-page description differs from the catalog description (the override slot)
    expect(
      screen.getByText(/Combine classical and PQC algorithms for defense in depth/)
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

  it('keeps the corrected SP 800-227, randomness and side-channel explanations', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HybridCryptoIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByText(/Correct results alone do not show/)).toHaveTextContent(
      'they do not mean every call takes exactly the same number of milliseconds'
    )
    expect(screen.getByText(/If an attacker knows that input/)).toHaveTextContent(
      'recover the same shared secret'
    )
    expect(screen.getByText(/If a leak exposes only the X25519 shared secret/)).toHaveTextContent(
      'If the leak exposes both secrets or the final session key, that protection is lost'
    )
    expect(screen.getByText(/Do not assume every device has a switch/)).toBeInTheDocument()
    expect(screen.queryByText(/single most common real-world failure/)).not.toBeInTheDocument()
    expect(screen.queryByText(/§4.2 requires this for FIPS/)).not.toBeInTheDocument()
    expect(content.narratives?.nistRecommendation).toContain(
      'Compatibility with existing systems depends on the protocol'
    )
    expect(content.narratives?.nistRecommendation).not.toContain('backward compatibility')
  })
})
