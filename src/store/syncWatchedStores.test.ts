// SPDX-License-Identifier: GPL-3.0-only
/**
 * Drift guard for the shared persistence watch-list (H7).
 *
 * `useSyncEffect` (Google Drive sync) and `useEmbedPersistence` (embed auto-save)
 * used to hand-maintain their own copies of "which stores to watch for changes",
 * and the copies had drifted. They now both derive from `WATCHED_STORES`. These
 * tests pin the resulting sets so any future change is deliberate and applied to
 * both consumers at once — a single store can never again be watched in one path
 * but silently forgotten in the other.
 */
import { describe, it, expect } from 'vitest'
import {
  WATCHED_STORES,
  CLOUD_SYNC_WATCHED_STORES,
  EMBED_WATCHED_STORES,
} from './syncWatchedStores'

describe('persistence watch-list registry', () => {
  it('keys are unique and every entry exposes a subscribe()', () => {
    const keys = WATCHED_STORES.map((e) => e.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const e of WATCHED_STORES) {
      expect(typeof e.store.subscribe, `${e.key}.subscribe`).toBe('function')
    }
  })

  it('pins the cloud-sync watch set (18 stores — the useSyncEffect list)', () => {
    expect(CLOUD_SYNC_WATCHED_STORES.length).toBe(18)
  })

  it('pins the embed watch set (16 stores — the useEmbedPersistence list)', () => {
    expect(EMBED_WATCHED_STORES.length).toBe(16)
  })

  it('the embed set is a strict subset of the cloud-sync set', () => {
    const cloud = new Set(CLOUD_SYNC_WATCHED_STORES)
    for (const s of EMBED_WATCHED_STORES) expect(cloud.has(s)).toBe(true)
  })

  it('history + airplane-mode are the only cloud-synced stores NOT embed-watched', () => {
    // History is forwarded via a separate event channel in the embed hook;
    // airplane-mode is irrelevant to the embed snapshot. Any other divergence
    // is unintended drift and should fail here.
    const cloudOnly = WATCHED_STORES.filter((e) => e.cloudSync && !e.embed)
      .map((e) => e.key)
      .sort()
    expect(cloudOnly).toEqual(['useAirplaneModeStore', 'useHistoryStore'])
  })
})
