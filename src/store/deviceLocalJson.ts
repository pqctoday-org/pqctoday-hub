// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Device-local, versioned JSON storage for the learner's own work (comments, saved
 * answers, update receipts).
 *
 * Why this is not zustand `persist`: a learner who types a comment must be told when it
 * could not be saved (storage full, or blocked by the browser), keep the text they
 * typed, and be able to retry once. `persist` and `guardedJSONStorage` swallow a failed
 * write and keep the unsaved state in memory, which would show a comment as saved when
 * it is not. Here every write is made first; the in-memory state changes only when the
 * write worked (see `useMyWorkStore`).
 *
 * These stores are deliberately NOT part of the Drive sync, the embed auto-save or the
 * backup snapshot. Nothing in this file is registered with `syncWatchedStores`.
 */

/** Why a write did not happen. `invalid` is a refusal before any write (empty text, bad data). */
export type StorageFailureReason = 'quota' | 'blocked' | 'invalid'

export type WriteResult<T = void> =
  { ok: true; value: T } | { ok: false; reason: StorageFailureReason }

export function writeOk<T>(value: T): WriteResult<T> {
  return { ok: true, value }
}

export function writeFailed(reason: StorageFailureReason): {
  ok: false
  reason: StorageFailureReason
} {
  return { ok: false, reason }
}

/** Browsers name a full store differently (Chrome and Safari, older Firefox); the message is the last resort. */
export function isQuotaError(e: unknown): boolean {
  if (typeof e !== 'object' || e === null) return false
  const { name, message, code } = e as { name?: string; message?: string; code?: number }
  return (
    name === 'QuotaExceededError' ||
    name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    code === 22 ||
    code === 1014 ||
    (typeof message === 'string' && /quota/i.test(message))
  )
}

export function classifyStorageError(e: unknown): 'quota' | 'blocked' {
  return isQuotaError(e) ? 'quota' : 'blocked'
}

/** The browser's local storage, or null when the browser blocks even looking at it. */
function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

export interface Envelope<S> {
  version: number
  state: S
}

export type LoadStatus = 'fresh' | 'loaded' | 'migrated' | 'recovered' | 'blocked'

export interface LoadResult<S> {
  state: S
  status: LoadStatus
}

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/**
 * Read a stored envelope. Never throws:
 *  - nothing stored: `fresh`, the fallback state.
 *  - stored by an older version: run `migrate(state, storedVersion)`; `migrated`.
 *  - unreadable or not an envelope: the raw text is kept under `<key>.unreadable` (best
 *    effort) so nothing the learner wrote is destroyed, and the fallback state is used; `recovered`.
 *  - storage blocked: the fallback state; `blocked`.
 */
export function readEnvelope<S>(
  key: string,
  version: number,
  migrate: (persisted: unknown, fromVersion: number) => S,
  fallback: () => S
): LoadResult<S> {
  const storage = getStorage()
  if (!storage) return { state: fallback(), status: 'blocked' }
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    return { state: fallback(), status: 'blocked' }
  }
  if (raw === null) return { state: fallback(), status: 'fresh' }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.version !== 'number' || !('state' in parsed)) {
      throw new Error('not an envelope')
    }
    // A store written by a NEWER build is read as it is, never downgraded or overwritten blindly.
    const from = parsed.version
    return { state: migrate(parsed.state, from), status: from === version ? 'loaded' : 'migrated' }
  } catch {
    try {
      storage.setItem(`${key}.unreadable`, raw)
    } catch {
      /* nothing more can be done: the original text stays in place until the next write */
    }
    return { state: fallback(), status: 'recovered' }
  }
}

/** Write an envelope. The result says whether it is on the device, and why not when it is not. */
export function writeEnvelope<S>(key: string, version: number, state: S): WriteResult {
  const storage = getStorage()
  if (!storage) return writeFailed('blocked')
  let text: string
  try {
    text = JSON.stringify({ version, state } satisfies Envelope<S>)
  } catch {
    return writeFailed('invalid')
  }
  try {
    storage.setItem(key, text)
    return writeOk(undefined)
  } catch (e) {
    return writeFailed(classifyStorageError(e))
  }
}

/** Whether the browser lets this page write to local storage right now (for a standing notice). */
export function probeStorage(): 'ok' | 'quota' | 'blocked' {
  const storage = getStorage()
  if (!storage) return 'blocked'
  const probe = '__pqc_probe__'
  try {
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return 'ok'
  } catch (e) {
    return classifyStorageError(e)
  }
}

/** Words for a failed write, naming the action (handoff section 11.1). */
export const FAILURE_WORDS: Record<StorageFailureReason, string> = {
  quota: 'This device has no room left in the browser storage.',
  blocked: 'The browser is not letting this page save to the device.',
  invalid: 'There was nothing valid to save.',
}

export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${uuid}`
}

/** A short stable hash (FNV-1a, 32 bit) for ids that must come out the same every time. */
export function stableId(prefix: string, text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return `${prefix}-${(h >>> 0).toString(36)}`
}
