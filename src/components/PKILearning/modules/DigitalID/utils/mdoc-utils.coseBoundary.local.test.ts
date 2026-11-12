// SPDX-License-Identifier: AGPL-3.0-only
// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { generateKeyPairSync, sign, verify, webcrypto } from 'node:crypto'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { decode, encode } from 'cborg'
import type { CryptoKey } from '../types'
import type { CryptoProvider } from './crypto-provider'
import { createMdoc } from './mdoc-utils'
import { inspectStoredCredential } from './credentialInspection'

function fixture(curve: 'P-256' | 'P-384', representation: 'software' | 'hsm-shaped') {
  const pair = generateKeyPairSync('ec', {
    namedCurve: curve === 'P-256' ? 'prime256v1' : 'secp384r1',
  })
  const jwk = pair.publicKey.export({ format: 'jwk' })
  const point = new Uint8Array([
    4,
    ...Buffer.from(jwk.x!, 'base64url'),
    ...Buffer.from(jwk.y!, 'base64url'),
  ])
  const key: CryptoKey = {
    id: 'fictional-' + curve,
    type: curve,
    algorithm: curve === 'P-256' ? 'ES256' : 'ES384',
    curve,
    publicKey:
      representation === 'software'
        ? Buffer.from(pair.publicKey.export({ type: 'spki', format: 'pem' })).toString('base64')
        : Buffer.from(AsnConvert.serialize(new OctetString(point))).toString('hex'),
    privateKey:
      representation === 'software'
        ? pair.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
        : '[PKCS#11 handle: 1]',
    created: '2026-01-01T00:00:00Z',
    usage: 'SIGN',
    status: 'ACTIVE',
  }
  const provider: CryptoProvider = {
    generateKeyPair: async () => key,
    signData: async (_key, data) =>
      sign(
        curve === 'P-256' ? 'sha256' : 'sha384',
        typeof data === 'string' ? Buffer.from(data) : data,
        { key: pair.privateKey, dsaEncoding: 'ieee-p1363' }
      ).toString('base64url'),
    // Software native raw DER remains a deliberately different API. A caller
    // accidentally reverting to signRaw will fail the independent COSE checks.
    signRaw: async (_key, bytes) =>
      new Uint8Array(sign(curve === 'P-256' ? 'sha256' : 'sha384', bytes, pair.privateKey)),
    verifySignature: async () => {
      throw new Error('No mocked verifier success is used')
    },
    sha256Hash: async (data) =>
      Buffer.from(
        await webcrypto.subtle.digest(
          'SHA-256',
          typeof data === 'string' ? Buffer.from(data) : new Uint8Array(data)
        )
      ).toString('base64url'),
  }
  return { pair, key, jwk, provider }
}
describe('actual ECDSA COSE signature and device public-key boundary', () => {
  it.each([
    ['P-256', 'software'],
    ['P-384', 'software'],
    ['P-256', 'hsm-shaped'],
    ['P-384', 'hsm-shaped'],
  ] as const)(
    '%s %s inputs produce exact raw COSE signatures and actual key coordinates',
    async (curve, representation) => {
      // The HSM-shaped case tests public representation handling with real Node
      // crypto. Actual bundled HSM operation is separate native browser evidence.
      const issuer = fixture(curve, representation),
        device = fixture(curve, representation)
      const result = await createMdoc(
        [{ name: 'age_over_18', value: true }],
        issuer.key,
        device.key,
        issuer.provider
      )
      const decoded = decode(Buffer.from(result.issuerSignature, 'base64'), { useMaps: true }) as [
        Uint8Array,
        Map<unknown, unknown>,
        Uint8Array,
        Uint8Array,
      ]
      const [protectedHeader, , payload, signature] = decoded
      expect(signature.length).toBe(curve === 'P-256' ? 64 : 96)
      expect(decode(protectedHeader, { useMaps: true }).get(1)).toBe(curve === 'P-256' ? -7 : -35)
      const signedBytes = encode(['Signature1', protectedHeader, new Uint8Array(), payload])
      const options = { key: issuer.pair.publicKey, dsaEncoding: 'ieee-p1363' as const }
      const hash = curve === 'P-256' ? 'sha256' : 'sha384'
      expect(verify(hash, signedBytes, options, signature)).toBe(true)
      const changed = signedBytes.slice()
      changed[changed.length - 1] ^= 1
      expect(verify(hash, changed, options, signature)).toBe(false)
      expect(verify(hash, signedBytes, { ...options, key: device.pair.publicKey }, signature)).toBe(
        false
      )
      const mso = decode(payload, { useMaps: true }) as Map<unknown, unknown>
      const coseKey = (mso.get('deviceKeyInfo') as Map<string, unknown>).get('deviceKey') as Map<
        number,
        unknown
      >
      expect(coseKey.get(1)).toBe(2)
      expect(coseKey.get(-1)).toBe(curve === 'P-256' ? 1 : 2)
      expect(Buffer.from(coseKey.get(-2) as Uint8Array).toString('base64url')).toBe(device.jwk.x)
      expect(Buffer.from(coseKey.get(-3) as Uint8Array).toString('base64url')).toBe(device.jwk.y)
      // JSON mirror still loses nested Maps: inspection must consume payload bytes.
      const raw = JSON.stringify(result)
      expect(JSON.parse(raw).mobileSecurityObject.validityInfo).toEqual({})
      expect(
        inspectStoredCredential({ format: 'mso_mdoc', raw }).times.every(
          (t) => t.milliseconds !== undefined
        )
      ).toBe(true)
    }
  )
  it('does not issue after a wrong-width/DER signature or unsupported key selection', async () => {
    const value = fixture('P-256', 'software')
    const wrong = {
      ...value.provider,
      signData: async () => Buffer.from(new Uint8Array(70)).toString('base64url'),
    }
    await expect(createMdoc([], value.key, value.key, wrong)).rejects.toThrow(/encoding width/)
    await expect(
      createMdoc(
        [],
        { ...value.key, algorithm: 'EdDSA', curve: 'Ed25519' },
        value.key,
        value.provider
      )
    ).rejects.toThrow(/ES256\/ES384/)
  })
  it('rejects missing/mislabeled/off-curve device public data before signing', async () => {
    const value = fixture('P-256', 'software')
    await expect(
      createMdoc([], value.key, { ...value.key, publicKey: '' }, value.provider)
    ).rejects.toThrow()
    await expect(
      createMdoc([], value.key, { ...value.key, curve: 'P-384' }, value.provider)
    ).rejects.toThrow()
    const offCurve = Buffer.from(
      AsnConvert.serialize(new OctetString(new Uint8Array([4, ...new Uint8Array(64)])))
    ).toString('hex')
    await expect(
      createMdoc(
        [],
        value.key,
        { ...value.key, privateKey: '[PKCS#11 handle: 1]', publicKey: offCurve },
        value.provider
      )
    ).rejects.toThrow()
  })
})
