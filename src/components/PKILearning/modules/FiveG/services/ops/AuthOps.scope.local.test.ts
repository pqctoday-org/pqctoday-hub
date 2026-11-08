// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { FiveGService } from '../FiveGService'
import { openSSLService } from '@/services/crypto/OpenSSLService'
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))

describe('Selected 5G home-network output scope', () => {
  it('identifies the derived output without claiming an uncomputed complete authentication vector', async () => {
    const service = new FiveGService()
    service.authState = {
      RAND: new Uint8Array(16),
      SQN: new Uint8Array(6),
      AMF: new Uint8Array(2),
      milenageResult: {
        MAC: new Uint8Array(8),
        RES: new Uint8Array(8),
        CK: new Uint8Array(16),
        IK: new Uint8Array(16),
        AK: new Uint8Array(6),
      },
    }
    vi.mocked(openSSLService.execute).mockResolvedValue({
      stdout: `HMAC-SHA256(sample.bin)= ${'ab'.repeat(32)}`,
      stderr: '',
      files: [],
    })
    const result = await service.deriveKAUSF()
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
    expect(result).toContain(`KAUSF: ${'ab'.repeat(32)}`)
    expect(result).toContain(
      '[NOT EXECUTED] XRES* derivation, subscriber response verification and replay/freshness checks.'
    )
    expect(result).not.toContain('Authentication Vector Ready')
  })
})
