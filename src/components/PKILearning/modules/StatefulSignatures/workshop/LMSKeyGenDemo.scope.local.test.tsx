// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { LMSKeyGenDemo } from './LMSKeyGenDemo'
import { readFileSync } from 'node:fs'
import reference from '@/data/kat/lms_hss_rfc8554.json'
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
const one = new Uint8Array(readFileSync('public/lms-sample/lms-signature.bin'))
const two = Uint8Array.from(Buffer.from(reference.test_cases[0].signature_hex, 'hex'))
beforeEach(() => {
  vi.clearAllMocks()
  m.generate.mockReturnValue({ privHandle: 12, pubHandle: 13 })
  m.sign.mockReturnValue(one)
})
describe('LMS actual structural signature display', () => {
  async function sign(selectedLevels = 1) {
    const selected = LMS_PARAMETER_SETS.find((p) => p.levelHeights.length === selectedLevels)!
    render(<LMSKeyGenDemo initialParamId={selected.id} />)
    fireEvent.click(screen.getByRole('button', { name: /Generate (LMS|HSS) Key/ }))
    const button = await screen.findByRole('button', { name: 'Sign with CKM_HSS' })
    fireEvent.change(screen.getByRole('textbox', { name: 'Input Data (String)' }), {
      target: { value: 'sample λ' },
    })
    fireEvent.click(button)
    expect(m.sign.mock.calls[0].at(-1)).toEqual(new TextEncoder().encode('sample λ'))
    expect(m.generate.mock.calls[0].slice(-2)).toEqual([selected.lmsParams, selected.lmotsParams])
    return button
  }
  it('renders genuine Nspk0 layout evenwhen UIselected twolevels', async () => {
    m.sign.mockReturnValue(one)
    await sign(2)
    const decoded = within(screen.getByRole('region', { name: 'Decoded HSS signature' }))
    expect(decoded.getByText(/Nspk .*: 0.*Encoded hierarchy levels: 1/)).toBeInTheDocument()
    expect(screen.getByText(/Selected UI parameters: .*2 level/)).toBeInTheDocument()
    expect(
      decoded.getByText('C randomizer: offset 12, 32 bytes (end 44, exclusive)')
    ).toBeInTheDocument()
    expect(
      decoded.getByText('LMS type (u32 big-endian): offset 1132, 4 bytes (end 1136, exclusive)')
    ).toBeInTheDocument()
    expect(
      decoded.getByText(
        'Authentication path (10 × 32 bytes): offset 1136, 320 bytes (end 1456, exclusive)'
      )
    ).toBeInTheDocument()
    expect(decoded.queryByText(/Signed child public key/)).not.toBeInTheDocument()
    fireEvent.click(
      decoded.getByText('HSS Nspk (u32 big-endian): offset 0, 4 bytes (end 4, exclusive)')
    )
    expect(decoded.getAllByText('00000000').at(0)).toBeVisible()
  })
  it('renders real AppendixF twolevel parent/child/final boundaries evenwhen UIselected onelevel', async () => {
    m.sign.mockReturnValue(two)
    await sign(1)
    const d = within(screen.getByRole('region', { name: 'Decoded HSS signature' }))
    expect(d.getByText(/Nspk .*: 1.*Encoded hierarchy levels: 2/)).toBeInTheDocument()
    fireEvent.click(d.getByText('HSS Nspk (u32 big-endian): offset 0, 4 bytes (end 4, exclusive)'))
    expect(d.getByText('00000001')).toBeVisible()
    expect(screen.getByText(/Selected UI parameters: .*1 level/)).toBeInTheDocument()
    expect(d.getByRole('region', { name: 'Signed child public key 1' })).toBeInTheDocument()
    expect(
      d.getByText('Child identifier I: offset 1304, 16 bytes (end 1320, exclusive)')
    ).toBeInTheDocument()
    expect(
      d.getByText('Child root T[1]: offset 1320, 32 bytes (end 1352, exclusive)')
    ).toBeInTheDocument()
    expect(d.getByText('LMS signature level 1 — 1292 bytes at offset 1352')).toBeInTheDocument()
    expect(
      d.getByText(
        'Authentication path (5 × 32 bytes): offset 2484, 160 bytes (end 2644, exclusive)'
      )
    ).toBeInTheDocument()
  })
  it.each([
    new Uint8Array(),
    new Uint8Array([1, 2, 3]),
    one.subarray(0, 1455),
    new Uint8Array([...one, 0]),
  ])('rejects malformed returnedbytes and clears olddecodedstate', async (malformed) => {
    m.sign.mockReturnValue(one)
    const button = await sign()
    expect(screen.getByRole('region', { name: 'Decoded HSS signature' })).toBeInTheDocument()
    m.sign.mockReturnValue(malformed)
    fireEvent.click(button)
    expect(screen.queryByRole('region', { name: 'Decoded HSS signature' })).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to structurally decode signature')
    m.sign.mockReturnValue(two)
    fireEvent.click(button)
    expect(screen.getByRole('region', { name: 'Decoded HSS signature' })).toHaveTextContent(
      'Encoded hierarchy levels: 2'
    )
    expect(screen.queryByText(/Unable to structurally decode/)).not.toBeInTheDocument()
  })
  it('keeps actual signing errors visible and removes a priorparsedresult', async () => {
    m.sign.mockReturnValue(one)
    const button = await sign()
    m.sign.mockImplementation(() => {
      throw new Error('sample signing error')
    })
    fireEvent.click(button)
    expect(screen.getByText(/sample signing error/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Decoded HSS signature' })).not.toBeInTheDocument()
  })
})
