// SPDX-License-Identifier: GPL-3.0-only
// WS-3 write-half check: every label-taking key generator must actually
// write CKA_LABEL into the object it creates. hsm_generateECKeyPair
// encoded the label, malloc'd it, freed it in the finally block — and never
// pushed it into pubAttrs/prvAttrs, so the label was silently discarded on
// every EC/EdDSA-curve key pair (found live: HsmPlayground.tsx's own default
// key generation passes label='sign' through this exact path). Every other
// label-taking generator already did this correctly; this test pins all of
// them so the same defect can't reappear in one without the others.
//
// Venue: *.local.test.ts, real-wasm venue, both engines — same C++ Node-load
// pattern as mechanismNames.local.test.ts (getSoftHSMCppModule() is browser-only).
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
])('CKA_LABEL round-trips on every label-taking generator (%s engine)', (_name, getModule) => {
  const setup = async () => {
    const M = (await getModule()) as SoftHSMModule
    S.hsm_initialize(M)
    const slot = S.hsm_getFirstFreeSlot(M)
    const slotId = S.hsm_initToken(M, slot, '12345678', 'LabelRT')
    const hSession = S.hsm_openUserSession(M, slotId, '12345678', 'user1234')
    return { M, hSession }
  }

  const LABEL = 'my-probe-label'

  it('hsm_generateECKeyPair — the fixed generator', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateECKeyPair(M, hSession, 'P-256', false, LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, pubHandle).ckLabel).toBe(LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, privHandle).ckLabel).toBe(LABEL)
    S.hsm_finalize(M, hSession)
  }, 30000)

  it('hsm_generateEdDSAKeyPair', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateEdDSAKeyPair(
      M,
      hSession,
      'Ed25519',
      false,
      LABEL
    )
    expect(S.hsm_getKeyAttributes(M, hSession, pubHandle).ckLabel).toBe(LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, privHandle).ckLabel).toBe(LABEL)
    S.hsm_finalize(M, hSession)
  }, 30000)

  it('hsm_generateMLKEMKeyPair', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateMLKEMKeyPair(M, hSession, 768, false, LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, pubHandle).ckLabel).toBe(LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, privHandle).ckLabel).toBe(LABEL)
    S.hsm_finalize(M, hSession)
  }, 30000)

  it('hsm_generateRSAKeyPair', async () => {
    const { M, hSession } = await setup()
    const { pubHandle, privHandle } = S.hsm_generateRSAKeyPair(M, hSession, 2048, false, LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, pubHandle).ckLabel).toBe(LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, privHandle).ckLabel).toBe(LABEL)
    S.hsm_finalize(M, hSession)
  }, 30000)

  it('hsm_generateAESKey', async () => {
    const { M, hSession } = await setup()
    const handle = S.hsm_generateAESKey(M, hSession, 256, true, true, true, true, true, true, LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, handle).ckLabel).toBe(LABEL)
    S.hsm_finalize(M, hSession)
  }, 30000)

  it('hsm_generateChaCha20Key', async () => {
    const { M, hSession } = await setup()
    const handle = S.hsm_generateChaCha20Key(M, hSession, true, true, true, LABEL)
    expect(S.hsm_getKeyAttributes(M, hSession, handle).ckLabel).toBe(LABEL)
    S.hsm_finalize(M, hSession)
  }, 30000)
})
