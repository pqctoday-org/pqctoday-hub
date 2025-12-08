import { render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SolanaFlow } from '../SolanaFlow'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StepWizard: ({ steps, currentStepIndex, onExecute, output, onNext }: any) => (
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
vi.mock('../../components/CryptoFlowDiagram', () => ({ SolanaFlowDiagram: () => null }))

// Mock OpenSSL Service
vi.mock('../../../../../../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn().mockResolvedValue({
      stdout: 'MjAyNS0xMi0wOFQxMjo0MTowOC4xMjNa',
      stderr: '',
      error: null,
      files: [],
    }),
  },
}))

describe('SolanaFlow Integration', () => {
  // Setup Mock Implementations
  const mockGenerateKeyPair = vi.fn().mockResolvedValue({
    keyPair: {
      privateKey: new Uint8Array([1, 2, 3]),
      publicKey: new Uint8Array([4, 5, 6]),
      privateKeyHex: '010203',
      publicKeyHex: '02040506',
    },
    files: [],
  })
  const mockSaveTransaction = vi.fn()
  const mockSaveHash = vi.fn()
  const mockSaveSignature = vi.fn()
  const mockRegisterArtifact = vi.fn()
  const mockPrepareFiles = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useKeyGeneration as any).mockImplementation(() => ({
      generateKeyPair: mockGenerateKeyPair,
      privateKey: new Uint8Array([1, 2, 3]),
      publicKey: new Uint8Array([4, 5, 6]),
      privateKeyHex: '010203',
      publicKeyHex: '02040506',
    }))

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useArtifactManagement as any).mockReturnValue({
      filenames: {},
      saveTransaction: mockSaveTransaction.mockReturnValue('tx_file'),
      saveHash: mockSaveHash.mockReturnValue('hash_file'),
      saveSignature: mockSaveSignature.mockReturnValue('sig_file'),
      registerArtifact: mockRegisterArtifact,
      getTimestamp: () => '20250101',
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useFileRetrieval as any).mockReturnValue({
      prepareFilesForExecution: mockPrepareFiles.mockReturnValue([]),
    })

    // Mock StepWizard (Stateful)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useStepWizard as any).mockImplementation(({ steps }: any) => {
      const [currentStep, setCurrentStep] = useState(0)
      return {
        currentStep,
        steps,
        output: '',
        isExecuting: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: async (fn: any) => {
          await fn()
        },
        handleNext: () => setCurrentStep((prev: number) => prev + 1),
        handleBack: () => setCurrentStep((prev: number) => prev - 1),
        isStepComplete: () => true,
        error: null,
      }
    })
  })

  it('should render initial step', () => {
    render(<SolanaFlow onBack={vi.fn()} />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('keygen')
  })
})
