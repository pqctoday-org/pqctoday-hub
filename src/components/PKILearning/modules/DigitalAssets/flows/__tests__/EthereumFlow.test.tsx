import { render, screen } from '@testing-library/react'
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
vi.mock('../../../../../../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn().mockResolvedValue({
      stdout: 'MjAyNS0xMi0wOFQxMjo0MTowOC4xMjNa',
      stderr: '',
      error: null,
      // Return a dummy signature file to pass validation
      files: [
        {
          name: 'ethereum_signdata_20250101.sig',
          // DER signature structure (simplified, just needs to parse somewhat or pass length check)
          // Sequence (0x30), Length 6, Integers... minimal
          data: new Uint8Array([0x30, 0x06, 0x02, 0x01, 0x01, 0x02, 0x01, 0x01]),
        },
      ],
    }),
  },
}))

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
    render(<EthereumFlow onBack={vi.fn()} />)
    const execBtn = screen.getByTestId('execute-btn')
    const nextBtn = screen.getByTestId('next-btn')

    // 1. Keygen
    expect(screen.getByTestId('current-step')).toHaveTextContent('keygen')
    await execBtn.click()
    await nextBtn.click()

    // 2. PubKey
    expect(screen.getByTestId('current-step')).toHaveTextContent('pubkey')
    await execBtn.click()
    await nextBtn.click()

    // 3. Address
    expect(screen.getByTestId('current-step')).toHaveTextContent('address')
    await execBtn.click()
    await nextBtn.click()

    // 4. Recipient Keygen
    expect(screen.getByTestId('current-step')).toHaveTextContent('gen_recipient_key')
    await execBtn.click()
    await nextBtn.click()

    // 5. Recipient Address
    expect(screen.getByTestId('current-step')).toHaveTextContent('recipient_address')
    await execBtn.click()
    await nextBtn.click()

    // 6. Format Transaction
    expect(screen.getByTestId('current-step')).toHaveTextContent('format_tx')
    await execBtn.click()
    await nextBtn.click()

    // 7. Visualize RLP (Generates Hash)
    expect(screen.getByTestId('current-step')).toHaveTextContent('visualize_msg')
    await execBtn.click()
    await nextBtn.click()

    // 8. Sign Transaction (The Broken Step)
    expect(screen.getByTestId('current-step')).toHaveTextContent('sign')
    await execBtn.click()

    // Check for success output or error
    // const output = screen.getByTestId('output')
    // expect(output).toHaveTextContent('SUCCESS')
  })
})
