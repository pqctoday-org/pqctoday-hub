// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { extractKeyFromOpenSSLOutput } from '@/utils/cryptoUtils'
import { useEthereumSigning } from './useEthereumSigning'
import { useEthereumVerification } from './useEthereumVerification'
import { toChecksumAddress } from './utils'
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))
vi.mock('@/utils/cryptoUtils', () => ({ extractKeyFromOpenSSLOutput: vi.fn() }))
// Existing fictional JSON-digest sample, not an Ethereum wire/KAT vector.
const privateKey = new Uint8Array(32).fill(1)
const publicKey = secp256k1.getPublicKey(privateKey, false)
const digest = hexToBytes('68f34f80140ba036bbb0ab03fe9eea0047b6afc6819e666f2c7ff6e2b408c60f')
const recovered = secp256k1.sign(digest, privateKey, { prehash: false, format: 'recovered' })
const reference = secp256k1.Signature.fromBytes(recovered, 'recovered')
const signatureFixture = { r: reference.r, s: reference.s, recovery: 37 + recovered[0] }
const n = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
const integer = (value: bigint) => {
  let hex = value.toString(16)
  if (hex.length % 2) hex = '0' + hex
  if (parseInt(hex.slice(0, 2), 16) >= 128) hex = '00' + hex
  const bytes = hexToBytes(hex)
  return new Uint8Array([2, bytes.length, ...bytes])
}
const rb = integer(reference.r),
  sb = integer(n - reference.s)
const derFixture = new Uint8Array([0x30, rb.length + sb.length, ...rb, ...sb])
function setup(): Parameters<typeof useEthereumSigning>[0] {
  return {
    keyGen: {
      privateKey,
      publicKey,
      privateKeyHex: bytesToHex(privateKey),
      publicKeyHex: bytesToHex(publicKey),
      usingFallback: false,
      generateKeyPair: vi.fn(),
      resetKeys: vi.fn(),
    },
    artifacts: {
      filenames: { hash: 'sample.hash', sig: 'sample.sig' },
      saveHash: vi.fn().mockReturnValue('sample.hash'),
      saveSignature: vi.fn().mockReturnValue('sample.sig'),
      saveTransaction: vi.fn(),
      saveArtifact: vi.fn(),
      getTimestamp: () => '20000101000000',
      registerArtifact: vi.fn(),
      resetArtifacts: vi.fn(),
      getTransaction: vi.fn(),
      getSignature: vi.fn(),
    },
    fileRetrieval: {
      prepareFilesForExecution: vi.fn().mockReturnValue([
        { name: 'source.key', data: privateKey },
        { name: 'source.pub', data: publicKey },
        { name: 'sample.hash', data: digest },
        { name: 'sample.sig', data: derFixture },
      ]),
      getFile: vi.fn(),
      getFiles: vi.fn(),
      fileExists: vi.fn(),
    },
    state: {
      rawPubKey: publicKey.slice(1),
      txHash: bytesToHex(digest),
      signature: null,
      sourceAddress: toChecksumAddress(bytesToHex(keccak_256(publicKey.slice(1)).slice(-20))),
      recipientAddress: null,
      recipientPublicKeyHex: null,
      transactionData: null,
      editableRecipientAddress: '',
    },
    actions: {
      setRawPubKey: vi.fn(),
      setTxHash: vi.fn(),
      setSignature: vi.fn(),
      setRecipientPublicKeyHex: vi.fn(),
      setSourceAddress: vi.fn(),
      setRecipientAddress: vi.fn(),
      setTransactionData: vi.fn(),
      setEditableRecipientAddress: vi.fn(),
    },
    filenames: { SRC_PRIVATE_KEY: 'source.key' },
  }
}
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(openSSLService.execute).mockResolvedValue({
    stdout: 'Signature generated',
    stderr: '',
    files: [{ name: 'ethereum_signdata_20000101000000.sig', data: derFixture }],
  })
  vi.mocked(extractKeyFromOpenSSLOutput).mockImplementation(async (_file, kind) =>
    kind === 'private' ? privateKey : publicKey
  )
})

function verifier(props = setup(), recovery = signatureFixture.recovery) {
  return renderHook(() =>
    useEthereumVerification({
      artifacts: props.artifacts,
      fileRetrieval: props.fileRetrieval,
      state: { ...props.state, signature: { ...signatureFixture, recovery } },
      filenames: { SRC_PUBLIC_KEY: 'source.pub' },
    })
  )
}
describe('Ethereum sample verification required outcomes', () => {
  it.each(['returned', 'thrown'] as const)(
    'rejects %s OpenSSL failure before recovery/extraction',
    async (kind) => {
      if (kind === 'returned')
        vi.mocked(openSSLService.execute).mockResolvedValue({
          stdout: '',
          stderr: '',
          error: 'Denied',
          files: [],
        })
      else vi.mocked(openSSLService.execute).mockRejectedValue(new Error('sample backend failure'))
      const view = verifier()
      await expect(view.result.current.execute('verify')).rejects.toThrow(
        kind === 'returned' ? 'Denied' : 'sample backend failure'
      )
      expect(extractKeyFromOpenSSLOutput).not.toHaveBeenCalled()
      view.unmount()
    }
  )
  it.each([0, 26, 29, 35, 36, 39, NaN, Infinity])(
    'rejects unsupported recovery %s instead of using0',
    async (recovery) => {
      const view = verifier(setup(), recovery)
      await expect(view.result.current.execute('verify')).rejects.toThrow(
        'outside the supported legacy/mainnet range'
      )
      expect(extractKeyFromOpenSSLOutput).not.toHaveBeenCalled()
      view.unmount()
    }
  )
  it.each(['failed', 'empty', 'different'] as const)(
    'does not use state-address fallback for %s expected public-key file',
    async (kind) => {
      if (kind === 'failed')
        vi.mocked(extractKeyFromOpenSSLOutput).mockRejectedValue(
          new Error('sample extraction failure')
        )
      else
        vi.mocked(extractKeyFromOpenSSLOutput).mockResolvedValue(
          kind === 'empty'
            ? new Uint8Array()
            : secp256k1.getPublicKey(new Uint8Array(32).fill(2), false)
        )
      const view = verifier()
      await expect(view.result.current.execute('verify')).rejects.toThrow(
        kind === 'different'
          ? 'does not match the expected signer'
          : 'Could not establish the expected signer'
      )
      view.unmount()
    }
  )
  it.each(['text', 'empty', 'legacy'] as const)(
    'preserves existing service-completion contract and matching address for %s',
    async (kind) => {
      vi.mocked(openSSLService.execute).mockResolvedValue({
        stdout: kind === 'text' ? 'Signature Verified Successfully' : '',
        stderr: '',
        files: [],
      })
      const props = setup(),
        view = verifier(
          props,
          kind === 'legacy' ? signatureFixture.recovery - 10 : signatureFixture.recovery
        )
      const output = await view.result.current.execute('verify')
      expect(output).toContain('✅ MATCH')
      expect(output).toContain(
        kind === 'text'
          ? 'Signature Verified Successfully'
          : 'command completed without a service-reported error; no text output'
      )
      expect(openSSLService.execute).toHaveBeenCalledWith(
        'openssl pkeyutl -verify -inkey source.pub -pubin -in sample.hash -sigfile sample.sig',
        props.fileRetrieval.prepareFilesForExecution(['source.pub', 'sample.hash', 'sample.sig'])
      )
      expect(output).not.toContain('transaction accepted')
      view.unmount()
    }
  )
})
