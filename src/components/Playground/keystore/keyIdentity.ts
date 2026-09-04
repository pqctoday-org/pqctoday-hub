// SPDX-License-Identifier: GPL-3.0-only
//
// keyIdentity — the one string that stands in for "this exact PKCS#11
// object" across the hub's key registry: which WASM instance it lives in,
// which slot, and its durable CKA_UNIQUE_ID. A raw `handle` is only valid
// within the session that returned it (PKCS#11 v3.2 §3.2) and is reused
// across slots, so it can never be a safe React list key or dedup/removal
// key on its own — two keys on different slots can carry the same handle
// number at the same time.
import type { HsmKey } from '../hsm/HsmContext'

export const keyIdentity = (k: Pick<HsmKey, 'wasmContext' | 'slotId' | 'uniqueId'>): string =>
  `${k.wasmContext ?? 'main'}:${k.slotId}:${k.uniqueId}`
