// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { FAQ_DATA } from './faqData'

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
})
