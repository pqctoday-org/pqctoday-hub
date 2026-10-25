// SPDX-License-Identifier: AGPL-3.0-only
/**
 * An LMS public key is 24 bytes plus the hash output length m (RFC 8554 section 5.3:
 * u32str(type) || u32str(otstype) || I || T[1], with a 16-byte I): 56 bytes for the SHA-256
 * sets and 48 bytes for the SHA-256/192 sets. The Learn text, the exercise and the
 * rag-summary must not give 56 bytes for every parameter set.
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { StatefulSigsIntroduction } from './components/StatefulSigsIntroduction'
import { StatefulSigsExercises } from './components/StatefulSigsExercises'
import { lmsPublicKeyBytes } from './data/signatureSizes'
import ragSummary from './rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('StatefulSignatures: LMS public-key size', () => {
  const sha256 = lmsPublicKeyBytes(32)
  const sha256_192 = lmsPublicKeyBytes(24)

  it('the Learn text gives both sizes, from the RFC 8554 layout', () => {
    // jsdom has no scrollIntoView; the stepper calls it when a step is opened
    Element.prototype.scrollIntoView = vi.fn()
    render(
      <EmbedProvider>
        <MemoryRouter>
          <StatefulSigsIntroduction onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    fireEvent.click(screen.getByText('LMS/HSS & XMSS'))
    const item = screen.getByText(/Small public key/)
    expect(flat(item.textContent ?? '')).toContain(
      `Small public key: 24 bytes plus the hash output length – ${sha256_192} bytes for the SHA-256/192 sets, ${sha256} bytes for the SHA-256 sets`
    )
    expect(item.textContent).not.toMatch(/key: 56 bytes$/)
  })

  it('the exercise says the key size changes with the hash output length, not with H and W', () => {
    render(
      <MemoryRouter>
        <StatefulSigsExercises onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    )
    expect(flat(document.body.textContent ?? '')).toContain(
      `stays the same size as you change H and W (${sha256} bytes for these SHA-256 sets); it changes only with the hash output length`
    )
    expect(screen.queryByText(/regardless of parameters/)).not.toBeInTheDocument()
  })

  it('the rag-summary gives both sizes too', () => {
    expect(flat(ragSummary)).toContain(
      `public keys of 24 bytes plus the hash output length (${sha256_192} bytes for the SHA-256/192 sets, ${sha256} bytes for the SHA-256 sets)`
    )
    expect(flat(ragSummary)).not.toContain('56-byte public keys')
  })
})
