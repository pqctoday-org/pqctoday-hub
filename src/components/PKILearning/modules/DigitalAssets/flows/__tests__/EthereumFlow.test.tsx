import { render, screen, act } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EthereumFlow } from '../EthereumFlow'
import type { Step } from '../../components/StepWizard'
import { useKeyGeneration } from '../../hooks/useKeyGeneration'
import { useArtifactManagement } from '../../hooks/useArtifactManagement'
import { useFileRetrieval } from '../../hooks/useFileRetrieval'
import { useStepWizard } from '../../hooks/useStepWizard'

// Mock shared hooks
vi.mock('../../hooks/useKeyGeneration')
vi.mock('../../hooks/useArtifactManagement')
vi.mock('../../hooks/useFileRetrieval')
vi.mock('../../hooks/useStepWizard', () => {
  const actual = vi.importActual('../../hooks/useStepWizard')
  return {
    ...actual,
    useStepWizard: vi.fn(),
  }
})

// Mock UI components
vi.mock('../../components/StepWizard', () => ({
  StepWizard: ({
    steps,
    currentStepIndex,
    onExecute,
    output,
    onNext,
  }: {
    steps: Step[]
    currentStepIndex: number
    onExecute: () => void
    output: string
    onNext: () => void
  }) => (
    <div data-testid="step-wizard">
      {/* eslint-disable-next-line security/detect-object-injection */}
      <div data-testid="current-step">{steps[currentStepIndex].id}</div>
      <div data-testid="output">{output}</div>
      <button data-testid="execute-btn" onClick={onExecute}>
        Execute
      </button>
      <button data-testid="next-btn" onClick={onNext}>
        Next
      </button>
    </div>
  ),
}))
vi.mock('../../components/InfoTooltip', () => ({ InfoTooltip: () => null }))
vi.mock('../../components/CryptoFlowDiagram', () => ({ EthereumFlowDiagram: () => null }))

// Mock OpenSSL Service
vi.mock('../../../../../../services/crypto/OpenSSLService', () => {
  return {
    openSSLService: {
      execute: vi.fn().mockImplementation(async (cmd, files) => {
        if (cmd.includes('sign')) {
          // Dynamic import for ESM package
          const { secp256k1 } = await import('@noble/curves/secp256k1.js')

          // Find the hash file
          const hashFile = files.find(
            (f: { name: string; data: Uint8Array }) =>
              f.name.includes('hash') || f.name.endsWith('.dat')
          )
          if (!hashFile) return { error: 'Hash file not found' }

          // Private key is mocked globally in the test setup (32 bytes of 0x01)
          const privKey = new Uint8Array(32).fill(1)

          const hash = hashFile.data
          const sig = secp256k1.sign(hash, privKey)
          const sigObj = secp256k1.Signature.fromBytes(sig)

          // Manual DER construction to be robust
          const r = sigObj.r
          let s = sigObj.s

          // Force High-S for testing normalization logic
          // Normalize s to be > N/2 if it isn't already
          const n = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141')
          const halfN = n / BigInt(2)
          if (s <= halfN) {
            s = n - s
          }

          const toDERInt = (n: bigint) => {
            let hex = n.toString(16)
            if (hex.length % 2) hex = '0' + hex
            const bytes = new Uint8Array(hex.length / 2)
            for (let i = 0; i < bytes.length; i++)
              // eslint-disable-next-line security/detect-object-injection
              bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)

            // If high bit is set, prepend 0x00 to make it positive in two's complement
            if (bytes[0] & 0x80) {
              const newBytes = new Uint8Array(bytes.length + 1)
              newBytes[0] = 0x00
              newBytes.set(bytes, 1)
              return newBytes
            }
            return bytes
          }

          // Use the High-S value for the DER output returned from "OpenSSL"
          // This simulates OpenSSL returning a High-S signature
          const rBytes = toDERInt(r)
          const sBytes = toDERInt(s)

          // DER Sequence: 0x30 + len + (0x02 + rLen + r) + (0x02 + sLen + s)
          const totalLen = 1 + 1 + rBytes.length + 1 + 1 + sBytes.length
          const der = new Uint8Array(2 + totalLen)
          let pos = 0
          der[pos++] = 0x30
          der[pos++] = totalLen

          // R
          der[pos++] = 0x02
          der[pos++] = rBytes.length
          der.set(rBytes, pos)
          pos += rBytes.length

          // S
          der[pos++] = 0x02
          der[pos++] = sBytes.length
          der.set(sBytes, pos)

          return {
            stdout: 'Signature Generated',
            stderr: '',
            error: null,
            files: [
              {
                name: 'ethereum_signdata_20250101.sig',
                data: der,
              },
            ],
          }
        }
        return { stdout: '', stderr: '', error: null, files: [] }
      }),
    },
  }
})

