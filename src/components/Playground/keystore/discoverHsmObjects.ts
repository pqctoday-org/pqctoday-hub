// SPDX-License-Identifier: GPL-3.0-only
//
// discoverHsmObjects — enumerate every PKCS#11 object on the current session
// and register any handle HsmContext doesn't already know about. Shared by
// HsmKeyTable's "Discover" button and the Learn tab's automatic per-step
// registration, so a PKCS#11 key never needs its own classification logic
// written twice.
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import { hsm_findAllObjects, hsm_getKeyAttributes, hsm_getSessionInfo } from '../../../wasm/softhsm'
import type { HsmContextValue, HsmFamily, HsmKey, HsmKeyRole } from '../hsm/HsmContext'

export const CKK_NAMES: Record<number, string> = {
  0x00: 'CKK_RSA',
  0x03: 'CKK_EC',
  0x10: 'CKK_GENERIC_SECRET',
  0x1f: 'CKK_AES',
  0x33: 'CKK_CHACHA20',
  0x40: 'CKK_EC_EDWARDS',
  0x41: 'CKK_EC_MONTGOMERY',
  0x46: 'CKK_HSS',
  0x47: 'CKK_XMSS',
  0x48: 'CKK_XMSSMT',
  0x49: 'CKK_ML_KEM',
  0x4a: 'CKK_ML_DSA',
  0x4b: 'CKK_SLH_DSA',
  // Vendor-defined (no v3.2 CKK_* assignment exists for these families).
  0x80000001: 'CKK_PQCTODAY_FRODOKEM',
  0x80000002: 'CKK_PQCTODAY_CLASSIC_MCELIECE',
}

// Exported (not copied) — HsmKeyInspector.tsx re-exports these instead of
// holding its own stale copy. A stale second copy is exactly how the
// CKK_EC_MONTGOMERY fix above once existed here but not there: an X25519 key
// classified correctly through this file's own callers, but still rendered
// as a mislabeled AES key through any consumer of the other copy.
export const CKK_TO_FAMILY: Record<number, HsmFamily> = {
  0x00: 'rsa',
  0x03: 'ecdsa',
  0x10: 'hmac',
  0x1f: 'aes',
  0x33: 'chacha20',
  0x40: 'eddsa',
  // 0x41 CKK_EC_MONTGOMERY (X25519/X448) is key agreement, not signing — it must
  // map to 'ecdh' to match what HsmKeyAgreementPanel registers directly. Without
  // this entry it fell through the `?? 'aes'` default below and every discovered
  // Montgomery key was silently filed as a symmetric AES key.
  0x41: 'ecdh',
  0x49: 'ml-kem',
  0x4a: 'ml-dsa',
  0x4b: 'slh-dsa',
  0x46: 'hss',
  0x47: 'xmss',
  0x48: 'xmss',
  // Vendor-defined KEM families (no v3.2 CKK_* assignment exists for these).
  0x80000001: 'frodo-kem',
  0x80000002: 'classic-mceliece',
}

export const CKO_TO_ROLE: Record<number, HsmKeyRole> = {
  0x02: 'public',
  0x03: 'private',
  0x04: 'secret',
}

// Canonical CKA_CLASS name table — the one place this mapping is written,
// re-exported (not copied) by hsmKeyAttrDisplay.tsx. Matches
// wasm/pkcs11Inspect.ts's CKO_TABLE (kept in sync manually; that one carries
// descriptions for the log's decode drawer, this one just names).
export const CKO_NAMES: Record<number, string> = {
  0x00: 'CKO_DATA',
  0x01: 'CKO_CERTIFICATE',
  0x02: 'CKO_PUBLIC_KEY',
  0x03: 'CKO_PRIVATE_KEY',
  0x04: 'CKO_SECRET_KEY',
  0x09: 'CKO_PROFILE',
}

/**
 * Finds every object on the given session's token and registers any handle
 * not already in `knownHandles` via `addKey`. Returns the number of newly
 * registered keys. The classification tables above (CKK_TO_FAMILY,
 * CKO_TO_ROLE) are the single source of truth for turning a raw PKCS#11
 * object into an `HsmKey` — every caller (the shared HsmContext session,
 * the Developer tab's own separately-slotted session) goes through this one
 * function so that classification is never written twice.
 *
 * Stamps `uniqueId` (CKA_UNIQUE_ID) on every registered key — the object's
 * durable identity. `handle` is only ever meaningful within the session
 * that returned it (PKCS#11 v3.2 §3.2); a real bug found live 2026-08-30
 * had the Developer tab register a handle from the generating script's own
 * (already-closed) session, and a fresh session saw the same object under
 * a DIFFERENT handle — every later attribute read failed with
 * CKR_OBJECT_HANDLE_INVALID. `HsmKeyTable` re-resolves the current handle
 * from `uniqueId` before every live query; `handle` here is only a
 * same-session-call convenience, never treated as identity downstream.
 */
