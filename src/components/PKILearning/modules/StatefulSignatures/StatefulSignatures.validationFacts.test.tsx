// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "What the lab tests": the validation facts on the Learn tab, the module's
 * rag-summary.md and its curious-summary.md must say the same thing, and the
 * wordings below come from the sources named in the panel (NIST ACVP draft for
 * LMS, FIPS 140-3 IG 10.3.A / C.N / C.O, SP 800-208 section 8.1, NSA CNSA 2.0
 * FAQ version 2.2). A change here should be a change to a source line, not a
 * paraphrase.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { StatefulSignaturesModule } from './index'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

/** One line of lower-case text with straight quotes, so JSX and markdown compare. */
const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase()

// Each fact is quoted from its source and appears in both the panel and the rag-summary.
const FACTS = [
  'ACVP does not test the inability of an implementation to export a private key',
  'ACVP does not provide any guarantees on the inability to reuse private OTS pairs of an implementation',
  'available for LMS but not yet for XMSS, HSS, or XMSSMT',
  'the other schemes (including HSS) remain untestable by the CAVP as of the last modified date of this IG',
  'prior to the first operational use of the cryptographic algorithm',
  'It is also not necessary to test both LM-OTS + LMS modes',
  'Implementations of the key generation and signature algorithms in this document shall only be validated for use within hardware cryptographic modules',
  'exclusively apply to modules supporting HBS key generation and signature generation',
  'do not need to meet requirements from section 8.1',
  'importing private keys as a restore operation from a backup',
  'Documentation review in isolation is not sufficient',
  'All parameters approved for all classification levels. LMS SHA-256/192 is recommended.',
  'is not part of CNSA and is not approved for any use in NSS',
  'If your product is only verifying signatures, CAVP testing is all that is required.',
  "which requires hardware validated by NIST's Cryptographic Module Validation Program (CMVP), or via other NSA guidance. Waivers for this will not be granted.",
  'the only part NSA will validate is that the signature verification code on the device passes CAVP',
  'only CAVP validation (not CMVP) will be expected to meet CNSA 2.0 for such products',
]

describe('StatefulSignatures: what the lab tests', () => {
  it('prints the panel on the Learn tab, with each quoted source line', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <StatefulSignaturesModule />
        </MemoryRouter>
      </EmbedProvider>
    )
    expect(screen.getByRole('heading', { name: 'What the lab tests' })).toBeInTheDocument()
    const page = flat(document.body.textContent ?? '')
    const rag = flat(ragSummary)
    for (const fact of FACTS) {
      expect(page, `Learn tab: ${fact}`).toContain(flat(fact))
      expect(rag, `rag-summary: ${fact}`).toContain(flat(fact))
    }
    // The XMSS wording is the same in both, and the page does not overclaim.
    expect(page).toContain('no acvp specification is published for them')
    expect(rag).toContain('no acvp specification is published for them')
    expect(page).toContain(
      'acvp has an lms specification with three modes: keygen, siggen and sigver'
    )
    expect(rag).toContain('keygen, siggen and sigver')
  })

  it('the curious summary states the same split', () => {
    const c = flat(curiousSummary)
    expect(c).toContain('no acvp specification for xmss, xmss^mt or hss')
    expect(c).toContain(
      'a product that only verifies signatures needs algorithm testing (cavp) alone'
    )
    expect(c).toContain('cmvp-validated hardware, with no waivers')
    expect(c).toContain('not hss or xmss^mt')
  })
})
