// SPDX-License-Identifier: AGPL-3.0-only
import { createHash, generateKeyPairSync, webcrypto } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSDJWT, createPresentation } from './sdjwt-utils'
import { sampleHolderMatchesIssuer, verifySampleSdPresentation } from './samplePresentation'
import type { CryptoProvider } from './crypto-provider'
import type { CryptoKey } from '../types'

// Controlled verification outcomes below use a valid sample public-key encoding.
const pair = generateKeyPairSync('ec', { namedCurve: 'P-256' })
const key = {
  id: 'holder',
  publicKey: btoa(pair.publicKey.export({ type: 'spki', format: 'pem' }).toString()),
  algorithm: 'ES256',
  curve: 'P-256',
  usage: 'SIGN',
} as CryptoKey
const hash = (s: string | Uint8Array) => createHash('sha256').update(s).digest('base64url')
const provider = {
  signData: vi.fn(async () => 'sample-signature'),
  verifySignature: vi.fn(async () => true),
  sha256Hash: vi.fn(async (s: string | Uint8Array) => hash(s)),
} as unknown as CryptoProvider
const expected = { nonce: 'sample-nonce', audience: 'https://bank.example.com' }
async function sample() {
  const credential = await createSDJWT(
    [{ name: 'degree', value: 'sample degree', type: 'sd' }],
    key,
    key,
    provider,
    'https://issuer.example',
    'sample'
  )
  const presentation = await createPresentation(
    credential,
    ['degree'],
    key,
    expected.audience,
    expected.nonce,
    provider
  )
  return { credential, presentation, context: { ...expected, issuerJwt: credential.issuerJwt } }
}
const replacePayload = (presentation: string, change: Record<string, unknown>) => {
  const index = presentation.lastIndexOf('~')
  const parts = presentation.slice(index + 1).split('.')
  const payload = { ...JSON.parse(Buffer.from(parts[1], 'base64url').toString()), ...change }
  return `${presentation.slice(0, index + 1)}${parts[0]}.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.${parts[2]}`
}
afterEach(() => vi.unstubAllGlobals())
beforeEach(() => {
  vi.stubGlobal('crypto', webcrypto)
  vi.clearAllMocks()
  vi.mocked(provider.verifySignature).mockResolvedValue(true)
})
describe('sample relying-party presentation checks', () => {
  it('checks the sample holder signature, key confirmation and actual disclosure hashes', async () => {
    const { presentation, context } = await sample()
    await expect(
      verifySampleSdPresentation(presentation, context, key, provider)
    ).resolves.toBeUndefined()
    expect(provider.verifySignature).toHaveBeenCalled()
    expect(sampleHolderMatchesIssuer(key, context.issuerJwt)).toBe(true)
    expect(sampleHolderMatchesIssuer({ ...key, publicKey: 'other key' }, context.issuerJwt)).toBe(
      false
    )
  })
  it('rejects failed signature verification', async () => {
    const { presentation, context } = await sample()
    vi.mocked(provider.verifySignature).mockResolvedValue(false)
    await expect(verifySampleSdPresentation(presentation, context, key, provider)).rejects.toThrow(
      /signature check did not pass/
    )
  })
  it.each([{ nonce: 'wrong' }, { aud: 'https://other.example' }, { sd_hash: 'wrong' }])(
    'rejects a changed binding field: %j',
    async (change) => {
      const { presentation, context } = await sample()
      await expect(
        verifySampleSdPresentation(replacePayload(presentation, change), context, key, provider)
      ).rejects.toThrow()
    }
  )
  it('rejects an altered disclosure even when signature verification is stubbed successful', async () => {
    const { presentation, context } = await sample()
    const parts = presentation.split('~')
    parts[1] = Buffer.from(JSON.stringify(['salt', 'degree', 'altered degree'])).toString(
      'base64url'
    )
    await expect(
      verifySampleSdPresentation(parts.join('~'), context, key, provider)
    ).rejects.toThrow(/disclosure digest/)
  })
  it('rejects duplicate disclosures and a different holder key', async () => {
    const { presentation, context } = await sample()
    const parts = presentation.split('~')
    parts.splice(1, 0, parts[1])
    await expect(
      verifySampleSdPresentation(parts.join('~'), context, key, provider)
    ).rejects.toThrow(/duplicate/)
    await expect(
      verifySampleSdPresentation(
        presentation,
        context,
        { ...key, publicKey: 'wrong key' },
        provider
      )
    ).rejects.toThrow(/key does not match/)
  })
  it('rejects malformed input and propagates an operational verification error', async () => {
    const { presentation, context } = await sample()
    await expect(verifySampleSdPresentation('malformed', context, key, provider)).rejects.toThrow(
      /Missing/
    )
    vi.mocked(provider.verifySignature).mockRejectedValue(new Error('engine unavailable'))
    await expect(verifySampleSdPresentation(presentation, context, key, provider)).rejects.toThrow(
      'engine unavailable'
    )
  })
})
