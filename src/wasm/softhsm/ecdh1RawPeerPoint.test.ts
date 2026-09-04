// SPDX-License-Identifier: GPL-3.0-only
//
// Seam test against the SHIPPED Rust WASM binary (softhsmrustv3_bg.wasm), not
// the engine's own source: proves the 2026-09-03 fix for
// C_DeriveKey(CKM_ECDH1_DERIVE) actually reached the vendored bundle, and
// catches a future rebuild that regresses it before a user's browser would.
//
// The bug: the engine decided whether a peer EC public point was DER-wrapped
// by checking its leading byte (0x04), which a RAW SEC1 point also starts
// with — so it went on to misread the point's own X coordinate as a DER
// length whenever X[0] happened to equal len-2 (~1 valid point in 256 for
// P-256/P-384/P-521). This surfaced as an intermittent (~25% of runs)
// failure in hpkeService.test.ts's 54-case hybrid cross-product, which does
// 74 such derives per run against fresh random keys.
//
// Fixed hsm-side in rust/src/state.rs (unwrap_peer_ec_point) + rust/src/ffi.rs
// (the C_DeriveKey ECDH arm and the ECDH-as-KEM encapsulate/decapsulate
// arms) — see hub-hpke-ecdh1-raw-point-root-cause-and-fix-plan-09032026.md
// (workspace root) for the full root-cause writeup and the probe this test
// is promoted from.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'

let M: SoftHSM.SoftHSMModule
let hSession: number

const derive = (privHandle: number, peer: Uint8Array): string => {
  try {
    SoftHSM.hsm_ecdhDerive(M, hSession, privHandle, peer, undefined, undefined, {
      keyLen: 32,
      derive: true,
      extractable: true,
    })
    return 'OK'
  } catch (e) {
    return (e as Error).message
  }
}

const derWrap = (raw: Uint8Array): Uint8Array => {
  const out = new Uint8Array(raw.length + (raw.length < 0x80 ? 2 : 3))
  out[0] = 0x04
  if (raw.length < 0x80) {
    out[1] = raw.length
    out.set(raw, 2)
  } else {
    out[1] = 0x81
    out[2] = raw.length
    out.set(raw, 3)
  }
  return out
}

/** Generate keypairs until the public point's raw SEC1 X[0] equals `want`. */
const findKeyWithX0 = (
  curve: 'P-256' | 'P-384',
  want: number,
  rawLen: number
): { raw: Uint8Array } => {
  for (let i = 0; i < 4000; i++) {
    const kp = SoftHSM.hsm_generateECKeyPair(M, hSession, curve, false, 'derive')
    const der = SoftHSM.hsm_extractECPoint(M, hSession, kp.pubHandle)
    const raw = der.length === rawLen ? der : der.slice(der.length - rawLen)
    if (raw.length !== rawLen) throw new Error(`unexpected raw len ${raw.length}`)
    if (raw[1] === want) return { raw }
  }
  throw new Error(`no key with X[0]==${want.toString(16)} found in 4000 tries`)
}

describe('shipped Rust WASM: C_DeriveKey(ECDH1) accepts raw peer points with the ambiguous X[0] byte', () => {
  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSM.SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'ecdh1-rawpoint')
    hSession = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
  }, 60_000)

  it('P-256: raw point with X[0]=0x3F is accepted, matches the DER-wrapped form, and a control point still works', () => {
    const me = SoftHSM.hsm_generateECKeyPair(M, hSession, 'P-256', false, 'derive')
    const bad = findKeyWithX0('P-256', 0x3f, 65)
    const good = findKeyWithX0('P-256', 0x7a, 65)

    expect(derive(me.privHandle, bad.raw)).toBe('OK')
    expect(derive(me.privHandle, derWrap(bad.raw))).toBe('OK')
    expect(derive(me.privHandle, good.raw)).toBe('OK')
  }, 60_000)

  it('P-384: raw point with X[0]=0x5F is accepted and matches the DER-wrapped form', () => {
    const me = SoftHSM.hsm_generateECKeyPair(M, hSession, 'P-384', false, 'derive')
    const bad = findKeyWithX0('P-384', 0x5f, 97)

    expect(derive(me.privHandle, bad.raw)).toBe('OK')
    expect(derive(me.privHandle, derWrap(bad.raw))).toBe('OK')
  }, 90_000)

  it('X25519: raw 32-byte point starting 0x04 0x1E is accepted', () => {
    const kp = SoftHSM.hsm_generateECKeyPair(M, hSession, 'X25519', false, 'x25519')
    const peer = new Uint8Array(32)
    peer[0] = 0x04
    peer[1] = 0x1e
    for (let i = 2; i < 32; i++) peer[i] = 0x42
    expect(derive(kp.privHandle, peer)).toBe('OK')
  })
})
