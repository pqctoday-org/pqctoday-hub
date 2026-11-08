// SPDX-License-Identifier: AGPL-3.0-only
import { webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FiveGService } from '../FiveGService'
import { importAtUDM, personalizeUSIM } from './ProvisionOps'
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))
const originalCrypto = Object.getOwnPropertyDescriptor(window, 'crypto')
beforeEach(() => {
  Object.defineProperty(window, 'crypto', { configurable: true, value: webcrypto })
})
afterEach(() => {
  vi.restoreAllMocks()
  if (originalCrypto) Object.defineProperty(window, 'crypto', originalCrypto)
})
const k = '01'.repeat(16),
  opc = '02'.repeat(16)
describe('Provisioning distinguishes process walkthroughs from sample encryption', () => {
  it('does not claim a USIM write or card readiness from a displayed plan', async () => {
    const service = new FiveGService()
    const result = await service.personalizeUSIM(k, opc)
    expect(result).toEqual(await personalizeUSIM(service, k, opc))
    expect(result).toContain('[WALKTHROUGH] Personalization process reviewed.')
    expect(result).toContain('No key was written to a card')
    expect(result).toContain('no card readiness was established')
    expect(result).not.toContain('[SUCCESS]')
    expect(result).not.toContain('Written to tamper-resistant memory')
  })
  it('rejects malformed batches before decrypting rather than treating the walkthrough as an import', async () => {
    const decrypt = vi.spyOn(window.crypto.subtle, 'decrypt')
    const service = new FiveGService()
    const key = await window.crypto.subtle.generateKey({ name: 'AES-GCM', length: 128 }, false, [
      'encrypt',
      'decrypt',
    ])
    for (const encrypted of ['not-an-encrypted-batch', '00'.repeat(16), '']) {
      await expect(service.importAtUDM(encrypted, key)).rejects.toThrow()
      await expect(importAtUDM(service, encrypted, key)).rejects.toThrow()
    }
    expect(decrypt).not.toHaveBeenCalled()
  })
  it('delegates a real authenticated sample roundtrip while keeping card/database actions unexecuted', async () => {
    const service = new FiveGService()
    const actualOpc = await service.computeOPc(k)
    const encrypted = await service.encryptTransport(k, actualOpc)
    expect(encrypted.envelope.algorithm).toBe('AES-128-GCM')
    expect(encrypted.transportKey.extractable).toBe(false)
    const imported = await service.importAtUDM(
      JSON.stringify(encrypted.envelope),
      encrypted.transportKey
    )
    expect(imported.record).toEqual({ imsi: '310260123456789', k, opc: actualOpc })
    expect(imported.checks.authentication).toContain('passed')
    expect(imported.checks.sampleStorage).toContain('no USIM or subscriber database write')
  })
})
