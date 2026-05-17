// SPDX-License-Identifier: GPL-3.0-only
/**
 * ML-KEM cross-implementation KAT.
 *
 * Strategy: Node 24's built-in `crypto.encapsulate` (OpenSSL 3.5.4)
 * produces a (ciphertext, sharedKey) pair against an ML-KEM-{512,768,1024}
 * public key. Our `public/wasm/openssl.wasm` (OpenSSL 3.6.2) decapsulates
 * the ciphertext using the matching private key via `pkeyutl -decap`,
 * and the test asserts the recovered shared secret is byte-equal.
 *
 * If both implementations match FIPS 203, the shared secrets match. If
 * either side has a bug in K-PKE encryption, the H/J/G hash absorption,
 * or the implicit rejection path, the secrets diverge.
 */
import { generateKeyPairSync, encapsulate, decapsulate, KeyObject } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { newModule, runOpenssl, writeFile, readFileBin } from './openssl-driver'

interface KEMFixture {
  alg: 'ml-kem-512' | 'ml-kem-768' | 'ml-kem-1024'
  privateKeyPem: string
  ciphertext: Buffer
  /** The shared secret Node computed at encap time — what WASM should
   *  recover via decap. */
  expectedSharedSecret: Buffer
  /** Pinned per-algorithm sizes from FIPS 203. */
  expectedCtLen: number
  expectedSsLen: number
}

function buildKemFixture(
  alg: KEMFixture['alg'],
  expectedCtLen: number,
  expectedSsLen: number
): KEMFixture {
  const { publicKey, privateKey } = generateKeyPairSync(alg)
  const { sharedKey, ciphertext } = encapsulate(publicKey as KeyObject)
  if (ciphertext.length !== expectedCtLen) {
    throw new Error(`${alg} ct length drift: got ${ciphertext.length}, want ${expectedCtLen}`)
  }
  if (sharedKey.length !== expectedSsLen) {
    throw new Error(`${alg} ss length drift: got ${sharedKey.length}, want ${expectedSsLen}`)
  }
  // Sanity: Node's own roundtrip must also succeed before we trust the fixture.
  const ss2 = decapsulate(privateKey as KeyObject, ciphertext)
  if (!Buffer.from(ss2).equals(Buffer.from(sharedKey))) {
    throw new Error(`${alg} Node roundtrip mismatch — fixture invalid`)
  }
  return {
    alg,
    privateKeyPem: (privateKey as KeyObject).export({
      format: 'pem',
      type: 'pkcs8',
    }) as string,
    ciphertext: Buffer.from(ciphertext),
    expectedSharedSecret: Buffer.from(sharedKey),
    expectedCtLen,
    expectedSsLen,
  }
}

async function decapWithWasm(
  fixture: KEMFixture
): Promise<{ rc: number; ss?: Uint8Array; stderr: string }> {
  const M = await newModule({ quiet: true })
  const skPath = `/ssl/kem-${fixture.alg}.sk.pem`
  const ctPath = `/ssl/kem-${fixture.alg}.ct.bin`
  const ssPath = `/ssl/kem-${fixture.alg}.ss.bin`
  writeFile(M, skPath, fixture.privateKeyPem)
  writeFile(M, ctPath, new Uint8Array(fixture.ciphertext))
  const { rc, stderr } = runOpenssl(M, [
    'pkeyutl',
    '-decap',
    '-inkey',
    skPath,
    '-in',
    ctPath,
    '-out',
    ssPath,
  ])
  if (rc !== 0) return { rc, stderr }
  const ss = readFileBin(M, ssPath)
  return { rc, ss, stderr }
}

describe('ML-KEM cross-impl KAT — Node encap → WASM decap', () => {
  const cases: Array<{ alg: KEMFixture['alg']; ctLen: number; ssLen: number }> = [
    { alg: 'ml-kem-512', ctLen: 768, ssLen: 32 },
    { alg: 'ml-kem-768', ctLen: 1088, ssLen: 32 },
    { alg: 'ml-kem-1024', ctLen: 1568, ssLen: 32 },
  ]

  it.each(cases)(
    '$alg: WASM decap recovers the exact shared secret Node computed',
    async ({ alg, ctLen, ssLen }) => {
      const fx = buildKemFixture(alg, ctLen, ssLen)
      const { rc, ss, stderr } = await decapWithWasm(fx)
      expect(rc, `stderr tail: ${stderr.slice(-300)}`).toBe(0)
      expect(ss).toBeDefined()
      expect(Buffer.from(ss!).equals(fx.expectedSharedSecret)).toBe(true)
    },
    120_000
  )

  it.each(cases)(
    '$alg: implicit-rejection branch — flipping a ciphertext byte yields a different shared secret (not an error)',
    async ({ alg, ctLen, ssLen }) => {
      // FIPS 203 §6.3 mandates implicit rejection: decap with a malformed
      // ciphertext returns a DIFFERENT shared secret derived from a stored
      // rejection key, NOT an error. The CCA-secure design relies on this
      // — an attacker who flips bits gains zero information from rc.
      const fx = buildKemFixture(alg, ctLen, ssLen)
      const tamperedCt = Buffer.from(fx.ciphertext)
      tamperedCt[Math.floor(tamperedCt.length / 2)] ^= 0x55
      const tamperedFx = { ...fx, ciphertext: tamperedCt }
      const { rc, ss } = await decapWithWasm(tamperedFx)
      // The decap call MUST succeed (rc=0) — that's what implicit rejection means.
      expect(rc).toBe(0)
      expect(ss).toBeDefined()
      // The recovered secret MUST differ from the original shared secret.
      expect(Buffer.from(ss!).equals(fx.expectedSharedSecret)).toBe(false)
      // And it must still be the right LENGTH (the rejection key has the
      // same shape as a real shared secret).
      expect(ss!.length).toBe(ssLen)
    },
    120_000
  )
})
