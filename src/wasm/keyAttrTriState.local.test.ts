// SPDX-License-Identifier: GPL-3.0-only
// WS-2 plumbing check: hsm_getKeyAttributes must distinguish "not present on
// this object" (CKR_ATTRIBUTE_TYPE_INVALID) from a real value, via the new
// `unavailable` map — not collapse both to null the way it did before this
// change. Exercised against a field that's genuinely absent on non-PQC keys
// today, no WS-3 fields needed: CKA_PARAMETER_SET is probed unconditionally
// for every key class in hsm_getKeyAttributes, but an EC key has no such
// attribute, so the engine returns CKR_ATTRIBUTE_TYPE_INVALID for it.
//
// Venue: *.local.test.ts, real-wasm venue — follows mechanismNames.local.test.ts's
// pattern for loading the C++ engine directly in Node (getSoftHSMCppModule()
// is browser-only; it injects a <script> tag).
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as S from './softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  const gluePath = require_.resolve('@pqctoday/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const createSoftHSMModule = require_(gluePath) as (
    arg?: Record<string, unknown>
  ) => Promise<SoftHSMModule>
  return createSoftHSMModule({
    locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p),
  })
}

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('hsm_getKeyAttributes tri-state classification (%s engine)', (_name, getModule) => {
  it('classifies a genuinely-absent attribute as "absent", not a bare null', async () => {
    const M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'TriState')
    const hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')

    const { pubHandle } = S.hsm_generateECKeyPair(M, hSession, 'P-256')
    const attrs = S.hsm_getKeyAttributes(M, hSession, pubHandle)

    // The value itself is unchanged from before this change — still null.
    expect(attrs.ckParameterSet).toBeNull()
    // What's new: the map tells you WHY, instead of an indistinguishable null.
    expect(attrs.unavailable.ckParameterSet).toBe('absent')

    // A real value must never be misclassified — CKA_CLASS is always present.
    expect(attrs.ckClass).not.toBeNull()
    expect(attrs.unavailable.ckClass).toBeUndefined()

    S.hsm_finalize(M, hSession)
  }, 30000)

  it('leaves class-gated fields as an ordinary null with no unavailable entry', async () => {
    const M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'TriState2')
    const hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')

    const { pubHandle } = S.hsm_generateECKeyPair(M, hSession, 'P-256')
    const attrs = S.hsm_getKeyAttributes(M, hSession, pubHandle)

    // CKA_SENSITIVE is never even probed on a public key (client-side class
    // gate in hsm_getKeyAttributes) — this must stay a plain "not probed"
    // null, not get misclassified as 'absent' or 'error'.
    expect(attrs.ckSensitive).toBeNull()
    expect(attrs.unavailable.ckSensitive).toBeUndefined()

    S.hsm_finalize(M, hSession)
  }, 30000)
})