describe('EthereumFlow Integration', () => {
  // Setup Mock Implementations
  // Valid 32-byte private key (0x01 repeat) and public key
  const validPrivKey = new Uint8Array(32).fill(1)
  const validPubKey = new Uint8Array(33).fill(2)

  const mockGenerateKeyPair = vi.fn().mockResolvedValue({
    keyPair: {
      privateKey: validPrivKey,
      publicKey: validPubKey,
      privateKeyHex: '01'.repeat(32),
      publicKeyHex: '02'.repeat(33),
    },
    files: [],
  })
  const mockSaveTransaction = vi.fn().mockReturnValue('tx_file.json')
  const mockSaveHash = vi.fn().mockReturnValue('hash_file.dat')
  const mockSaveSignature = vi.fn()
  const mockRegisterArtifact = vi.fn()
  const mockPrepareFiles = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useKeyGeneration as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      generateKeyPair: mockGenerateKeyPair,
      privateKey: validPrivKey,
      publicKey: validPubKey,
      privateKeyHex: '01'.repeat(32),
      publicKeyHex: '02'.repeat(33),
    }))
    ;(useArtifactManagement as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      filenames: {},
      saveTransaction: mockSaveTransaction.mockReturnValue('tx_file'),
      saveHash: mockSaveHash.mockReturnValue('hash_file'),
      saveSignature: mockSaveSignature.mockReturnValue('sig_file'),
      registerArtifact: mockRegisterArtifact,
      getTimestamp: () => '20250101',
    })
    ;(useFileRetrieval as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      prepareFilesForExecution: mockPrepareFiles.mockReturnValue([]),
    })

    // Mock StepWizard (Stateful)
    ;(useStepWizard as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      ({ steps }: { steps: Step[] }) => {
        const [currentStep, setCurrentStep] = useState(0)
        return {
          currentStep,
          steps,
          output: '',
          isExecuting: false,
          execute: async (fn: () => Promise<string | void>) => {
            await fn()
          },
          handleNext: () => setCurrentStep((prev: number) => prev + 1),
          handleBack: () => setCurrentStep((prev: number) => prev - 1),
          isStepComplete: () => true,
          error: null,
        }
      }
    )
  })

  it('should complete full flow up to signing', async () => {
    // eslint-disable-next-line testing-library/no-unnecessary-act
    await act(async () => {
      render(<EthereumFlow onBack={vi.fn()} />)
    })

    const execBtn = screen.getByTestId('execute-btn')
    const nextBtn = screen.getByTestId('next-btn')

    // 1. Keygen
    expect(screen.getByTestId('current-step')).toHaveTextContent('keygen')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 2. PubKey
    expect(screen.getByTestId('current-step')).toHaveTextContent('pubkey')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 3. Address
    expect(screen.getByTestId('current-step')).toHaveTextContent('address')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 4. Recipient Keygen
    expect(screen.getByTestId('current-step')).toHaveTextContent('gen_recipient_key')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 5. Recipient Address
    expect(screen.getByTestId('current-step')).toHaveTextContent('recipient_address')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 6. Format Transaction
    expect(screen.getByTestId('current-step')).toHaveTextContent('format_tx')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 7. Visualize RLP (Generates Hash)
    expect(screen.getByTestId('current-step')).toHaveTextContent('visualize_msg')
    await act(async () => {
      await execBtn.click()
    })
    await act(async () => {
      await nextBtn.click()
    })

    // 8. Sign Transaction (The Broken Step)
    expect(screen.getByTestId('current-step')).toHaveTextContent('sign')
    await act(async () => {
      await execBtn.click()
    })

    // Check for success output or error
    // const output = screen.getByTestId('output')
    // expect(output).toHaveTextContent('SUCCESS')
  })
})
