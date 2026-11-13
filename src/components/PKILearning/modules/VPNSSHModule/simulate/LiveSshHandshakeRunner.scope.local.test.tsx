// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LiveSshHandshakeRunner } from './LiveSshHandshakeRunner'
const m = vi.hoisted(() => ({ run: vi.fn(), bind: vi.fn(), module: {}, session: 7 }))
vi.mock('@/wasm/openssh', () => ({
  sshEngine: { runHandshake: m.run, bindHsm: m.bind, terminate: vi.fn() },
}))
vi.mock('@/components/Playground/hsm/HsmContext', () => ({
  HsmProvider: ({ children }: { children: ReactNode }) => <>{children}</>,
  useHsmContext: () => ({
    moduleRef: { current: m.module },
    hSessionRef: { current: m.session },
    isReady: true,
    autoInit: vi.fn(),
  }),
}))
beforeEach(() => {
  vi.clearAllMocks()
  m.run.mockResolvedValue({
    connection_ok: true,
    token_module: 'softhsmv3 (WASM)',
    kex_share_bytes: 1216,
    kex_reply_share_bytes: 1120,
    auth_ms: 12.3,
    keygen_ms: 2,
    kex_ms: 3,
    host_sig_ms: 4,
    client_sig_ms: 3.3,
  })
})
describe('Learn SSH modeled sample scope', () => {
  it('keeps the same engine call and numbers without calling it a real handshake', async () => {
    render(
      <MemoryRouter>
        <LiveSshHandshakeRunner algorithm="mlkem768x25519-sha256" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH token-operation sample' }))
    expect(await screen.findByText('Sample operation wall-time')).toBeInTheDocument()
    expect(m.run).toHaveBeenCalledWith('pqc')
    expect(m.bind).toHaveBeenCalledWith({ module: m.module, hSession: m.session })
    expect(
      screen.getByText(/does not establish a network connection or full SSH authentication/)
    ).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Run live SSH handshake' })).not.toBeInTheDocument()
    expect(screen.getByText('keygen: 2.0 ms')).toBeInTheDocument()
  })
  it('preserves the existing failed-result gate and reset', async () => {
    m.run.mockResolvedValue({ connection_ok: false, error: 'sample refused' })
    render(
      <MemoryRouter>
        <LiveSshHandshakeRunner algorithm="mlkem768x25519-sha256" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH token-operation sample' }))
    expect(await screen.findByText(/sample refused/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset the operation sample' }))
    expect(screen.queryByText(/sample refused/)).not.toBeInTheDocument()
  })
  it.each(['passed', 'failed', 'error'] as const)(
    'shows separately executed %s checks without a network acceptance claim',
    async (outcome) => {
      m.run.mockResolvedValue({
        connection_ok: outcome === 'passed',
        operation_checks: {
          outcome,
          shared_secret_equal: true,
          host_signature_valid: outcome === 'error' ? null : outcome === 'passed',
          client_signature_valid: outcome === 'error' ? null : true,
        },
        error: outcome === 'error' ? 'Verification operation error 0x30' : undefined,
        token_module: 'softhsmv3 (WASM)',
        kex_share_bytes: 1216,
        kex_reply_share_bytes: 1120,
        auth_ms: 12,
        keygen_ms: 2,
        kex_ms: 3,
        host_sig_ms: 4,
        client_sig_ms: 3,
      })
      render(
        <MemoryRouter>
          <LiveSshHandshakeRunner algorithm="mlkem768x25519-sha256" />
        </MemoryRouter>
      )
      fireEvent.click(screen.getByRole('button', { name: 'Run SSH token-operation sample' }))
      const checks = await screen.findByRole('region', { name: 'Executed SSH sample checks' })
      expect(checks).toHaveTextContent(
        outcome === 'passed'
          ? 'Sample checks passed'
          : outcome === 'failed'
            ? 'Sample checks failed'
            : 'Sample checks incomplete — operation error'
      )
      if (outcome === 'error') {
        expect(screen.getAllByText('Not completed')).toHaveLength(2)
        expect(screen.getAllByText('Pass')).toHaveLength(1)
      }
      expect(screen.queryByText('connected')).not.toBeInTheDocument()
      expect(screen.queryByText(/do not establish peer secret agreement/)).not.toBeInTheDocument()
      fireEvent.click(screen.getByRole('button', { name: 'Reset the operation sample' }))
      expect(
        screen.queryByRole('region', { name: 'Executed SSH sample checks' })
      ).not.toBeInTheDocument()
    }
  )
  it('an old in-flight result cannot repopulate the sample after an algorithm change', async () => {
    let resolve!: (value: unknown) => void
    m.run.mockImplementationOnce(
      () =>
        new Promise((r) => {
          resolve = r
        })
    )
    const view = render(
      <MemoryRouter>
        <LiveSshHandshakeRunner algorithm="mlkem768x25519-sha256" />
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Run SSH token-operation sample' }))
    view.rerender(
      <MemoryRouter>
        <LiveSshHandshakeRunner algorithm="curve25519-sha256" />
      </MemoryRouter>
    )
    await act(async () =>
      resolve({
        connection_ok: true,
        operation_checks: {
          outcome: 'passed',
          shared_secret_equal: true,
          host_signature_valid: true,
          client_signature_valid: true,
        },
        keygen_ms: 99,
        kex_ms: 1,
        host_sig_ms: 1,
        client_sig_ms: 1,
        auth_ms: 102,
      })
    )
    expect(screen.queryByText('keygen: 99.0 ms')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('region', { name: 'Executed SSH sample checks' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run SSH token-operation sample' })).toBeEnabled()
  })
})
