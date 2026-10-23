// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "What the lab tests" for SLH-DSA: the Learn tab, the module's rag-summary.md
 * and curious-summary.md, and the "For your role" line must say the same thing,
 * in the wording of the sources named in the panel (NIST ACVP draft for
 * SLH-DSA, FIPS 140-3 IG 10.3.A item 16, NIST CAVP overview, NSA CNSA 2.0 FAQ
 * version 2.2). The role line may only promise what the Known Answer panel runs.
 */
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { SLHDSAModule } from './index'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'
import { PERSONA_BLOCKS } from '@/data/personaBlocks'

/** One line of lower-case text with straight quotes, so JSX and markdown compare. */
const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase()

// Each fact is quoted from its source and appears in both the panel and the rag-summary.
const FACTS = [
  'Whether SLH-DSA or HashSLH-DSA are supported',
  'at least 10 tests for each combination of capabilities',
  'at least 13 tests for each combination',
  'that fresh seed values are used for fresh invocations of key generation',
  'they both share the same underlying cryptographic implementations, a CAST on either one of them is sufficient to meet the CAST requirements for both',
  'as the private key contains a copy of the public key',
  'may be limited to confirming the same key identifier (I in the case of LMS, SEED in the case of XMSS and PK.SEED for SLH-DSA) is shared by the resulting public and private key following generation',
  'Cryptographic algorithm validation is a prerequisite of cryptographic module validation',
  'is entirely black-box. The implementation is never provided to NIST or the CAVP',
  'is not part of CNSA and is not approved for any use in NSS',
]

describe('SLH-DSA: what the lab tests', () => {
  it('prints the panel and the CNSA caveat on the Learn tab, matching the rag-summary', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <SLHDSAModule />
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
    // the caveat sits next to the "Good fit" list
    expect(page).toContain('national security systems: this list does not apply')
  })

  it('no summary says CNSA 2.0 permits SLH-DSA', () => {
    for (const text of [flat(ragSummary), flat(curiousSummary)]) {
      expect(text).not.toContain('permits slh-dsa')
      expect(text).not.toContain('stateless alternative for signature use cases')
    }
    expect(flat(curiousSummary)).toContain('"is not approved for any use in nss"')
  })

  it('the "For your role" lines promise only what the Known Answer panel runs', () => {
    const blocks = PERSONA_BLOCKS['/learn/slh-dsa']
    for (const line of [blocks['cert-engineer']!, blocks.researcher!]) {
      expect(line).not.toMatch(/KAT tool/)
      expect(line).not.toMatch(/against the published vectors/)
      expect(line).toMatch(/eight published/)
      expect(line).toMatch(/functional round trips, not known-answer tests/)
    }
  })
})
