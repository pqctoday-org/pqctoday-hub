// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { FAQ_DATA } from './faqData'
import {
  CHAIN_SAMPLE,
  encodeSampleCertificateMessage,
} from '@/components/PKILearning/modules/PKIWorkshop/measuredChainSample'

function answer(question: string): string {
  const item = FAQ_DATA.flatMap((category) => category.items).find(
    (candidate) => candidate.question === question
  )
  if (!item) throw new Error(`Missing FAQ: ${question}`)
  return item.answer
}

function statedBytes(text: string, label: string): number {
  const value = text.match(new RegExp(`${label} ([\\d,]+) bytes`))?.at(1)
  if (!value) throw new Error(`Missing byte count: ${label}`)
  return Number(value.replaceAll(',', ''))
}

describe('FAQ published size arithmetic', () => {
  it('accounts for both selected hybrid TLS shares against both classical shares', () => {
    const text = answer('How does ML-KEM change the TLS 1.3 handshake?')
    // RFC 10024: X25519 plus ML-KEM-768 encapsulation key / ciphertext.
    const x25519 = 32
    const mlKemPublicKey = 1184
    const mlKemCiphertext = 1088
    const client = statedBytes(text, 'client share is')
    const server = statedBytes(text, 'server share is')
    const additional = statedBytes(text, 'additional key-share data is')
    expect(client).toBe(x25519 + mlKemPublicKey)
    expect(server).toBe(x25519 + mlKemCiphertext)
    expect(additional).toBe(client + server - 2 * x25519)
    expect(additional).not.toBe(mlKemPublicKey)
    expect(additional).not.toBe(1024)
  })

  it('distinguishes raw signature bytes from the unpadded compact-JWS segment', () => {
    const text = answer('What is the JWT size problem with PQC?')
    const raw = statedBytes(text, 'raw signature is')
    const encoded = statedBytes(text, 'base64url signature segment is')
    // Public size fixture only: no valid signature or JOSE profile is implied.
    const segment = Buffer.alloc(raw).toString('base64url')
    expect(raw).toBe(3309) // FIPS 204, ML-DSA-65
    expect(encoded).toBe(Buffer.byteLength(segment, 'ascii'))
    expect(encoded).toBe(Math.ceil((raw * 8) / 6))
    expect(encoded).toBeGreaterThan(raw)
    expect(segment).not.toContain('=')
  })

  it('ties the certificate-chain figures to the Certificate message framing and the sample constants', () => {
    const text = answer('How do PQC certificates affect TLS chain size?')
    const pair = (pattern: RegExp): [number, number] => {
      const match = text.match(pattern)
      if (!match) throw new Error(`Missing figures: ${pattern}`)
      return [match[1], match[2]].map((value) => Number(value.replaceAll(',', ''))) as [
        number,
        number,
      ]
    }
    const [mlDerSum, rsaDerSum] = pair(
      /total ([\d,]+) bytes for ML-DSA-65 and ([\d,]+) bytes for RSA-2048/
    )
    const [mlBody, rsaBody] = pair(/Certificate bodies are ([\d,]+) and ([\d,]+) bytes/)
    const [mlHandshake, rsaHandshake] = pair(/Handshake header gives ([\d,]+) and ([\d,]+) bytes/)
    // Per-certificate DER lengths of the example's fictional chains, measured with OpenSSL 3.6.3
    // (the version of the site's browser OpenSSL) and again in the production build. The root is
    // local to the example and is not transmitted.
    const measured = {
      'ML-DSA-65': { root: 5512, intermediate: 5520, leaf: 5562 },
      'RSA-2048': { root: 783, intermediate: 791, leaf: 833 },
    } as const
    const stated = {
      'ML-DSA-65': [mlDerSum, mlBody, mlHandshake],
      'RSA-2048': [rsaDerSum, rsaBody, rsaHandshake],
    } as const
    for (const profile of ['ML-DSA-65', 'RSA-2048'] as const) {
      const { intermediate, leaf } = measured[profile]
      const [derSum, body, handshake] = stated[profile]
      expect(derSum).toBe(intermediate + leaf)
      // Body: 1 + 3 request-context and list lengths, plus a 3-byte length and 2-byte empty
      // extensions for each of the two entries. Handshake: a 4-byte header on the body.
      expect(body).toBe(derSum + 14)
      expect(handshake).toBe(body + 4)
      // The same arithmetic, taken from the function the example itself uses.
      const framed = encodeSampleCertificateMessage(
        new Uint8Array(leaf),
        new Uint8Array(intermediate)
      )
      expect(framed.certificateDerBytes).toBe(derSum)
      expect(framed.certificateBody.length).toBe(body)
      expect(framed.handshakeMessage.length).toBe(handshake)
    }
    // The root is local to the example, so it is not in any stated figure.
    expect(text).toContain(CHAIN_SAMPLE.notBefore.slice(0, 10))
    expect(text).toContain(CHAIN_SAMPLE.notAfter.slice(0, 10))
    expect(text).toMatch(
      /leaf and intermediate; the root is supplied only as a local sample trust anchor/
    )
  })
})
