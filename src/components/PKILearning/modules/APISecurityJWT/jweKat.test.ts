// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Self-pinned JWE KAT — guards the ML-KEM-768 + KMAC256 + AES-256-GCM path
 * documented in draft-ietf-jose-pqc-kem-05 §5.1.
 *
 * The IETF draft has no published worked examples yet, so this snapshot pins
 * our own deterministic output. Any drift in:
 *   - ml_kem768 seeded keygen / encapsulate
 *   - KMAC256 KDF context (AlgorithmID || SuppPubInfo, big-endian uint32 lens)
 *   - AAD bytes (JOSE-protected-header UTF-8)
 *   - AES-GCM auth tag positioning / ordering
 * will flip the byte-equality check and force a deliberate review.
 *
 * The pinned IV is all-zeros — KAT-only. Real protocol traffic MUST use a
 * fresh random IV per message; reusing this fixture's IV with a different
 * plaintext would catastrophically leak the keystream.
 *
 * Regenerate via the snippet in the JSON fixture's `generator` field after
 * any deliberate spec or KDF change.
 */
import { describe, expect, it } from 'vitest'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { kmac256xof } from '@noble/hashes/sha3-addons.js'
import kat from '@/data/acvp/jose-pqc-kem-jwe-kat.json'

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2)
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  return out
}

function bytesToHex(bytes: Uint8Array): string {
  let hex = ''
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0')
  return hex
}

function bytesEq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function base64urlDecode(s: string): Uint8Array {
  let base64 = s.replace(/-/g, '+').replace(/_/g, '/')
  while (base64.length % 4 !== 0) base64 += '='
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** KDF per draft-ietf-jose-pqc-kem-05 §5.1 — mirror of JWEEncryption.tsx's
 *  deriveCek to keep this test self-contained. */
function deriveCek(sharedSecret: Uint8Array, encAlg: string, keyLenBytes: number): Uint8Array {
  const algNameBytes = new TextEncoder().encode(encAlg)
  const x = new Uint8Array(4 + algNameBytes.length + 4)
  const dv = new DataView(x.buffer)
  dv.setUint32(0, algNameBytes.length, false)
  x.set(algNameBytes, 4)
  dv.setUint32(4 + algNameBytes.length, keyLenBytes * 8, false)
  return kmac256xof(sharedSecret, x, { dkLen: keyLenBytes })
}

describe('ML-KEM-768 JWE — self-pinned KAT (draft-ietf-jose-pqc-kem-05)', () => {
  const v = (kat as { vector: typeof kat.vector }).vector

  it('seeded keygen reproduces the pinned ML-KEM-768 public key', () => {
    const seed = hexToBytes(v.kem_seed_hex)
    const kp = ml_kem768.keygen(seed)
    expect(bytesToHex(kp.publicKey)).toBe(v.ml_kem_public_key_hex)
  })

  it('encapsulate with pinned seed reproduces the pinned shared secret', () => {
    const kp = ml_kem768.keygen(hexToBytes(v.kem_seed_hex))
    const encapSeed = hexToBytes(v.encap_seed_hex)
    const { sharedSecret } = ml_kem768.encapsulate(kp.publicKey, encapSeed)
    expect(bytesToHex(sharedSecret)).toBe(v.expected_shared_secret_hex)
  })

  it('end-to-end: decapsulate + KMAC256 + AES-GCM decrypt reproduces the payload', async () => {
    const kp = ml_kem768.keygen(hexToBytes(v.kem_seed_hex))
    const parts = v.expected_jwe.split('.')
    expect(parts).toHaveLength(5)
    const [protectedB64, encryptedKeyB64, ivB64, ciphertextB64, tagB64] = parts

    // Recipient side: decap → KMAC256 → AES-GCM-decrypt
    const encryptedKey = base64urlDecode(encryptedKeyB64)
    const sharedSecret = ml_kem768.decapsulate(encryptedKey, kp.secretKey)
    expect(bytesToHex(sharedSecret)).toBe(v.expected_shared_secret_hex)

    const cek = deriveCek(sharedSecret, 'A256GCM', 32)
    expect(cek.length).toBe(32)

    const iv = base64urlDecode(ivB64)
    const ciphertext = base64urlDecode(ciphertextB64)
    const tag = base64urlDecode(tagB64)
    const aad = base64urlDecode(protectedB64)

    // jsdom's crypto.subtle does AES-GCM; reconstruct full ciphertext for WebCrypto
    const cekBuf = cek.buffer.slice(cek.byteOffset, cek.byteOffset + cek.byteLength)
    const aesKey = await crypto.subtle.importKey(
      'raw',
      cekBuf as ArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    const combined = new Uint8Array(ciphertext.length + tag.length)
    combined.set(ciphertext, 0)
    combined.set(tag, ciphertext.length)
    const ivBuf = iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength)
    const aadBuf = aad.buffer.slice(aad.byteOffset, aad.byteOffset + aad.byteLength)
    const combinedBuf = combined.buffer.slice(0, combined.byteLength)
    const plaintextBytes = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBuf as ArrayBuffer, additionalData: aadBuf as ArrayBuffer },
        aesKey,
        combinedBuf as ArrayBuffer
      )
    )
    expect(JSON.parse(new TextDecoder().decode(plaintextBytes))).toEqual(v.payload)
  })

  it('protected header decodes to the spec-correct alg/enc/typ triple', () => {
    const parts = v.expected_jwe.split('.')
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as {
      alg: string
      enc: string
      typ: string
    }
    expect(header).toEqual(v.protected_header)
  })

  it('encrypted-key segment has the FIPS 203 ML-KEM-768 ciphertext length (1088 B)', () => {
    const parts = v.expected_jwe.split('.')
    const ct = base64urlDecode(parts[1])
    expect(ct.length).toBe(1088)
    // And IV is the spec-default 12-byte (96-bit) for AES-GCM
    expect(base64urlDecode(parts[2]).length).toBe(12)
    // And tag is 16 bytes (128-bit)
    expect(base64urlDecode(parts[4]).length).toBe(16)
  })

  it('tampered ciphertext fails GCM tag verification', async () => {
    const kp = ml_kem768.keygen(hexToBytes(v.kem_seed_hex))
    const parts = v.expected_jwe.split('.')
    const encryptedKey = base64urlDecode(parts[1])
    const iv = base64urlDecode(parts[2])
    const ciphertext = base64urlDecode(parts[3])
    const tag = base64urlDecode(parts[4])
    const aad = base64urlDecode(parts[0])

    // Flip a byte in the ciphertext — GCM tag must reject
    ciphertext[0] ^= 0x42

    const sharedSecret = ml_kem768.decapsulate(encryptedKey, kp.secretKey)
    const cek = deriveCek(sharedSecret, 'A256GCM', 32)
    const cekBuf = cek.buffer.slice(cek.byteOffset, cek.byteOffset + cek.byteLength)
    const aesKey = await crypto.subtle.importKey(
      'raw',
      cekBuf as ArrayBuffer,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    const combined = new Uint8Array(ciphertext.length + tag.length)
    combined.set(ciphertext, 0)
    combined.set(tag, ciphertext.length)

    await expect(
      crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer,
          additionalData: aad.buffer.slice(
            aad.byteOffset,
            aad.byteOffset + aad.byteLength
          ) as ArrayBuffer,
        },
        aesKey,
        combined.buffer.slice(0, combined.byteLength) as ArrayBuffer
      )
    ).rejects.toThrow()
  })

  it('sanity: hex helpers roundtrip', () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255])
    expect(bytesEq(hexToBytes(bytesToHex(bytes)), bytes)).toBe(true)
  })
})
