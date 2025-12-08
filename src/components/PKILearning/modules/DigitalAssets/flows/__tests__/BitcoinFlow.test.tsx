import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BitcoinFlow } from '../BitcoinFlow'
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
    useStepWizard: vi.fn(), // We will mock implementation
  }
})

// Mock OpenSSL Service (implementation only, no import needed if not accessed)
vi.mock('../../../../../../services/crypto/OpenSSLService', () => ({
  openSSLService: {
    execute: vi.fn().mockResolvedValue({
      stdout: 'MjAyNS0xMi0wOFQxMjo0MTowOC4xMjNa', // Base64 for "2025-12-08T12:41:08.123Z" (dummy)
      stderr: '',
      error: null,
      files: [],
    }),
  },
}))

// Mock UI components to simplify DOM
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
vi.mock('../../components/CryptoFlowDiagram', () => ({ BitcoinFlowDiagram: () => null }))

describe('BitcoinFlow Integration', () => {
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

    // Mock useKeyGeneration
    ;(useKeyGeneration as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
      generateKeyPair: mockGenerateKeyPair,
      privateKey: new Uint8Array([1, 2, 3]),
      publicKeyHex: '02040506',
      privateKeyHex: '010203',
    }))

    // Mock useArtifactManagement
    ;(useArtifactManagement as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      filenames: { trans: 'tx.dat', hash: 'tx.hash', sig: 'tx.sig' },
      saveTransaction: mockSaveTransaction,
      saveHash: mockSaveHash,
      saveSignature: mockSaveSignature,
      registerArtifact: mockRegisterArtifact,
      getTimestamp: () => '20230101',
    })

    // Mock useFileRetrieval
    ;(useFileRetrieval as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      prepareFilesForExecution: mockPrepareFiles.mockReturnValue([]),
    })

    // Mock StepWizard (Stateful)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(useStepWizard as unknown as ReturnType<typeof vi.fn>).mockImplementation(({ steps }: any) => {
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
    render(<BitcoinFlow onBack={vi.fn()} />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('gen_key')
  })

  it('should complete key generation and extraction flow', async () => {
    render(<BitcoinFlow onBack={vi.fn()} />)

    // Step 1: Gen Key
    fireEvent.click(screen.getByTestId('execute-btn'))
    await waitFor(() => {
      // After execute, verify output or state change if possible
      // But our mock StepWizard doesn't update 'output' prop unless we trigger state update in parent
      // Since we use the real BitcoinFlow with mocked hooks:
      // calling execute triggers hook logic -> updates flow state
      // StepWizard re-renders with new props?
      // Our mock StepWizard just calls onExecute. It doesn't know about parent's state updates unless re-rendered.
      // React re-renders should handle this.
    })

    // Advance to next step (Public Key)
    fireEvent.click(screen.getByTestId('next-btn'))
    expect(screen.getByTestId('current-step')).toHaveTextContent('pub_key')
    // Execute Step 2
    fireEvent.click(screen.getByTestId('execute-btn'))

    // Advance to Address (Step 3) - derived from pub key
    fireEvent.click(screen.getByTestId('next-btn'))
    expect(screen.getByTestId('current-step')).toHaveTextContent('address')
    fireEvent.click(screen.getByTestId('execute-btn'))

    // Verify mocks called
    expect(mockGenerateKeyPair).toHaveBeenCalled()
  })
})
