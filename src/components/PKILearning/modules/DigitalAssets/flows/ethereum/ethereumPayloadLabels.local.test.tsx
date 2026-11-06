// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { secp256k1 } from '@noble/curves/secp256k1.js'
import { bytesToHex, hexToBytes } from '@noble/hashes/utils.js'
import { keccak_256 } from '@noble/hashes/sha3.js'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import { extractKeyFromOpenSSLOutput } from '@/utils/cryptoUtils'
import { useEthereumTransaction } from './useEthereumTransaction'
import { useEthereumSigning } from './useEthereumSigning'
import { useEthereumVerification } from './useEthereumVerification'
import { useEthereumKeyGeneration } from './useEthereumKeyGeneration'
import { toChecksumAddress } from './utils'
import type { EthereumFlowState, EthereumFlowActions } from './types'

vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))
vi.mock('@/utils/cryptoUtils', () => ({ extractKeyFromOpenSSLOutput: vi.fn() }))
const privateKey = new Uint8Array(32).fill(1) // Public, fictional test-only sample.
const publicKey = secp256k1.getPublicKey(privateKey, false)
const sourceAddress = toChecksumAddress(bytesToHex(keccak_256(publicKey.slice(1)).slice(-20)))
const payload =
  '{"nonce":0,"gasPrice":"20000000000","gasLimit":21000,"to":"0x1111111111111111111111111111111111111111","value":"100000000000000000","data":"","v":1,"r":0,"s":0}'
const digestHex = '68f34f80140ba036bbb0ab03fe9eea0047b6afc6819e666f2c7ff6e2b408c60f'
const digest = hexToBytes(digestHex)
const reference = secp256k1.Signature.fromBytes(
  secp256k1.sign(digest, privateKey, { prehash: false })
)
const curveOrder = 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n
function der(r: bigint, s: bigint) {
  const integer = (value: bigint) => {
    let hex = value.toString(16)
    if (hex.length % 2) hex = '0' + hex
    if (parseInt(hex.slice(0, 2), 16) >= 128) hex = '00' + hex
    const bytes = hexToBytes(hex)
    return new Uint8Array([2, bytes.length, ...bytes])
  }
  const rBytes = integer(r),
    sBytes = integer(s)
  return new Uint8Array([0x30, rBytes.length + sBytes.length, ...rBytes, ...sBytes])
}
const derFixture = der(reference.r, curveOrder - reference.s) // Exercise existing low-S normalization.
const actions = (): EthereumFlowActions => ({
  setRawPubKey: vi.fn(),
  setTxHash: vi.fn(),
  setSignature: vi.fn(),
  setRecipientPublicKeyHex: vi.fn(),
  setSourceAddress: vi.fn(),
  setRecipientAddress: vi.fn(),
  setTransactionData: vi.fn(),
  setEditableRecipientAddress: vi.fn(),
})
const state = (): EthereumFlowState => ({
  rawPubKey: publicKey.slice(1),
  txHash: digestHex,
  signature: null,
  recipientPublicKeyHex: null,
  sourceAddress,
  recipientAddress: '0x1111111111111111111111111111111111111111',
  editableRecipientAddress: '0x1111111111111111111111111111111111111111',
  transactionData: {
    nonce: 0,
    gasPrice: '20000000000',
    gasLimit: 21000,
    to: '0x1111111111111111111111111111111111111111',
    value: '100000000000000000',
    data: '',
    chainId: 1,
  },
})
const artifacts = () => ({
  filenames: { hash: 'sample.hash', sig: 'sample.sig' },
  saveTransaction: vi.fn().mockReturnValue('sample-json.dat'),
  saveHash: vi.fn().mockReturnValue('sample.hash'),
  saveSignature: vi.fn().mockReturnValue('sample.sig'),
  registerArtifact: vi.fn(),
  getTimestamp: () => '20000101000000',
  saveArtifact: vi.fn(),
  resetArtifacts: vi.fn(),
  getTransaction: vi.fn().mockReturnValue(null),
  getSignature: vi.fn().mockReturnValue(null),
})
const keyGen = () => ({
  privateKey,
  publicKey,
  privateKeyHex: bytesToHex(privateKey),
  publicKeyHex: bytesToHex(publicKey),
  usingFallback: false,
  generateKeyPair: vi.fn(),
  resetKeys: vi.fn(),
})
const files = () => ({
  prepareFilesForExecution: vi.fn().mockReturnValue([
    { name: 'source.key', data: privateKey },
    { name: 'source.pub.pem', data: publicKey },
  ]),
  getFile: vi.fn(),
  getFiles: vi.fn(),
  fileExists: vi.fn(),
})
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(openSSLService.execute).mockResolvedValue({
    stdout: '',
    stderr: '',
    files: [
      {
        name: 'ethereum_signdata_20000101000000.sig',
        data: derFixture,
      },
    ],
  })
  vi.mocked(extractKeyFromOpenSSLOutput).mockImplementation(async (_filename, kind) =>
    kind === 'private' ? privateKey : publicKey
  )
})
async function signFixture(failure = false) {
  if (failure)
    vi.mocked(openSSLService.execute).mockResolvedValue({
      stdout: '',
      stderr: 'sample failure',
      error: 'sample error',
      files: [],
    })
  const a = actions(),
    f = artifacts()
  const { result: viewResult } = renderHook(() =>
    useEthereumSigning({
      keyGen: keyGen(),
      artifacts: f,
      fileRetrieval: files(),
      actions: a,
      state: state(),
      filenames: { SRC_PRIVATE_KEY: 'source.key' },
    })
  )
  const output = await viewResult.current.execute('sign')
  const signature = vi.mocked(a.setSignature).mock.calls.at(-1)![0]!
  return { output, signature, artifacts: f }
}

