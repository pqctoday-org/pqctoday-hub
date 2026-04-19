// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Mock the openssh engine — WASM not available in jsdom
vi.mock('@/wasm/openssh', () => ({
  sshEngine: {
    runHandshake: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addStateListener: vi.fn(),
    removeStateListener: vi.fn(),
  },
}))

// Mock Pkcs11LogPanel — avoids complex rendering in unit tests
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: ({ calls }: { calls: string[] }) => (
    <div data-testid="pkcs11-log">{calls.length} calls</div>
  ),
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
})
