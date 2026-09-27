// SPDX-License-Identifier: GPL-3.0-only
//
// Regression test for the 2026-09-26 key-deleting defect: navigating from the
// HSM playground's Build tab to Inspect › Keys wiped the user's keys, because
// the Build panel owned the kept-open DevSequences session in a component ref
// and purged every key registered on it in its unmount cleanup — and a tab
// switch unmounts that panel.
//
// Tested at the lowest level the defect actually lives at (cheaper than the
// browser run in e2e/dev-tab-pkcs11.local.spec.ts, which is the end-to-end
// guard): the session's OWNERSHIP. Nothing here is mocked — real Rust
// softhsmv3 WASM, real C_OpenSession/C_FindObjects, per this project's
// *.local.test.ts convention — so a pass means the sessions and objects
// genuinely behave this way, not that a stub was configured to.
//
// Two properties, both of which the old code failed:
//   1. the dev-slot session survives any number of panel mount/unmount cycles
//      (it is module-scoped, so repeat calls return the SAME handle and the
//      objects on it stay reachable), and is only closed by the explicit
//      route-teardown hook;
//   2. "Discover Objects" finds objects on the DevSequences token — the
//      main-session-only scan cannot, which is why the empty state's recovery
//      button silently found nothing.
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  getSoftHSMRustModule,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_generateAESKey,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import {
  ensureDevSlot,
  ensureDevSlotSession,
  getDevSlotSession,
  resetDevSlotCache,
} from './devSlot'
import { discoverHsmObjects, discoverHsmObjectsEverywhere } from '../../keystore/discoverHsmObjects'
import type { HsmContextValue, HsmKey } from '../../hsm/HsmContext'

describe('devSlot session ownership + dev-slot discovery', () => {
  let M: SoftHSMModule
  let mainSession: number
  let devSlot: number
  let registry: HsmKey[] = []
  let hsm: HsmContextValue

  beforeAll(async () => {
    M = (await getSoftHSMRustModule()) as SoftHSMModule
    hsm_initialize(M)
    const slot = hsm_getFirstSlot(M)
    const mainSlot = hsm_initToken(M, slot, '12345678', 'DevSlotTest')
    mainSession = hsm_openUserSession(M, mainSlot, '12345678', 'user1234')
    devSlot = ensureDevSlot(M)
    expect(devSlot).not.toBe(mainSlot)

    hsm = {
      moduleRef: { current: M },
      rawModuleRef: { current: M },
      hSessionRef: { current: mainSession },
      hsmKeysRef: {
        get current() {
          return registry
        },
      },
      addHsmKey: (k: HsmKey) => {
        registry = [k, ...registry]
        return k
      },
    } as unknown as HsmContextValue
  })

  afterAll(() => {
    resetDevSlotCache()
  })

  it('hands back the SAME session across repeated calls — a panel remount is not a session close', () => {
    const first = ensureDevSlotSession(M, devSlot)
    // Simulates exactly what a Build→Inspect→Build round trip does now: the
    // panel asks for the session again rather than owning (and closing) it.
    const second = ensureDevSlotSession(M, devSlot)
    expect(second).toBe(first)
    expect(getDevSlotSession()).toEqual({ M, hSession: first })

    // And the handle is genuinely still usable — not just remembered.
    const key = hsm_generateAESKey(M, first, 256)
    expect(key).toBeGreaterThan(0)
  })

  it('"Discover Objects" finds dev-token objects that a main-session-only scan cannot', () => {
    const devSession = ensureDevSlotSession(M, devSlot)
    hsm_generateAESKey(M, devSession, 256)
    registry = []

    // The main token's session genuinely cannot see the other token's objects —
    // this is the honest reason the old Discover button recovered nothing, and
    // it is asserted rather than assumed.
    const mainOnly = discoverHsmObjects(hsm)
    expect(registry.some((k) => k.slotId === devSlot)).toBe(false)

    registry = []
    const everywhere = discoverHsmObjectsEverywhere(hsm)
    expect(everywhere).toBeGreaterThan(mainOnly)
    const devKeys = registry.filter((k) => k.slotId === devSlot)
    expect(devKeys.length).toBeGreaterThan(0)
    expect(devKeys.every((k) => k.sessionHandle === devSession)).toBe(true)
  })

  it('resetDevSlotCache — the route-teardown hook — is what actually closes it', () => {
    const before = ensureDevSlotSession(M, devSlot)
    resetDevSlotCache()
    expect(getDevSlotSession()).toBeNull()
    const after = ensureDevSlotSession(M, devSlot)
    expect(after).not.toBe(before)
  })
})
