// SPDX-License-Identifier: AGPL-3.0-only
import 'reflect-metadata'
import { AsnConvert } from '@peculiar/asn1-schema'
import { Certificate } from '@peculiar/asn1-x509'
import { hsm_verifyBytes, type SoftHSMModule } from '@/wasm/softhsm'
import fixtures from '../../VPNSSHModule/data/tlsMeasuredSamples.json'
import {
  measureTlsSample,
  type EncodedTlsSample,
} from '../../VPNSSHModule/data/measuredTlsHandshake'

export const certificateVerifyHex = (bytes: Uint8Array) =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
const join = (...parts: Uint8Array[]) => {
  const result = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}
const digest = async (bytes: Uint8Array) =>
  new Uint8Array(await crypto.subtle.digest('SHA-256', new Uint8Array(bytes)))

/** RFC9846§4.5.2 preserves the construction from RFC8446§4.4.3 used by this captured profile.
 * SHA-256 belongs to this captured TLS_AES_128_GCM_SHA256 profile.
 * Role is domain separation, not the certificate's signature algorithm/hash.
 */
export async function certificateVerifyInput(transcript: Uint8Array, role: 'server' | 'client') {
  return join(
    new Uint8Array(64).fill(0x20),
    new TextEncoder().encode(`TLS 1.3, ${role} CertificateVerify`),
    new Uint8Array([0]),
    await digest(transcript)
  )
}

/** Reconstruct the genuine retained TLS1.3/ML-DSA-65 server signature input.
 * This is verification of captured bytes, not a new connection or CA path validation.
 */
export async function getCertificateVerifySample(
  fixture: EncodedTlsSample = fixtures.profiles.find((p) => p.name === 'pqc')!
) {
  const measured = measureTlsSample('pure-pqc', fixture)
  const messages = fixture.messages.map((m) =>
    Uint8Array.from(atob(m.base64), (c) => c.charCodeAt(0))
  )
  const transcript = join(...messages.slice(0, 4)) // Includes four-byte Handshake headers, through Certificate.
  const certificate = messages[3]
  const leafLength = certificate[8] * 65536 + certificate[9] * 256 + certificate[10]
  const leafDer = certificate.slice(11, 11 + leafLength)
  const parsed = AsnConvert.parse(new Uint8Array(leafDer).buffer, Certificate)
  const spki = parsed.tbsCertificate.subjectPublicKeyInfo
  if (spki.algorithm.algorithm !== '2.16.840.1.101.3.4.3.18')
    throw new Error('Expected the captured ML-DSA-65 leaf key')
  const publicKey = new Uint8Array(spki.subjectPublicKey)
  if (publicKey.length !== 1952) throw new Error('Wrong raw ML-DSA-65 key length')
  const signature = messages[4].slice(8) // Handshake4 + scheme2 + signature-vector length2.
  const input = await certificateVerifyInput(transcript, 'server')
  return {
    transcript,
    transcriptHash: await digest(transcript),
    input,
    publicKey,
    signature,
    leafDer,
    measured,
  }
}

/** Build contrary checks from the same exact sample; no replacement key or transcript is accepted as the original. */
export async function certificateVerifyControls(
  sample: Awaited<ReturnType<typeof getCertificateVerifySample>>
) {
  const changedTranscript = sample.transcript.slice()
  changedTranscript[10] ^= 1
  const changedSignature = sample.signature.slice()
  changedSignature[0] ^= 1
  const wrongKey = sample.publicKey.slice()
  wrongKey[wrongKey.length - 1] ^= 1
  return {
    changedTranscriptInput: await certificateVerifyInput(changedTranscript, 'server'),
    clientContextInput: await certificateVerifyInput(sample.transcript, 'client'),
    changedSignature,
    truncatedSignature: sample.signature.slice(0, -1),
    wrongKey,
  }
}

/** Keep operational PKCS#11 failures distinct from expected signature rejection.
 * Observe only this call's existing interfaces; the shared module is never mutated.
 */
export function verifyCapturedBytes(
  module: SoftHSMModule,
  session: number,
  key: number,
  input: Uint8Array,
  signature: Uint8Array
): boolean {
  let verificationCode: number | undefined
  const observed = new Proxy(module, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver)
      if (property !== '_C_VerifyMessage') return value
      if (typeof value !== 'function')
        throw new Error('CertificateVerify backend operation unavailable')
      return (...args: number[]) => {
        const result = Reflect.apply(value, target, args)
        if (typeof result !== 'number' || !Number.isInteger(result))
          throw new Error('CertificateVerify operation incomplete (non-numeric return code)')
        const code = result >>> 0
        verificationCode = code
        return code
      }
    },
  })
  const valid = hsm_verifyBytes(observed, session, key, input, signature)
  // CKR_OK, CKR_SIGNATURE_INVALID, CKR_SIGNATURE_LEN_RANGE. Other codes are not negative-test success.
  if (
    verificationCode === undefined ||
    ![0, 0xc0, 0xc1].includes(verificationCode) ||
    valid !== (verificationCode === 0)
  )
    throw new Error(
      `CertificateVerify operation incomplete (verify=${verificationCode === undefined ? 'missing' : verificationCode.toString(16)})`
    )
  return valid
}
