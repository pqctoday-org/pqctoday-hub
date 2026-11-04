// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { verifySampleBatch } from './batchVerification'

const signed = { root: 'sample-root', treeSize: 4, signatureStatus: 'signed' as const }
describe('sample batch signature status', () => {
  it('does not promote an unsigned batch when an engine becomes available', async () => {
    const verify = vi.fn(() => true)
    expect(
      await verifySampleBatch('sample-root', 4, { ...signed, signatureStatus: 'unsigned' }, verify)
    ).toMatchObject({ valid: false, rootMatches: true, signatureState: 'unsigned' })
    expect(verify).not.toHaveBeenCalled()
  })
  it('requires a signature verifier even when the root matches', async () => {
    expect(await verifySampleBatch('sample-root', 4, signed)).toMatchObject({
      valid: false,
      rootMatches: true,
      signatureState: 'unavailable',
    })
  })
  it('reports valid only after successful signature verification', async () => {
    expect(await verifySampleBatch('sample-root', 4, signed, () => true)).toMatchObject({
      valid: true,
      signatureState: 'valid',
    })
    expect(await verifySampleBatch('sample-root', 4, signed, () => false)).toMatchObject({
      valid: false,
      signatureState: 'failed',
    })
  })
  it('separates an engine error from a unsuccessful signature check', async () => {
    expect(
      await verifySampleBatch('sample-root', 4, signed, () => {
        throw new Error('engine unavailable')
      })
    ).toMatchObject({ valid: false, signatureState: 'error' })
  })
  it('rejects a changed root or count before claiming any signature check', async () => {
    const verify = vi.fn(() => true)
    for (const [root, size] of [
      ['changed-root', 4],
      ['sample-root', 5],
    ] as const) {
      expect(await verifySampleBatch(root, size, signed, verify)).toMatchObject({
        valid: false,
        rootMatches: false,
        signatureState: 'not-checked',
      })
    }
    expect(verify).not.toHaveBeenCalled()
  })
})
