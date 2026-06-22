// SPDX-License-Identifier: GPL-3.0-only
/**
 * Tests for the quota-guarded persist storage (B1 persistence hardening).
 * A failing write (e.g. QuotaExceededError) must be caught and logged, never
 * thrown — so a full localStorage can't crash a state update.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { guardedJSONStorage } from './guardedStorage'

afterEach(() => vi.restoreAllMocks())

describe('guardedJSONStorage', () => {
  it('swallows a QuotaExceededError on write and logs it (does not throw)', () => {
    const err = new DOMException('exceeded', 'QuotaExceededError')
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw err
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    const storage = guardedJSONStorage()
    // createJSONStorage may return undefined only if no storage — here it's defined.
    expect(() => storage!.setItem('pki-module-storage', { state: {}, version: 1 })).not.toThrow()
    expect(setItem).toHaveBeenCalled()
    expect(consoleError).toHaveBeenCalledWith(expect.stringContaining('quota exceeded'))
  })

  it('round-trips a value when storage is healthy', () => {
    const storage = guardedJSONStorage()
    storage!.setItem('pqc-test-key', { state: { a: 1 }, version: 0 })
    const got = storage!.getItem('pqc-test-key') as { state: { a: number } } | null
    expect(got?.state.a).toBe(1)
    storage!.removeItem('pqc-test-key')
    expect(storage!.getItem('pqc-test-key')).toBeNull()
  })
})
