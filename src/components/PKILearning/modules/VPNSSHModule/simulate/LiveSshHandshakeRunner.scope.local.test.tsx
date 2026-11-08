// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
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
})
