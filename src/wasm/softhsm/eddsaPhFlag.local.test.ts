// SPDX-License-Identifier: GPL-3.0-only
//
// Pins the CK_EDDSA_PARAMS.phFlag read width against BOTH real engines.
//
// WHY THIS EXISTS — the hub is currently safe here BY ACCIDENT, and nothing
// asserted it. Two independent facts kept it working:
//
//   1. src/wasm/softhsm.ts's own hsm_eddsaSign passes pParameter = NULL, so the
//      params struct is never read on that path at all.
//   2. src/wasm/softhsm/classical.ts's hsm_eddsaSign DOES pass params, built by
//      helpers.ts buildEdDSAParams, which writes phFlag with
//      `M.setValue(ptr, prehash ? 1 : 0, 'i32')` — a full 32-bit store. All four
//      bytes of the field end up defined, so a reader that takes four bytes sees
//      exactly 0 or 1 no matter what the allocator left behind.
//
// Neither fact is load-bearing by design; both are incidental. PKCS#11 declares
// phFlag as CK_BBOOL — ONE byte. A spec-correct caller writes one byte and
// leaves the following three as whatever malloc returned. If an engine reads the
// field at CK_ULONG width, that caller's "phFlag = 0" (pure Ed25519) can be read
// as a nonzero value and silently become Ed25519ph — a DIFFERENT signature
// scheme over a prehashed message, which a pure-Ed25519 verifier rejects.
//
// That is not hypothetical for this codebase: hsm v0.23.0 shipped exactly this
// class of defect and its fixes (844ed27 "read CK_AES_CTR_PARAMS at native
// CK_ULONG width", 7f66aae "two more mechanism-parameter fields read at the
// wrong width"). This test pins the EdDSA member of that family so a future
// width regression fails here instead of silently changing what gets signed.
//
// WHAT IT ASSERTS — sign with phFlag written the SPEC-CORRECT way (a single
// CK_BBOOL byte) while the three padding bytes are deliberately POISONED to
// 0xFF, then require the result to be the PURE Ed25519 signature, not Ed25519ph.
//
// PROVEN NON-VACUOUS AGAINST A REAL OLD ARTIFACT, not just by reasoning. The
// previous bundle (sha256 fc9a9a9d…, built @ hsm 9a5794e, i.e. before 7f66aae)
// was swapped back in and this suite run against it: both phFlag assertions
// FAILED, with the single-byte-phFlag signature coming out as the Ed25519ph one
// and C_Verify returning 0xC0 CKR_SIGNATURE_INVALID under pure Ed25519 — exactly
// the user-visible symptom described above. Against the current bundle
// (05911026…, built @ v0.23.0) all four pass. The test therefore discriminates
// between the broken and fixed engines rather than asserting something always
// true. hsm commit 7f66aae is the fix, and its own message predicts this:
// "a caller that sets phFlag = CK_FALSE without zeroing the struct gets
// Ed25519ph where it asked for pure Ed25519".
//
// NON-VACUITY — an "is it pure?" assertion is worthless if pure and prehash are
// indistinguishable, so the suite proves the discriminator works before trusting
// it: it signs the same message with phFlag = 1 and requires a DIFFERENT
// signature. If prehash ever stopped being reachable, that guard fails loudly
// rather than letting the main assertion pass for the wrong reason.
//
// Venue: `*.local.test.ts` — excluded from the CI vitest globs and run by the
// local gate, per the project directive that new suites are local-only. Real
// wasm engines, not mocks.
import { describe, it, expect, beforeAll } from 'vitest'
import * as SoftHSM from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { hsm_generateEdDSAKeyPair } from '@/wasm/softhsm/classical'
import { buildMech, writeBytes, allocUlong, readUlong, writeUlong } from '@/wasm/softhsm/helpers'
import { CKM_EDDSA } from '@/wasm/softhsm/constants'

/** Byte pattern left in the three bytes that follow a one-byte CK_BBOOL phFlag. */
const POISON = 0xff

/**
 * Build CK_EDDSA_PARAMS with phFlag written at a CHOSEN width.
 *
 * `width: 'bbool'` is the spec-correct shape and the one that was broken: a
 * single byte at offset 0, with offsets 1..3 poisoned. An engine reading the
 * field as CK_ULONG sees 0xffffff00 | value here instead of just `value`.
 *
 * `width: 'i32'` reproduces what helpers.ts buildEdDSAParams does today — a full
 * 32-bit store that overwrites the padding and hides the difference.
 */
