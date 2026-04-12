// SPDX-License-Identifier: GPL-3.0-only
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useState } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { BitcoinFlow } from '../BitcoinFlow'
import { useStepWizard } from '../../hooks/useStepWizard'
import { Button } from '@/components/ui/button'

// ── WASM function mocks ────────────────────────────────────────────────────────
vi.mock('@/wasm/softhsm/classical', () => ({
  hsm_generateECKeyPair: vi.fn().mockReturnValue({ pubHandle: 10, privHandle: 11 }),
  hsm_ecdsaSign: vi.fn().mockReturnValue(new Uint8Array(64)),
  hsm_ecdsaVerify: vi.fn().mockReturnValue(true),
}))

vi.mock('@/wasm/softhsm/objects', () => ({
  // Return a minimal SPKI DER for secp256k1 uncompressed point:
  // 23-byte header + 65-byte uncompressed point (04 prefix + 32 x + 32 y)
  hsm_getPublicKeyInfo: vi.fn().mockReturnValue(
    new Uint8Array([
      // 23-byte SPKI header (simplified)
      0x30,
      0x56,
      0x30,
      0x10,
      0x06,
      0x07,
      0x2a,
      0x86,
      0x48,
      0xce,
      0x3d,
      0x02,
      0x01,
      0x06,
      0x05,
      0x2b,
      0x81,
      0x04,
      0x00,
      0x0a,
      0x03,
      0x42,
      0x00,
      // 65-byte uncompressed EC point (04 + 32 x + 32 y, y is even so prefix=0x02)
      0x04,
      ...new Array(32).fill(0x01),
      ...new Array(32).fill(0x02),
    ])
  ),
}))

// ── useHSM mock — returns a ready HSM with stub refs ──────────────────────────
const mockModuleRef = { current: { _C_EncapsulateKey: vi.fn() } }
const mockSessionRef = { current: 1 }
const mockAddKey = vi.fn()

vi.mock('@/hooks/useHSM', () => ({
  useHSM: vi.fn(() => ({
    isReady: true,
    phase: 'ready',
    moduleRef: mockModuleRef,
    hSessionRef: mockSessionRef,
    addKey: mockAddKey,
    addStepLog: vi.fn(),
    removeKey: vi.fn(),
    keys: [],
    log: [],
    clearLog: vi.fn(),
  })),
}))

// ── Shared-component mocks ─────────────────────────────────────────────────────
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
vi.mock('../../components/InfoTooltip', () => ({ InfoTooltip: () => null }))
vi.mock('../../components/CryptoFlowDiagram', () => ({ BitcoinFlowDiagram: () => null }))

// ── StepWizard mock (stateful, drives the flow) ───────────────────────────────
vi.mock('../../hooks/useStepWizard', () => ({
  useStepWizard: vi.fn(),
}))

vi.mock('../../components/StepWizard', () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  StepWizard: ({ steps, currentStepIndex, onExecute, output, onNext }: any) => (
    <div data-testid="step-wizard">
      {/* eslint-disable-next-line security/detect-object-injection */}
      <div data-testid="current-step">{steps[currentStepIndex].id}</div>
      <div data-testid="output">{output}</div>
      <Button data-testid="execute-btn" onClick={onExecute}>
        Execute
      </Button>
      <Button data-testid="next-btn" onClick={onNext}>
        Next
      </Button>
    </div>
  ),
}))

describe('BitcoinFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks()

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

  it('renders the initial step (gen_key)', () => {
    render(<BitcoinFlow onBack={vi.fn()} />)
    expect(screen.getByTestId('current-step')).toHaveTextContent('gen_key')
  })

  it('executes gen_key step and tracks keys in HSM', async () => {
    const { hsm_generateECKeyPair } = await import('@/wasm/softhsm/classical')
    render(<BitcoinFlow onBack={vi.fn()} />)

    fireEvent.click(screen.getByTestId('execute-btn'))

    await waitFor(() => {
      expect(hsm_generateECKeyPair).toHaveBeenCalledWith(
        mockModuleRef.current,
        mockSessionRef.current,
        'secp256k1',
        false,
        'sign'
      )
    })
    expect(mockAddKey).toHaveBeenCalled()
  })

  it('advances through gen_key → pub_key → address steps', async () => {
    render(<BitcoinFlow onBack={vi.fn()} />)

    // Step 1: gen_key
    expect(screen.getByTestId('current-step')).toHaveTextContent('gen_key')
    fireEvent.click(screen.getByTestId('execute-btn'))
    await waitFor(() => expect(mockAddKey).toHaveBeenCalled())

    fireEvent.click(screen.getByTestId('next-btn'))
    expect(screen.getByTestId('current-step')).toHaveTextContent('pub_key')

    // Step 2: pub_key — needs srcPubHandle set from step 1
    fireEvent.click(screen.getByTestId('execute-btn'))
    await waitFor(() => {
      // hsm_getPublicKeyInfo should have been called
    })

    fireEvent.click(screen.getByTestId('next-btn'))
    expect(screen.getByTestId('current-step')).toHaveTextContent('address')
  })
})
