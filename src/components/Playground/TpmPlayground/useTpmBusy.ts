// SPDX-License-Identifier: GPL-3.0-only
import { useSyncExternalStore } from 'react'
import { isTpmBusy, subscribeTpmBusy } from '../../../wasm/tpmBridge'

/**
 * Reactively tracks whether ANY TPM playground panel currently holds the
 * shared engine lock (tpmBridge.ts's withTpmLock) — multiple panels
 * (Command Builder, Compliance Suite, State Inspector, Learn, EK explorers,
 * Attestation) all drive the one non-reentrant WASM TPM instance, so a busy
 * op in one must disable action buttons everywhere else too, not just
 * locally. See 2026-07-24 TPM playground concurrency remediation.
 */
export function useTpmBusy(): boolean {
  return useSyncExternalStore(subscribeTpmBusy, isTpmBusy)
}
