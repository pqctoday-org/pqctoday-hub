// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
/**
 * Self-pinned JWE KAT — guards the ML-KEM-768 + KMAC256 + AES-256-GCM path of
 * draft-ietf-jose-pqc-kem-05 direct key agreement (§5.1 KDF, §6.1 "ek").
 *
 * The draft never published worked examples and -06 dropped JOSE, so this
 * snapshot pins our own deterministic output — regression evidence only, not
 * interoperability. Any drift in:
 *   - ml_kem768 seeded keygen / encapsulate
 *   - KMAC256 KDF context (AlgorithmID || SuppPubInfo, big-endian uint32 lens)
 *   - the KEM ciphertext in the protected "ek" header, Encrypted Key absent
 *   - AAD = ASCII(BASE64URL(protected header)) per RFC 7516 §5.1 step 14
 *   - AES-GCM auth tag positioning / ordering
 * will flip the checks below and force a deliberate review.
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
import { kmac256, kmac256xof } from '@noble/hashes/sha3-addons.js'
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
  // Fixed-length KMAC256, not KMACXOF256 — see JWEEncryption.tsx deriveCek.
  return kmac256(sharedSecret, x, { dkLen: keyLenBytes })
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
    // -05 §6.1: "The JWE Encrypted Key MUST be absent."
    expect(encryptedKeyB64).toBe('')

    // Recipient side: ek → decap → KMAC256 → AES-GCM-decrypt
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(protectedB64))) as {
      ek: string
    }
    const sharedSecret = ml_kem768.decapsulate(base64urlDecode(header.ek), kp.secretKey)
    expect(bytesToHex(sharedSecret)).toBe(v.expected_shared_secret_hex)

    const cek = deriveCek(sharedSecret, 'A256GCM', 32)
    expect(cek.length).toBe(32)

    const iv = base64urlDecode(ivB64)
    const ciphertext = base64urlDecode(ciphertextB64)
    const tag = base64urlDecode(tagB64)
    // RFC 7516 §5.2 step 15: AAD is the ASCII of the ENCODED header, not its JSON.
    const aad = new TextEncoder().encode(protectedB64)

    // jsdom's crypto.subtle does AES-GCM; pass Uint8Array directly (ArrayBufferView)
    // to avoid cross-realm ArrayBuffer issues on Node 20 vs Node 24.
    const aesKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(cek),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    const combined = new Uint8Array(ciphertext.length + tag.length)
    combined.set(ciphertext, 0)
    combined.set(tag, ciphertext.length)
    const plaintextBytes = new Uint8Array(
      await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(iv), additionalData: new Uint8Array(aad) },
        aesKey,
        new Uint8Array(combined)
      )
    )
    expect(JSON.parse(new TextDecoder().decode(plaintextBytes))).toEqual(v.payload)
  })

  it('protected header carries alg, enc and ek (the KEM ciphertext)', () => {
    const parts = v.expected_jwe.split('.')
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as {
      alg: string
      enc: string
      ek: string
    }
    expect(header).toEqual(v.protected_header)
    expect(header.alg).toBe('ML-KEM-768')
    expect(header.enc).toBe('A256GCM')
  })

  it('ek carries the FIPS 203 ML-KEM-768 ciphertext (1088 B); Encrypted Key is empty', () => {
    const parts = v.expected_jwe.split('.')
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as {
      ek: string
    }
    expect(base64urlDecode(header.ek).length).toBe(1088)
    expect(parts[1]).toBe('')
    // And IV is the spec-default 12-byte (96-bit) for AES-GCM
    expect(base64urlDecode(parts[2]).length).toBe(12)
    // And tag is 16 bytes (128-bit)
    expect(base64urlDecode(parts[4]).length).toBe(16)
  })

  it('tampered ciphertext fails GCM tag verification', async () => {
    const kp = ml_kem768.keygen(hexToBytes(v.kem_seed_hex))
    const parts = v.expected_jwe.split('.')
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as {
      ek: string
    }
    const iv = base64urlDecode(parts[2])
    const ciphertext = base64urlDecode(parts[3])
    const tag = base64urlDecode(parts[4])
    const aad = new TextEncoder().encode(parts[0])

    // Flip a byte in the ciphertext — GCM tag must reject
    ciphertext[0] ^= 0x42

    const sharedSecret = ml_kem768.decapsulate(base64urlDecode(header.ek), kp.secretKey)
    const cek = deriveCek(sharedSecret, 'A256GCM', 32)
    const aesKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(cek),
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
          iv: new Uint8Array(iv),
          additionalData: new Uint8Array(aad),
        },
        aesKey,
        new Uint8Array(combined)
      )
    ).rejects.toThrow()
  })

  it('the pre-2026-10-01 AAD (decoded header JSON) no longer decrypts', async () => {
    // Guards the RFC 7516 fix: using the header JSON bytes as AAD must fail.
    const kp = ml_kem768.keygen(hexToBytes(v.kem_seed_hex))
    const parts = v.expected_jwe.split('.')
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0]))) as {
      ek: string
    }
    const sharedSecret = ml_kem768.decapsulate(base64urlDecode(header.ek), kp.secretKey)
    const aesKey = await crypto.subtle.importKey(
      'raw',
      new Uint8Array(deriveCek(sharedSecret, 'A256GCM', 32)),
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    )
    const ciphertext = base64urlDecode(parts[3])
    const tag = base64urlDecode(parts[4])
    const combined = new Uint8Array(ciphertext.length + tag.length)
    combined.set(ciphertext, 0)
    combined.set(tag, ciphertext.length)
    await expect(
      crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: new Uint8Array(base64urlDecode(parts[2])),
          additionalData: new Uint8Array(base64urlDecode(parts[0])),
        },
        aesKey,
        new Uint8Array(combined)
      )
    ).rejects.toThrow()
  })

  it('KDF is fixed-length KMAC256, not KMACXOF256 (they differ for the same inputs)', () => {
    const ss = hexToBytes(v.expected_shared_secret_hex)
    const x = new Uint8Array([0, 0, 0, 7, ...new TextEncoder().encode('A256GCM'), 0, 0, 1, 0])
    expect(bytesToHex(deriveCek(ss, 'A256GCM', 32))).toBe(bytesToHex(kmac256(ss, x, { dkLen: 32 })))
    expect(bytesToHex(kmac256(ss, x, { dkLen: 32 }))).not.toBe(
      bytesToHex(kmac256xof(ss, x, { dkLen: 32 }))
    )
  })

  it('sanity: hex helpers roundtrip', () => {
    const bytes = new Uint8Array([0, 1, 2, 254, 255])
    expect(bytesEq(hexToBytes(bytesToHex(bytes)), bytes)).toBe(true)
  })
})
