// SPDX-License-Identifier: AGPL-3.0-only
/**
 * "What the lab tests" and the vendor statements on the Learn tab: the Learn text and the
 * module's rag-summary.md must say the same thing, and the wordings below come from the
 * sources named on the page (FIPS 140-3 IG 10.3.A / D.S / C.N / 12.A, the CMVP Management
 * Manual 2.7, the CAVP overview page, ACVP drafts of 2 October 2026, NIST SP 800-140F, the
 * Security Policy of CMVP #4703, AWS CloudHSM documentation, Entrust Security World release
 * notes). A change here should be a change to a source line, not a paraphrase.
 */
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../embed/EmbedProvider'
import { HsmPqcIntroduction } from './components/HsmPqcIntroduction'
import { HsmPqcExercises } from './components/HsmPqcExercises'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

/** One line of lower-case text with straight quotes, so JSX and markdown compare. */
const flat = (s: string) =>
  s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase()

const SECTIONS = [
  'PKCS#11 v3.2 PQC Mechanisms',
  'On-Prem HSM PQC Deep Dive',
  'Cloud HSM PQC Deep Dive',
  'Side-Channel Attack Surfaces',
  'HSM Firmware Migration',
  'Stateful Signature State in HSMs',
]

// Each fact is quoted from its source and appears on the Learn tab and in the rag-summary.
const FACTS = [
  // AWS CloudHSM and the NIST Security Policy for CMVP #4703: both shown, neither preferred
  'Starting September 1, 2026, ML-DSA is available in FIPS mode for hsm2m.medium clusters.',
  'In FIPS mode, only Federal Information Processing Standard (FIPS) validated keys and algorithms can be used.',
  'ML-DSA (non-compliant)',
  'Key generation, sign, verify',
  'Key generation, Asymmetric key encapsulation and un-encapsulation',
  'The non-approved services will fail FIPS POLICY MISMATCH when partition is operated in the approved mode.',
  'CKM_CLOUDHSM_ML_DSA_KEY_PAIR_GEN',
  // Entrust nShield: the PKCS#11 interface trailed the firmware
  'currently only available via nCore',
  // side channels
  'No additional requirements at this time',
  'purposely designed, built and publicly documented to mitigate one or more specific attacks',
  'The use of fresh randomness during signing helps mitigate side-channel attacks',
  'should not be used on platforms where side-channel attacks are a concern and where they cannot be otherwise mitigated',
  'shall store the incremented leaf index value in nonvolatile storage before exporting a signature value or accepting another request to sign a message',
  // what the lab tests
  'Cryptographic algorithm validation is a prerequisite of cryptographic module validation.',
  'ACVTS testing is entirely black-box',
  'The IUT SHALL determine if the provided ek is valid based on [FIPS203] Section 7.2.',
  'An ACVP server will not test the zeroization of intermediate values, security strength of the deterministic random bit generators (DRBGs), or incorrect length signatures or public keys.',
  'ACVP does not test the inability of an implementation to export a private key.',
  'CAVP tests are undergoing development with testing available for LMS but not yet for XMSS, HSS, or XMSSMT.',
  'a product or implementation does not meet the FIPS 140 module validation requirements by simply implementing an Approved security function and acquiring validations for each of the implemented algorithms',
  "However, the module's certificate shall not include these algorithms as they do not claim any security",
  'The requirements of this IG apply prior to the first operational use of the cryptographic algorithm.',
  'but CASTs are NOT required (but are certainly permissible) prior to first time algorithm execution in the non-approved mode',
  'The ML-KEM decapsulation CASTs shall cover both the implicit rejection and (unnamed) non-rejection paths.',
  "ML-DSA digital signature generation CAST for either the 'hedged' or 'deterministic' algorithm (per FIPS 204 Section 5.2)",
  'Though not a CAST, a pairwise consistency test (PCT) shall be conducted for every generated public and private key pair',
  'prior to the first exportation of the seed or key pair or prior to the first operational use of the key pair after the seed has been generated within the module',
  'The module shall implement the encapsulation and decapsulation key checks specified in FIPS 203 Sections 7.2 and 7.3',
  'An updated version of a previously validated cryptographic module can be considered for a revalidation rather than a full validation',
  'shall be considered a new module and shall undergo a full validation testing by a CSTL and submitted as a FS',
  'Code or configuration changes are not permitted under this revalidation scenario.',
  'Changes shall not introduce new features or cryptography',
  'if less than a 30% of security changes were made to the module',
  'None of these, assessed individually, can exceed 30% of changes.',
  'may determine that the changes are >30% and shall be submitted as an FS',
]

