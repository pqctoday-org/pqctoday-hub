// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { TLSBasicsModule } from './TLSBasicsModule'
const m = vi.hoisted(() => ({
  sign: vi.fn(),
  generate: vi.fn(),
  extract: vi.fn(),
  complete: vi.fn(),
  register: vi.fn(),
  module: {},
  session: 7,
}))
vi.mock('@/components/PKILearning/common/ModuleShell', () => ({
  ModuleShell: ({ workshop }: { workshop: ReactNode }) => <>{workshop}</>,
}))
vi.mock('@/store/useModuleStore', () => ({
  useModuleStore: () => ({ updateModuleProgress: vi.fn(), markStepComplete: m.complete }),
}))
vi.mock('@/store/tls-learning.store', () => ({
  useTLSStore: () => ({
    clientConfig: {},
    serverConfig: {},
    isSimulating: false,
    setIsSimulating: vi.fn(),
    runInputs: null,
    results: null,
    setResults: vi.fn(),
    commands: [],
    runHistory: [],
    clearSession: vi.fn(),
  }),
}))
vi.mock('./utils/useSampleTrustDefaults', () => ({ useSampleTrustDefaults: () => undefined }))
vi.mock('./TLSClientPanel', () => ({ TLSClientPanel: () => null }))
vi.mock('./TLSServerPanel', () => ({ TLSServerPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/services/crypto/OpenSSLService', () => ({ openSSLService: { execute: vi.fn() } }))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: m.module },
    hSessionRef: { current: m.session },
    registerKey: m.register,
    keys: [],
    log: [],
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateMLDSAKeyPair: m.generate,
  hsm_extractKeyValue: m.extract,
  hsm_sign: m.sign,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: ({ title }: { title: string }) => <div>{title}</div>,
}))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  vi.clearAllMocks()
  m.generate.mockReturnValue({ pubHandle: 11, privHandle: 12 })
  m.extract.mockReturnValue(new Uint8Array([1, 2]))
  m.sign.mockReturnValue(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9]))
})
describe('TLS separate sample signing scope', () => {
  it('keeps the placeholder signing input and credits only the existing activity', async () => {
    render(<TLSBasicsModule />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign illustrative message (live WASM)' }))
    expect(
      await screen.findByText(
        /Signature prefix \(first 8 bytes; not a verification result\): 0102030405060708/
      )
    ).toBeInTheDocument()
    expect(m.sign).toHaveBeenCalledWith(
      m.module,
      m.session,
      12,
      'TLS-1.3-CertificateVerify:ClientHello+ServerHello+...+CertificateVerify'
    )
    expect(m.complete).toHaveBeenCalledWith('tls-basics', 'hsm-demo')
    expect(
      screen.queryByText(/\[Client\] Verify|toggle Live HSM Mode|ContextString \|\|/)
    ).not.toBeInTheDocument()
    expect(screen.getByText(/does not build a CertificateVerify input/)).toBeInTheDocument()
    expect(screen.getByText('PKCS#11 Call Log — Sample Signing Operations')).toBeInTheDocument()
  })
  it('retains the signing error and does not complete the activity on failure', async () => {
    m.sign.mockImplementation(() => {
      throw new Error('sample signing failed')
    })
    render(<TLSBasicsModule />)
    fireEvent.click(screen.getByRole('button', { name: 'Sign illustrative message (live WASM)' }))
    expect(await screen.findByText(/sample signing failed/)).toBeInTheDocument()
    expect(m.complete).not.toHaveBeenCalled()
  })
})
