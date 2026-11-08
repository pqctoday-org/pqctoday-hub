// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router'
import { HsmLearnView } from './HsmLearnView'
import { CKM_SHA256 } from '@/wasm/softhsm'

const fixture = vi.hoisted(() => ({
  module: {},
  session: 7,
  generated: vi.fn(),
  point: vi.fn(),
  derive: vi.fn(),
  hkdf: vi.fn(),
  extract: vi.fn(),
  logRef: { current: [] },
}))
vi.mock('@/wasm/softhsm', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/wasm/softhsm')>()
  return {
    ...actual,
    hsm_generateECKeyPair: fixture.generated,
    hsm_extractECPoint: fixture.point,
    hsm_ecdhDerive: fixture.derive,
    hsm_hkdf: fixture.hkdf,
    hsm_extractKeyValue: fixture.extract,
  }
})
vi.mock('../HsmContext', () => ({
  useHsmContext: () => ({
    moduleRef: { current: fixture.module },
    hSessionRef: { current: fixture.session },
    slotRef: { current: 0 },
    hsmLog: [],
    hsmLogRef: fixture.logRef,
    addHsmStepLog: vi.fn(),
    isReady: true,
    autoInit: vi.fn(async () => true),
  }),
}))
vi.mock('@/utils/analytics', () => ({ logEvent: vi.fn() }))
vi.mock('@/components/Playground/components/MiniPkcsLog', () => ({ MiniPkcsLog: () => null }))
vi.mock('@/components/Playground/keystore/HsmKeyTable', () => ({ HsmKeyTable: () => null }))
vi.mock('@/components/Playground/keystore/discoverHsmObjects', () => ({
  discoverHsmObjects: vi.fn(),
}))

const alicePoint = new Uint8Array([4, ...new Uint8Array(64).fill(0x11)])
const bobPoint = new Uint8Array([4, ...new Uint8Array(64).fill(0x22)])
const correctAnswer =
  'Both derivation operations returned handles; this lesson did not compare the derived values or perform key confirmation'
const question =
  'The lesson derived keys on both sides and returned two handles. What does that establish?'
const show = () => {
  render(
    <MemoryRouter>
      <HsmLearnView
        track="foundations"
        focus={{ lessonId: 'agreement-derivation', nonce: 1 }}
        onTryInWorkbench={vi.fn()}
      />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: /Agreement & derivation/ }))
}
beforeEach(() => {
  vi.clearAllMocks()
  localStorage.removeItem('hsm-pkcs11-quiz-agreement-derivation')
  let generated = 0
  fixture.generated.mockImplementation(() =>
    ++generated % 2 ? { pubHandle: 11, privHandle: 12 } : { pubHandle: 21, privHandle: 22 }
  )
  fixture.point.mockImplementation((_module, _session, handle) => {
    if (handle === 11) return alicePoint
    if (handle === 21) return bobPoint
    throw new Error('Unexpected public-key handle')
  })
  // These intentionally unrelated return handles supply no evidence about secret equality.
  fixture.derive.mockImplementation((_module, _session, privateHandle) => {
    if (privateHandle === 12) return 501
    if (privateHandle === 22) return 902
    throw new Error('Unexpected private-key handle')
  })
  fixture.hkdf.mockReturnValue(new Uint8Array(32).fill(0x33))
  fixture.extract.mockImplementation(() => {
    throw new Error('Raw key extraction is outside this lesson')
  })
})
afterEach(() => {
  localStorage.removeItem('hsm-pkcs11-quiz-agreement-derivation')
})

describe('agreement lesson reports two derivations without equality evidence', () => {
  it('executes the actual paired derivation specs and exposes accurate outcome, notes and quiz', async () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText(/aliceSecret=501 bobSecret=902 — two derivations returned key handles/)
    await screen.findByRole('button', { name: correctAnswer })
    expect(fixture.generated).toHaveBeenCalledTimes(2)
    expect(fixture.generated).toHaveBeenNthCalledWith(1, fixture.module, fixture.session, 'P-256')
    expect(fixture.generated).toHaveBeenNthCalledWith(2, fixture.module, fixture.session, 'P-256')
    expect(fixture.point).toHaveBeenNthCalledWith(1, fixture.module, fixture.session, 21)
    expect(fixture.point).toHaveBeenNthCalledWith(2, fixture.module, fixture.session, 11)
    expect(fixture.derive).toHaveBeenNthCalledWith(
      1,
      fixture.module,
      fixture.session,
      12,
      bobPoint,
      undefined,
      undefined,
      { derive: true }
    )
    expect(fixture.derive).toHaveBeenNthCalledWith(
      2,
      fixture.module,
      fixture.session,
      22,
      alicePoint,
      undefined,
      undefined,
      { derive: true }
    )
    expect(fixture.hkdf).toHaveBeenCalledWith(
      fixture.module,
      fixture.session,
      501,
      CKM_SHA256,
      true,
      true
    )
    expect(
      screen.getByText(/This step does not check whether the secrets match/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/both derivations above produced key HANDLES, not bytes/)
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(question.replace(/[.?]/g, '\\$&')))).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: correctAnswer }))
    expect(
      await screen.findByText(
        /their existence does not establish that the objects contain equal key material/
      )
    ).toBeInTheDocument()
    expect(fixture.extract).not.toHaveBeenCalled()
    expect(
      screen.queryByText(/Shared secrets match\.|Key equality confirmed|Comparison passed/i)
    ).not.toBeInTheDocument()
  })

  it('keeps the paired step incomplete after the first derivation fails and does not derive the other side or run HKDF', async () => {
    fixture.derive.mockImplementationOnce(() => {
      throw new Error('Alice sample derive failed')
    })
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Alice sample derive failed')
    expect(fixture.derive).toHaveBeenCalledTimes(1)
    expect(fixture.hkdf).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: correctAnswer })).not.toBeInTheDocument()
    expect(screen.queryByText(/two derivations returned key handles/)).not.toBeInTheDocument()
    expect(fixture.extract).not.toHaveBeenCalled()
  })

  it('keeps the step incomplete after the second side fails, then permits a complete honest retry', async () => {
    fixture.derive.mockReturnValueOnce(501).mockImplementationOnce(() => {
      throw new Error('Bob sample derive failed')
    })
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Bob sample derive failed')
    expect(fixture.derive).toHaveBeenCalledTimes(2)
    expect(fixture.hkdf).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: correctAnswer })).not.toBeInTheDocument()
    expect(screen.queryByText(/two derivations returned key handles/)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: correctAnswer })
    await waitFor(() => expect(fixture.hkdf).toHaveBeenCalledTimes(1))
    expect(fixture.derive).toHaveBeenCalledTimes(4)
    expect(
      screen.getByText(/This step does not check whether the secrets match/)
    ).toBeInTheDocument()
    expect(fixture.extract).not.toHaveBeenCalled()
  })
})
