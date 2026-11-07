// SPDX-License-Identifier: AGPL-3.0-only
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { buildFirmwareUploadManifest } from './firmwareManifest'

describe('firmware whole-file binding', () => {
  it('includes a SHA-256 digest checked by an independent implementation', () => {
    const bytes = new TextEncoder().encode('sample firmware image')
    const expected = createHash('sha256').update(bytes).digest('hex')
    expect(buildFirmwareUploadManifest(bytes)).toBe(
      `file-upload:${bytes.length}:sha256:${expected}`
    )
  })
  it('invalidates a signature against the selected changed file, while retaining validity for the original manifest', async () => {
    const bytes = new Uint8Array(32).fill(7)
    const key = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, [
      'sign',
      'verify',
    ])
    const encode = (b: Uint8Array) => new TextEncoder().encode(buildFirmwareUploadManifest(b))
    const original = encode(bytes)
    const signature = await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      key.privateKey,
      original
    )
    for (const index of [0, 15, 31]) {
      const changed = bytes.slice()
      changed[index] ^= 1
      expect(
        await crypto.subtle.verify(
          { name: 'ECDSA', hash: 'SHA-256' },
          key.publicKey,
          signature,
          encode(changed)
        )
      ).toBe(false)
    }
    expect(
      await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        key.publicKey,
        signature,
        original
      )
    ).toBe(true)
  })
})
