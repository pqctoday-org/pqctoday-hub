// SPDX-License-Identifier: AGPL-3.0-only
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  getSoftHSMRustModule,
  hsm_finalize,
  hsm_initialize,
  hsm_initToken,
  hsm_getFirstSlot,
  hsm_openUserSession,
  type SoftHSMModule,
} from '@/wasm/softhsm'
import { hsm_eddsaVerify, hsm_importEdDSAPublicKey } from './classical'
import vectors from '@/data/acvp/eddsa_test.json'
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16))
let engine: SoftHSMModule,
  session = 0
beforeAll(async () => {
  engine = (await getSoftHSMRustModule()) as SoftHSMModule
  hsm_finalize(engine, 0)
  hsm_initialize(engine)
  const slot = hsm_initToken(engine, hsm_getFirstSlot(engine), '12345678', 'VerificationSamples')
  session = hsm_openUserSession(engine, slot, '12345678', 'user1234')
}, 30000)
afterAll(() => {
  if (engine) hsm_finalize(engine, session)
})
describe('Ed25519 signature outcomes for negative sample checks', () => {
  it.each(vectors.testGroups[0].tests)(
    'accepts RFC 8032 sample with message $msg and rejects its altered signature',
    (vector) => {
      const key = hsm_importEdDSAPublicKey(engine, session, bytes(vector.pk), 'Ed25519')
      const message = bytes(vector.msg),
        signature = bytes(vector.signature)
      expect(hsm_eddsaVerify(engine, session, key, message, signature, true)).toBe(true)
      signature[signature.length - 1] ^= 0xff
      expect(hsm_eddsaVerify(engine, session, key, message, signature, true)).toBe(false)
    }
  )
  it.each([0, 0xc0, 0xc1, 5, 0x82])(
    'distinguishes injected C_Verify return code %i without changing legacy callers',
    (rv) => {
      const init = vi.spyOn(engine, '_C_VerifyInit').mockReturnValue(0)
      const verify = vi.spyOn(engine, '_C_Verify').mockReturnValue(rv)
      try {
        const run = (strict: boolean) =>
          hsm_eddsaVerify(engine, session, 1, new Uint8Array([1]), new Uint8Array(64), strict)
        expect(run(false)).toBe(rv === 0)
        if ([0, 0xc0, 0xc1].includes(rv)) expect(run(true)).toBe(rv === 0)
        else expect(() => run(true)).toThrow(/C_Verify/)
      } finally {
        verify.mockRestore()
        init.mockRestore()
      }
    }
  )
})
