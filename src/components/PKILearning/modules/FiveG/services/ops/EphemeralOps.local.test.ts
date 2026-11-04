// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { FiveGService } from '../FiveGService'
import { openSSLService } from '@/services/crypto/OpenSSLService'
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))
// Control-flow checks use mocked output, not known-answer cryptographic evidence.
const secret = '12'.repeat(32)
function context() {
  const ctx = new FiveGService()
  ctx.getTimestamp = () => 'sample'
  ctx.state = {
    ephPrivHex: 'aabb',
    hnPubHex: 'ccdd',
    sharedSecretHex: '99'.repeat(32),
    kEncHex: 'aa'.repeat(16),
    kMacHex: 'bb'.repeat(32),
    encryptedMSINHex: 'cc',
    macTagHex: 'dd',
    ciphertextHex: 'ee',
    cipherFile: 'old',
  }
  return ctx
}
describe('SUCI shared-secret failure gate', () => {
  beforeEach(() => vi.resetAllMocks())
  it.each(['A', 'B'] as const)(
    'retains actual 32-byte output and clears downstream state in profile %s',
    async (profile) => {
      const ctx = context()
      vi.mocked(openSSLService.execute).mockResolvedValue({
        stdout: '',
        stderr: '',
        files: [{ name: '5g_shared_secret_sample.bin', data: new Uint8Array(32).fill(0x12) }],
      })
      expect(await ctx.computeSharedSecret(profile, 'private', 'public')).toContain(
        '[SUCCESS] Shared secret'
      )
      expect(ctx.state.sharedSecretHex).toBe(secret)
      expect(ctx.state.kEncHex).toBeUndefined()
      expect(ctx.state.encryptedMSINHex).toBeUndefined()
    }
  )
  it.each(['missing', 'empty', 'short', 'reported error', 'thrown error', 'missing legacy'])(
    'rejects %s and blocks downstream key derivation and encryption',
    async (failure) => {
      const ctx = context()
      if (failure === 'missing legacy') {
        delete ctx.state.ephPrivHex
        delete ctx.state.hnPubHex
      }
      if (failure === 'thrown error')
        vi.mocked(openSSLService.execute).mockRejectedValue(new Error('engine unavailable'))
      else
        vi.mocked(openSSLService.execute).mockResolvedValue({
          stdout: '',
          stderr: '',
          error: failure === 'reported error' ? 'engine failure' : undefined,
          files: ['missing', 'missing legacy'].includes(failure)
            ? []
            : [
                {
                  name: '5g_shared_secret_sample.bin',
                  data: new Uint8Array(failure === 'short' ? 4 : failure === 'empty' ? 0 : 32),
                },
              ],
        })
      await expect(ctx.computeSharedSecret('A', 'private', 'public')).rejects.toThrow(
        /Shared-secret/
      )
      expect(ctx.state.sharedSecretHex).toBeUndefined()
      expect(ctx.state.kEncHex).toBeUndefined()
      expect(ctx.state.kMacHex).toBeUndefined()
      expect(ctx.state.encryptedMSINHex).toBeUndefined()
      expect(ctx.state.macTagHex).toBeUndefined()
      expect(ctx.state.ciphertextHex).toBeUndefined()
      vi.mocked(openSSLService.execute).mockClear()
      await expect(ctx.deriveKeys('A')).rejects.toThrow(/derivation failed/)
      await expect(ctx.encryptMSIN()).rejects.toThrow(/No key derived/)
      expect(openSSLService.execute).not.toHaveBeenCalled()
    }
  )
  it('can retry after a failure without using old outputs', async () => {
    const ctx = context()
    vi.mocked(openSSLService.execute)
      .mockRejectedValueOnce(new Error('engine unavailable'))
      .mockResolvedValueOnce({
        stdout: '',
        stderr: '',
        files: [{ name: '5g_shared_secret_sample.bin', data: new Uint8Array(32).fill(0x12) }],
      })
    await expect(ctx.computeSharedSecret('A', 'private', 'public')).rejects.toThrow()
    await ctx.computeSharedSecret('A', 'private', 'public')
    expect(ctx.state.sharedSecretHex).toBe(secret)
    expect(ctx.state.kEncHex).toBeUndefined()
  })
  it('rejects malformed supplied vector bytes rather than silently coercing them', async () => {
    const ctx = context()
    ctx.enableTestMode({ profileA: { hnPriv: '', ephPriv: '', zEcdh: 'zz' } })
    await expect(ctx.computeSharedSecret('A', 'private', 'public')).rejects.toThrow(/32 bytes/)
    expect(openSSLService.execute).not.toHaveBeenCalled()
  })
})
