// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Claim-scope guards for the EMVPaymentPQC module.
 *
 * Each test states a concept a reader must be able to rely on:
 *  - PSD2: the rights to use payment initiation and account information services are separate
 *    from the authentication rules; dynamic linking belongs to remote payments, not to reading
 *    account data; the RTS requires at least one access interface, which may be a dedicated one
 *    or the customer interface, so a dedicated API is not the only legal form;
 *  - TLS: ECDSA authenticates, it does not establish keys; key exchange is what harvest-now-
 *    decrypt-later targets;
 *  - EMV offline authentication is shown as a modelled RSA profile, with ECC acknowledged;
 *  - the CDA signature is the Signed Dynamic Application Data, not the static one;
 *  - Apple Pay's payment Secure Element and the Secure Enclave are different parts;
 *  - the key injection scenario keeps the BDK in the HSM and is labelled illustrative;
 *  - a KEM output is never taught as directly encrypting or wrapping a key;
 *  - the 3-D Secure cryptography is qualified until the specification is checked.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { EMVPaymentIntroduction } from './components/EMVPaymentIntroduction'
import { TRANSACTION_FLOWS } from './data/transactionFlowData'
import { TOKENIZATION_FLOWS, MOBILE_WALLETS } from './data/tokenizationData'
import {
  KEY_INJECTION_CEREMONY,
  DUKPT_DERIVATION_TREE,
  POS_TERMINAL_PROFILES,
} from './data/posCryptoData'
import { MIGRATION_VECTORS } from './data/migrationRiskData'

/** The lesson with every collapsed section opened, as one string. */
function lessonText(): string {
  render(
    <MemoryRouter>
      <EMVPaymentIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  for (let i = 0; i < 6; i++) {
    screen.queryAllByRole('button', { expanded: false }).forEach((b) => fireEvent.click(b))
  }
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

const sentences = (text: string) => text.split(/(?<=[.;])\s+/).filter(Boolean)

let text = ''
beforeAll(() => {
  text = lessonText()
})

describe('PSD2 and the SCA RTS', () => {
  it('names the rights to use payment initiation and account information services', () => {
    expect(text).toMatch(/Article 66/)
    expect(text).toMatch(/Article 67/)
  })

  it('does not tie dynamic linking to reading account data without saying it does not apply', () => {
    for (const s of sentences(text)) {
      if (/dynamic(ally)?[- ]link/i.test(s) && /account (access|data|information)/i.test(s)) {
        expect(s, s).toMatch(/\bnot\b|\bonly\b/i)
      }
    }
  })

  it('does not call the dedicated interface the legal basis for every open-banking API', () => {
    expect(text).not.toMatch(/legal basis for every open-banking API/i)
  })

  it('says a bank may meet the interface duty with a dedicated interface or its customer interface', () => {
    expect(text).toMatch(/Art\. 31/)
    expect(text).toMatch(/at least one interface/i)
    expect(text).toMatch(/not the only legal form/i)
  })
})

describe('TLS roles', () => {
  const clauseOf = (s: string) => s.split(/[,;().]/)
  const strings = [
    ...TRANSACTION_FLOWS.flatMap((f) => f.steps.flatMap((s) => s.cryptoUsed)),
    ...TOKENIZATION_FLOWS.flatMap((f) => f.steps.flatMap((s) => s.cryptoUsed)),
    ...POS_TERMINAL_PROFILES.flatMap((t) => t.quantumVulnerabilities),
    ...MIGRATION_VECTORS.flatMap((v) => [...v.currentCrypto, v.vulnerability]),
    ...sentences(text),
  ]

  it('never describes ECDSA as a key exchange', () => {
    for (const s of strings) {
      for (const c of clauseOf(s)) {
        expect(c, s).not.toMatch(/ECDSA[^,;.)]*key exchange|key exchange[^,;.)]*ECDSA/i)
      }
    }
  })

  it('ties harvest-now-decrypt-later to the key exchange, not to certificate signatures', () => {
    const tls = MIGRATION_VECTORS.find((v) => v.component === 'online-authorization')!
    expect(tls.vulnerability).toMatch(/key exchange/i)
    expect(tls.vulnerability).toMatch(/signature/i)
  })
})

