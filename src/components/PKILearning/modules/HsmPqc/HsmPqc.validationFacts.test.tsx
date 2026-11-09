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
import { PKCS11_MECHANISMS } from './data/hsmConstants'
import { HSM_PKCS11_OPERATIONS, HSM_VENDORS } from './data/hsmVendorData'
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

  it("names the Utimaco product and its post-quantum package as Utimaco's own pages do", () => {
    const page = openIntroText()
    expect(page).toContain('utimaco u.trust gp hsm se-series (pcie;')
    expect(page).toContain('utimaco u.trust gp hsm se-series (quantum protect)')
    expect(page).toContain('quantum protect firmware module')
    for (const gone of ['utimaco securityserver', 'q-safe']) {
      expect(page).not.toContain(gone)
    }
  })

  it('does not attach the CryptoServer Se-Series Gen2 certificate to the u.trust Se-Series name', () => {
    const page = openIntroText()
    // The CMVP lists certificate #3925 under the CryptoServer name. Nothing the module cites
    // says the u.trust GP HSM Se-Series is the same product, so the page may say where the
    // certificate is listed but not that this product holds it.
    expect(page).toContain('under the product name cryptoserver se-series gen2')
    expect(page).toContain(
      'has not established that the certificate covers the u.trust gp hsm se-series'
    )
    expect(page).not.toContain('se-series (pcie, fips 140-2')
    expect(page).not.toContain('fips 140-2 level 3 (cert #3925, historical)')
    // The card shows no certificate claim of its own
    expect(page).toContain('unconfirmed for this product')
  })

  it('uses the same Utimaco product wording and certificate attribution in the vendor table', () => {
    const utimaco = HSM_VENDORS.find((v) => v.id === 'utimaco')!
    expect(utimaco.product).toBe('u.trust GP HSM Se-Series (Quantum Protect)')
    expect(utimaco.firmwareVersion).toBe(
      'Quantum Protect firmware module (version not stated by Utimaco)'
    )
    expect(utimaco.fips140Level).toMatch(/^Unconfirmed:/)
    expect(utimaco.fips140Level).toContain('listed under CryptoServer Se-Series Gen2')
    const everyUtimacoText = JSON.stringify({
      vendors: HSM_VENDORS,
      operations: HSM_PKCS11_OPERATIONS,
    }).toLowerCase()
    for (const gone of ['securityserver', 'q-safe', 'se gen2 (quantum', '5.0+']) {
      expect(everyUtimacoText).not.toContain(gone)
    }
  })

  it("does not speak about the maintainers' document holdings in learner text", () => {
    const page = openIntroText()
    expect(page).not.toContain('pages we hold')
    expect(page).toContain("utimaco's product pages give no duration")
    expect(page).toContain("entrust's release notes and product pages give no duration")
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

describe('HsmPqc: ML-DSA signing text names the calls the simulator shows (Steps 5 and 6)', () => {
  const step = (id: string) => HSM_PKCS11_OPERATIONS.find((o) => o.id === id)?.command ?? ''

  it('the simulator code panels for signing and verifying are message-based', () => {
    expect(step('sign')).toContain('C_MessageSignInit')
    expect(step('sign')).toContain('C_SignMessage')
    expect(step('verify')).toContain('C_MessageVerifyInit')
    expect(step('verify')).toContain('C_VerifyMessage')
  })

  it('Exercise 2 points at those calls, not at single-part C_Sign / C_Verify', () => {
    render(
      <EmbedProvider>
        <MemoryRouter>
          <HsmPqcExercises onNavigateToWorkshop={() => {}} />
        </MemoryRouter>
      </EmbedProvider>
    )
    const t = document.body.textContent ?? ''
    expect(t).toContain(
      'Observe the message-based signing calls (C_MessageSignInit / C_SignMessage and C_MessageVerifyInit / C_VerifyMessage) using CKM_ML_DSA.'
    )
    expect(t).not.toContain('Observe the C_Sign and C_Verify calls')
  })

  it('the ML-DSA and SLH-DSA mechanism rows name the message-based calls and still allow single-part C_Sign', () => {
    for (const id of ['ckm-ml-dsa', 'ckm-slh-dsa']) {
      const description = PKCS11_MECHANISMS.find((m) => m.id === id)?.description ?? ''
      expect(description, id).toContain('C_MessageSignInit/C_SignMessage')
      expect(description, id).toContain('(or single-part C_Sign)')
      expect(description, id).not.toContain('C_Sign/C_Verify')
    }
    // single-part C_Sign remains the call for LMS/HSS
    const hss = PKCS11_MECHANISMS.find((m) => m.id === 'ckm-hss')?.description ?? ''
    expect(hss).toContain('C_Sign/C_Verify')
  })
})

// Cloud HSM cards added for the trust-hardware comparison: each phrase is what the provider's
// own page says (Microsoft Learn: Azure Cloud HSM overview and FAQ, Managed HSM overview and
// key pages; the Securosys X2 fact sheet and firmware v3.x algorithm list; the Tessera specification,
// SDK README and Microsoft's Project Tessera announcement), read 8 Nov 2026.
describe('HsmPqc: Azure Cloud HSM, Azure Managed HSM, Securosys and Tessera cards', () => {
  const NEW_CARD_FACTS = [
    'Azure Cloud HSM',
    'Azure Managed HSM',
    'Securosys Primus HSM CyberVault',
    "None listed on Microsoft's Azure Cloud HSM overview or FAQ",
    'Single-tenant; each cluster has its own customer-specific security domain and three HSMs',
    'PKCS#11, OpenSSL, Java (JCA and JCE), CNG and a key storage provider (KSP)',
    'Microsoft calls it the successor to Azure Dedicated HSM',
    'a fully managed Microsoft service',
    'Marvell LiquidSecurity',
    'ML-DSA, SLH-DSA, ML-KEM, HSS-LMS and XMSS (Securosys fact sheet, August 2025)',
    'HSS-LMS is listed as approved in FIPS mode and not allowed in the Common Criteria configuration',
    'This project is still under development and is not yet ready for deployment',
    'Microsoft describes Tessera as an evolution of the Azure Integrated HSM',
    'facts about that earlier Azure Integrated HSM are not facts about Tessera',
  ]

  it('shows each new card fact on the Learn tab', () => {
    const page = openIntroText()
    for (const fact of NEW_CARD_FACTS) {
      expect(page, `Learn tab: ${fact}`).toContain(flat(fact))
    }
  })

  it('keeps the Azure Dedicated HSM retirement note', () => {
    const page = openIntroText()
    expect(page).toContain(
      flat('No new customer onboardings; existing customers supported until 31 July 2028.')
    )
  })

  it('says the same about the new cards in the rag-summary and the curious summary', () => {
    const rag = flat(ragSummary)
    expect(rag).toContain(flat('Azure Cloud HSM (Microsoft Learn overview and FAQ'))
    expect(rag).toContain(
      flat('Azure Managed HSM (Microsoft Learn, Key Vault Managed HSM about keys')
    )
    expect(rag).toContain(flat('Securosys Primus HSM CyberVault (Securosys X2 fact sheet'))
    expect(rag).toContain(
      flat('Microsoft describes Tessera as an evolution of the Azure Integrated HSM')
    )
    expect(flat(curiousSummary)).toContain(
      flat('Tessera is a specification with open firmware and an open hardware design')
    )
  })

  it('does not describe Tessera with product words or Azure Integrated HSM facts', () => {
    const page = openIntroText()
    const tessera = page.slice(page.indexOf('tessera (specification and open designs)'))
    expect(tessera).toContain('no product or certificate yet')
    for (const word of ['ships', 'now available', 'is certified', 'in every server']) {
      expect(tessera.slice(0, 1800), word).not.toContain(word)
    }
  })

  it('links to the trust-hardware comparison step from the closing block', () => {
    openIntroText()
    const links = screen
      .getAllByRole('link', { name: /Compare with the other trust hardware/ })
      .map((a) => a.getAttribute('href'))
    expect(links).toEqual(['/learn/arch-quantum-impact?tab=workshop&step=5'])
  })
})
