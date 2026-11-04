// SPDX-License-Identifier: AGPL-3.0-only
import { createDecipheriv, webcrypto } from 'node:crypto'
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
  it('does not decrypt, validate or import arbitrary supplied data while explaining the missing operations', async () => {
    const decrypt = vi.spyOn(window.crypto.subtle, 'decrypt')
    const service = new FiveGService()
    for (const encrypted of ['not-an-encrypted-batch', '00'.repeat(16), '']) {
      const result = await service.importAtUDM(encrypted, opc)
      expect(result).toEqual(await importAtUDM(service, encrypted, opc))
      expect(result).toContain('MAC verification: NOT EXECUTED')
      expect(result).toContain('Key validation: NOT EXECUTED')
      expect(result).toContain('Subscriber database write: NOT EXECUTED')
      expect(result).toContain('No subscriber was provisioned')
      expect(result).not.toMatch(/MAC verification: PASS|\[SUCCESS\]/)
    }
    expect(decrypt).not.toHaveBeenCalled()
  })
  it('preserves executable sample AES-CBC encryption without calling it a successful import', async () => {
    const result = await new FiveGService().encryptTransport(k, opc)
    const key = result.match(/Transport Key: ([a-f0-9]+)/)![1]
    const iv = result.match(/IV: ([a-f0-9]+)/)![1]
    const encrypted = result.match(/Encrypted Output\(Hex\):\n([a-f0-9]+)/)![1]
    const decipher = createDecipheriv(
      'aes-128-cbc',
      Buffer.from(key, 'hex'),
      Buffer.from(iv, 'hex')
    )
    const plain = Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'hex')),
      decipher.final(),
    ]).toString('utf8')
    expect(plain).toBe(`IMSI: 310260123456789, K: ${k}, OPc: ${opc} `)
    expect(result).not.toMatch(/MAC verification|provisioning complete|\[SUCCESS\]/)
  })
})
