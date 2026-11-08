// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { signAndVerifySampleBinding, verifyIssuedSampleJwt } from './sampleProof'
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey } from '../types'

const key = { id: 'sample-key' } as CryptoKey
const sign = vi.fn()
const verify = vi.fn()
const provider = { signData: sign, verifySignature: verify } as unknown as CryptoProvider
beforeEach(() => {
  vi.resetAllMocks()
  sign.mockResolvedValue('signature')
  verify.mockResolvedValue(true)
})
describe('sample issuance verification gates', () => {
  it('verifies the same payload with the corresponding key', async () => {
    await signAndVerifySampleBinding(provider, key, '{"nonce":"sample","aud":"university"}')
    expect(verify).toHaveBeenCalledWith(
      key,
      'signature',
      '{"nonce":"sample","aud":"university"}',
      undefined
    )
  })
  it('does not continue after signing fails', async () => {
    sign.mockRejectedValue(new Error('signing failed'))
    await expect(signAndVerifySampleBinding(provider, key, 'payload')).rejects.toThrow(
      'signing failed'
    )
    expect(verify).not.toHaveBeenCalled()
  })
  it('rejects an invalid proof instead of claiming identity verification', async () => {
    verify.mockResolvedValue(false)
    await expect(signAndVerifySampleBinding(provider, key, 'payload')).rejects.toThrow(
      'key-binding signature verification failed'
    )
  })
  it('checks the actual signed JWT before releasing the sample credential', async () => {
    await verifyIssuedSampleJwt(provider, key, 'header.payload.signature')
    expect(verify).toHaveBeenCalledWith(key, 'signature', 'header.payload', undefined)
    verify.mockResolvedValue(false)
    await expect(verifyIssuedSampleJwt(provider, key, 'header.changed.signature')).rejects.toThrow(
      'credential signature verification failed'
    )
  })
  it.each(['header.payload', 'header.payload.', 'a.b.c.d'])(
    'rejects incomplete/malformed issuer JWT %s',
    async (jwt) => {
      await expect(verifyIssuedSampleJwt(provider, key, jwt)).rejects.toThrow('complete JWT')
      expect(verify).not.toHaveBeenCalled()
    }
  )
})
