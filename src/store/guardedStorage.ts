// SPDX-License-Identifier: GPL-3.0-only
/**
 * guardedJSONStorage — a drop-in replacement for `createJSONStorage(() => localStorage)`
 * that catches write failures (B1 persistence hardening).
 *
 * Normal zustand persist writes had no quota handling — only the `beforeunload`
 * path did. When localStorage fills (the module store can hold PEM keys, certs,
 * chat, and logs in one blob), a failing `setItem` would throw an uncaught
 * exception in the middle of a state update. This wrapper catches it: the write
 * is dropped and surfaced via console.error, the in-memory state is untouched,
 * and the user keeps working. Capacity itself is unchanged — the larger ceiling
 * (moving heavy artifacts to IndexedDB) is a deferred, separate effort; this is
 * the graceful-degradation guard until then.
 */
import { createJSONStorage, type StateStorage } from 'zustand/middleware'

function isQuotaError(e: unknown): boolean {
  // QuotaExceededError is a DOMException, which is NOT reliably `instanceof Error`
  // (notably in jsdom and some browsers) — match on name/message instead.
  if (typeof e !== 'object' || e === null) return false
  const { name, message } = e as { name?: string; message?: string }
  // Chrome/Safari throw QuotaExceededError; Firefox historically used NS_ERROR_DOM_QUOTA_REACHED.
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    (typeof message === 'string' && /quota/i.test(message))
  )
}

const guardedLocalStorage: StateStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch (e) {
      if (isQuotaError(e)) {
        console.error(
          `Storage quota exceeded while saving "${name}" — this change was not persisted. ` +
            `Export and clear old data, or free browser storage.`
        )
      } else {
        console.error(`Failed to persist "${name}":`, e)
      }
      // Swallow: never let a persist write throw into a state update.
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}

/** Quota-guarded equivalent of `createJSONStorage(() => localStorage)`. */
export const guardedJSONStorage = () => createJSONStorage(() => guardedLocalStorage)
