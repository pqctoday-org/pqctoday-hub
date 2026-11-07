// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { Step } from '../../components/StepWizard'
import { useHSMMode } from '@/store/useHSMMode'

const fixtures = vi.hoisted(() => ({
  phase: 'idle',
  keys: [] as Array<{ handle: number }>,
  init: vi.fn(),
  finalize: vi.fn(),
  engine: vi.fn(),
  clear: vi.fn(),
  keygenHook: vi.fn(),
  txHook: vi.fn(),
  signHook: vi.fn(),
  verifyHook: vi.fn(),
  keygen: vi.fn(),
  tx: vi.fn(),
  sign: vi.fn(),
  verify: vi.fn(),
}))
vi.mock('@/hooks/useHSM', async () => {
  const { useState } = await import('react')
  return {
    useHSM: function useSampleSession() {
      const [phase, setPhase] = useState(fixtures.phase)
      const [engine, setEngine] = useState('rust')
      const [log, setLog] = useState([
        {
          id: 1,
          timestamp: '00:00',
          fn: 'C_Initialize',
          args: '',
          rvHex: '0x00000000',
          rvName: 'CKR_OK',
          ok: true,
          ms: 0,
        },
      ])
      return {
        phase,
        isReady: phase === 'session_open',
        engine,
        error: phase === 'error' ? 'Sample setup error' : null,
        initialize: async () => {
          fixtures.init(engine)
          setPhase('session_open')
        },
        finalize: () => {
          fixtures.finalize()
          setPhase('idle')
        },
        setEngine: (value: string) => {
          fixtures.engine(value)
          setEngine(value)
        },
        log,
        clearLog: () => {
          fixtures.clear()
          setLog([])
        },
        keys: fixtures.keys,
        moduleRef: { current: null },
        hSessionRef: { current: 0 },
        removeKey: vi.fn(),
      }
    },
  }
})
vi.mock('../../hooks/useKeyGeneration', () => ({
  useKeyGeneration: () => ({ softwareKey: 'sample-only' }),
}))
vi.mock('../../hooks/useArtifactManagement', () => ({
  useArtifactManagement: () => ({ filenames: {} }),
}))
vi.mock('../../hooks/useFileRetrieval', () => ({ useFileRetrieval: () => ({}) }))
vi.mock('./useEthereumKeyGeneration', () => ({
  useEthereumKeyGeneration: (args: unknown) => fixtures.keygenHook(args),
}))
vi.mock('./useEthereumTransaction', () => ({
  useEthereumTransaction: (args: unknown) => fixtures.txHook(args),
}))
vi.mock('./useEthereumSigning', () => ({
  useEthereumSigning: (args: unknown) => fixtures.signHook(args),
}))
vi.mock('./useEthereumVerification', () => ({
  useEthereumVerification: (args: unknown) => fixtures.verifyHook(args),
}))
vi.mock('@/components/shared/HsmKeyInspector', () => ({
  HsmKeyInspector: ({ keys }: { keys: Array<{ handle: number }> }) => (
    <p data-testid="hsm-key-inspector" data-hsm-key-count={keys.length}>
      Separate session registry fixture
    </p>
  ),
}))
import { EthereumFlow } from '../EthereumFlow'

const step = (id: string): Step => ({
  id,
  title: `${id} sample activity`,
  description: 'Software fixture',
  code: '// Fixture only',
  language: 'javascript',
  actionLabel: 'Run software fixture',
})
beforeEach(() => {
  vi.clearAllMocks()
  fixtures.phase = 'idle'
  fixtures.keys = []
  useHSMMode.setState({ liveHsmEnabled: false })
  fixtures.keygenHook.mockReturnValue({
    steps: [step('keygen')],
    execute: fixtures.keygen.mockResolvedValue('Software keygen fixture'),
  })
  fixtures.txHook.mockReturnValue({
    steps: [step('format_tx')],
    execute: fixtures.tx.mockResolvedValue('Software JSON fixture'),
  })
  fixtures.signHook.mockReturnValue({
    steps: [step('sign')],
    execute: fixtures.sign.mockResolvedValue('Software signing fixture'),
  })
  fixtures.verifyHook.mockReturnValue({
    steps: [step('verify')],
    execute: fixtures.verify.mockResolvedValue('Independent check output'),
  })
})

