// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { mutateByte, runTamperSample } from './cryptoTamperVerifier'

describe('computed cryptographic failure and recovery', () => {
  it.each([44, 65, 87])(
    'verifies, mutates and restores ML-DSA-%s using the actual primitive',
    async (variant) => {
      expect(await runTamperSample('signature', variant)).toMatchObject({
        baselineValid: true,
        alteredAccepted: false,
        restoredValid: true,
      })
    }
  )
  it.each([512, 768, 1024])(
    'detects an ML-KEM-%s changed secret with authenticated follow-on',
    async (variant) => {
      expect(await runTamperSample('encapsulation', variant)).toMatchObject({
        baselineValid: true,
        alteredAccepted: false,
        restoredValid: true,
        confirmationRejected: true,
      })
    }
  )
  it('preserves input bytes and rejects nonexistent mutation positions', () => {
    const original = new Uint8Array([0x42])
    expect(mutateByte(original, 0)).toEqual(new Uint8Array([0x43]))
    expect(original[0]).toBe(0x42)
    expect(() => mutateByte(original, -1)).toThrow()
    expect(() => mutateByte(original, 1)).toThrow()
    expect(() => mutateByte(original, 0.5)).toThrow()
  })
  it('rejects unsupported parameter sets rather than substituting another algorithm', async () => {
    await expect(runTamperSample('signature', 512)).rejects.toThrow('Unsupported')
    await expect(runTamperSample('encapsulation', 65)).rejects.toThrow('Unsupported')
  })
})
