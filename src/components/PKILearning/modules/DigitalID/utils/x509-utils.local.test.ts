// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { describe, it, expect } from 'vitest'
import { generateKeyPairSync, sign, X509Certificate } from 'node:crypto'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { Certificate, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { PemConverter } from '@peculiar/x509'
import { generateX509Certificate } from './x509-utils'
import type { CryptoKey } from '../types'
import type { CryptoProvider } from './crypto-provider'

describe('Digital ID sample certificate algorithm/encoding', () => {
  it.each(['EdDSA', 'ES256', 'ES384'] as const)(
    'native OpenSSL independently verifies %s sample encoding',
    async (alg) => {
      const ed = alg === 'EdDSA',
        curve = alg === 'ES384' ? 'P-384' : ed ? 'Ed25519' : 'P-256'
      const pair = ed
        ? generateKeyPairSync('ed25519')
        : generateKeyPairSync('ec', { namedCurve: curve })
      const spki = AsnConvert.parse(
        pair.publicKey.export({ format: 'der', type: 'spki' }),
        SubjectPublicKeyInfo
      )
      for (const hsm of [true, false]) {
        const key: CryptoKey = {
          id: 'sample',
          algorithm: alg,
          curve,
          type: curve,
          publicKey: hsm
            ? Buffer.from(
                ed
                  ? spki.subjectPublicKey
                  : AsnConvert.serialize(new OctetString(spki.subjectPublicKey))
              ).toString('hex')
            : btoa(pair.publicKey.export({ format: 'pem', type: 'spki' }).toString()),
          privateKey: hsm
            ? '[PKCS#11 handle: 1]'
            : btoa(pair.privateKey.export({ format: 'pem', type: 'pkcs8' }).toString()),
          created: 'sample',
          usage: 'SIGN',
          status: 'ACTIVE',
        }
        const provider = {
          signRaw: async (_key: CryptoKey, data: Uint8Array) =>
            new Uint8Array(
              sign(ed ? null : alg === 'ES384' ? 'sha384' : 'sha256', data, {
                key: pair.privateKey,
                dsaEncoding: hsm ? 'ieee-p1363' : 'der',
              })
            ),
        } as CryptoProvider
        const pem = await generateX509Certificate(key, provider, '/CN=Sample Signing')
        const cert = new X509Certificate(pem)
        expect(cert.verify(pair.publicKey)).toBe(true)
        const asn = AsnConvert.parse(PemConverter.decode(pem)[0], Certificate)
        expect(asn.signatureAlgorithm.algorithm).toBe(
          ed ? '1.3.101.112' : alg === 'ES384' ? '1.2.840.10045.4.3.3' : '1.2.840.10045.4.3.2'
        )
        expect(asn.tbsCertificate.subjectPublicKeyInfo.algorithm.algorithm).toBe(
          ed ? '1.3.101.112' : '1.2.840.10045.2.1'
        )
        expect(asn.tbsCertificate.subjectPublicKeyInfo.subjectPublicKey).toEqual(
          spki.subjectPublicKey
        )
        if (ed) expect(asn.tbsCertificate.subjectPublicKeyInfo.algorithm.parameters).toBeUndefined()
      }
    }
  )
})
