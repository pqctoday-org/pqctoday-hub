// SPDX-License-Identifier: AGPL-3.0-only
import { createRequire } from 'node:module'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import * as S from '@/wasm/softhsm'
import * as C from '@/wasm/softhsm/constants'
import { hsm_generateStatefulKeyPair, hsm_statefulSignBytes } from '@/wasm/softhsm/stateful'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import reference from '@/data/kat/lms_hss_rfc8554.json'
import { tamperSampleMessage } from './tamperSampleMessage'
const require_ = createRequire(import.meta.url)
let rust: SoftHSMModule, cpp: SoftHSMModule
let rustSession = 0,
  cppSession = 0,
  privateKey = 0,
  cppPublicKey = 0
const bytes = (hex: string) => Uint8Array.from(Buffer.from(hex, 'hex'))
beforeAll(async () => {
  rust = (await S.getSoftHSMRustModule()) as SoftHSMModule
  S.hsm_finalize(rust, 0)
  S.hsm_initialize(rust)
  const rustSlot = S.hsm_initToken(rust, S.hsm_getFirstFreeSlot(rust), '12345678', 'TamperSamples')
  rustSession = S.hsm_openUserSession(rust, rustSlot, '12345678', 'user1234')
  const glue = path.resolve(process.cwd(), 'src/vendor/softhsm-wasm/wasm/softhsm.js')
  const create = require_(glue) as (args: Record<string, unknown>) => Promise<SoftHSMModule>
  cpp = await create({ locateFile: (file: string) => path.join(path.dirname(glue), file) })
  S.hsm_initialize(cpp)
  const cppSlot = S.hsm_initToken(cpp, S.hsm_getFirstFreeSlot(cpp), '12345678', 'TamperVerifier')
  cppSession = S.hsm_openUserSession(cpp, cppSlot, '12345678', 'user1234')
  const pair = hsm_generateStatefulKeyPair(
    rust,
    rustSession,
    C.CKM_HSS_KEY_PAIR_GEN,
    C.CKK_HSS,
    C.CKP_LMS_SHA256_M32_H5,
    C.CKP_LMOTS_SHA256_N32_W8,
    [C.CKP_LMS_SHA256_M32_H5],
    [C.CKP_LMOTS_SHA256_N32_W8]
  )
  privateKey = pair.privHandle
  cppPublicKey = S.hsm_importStatefulPublicKey(
    cpp,
    cppSession,
    C.CKK_HSS,
    S.hsm_extractKeyValue(rust, rustSession, pair.pubHandle)
  )
}, 60_000)
afterAll(() => {
  if (rust) S.hsm_finalize(rust, rustSession)
  if (cpp) S.hsm_finalize(cpp, cppSession)
})
describe('stateful sample signatures reject actually changed message bytes', () => {
  it.each(['', 'a', 'ab', 'abc', 'abcd', 'abcde', 'é', '€', '😀', 'aé'])(
    'verifies the original %j and rejects its changed bytes across engines',
    (message) => {
      const original = new TextEncoder().encode(message)
      const signature = hsm_statefulSignBytes(rust, rustSession, C.CKM_HSS, privateKey, original)
      expect(
        S.hsm_statefulVerifyBytes(cpp, cppSession, C.CKM_HSS, cppPublicKey, original, signature)
      ).toBe(0)
      expect(
        S.hsm_statefulVerifyBytes(
          cpp,
          cppSession,
          C.CKM_HSS,
          cppPublicKey,
          tamperSampleMessage(original),
          signature
        )
      ).toBe(C.CKR_SIGNATURE_INVALID)
    }
  )
  it('also accepts the existing RFC 8554 Appendix F reference signature and rejects the changed message on both engines', () => {
    const vector = reference.test_cases[0]
    for (const [engine, session] of [
      [rust, rustSession],
      [cpp, cppSession],
    ] as const) {
      const key = S.hsm_importStatefulPublicKey(
        engine,
        session,
        C.CKK_HSS,
        bytes(vector.pub_key_hex)
      )
      const message = bytes(vector.message_hex),
        signature = bytes(vector.signature_hex)
      expect(S.hsm_statefulVerifyBytes(engine, session, C.CKM_HSS, key, message, signature)).toBe(0)
      expect(
        S.hsm_statefulVerifyBytes(
          engine,
          session,
          C.CKM_HSS,
          key,
          tamperSampleMessage(message),
          signature
        )
      ).toBe(C.CKR_SIGNATURE_INVALID)
    }
  })
})
