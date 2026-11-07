// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { LMSKeyGenDemo } from './LMSKeyGenDemo'
import { LMS_PARAMETER_SETS } from '../data/statefulSigsConstants'
const m = vi.hoisted(() => ({
  generate: vi.fn(),
  sign: vi.fn(),
  register: vi.fn(),
  module: {},
  session: 7,
}))
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
vi.mock('@/wasm/softhsm/pqc', () => ({
  hsm_generateStatefulKeyPair: m.generate,
  hsm_statefulSignBytes: m.sign,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))
beforeEach(() => {
  vi.clearAllMocks()
  m.generate.mockReturnValue({ privHandle: 12, pubHandle: 13 })
  m.sign.mockReturnValue(Uint8Array.from({ length: 120 }, (_, i) => (i < 4 ? 0 : i)))
})
describe('LMS raw signature excerpts', () => {
  it.each([1, 2])(
    'does not label selected %s-level metadata as a parsed prefix',
    async (levels) => {
      const selected = LMS_PARAMETER_SETS.find((p) => p.levelHeights.length === levels)!
      render(<LMSKeyGenDemo initialParamId={selected.id} />)
      fireEvent.click(screen.getByRole('button', { name: /Generate (LMS|HSS) Key/ }))
      const sign = await screen.findByRole('button', { name: 'Sign with CKM_HSS' })
      fireEvent.change(screen.getByRole('textbox', { name: 'Input Data (String)' }), {
        target: { value: 'sample λ' },
      })
      fireEvent.click(sign)
      expect(m.sign.mock.calls[0].at(-1)).toEqual(new TextEncoder().encode('sample λ'))
      const hex = Array.from(m.sign.mock.results[0].value as Uint8Array, (b) =>
        b.toString(16).padStart(2, '0')
      ).join('')
      expect(screen.getByText(hex.substring(0, 100) + '...')).toBeInTheDocument()
      expect(screen.getByText(hex.substring(100, 200) + '...')).toBeInTheDocument()
      expect(
        screen.getByText(`Selected hierarchy levels (parameter set): ${levels}`)
      ).toBeInTheDocument()
      expect(screen.getByText('Raw signature excerpts (not decoded)')).toBeInTheDocument()
      expect(
        screen.queryByText(/Nspk|LMOTS Payload Signature|HSS Authentication Path/)
      ).not.toBeInTheDocument()
      expect(m.generate.mock.calls[0].slice(-2)).toEqual([selected.lmsParams, selected.lmotsParams])
    }
  )
  it('labels a short returned sample as up-to excerpts without inventing fields', async () => {
    m.sign.mockReturnValue(new Uint8Array([1, 2, 3]))
    render(<LMSKeyGenDemo />)
    fireEvent.click(screen.getByRole('button', { name: /Generate (LMS|HSS) Key/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sign with CKM_HSS' }))
    expect(screen.getByText('010203...')).toBeInTheDocument()
    expect(screen.getByText('...')).toBeInTheDocument()
    expect(screen.getByText('Next up to 50 signature bytes (hex excerpt)')).toBeInTheDocument()
  })
  it('keeps signing errors visible instead of claiming decoded output', async () => {
    m.sign.mockImplementation(() => {
      throw new Error('sample signing error')
    })
    render(<LMSKeyGenDemo />)
    fireEvent.click(screen.getByRole('button', { name: /Generate (LMS|HSS) Key/ }))
    fireEvent.click(await screen.findByRole('button', { name: 'Sign with CKM_HSS' }))
    expect(screen.getByText(/sample signing error/)).toBeInTheDocument()
    expect(screen.queryByText('Raw signature excerpts (not decoded)')).not.toBeInTheDocument()
  })
})
