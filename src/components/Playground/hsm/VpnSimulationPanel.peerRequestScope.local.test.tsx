// SPDX-License-Identifier: AGPL-3.0-only
//
// Smoke tests for VpnSimulationPanel. The panel is under active development,
// so assertions stay resilient: stable testids and data-driven text only —
// no exact DOM-structure expectations.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'

// Mock HsmContext — same pattern as SshSimulationPanel.test.tsx, plus the
// extra fields the VPN panel destructures.
vi.mock('./HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: null },
    hSessionRef: { current: 0 },
    isReady: false,
    autoInit: vi.fn().mockResolvedValue(true),
    addHsmLog: vi.fn(),
    hsmLog: [],
    addHsmKey: vi.fn(),
    hsmKeys: [],
    clearHsmKeys: vi.fn(),
    removeHsmKey: vi.fn(),
  }),
  HsmProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock the softhsm WASM loader + helpers — WASM is not available in jsdom.
vi.mock('@/wasm/softhsm', () => ({
  getSoftHSMCppModule: vi.fn().mockResolvedValue(null),
  getSoftHSMRustModule: vi.fn().mockResolvedValue(null),
  clearSoftHSMCache: vi.fn(),
  createLoggingProxy: vi.fn((m: unknown) => m),
  hsm_generateRSAKeyPair: vi.fn(),
  hsm_generateMLDSAKeyPair: vi.fn(),
  hsm_extractKeyValue: vi.fn(),
  hsm_signBytesMLDSA: vi.fn(),
  hsm_initToken: vi.fn(),
  hsm_openUserSession: vi.fn(),
  hsm_getKeyAttributes: vi.fn(),
  hsm_destroyObject: vi.fn(),
  SLH_DSA_PUB_BYTES: {},
  SOFTHSM_PRODUCT_VERSION: '0.0.0-test',
}))

// Mock the strongSwan charon bridge — spawns Workers + SharedArrayBuffers.
vi.mock('@/wasm/strongswan/bridge', () => ({
  strongSwanEngine: {
    packetCount: 0,
    addLogListener: vi.fn(),
    removeLogListener: vi.fn(),
    addStateListener: vi.fn(),
    removeStateListener: vi.fn(),
    addPkcs11TraceListener: vi.fn(),
    removePkcs11TraceListener: vi.fn(),
    setRpcHandler: vi.fn(),
    setKeySpec: vi.fn(),
    init: vi.fn().mockResolvedValue(undefined),
    start: vi.fn().mockResolvedValue(undefined),
    destroy: vi.fn(),
    dispatchLog: vi.fn(),
    execute: vi.fn().mockResolvedValue(undefined),
    pkcs11: vi.fn().mockResolvedValue({ rv: 0, data: {} }),
    writeFiles: vi.fn().mockResolvedValue(undefined),
  },
}))

// Mock the OpenSSL worker service (cert pretty-printing).
vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: {
    init: vi.fn().mockResolvedValue(undefined),
    execute: vi.fn().mockResolvedValue({ stdout: '', stderr: '', files: [] }),
  },
}))

// Mock Pkcs11LogPanel — avoids complex rendering in unit tests.
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: ({ log }: { log: unknown[] }) => (
    <div data-testid="pkcs11-log">{log.length} calls</div>
  ),
}))

// Mock HsmKeyInspector — pulls its own softhsm helpers; not under test here.
vi.mock('@/components/shared/HsmKeyInspector', () => ({
  HsmKeyInspector: () => <div data-testid="hsm-key-inspector" />,
}))

// Mock ChromiumGateBanner.
vi.mock('@/components/shared/ChromiumGateBanner', () => ({
  ChromiumGateBanner: () => null,
  useChromiumGate: () => ({ supported: true }),
}))

import { VpnSimulationPanel } from './VpnSimulationPanel'

function renderPanel() {
  return render(
    <MemoryRouter>
      <VpnSimulationPanel />
    </MemoryRouter>
  )
}

describe('VPN current peer request scope', () => {
  beforeEach(() => vi.clearAllMocks())
  it('shows both current peer requests before running, with no authentication verdict', () => {
    renderPanel()
    const note = within(screen.getByRole('note', { name: 'Current peer authentication requests' }))
    expect(note.getByText('Current initiator authentication request: PSK.')).toBeInTheDocument()
    expect(note.getByText('Current responder authentication request: PSK.')).toBeInTheDocument()
    expect(
      note.getByText('Authentication outcome for each peer: Not assessed by this capture summary.')
    ).toBeInTheDocument()
    expect(screen.queryByTestId('vpn-scorecard')).not.toBeInTheDocument()
    expect(screen.getByText(/Fragmentation settings request RFC 7383 behavior/)).toBeInTheDocument()
  })
  it('keeps asymmetric and both-ML-DSA requests distinct from peer authentication outcomes', () => {
    renderPanel()
    fireEvent.click(screen.getByRole('button', { name: 'Certificate (pubkey)' }))
    const note = within(screen.getByRole('note', { name: 'Current peer authentication requests' }))
    expect(note.getByText(/Current initiator authentication request: RSA-/)).toBeInTheDocument()
    expect(note.getByText(/Current responder authentication request: ML-DSA-/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Client authentication key type' }))
    fireEvent.click(screen.getByRole('option', { name: 'ML-DSA (PQC)' }))
    expect(note.getByText(/Current initiator authentication request: ML-DSA-/)).toBeInTheDocument()
    expect(note.getByText(/Current responder authentication request: ML-DSA-/)).toBeInTheDocument()
    expect(
      note.getByText('Authentication outcome for each peer: Not assessed by this capture summary.')
    ).toBeInTheDocument()
    expect(screen.queryByTestId('vpn-scorecard')).not.toBeInTheDocument()
  })
})
