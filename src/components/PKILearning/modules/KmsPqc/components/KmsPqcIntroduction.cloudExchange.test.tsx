// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { EmbedProvider } from '../../../../../embed/EmbedProvider'
import { KmsPqcIntroduction } from './KmsPqcIntroduction'

const SECTION_TITLES = [
  /Envelope Encryption with ML-KEM/,
  /Hybrid Key Wrapping/,
  /KMS Provider PQC Landscape/,
  /PQC Key Rotation Strategies/,
  /Enterprise Architecture Patterns/,
]

/** Renders the lesson with the ownership section open and every collapsible section expanded. */
function lessonText(): string {
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn/kms-pqc?section=cloud-responsibility']}>
        <KmsPqcIntroduction onNavigateToWorkshop={() => {}} />
      </MemoryRouter>
    </EmbedProvider>
  )
  for (const title of SECTION_TITLES) {
    fireEvent.click(screen.getByRole('button', { name: title }))
  }
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

/** Sentences matched to Library rows by their exact text; they must not drift. */
const CLAIM_SENTENCES = [
  'AWS KMS offers ML-DSA signing keys (ML_DSA_44, ML_DSA_65, ML_DSA_87) and ML-KEM key-establishment keys (ML_KEM_512, ML_KEM_768, ML_KEM_1024).',
  'AWS added ML-KEM keys to AWS KMS on 26 October 2026; they are not available in the China, Middle East (UAE) and Middle East (Bahrain) Regions.',
  'AWS KMS imports key material under an RSA wrapping key (RSA_2048, RSA_3072 or RSA_4096), or an SM2 wrapping key in the China Regions, and cannot import key material into ML-DSA or ML-KEM KMS keys.',
  'AWS KMS Decapsulate returns the 32-byte ML-KEM shared secret in plaintext to the calling application.',
  'AWS KMS Encapsulate works only with the public key of a KMS ML-KEM key.',
  "Encapsulating to a partner's HSM key therefore happens in the caller's own library.",
  'AWS KMS GenerateDataKeyPair can return ML-KEM data key pairs, with the private key in seed format, encrypted under a symmetric KMS key.',
  'AWS KMS supports hybrid post-quantum TLS that combines ECDH with ML-KEM on its service endpoints.',
  'AWS lists hybrid post-quantum key exchange as launched on FIPS and non-FIPS endpoints for AWS KMS, AWS Payment Cryptography and the AWS CloudHSM control plane.',
  'Google Cloud KMS quantum-safe key import, in Preview, wraps imported key material with HPKE using X-Wing, ML-KEM-768 or ML-KEM-1024 with HKDF-SHA256 and AES-256-GCM.',
  'The Cloud KMS release notes date the Preview to 6 August 2026.',
  'Google Cloud KMS key import wraps key material for transfer using RSA-based import methods.',
  'Google Cloud KMS release notes list the ML-KEM and X-Wing key encapsulation algorithms as Preview since 23 September 2025.',
  'Azure Key Vault BYOK transfers a key wrapped with CKM_RSA_AES_KEY_WRAP under an RSA-HSM key exchange key of 2048, 3072 or 4096 bits.',
  'Azure Managed HSM BYOK uses an RSA-HSM key exchange key that has only the import key operation.',
]