const buildEdDSAParamsAtWidth = (
  M: SoftHSMModule,
  prehash: boolean,
  width: 'bbool' | 'i32'
): { ptr: number; len: number } => {
  const ptr = M._malloc(12)
  // NOTE: byte-width writes go through HEAPU8, NOT M.setValue. This engine's
  // setValue shim handles ONLY 'i32' and silently no-ops on any other type
  // (see getSoftHSMRustModule in src/wasm/softhsm.ts) — using it here made the
  // one-byte write vanish and the fixture quietly test nothing.
  const poke = (off: number, v: number) => {
    M.HEAPU8[ptr + off] = v
  }
  // Poison the whole field first so nothing below relies on fresh-zero memory.
  for (let i = 0; i < 4; i++) poke(i, POISON)
  if (width === 'i32') {
    M.setValue(ptr, prehash ? 1 : 0, 'i32')
  } else {
    // CK_BBOOL — exactly one byte. Offsets 1..3 stay poisoned, as they would be
    // for any caller that writes this field the way PKCS#11 declares it.
    poke(0, prehash ? 1 : 0)
  }
  M.setValue(ptr + 4, 0, 'i32') // ulContextDataLen
  M.setValue(ptr + 8, 0, 'i32') // pContextData
  return { ptr, len: 12 }
}

/** EdDSA sign driving C_SignInit/C_Sign directly, with a caller-supplied params struct. */
const signWithParams = (
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  message: Uint8Array,
  params: { ptr: number; len: number }
): Uint8Array => {
  const mech = buildMech(M, CKM_EDDSA, params.ptr, params.len)
  const msgPtr = writeBytes(M, message)
  const sigLenPtr = allocUlong(M)
  let sigPtr = 0
  try {
    const rv0 = M._C_SignInit(hSession, mech, privHandle) >>> 0
    if (rv0 !== 0) throw new Error(`C_SignInit(EdDSA) failed: 0x${rv0.toString(16)}`)
    const rv1 = M._C_Sign(hSession, msgPtr, message.length, 0, sigLenPtr) >>> 0
    if (rv1 !== 0) throw new Error(`C_Sign(EdDSA,len) failed: 0x${rv1.toString(16)}`)
    const sigLen = readUlong(M, sigLenPtr)
    sigPtr = M._malloc(sigLen)
    writeUlong(M, sigLenPtr, sigLen)
    const rv2 = M._C_Sign(hSession, msgPtr, message.length, sigPtr, sigLenPtr) >>> 0
    if (rv2 !== 0) throw new Error(`C_Sign(EdDSA) failed: 0x${rv2.toString(16)}`)
    return M.HEAPU8.slice(sigPtr, sigPtr + readUlong(M, sigLenPtr))
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigLenPtr)
    if (sigPtr) M._free(sigPtr)
  }
}

/** EdDSA verify with a caller-supplied params struct. Returns the raw CKR_. */
const verifyWithParams = (
  M: SoftHSMModule,
  hSession: number,
  pubHandle: number,
  message: Uint8Array,
  sig: Uint8Array,
  params: { ptr: number; len: number }
): number => {
  const mech = buildMech(M, CKM_EDDSA, params.ptr, params.len)
  const msgPtr = writeBytes(M, message)
  const sigPtr = writeBytes(M, sig)
  try {
    const rv0 = M._C_VerifyInit(hSession, mech, pubHandle) >>> 0
    if (rv0 !== 0) throw new Error(`C_VerifyInit(EdDSA) failed: 0x${rv0.toString(16)}`)
    return M._C_Verify(hSession, msgPtr, message.length, sigPtr, sig.length) >>> 0
  } finally {
    M._free(mech)
    M._free(msgPtr)
    M._free(sigPtr)
  }
}

const hex = (b: Uint8Array) => Buffer.from(b).toString('hex')

