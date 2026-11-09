// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection -- fixed shipped sample paths and RFC 8554 table lookups */
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeLmsPublicKey } from './lmsPublicKey'

// Reads the three files "Load Sample Data" ships in public/lms-sample and checks
// them with a small RFC 8554 verifier written here, independent of the bundled
// WebAssembly engine. SHA-256, n = 32 (the only profile the Studio exposes).
const dir = join(process.cwd(), 'public', 'lms-sample')
const pem = readFileSync(join(dir, 'lms-public.pem'), 'utf-8')
const message = new Uint8Array(readFileSync(join(dir, 'lms-message.txt')))
const signature = new Uint8Array(readFileSync(join(dir, 'lms-signature.bin')))

const sha256 = (...parts: Uint8Array[]) => {
  const hash = createHash('sha256')
  for (const part of parts) hash.update(part)
  return new Uint8Array(hash.digest())
}
const u16 = (n: number) => Uint8Array.of((n >> 8) & 255, n & 255)
const u32 = (n: number) =>
  Uint8Array.of((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
const word = (bytes: Uint8Array, at: number) =>
  new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(at)
// LMOTS type -> [w, p, ls] for SHA-256 n = 32 (RFC 8554 table 1).
const LMOTS: Record<number, [number, number, number]> = {
  1: [1, 265, 7],
  2: [2, 133, 6],
  3: [4, 67, 4],
  4: [8, 34, 0],
}
const LMS_HEIGHT: Record<number, number> = { 5: 5, 6: 10, 7: 15, 8: 20, 9: 25 }
const same = (a: Uint8Array, b: Uint8Array) =>
  a.length === b.length && a.every((v, i) => v === b[i])
const coef = (s: Uint8Array, i: number, w: number) =>
  ((s[Math.floor((i * w) / 8)] >> (8 - (w * (i % (8 / w)) + w))) & ((1 << w) - 1)) >>> 0

/** RFC 8554 section 5.4 + 5.3 for a single-level HSS key (hss_public_key = L || lms_public_key). */
function verifyHss(publicKey: Uint8Array, msg: Uint8Array, sig: Uint8Array): boolean {
  if (publicKey.length !== 60 || word(publicKey, 0) !== 1 || word(sig, 0) !== 0) return false
  const lmsType = word(publicKey, 4)
  const otsType = word(publicKey, 8)
  const I = publicKey.slice(12, 28)
  const K = publicKey.slice(28, 60)
  const height = LMS_HEIGHT[lmsType]
  const params = LMOTS[otsType]
  if (!height || !params) return false
  const [w, p, ls] = params
  const lms = sig.slice(4)
  const otsLength = 4 + 32 + p * 32
  if (lms.length !== 4 + otsLength + 4 + height * 32) return false
  const q = word(lms, 0)
  if (q >= 2 ** height || word(lms, 4) !== otsType || word(lms, 4 + otsLength) !== lmsType) {
    return false
  }
  const C = lms.slice(8, 40)
  const Q = sha256(I, u32(q), u16(0x8181), C, msg)
  let sum = 0
  for (let i = 0; i < (32 * 8) / w; i++) sum += (1 << w) - 1 - coef(Q, i, w)
  const Qc = Uint8Array.of(...Q, ...u16((sum << ls) & 0xffff))
  const z: Uint8Array[] = []
  for (let i = 0; i < p; i++) {
    let tmp = lms.slice(40 + i * 32, 72 + i * 32)
    for (let j = coef(Qc, i, w); j < (1 << w) - 1; j++) {
      tmp = sha256(I, u32(q), u16(i), Uint8Array.of(j), tmp)
    }
    z.push(tmp)
  }
  const candidate = sha256(I, u32(q), u16(0x8080), ...z)
  let node = 2 ** height + q
  let hash = sha256(I, u32(node), u16(0x8282), candidate)
  for (let i = 0; i < height; i++) {
    const sibling = lms.slice(8 + otsLength + i * 32, 8 + otsLength + (i + 1) * 32)
    const next = Math.floor(node / 2)
    hash =
      node % 2 === 1
        ? sha256(I, u32(next), u16(0x8383), sibling, hash)
        : sha256(I, u32(next), u16(0x8383), hash, sibling)
    node = next
  }
  return same(hash, K)
}

const publicKey = decodeLmsPublicKey(
  Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) =>
    c.charCodeAt(0)
  )
)

describe('Shipped LMS sample files (public/lms-sample)', () => {
  it('stores the public key as the RFC 9802 80-byte SubjectPublicKeyInfo with a raw 60-byte key', () => {
    const der = Uint8Array.from(atob(pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), (c) =>
      c.charCodeAt(0)
    )
    expect(der.length).toBe(80)
    expect(Array.from(der.slice(0, 20))).toEqual([
      0x30, 78, 0x30, 13, 0x06, 11, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 1, 9, 16, 3, 17, 0x03, 61,
      0,
    ])
    expect(publicKey.length).toBe(60)
    expect([word(publicKey, 0), word(publicKey, 4), word(publicKey, 8)]).toEqual([1, 6, 4])
  })
  it('has the 1456-byte single-level H10/W8 signature layout', () => {
    // Nspk 0 (4) + q (4) + LMOTS (4 + 32 + 34 * 32) + LMS type (4) + path (10 * 32).
    expect(signature.length).toBe(4 + 4 + (4 + 32 + 34 * 32) + 4 + 10 * 32)
    expect(signature.length).toBe(1456)
  })
  it('verifies the shipped signature over the shipped message', () => {
    expect(verifyHss(publicKey, message, signature)).toBe(true)
  })
  it('rejects a changed message, signature or key', () => {
    const badMessage = message.slice()
    badMessage[0] ^= 1
    expect(verifyHss(publicKey, badMessage, signature)).toBe(false)
    const badSignature = signature.slice()
    badSignature[100] ^= 1
    expect(verifyHss(publicKey, message, badSignature)).toBe(false)
    const badKey = publicKey.slice()
    badKey[59] ^= 1
    expect(verifyHss(badKey, message, signature)).toBe(false)
    expect(verifyHss(publicKey, message, signature.slice(0, -1))).toBe(false)
  })
})
