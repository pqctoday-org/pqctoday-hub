// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock HsmContext
vi.mock('./HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    isReady: false,
    autoInit: vi.fn().mockResolvedValue(true),
  }),
  HsmProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock the openssh engine — WASM not available in jsdom
vi.mock('@/wasm/openssh', () => ({
  sshEngine: {
    runHandshake: vi.fn(),
    terminate: vi.fn(),
    bindHsm: vi.fn(),
  },
  SSH_KEX_OPTIONS: [
    { id: 'curve25519-sha256', label: 'curve25519-sha256 (classical)', family: 'classical' },
    {
      id: 'mlkem512-curve25519-sha256',
      label: 'mlkem512-curve25519-sha256 (hybrid)',
      family: 'hybrid',
    },
    {
      id: 'mlkem768-curve25519-sha256',
      label: 'mlkem768-curve25519-sha256 (hybrid)',
      family: 'hybrid',
    },
    {
      id: 'mlkem1024-curve25519-sha256',
      label: 'mlkem1024-curve25519-sha256 (hybrid)',
      family: 'hybrid',
    },
    {
      id: 'mlkem512-nistp256-sha256',
      label: 'mlkem512-nistp256-sha256 (hybrid)',
      family: 'hybrid',
    },
    {
      id: 'mlkem768-nistp256-sha256',
      label: 'mlkem768-nistp256-sha256 (hybrid)',
      family: 'hybrid',
    },
    { id: 'mlkem768', label: 'mlkem768 (pure ML-KEM)', family: 'pure' },
    { id: 'mlkem1024', label: 'mlkem1024 (pure ML-KEM)', family: 'pure' },
  ],
  SSH_HOST_KEY_OPTIONS: [
    { id: 'ssh-ed25519', label: 'ssh-ed25519 (classical)' },
    { id: 'ssh-mldsa-44', label: 'ssh-mldsa-44 (PQC)' },
    { id: 'ssh-mldsa-65', label: 'ssh-mldsa-65 (PQC)' },
    { id: 'ssh-mldsa-87', label: 'ssh-mldsa-87 (PQC)' },
  ],
}))

// Mock Pkcs11LogPanel — avoids complex rendering in unit tests
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: ({ log }: { log: unknown[] }) => (
    <div data-testid="pkcs11-log">{log.length} calls</div>
  ),
}))

// Mock ChromiumGateBanner
vi.mock('@/components/shared/ChromiumGateBanner', () => ({
  ChromiumGateBanner: () => null,
  useChromiumGate: () => ({ supported: true }),
}))

import { SshSimulationPanel } from './SshSimulationPanel'
import { sshEngine } from '@/wasm/openssh'

function renderPanel() {
  return render(
    <MemoryRouter>
      <SshSimulationPanel />
    </MemoryRouter>
  )
}

describe('SshSimulationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the tool title', () => {
    renderPanel()
    expect(screen.getByText('PQC SSH Simulator')).toBeInTheDocument()
  })

  it('renders the run button in idle state', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /run.*handshake/i })).toBeInTheDocument()
  })

  it('renders the reset button', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })

  it('renders the comparison panel with empty placeholders', () => {
    renderPanel()
    expect(screen.getByText('Classical (ed25519 + curve25519)')).toBeInTheDocument()
    expect(screen.getByText(/ML-DSA-65.*ML-KEM-768/i)).toBeInTheDocument()
  })

  it('renders the handshake log tab with idle message', () => {
    renderPanel()
    expect(screen.getByText(/Click.*Run both handshakes/i)).toBeInTheDocument()
  })

  it('calls sshEngine.terminate on reset', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: /reset/i }))
    expect(sshEngine.terminate).toHaveBeenCalled()
  })

  it('links to the learn module', () => {
    renderPanel()
    const learnLink = screen.getByRole('link', { name: /learn/i })
    expect(learnLink).toHaveAttribute('href', '/learn/network-security-pqc')
  })

  it('shows the PKCS#11 calls tab', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /pkcs#?11/i })).toBeInTheDocument()
  })

  it('shows the wire packets tab unconditionally', () => {
    renderPanel()
    expect(screen.getByRole('button', { name: /wire packets/i })).toBeInTheDocument()
  })

  it('description advertises real softhsmv3 PKCS#11', () => {
    renderPanel()
    expect(screen.getByText(/softhsmv3 PKCS#11/i)).toBeInTheDocument()
  })
})
