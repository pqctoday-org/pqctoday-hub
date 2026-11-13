// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { SshSimulationPanel } from './SshSimulationPanel'
const m = vi.hoisted(() => ({
  model: vi.fn(),
  real: vi.fn(),
  mapped: vi.fn(),
  modelBind: vi.fn(),
  realChoice: false,
  module: {},
  session: 7,
}))
vi.mock('@/wasm/openssh', async (load) => ({
  ...(await load<typeof import('@/wasm/openssh')>()),
  sshEngine: { bindHsm: m.modelBind, runHandshake: m.model, terminate: vi.fn() },
}))
vi.mock('@/wasm/openssh-real', async (load) => ({
  ...(await load<typeof import('@/wasm/openssh-real')>()),
  sshRealEngine: { runHandshake: m.real, terminate: vi.fn() },
  mapRealEventsToResult: m.mapped,
  isRealCombo: () => m.realChoice,
}))
vi.mock('./HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: m.module },
    hSessionRef: { current: m.session },
    isReady: true,
    autoInit: vi.fn(),
    hsmKeys: [],
    removeHsmKey: vi.fn(),
    clearHsmKeys: vi.fn(),
  }),
}))
vi.mock('@/components/shared/ChromiumGateBanner', () => ({
  useChromiumGate: () => ({ supported: true }),
  ChromiumGateBanner: () => null,
}))
vi.mock('./SshLearnSection', () => ({ SshLearnSection: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
const values = {
  connection_ok: true,
  quantum_safe: true,
  host_key_algorithm: 'ssh-mldsa-65',
  client_auth_algorithm: 'ssh-mldsa-65',
  kex_algorithm: 'mlkem768-sha256',
  host_pubkey_bytes: 1952,
  client_pubkey_bytes: 1952,
  kex_share_bytes: 1184,
  kex_reply_share_bytes: 1088,
  host_sig_bytes: 3309,
  client_sig_bytes: 3309,
  auth_ms: 10,
  keygen_ms: 2,
  kex_ms: 2,
  host_sig_ms: 3,
  client_sig_ms: 3,
  pkcs11_host_backed: true,
  pkcs11_client_backed: true,
  wire_packets: [
    {
      direction: 'S→C',
      msgType: 'SSH_MSG_USERAUTH_SUCCESS',
      msgNum: 52,
      sizeBytes: 1,
      hexPreview: '34',
    },
  ],
}
beforeEach(() => {
  vi.clearAllMocks()
  m.realChoice = false
  m.real.mockResolvedValue({ rv: 0, events: [] })
  m.mapped.mockReturnValue({
    ...values,
    quantum_safe: false,
    token_module: 'softhsmv3 (WASM, embedded — real OpenSSH)',
    wire_packets: [],
  })
  m.model.mockResolvedValue({ ...values, token_module: 'softhsmv3 (WASM)' })
})
describe('SSH modeled parent labels', () => {
  it('keeps actual routing and output values while qualifying modeled log and packet sequence', async () => {
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH comparison' }))
    expect(await screen.findByText('Comparison runs finished')).toBeInTheDocument()
    expect(m.real).toHaveBeenCalledOnce()
    expect(m.model).toHaveBeenCalledOnce()
    expect(m.modelBind).toHaveBeenCalledWith(
      expect.objectContaining({ module: m.module, hSession: m.session })
    )
    expect(
      screen.getByText(
        /Modeled operation trace finished; connection\/authentication not assessed; operation_ms=10.0ms/
      )
    ).toBeInTheDocument()
    expect(screen.queryByText(/Modeled PQC done: connection_ok=true/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Wire/ }))
    expect(
      screen.getByText(/retained PQC result is a modeled message-size sequence/)
    ).toBeInTheDocument()
    await expect(m.model.mock.results[0].value).resolves.toMatchObject(values)
  })
  it('keeps genuine selected routing and real result presentation unchanged', async () => {
    m.realChoice = true
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH comparison' }))
    expect(await screen.findByText('Comparison runs finished')).toBeInTheDocument()
    expect(m.real).toHaveBeenCalledTimes(2)
    expect(m.model).not.toHaveBeenCalled()
    expect(screen.getAllByText('connected')).toHaveLength(2)
    expect(screen.queryByText(/Modeled operation trace finished/)).not.toBeInTheDocument()
  })
  it('keeps model failures visible rather than creating a completed trace', async () => {
    m.model.mockRejectedValue(new Error('sample model error'))
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH comparison' }))
    expect(await screen.findByText('sample model error')).toBeInTheDocument()
    expect(screen.queryByText('Comparison runs finished')).not.toBeInTheDocument()
  })
  it('changing an offered KEX clears the retained result, checks and packet/config views', async () => {
    m.model.mockResolvedValue({
      ...values,
      token_module: 'softhsmv3 (WASM)',
      operation_checks: {
        outcome: 'passed',
        shared_secret_equal: true,
        host_signature_valid: true,
        client_signature_valid: true,
      },
    })
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH comparison' }))
    expect(await screen.findByText('Sample checks passed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /mlkem512-curve25519-sha256/ }))
    expect(screen.queryByText('Sample checks passed')).not.toBeInTheDocument()
    expect(screen.getAllByText(/Not executed — click the matching run button above/)).toHaveLength(
      2
    )
    fireEvent.click(screen.getByRole('tab', { name: /Config/ }))
    expect(
      screen.getByText('Run the comparison to generate the configuration.')
    ).toBeInTheDocument()
  })
  it('renders the actual pinned native setup and server config for a completed REAL profile', async () => {
    m.realChoice = true
    m.mapped.mockReturnValue({
      ...values,
      kex_algorithm: 'mlkem768x25519-sha256',
      token_module: 'softhsmv3 (WASM, embedded — real OpenSSH)',
    })
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH comparison' }))
    expect(await screen.findByText('Comparison runs finished')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Config/ }))
    expect(screen.getByText('setup.sh — disposable-container example')).toBeVisible()
    const setup = screen.getByText(/^#!\/bin\/sh/)
    expect(setup).toHaveTextContent('sha256sum -c -')
    expect(setup).toHaveTextContent('Expected exactly one matching host public identity')
    expect(setup).toHaveTextContent('StrictHostKeyChecking yes')
    expect(screen.getByText(/^# Pinned example:/)).toHaveTextContent(
      'HostKeyAgent /root/pqc-ssh-example/agent.sock'
    )
    expect(screen.getByText(/^# Pinned example:/)).not.toHaveTextContent('PKCS11Provider')
  })
  it('does not turn an unsupported modeled KEX into a different native profile', async () => {
    render(
      <MemoryRouter>
        <SshSimulationPanel />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH comparison' }))
    expect(await screen.findByText('Comparison runs finished')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Config/ }))
    expect(
      screen.getByText(/This retained model or incomplete run has no pinned native recipe/)
    ).toBeVisible()
    expect(screen.queryByText('setup.sh — disposable-container example')).not.toBeInTheDocument()
  })
})
