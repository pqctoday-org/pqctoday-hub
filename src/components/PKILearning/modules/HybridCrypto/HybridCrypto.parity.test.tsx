// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Render-parity golden test for the HybridCrypto ModuleShell conversion.
 * Captured against the PRE-conversion module; must stay green after HybridCrypto
 * adopts <ModuleShell>, proving the conversion is behaviour-preserving.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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

  it('explains when a hybrid KEM is an approved service in a validated module (IG D.S)', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HybridCryptoIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const callout = screen.getByTestId('ig-ds-callout')
    expect(
      screen.getByRole('heading', { name: 'Hybrid in a validated module (IG D.S)' })
    ).toBeInTheDocument()
    // the five conditions, the non-approved half, and the Security Policy labels
    expect(callout).toHaveTextContent('at a minimum, all of them')
    expect(callout).toHaveTextContent('control the sequencing')
    expect(callout).toHaveTextContent('non-approved but allowed algorithm with no security claimed')
    expect(callout).toHaveTextContent(
      "The hybrid's claimed security strength comes from the ML-KEM"
    )
    expect(callout).toHaveTextContent('KEM-Hybrid-Full')
    // X-Wing: the IG statement and the separate CAVP listing are both stated, each with its source
    expect(callout).toHaveTextContent('cannot yet meet the requirements of Scenario 2')
    expect(callout).toHaveTextContent('CAVP prerequisites page')
    expect(callout).toHaveTextContent('IG 10.3.A')
    // IG 1.B (firmware plus hardware) must not be confused with hybrid key exchange
    expect(callout).toHaveTextContent('IG 1.B')
    expect(callout).toHaveTextContent('nothing to do with hybrid key exchange')
    expect(
      within(callout).getByRole('link', { name: 'FIPS 140-3 Certification module' })
    ).toHaveAttribute('href', '/learn/fips-140-3-certification')
  })

  it('says the IG is silent on composite signatures, in a note after the IG D.S callout', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HybridCryptoIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const callout = screen.getByTestId('ig-ds-callout')
    const note = screen.getByTestId('ig-signatures-note')
    // sits after the callout, not inside it
    expect(callout).not.toContainElement(note)
    expect(callout.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(note).toHaveTextContent('IG D.S covers key encapsulation only.')
    expect(note).toHaveTextContent(
      'The IG (last updated 19 August 2026) has no section on composite'
    )
    expect(note).toHaveTextContent('its only use of the word hybrid is for hybrid modules (IG 1.B)')
    expect(note).toHaveTextContent('needs the self-tests of IG 10.3.A')
    expect(note).toHaveTextContent('is not answered in the published guidance; ask the lab.')
  })
})