describe('offline card authentication', () => {
  it('shows an RSA profile as a model and acknowledges ECC instead of saying all EMV is RSA', () => {
    expect(text).toMatch(/ECC/)
    expect(text).toMatch(/modelled|modeled/i)
    expect(text).not.toMatch(/three offline authentication methods, all based on RSA/i)
  })

  it('names the CDA signature the Signed Dynamic Application Data', () => {
    const cda = TRANSACTION_FLOWS.find((f) => f.id === 'offline-cda')!
    const all = cda.steps.map((s) => `${s.label} ${s.description} ${s.cryptoUsed.join(' ')}`)
    for (const step of cda.steps) {
      // the CDA signature itself is never labelled static
      expect(`${step.label} ${step.cryptoUsed.join(' ')}`).not.toMatch(/SSAD|Static/i)
      // a mention of the static signature is only allowed as the contrast with SDA
      for (const sentence of sentences(step.description)) {
        if (/Static/i.test(sentence)) expect(sentence).toMatch(/\bSDA\b/)
      }
    }
    expect(all.join(' ')).toMatch(/SDAD|Signed Dynamic Application Data/)
  })
})

describe('mobile wallets', () => {
  it('keeps Apple Pay payment applets (Secure Element) apart from the Secure Enclave', () => {
    const apple = MOBILE_WALLETS.find((w) => w.id === 'apple-pay')!
    expect(apple.secureElement).toMatch(/Secure Element/)
    if (/Secure Enclave/.test(apple.secureElement)) {
      expect(apple.secureElement).toMatch(/authori[sz]ation/i)
    }
  })

  it('does not list a Secure Enclave processor or a keystore as the Secure Element in a flow step', () => {
    const steps = TOKENIZATION_FLOWS.flatMap((f) => f.steps.map((s) => s.description))
    for (const d of steps) expect(d).not.toMatch(/Secure Element \(Apple SEP/i)
  })

  it('labels each token service flow as an illustrative sequence', () => {
    for (const f of TOKENIZATION_FLOWS) expect(f.description, f.name).toMatch(/illustrative/i)
  })
})

describe('key injection scenario', () => {
  const steps = KEY_INJECTION_CEREMONY.steps

  it('is labelled as one illustrative, fictional case', () => {
    expect(`${KEY_INJECTION_CEREMONY.name} ${KEY_INJECTION_CEREMONY.description}`).toMatch(
      /fictional|illustrative/i
    )
  })

  it('never wraps or transports the BDK, and derives the terminal key before it is wrapped', () => {
    for (const s of steps) expect(s.label, s.label).not.toMatch(/BDK.*(wrap|transport)/i)
    expect(DUKPT_DERIVATION_TREE.vulnerablePoint).not.toMatch(/key transport of (the )?BDK/i)
    const derive = steps.findIndex((s) => /deriv/i.test(`${s.label} ${s.description}`))
    const wrap = steps.findIndex((s) => /wrap/i.test(s.label))
    expect(derive).toBeGreaterThanOrEqual(0)
    expect(wrap).toBeGreaterThan(derive)
    for (const s of steps.filter((x) => x.quantumVulnerable)) {
      expect(s.description, s.label).toMatch(/initial key/i)
    }
  })
})

describe('KEM replacements', () => {
  it('never present a KEM as directly wrapping or encrypting; a KDF or authenticated wrap is named', () => {
    const replacements = [
      ...TRANSACTION_FLOWS.flatMap((f) => f.steps.map((s) => s.pqcReplacement)),
      ...TOKENIZATION_FLOWS.flatMap((f) => f.steps.map((s) => s.pqcReplacement)),
      ...KEY_INJECTION_CEREMONY.steps.map((s) => s.pqcReplacement),
    ].filter((r): r is string => Boolean(r))
    for (const r of replacements) {
      if (/ML-KEM/.test(r) && /key wrapping|key transport|payload encryption/i.test(r)) {
        expect(r, r).toMatch(/KDF|key-derivation|authenticated/i)
      }
    }
  })

  it('labels the key injection post-quantum toggle as conceptual', () => {
    const wrap = KEY_INJECTION_CEREMONY.steps.find((s) => /wrap/i.test(s.label))!
    expect(wrap.pqcReplacement).toMatch(/conceptual/i)
  })
})

describe('3-D Secure', () => {
  it('qualifies the signing assumption until the specification is checked', () => {
    const v = MIGRATION_VECTORS.find((x) => x.component === '3ds-authentication')!
    expect(`${v.vulnerability} ${v.currentCrypto.join(' ')}`).toMatch(
      /illustrative|unverified|not verified|assum/i
    )
    expect(text).not.toMatch(/adds cardholder authentication using ECDSA/i)
  })
})
