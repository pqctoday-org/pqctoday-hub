// SPDX-License-Identifier: GPL-3.0-only
//
// Smoke tests for VpnSimulationPanel. The panel is under active development,
// so assertions stay resilient: stable testids and data-driven text only —
// no exact DOM-structure expectations.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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

// Mock the v2 strongSwan WASM bridge (selftest card).
vi.mock('@/wasm/strongswan-v2/bridge-v2', () => ({
  runV2Selftest: vi.fn().mockResolvedValue({
    mlDsaSigLen: 0,
    mlKemPub: 0,
    mlKemCt: 0,
    mlKemSecret: 0,
    mlKemMatch: false,
  }),
  runV2KemTwoWorker: vi.fn().mockResolvedValue({
    alicePub: 0,
    bobCt: 0,
    secretLen: 0,
    match: false,
    aliceSecretHex: '',
  }),
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

describe('VpnSimulationPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders without crashing', () => {
    const { container } = renderPanel()
    expect(container.firstChild).not.toBeNull()
  })

  it('shows all three key-exchange mode options', () => {
    renderPanel()
    const buttonText = screen
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .join('\n')
    expect(buttonText).toMatch(/classical/i)
    expect(buttonText).toMatch(/hybrid/i)
    expect(buttonText).toMatch(/pure[\s-]?pqc/i)
  })

  it('exposes the Start Daemon control (stable e2e testid)', () => {
    renderPanel()
    expect(screen.getByTestId('vpn-start-daemon')).toBeInTheDocument()
  })

  it('has a PKCS#11-related section', () => {
    renderPanel()
    expect(screen.queryAllByText(/PKCS#?11/i).length).toBeGreaterThan(0)
  })

  it('shows the charon.log daemon log section', () => {
    renderPanel()
    expect(screen.queryAllByText(/charon\.log/i).length).toBeGreaterThan(0)
  })

  it('respects the ?vpnMode= query parameter shape via initialMode prop', () => {
    render(
      <MemoryRouter>
        <VpnSimulationPanel initialMode="pure-pqc" />
      </MemoryRouter>
    )
    // Panel mounts in pure-pqc mode without crashing; mode buttons still present.
    const buttonText = screen
      .getAllByRole('button')
      .map((b) => b.textContent ?? '')
      .join('\n')
    expect(buttonText).toMatch(/pure[\s-]?pqc/i)
  })
})
