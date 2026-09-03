// SPDX-License-Identifier: GPL-3.0-only
/**
 * p11Bridge — exposes the raw PKCS#11 v3.2 C_* entry points of the hub's own
 * softhsmv3 WASM engine to Pyodide, so the Python-side `p11.py` shim can
 * reimplement the SAME ctypes marshalling the sandbox's real `samples/py/p11`
 * package does (see pqctoday-sandbox/samples/py/p11/__init__.py) — just backed
 * by JS calls instead of a ctypes.CDLL.
 *
 * Deliberately raw, not a convenience wrapper: the hub's own `hsm_sign`/
 * `hsm_verify` helpers (src/wasm/softhsm/pqc.ts) use the v3.2 MESSAGE-BASED
 * signing API (C_MessageSignInit/C_SignMessage) — a different, also-conformant
 * call sequence from the CLASSIC single-part API (C_SignInit/C_Sign) the real
 * sandbox samples teach and that this lesson's goal (teach the v3.2 standard
 * as the sandbox samples exercise it) requires. Wrapping those helpers here
 * would make the hub silently teach a different sequence than the sandbox —
 * so this bridge only exposes the raw exports; every marshalling decision
 * lives in Python where it can byte-for-byte match the real package.
 *
 * CK_ULONG WIDTH — the one real platform difference from the sandbox's own
 * package, load-bearing enough to document twice (also in shims/p11/__init__.py):
 * the sandbox's `p11` package runs on native Linux/glibc, LP64, where
 * `ctypes.c_ulong` (CK_ULONG) is 8 bytes. This hub build is Emscripten/WASM32,
 * ILP32, where `unsigned long` is 4 bytes — confirmed against the hub's own
 * existing PKCS#11 glue: `src/wasm/softhsm/helpers.ts`'s `allocUlong` mallocs
 * 4 bytes and `CK_ATTRIBUTE_SIZE = 12 // sizeof(CK_ATTRIBUTE) on 32-bit WASM`
 * (12 = type:u32 + pValue:ptr32 + ulValueLen:u32, not the LP64 24). Getting
 * this wrong doesn't fail loudly — it corrupts slot/handle/length values
 * silently until something downstream (e.g. C_GetTokenInfo indexing an
 * out-of-range slot) aborts. So every struct this bridge/shim builds
 * (CK_ATTRIBUTE, CK_MECHANISM, CK_GCM_PARAMS, etc.) uses 4-byte fields, and
 * every "u64" naming from the ctypes source is really u32 here.
 *
 * Memory model: every buffer the bridge allocates is owned by the CALLER
 * (the Python shim), which must free it — mirroring ctypes keepalive
 * semantics (`_u`/`_b`/`_bytes`/`_attrs` in the real p11 package). The bridge
 * itself never retains a pointer across calls.
 */
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

export interface P11BridgeHandle {
  /** malloc n bytes, zero-filled; returns the pointer. */
  malloc: (n: number) => number
  free: (ptr: number) => void
  /** Write bytes at ptr. */
  writeBytes: (ptr: number, bytes: Uint8Array) => void
  /** Read n bytes starting at ptr. */
  readBytes: (ptr: number, n: number) => Uint8Array
  /** CK_ULONG on this WASM32 build is 4 bytes (see file header). Read/write
   *  as an unsigned i32. Named readU32/writeU32 — not readU64/writeU64 — to
   *  keep the width honest at every call site. */
  readU32: (ptr: number) => number
  writeU32: (ptr: number, v: number) => void
  /** Invoke one C_* function by name with an array of numeric/pointer args.
   *  Returns the CK_RV. Matches _FUNC_ORDER naming in the real package
   *  (without the leading underscore Emscripten adds to the export). */
  call: (name: string, args: number[]) => number
}

// The subset of raw C_* exports the shim needs — the classic single-part
// API only (no message-based ops; that is the sandbox's chosen surface too,
// see samples/py/p11/__init__.py's _PROTO table, which is the same subset).
const EXPORT_NAMES = [
  'C_Initialize',
  'C_Finalize',
  'C_GetInfo',
  'C_GetSlotList',
  'C_GetTokenInfo',
  'C_InitToken',
  'C_OpenSession',
  'C_CloseSession',
  'C_Login',
  'C_Logout',
  'C_GenerateKey',
  'C_GenerateKeyPair',
  'C_SignInit',
  'C_Sign',
  'C_VerifyInit',
  'C_Verify',
  'C_EncryptInit',
  'C_Encrypt',
  'C_DecryptInit',
  'C_Decrypt',
  'C_DigestInit',
  'C_Digest',
  'C_DeriveKey',
  'C_WrapKey',
  'C_UnwrapKey',
  'C_EncapsulateKey',
  'C_DecapsulateKey',
  'C_FindObjectsInit',
  'C_FindObjects',
  'C_FindObjectsFinal',
  'C_GetAttributeValue',
  'C_DestroyObject',
  'C_CreateObject',
] as const

export function createP11Bridge(M: SoftHSMModule): P11BridgeHandle {
  const exportKey = (name: string) => `_${name}` as keyof SoftHSMModule

  return {
    malloc: (n: number) => {
      const ptr = M._malloc(Math.max(n, 1))
      M.HEAPU8.fill(0, ptr, ptr + Math.max(n, 1))
      return ptr
    },
    free: (ptr: number) => M._free(ptr),
    writeBytes: (ptr: number, bytes: Uint8Array) => M.HEAPU8.set(bytes, ptr),
    readBytes: (ptr: number, n: number) => M.HEAPU8.slice(ptr, ptr + n),
    readU32: (ptr: number) => M.getValue(ptr, 'i32') >>> 0,
    writeU32: (ptr: number, v: number) => M.setValue(ptr, v, 'i32'),
    call: (name: string, args: number[]) => {
      const fn = M[exportKey(name)] as ((...a: number[]) => number) | undefined
      if (typeof fn !== 'function') {
        throw new Error(`p11Bridge: no such PKCS#11 export: ${name}`)
      }
      return fn.apply(M, args) >>> 0
    },
  }
}

export const P11_BRIDGE_EXPORT_NAMES = EXPORT_NAMES
