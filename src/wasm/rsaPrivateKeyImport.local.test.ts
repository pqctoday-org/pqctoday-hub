// SPDX-License-Identifier: GPL-3.0-only
// Verifies hsm_importRSAPrivateKey (new — no prior RSA private-key import
// existed) against both real engines, using the CRT components already
// stored in rsa_oaep_test.json (WS-4c: wiring that dead file). Decrypts the
// file's own known ciphertext and checks it against the file's known
// plaintext — the exact self-consistency check the ACVP tab performs.
import { describe, it, expect } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as S from './softhsm'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'
import rsaOaepTestVectors from '../data/acvp/rsa_oaep_test.json'

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

const hex = (s: string) => {
  const m = s.match(/.{1,2}/g) ?? []
  return new Uint8Array(m.map((b) => parseInt(b, 16)))
}

describe.each([
  ['rust', () => S.getSoftHSMRustModule()],
  ['cpp', () => loadCppEngineInNode()],
])('hsm_importRSAPrivateKey (%s engine)', (_name, getModule) => {
  it('imports the OAEP test vector CRT key and decrypts its known ciphertext', async () => {
    const M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'RSAImport')
    const hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')

    const tv = rsaOaepTestVectors.testGroups[0].tests[0]
    const privHandle = await S.hsm_importRSAPrivateKey(M, hSession, {
      n: hex(tv.n),
      e: hex(tv.e),
      d: hex(tv.d),
      p: hex(tv.p),
      q: hex(tv.q),
      dp: hex(tv.dp),
      dq: hex(tv.dq),
      qi: hex(tv.qi),
    })
    expect(privHandle).toBeGreaterThan(0)

    const ciphertext = hex(tv.ct)
    const plaintext = S.hsm_rsaDecrypt(M, hSession, privHandle, ciphertext, 'sha256')
    const plaintextHex = Array.from(plaintext)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    expect(plaintextHex).toBe(tv.pt)

    S.hsm_finalize(M, hSession)
  }, 30000)
})
