// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createHash,
  createPublicKey,
  generateKeyPairSync,
  sign,
  verify,
  webcrypto,
} from 'node:crypto'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { createPresentation, createSDJWT } from './sdjwt-utils'
import { sampleHolderMatchesIssuer, verifySampleSdPresentation } from './samplePresentation'
import type { CryptoKey } from '../types'
import type { CryptoProvider } from './crypto-provider'

beforeEach(() => vi.stubGlobal('crypto', webcrypto))
afterEach(() => vi.unstubAllGlobals())

function sample(algorithm: 'ES256' | 'ES384' | 'EdDSA', hsm: boolean) {
  const ed = algorithm === 'EdDSA'
  const curve = ed ? 'Ed25519' : algorithm === 'ES384' ? 'P-384' : 'P-256'
  const pair = ed
    ? generateKeyPairSync('ed25519')
    : generateKeyPairSync('ec', { namedCurve: curve })
  const spki = AsnConvert.parse(
    pair.publicKey.export({ format: 'der', type: 'spki' }),
    SubjectPublicKeyInfo
  )
  const key: CryptoKey = {
    id: 'sample-holder',
    algorithm,
    curve,
    type: curve,
    created: 'sample',
    usage: 'SIGN',
    status: 'ACTIVE',
    publicKey: hsm
      ? Buffer.from(
          ed ? spki.subjectPublicKey : AsnConvert.serialize(new OctetString(spki.subjectPublicKey))
        ).toString('hex')
      : btoa(pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()),
    privateKey: hsm
      ? '[PKCS#11 handle: 1]'
      : btoa(pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()),
  }
  const provider = {
    signData: vi.fn(async (_key: CryptoKey, data: string | Uint8Array) =>
      sign(ed ? null : algorithm === 'ES384' ? 'sha384' : 'sha256', Buffer.from(data), {
        key: pair.privateKey,
        dsaEncoding: 'ieee-p1363',
      }).toString('base64url')
    ),
    verifySignature: async (_key: CryptoKey, signature: string, data: string | Uint8Array) =>
      verify(
        ed ? null : algorithm === 'ES384' ? 'sha384' : 'sha256',
        Buffer.from(data),
        { key: pair.publicKey, dsaEncoding: 'ieee-p1363' },
        Buffer.from(signature, 'base64url')
      ),
    sha256Hash: async (data: string | Uint8Array) =>
      createHash('sha256').update(data).digest('base64url'),
  } as unknown as CryptoProvider
  return { key, provider, pair, ed, algorithm }
}

function payload(jwt: string) {
  return JSON.parse(Buffer.from(jwt.split('.')[1]!, 'base64url').toString()) as {
    cnf?: { jwk: JsonWebKey }
  }
}

describe('sample holder public JWK binding', () => {
  for (const algorithm of ['ES256', 'ES384', 'EdDSA'] as const) {
    it.each([false, true])(
      'exports actual ' +
        algorithm +
        ' public coordinates for HSM=%s and independently verifies holder proof',
      async (hsm) => {
        const s = sample(algorithm, hsm)
        const credential = await createSDJWT(
          [{ name: 'role', value: 'sample student', type: 'plain' }],
          s.key,
          s.key,
          s.provider
        )
        const jwk = payload(credential.issuerJwt).cnf!.jwk
        const expected = s.pair.publicKey.export({ format: 'jwk' })
        expect(jwk).toEqual(
          s.ed
            ? { kty: 'OKP', crv: 'Ed25519', x: expected.x }
            : { kty: 'EC', crv: s.key.curve, x: expected.x, y: expected.y }
        )
        expect(jwk).not.toHaveProperty('d')
        expect(Buffer.from(jwk.x!, 'base64url')).toHaveLength(algorithm === 'ES384' ? 48 : 32)
        const presentation = await createPresentation(
          credential,
          [],
          s.key,
          'sample-audience',
          'sample-nonce',
          s.provider
        )
        expect(sampleHolderMatchesIssuer(s.key, credential.issuerJwt)).toBe(true)
        await expect(
          verifySampleSdPresentation(
            presentation,
            {
              issuerJwt: credential.issuerJwt,
              nonce: 'sample-nonce',
              audience: 'sample-audience',
            },
            s.key,
            s.provider
          )
        ).resolves.toBeUndefined()
        const issuerParts = credential.issuerJwt.split('.')
        const altered = JSON.parse(Buffer.from(issuerParts[1]!, 'base64url').toString())
        if (s.ed) altered.cnf.jwk.kty = 'EC'
        else altered.cnf.jwk.y = Buffer.alloc(algorithm === 'ES384' ? 48 : 32).toString('base64url')
        issuerParts[1] = Buffer.from(JSON.stringify(altered)).toString('base64url')
        expect(sampleHolderMatchesIssuer(s.key, issuerParts.join('.'))).toBe(false)
        const holderJwt = presentation.split('~').at(-1)!
        const [header, body, signature] = holderJwt.split('.')
        const imported = createPublicKey({ key: jwk, format: 'jwk' })
        const digest = s.ed ? null : algorithm === 'ES384' ? 'sha384' : 'sha256'
        expect(
          verify(
            digest,
            Buffer.from(`${header}.${body}`),
            { key: imported, dsaEncoding: 'ieee-p1363' },
            Buffer.from(signature!, 'base64url')
          )
        ).toBe(true)
        expect(
          verify(
            digest,
            Buffer.from(`${header}.${body}changed`),
            { key: imported, dsaEncoding: 'ieee-p1363' },
            Buffer.from(signature!, 'base64url')
          )
        ).toBe(false)
        const other = sample(algorithm, false).pair.publicKey
        expect(
          verify(
            digest,
            Buffer.from(`${header}.${body}`),
            { key: other, dsaEncoding: 'ieee-p1363' },
            Buffer.from(signature!, 'base64url')
          )
        ).toBe(false)
      }
    )
  }

  it.each(['bad hex', '040100', '044104' + '00'.repeat(64)])(
    'does not issue with malformed/off-curve holder input %s',
    async (publicKey) => {
      const s = sample('ES256', true)
      await expect(createSDJWT([], s.key, { ...s.key, publicKey }, s.provider)).rejects.toThrow()
      expect(s.provider.signData).not.toHaveBeenCalled()
    }
  )

  it('rejects an actual P-384 SPKI mislabeled P-256 before signing', async () => {
    const s = sample('ES384', false)
    await expect(
      createSDJWT([], s.key, { ...s.key, algorithm: 'ES256', curve: 'P-256' }, s.provider)
    ).rejects.toThrow()
    expect(s.provider.signData).not.toHaveBeenCalled()
  })

  it('preserves optional holder binding when no holder was selected', async () => {
    const s = sample('ES256', false)
    const credential = await createSDJWT([], s.key, undefined, s.provider)
    expect(payload(credential.issuerJwt)).not.toHaveProperty('cnf')
  })
})
