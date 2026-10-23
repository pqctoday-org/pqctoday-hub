// SPDX-License-Identifier: AGPL-3.0-only
//
// "Simulate State Loss" against the REAL engines (Rust wasm-bindgen engine as the
// browser uses it, and the C++ Emscripten engine loaded in Node): sign with a live
// HSS key, ask the engine to take the key back, and prove from the signatures
// themselves (the leaf number q inside each LMS signature) that no leaf was reused.
// Nothing is mocked.
//
// Venue: *.local.test.ts (real-wasm venue, run by `npm run test:local`).
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import * as S from '@/wasm/softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import {
  hsm_generateStatefulKeyPair,
  hsm_getKeysRemaining,
  hsm_statefulSignBytes,
} from '@/wasm/softhsm/stateful'
import * as C from '@/wasm/softhsm/constants'
import { probeStateRollback } from './stateRollbackProbe'

const require_ = createRequire(import.meta.url)

const loadCppEngineInNode = async (): Promise<SoftHSMModule> => {
  // process.cwd()-relative, NOT require.resolve('@pqctoday/softhsm-wasm/...'): see lmsAcvpSigVer.local.test.ts.
  const gluePath = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const wasmPath = path.join(path.dirname(gluePath), 'softhsm.wasm')
  const create = require_(gluePath) as (arg?: Record<string, unknown>) => Promise<SoftHSMModule>
  return create({ locateFile: (p: string) => (p.endsWith('.wasm') ? wasmPath : p) })
}

/** The leaf number q: an HSS signature is u32 Nspk || LMS signature, and an LMS signature starts with u32 q. */
const leafOf = (hssSig: Uint8Array): number =>
  new DataView(hssSig.buffer, hssSig.byteOffset).getUint32(4, false)

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('state rollback attempt (%s engine)', (_name, getModule) => {
  let M: SoftHSMModule
  let hSession = 0

  beforeAll(async () => {
    M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'RollbackProbe')
    hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
  }, 60_000)

  afterAll(() => {
    S.hsm_finalize(M, hSession)
  })

  it('refuses to write the counter, read the state or copy the key, and signing continues at the next leaf', () => {
    const { privHandle } = hsm_generateStatefulKeyPair(
      M,
      hSession,
      C.CKM_HSS_KEY_PAIR_GEN,
      C.CKK_HSS,
      C.CKP_LMS_SHA256_M32_H5,
      C.CKP_LMOTS_SHA256_N32_W8,
      [C.CKP_LMS_SHA256_M32_H5],
      [C.CKP_LMOTS_SHA256_N32_W8]
    )
    const leaves: number[] = []
    for (let i = 0; i < 5; i++)
      leaves.push(leafOf(hsm_statefulSignBytes(M, hSession, C.CKM_HSS, privHandle, `before ${i}`)))
    expect(leaves).toEqual([0, 1, 2, 3, 4])
    expect(hsm_getKeysRemaining(M, hSession, privHandle)).toBe(27)

    // ask for the state of signature 3: 32 - 3 = 29 left
    const probe = probeStateRollback(M, hSession, privHandle, 29, () =>
      hsm_getKeysRemaining(M, hSession, privHandle)
    )
    expect(probe.attempts.map((a) => [a.id, a.returned])).toEqual([
      ['write-counter', 'CKR_ATTRIBUTE_READ_ONLY'],
      ['read-state', 'CKR_ATTRIBUTE_SENSITIVE'],
      ['copy-key', 'CKR_ACTION_PROHIBITED'],
    ])
    expect(probe.attempts.every((a) => a.refused)).toBe(true)
    expect([probe.remainingBefore, probe.remainingAfter, probe.counterMoved]).toEqual([
      27,
      27,
      false,
    ])

    // nothing was rewound: the next signatures use leaves 5 and 6, never 3 or 4 again
    const after = [0, 1].map((i) =>
      leafOf(hsm_statefulSignBytes(M, hSession, C.CKM_HSS, privHandle, `after ${i}`))
    )
    expect(after).toEqual([5, 6])
    expect(hsm_getKeysRemaining(M, hSession, privHandle)).toBe(25)
  }, 120_000)
})
