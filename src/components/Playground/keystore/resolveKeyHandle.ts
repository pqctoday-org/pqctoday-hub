// SPDX-License-Identifier: GPL-3.0-only
//
// resolveKeyHandle — re-resolve a registered key's CURRENT PKCS#11 handle
// via its durable CKA_UNIQUE_ID before every live query, instead of
// trusting a cached `handle`.
//
// A `handle` is only ever valid within the session that returned it
// (PKCS#11 v3.2 §3.2) — real bug found live 2026-08-30: a handle printed
// by one session was registered and later queried through a DIFFERENT
// session, which knew the same object under a different number, so every
// attribute read failed with CKR_OBJECT_HANDLE_INVALID. `CKA_UNIQUE_ID` is
// the durable identity; when a key carries one, re-resolve its CURRENT
// handle on `hSession` before every live query instead of trusting the
// cached `handle`. No fallback to the stale handle on a miss — a UID that
// finds nothing means the object is genuinely gone (e.g. destroyed), and
// that's the honest thing to report, not a read through a dead handle.
//
// The single shared implementation — previously duplicated (correctly) in
// HsmKeyTable and (missing entirely, so stale-handle-prone) in
// HsmKeyInspector and VpnSimulationPanel's own resolver.
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_findAllObjects,
  CKA_UNIQUE_ID,
  Pkcs11Error,
  CKR_SESSION_HANDLE_INVALID,
} from '../../../wasm/softhsm'
import type { HsmKey } from '../hsm/HsmContext'

/**
 * True when `err` means the SESSION is gone (CKR_SESSION_HANDLE_INVALID) —
 * an unambiguous "prune this key" signal, unlike a clean empty find (which
 * can also mean "not logged in, can't see private objects" and must NOT be
 * pruned on that basis alone).
 */
export function isSessionGoneError(err: unknown): boolean {
  return err instanceof Pkcs11Error && err.rv === CKR_SESSION_HANDLE_INVALID
}

export function resolveKeyHandle(
  M: SoftHSMModule,
  hSession: number,
  key: Pick<HsmKey, 'handle' | 'uniqueId'>
): number | null {
  if (!key.uniqueId) return key.handle
  const bytes = new TextEncoder().encode(key.uniqueId)
  const ptr = M._malloc(Math.max(bytes.length, 1))
  M.HEAPU8.set(bytes, ptr)
  try {
    const found = hsm_findAllObjects(M, hSession, [
      { type: CKA_UNIQUE_ID, bytesPtr: ptr, bytesLen: bytes.length },
    ])
    return found.length > 0 ? found[0] : null
  } finally {
    M._free(ptr)
  }
}
