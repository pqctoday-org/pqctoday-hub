// SPDX-License-Identifier: AGPL-3.0-only
/** Public reference inputs only. This runner never receives workshop keys or payloads. */
import { ml_kem768_x25519 } from '@noble/post-quantum/hybrid.js'
import { ml_kem768 } from '@noble/post-quantum/ml-kem.js'
import { x25519 } from '@noble/curves/ed25519.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'

export interface XwingKatResult {
  id: string
  source: string
  status: 'pass' | 'fail'
}

/** Failure reports identify cases only: no key or secret bytes are rendered. */
export async function runXwingKat(): Promise<XwingKatResult[]> {
  const [author, keygen, encap, decap, wycheproof] = await Promise.all([
    import('@/data/acvp/xwing-draft-test-vectors.json'),
    import('@/data/acvp/mlkem_keygen_test.json'),
    import('@/data/acvp/mlkem_encap_aft_test.json'),
    import('@/data/acvp/mlkem_encapdecap_val_test.json'),
    import('@/data/acvp/wycheproof_x25519_test.json'),
  ])
  const results: XwingKatResult[] = []
  const equal = (actual: Uint8Array, expected: string) =>
    bytesToHex(actual) === expected.toLowerCase()
  const check = (id: string, source: string, run: () => boolean) => {
    try {
      results.push({ id, source, status: run() ? 'pass' : 'fail' })
    } catch {
      results.push({ id, source, status: 'fail' })
    }
  }
  author.default.vectors.forEach((v, i) => {
    check(`X-Wing author[${i}]`, 'X-Wing author KAT · source review pending', () => {
      const kp = ml_kem768_x25519.keygen(hexToBytes(v.seed))
      const e = ml_kem768_x25519.encapsulate(kp.publicKey, hexToBytes(v.eseed))
      return (
        equal(kp.publicKey, v.pk) &&
        equal(e.cipherText, v.ct) &&
        equal(e.sharedSecret, v.ss) &&
        equal(ml_kem768_x25519.decapsulate(hexToBytes(v.ct), kp.secretKey), v.ss)
      )
    })
  })
  for (const g of keygen.default.testGroups.filter((g) => g.parameterSet === 'ML-KEM-768')) {
    for (const t of g.tests)
      check(`ML-KEM keyGen tg${g.tgId}/tc${t.tcId}`, 'NIST ACVP reference sample', () => {
        const kp = ml_kem768.keygen(hexToBytes(t.d + t.z))
        return equal(kp.publicKey, t.ek) && equal(kp.secretKey, t.dk)
      })
  }
  for (const g of encap.default.testGroups.filter((g) => g.parameterSet === 'ML-KEM-768')) {
    for (const t of g.tests)
      check(`ML-KEM encap tg${g.tgId}/tc${t.tcId}`, 'NIST ACVP reference sample', () => {
        const e = ml_kem768.encapsulate(hexToBytes(t.ek), hexToBytes(t.m))
        return equal(e.cipherText, t.c) && equal(e.sharedSecret, t.k)
      })
  }
  // Key-check VAL groups run through the existing SoftHSM ACVP panel, not this noble runner.
  for (const g of decap.default.testGroups) {
    if (g.parameterSet !== 'ML-KEM-768' || g.function !== 'decapsulation') continue
    for (const t of g.tests) {
      if (!('c' in t) || !('k' in t)) continue
      check(`ML-KEM decap tg${g.tgId}/tc${t.tcId}`, 'NIST ACVP reference sample', () =>
        equal(ml_kem768.decapsulate(hexToBytes(t.c), hexToBytes(t.dk)), t.k)
      )
    }
  }
  // Wycheproof preserves RFC 8037 A.6's RFC 7748 key-agreement example as tcId 102.
  for (const g of wycheproof.default.testGroups) {
    for (const t of g.tests.filter((t) => t.tcId === 102)) {
      check('X25519 RFC 7748 / RFC 8037 A.6 (Wycheproof tc102)', 'Published RFC example', () =>
        equal(x25519.getSharedSecret(hexToBytes(t.private), hexToBytes(t.public)), t.shared)
      )
    }
  }
  return results
}
