// SPDX-License-Identifier: GPL-3.0-only
/**
 * Render + grounding checks for the Trust Services module.
 *
 * The supersession pairs are this module's spine and its most perishable
 * content — the whole argument is "the newer edition added PQC", which stops
 * being true the moment a newer edition again supersedes it. Pinning the
 * claims means a future edit has to update the assertion deliberately.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { TrustServicesPQCModule } from './index'
import manifest from './manifest'
import { SUPERSESSION_PAIRS, HYBRID_SUITES } from './data/trustServicesData'

describe('TrustServicesPQC', () => {
  it('renders the module header and the standard tab set', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <TrustServicesPQCModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(
      screen.getByRole('heading', { name: 'Trust Services & Long-Term Signatures' })
    ).toBeInTheDocument()
    for (const name of ['Learn', 'Workshop', 'References']) {
      expect(screen.getByRole('tab', { name })).toBeInTheDocument()
    }
  })

  it('is registered in the Industries track', () => {
    expect(manifest.track).toBe('Industries')
    expect(manifest.id).toBe('trust-services-pqc')
  })

  it('every supersession pair moves from classical-only to a PQC-bearing edition', () => {
    // Verified 2026-07-30 by extracting both PDFs: TS 119 312 V1.5.1 names
    // only RSA and ECDSA; V2.1.1 adds ML-DSA, SLH-DSA, LMS and XMSS.
    for (const p of SUPERSESSION_PAIRS) {
      expect(p.older.algorithms, p.family).not.toMatch(/ML-DSA|SLH-DSA/)
      expect(p.newer.date, p.family).toBeTruthy()
    }
    const suites = SUPERSESSION_PAIRS.find((p) => p.family.includes('119 312'))
    expect(suites?.newer.label).toBe('V2.1.1')
    expect(suites?.newer.algorithms).toMatch(/ML-DSA/)
    expect(suites?.older.label).toBe('V1.5.1')
  })

  it('pairs every hybrid suite with a post-quantum component', () => {
    // ETSI's rule is that a hybrid combines a classical AND a post-quantum
    // signature, with both required valid — a table row missing one half would
    // be a transcription error, not a valid suite.
    expect(HYBRID_SUITES.length).toBeGreaterThan(0)
    for (const h of HYBRID_SUITES) {
      expect(h.classical, h.useCase).toBeTruthy()
      expect(h.pqc, h.useCase).toMatch(/ML-DSA|SLH-DSA/)
    }
  })
})
