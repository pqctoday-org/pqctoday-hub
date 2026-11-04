// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  getSoftHSMRustModule,
  hsm_finalize,
  hsm_initialize,
  hsm_getFirstSlot,
  hsm_initToken,
  hsm_openUserSession,
  hsm_generateAESKey,
  hsm_extractKeyValue,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { requireProtectedKeyReadRefusal } from './protectedKeyRead'
let engine: SoftHSMModule
let session = 0
beforeAll(async () => {
  engine = (await getSoftHSMRustModule()) as SoftHSMModule
  hsm_finalize(engine, 0)
  hsm_initialize(engine)
  const slot = hsm_initToken(engine, hsm_getFirstSlot(engine), '12345678', 'ProtectedReadChecks')
  session = hsm_openUserSession(engine, slot, '12345678', 'user1234')
}, 30_000)
afterAll(() => {
  if (engine) hsm_finalize(engine, session)
})
describe('protected-key read checks with the actual Rust engine', () => {
  it('recognises the expected sensitive-attribute refusal for a protected AES sample key', () => {
    const key = hsm_generateAESKey(engine, session, 256, true, true, false, false, false, false)
    expect(
      requireProtectedKeyReadRefusal(() => hsm_extractKeyValue(engine, session, key))
    ).toContain('Sample plaintext-read refusal observed')
  })
  it('rejects the readable-key control rather than calling every attempted read protected', () => {
    const key = hsm_generateAESKey(engine, session, 256, true, true, false, false, false, true)
    expect(() =>
      requireProtectedKeyReadRefusal(() => hsm_extractKeyValue(engine, session, key))
    ).toThrow('unexpectedly succeeded')
  })
  it('keeps a bad handle or bad session incomplete, rather than calling it key protection', () => {
    const key = hsm_generateAESKey(engine, session, 256, true, true, false, false, false, false)
    expect(() =>
      requireProtectedKeyReadRefusal(() => hsm_extractKeyValue(engine, session, 0xffffffff))
    ).toThrow('check incomplete')
    expect(() =>
      requireProtectedKeyReadRefusal(() => hsm_extractKeyValue(engine, 0xffffffff, key))
    ).toThrow('check incomplete')
  })
})
