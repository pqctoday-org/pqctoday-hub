// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react'
import '@testing-library/jest-dom'
const { generate, sign, remaining, register, rawSig, hsm } = vi.hoisted(() => {
  const rawSig = new Uint8Array([0, 255, 1])
  return {
    generate: vi.fn(),
    sign: vi.fn(),
    remaining: vi.fn(),
    register: vi.fn(),
    rawSig,
    hsm: {
      isReady: true,
      moduleRef: { current: {} },
      hSessionRef: { current: 7 },
      keys: [],
      log: [],
      clearLog: vi.fn(),
      removeKey: vi.fn(),
      registerKey: vi.fn(),
    },
  }
})
vi.mock('@/hooks/useHSM', () => ({ useHSM: () => hsm }))
vi.mock('@/wasm/softhsm/pqc', () => ({
  hsm_generateStatefulKeyPair: generate,
  hsm_statefulSignBytes: sign,
  hsm_getKeysRemaining: remaining,
}))
vi.mock('@/wasm/softhsm', () => ({ hsm_extractKeyValue: () => new Uint8Array([1, 2, 3]) }))
import {
  CKM_XMSS,
  CKM_XMSSMT,
  CKM_XMSSMT_KEY_PAIR_GEN,
  CKK_XMSSMT,
  CKP_XMSSMT_SHA2_20_2_256,
  CKP_XMSSMT_SHA2_40_4_256,
  CKP_XMSSMT_SHA2_60_6_256,
} from '@/wasm/softhsm/constants'
import { XMSSKeyGenDemo } from './XMSSKeyGenDemo'
import type { UseHSMResult } from '@/hooks/useHSM'
const writeText = vi.fn()
const mount = () => render(<XMSSKeyGenDemo hsm={hsm as unknown as UseHSMResult} />)
const generateKey = async () => {
  fireEvent.click(screen.getByRole('button', { name: /^Generate XMSS Key/ }))
  await screen.findByRole('button', { name: /^Sign with CKM_/ })
}
const inspect = () => fireEvent.click(screen.getByRole('button', { name: /#0000/ }))
describe('XMSS requested context and unsupported multi-tree visualization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    generate.mockReturnValue({ privHandle: 42, pubHandle: 41 })
    sign.mockReturnValue(rawSig)
    remaining.mockReturnValue(100)
    hsm.registerKey = register
    writeText.mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })
  it.each([
    [20, 2, CKP_XMSSMT_SHA2_20_2_256],
    [40, 4, CKP_XMSSMT_SHA2_40_4_256],
    [60, 6, CKP_XMSSMT_SHA2_60_6_256],
  ])('does not decode %s/%s as the previous single-tree layout', async (height, layers, ckp) => {
    mount()
    fireEvent.click(screen.getByRole('button', { name: /^SHAKE-128/ }))
    fireEvent.click(screen.getByRole('button', { name: /^H16/ }))
    fireEvent.click(screen.getByRole('button', { name: /^XMSS\^MT/ }))
    fireEvent.click(screen.getByRole('button', { name: `${height}/${layers}` }))
    expect(screen.queryByRole('heading', { name: /Single-tree schematic/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /^vs LMS/ })).not.toBeInTheDocument()
    expect(screen.getByText('Total Tree Height')).toBeInTheDocument()
    expect(
      within(screen.getByRole('region', { name: 'Selected parameter context' })).getByText(
        'SHA-256',
        { exact: true }
      )
    ).toBeInTheDocument()
    await generateKey()
    expect(generate).toHaveBeenCalledWith(
      hsm.moduleRef.current,
      7,
      CKM_XMSSMT_KEY_PAIR_GEN,
      CKK_XMSSMT,
      ckp
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sign with CKM_XMSSMT' }))
    await screen.findByRole('button', { name: /#0000/ })
    inspect()
    expect(screen.getByText(/Requested context:/)).toHaveTextContent(
      `total height ${height}, ${layers} layer(s), CKM_XMSSMT`
    )
    expect(screen.getByText(/Multi-tree signature layout not decoded/)).toBeInTheDocument()
    expect(screen.queryByText('WOTS+σ', { exact: true })).not.toBeInTheDocument()
    expect(screen.getByText('00ff01', { exact: true })).toBeInTheDocument()
    expect(sign).toHaveBeenCalledWith(
      hsm.moduleRef.current,
      7,
      CKM_XMSSMT,
      42,
      new TextEncoder().encode('Hello, world!')
    )
    fireEvent.click(screen.getByRole('button', { name: 'Copy hex' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('00ff01'))
  })
  it('keeps the single-tree teaching legend separate from raw returned bytes', async () => {
    mount()
    await generateKey()
    fireEvent.click(screen.getByRole('button', { name: 'Sign with CKM_XMSS' }))
    await screen.findByRole('button', { name: /#0000/ })
    inspect()
    expect(
      screen.getByText(/Single-tree layout schematic for the requested set/)
    ).toHaveTextContent('not decoded or validated')
    expect(screen.getByText('00ff01', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Activity counter:')).toBeInTheDocument()
    expect(sign).toHaveBeenCalledWith(
      hsm.moduleRef.current,
      7,
      CKM_XMSS,
      42,
      new TextEncoder().encode('Hello, world!')
    )
  })
  it('retains the original requested context across an awaited prehash and later selection', async () => {
    let resolve!: (value: ArrayBuffer) => void
    const pending = new Promise<ArrayBuffer>((yes) => {
      resolve = yes
    })
    vi.stubGlobal('crypto', { subtle: { digest: vi.fn(() => pending) } })
    generate
      .mockReturnValueOnce({ privHandle: 42, pubHandle: 41 })
      .mockReturnValueOnce({ privHandle: 44, pubHandle: 43 })
    mount()
    await generateKey()
    fireEvent.click(screen.getByRole('checkbox', { name: /Pre-hash with SHA-256/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Sign with CKM_XMSS' }))
    fireEvent.click(screen.getByRole('button', { name: /^XMSS\^MT/ }))
    await generateKey()
    await act(async () => {
      resolve(new Uint8Array(32).buffer)
      await pending
    })
    await screen.findByRole('button', { name: /#0000/ })
    inspect()
    expect(screen.getByText(/Requested context:/)).toHaveTextContent('XMSS-SHA2_10_256')
    expect(screen.getByText(/Requested context:/)).toHaveTextContent(
      'total height 10, 1 layer(s), CKM_XMSS'
    )
    expect(
      screen.getByText(/Single-tree layout schematic for the requested set/)
    ).toBeInTheDocument()
    expect(sign).toHaveBeenCalledWith(hsm.moduleRef.current, 7, CKM_XMSS, 42, new Uint8Array(32))
  })
})