function discoverObjectsOnSession(
  M: SoftHSMModule,
  hSession: number,
  known: { handles: ReadonlySet<number>; uniqueIds: ReadonlySet<string> },
  addKey: (key: HsmKey) => void
): number {
  const handles = hsm_findAllObjects(M, hSession, [])
  // Derive the real slot from the session being scanned — once per call,
  // not per caller-supplied guess. A caller (e.g. the Developer tab) used
  // to pass its own slotId in; deriving it here instead means a discovered
  // key's slotId is always the slot it was actually found on.
  let slotId = -1
  try {
    slotId = hsm_getSessionInfo(M, hSession).slotID
  } catch (err) {
    console.error('discoverObjectsOnSession: could not read slotID for session', hSession, err)
  }
  let added = 0
  for (const h of handles) {
    try {
      const a = hsm_getKeyAttributes(M, hSession, h)
      // De-dup by CKA_UNIQUE_ID when the object has one — its durable
      // identity, not the handle this particular find call happened to
      // return (handle allocation is not guaranteed stable call-to-call,
      // even within the same session — the exact fragility this whole fix
      // exists to route around). Falls back to the raw handle only for
      // objects with no UID.
      const alreadyKnown = a.ckUniqueId ? known.uniqueIds.has(a.ckUniqueId) : known.handles.has(h)
      if (alreadyKnown) continue
      // Only genuine key classes (public/private/secret) are keys. Everything
      // else the token publishes — CKO_PROFILE (0x09) conformance markers,
      // CKO_DATA, CKO_CERTIFICATE, CKO_DOMAIN_PARAMETERS, CKO_HW_FEATURE — is
      // not a key and must not be filed as one. This used to fall through
      // `?? 'secret'` below and show up as an "Unknown (discovered)" phantom
      // key with no CKA_KEY_TYPE (the CKO_PROFILE objects every token
      // publishes at init per PKCS#11 v3.2 Profiles §3).
      if (a.ckClass === null || !(a.ckClass in CKO_TO_ROLE)) continue
      const family: HsmFamily = a.ckKeyType !== null ? (CKK_TO_FAMILY[a.ckKeyType] ?? 'aes') : 'aes'
      const role: HsmKeyRole = CKO_TO_ROLE[a.ckClass]
      const typeName = a.ckKeyType !== null ? (CKK_NAMES[a.ckKeyType] ?? 'Unknown') : 'Unknown'
      // Prefer the object's real CKA_LABEL — set by most generators, and now
      // by hsm_generateECKeyPair too (previously silently dropped). Fall back
      // to a synthetic label only when the object genuinely has none (empty
      // string, e.g. imported without one) or the read failed.
      const label = a.ckLabel && a.ckLabel.length > 0 ? a.ckLabel : `${typeName} (discovered)`
      addKey({
        handle: h,
        family,
        role,
        label,
        generatedAt: new Date().toLocaleTimeString(),
        uniqueId: a.ckUniqueId ?? '',
        sessionHandle: hSession,
        slotId,
      })
      added++
    } catch {
      // skip objects that can't be queried
    }
  }
  return added
}

/**
 * Finds every object on the current session's token and registers any
 * handle not already tracked in the key registry (e.g. keys generated by a
 * Learn-tab lesson step, which calls `hsm_generate*` directly rather than
 * going through `addHsmKey`). Returns the number of newly registered keys.
 *
 * Reads `hsm.hsmKeysRef` (not `hsm.hsmKeys`) so that calling this more than
 * once per tick — e.g. once per lesson step inside a "Run all" loop, with
 * no render in between — sees keys registered by the previous call instead
 * of a stale pre-loop snapshot, which would otherwise re-discover and
 * duplicate-register the same handle on every iteration.
 *
 * Uses `rawModuleRef` (no logging proxy), not `moduleRef` — this is registry
 * bookkeeping, not a lesson step, and its C_FindObjectsInit/Final bracket
 * (which would otherwise show up after literally every step, around nothing
 * visible in between) must never appear in a learner's call log.
 */
const knownFromRegistry = (
  hsmKeysRef: Pick<HsmContextValue, 'hsmKeysRef'>['hsmKeysRef']
): { handles: ReadonlySet<number>; uniqueIds: ReadonlySet<string> } => ({
  handles: new Set(hsmKeysRef.current.map((k) => k.handle)),
  uniqueIds: new Set(hsmKeysRef.current.flatMap((k) => (k.uniqueId ? [k.uniqueId] : []))),
})

export const discoverHsmObjects = (hsm: HsmContextValue): number => {
  const M = hsm.rawModuleRef.current
  const hSession = hsm.hSessionRef.current
  if (!M || !hSession) return 0
  return discoverObjectsOnSession(M, hSession, knownFromRegistry(hsm.hsmKeysRef), hsm.addHsmKey)
}

/**
 * Same discovery/classification logic as `discoverHsmObjects`, but scoped to
 * an arbitrary already-open session rather than `HsmContext`'s own —
 * specifically for the Developer tab's separately-labeled/PIN'd slot
 * (`devSlot.ts`), which is deliberately isolated from `HsmContext.hSessionRef`
 * so a Developer-tab script can never log the rest of the HSM playground out
 * from under it. Stamps `sessionHandle` and the real `slotId` (derived via
 * `C_GetSessionInfo`, not caller-supplied) on every registered key so
 * `HsmKeyTable`'s later live queries route to the right session automatically
 * — no slot-picker UI needed, the routing is per-key data. Caller owns the
 * session's lifecycle; this function only scans and registers.
 */
export const discoverHsmObjectsOnSession = (
  M: SoftHSMModule,
  hSession: number,
  hsm: Pick<HsmContextValue, 'hsmKeysRef' | 'addHsmKey'>
): number => {
  return discoverObjectsOnSession(M, hSession, knownFromRegistry(hsm.hsmKeysRef), hsm.addHsmKey)
}
