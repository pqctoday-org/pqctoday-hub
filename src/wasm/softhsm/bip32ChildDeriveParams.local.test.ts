// SPDX-License-Identifier: GPL-3.0-only
//
// Layout guard for CK_BIP32_CHILD_DERIVE_PARAMS, and the first test of any
// kind over BIP32 derivation — the HD-wallet lesson
// (PKILearning/modules/DigitalAssets/flows/HDWalletFlow.tsx) is the only
// consumer and it shipped with no coverage at all.
//
// Why this exists: `buildBIP32ChildDeriveParams` used to allocate 8 bytes and
// write { flags, index }, omitting the `CK_VOID_PTR pNext` that
// CK_BIP32_CHILD_DERIVE_PARAMS declares FIRST (pkcs11t.h). The Rust engine
// read the struct the same wrong way, so the two agreed with each other while
// both disagreeing with the header the C++ engine already implemented. The
// 2026-08-13 conformance remediation fixed the engine to read what the header
// declares; without the matching 12-byte builder here, every field lands one
// slot early and derivation returns CKR_ARGUMENTS_BAD.
//
// A test that only asserted "derive succeeds" would NOT have caught the
// original bug — under the old mutually-wrong layout it succeeded fine. So the
// assertions below pin the derived key material to BIP32 Test Vector 1, which
// only reproduces if `index` and `hardened` are read from the offsets the
// header specifies.
//
// Venue: `*.local.test.ts` — excluded from CI vitest globs, run by the local
// gate (project directive 2026-07-01: new suites are local-only).
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
// Same import path HDWalletFlow.tsx uses — the BIP32 helpers are not on the
// barrel, so importing them from '@/wasm/softhsm' silently yields undefined.
import { hsm_bip32MasterDerive, hsm_bip32ChildDerive } from '@/wasm/softhsm/classical'
import { hsm_importGenericSecret } from '@/wasm/softhsm/symmetric'
import { hsm_extractKeyValue } from '@/wasm/softhsm/pqc'

const hex = (b: Uint8Array): string =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

const fromHex = (s: string): Uint8Array =>
  new Uint8Array(s.match(/../g)!.map((h) => parseInt(h, 16)))

// BIP-0032 Test Vector 1 — https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki
const TV1_SEED = fromHex('000102030405060708090a0b0c0d0e0f')
const TV1_M_0H_PRIV = 'edb2e14f9ee77d26dd93b4ecede8d16ed408ce149b6cd80b0715a2d911a0afea'

describe('CK_BIP32_CHILD_DERIVE_PARAMS matches the header layout', () => {
  let M: SoftHSMModule
  let session: number
  let master: number

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'BIP32 Token')
    session = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')

    const seedHandle = hsm_importGenericSecret(M, session, TV1_SEED)
    master = hsm_bip32MasterDerive(M, session, seedHandle, 'secp256k1', true)
  }, 60000)

  const childPriv = (index: number, hardened: boolean): string => {
    const h = hsm_bip32ChildDerive(M, session, master, index, hardened, 'secp256k1', true)
    return hex(hsm_extractKeyValue(M, session, h))
  }

  it("derives BIP32 Test Vector 1 m/0' — pins index AND hardened to their header offsets", () => {
    expect(childPriv(0, true)).toBe(TV1_M_0H_PRIV)
  })

  it('a different index yields a different key (index field is genuinely read)', () => {
    expect(childPriv(1, true)).not.toBe(childPriv(0, true))
  })

  it('hardened and non-hardened at the same index differ (flags field is genuinely read)', () => {
    expect(childPriv(0, false)).not.toBe(childPriv(0, true))
  })
})
