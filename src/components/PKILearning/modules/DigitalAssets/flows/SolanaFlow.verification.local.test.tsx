// SPDX-License-Identifier: AGPL-3.0-only
import { act, render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ed25519 } from '@noble/curves/ed25519.js'
import vectors from '@/data/acvp/eddsa_test.json'
import { SolanaFlow } from './SolanaFlow'
const control = vi.hoisted(() => ({
  live: false,
  verify: vi.fn(),
  jump: vi.fn<(step: number) => void>(),
}))
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], (b) => parseInt(b, 16))
const vector = vectors.testGroups[0].tests[0]
vi.mock('@noble/curves/ed25519.js', async (original) => {
  const actual = await original<typeof import('@noble/curves/ed25519.js')>()
  return { ...actual, ed25519: { ...actual.ed25519, verify: vi.fn(actual.ed25519.verify) } }
})
vi.mock('../hooks/useKeyGeneration', () => ({
  useKeyGeneration: () => ({
    publicKey: bytes(vector.pk),
    generateKeyPair: async () => ({ keyPair: { publicKeyHex: vector.pk } }),
  }),
}))
vi.mock('../hooks/useArtifactManagement', () => ({
  useArtifactManagement: () => ({
    getTransaction: () => bytes(vector.msg),
    getSignature: () => bytes(vector.signature),
  }),
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: control.live,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    registerKey: vi.fn(),
    addStepLog: vi.fn(),
    keys: [],
    log: [],
  }),
}))
vi.mock('@/wasm/softhsm/classical', () => ({
  hsm_generateEdDSAKeyPair: () => ({ pubHandle: 1, privHandle: 2 }),
  hsm_eddsaSign: vi.fn(),
  hsm_eddsaVerify: control.verify,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
vi.mock('../components/InfoTooltip', () => ({ InfoTooltip: () => null }))
vi.mock('../components/CryptoFlowDiagram', () => ({ SolanaFlowDiagram: () => null }))
vi.mock('../hooks/useStepWizard', () => ({
  useStepWizard: () => {
    const [currentStep, setStep] = useState(0),
      [output, setOutput] = useState<unknown>(null),
      [error, setError] = useState<string | null>(null),
      [isStepComplete, setIsStepComplete] = useState(false)
    control.jump = setStep
    return {
      currentStep,
      output,
      error,
      isStepComplete,
      setOutput,
      setError,
      setIsStepComplete,
      isExecuting: false,
      handleNext: vi.fn(),
      handleBack: vi.fn(),
      execute: async (action: () => Promise<unknown>) => {
        setError(null)
        try {
          setOutput(await action())
          setIsStepComplete(true)
        } catch (e) {
          setError(String(e))
          setIsStepComplete(false)
        }
      },
    }
  },
}))
// Jump only isolates the real flow's verification action; browser checks cover navigation.
vi.mock('../components/StepWizard', () => ({
  StepWizard: (props: {
    steps: { customControls?: React.ReactNode }[]
    currentStepIndex: number
    onExecute: () => void
    output: unknown
    error: string | null
    isStepComplete: boolean
  }) => (
    <div>
      {props.steps[props.currentStepIndex].customControls}
      <Button onClick={props.onExecute}>Execute</Button>
      <output>{JSON.stringify(props.output)}</output>
      {props.error && <p role="alert">{props.error}</p>}
      <p data-testid="completion">{String(props.isStepComplete)}</p>
    </div>
  ),
}))
beforeEach(async () => {
  vi.clearAllMocks()
  control.live = false
  const actual = await vi.importActual<typeof import('@noble/curves/ed25519.js')>(
    '@noble/curves/ed25519.js'
  )
  vi.mocked(ed25519.verify).mockImplementation(actual.ed25519.verify)
})
async function atVerification(live: boolean, altered: boolean) {
  control.live = live
  render(<SolanaFlow onBack={vi.fn()} />)
  if (live) {
    await userEvent.click(screen.getByRole('button', { name: 'Execute' }))
    await waitFor(() => expect(screen.getByTestId('completion')).toHaveTextContent('true'))
  }
  act(() => control.jump(8))
  if (altered)
    await userEvent.click(screen.getByRole('switch', { name: 'Simulate invalid signature' }))
  await userEvent.click(screen.getByRole('button', { name: 'Execute' }))
}
describe.each([false, true])('Solana selected verifier, live=%s', (live) => {
  it('accepts an actual positive verification result', async () => {
    control.verify.mockReturnValue(true)
    await atVerification(live, false)
    await waitFor(() => expect(screen.getByTestId('completion')).toHaveTextContent('true'))
    if (!live) expect(ed25519.verify).toHaveBeenCalledTimes(1)
  })
  it('calls the verifier with altered bytes and requires rejection', async () => {
    control.verify.mockReturnValue(false)
    await atVerification(live, true)
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('rejected as expected')
    )
    expect(screen.getByTestId('completion')).toHaveTextContent('true')
    const args = live ? control.verify.mock.calls[0] : vi.mocked(ed25519.verify).mock.calls[0]
    const sig = live ? args[4] : args[0]
    expect(Array.from(sig)).not.toEqual(Array.from(bytes(vector.signature)))
    if (live) expect(args[5]).toBe(true)
  })
  it('does not claim expected rejection when the verifier accepts altered bytes', async () => {
    control.verify.mockReturnValue(true)
    vi.mocked(ed25519.verify).mockReturnValue(true)
    await atVerification(live, true)
    await screen.findByRole('alert')
    expect(screen.getByRole('alert')).toHaveTextContent('accepted the altered signature')
    expect(screen.getByTestId('completion')).toHaveTextContent('false')
  })
  it('keeps verifier errors incomplete', async () => {
    control.verify.mockImplementation(() => {
      throw new Error('sample verifier unavailable')
    })
    vi.mocked(ed25519.verify).mockImplementation(() => {
      throw new Error('sample verifier unavailable')
    })
    await atVerification(live, true)
    expect(await screen.findByRole('alert')).toHaveTextContent('sample verifier unavailable')
    expect(screen.getByTestId('completion')).toHaveTextContent('false')
  })
})
