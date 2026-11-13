// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { sidfDecrypt } from './SucOps'
import type { FiveGService } from '../FiveGService'
import { openSSLService } from '@/services/crypto/OpenSSLService'

vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))

// Application-control tests: mocked HMAC output is not cryptographic-vector evidence.
const tag = '0123456789abcdef'
const context = (macTagHex: string | undefined): FiveGService =>
  ({
    state: {
      kEncHex: '01'.repeat(16),
      kMacHex: '02'.repeat(16),
      encryptedMSINHex: '1234',
      macTagHex,
      supi: '310260123456789',
    },
    getTimestamp: () => 'sample',
    trackFile: vi.fn(),
    bcdDecode: () => '123456789',
  }) as unknown as FiveGService

describe('SIDF authentication gate', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(openSSLService.execute).mockImplementation(async (cmd) =>
      cmd.includes(' dgst ')
        ? { stdout: `${tag}${'0'.repeat(48)}`, stderr: '', files: [] }
        : {
            stdout: '',
            stderr: '',
            files: [{ name: 'dec_msin_sample.bin', data: new Uint8Array([1]) }],
          }
    )
  })

  // Profile C no longer reads sender state; its receiver is covered in SucOps.profileC.local.test.ts.
  it.each(['A', 'B'] as const)(
    'decrypts only after a matching tag in profile %s',
    async (profile) => {
      const result = await sidfDecrypt(context(tag), profile)
      expect(result).toContain('[SUCCESS] SUPI Recovered')
      expect(openSSLService.execute).toHaveBeenCalledWith(
        expect.stringContaining('enc -d'),
        expect.any(Array)
      )
    }
  )

  it.each([undefined, '', 'ff'.repeat(8), '01'])(
    'rejects a missing, mismatching or malformed tag (%s)',
    async (value) => {
      const result = await sidfDecrypt(context(value), 'A')
      expect(result).not.toContain('[SUCCESS]')
      expect(result).toContain('ABORTED')
      expect(
        vi.mocked(openSSLService.execute).mock.calls.some(([cmd]) => cmd.includes('enc -d'))
      ).toBe(false)
    }
  )

  it('does not decrypt after an HMAC operation throws', async () => {
    vi.mocked(openSSLService.execute).mockRejectedValueOnce(new Error('sample engine unavailable'))
    expect(await sidfDecrypt(context(tag), 'A')).toContain('ABORTED')
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
  })

  it('does not decrypt when HMAC output is absent or state is incomplete', async () => {
    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: '',
      stderr: 'failure',
      files: [],
    })
    expect(await sidfDecrypt(context(tag), 'A')).toContain('ABORTED')
    const incomplete = context(tag)
    incomplete.state.kMacHex = ''
    expect(await sidfDecrypt(incomplete, 'A')).toContain('ABORTED')
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
  })
})
