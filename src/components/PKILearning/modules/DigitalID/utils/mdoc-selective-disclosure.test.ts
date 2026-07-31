// SPDX-License-Identifier: GPL-3.0-only
/**
 * Proves the mdoc selective disclosure is REAL, not presentational.
 *
 * The module's central claim is that a wallet can prove `age_over_18` while
 * withholding `birth_date` from the same issuer-signed credential. Until
 * 2026-07-31 the mdoc discarded each element's salt at issuance, so a subset
 * could not be verified against the signed MSO at all — any "selective
 * disclosure" the UI showed would have been decoration.
 *
 * A round-trip alone would not catch that: a verifier stubbed to return true
 * passes it. So the negative cases below are the point — a withheld element
 * must be absent, and a tampered value must FAIL its digest.
 */
import { describe, it, expect } from 'vitest'
import { createMdoc, createMdocPresentation, verifyMdocPresentation } from './mdoc-utils'
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey, CredentialAttribute } from '../types'

/** Minimal provider: real SHA-256 via WebCrypto, stub signing (not under test). */
const provider: CryptoProvider = {
  generateKeyPair: async () => ({}) as CryptoKey,
  signData: async () => 'sig',
  signRaw: async () => new Uint8Array([1, 2, 3]),
  verifySignature: async () => true,
  sha256Hash: async (data) => {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data
    const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as ArrayBuffer)
    const b = new Uint8Array(digest)
    return btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  },
}

const key = { algorithm: 'ES256', curve: 'P-256' } as unknown as CryptoKey

const PID_ATTRS: CredentialAttribute[] = [
  { name: 'family_name', value: 'García' },
  { name: 'given_name', value: 'María Elena' },
  { name: 'birth_date', value: '1990-03-15' },
  { name: 'age_over_18', value: true },
  { name: 'issuing_country', value: 'ES' },
]

describe('mdoc selective disclosure (ISO 18013-5)', () => {
  it('retains a salt per element at issuance', async () => {
    const mdoc = await createMdoc(PID_ATTRS, key, key, provider)
    expect(mdoc.issuerSignedItems).toHaveLength(PID_ATTRS.length)
    for (const item of mdoc.issuerSignedItems!) {
      // 16 random bytes, base64 -> non-empty and decodable
      expect(item.random.length).toBeGreaterThan(0)
      expect(atob(item.random)).toHaveLength(16)
    }
    // Salts must differ per element, or the digests leak equality of values.
    const salts = new Set(mdoc.issuerSignedItems!.map((i) => i.random))
    expect(salts.size).toBe(PID_ATTRS.length)
  })

  it('proves age_over_18 while withholding birth_date — the module thesis', async () => {
    const mdoc = await createMdoc(PID_ATTRS, key, key, provider)
    const pres = createMdocPresentation(mdoc, ['age_over_18'])

    const disclosed = pres.disclosed.map((d) => d.elementIdentifier)
    expect(disclosed).toEqual(['age_over_18'])
    expect(pres.withheld).toContain('birth_date')

    // birth_date must be ABSENT from the wire, not merely flagged hidden.
    expect(JSON.stringify(pres)).not.toContain('1990-03-15')

    const results = await verifyMdocPresentation(pres, provider)
    expect(results).toEqual([{ element: 'age_over_18', digestMatched: true }])
  })

  it('still verifies every element when everything is disclosed', async () => {
    const mdoc = await createMdoc(PID_ATTRS, key, key, provider)
    const pres = createMdocPresentation(
      mdoc,
      PID_ATTRS.map((a) => a.name)
    )
    const results = await verifyMdocPresentation(pres, provider)
    expect(results).toHaveLength(PID_ATTRS.length)
    expect(results.every((r) => r.digestMatched)).toBe(true)
  })

  it('FAILS the digest when a disclosed value is tampered with', async () => {
    const mdoc = await createMdoc(PID_ATTRS, key, key, provider)
    const pres = createMdocPresentation(mdoc, ['age_over_18', 'family_name'])
    // Forge the age claim — exactly the attack selective disclosure must resist.
    pres.disclosed.find((d) => d.elementIdentifier === 'age_over_18')!.elementValue = false

    const results = await verifyMdocPresentation(pres, provider)
    expect(results.find((r) => r.element === 'age_over_18')!.digestMatched).toBe(false)
    // The untampered sibling must still verify, or the test proves nothing
    // beyond "verification broke".
    expect(results.find((r) => r.element === 'family_name')!.digestMatched).toBe(true)
  })

  it('FAILS the digest when the salt is swapped', async () => {
    const mdoc = await createMdoc(PID_ATTRS, key, key, provider)
    const pres = createMdocPresentation(mdoc, ['age_over_18'])
    pres.disclosed[0].random = btoa(String.fromCharCode(...new Uint8Array(16).fill(9)))
    const results = await verifyMdocPresentation(pres, provider)
    expect(results[0].digestMatched).toBe(false)
  })
})