describe('KmsPqcIntroduction: exchanging keys with a third-party HSM or KMS', () => {
  it('states the headline: no quantum-safe import for AWS KMS or Azure, an HPKE import in Preview for Google', () => {
    const text = lessonText()
    expect(text).toMatch(/Exchanging keys with a third-party HSM or KMS/)
    expect(text).toMatch(
      /for AWS KMS and Azure Key Vault there is no quantum-safe import path in these pages, and they describe no preview of one/
    )
    expect(text).toMatch(
      /Google Cloud KMS documents a quantum-safe import built on HPKE, in Preview, for software-protected keys/
    )
    expect(text).toMatch(
      /does not\s+change how the key is wrapped|does not change how the key is wrapped/
    )
  })

  it.each(CLAIM_SENTENCES)('keeps the claim sentence word for word: %s', (sentence) => {
    expect(lessonText()).toContain(sentence)
  })

  it('shows where the key ends up for each AWS path, including that Decapsulate gives the caller the secret', () => {
    const text = lessonText()
    expect(text).toMatch(/Where the key ends up/)
    expect(text).toMatch(/The application.s memory, in plaintext\. It is not a KMS key/)
    expect(text).toMatch(/RSAES_PKCS1_V1_5 has not been supported since 10 October 2023/)
    expect(text).toMatch(/Recipient is limited to the RSAES_OAEP_SHA_256 algorithm/)
    expect(text).toMatch(/AWS KMS has no hybrid|none of them is a hybrid/)
  })

  it('describes the Google HPKE import flow without calling it generally available', () => {
    const text = lessonText()
    expect(text).toMatch(/HPKE_KEM_XWING_HKDF_SHA256_AES_256_GCM/)
    expect(text).toMatch(/HPKE\.Seal\(\) as defined in RFC 9180/)
    expect(text).toMatch(/enc \|\| ciphertext/)
    expect(text).toMatch(/A job expires after three days/)
    expect(text).toMatch(/The launch stage of key encapsulation differs by source/)
    expect(text).not.toMatch(/quantum-safe key import[^.]*generally available/i)
  })

  it('does not promise a quantum-safe import for AWS or Azure', () => {
    const text = lessonText()
    expect(text).not.toMatch(/AWS KMS (can|will) import (ML-KEM|ML-DSA)/)
    expect(text).not.toMatch(
      /Azure Key Vault (supports|offers) (ML-KEM|post-quantum) (key )?import/i
    )
    expect(text).toMatch(/The Azure pages cited here describe no post-quantum option/)
  })

  it('says what each of the three AWS pages says about FIPS, China and GovCloud, and links the Infrastructure security page', () => {
    const text = lessonText()
    expect(text).toMatch(/AWS pages differ on the edges/)
    expect(text).not.toMatch(/another AWS page/)
    expect(text).toMatch(
      /the AWS KMS hybrid post-quantum TLS page says all endpoints including FIPS 140-3 validated endpoints in the Regions where AWS KMS is available/
    )
    expect(text).toMatch(
      /the AWS PQ readiness page lists FIPS and non-FIPS endpoints in commercial and US GovCloud Regions as launched/
    )
    expect(text).toMatch(
      /Infrastructure security in AWS KMS page says AWS KMS supports hybrid post-quantum TLS in all Regions except the China Regions and does not support it on AWS GovCloud \(US\) FIPS endpoints/
    )
    expect(text).not.toMatch(/non-FIPS endpoints across all AWS Regions/)
    const link = screen.getByRole('link', { name: 'Infrastructure security in AWS KMS' })
    expect(link).toHaveAttribute(
      'href',
      'https://docs.aws.amazon.com/kms/latest/developerguide/infrastructure-security.html'
    )
  })

  it('describes the Google Go sample only as using the tink-go library', () => {
    const text = lessonText()
    expect(text).toMatch(/Google's Go sample wraps the key with the tink-go library/)
    expect(text).not.toMatch(/empty context/)
  })

  it('quotes the CMVP guidance narrowly and does not say an X25519 hybrid meets it', () => {
    const text = lessonText()
    expect(text).toMatch(/shall show compliance with FIPS 203 and SP 800-227/)
    expect(text).toMatch(/depends on the module's validated algorithms and the current guidance/)
    expect(text).not.toMatch(/X25519 hybrid with a validated ML-KEM/)
    expect(text).not.toMatch(/pass its self-tests/)
  })

  it('gives the AWS key-exchange table a width floor so it scrolls on a phone', () => {
    lessonText()
    const region = screen.getByRole('region', { name: 'AWS KMS key exchange paths' })
    expect(region.querySelector('table')?.className).toMatch(/min-w-\[40rem\]/)
  })
})

describe('KmsPqcIntroduction: corrected module statements', () => {
  it('no longer calls the post-quantum size growth 4-10x, and labels the 500 as keys and certificates', () => {
    const text = lessonText()
    expect(text).not.toMatch(/4\s*[–-]\s*10\s*×\s*vs RSA baselines/)
    expect(text).toMatch(
      /about 3× \(ML-KEM-512\) to 10× \(ML-DSA-87\) the size of an RSA-2048 public key/
    )
    expect(text).toMatch(/Total Keys and Certificates/)
    expect(text).not.toMatch(/Total Certificates/)
  })

  it('shows classical strength in bits, includes RSA-4096, and does not rank everything Level 1', () => {
    const text = lessonText()
    expect(text).not.toMatch(/Level 1 \(classical\)/)
    expect(text).toMatch(/About 112-bit classical/)
    expect(text).toMatch(/About 128-bit classical/)
    expect(text).toMatch(/RSA-4096/)
    expect(text).toMatch(/SP 800-57 has no row for RSA-4096/)
  })

  it('uses the real KMIP operation names instead of Wrap, Unwrap and Rotate', () => {
    const text = lessonText()
    expect(text).not.toMatch(/create, wrap, unwrap, rotate, destroy/)
    expect(text).toMatch(/KMIP has no Wrap, Unwrap or Rotate operation/)
    expect(text).toMatch(/Re-key Key Pair replaces a key pair/)
    expect(text).toMatch(/Destroy applies only to Pre-Active or Deactivated objects/)
    expect(text).toMatch(/KMIP 2\.1 is the OASIS Standard/)
  })

  it('sources the interim key-wrapping statement to the framework and says where it applies', () => {
    const text = lessonText()
    expect(text).toMatch(
      /For HSMs that cannot yet be upgraded, the Applied Quantum framework \(v2\.1\) suggests PQC key-wrapping around classical HSM operations as interim protection/
    )
  })

  it('separates a KMS key-wrap combiner from a TLS hybrid group', () => {
    const text = lessonText()
    expect(text).toMatch(/Do not confuse these key-wrap combiners with the TLS hybrid groups/)
    expect(text).toMatch(/SecP384r1MLKEM1024 \(RFC 10024\)/)
  })

  it('marks the SP 800-57 Rev. 6 cryptoperiods as a draft', () => {
    const text = lessonText()
    expect(text).toMatch(
      /Revision 6 \(Initial Public Draft, December 2025, so it may still change\)/
    )
    expect(text).toMatch(/no more than one or two years for a public static encapsulation key/)
    expect(text).toMatch(/no more than two years for a private static decapsulation key/)
  })

  it('says the FIPS level does not carry over to a PQC key type and lists providers not covered', () => {
    const text = lessonText()
    expect(text).toMatch(/lists no ML-DSA or ML-KEM algorithm/)
    expect(text).toMatch(
      /Entrust nShield and KeyControl and IBM key-management products are not covered/
    )
  })

  it('splits the Google badge note: signing GA, key encapsulation sources differ', () => {
    const text = lessonText()
    expect(text).toMatch(/Quantum-safe key import: Preview since 6 Aug 2026/)
  })
})