describe('Ethereum software steps and optional HSM session have separate attribution', () => {
  it('keeps explicit Enable/engine/Disable controls without routing Ethereum software steps into the session', async () => {
    const back = vi.fn()
    render(<EthereumFlow onBack={back} />)
    expect(screen.getByLabelText('Ethereum sample execution scope')).toHaveTextContent(
      'does not move these keys or signing/verification operations into that session'
    )
    expect(fixtures.init).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('radio', { name: 'C++' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enable' }))
    await screen.findByText('Live HSM Mode Active')
    expect(fixtures.init).toHaveBeenCalledExactlyOnceWith('cpp')
    expect(screen.getByLabelText('Separate HSM session keys')).toHaveTextContent(
      'not the Ethereum software key files'
    )
    for (const hook of [
      fixtures.keygenHook,
      fixtures.txHook,
      fixtures.signHook,
      fixtures.verifyHook,
    ]) {
      const args = hook.mock.calls[0]![0]
      expect(args).not.toHaveProperty('hsm')
      expect(args).not.toHaveProperty('moduleRef')
      expect(args).not.toHaveProperty('hSessionRef')
    }
    fireEvent.click(screen.getByRole('button', { name: 'Run software fixture' }))
    await screen.findByRole('button', { name: 'Next Step' })
    expect(fixtures.keygen).toHaveBeenCalledExactlyOnceWith('keygen')
    fireEvent.click(screen.getByRole('button', { name: 'Disable' }))
    await screen.findByRole('button', { name: 'Enable' })
    expect(fixtures.finalize).toHaveBeenCalledOnce()
    expect(fixtures.init).toHaveBeenCalledOnce()
    expect(back).not.toHaveBeenCalled()
  })

  it('keeps enabled-default session initialization separate from any software activity', async () => {
    useHSMMode.setState({ liveHsmEnabled: true })
    render(<EthereumFlow onBack={vi.fn()} />)
    await screen.findByText('Live HSM Mode Active')
    expect(fixtures.init).toHaveBeenCalledExactlyOnceWith('rust')
    for (const execute of [fixtures.keygen, fixtures.tx, fixtures.sign, fixtures.verify]) {
      expect(execute).not.toHaveBeenCalled()
    }
    expect(screen.getByLabelText('Ethereum sample execution scope')).toHaveTextContent(
      'Software JSON-signing demonstration'
    )
  })

  it('shows genuine setup entries rather than promising C_Sign calls; clear acts only on the session trace', async () => {
    fixtures.phase = 'session_open'
    render(<EthereumFlow onBack={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Separate HSM session trace/ }))
    expect(screen.getByText('C_Initialize')).toBeInTheDocument()
    expect(screen.queryByText('C_Sign', { exact: true })).not.toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Clear log'))
    expect(fixtures.clear).toHaveBeenCalledOnce()
    expect(fixtures.keygen).not.toHaveBeenCalled()
    expect(fixtures.sign).not.toHaveBeenCalled()
    expect(screen.getByText(/No retained calls in this optional HSM session/)).toBeInTheDocument()
  })

  it.each(['loading', 'error'])(
    'does not turn session %s into a software-step result or gate',
    async (phase) => {
      fixtures.phase = phase
      render(<EthereumFlow onBack={vi.fn()} />)
      fireEvent.click(screen.getByRole('button', { name: 'Run software fixture' }))
      await screen.findByRole('button', { name: 'Next Step' })
      expect(fixtures.keygen).toHaveBeenCalledExactlyOnceWith('keygen')
      expect(screen.getByLabelText('Ethereum sample execution scope')).toHaveTextContent(
        'Software JSON-signing demonstration'
      )
      expect(fixtures.init).not.toHaveBeenCalled()
    }
  )

  it('keeps an accurate empty registry label and preserves the existing nonempty inspector', () => {
    fixtures.phase = 'session_open'
    const view = render(<EthereumFlow onBack={vi.fn()} />)
    expect(screen.getByTestId('hsm-key-inspector')).toHaveAttribute('data-hsm-key-count', '0')
    expect(
      screen.getByText(/Ethereum software steps do not provision keys here/)
    ).toBeInTheDocument()
    expect(screen.queryByText(/click Execute to run the provisioning flow/)).not.toBeInTheDocument()
    view.unmount()
    fixtures.keys = [{ handle: 17 }]
    render(<EthereumFlow onBack={vi.fn()} />)
    expect(screen.getByTestId('hsm-key-inspector')).toHaveAttribute('data-hsm-key-count', '1')
    expect(screen.getByText('Separate session registry fixture')).toBeInTheDocument()
    expect(
      screen.queryByText(/No keys are registered in this optional HSM session/)
    ).not.toBeInTheDocument()
  })

  it('preserves all four wrapper dispatches and the final completion callback as activity credit', async () => {
    const back = vi.fn()
    render(<EthereumFlow onBack={back} />)
    for (let i = 0; i < 4; i++) {
      fireEvent.click(screen.getByRole('button', { name: 'Run software fixture' }))
      if (i < 3) fireEvent.click(await screen.findByRole('button', { name: 'Next Step' }))
      else fireEvent.click(await screen.findByRole('button', { name: 'Completed' }))
    }
    await waitFor(() => expect(back).toHaveBeenCalledOnce())
    expect(fixtures.keygen).toHaveBeenCalledExactlyOnceWith('keygen')
    expect(fixtures.tx).toHaveBeenCalledExactlyOnceWith('format_tx')
    expect(fixtures.sign).toHaveBeenCalledExactlyOnceWith('sign')
    expect(fixtures.verify).toHaveBeenCalledExactlyOnceWith('verify')
    expect(fixtures.init).not.toHaveBeenCalled()
  })
})
