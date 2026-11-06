// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { VpnSimulationPanel } from '../VpnSimulationPanel'
import {
  buildIkeV2Exchange,
  type KemSize,
} from '@/components/PKILearning/modules/VPNSSHModule/data/ikev2Constants'
import { vpnDerivationExample, vpnExchangeLabel } from './exchangeDescription'

vi.mock('../HsmContext', () => ({
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
  Pkcs11LogPanel: ({ log }: { log: unknown[] }) =>
    createElement('div', { 'data-testid': 'pkcs11-log' }, `${log.length} calls`),
}))

// Mock HsmKeyInspector — pulls its own softhsm helpers; not under test here.
vi.mock('@/components/shared/HsmKeyInspector', () => ({
  HsmKeyInspector: () => createElement('div', { 'data-testid': 'hsm-key-inspector' }),
}))

// Mock ChromiumGateBanner.
vi.mock('@/components/shared/ChromiumGateBanner', () => ({
  ChromiumGateBanner: () => null,
  useChromiumGate: () => ({ supported: true }),
}))

describe('VPN requested exchange order and teaching derivation', () => {
  it.each([512, 768, 1024] as KemSize[])(
    'matches modeled hybrid exchange order at %s without swapping the displayed KEM secret',
    (size) => {
      const exchange = buildIkeV2Exchange('hybrid', size)
      expect(exchange.ikeSaInit.initiator.description).toContain('ECP-256 as the primary KE')
      expect(exchange.ikeIntermediate!.initiator.description).toContain(`ML-KEM-${size}`)
      expect(vpnExchangeLabel('hybrid', size)).toBe(
        `ECP-256 (IKE_SA_INIT) + ML-KEM-${size} (Additional KE 1, IKE_INTERMEDIATE)`
      )
      const formula = vpnDerivationExample('hybrid', size, 'sample-kem-secret')
      expect(formula).toContain('SKEYSEED  = prf(Ni ‖ Nr, g^ir)')
      expect(formula).toContain("SKEYSEED' = prf(SK_d, ss_kem ‖ Ni ‖ Nr)")
      expect(formula).toContain('ss_kem = 0xsample-kem-secret')
      expect(formula.indexOf('ECDH ECP-256')).toBeLessThan(formula.indexOf(`ML-KEM-${size}`))
    }
  )

  it.each([512, 768, 1024] as KemSize[])(
    'keeps pure-PQC requested primary size %s explicit',
    (size) => {
      const model = buildIkeV2Exchange('pure-pqc', size)
      expect(model.ikeSaInit.initiator.description).toContain(
        `ML-KEM-${size} as the only key exchange`
      )
      expect(model.ikeIntermediate).toBeUndefined()
      expect(vpnExchangeLabel('pure-pqc', size)).toBe(`ML-KEM-${size} (IKE_SA_INIT)`)
      expect(vpnDerivationExample('pure-pqc', size, 'sample')).not.toContain('ECDH')
    }
  )

  it('keeps classical and pure-PQC descriptions distinct', () => {
    expect(vpnExchangeLabel('classical', 768)).toBe('ECP-256 (IKE_SA_INIT)')
    expect(vpnExchangeLabel('pure-pqc', 512)).toBe('ML-KEM-512 (IKE_SA_INIT)')
    expect(vpnDerivationExample('pure-pqc', 512, 'sample')).toContain('prf(Ni ‖ Nr, ss_kem)')
    expect(vpnDerivationExample('classical', 768, 'unused')).not.toContain('unused')
    expect(vpnExchangeLabel('hybrid')).toContain('selected parameter set')
    expect(vpnExchangeLabel('hybrid', 768, '')).toBe(vpnExchangeLabel('hybrid', 768))
    expect(vpnDerivationExample('hybrid', 768, 'sample', '')).toBe(
      vpnDerivationExample('hybrid', 768, 'sample')
    )
  })

  it.each(['aes256-sha256-mlkem768-ke1_mlkem512', 'unparsed-custom-proposal', '   '])(
    'does not infer a default exchange order from custom input %s',
    (proposal) => {
      expect(vpnExchangeLabel('hybrid', 1024, proposal)).toBe(
        `Custom proposal requested: ${proposal} — inspect negotiation trace`
      )
      const formula = vpnDerivationExample('hybrid', 1024, 'sample-not-attributed', proposal)
      expect(formula).toContain(proposal)
      expect(formula).toContain('does not establish')
      expect(formula).not.toContain('sample-not-attributed')
      expect(formula).not.toContain('ML-KEM-1024 secret')
    }
  )
})

describe('VPN caller requested-proposal scope before a run', () => {
  it.each(['hybrid', 'classical'] as const)(
    'qualifies custom overrides before a %s run',
    (mode) => {
      window.history.replaceState({}, '', '/?vpnKemProposal=unparsed-custom-proposal')
      try {
        render(
          createElement(MemoryRouter, {}, createElement(VpnSimulationPanel, { initialMode: mode }))
        )
        const note = screen.getByRole('note', { name: 'Custom VPN proposal scope' })
        expect(note).toHaveTextContent('unparsed-custom-proposal')
        expect(note).toHaveTextContent('selector examples, not a record of this custom negotiation')
        expect(screen.getByRole('note', { name: 'Custom VPN statistics scope' })).toHaveTextContent(
          'not established outcomes'
        )
        expect(note).toHaveTextContent('no exchange order or secret assignment is inferred')
        expect(note).not.toHaveTextContent('ML-KEM-768')
      } finally {
        window.history.replaceState({}, '', '/')
      }
    }
  )
  it.each(['/', '/?vpnKemProposal='])(
    'does not show custom scope for normal/empty selector %s',
    (url) => {
      window.history.replaceState({}, '', url)
      try {
        render(
          createElement(
            MemoryRouter,
            {},
            createElement(VpnSimulationPanel, { initialMode: 'hybrid' })
          )
        )
        expect(
          screen.queryByRole('note', { name: 'Custom VPN proposal scope' })
        ).not.toBeInTheDocument()
        expect(screen.getByText('Requested KE Proposal')).toBeInTheDocument()
        expect(
          screen.getByText('ECP-256 (IKE_SA_INIT) + ML-KEM-768 (Additional KE 1, IKE_INTERMEDIATE)')
        ).toBeInTheDocument()
      } finally {
        window.history.replaceState({}, '', '/')
      }
    }
  )
})
