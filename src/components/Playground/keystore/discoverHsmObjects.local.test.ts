// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test: discoverHsmObjects is per-step registry bookkeeping, not
// lesson content, and must never add entries to the learner-visible call
// log. Uses the real WASM engine (matching this project's *.local.test.ts
// convention) with two references to the SAME module — one wrapped in the
// logging proxy, one raw — to prove discoverHsmObjects only ever touches
// the raw one.
import { describe, it, expect, beforeAll } from 'vitest'
import {
  getSoftHSMRustModule,
  createLoggingProxy,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_generateAESKey,
  type SoftHSMModule,
  type Pkcs11LogEntry,
} from '@/wasm/softhsm'
import { discoverHsmObjects } from './discoverHsmObjects'
import type { HsmContextValue } from '../hsm/HsmContext'

describe('discoverHsmObjects — must not touch the learner-visible log', () => {
  let raw: SoftHSMModule
  let proxy: SoftHSMModule
  let hSession: number
  const log: Pkcs11LogEntry[] = []

  beforeAll(async () => {
    raw = (await getSoftHSMRustModule()) as SoftHSMModule
    proxy = createLoggingProxy(raw, (e) => log.push(e), 'rust') as unknown as SoftHSMModule
    hsm_initialize(proxy)
    const slot = hsm_getFirstSlot(proxy)
    const initializedSlot = hsm_initToken(proxy, slot, '12345678', 'DiscoverTest')
    hSession = hsm_openUserSession(proxy, initializedSlot, '12345678', 'user1234')
  })

  it('adds zero log entries even when it discovers a brand-new object', () => {
    // A key generated directly through the proxy (as a lesson step would)
    // DOES log — sanity-checks the harness before asserting the negative.
    const handle = hsm_generateAESKey(proxy, hSession, 256)
    const countAfterGenerate = log.length
    expect(countAfterGenerate).toBeGreaterThan(0)

    const hsm = {
      moduleRef: { current: proxy },
      rawModuleRef: { current: raw },
      hSessionRef: { current: hSession },
      hsmKeysRef: { current: [] },
      addHsmKey: (k: unknown) => k,
    } as unknown as HsmContextValue

    const added = discoverHsmObjects(hsm)

    expect(added).toBeGreaterThan(0) // it did find the key generated above
    expect(log.length).toBe(countAfterGenerate) // but logged nothing doing it
    expect(handle).toBeGreaterThan(0)
  })
})
