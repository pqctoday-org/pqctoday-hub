// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { StepWizard } from '../../components/StepWizard'
import { useStepWizard } from '../../hooks/useStepWizard'
import { useEthereumVerification } from './useEthereumVerification'
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

let view: ReturnType<typeof render> | null = null
afterEach(() => {
  view?.unmount()
  view = null
})
function Harness({
  inputs,
  onComplete,
}: {
  inputs: ReturnType<typeof setup>
  onComplete: () => void
}) {
  const [signature, setSignature] = useState<ReturnType<typeof setup>['state']['signature']>(null)
  const state = { ...inputs.state, signature }
  const actions = {
    ...inputs.actions,
    setSignature: (value: typeof signature) => {
      inputs.actions.setSignature(value)
      setSignature(value)
    },
  }
  const signing = useEthereumSigning({ ...inputs, state, actions })
  const verification = useEthereumVerification({
    state,
    artifacts: inputs.artifacts,
    fileRetrieval: inputs.fileRetrieval,
    filenames: { SRC_PUBLIC_KEY: 'source.pub' },
  })
  const steps = [...signing.steps, ...verification.steps]
  const wizard = useStepWizard({ steps, onBack: vi.fn() })
  return (
    <StepWizard
      steps={steps}
      currentStepIndex={wizard.currentStep}
      onExecute={() =>
        wizard.execute(() =>
          wizard.currentStep === 0 ? signing.execute('sign') : verification.execute('verify')
        )
      }
      output={wizard.output}
      isExecuting={wizard.isExecuting}
      error={wizard.error}
      isStepComplete={wizard.isStepComplete}
      onNext={wizard.handleNext}
      onBack={wizard.handleBack}
      onComplete={onComplete}
    />
  )
}
describe('Ethereum outcomes use the existing real wizard error and retry path', () => {
  it('blocks failed requested signing/verification steps and completes after valid retries', async () => {
    const inputs = setup(),
      complete = vi.fn(),
      user = userEvent.setup()
    view = render(<Harness inputs={inputs} onComplete={complete} />)
    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: '',
      stderr: '',
      error: 'Denied',
      files: [],
    })
    await user.click(screen.getByRole('button', { name: 'Sign Sample JSON Hash' }))
    await screen.findByText('OpenSSL sample signing failed: Denied')
    expect(screen.getByRole('button', { name: 'Skip to next step' })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Next Step' })).not.toBeInTheDocument()
    expect(inputs.actions.setSignature).toHaveBeenCalledExactlyOnceWith(null)
    await user.click(screen.getByRole('button', { name: 'Sign Sample JSON Hash' }))
    await screen.findByRole('button', { name: 'Next Step' })
    expect(inputs.actions.setSignature).toHaveBeenLastCalledWith(signatureFixture)
    await user.click(screen.getByRole('button', { name: 'Next Step' }))
    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: '',
      stderr: '',
      error: 'sample verification failure',
      files: [],
    })
    await user.click(screen.getByRole('button', { name: 'Verify & Recover' }))
    await screen.findByText('OpenSSL sample verification failed: sample verification failure')
    expect(screen.queryByRole('button', { name: 'Completed' })).not.toBeInTheDocument()
    expect(complete).not.toHaveBeenCalled()
    vi.mocked(openSSLService.execute).mockResolvedValueOnce({
      stdout: 'Signature Verified Successfully',
      stderr: '',
      files: [],
    })
    await user.click(screen.getByRole('button', { name: 'Verify & Recover' }))
    await user.click(await screen.findByRole('button', { name: 'Completed' }))
    expect(complete).toHaveBeenCalledTimes(1)
    expect(inputs.artifacts.resetArtifacts).not.toHaveBeenCalled()
  })
  it('does not advance on a recovered-address mismatch and leaves verification retryable', async () => {
    const inputs = setup(),
      complete = vi.fn(),
      user = userEvent.setup()
    view = render(<Harness inputs={inputs} onComplete={complete} />)
    await user.click(screen.getByRole('button', { name: 'Sign Sample JSON Hash' }))
    await user.click(await screen.findByRole('button', { name: 'Next Step' }))
    vi.mocked(extractKeyFromOpenSSLOutput).mockResolvedValue(
      secp256k1.getPublicKey(new Uint8Array(32).fill(2), false)
    )
    await user.click(screen.getByRole('button', { name: 'Verify & Recover' }))
    await screen.findByText(/does not match the expected signer/)
    expect(screen.queryByRole('button', { name: 'Completed' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verify & Recover' })).toBeEnabled()
    expect(complete).not.toHaveBeenCalled()
  })
})
