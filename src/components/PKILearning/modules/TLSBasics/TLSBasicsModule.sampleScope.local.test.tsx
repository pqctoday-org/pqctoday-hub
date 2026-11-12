// SPDX-License-Identifier: AGPL-3.0-only
import type { ReactNode } from 'react'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRequire } from 'node:module'
import path from 'node:path'
import * as SoftHSM from '@/wasm/softhsm'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { TLSBasicsModule } from './TLSBasicsModule'
import * as sampleHelpers from './utils/certificateVerifySample'
const m = vi.hoisted(() => ({
  fail: false,
  reject: false,
  acceptNegative: false,
  calls: 0,
  originalInput: null as Uint8Array | null,
  originalSignature: null as Uint8Array | null,
  complete: vi.fn(),
  register: vi.fn(),
  module: null as SoftHSM.SoftHSMModule | null,
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
vi.mock('@/wasm/softhsm', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/wasm/softhsm')>()
  return {
    ...original,
    hsm_verifyBytes: (...args: Parameters<typeof original.hsm_verifyBytes>) => {
      m.calls++
      if (m.fail) throw new Error('sample verification operation failed')
      if (m.reject) {
        const changed = args[4].slice()
        changed[0] ^= 1
        return original.hsm_verifyBytes(args[0], args[1], args[2], args[3], changed)
      }
      if (m.calls === 1) {
        m.originalInput = args[3]
        m.originalSignature = args[4]
      }
      if (m.acceptNegative && m.calls > 1)
        return original.hsm_verifyBytes(
          args[0],
          args[1],
          args[2],
          m.originalInput!,
          m.originalSignature!
        )
      return original.hsm_verifyBytes(...args)
    },
  }
})
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({
  Pkcs11LogPanel: ({ title }: { title: string }) => <div>{title}</div>,
}))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeAll(async () => {
  const glue = path.resolve('src/vendor/softhsm-wasm/wasm/softhsm.js')
  const create = createRequire(import.meta.url)(glue)
  m.module = await create({
    locateFile: (file: string) =>
      file.endsWith('.wasm') ? path.join(path.dirname(glue), 'softhsm.wasm') : file,
  })
  SoftHSM.hsm_initialize(m.module!)
  const slot = SoftHSM.hsm_initToken(
    m.module!,
    SoftHSM.hsm_getFirstFreeSlot(m.module!),
    '12345678',
    'TLSUISample'
  )
  m.session = SoftHSM.hsm_openUserSession(m.module!, slot, '12345678', 'user1234')
}, 30000)
afterAll(() => {
  if (m.module) SoftHSM.hsm_finalize(m.module, m.session)
})
beforeEach(() => {
  vi.clearAllMocks()
  m.fail = false
  m.reject = false
  m.acceptNegative = false
  m.calls = 0
})
describe('actual captured CertificateVerify UI', () => {
  it('shows actual imported-key verification and all five negative checks before crediting the activity', async () => {
    render(<TLSBasicsModule />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Verify captured CertificateVerify (live WASM)' })
    )
    expect(await screen.findByText(/Captured 3309 B signature: VALID/)).toBeInTheDocument()
    await screen.findByText(/Wrong public key: REJECTED/)
    expect(screen.getByRole('link', { name: 'RFC 9846 §4.5.2' })).toHaveAttribute(
      'href',
      'https://datatracker.ietf.org/doc/html/rfc9846#section-4.5.2'
    )
    expect(screen.getByRole('link', { name: 'RFC 8446 §4.4.3' })).toHaveAttribute(
      'href',
      'https://www.rfc-editor.org/rfc/rfc8446.html#section-4.4.3'
    )
    expect(
      screen.getByText(/does not establish that the engine implements all of RFC 9846/)
    ).toBeInTheDocument()
    expect(m.calls).toBe(6)
    expect(m.complete).toHaveBeenCalledOnce()
    expect(m.complete).toHaveBeenCalledWith('tls-basics', 'hsm-demo')
    expect(screen.getByText(/Complete signed input: 130 B/)).toHaveTextContent(
      '20202020202020202020'
    )
    expect(screen.getByText(/Client context instead of server: REJECTED/)).toBeInTheDocument()
    expect(screen.getByText(/Changed transcript: REJECTED/)).toBeInTheDocument()
    expect(screen.getByText(/Truncated signature: REJECTED/)).toBeInTheDocument()
    expect(screen.getByText(/raw public key: 1952 B/)).toBeInTheDocument()
    expect(
      screen.getByText(/CA trust, hostname, expiry and policy validation are separate/)
    ).toBeInTheDocument()
    expect(
      screen.queryByText(/Signature prefix|Private key never left HSM/)
    ).not.toBeInTheDocument()
  })
  it.each(['operation', 'invalid-positive', 'accepted-negative'] as const)(
    'refuses completion on %s and retries the genuine verification',
    async (mode) => {
      m.fail = mode === 'operation'
      m.reject = mode === 'invalid-positive'
      m.acceptNegative = mode === 'accepted-negative'
      render(<TLSBasicsModule />)
      fireEvent.click(
        screen.getByRole('button', { name: 'Verify captured CertificateVerify (live WASM)' })
      )
      await screen.findByText(
        mode === 'operation'
          ? /sample verification operation failed/
          : mode === 'invalid-positive'
            ? /Captured CertificateVerify did not verify/
            : /Changed transcript was unexpectedly accepted/
      )
      expect(m.complete).not.toHaveBeenCalled()
      m.fail = false
      m.reject = false
      m.acceptNegative = false
      m.calls = 0
      fireEvent.click(
        screen.getByRole('button', { name: 'Verify captured CertificateVerify (live WASM)' })
      )
      await screen.findByText(/Wrong public key: REJECTED/)
      expect(m.complete).toHaveBeenCalledOnce()
      expect(
        screen.queryByText(
          /sample verification operation failed|unexpectedly accepted|did not verify/
        )
      ).not.toBeInTheDocument()
    }
  )
  it('does not import/verify or credit a captured computation after its view is unmounted', async () => {
    const sample = await sampleHelpers.getCertificateVerifySample()
    let finish!: (value: typeof sample) => void
    vi.spyOn(sampleHelpers, 'getCertificateVerifySample').mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve
      })
    )
    const view = render(<TLSBasicsModule />)
    fireEvent.click(
      screen.getByRole('button', { name: 'Verify captured CertificateVerify (live WASM)' })
    )
    view.unmount()
    await act(async () => {
      finish(sample)
    })
    expect(m.calls).toBe(0)
    expect(m.complete).not.toHaveBeenCalled()
  })
  it('does not credit an operational failure during a negative control as expected signature rejection', async () => {
    const original = m.module!
    let calls = 0
    m.module = new Proxy(original, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver)
        if (property !== '_C_VerifyMessage') return value
        return (...args: number[]) => {
          const code = Reflect.apply(value, target, args)
          return ++calls === 2 ? 5 : code
        }
      },
    })
    try {
      render(<TLSBasicsModule />)
      fireEvent.click(
        screen.getByRole('button', { name: 'Verify captured CertificateVerify (live WASM)' })
      )
      await screen.findByText(/operation incomplete \(verify=5\)/)
      expect(m.complete).not.toHaveBeenCalled()
      expect(screen.queryByText(/Changed transcript: REJECTED/)).not.toBeInTheDocument()
      expect(
        screen.queryByText('All captured CertificateVerify checks passed')
      ).not.toBeInTheDocument()
    } finally {
      m.module = original
    }
  })
})
