// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  getSoftHSMRustModule,
  hsm_finalize,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_generateMLDSAKeyPair,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { runStep, type LiveState } from './Pkcs11Simulator'

let engine: SoftHSMModule
let session = 0
const freshState = (): LiveState => ({
  mlKemPubHandle: 0,
  mlKemPrivHandle: 0,
  mlKemCiphertext: null,
  mlKemSecretHandle: 0,
  mlDsaPubHandle: 0,
  mlDsaPrivHandle: 0,
  mlDsaSigBytes: null,
  mlDsaMessage: '',
  aesWrapHandle: 0,
})
beforeAll(async () => {
  engine = (await getSoftHSMRustModule()) as SoftHSMModule
  hsm_finalize(engine, 0)
  hsm_initialize(engine)
  const slot = hsm_initToken(engine, hsm_getFirstSlot(engine), '12345678', 'WorkshopChecks')
  session = hsm_openUserSession(engine, slot, '12345678', 'user1234')
}, 30_000)
afterAll(() => {
  if (engine) hsm_finalize(engine, session)
})

describe('HSM workshop sample checks with the Rust engine', () => {
  it('accepts the original signed message and refuses an altered message or wrong key', async () => {
    const state = freshState()
    await runStep(4, engine, session, state)
    expect(await runStep(5, engine, session, state)).toContain('Verification:    VALID')
    const originalMessage = state.mlDsaMessage
    state.mlDsaMessage += ' altered'
    await expect(runStep(5, engine, session, state)).rejects.toThrow(/did not pass/)
    state.mlDsaMessage = originalMessage
    state.mlDsaPubHandle = hsm_generateMLDSAKeyPair(engine, session, 65).pubHandle
    await expect(runStep(5, engine, session, state)).rejects.toThrow(/did not pass/)
  })
  it('accepts matching secrets and refuses altered encapsulation ciphertext', async () => {
    const state = freshState()
    await runStep(0, engine, session, state)
    await runStep(2, engine, session, state)
    expect(await runStep(3, engine, session, state)).toContain('Secrets Match:        YES')
    const changed = new Uint8Array(state.mlKemCiphertext!)
    changed[0] ^= 1
    state.mlKemCiphertext = changed
    await expect(runStep(3, engine, session, state)).rejects.toThrow(/does not match/)
  })
})