describe('Ethereum sample payload and signature representations', () => {
  it('saves the original JSON UTF-8 bytes and golden digest while truthfully naming the sample artifact', async () => {
    const a = actions(),
      f = artifacts(),
      s = state()
    const { result: viewResult } = renderHook(() =>
      useEthereumTransaction({ state: s, actions: a, artifacts: f })
    )
    await viewResult.current.execute('format_tx')
    expect(a.setTransactionData).toHaveBeenCalledWith(s.transactionData)
    const output = await viewResult.current.execute('visualize_msg')
    const actual = f.saveTransaction.mock.calls[0]![1] as Uint8Array
    expect(new TextDecoder('utf-8', { fatal: true }).decode(actual)).toBe(payload)
    expect(JSON.parse(new TextDecoder().decode(actual))).toEqual({
      nonce: 0,
      gasPrice: '20000000000',
      gasLimit: 21000,
      to: '0x1111111111111111111111111111111111111111',
      value: '100000000000000000',
      data: '',
      v: 1,
      r: 0,
      s: 0,
    })
    expect(f.saveHash).toHaveBeenCalledWith('ethereum', digest)
    expect(a.setTxHash).toHaveBeenCalledWith(digestHex)
    expect(output).toContain('Sample JSON structure')
    expect(output).toContain('JSON UTF-8 payload: sample-json.dat')
    expect(output).toContain('no Ethereum wire transaction is encoded')
    expect(output).not.toContain('RLP Encoded Structure')
    expect(openSSLService.execute).not.toHaveBeenCalled()
  })

  it('keeps DER saved bytes distinct from unchanged normalized r/s/v display and software status', async () => {
    const result = await signFixture()
    expect(result.artifacts.saveSignature).toHaveBeenCalledWith('ethereum', derFixture)
    expect(result.signature.r).toBe(reference.r)
    expect(result.signature.s).toBe(reference.s)
    const raw =
      result.signature.r.toString(16).padStart(64, '0') +
      result.signature.s.toString(16).padStart(64, '0') +
      result.signature.recovery.toString(16)
    expect(result.output).toContain('0x' + raw)
    expect(raw).not.toBe(bytesToHex(derFixture))
    expect(result.output).toContain(
      'Raw r || s || v hex display — not an encoded Ethereum transaction'
    )
    expect(result.output).toContain(
      'Parsed OpenSSL values used; JavaScript reference also computed'
    )
    expect(result.output).toContain('Matching address candidate found')
    expect(result.output).toContain(
      'Registered signature target: ethereum_signdata_20000101000000.sig'
    )
    expect(result.output).not.toContain('Full RLP Signature Component')
  })

  it('rejects a failed OpenSSL attempt instead of publishing JS fallback values', async () => {
    await expect(signFixture(true)).rejects.toThrow('OpenSSL sample signing failed: sample error')
  })

  it('rejects missing file-derived recovery instead of using a recovery-zero default', async () => {
    vi.mocked(extractKeyFromOpenSSLOutput).mockRejectedValue(
      new Error('sample extraction unavailable')
    )
    await expect(signFixture()).rejects.toThrow(
      'Could not establish the signer from the private key file'
    )
  })

  it.each(['stdout', 'error', 'empty'] as const)(
    'keeps %s verification response separate from address comparison',
    async (kind) => {
      const signed = await signFixture()
      vi.mocked(openSSLService.execute).mockResolvedValue({
        stdout: kind === 'stdout' ? 'Sample verifier response' : '',
        stderr: '',
        files: [],
        ...(kind === 'error' ? { error: 'sample verify error' } : {}),
      })
      const s = { ...state(), signature: signed.signature }
      const { result: viewResult } = renderHook(() =>
        useEthereumVerification({
          state: s,
          artifacts: artifacts(),
          fileRetrieval: files(),
          filenames: { SRC_PUBLIC_KEY: 'source.pub.pem' },
        })
      )
      if (kind === 'error') {
        await expect(viewResult.current.execute('verify')).rejects.toThrow(
          'OpenSSL sample verification failed: sample verify error'
        )
        return
      }
      const output = await viewResult.current.execute('verify')
      expect(output).toContain('Sample verification outputs (independent checks)')
      expect(output).toContain('Software sample address comparison')
      expect(output).toContain('✅ MATCH')
      expect(output).toContain(
        kind === 'stdout'
          ? 'Sample verifier response'
          : 'OpenSSL verification command completed without a service-reported error; no text output.'
      )
      expect(output).not.toContain('Signature verified successfully using OpenSSL')
    }
  )

  it('retains address mismatch without upgrading an independent software response into Ethereum validity', async () => {
    const signed = await signFixture()
    vi.mocked(extractKeyFromOpenSSLOutput).mockResolvedValue(
      secp256k1.getPublicKey(new Uint8Array(32).fill(2), false)
    )
    vi.mocked(openSSLService.execute).mockResolvedValue({
      stdout: 'Independent software response',
      stderr: '',
      files: [],
    })
    const { result: viewResult } = renderHook(() =>
      useEthereumVerification({
        state: { ...state(), signature: signed.signature },
        artifacts: artifacts(),
        fileRetrieval: files(),
        filenames: { SRC_PUBLIC_KEY: 'source.pub.pem' },
      })
    )
    await expect(viewResult.current.execute('verify')).rejects.toThrow(
      'does not match the expected signer'
    )
  })

  it('uses software code-preview labels in keygen/sign/verify rather than HSM snippets', () => {
    const key = keyGen()
    const { result: generation } = renderHook(() =>
      useEthereumKeyGeneration({
        keyGen: key,
        recipientKeyGen: key,
        fileRetrieval: files(),
        actions: actions(),
        filenames: {
          SRC_PRIVATE_KEY: 'source.key',
          SRC_PUBLIC_KEY: 'source.pub.pem',
          DST_PRIVATE_KEY: 'target.key',
          DST_PUBLIC_KEY: 'target.pub.pem',
        },
      })
    )
    const { result: signing } = renderHook(() =>
      useEthereumSigning({
        keyGen: key,
        artifacts: artifacts(),
        fileRetrieval: files(),
        actions: actions(),
        state: state(),
        filenames: { SRC_PRIVATE_KEY: 'source.key' },
      })
    )
    const { result: verification } = renderHook(() =>
      useEthereumVerification({
        artifacts: artifacts(),
        fileRetrieval: files(),
        state: state(),
        filenames: { SRC_PUBLIC_KEY: 'source.pub.pem' },
      })
    )
    const previews = [
      ...generation.current.steps,
      ...signing.current.steps,
      ...verification.current.steps,
    ]
      .map((step) => step.code)
      .join('\n')
    expect(previews).not.toMatch(/hsm_(generateECKeyPair|getAttribute|ecdsaSign|ecdsaVerify)/)
    expect(previews).toContain('openSSLService.execute')
    expect(generation.current.steps[1]!.title).toContain('Software-derived')
  })
})
