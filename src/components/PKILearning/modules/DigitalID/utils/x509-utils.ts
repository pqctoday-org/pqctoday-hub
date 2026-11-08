// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { AsnConvert, OctetString } from '@peculiar/asn1-schema'
import { AlgorithmIdentifier, SubjectPublicKeyInfo } from '@peculiar/asn1-x509'
import { PemConverter } from '@peculiar/x509'
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey } from '../types'
import {
  issueCertificate,
  ecdsaRawSignatureToDer,
  derToPem,
} from '../../HybridCrypto/services/certBuilder'
import { assertSigningSelection, isHsmBackedKey } from './hsm-crypto-provider'

const hexToBytes = (hex: string): Uint8Array => {
  if (hex.length % 2 !== 0 || !/^[0-9a-f]+$/i.test(hex))
    throw new Error('Invalid sample public-key hex')
  return Uint8Array.from(hex.match(/../g)!, (byte) => parseInt(byte, 16))
}

export async function generateX509Certificate(
  key: CryptoKey,
  provider: CryptoProvider,
  subjectName: string,
  onLog?: (msg: string) => void
): Promise<string> {
  assertSigningSelection(key.algorithm, key.curve)
  onLog?.(
    `Generating a self-signed sample certificate for ${subjectName} (${key.algorithm}/${key.curve})...`
  )
  const ed = key.algorithm === 'EdDSA'
  const signatureOid = ed
    ? '1.3.101.112'
    : key.algorithm === 'ES384'
      ? '1.2.840.10045.4.3.3'
      : '1.2.840.10045.4.3.2'
  let publicKey: Uint8Array
  let subjectAlgId: AlgorithmIdentifier
  if (isHsmBackedKey(key)) {
    const bytes = hexToBytes(key.publicKey)
    publicKey = ed ? bytes : new Uint8Array(AsnConvert.parse(bytes, OctetString).buffer)
    subjectAlgId = ed
      ? new AlgorithmIdentifier({ algorithm: '1.3.101.112' })
      : new AlgorithmIdentifier({
          algorithm: '1.2.840.10045.2.1',
          parameters: (key.curve === 'P-384'
            ? new Uint8Array([6, 5, 43, 129, 4, 0, 34])
            : new Uint8Array([6, 8, 42, 134, 72, 206, 61, 3, 1, 7])
          ).buffer,
        })
  } else {
    // The existing OpenSSL provider stores a base64-encoded PEM SPKI, not hex.
    const spki = AsnConvert.parse(PemConverter.decode(atob(key.publicKey))[0], SubjectPublicKeyInfo)
    subjectAlgId = spki.algorithm
    publicKey = new Uint8Array(spki.subjectPublicKey)
  }
  const expectedParameters =
    key.curve === 'P-384'
      ? new Uint8Array([6, 5, 43, 129, 4, 0, 34])
      : new Uint8Array([6, 8, 42, 134, 72, 206, 61, 3, 1, 7])
  const expectedAlgorithm = new AlgorithmIdentifier({
    algorithm: ed ? '1.3.101.112' : '1.2.840.10045.2.1',
    ...(ed ? {} : { parameters: expectedParameters.buffer }),
  })
  if (
    !subjectAlgId.isEqual(expectedAlgorithm) ||
    (ed && (publicKey.length !== 32 || subjectAlgId.parameters !== undefined)) ||
    (!ed && (publicKey.length !== (key.curve === 'P-384' ? 97 : 65) || publicKey[0] !== 4))
  ) {
    throw new Error('Sample certificate public key does not match the selected signing algorithm')
  }
  const { der } = await issueCertificate({
    subject: subjectName,
    subjectKeyOid: subjectAlgId.algorithm,
    subjectAlgId,
    subjectPublicKey: publicKey,
    issuer: null,
    isCA: false,
    keyUsage: ['digitalSignature'],
    selfSigner: {
      signatureOid,
      signerFn: async (tbs) => {
        onLog?.(`Signing sample TBSCertificate using ${key.algorithm}/${key.curve}...`)
        const signature = await provider.signRaw(key, tbs, onLog)
        // PKCS#11 ECDSA is r||s; X.509 requires DER. Ed25519 is already raw.
        return !ed && isHsmBackedKey(key) ? ecdsaRawSignatureToDer(signature) : signature
      },
    },
  })
  onLog?.(
    'Self-signed sample certificate generated; this does not establish qualified-certificate status.'
  )
  return derToPem(der, 'CERTIFICATE')
}
