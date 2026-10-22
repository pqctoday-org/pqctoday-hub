// SPDX-License-Identifier: AGPL-3.0-only
//
// The 30-row composite parameter-set table (PKCS#11 v3.3 working draft) is
// read by the Learn track, the Build test bench, Inspect and the v3.3 draft
// checks. A row shifted by one would silently name every set wrongly, so
// each row's CKP_ name is checked against its IETF draft name token by token,
// and the values against the OASIS TC header (copied here as constants with
// their header line numbers; github.com/oasis-tcs/pkcs11 commit 9ef73f9,
// working/headers/pkcs11t.h).
import { describe, it, expect } from 'vitest'
import {
  COMPOSITE_KEM_SETS,
  COMPOSITE_SIG_SETS,
  COMPOSITE_SIG_PREFIX_HEX,
  compositeKemSet,
  compositeSigSet,
  isBrainpoolSet,
  kemLabelBytes,
} from './compositeParams'
import * as C from './constants'

/** Header facts, copied from pkcs11t.h at TC commit 9ef73f9 (name, value, line). */
const HEADER: [string, number, number][] = [
  ['CKK_COMP_KEM', 0x4c, 443],
  ['CKK_COMP_SIG', 0x4d, 444],
  ['CKA_KEYS_REMAINING', 0x61c, 644],
  ['CKM_COMP_SIG_KEY_PAIR_GEN', 0x403d, 1225],
  ['CKM_COMP_SIG', 0x403e, 1226],
  ['CKM_COMP_SIG_EXTERNAL_HASH', 0x403f, 1227],
  ['CKM_COMP_KEM_KEY_PAIR_GEN', 0x4040, 1228],
  ['CKM_COMP_KEM', 0x4041, 1229],
  ['CKM_ML_DSA_EXTERNAL_MU_GEN', 0x403b, 1232],
  ['CKM_ML_DSA_EXTERNAL_MU', 0x403c, 1233],
]

const tokens = (s: string) =>
  s
    .toUpperCase()
    .replace(/^ID-/, '')
    .replace(/^CKP_COMP_(SIG|KEM)_/, '')
    .replace(/BRAINPOOLP(256|384)R1/, 'BP$1')
    .replace(/-SHA3-256$/, '') // every composite KEM set uses the SHA3-256 combiner
    .split(/[-_]/)
    .filter((t) => t !== 'ECDH' && t !== 'ECDSA')

describe('PKCS#11 v3.3 identifiers match the OASIS TC header', () => {
  for (const [name, value, line] of HEADER) {
    it(`${name} = 0x${value.toString(16)} (pkcs11t.h:${line})`, () => {
      expect((C as unknown as Record<string, number>)[name]).toBe(value)
    })
  }

  it('CKA_HSS_KEYS_REMAINING is an alias of CKA_KEYS_REMAINING (pkcs11t.h:645)', () => {
    expect(C.CKA_HSS_KEYS_REMAINING).toBe(C.CKA_KEYS_REMAINING)
  })

  it('the retired vendor id 0x8000_0106 is no longer exported as a constant', () => {
    expect('CKA_XMSS_KEYS_REMAINING' in C).toBe(false)
  })

  it('every CKP_COMP_* constant equals its table row', () => {
    for (const s of [...COMPOSITE_SIG_SETS, ...COMPOSITE_KEM_SETS]) {
      expect((C as unknown as Record<string, number>)[s.ckpName], s.ckpName).toBe(s.ckp)
    }
  })
})

describe('composite parameter-set table', () => {
  it('has 18 signature sets 0x01..0x12 and 12 KEM sets 0x01..0x0c, in header order', () => {
    expect(COMPOSITE_SIG_SETS.map((s) => s.ckp)).toEqual(
      Array.from({ length: 18 }, (_, i) => i + 1)
    )
    expect(COMPOSITE_KEM_SETS.map((s) => s.ckp)).toEqual(
      Array.from({ length: 12 }, (_, i) => i + 1)
    )
    expect(COMPOSITE_SIG_SETS.map((s) => s.headerLine)).toEqual(
      Array.from({ length: 18 }, (_, i) => 2780 + i)
    )
    expect(COMPOSITE_KEM_SETS.map((s) => s.headerLine)).toEqual(
      Array.from({ length: 12 }, (_, i) => 2801 + i)
    )
  })

  it('every CKP_ name names the same algorithm as its draft row (no shifted rows)', () => {
    for (const s of COMPOSITE_SIG_SETS) {
      expect(tokens(s.ckpName), s.ckpName).toEqual(tokens(s.draftName))
    }
    for (const s of COMPOSITE_KEM_SETS) {
      expect(tokens(s.ckpName), s.ckpName).toEqual(tokens(s.draftName))
    }
  })

  it('OIDs are the drafts’ consecutive arcs (sigs .37-.54, KEM .55-.66)', () => {
    COMPOSITE_SIG_SETS.forEach((s, i) => expect(s.oid).toBe(`1.3.6.1.5.5.7.6.${37 + i}`))
    COMPOSITE_KEM_SETS.forEach((s, i) => expect(s.oid).toBe(`1.3.6.1.5.5.7.6.${55 + i}`))
  })

  it('sizes are consistent: the ML half fits inside the composite', () => {
    for (const s of COMPOSITE_SIG_SETS) {
      expect(s.publicKeyBytes).toBeGreaterThan(s.mlPublicKeyBytes)
      expect(s.signatureBytes).toBeGreaterThan(s.mlSignatureBytes)
      expect(s.label.startsWith('COMPSIG-')).toBe(true)
    }
    for (const s of COMPOSITE_KEM_SETS) {
      expect(s.publicKeyBytes).toBeGreaterThan(s.mlPublicKeyBytes)
      expect(s.ciphertextBytes).toBeGreaterThan(s.mlCiphertextBytes)
      expect(s.sharedSecretBytes).toBe(32)
    }
  })

  it('X25519 set: 1216-byte key = 1184 (ML-KEM-768) + 32, label \\.//^\\', () => {
    const s = compositeKemSet(C.CKP_COMP_KEM_MLKEM768_X25519)!
    expect(s.publicKeyBytes).toBe(1184 + 32)
    expect(new TextDecoder().decode(kemLabelBytes(s))).toBe('\\.//^\\')
  })

  it('four sets are brainpool (2 signature, 2 KEM)', () => {
    expect(COMPOSITE_SIG_SETS.filter(isBrainpoolSet).map((s) => s.ckp)).toEqual([0x0b, 0x0e])
    expect(COMPOSITE_KEM_SETS.filter(isBrainpoolSet).map((s) => s.ckp)).toEqual([0x07, 0x0a])
  })

  it('lookups and the signature prefix', () => {
    expect(compositeSigSet(0x09)?.draftName).toBe('id-MLDSA65-ECDSA-P256-SHA512')
    expect(compositeSigSet(0x13)).toBeUndefined()
    const prefix = new Uint8Array(
      (COMPOSITE_SIG_PREFIX_HEX.match(/.{2}/g) ?? []).map((h) => parseInt(h, 16))
    )
    expect(new TextDecoder().decode(prefix)).toBe('CompositeAlgorithmSignatures2025')
  })
})