describe('CK_EDDSA_PARAMS.phFlag is read as CK_BBOOL, not CK_ULONG (Rust engine)', () => {
  const MESSAGE = new TextEncoder().encode('phFlag width pin — RFC 8032 pure Ed25519')

  let M: SoftHSMModule
  let session: number
  let pubHandle: number
  let privHandle: number

  /** Pure Ed25519 signature, phFlag written the way the shipped helper writes it. */
  let sigPureI32: Uint8Array
  /** Ed25519ph signature — the discriminator that makes the main assertion mean something. */
  let sigPrehashI32: Uint8Array | null = null
  let prehashError: string | null = null

  beforeAll(async () => {
    M = (await SoftHSM.getSoftHSMRustModule()) as SoftHSMModule
    SoftHSM.hsm_initialize(M)
    const freeSlot = SoftHSM.hsm_getFirstFreeSlot(M)
    const slotId = SoftHSM.hsm_initToken(M, freeSlot, '1234', 'EdDSA phFlag Token')
    session = SoftHSM.hsm_openUserSession(M, slotId, '1234', '1234')
    ;({ pubHandle, privHandle } = hsm_generateEdDSAKeyPair(M, session, 'Ed25519'))

    const pure = buildEdDSAParamsAtWidth(M, false, 'i32')
    try {
      sigPureI32 = signWithParams(M, session, privHandle, MESSAGE, pure)
    } finally {
      M._free(pure.ptr)
    }

    const ph = buildEdDSAParamsAtWidth(M, true, 'i32')
    try {
      sigPrehashI32 = signWithParams(M, session, privHandle, MESSAGE, ph)
    } catch (e) {
      prehashError = e instanceof Error ? e.message : String(e)
    } finally {
      M._free(ph.ptr)
    }
  })

  // ── Guard: the discriminator must actually discriminate ────────────────────
  // Everything below is an "it produced the PURE signature" claim. That claim is
  // empty unless pure and prehash are distinguishable, so prove it first.
  it('NON-VACUITY GUARD: phFlag=1 yields a different signature from phFlag=0', () => {
    expect(
      prehashError,
      `Ed25519ph is unreachable on this engine (${prehashError}); the phFlag assertions below ` +
        `would pass no matter what the engine read, so they cannot be trusted until this is fixed.`
    ).toBeNull()
    expect(sigPrehashI32).not.toBeNull()
    expect(
      hex(sigPrehashI32!),
      'phFlag=1 produced the SAME bytes as phFlag=0 — the engine is ignoring phFlag entirely, ' +
        'so this suite cannot tell pure Ed25519 from Ed25519ph and proves nothing.'
    ).not.toBe(hex(sigPureI32))
  })

  // ── The actual pin ─────────────────────────────────────────────────────────
  it('phFlag written as a single CK_BBOOL byte (padding poisoned) still signs PURE Ed25519', () => {
    const p = buildEdDSAParamsAtWidth(M, false, 'bbool')
    let sig: Uint8Array
    try {
      // Sanity-check the fixture itself: the padding really is poisoned, so a
      // CK_ULONG-width read would genuinely see a nonzero value here.
      expect(M.HEAPU8[p.ptr], 'phFlag byte should be 0 (pure)').toBe(0)
      expect(M.HEAPU8[p.ptr + 1], 'padding byte 1 should be poisoned').toBe(POISON)
      expect(M.HEAPU8[p.ptr + 3], 'padding byte 3 should be poisoned').toBe(POISON)
      // This is the number a CK_ULONG-width read would see: 0xffffff00, not 0.
      expect(M.getValue(p.ptr, 'i32') >>> 0).toBe(0xffffff00)

      sig = signWithParams(M, session, privHandle, MESSAGE, p)
    } finally {
      M._free(p.ptr)
    }

    expect(
      hex(sig),
      'Signing with a one-byte phFlag=0 did not produce the pure Ed25519 signature. The engine ' +
        'is reading phFlag wider than CK_BBOOL and picking up the poisoned padding, so a ' +
        'spec-correct caller silently gets Ed25519ph.'
    ).toBe(hex(sigPureI32))

    // …and it must be REJECTED as Ed25519ph, which is the failure a user would see.
    expect(hex(sig)).not.toBe(hex(sigPrehashI32!))
  })

  it('the single-byte-phFlag signature verifies as pure Ed25519 and NOT as Ed25519ph', () => {
    const p = buildEdDSAParamsAtWidth(M, false, 'bbool')
    let sig: Uint8Array
    try {
      sig = signWithParams(M, session, privHandle, MESSAGE, p)
    } finally {
      M._free(p.ptr)
    }

    const pure = buildEdDSAParamsAtWidth(M, false, 'i32')
    const ph = buildEdDSAParamsAtWidth(M, true, 'i32')
    try {
      expect(
        verifyWithParams(M, session, pubHandle, MESSAGE, sig, pure),
        'signature did not verify under pure Ed25519'
      ).toBe(0)
      expect(
        verifyWithParams(M, session, pubHandle, MESSAGE, sig, ph),
        'signature ALSO verified under Ed25519ph — the two schemes are not being separated, ' +
          'so "verifies as pure" carries no information'
      ).not.toBe(0)
    } finally {
      M._free(pure.ptr)
      M._free(ph.ptr)
    }
  })

  it('a one-byte phFlag=1 is still honoured as prehash (the write width is what changed, not the value)', () => {
    const p = buildEdDSAParamsAtWidth(M, true, 'bbool')
    let sig: Uint8Array
    try {
      sig = signWithParams(M, session, privHandle, MESSAGE, p)
    } finally {
      M._free(p.ptr)
    }
    expect(
      hex(sig),
      'phFlag=1 written as one byte did not match phFlag=1 written as i32 — narrowing the write ' +
        'changed the meaning of a TRUE flag, the mirror image of the defect this suite pins.'
    ).toBe(hex(sigPrehashI32!))
  })
})