const openIntroText = () => {
  render(
    <EmbedProvider>
      <MemoryRouter>
        <HsmPqcIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  for (const title of SECTIONS) fireEvent.click(screen.getByRole('heading', { name: title }))
  return flat(document.body.textContent ?? '')
}

describe('HsmPqc: what the lab tests and the vendor statements', () => {
  it('prints the panel and each quoted source line on the Learn tab and in the rag-summary', () => {
    const page = openIntroText()
    expect(screen.getByRole('heading', { name: 'What the lab tests' })).toBeInTheDocument()
    const rag = flat(ragSummary)
    for (const fact of FACTS) {
      expect(page, `Learn tab: ${fact}`).toContain(flat(fact))
      expect(rag, `rag-summary: ${fact}`).toContain(flat(fact))
    }
  })

  it('shows both AWS statements as unreconciled and keeps "FIPS mode" apart from "on the certificate"', () => {
    const page = openIntroText()
    expect(page).toContain('two statements we could not reconcile')
    expect(page).toContain('we show both statements and prefer neither')
    expect(page).toContain('different claims')
    const rag = flat(ragSummary)
    expect(rag).toContain('two statements are unreconciled')
    expect(rag).toContain('different claims')
  })

  it('states the nShield PKCS#11 exposure release by release', () => {
    const page = openIntroText()
    const rag = flat(ragSummary)
    expect(page).toContain(
      'ml-dsa from security world v13.9.0, ml-kem from v13.9.3, slh-dsa from v13.9.5'
    )
    expect(rag).toContain('v13.9.3 (12 december 2025) section 3.4 adds ml-kem to pkcs#11')
    expect(rag).toContain('v13.9.5 (24 april 2026) section 3.8 adds slh-dsa to pkcs#11')
  })

  it('no longer carries the unsourced absolute claims', () => {
    const page = openIntroText()
    for (const gone of [
      'all production hsms implement hedged signing',
      'thales luna, entrust nshield, and utimaco all implement this safety mechanism',
      'pqsdk v1.2.1',
      'broadest algorithm support',
      'primarily delivered through sdk updates',
      'hsm-backed pqc keys expected as algorithms mature',
      'titan chip provides physical security',
    ]) {
      expect(page).not.toContain(gone)
    }
  })

  it('the exercises say the same about hedged signing, nShield, AWS CloudHSM and the submission route', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HsmPqcExercises onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const t = flat(document.body.textContent ?? '')
    expect(t).toContain('is the default variant in fips 204 section 3.4')
    expect(t).not.toContain('enabled by default in all production hsms')
    expect(t).toContain('in v13.9.0 ml-kem and slh-dsa were ncore-only')
    expect(t).not.toContain('full cnsa 2.0 signature suite')
    expect(t).toContain('we have not found a document that reconciles the last two')
    expect(t).toContain('under 30%')
    expect(t).not.toContain('our own migrate catalogue records cavp ml-kem and ml-dsa validations')
  })

  it('the curious summary states the same split', () => {
    const c = flat(curiousSummary)
    expect(c).toContain('the two statements have not been reconciled')
    expect(c).toContain('none for hsm keys')
    expect(c).toContain('an update only if each category of security change stays under 30%')
    expect(c).toContain('security world v13.9.3')
  })
})
