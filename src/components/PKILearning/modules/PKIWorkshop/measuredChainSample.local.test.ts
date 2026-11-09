// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import {
  encodeSampleCertificateMessage,
  generateMeasuredChains,
  inspectMeasuredCertificate,
} from './measuredChainSample'
import type { OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'

describe('Measured sample Certificate message framing', () => {
  it('encodes the two literal entries and distinguishes body from handshake bytes', () => {
    // Framing fixtures, not claims that these tiny byte strings are X.509 certificates.
    const value = encodeSampleCertificateMessage(
      new Uint8Array([0x30, 0]),
      new Uint8Array([0x30, 1, 0])
    )
    expect(Array.from(value.certificateBody)).toEqual([
      0, 0, 0, 15, 0, 0, 2, 0x30, 0, 0, 0, 0, 0, 3, 0x30, 1, 0, 0, 0,
    ])
    expect(Array.from(value.handshakeMessage)).toEqual([11, 0, 0, 19, ...value.certificateBody])
    expect(value.certificateDerBytes).toBe(5)
    expect(value.certificateBody.length).toBe(19)
    expect(value.handshakeMessage.length).toBe(23)
  })
  it('counts a changed entry and copies the original inputs', () => {
    const leaf = new Uint8Array([1, 2]),
      intermediate = new Uint8Array([3])
    const before = encodeSampleCertificateMessage(leaf, intermediate)
    const changed = encodeSampleCertificateMessage(new Uint8Array([1, 2, 4]), intermediate)
    leaf.fill(0)
    expect(Array.from(before.certificateBody.slice(7, 9))).toEqual([1, 2])
    expect(changed.certificateBody.length - before.certificateBody.length).toBe(1)
    expect(changed.handshakeMessage.length - before.handshakeMessage.length).toBe(1)
  })
  it('rejects empty entries and lengths outside the handshake uint24 boundary', () => {
    expect(() => encodeSampleCertificateMessage(new Uint8Array(), new Uint8Array([1]))).toThrow(
      'nonempty'
    )
    expect(() => encodeSampleCertificateMessage(new Uint8Array([1]), new Uint8Array())).toThrow(
      'nonempty'
    )
    expect(() =>
      encodeSampleCertificateMessage(new Uint8Array(0x1000000), new Uint8Array([1]))
    ).toThrow('uint24')
  })
  it('does not confuse valid framing with a valid certificate or matching PEM', () => {
    expect(() =>
      inspectMeasuredCertificate(
        new Uint8Array([0x30, 0]),
        'not a certificate',
        'ML-DSA-65',
        'leaf'
      )
    ).toThrow()
    expect(() =>
      inspectMeasuredCertificate(new Uint8Array([0x30, 0, 0]), '', 'RSA-2048', 'root')
    ).toThrow('complete DER')
  })
})

describe('Measured chain engine failure and cancellation boundary', () => {
  it('rejects an operational failure and cleans only sample-owned filenames', async () => {
    const engine = {
      execute: vi.fn().mockRejectedValue(new Error('engine unavailable')),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    }
    await expect(generateMeasuredChains(engine)).rejects.toThrow('engine unavailable')
    expect(engine.execute).toHaveBeenCalledTimes(1)
    expect(
      engine.deleteFile.mock.calls.every((call) => String(call.at(0)).startsWith('sample-chain-'))
    ).toBe(true)
  })
  it('rejects missing output rather than publishing fabricated counts', async () => {
    const engine = {
      execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '', files: [] }),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    }
    await expect(generateMeasuredChains(engine)).rejects.toThrow('expected sample artifact')
    expect(engine.execute).toHaveBeenCalledTimes(1)
  })
  it('suppresses all dependent commands when the current input lifetime ends during await', async () => {
    let resolve!: (value: OpenSSLCommandResult) => void
    const pending = new Promise<OpenSSLCommandResult>((done) => {
      resolve = done
    })
    let current = true
    const engine = {
      execute: vi.fn().mockReturnValue(pending),
      deleteFile: vi.fn().mockResolvedValue(undefined),
    }
    const run = generateMeasuredChains(engine, () => current)
    current = false
    resolve({ stdout: '', stderr: '', files: [] })
    await expect(run).rejects.toThrow('canceled')
    expect(engine.execute).toHaveBeenCalledTimes(1)
  })
})
