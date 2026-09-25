// SPDX-License-Identifier: GPL-3.0-only
//
// Raw PKCS#11 helpers for the reference-sample sections that must observe the
// exact CK_RV of a call instead of the throw-or-boolean the hsm_* wrappers
// give. Every helper frees what it allocates and never throws on a non-OK
// return; the caller decides what the code means.
import { sha256 } from '@noble/hashes/sha2.js'
import { buildTemplate, freeTemplate, writeBytes } from '@/wasm/softhsm'
import type { SoftHSMModule } from '@/wasm/softhsm'
import { allocMech, CKR_OK } from './mldsaAcvp'

export interface AttrDef {
  type: number
  ulongVal?: number
  boolVal?: boolean
  bytesPtr?: number
  bytesLen?: number
}

/** Template entry carrying bytes; the pointer is freed by withTemplate. */
export interface BytesAttr {
  type: number
  bytes: Uint8Array
}

/** Build a CK_ATTRIBUTE array (scalar defs + byte-valued attrs), run fn, free everything. */
export function withTemplate<T>(
  M: SoftHSMModule,
  defs: AttrDef[],
  bytes: BytesAttr[],
  fn: (ptr: number, count: number) => T
): T {
  const ptrs = bytes.map((b) => writeBytes(M, b.bytes))
  const all: AttrDef[] = [
    ...defs,
    ...bytes.map((b, i) => ({ type: b.type, bytesPtr: ptrs[i], bytesLen: b.bytes.length })),
  ]
  const tpl = buildTemplate(M, all)
  try {
    return fn(tpl.ptr, all.length)
  } finally {
    freeTemplate(M, tpl, all.length)
    ptrs.forEach((p) => M._free(p))
  }
}

/** C_CreateObject → { rv, handle } (handle 0 unless CKR_OK). */
export function createObjectRv(
  M: SoftHSMModule,
  hSession: number,
  defs: AttrDef[],
  bytes: BytesAttr[]
): { rv: number; handle: number } {
  const hPtr = M._malloc(4)
  M.setValue(hPtr, 0, 'i32')
  try {
    const rv = withTemplate(
      M,
      defs,
      bytes,
      (ptr, n) => M._C_CreateObject(hSession, ptr, n, hPtr) >>> 0
    )
    return { rv, handle: rv === CKR_OK ? M.getValue(hPtr, 'i32') >>> 0 : 0 }
  } finally {
    M._free(hPtr)
  }
}

/** C_GenerateKeyPair with explicit templates → { rv, pub, priv }. */
export function generateKeyPairRv(
  M: SoftHSMModule,
  hSession: number,
  mechType: number,
  pub: { defs: AttrDef[]; bytes: BytesAttr[] },
  priv: { defs: AttrDef[]; bytes: BytesAttr[] }
): { rv: number; pub: number; priv: number } {
  const { mech, allocs } = allocMech(M, mechType, null)
  const pubH = M._malloc(4)
  const prvH = M._malloc(4)
  M.setValue(pubH, 0, 'i32')
  M.setValue(prvH, 0, 'i32')
  try {
    const rv = withTemplate(M, pub.defs, pub.bytes, (pp, pn) =>
      withTemplate(
        M,
        priv.defs,
        priv.bytes,
        (vp, vn) => M._C_GenerateKeyPair(hSession, mech, pp, pn, vp, vn, pubH, prvH) >>> 0
      )
    )
    return {
      rv,
      pub: rv === CKR_OK ? M.getValue(pubH, 'i32') >>> 0 : 0,
      priv: rv === CKR_OK ? M.getValue(prvH, 'i32') >>> 0 : 0,
    }
  } finally {
    allocs.forEach((a) => M._free(a))
    M._free(pubH)
    M._free(prvH)
  }
}

/** C_SignInit(mech, CK_SIGN_ADDITIONAL_CONTEXT{hedge, context}) + C_Sign (size query, then sign). */
export function signRv(
  M: SoftHSMModule,
  hSession: number,
  privHandle: number,
  mechType: number,
  hedge: number,
  data: Uint8Array,
  context: Uint8Array
): { rv: number; step: 'C_SignInit' | 'C_Sign(length)' | 'C_Sign'; sig: Uint8Array | null } {
  const { mech, allocs } = allocMech(M, mechType, { hedge, context })
  const dp = writeBytes(M, data)
  const lenPtr = M._malloc(4)
  let sp = 0
  try {
    let rv = M._C_SignInit(hSession, mech, privHandle) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_SignInit', sig: null }
    M.setValue(lenPtr, 0, 'i32')
    rv = M._C_Sign(hSession, dp, data.length, 0, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_Sign(length)', sig: null }
    const len = M.getValue(lenPtr, 'i32') >>> 0
    sp = M._malloc(Math.max(1, len))
    rv = M._C_Sign(hSession, dp, data.length, sp, lenPtr) >>> 0
    if (rv !== CKR_OK) return { rv, step: 'C_Sign', sig: null }
    return { rv, step: 'C_Sign', sig: M.HEAPU8.slice(sp, sp + (M.getValue(lenPtr, 'i32') >>> 0)) }
  } finally {
    allocs.forEach((a) => M._free(a))
    M._free(dp)
    M._free(lenPtr)
    if (sp) M._free(sp)
  }
}

/** Short, non-secret fingerprint of a public output (for cross-engine comparison in evidence). */
export const sha256Tag = (bytes: Uint8Array): string =>
  'sha256:' +
  Array.from(sha256(bytes).slice(0, 8))
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('')

/**
 * A product-authored boundary probe whose exact CK_RV is pinned per engine.
 * `listed` is the set of return values the governing PKCS#11 v3.2 section
 * lists for the function; a pinned code outside it is an engine finding and
 * the row says so — it is pinned so a change in either direction is caught,
 * not because it is correct.
 */
export interface PinnedRv {
  cpp: string
  rust: string
  listed: string[]
  section: string
}

export const pinnedFor = (p: PinnedRv, eName: string): string | undefined =>
  eName === 'C++' ? p.cpp : eName === 'Rust' ? p.rust : undefined

/** Row text for a pinned-code probe: observed vs pinned, spec listing, cross-engine disagreement. */
export function pinnedVerdict(
  p: PinnedRv,
  eName: string,
  observed: string
): { ok: boolean; details: string } {
  const pinned = pinnedFor(p, eName)
  const ok = pinned !== undefined ? observed === pinned : p.listed.includes(observed)
  const listed = p.listed.includes(observed)
  const parts = [
    `observed ${observed}`,
    pinned !== undefined
      ? `pinned for ${eName}: ${pinned}`
      : `expected one of ${p.listed.join(', ')}`,
    listed
      ? `listed by PKCS#11 v3.2 ${p.section}`
      : `⚠ not among the return values PKCS#11 v3.2 ${p.section} lists — engine finding`,
  ]
  if (p.cpp !== p.rust) parts.push(`engines disagree (C++ ${p.cpp}, Rust ${p.rust})`)
  return { ok, details: parts.join(' · ') }
}
