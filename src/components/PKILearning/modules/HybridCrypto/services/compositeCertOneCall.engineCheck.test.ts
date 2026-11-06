// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The one-call composite certificate asks the loaded engine for CKM_COMP_SIG
 * before it makes any key, and reports "Not in this engine yet" only for that
 * answer. Any other key-generation failure keeps its own message.
 * (The real-engine behaviour of the one-call path is in
 * compositeCertOneCall.local.test.ts.)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { SoftHSMModule } from '@pqctoday/softhsm-wasm'

const v33 = vi.hoisted(() => ({
  compSig: true,
  generate: vi.fn(),
}))

vi.mock('@/wasm/softhsm', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm')>()),
  hsm_getSessionInfo: vi.fn(() => ({ slotID: 7 })),
}))
vi.mock('@/wasm/softhsm/v33', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/wasm/softhsm/v33')>()),
  hsm_detectV33Support: vi.fn(() => ({ compSig: v33.compSig })),
  hsm_generateCompositeKeyPair: v33.generate,
}))

import { hybridCryptoService } from './HybridCryptoService'

const M = {} as SoftHSMModule

describe('one-call composite certificate: engine check', () => {
  beforeEach(() => {
    v33.compSig = true
    v33.generate.mockReset()
  })

  it('an engine without CKM_COMP_SIG is reported before any key is made', async () => {
    v33.compSig = false
    const r = await hybridCryptoService.generateCompositeCertOneCall('/CN=x', M, 1)
    expect(r.error).toContain('Not in this engine yet')
    expect(r.error).toContain('CKM_COMP_SIG')
    expect(v33.generate).not.toHaveBeenCalled()
    expect(r.pem).toBe('')
  })

  it('another key-generation failure is not relabelled as a missing mechanism', async () => {
    v33.generate.mockImplementation(() => {
      throw new Error('C_GenerateKeyPair failed: CKR_DEVICE_ERROR')
    })
    const r = await hybridCryptoService.generateCompositeCertOneCall('/CN=x', M, 1)
    expect(r.error).toContain('CKR_DEVICE_ERROR')
    expect(r.error).not.toContain('Not in this engine yet')
    expect(v33.generate).toHaveBeenCalledTimes(1)
  })
})
