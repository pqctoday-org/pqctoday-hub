// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { extractKeyFromOpenSSLOutput } from '@/utils/cryptoUtils'
import { useEthereumSigning } from './useEthereumSigning'
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

describe('Ethereum sample signing required outcomes', () => {
  it.each(['Denied', 'FAILURE', 'sample error'])(
    'rejects every returned backend error %s without fallback completion',
    async (error) => {
      vi.mocked(openSSLService.execute).mockResolvedValue({
        stdout: '',
        stderr: '',
        error,
        files: [],
      })
      const props = setup(),
        view = renderHook(() => useEthereumSigning(props))
      await expect(view.result.current.execute('sign')).rejects.toThrow(
        'OpenSSL sample signing failed: ' + error
      )
      expect(props.actions.setSignature).toHaveBeenCalledExactlyOnceWith(null)
      expect(extractKeyFromOpenSSLOutput).not.toHaveBeenCalled()
      expect(props.artifacts.saveSignature).not.toHaveBeenCalled()
      view.unmount()
    }
  )
  it('rejects a thrown backend failure and leaves only a cleared current signature', async () => {
    vi.mocked(openSSLService.execute).mockRejectedValue(new Error('sample operation unavailable'))
    const props = setup(),
      view = renderHook(() => useEthereumSigning(props))
    await expect(view.result.current.execute('sign')).rejects.toThrow(
      'sample operation unavailable'
    )
    expect(props.actions.setSignature).toHaveBeenCalledExactlyOnceWith(null)
    view.unmount()
  })
  it.each([
    { name: 'missing', files: [], detail: 'Generated signature file is empty' },
    {
      name: 'empty',
      files: [{ name: 'ethereum_signdata_20000101000000.sig', data: new Uint8Array() }],
      detail: 'Generated signature file is empty',
    },
    {
      name: 'malformed DER',
      files: [{ name: 'ethereum_signdata_20000101000000.sig', data: new Uint8Array([1, 2]) }],
      detail: 'Invalid DER Header',
    },
  ])('rejects $name required signature output', async ({ files, detail }) => {
    vi.mocked(openSSLService.execute).mockResolvedValue({ stdout: '', stderr: '', files })
    const props = setup(),
      view = renderHook(() => useEthereumSigning(props))
    await expect(view.result.current.execute('sign')).rejects.toThrow(
      'OpenSSL sample signing failed: ' + detail
    )
    expect(props.actions.setSignature).toHaveBeenCalledExactlyOnceWith(null)
    view.unmount()
  })
  it.each(['failed', 'empty', 'different'] as const)(
    'does not invent recovery0 for %s file-derived signer',
    async (kind) => {
      if (kind === 'failed')
        vi.mocked(extractKeyFromOpenSSLOutput).mockRejectedValue(
          new Error('sample extraction failure')
        )
      else
        vi.mocked(extractKeyFromOpenSSLOutput).mockResolvedValue(
          kind === 'empty' ? new Uint8Array() : new Uint8Array(32).fill(2)
        )
      const props = setup(),
        view = renderHook(() => useEthereumSigning(props))
      await expect(view.result.current.execute('sign')).rejects.toThrow(
        kind === 'different' ? 'No recovery candidate matched' : 'Could not establish the signer'
      )
      expect(props.actions.setSignature).toHaveBeenCalledExactlyOnceWith(null)
      view.unmount()
    }
  )
  it.each(['private key', 'hash', 'filename'] as const)(
    'clears an old current signature before a missing %s prerequisite',
    async (missing) => {
      const props = setup()
      props.state.signature = signatureFixture
      if (missing === 'private key') props.keyGen.privateKeyHex = null
      else if (missing === 'hash') props.state.txHash = null
      else props.filenames.SRC_PRIVATE_KEY = ''
      const view = renderHook(() => useEthereumSigning(props))
      await expect(view.result.current.execute('sign')).rejects.toThrow()
      expect(props.actions.setSignature).toHaveBeenCalledExactlyOnceWith(null)
      expect(openSSLService.execute).not.toHaveBeenCalled()
      expect(props.artifacts.resetArtifacts).not.toHaveBeenCalled()
      view.unmount()
    }
  )
  it('preserves successful command/DER/hash bytes and normalized signature after matched recovery', async () => {
    const props = setup(),
      view = renderHook(() => useEthereumSigning(props))
    const output = await view.result.current.execute('sign')
    expect(openSSLService.execute).toHaveBeenCalledWith(
      'openssl pkeyutl -sign -inkey source.key -in sample.hash -out ethereum_signdata_20000101000000.sig',
      expect.arrayContaining([{ name: 'sample.hash', data: digest }])
    )
    expect(props.artifacts.saveHash).toHaveBeenCalledWith('ethereum', digest)
    expect(props.artifacts.saveSignature).toHaveBeenCalledWith('ethereum', derFixture)
    expect(props.actions.setSignature).toHaveBeenNthCalledWith(1, null)
    expect(props.actions.setSignature).toHaveBeenLastCalledWith(signatureFixture)
    expect(output).toContain('Parsed OpenSSL values used; JavaScript reference also computed')
    expect(output).toContain('Matching address candidate found')
    expect(output).not.toContain('fallback values')
    view.unmount()
  })
})
