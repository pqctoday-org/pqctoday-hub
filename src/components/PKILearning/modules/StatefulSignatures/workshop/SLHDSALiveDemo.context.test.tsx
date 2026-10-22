// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { it, expect, vi } from 'vitest'
import '@testing-library/jest-dom'
import { SLHDSALiveDemo } from './SLHDSALiveDemo'
import { hsm_slhdsaSign, hsm_slhdsaVerify } from '@/wasm/softhsm'

it('explicitly selects both modes and compares and verifies two signatures', async () => {
  vi.mocked(hsm_slhdsaSign).mockClear()
  vi.mocked(hsm_slhdsaVerify).mockClear()
  render(
    <MemoryRouter>
      <SLHDSALiveDemo />
    </MemoryRouter>
  )
  fireEvent.click(screen.getByRole('button', { name: '1. Generate Key Pair' }))
  const compare = screen.getByRole('button', { name: 'Sign twice and compare' })
  await waitFor(() => expect(compare).toBeEnabled())
  fireEvent.click(screen.getByRole('radio', { name: /Deterministic/ }))
  fireEvent.click(compare)
  await screen.findByText('Signatures: identical.')
  expect(hsm_slhdsaSign).toHaveBeenCalledTimes(2)
  expect(hsm_slhdsaVerify).toHaveBeenCalledTimes(2)
  expect(vi.mocked(hsm_slhdsaSign).mock.calls[0][4]).toMatchObject({
    deterministic: true,
    hedgedRequired: false,
  })
  fireEvent.click(screen.getByRole('radio', { name: /Hedged/ }))
  vi.mocked(hsm_slhdsaSign).mockReturnValueOnce(new Uint8Array([3]))
  vi.mocked(hsm_slhdsaSign).mockReturnValueOnce(new Uint8Array([4]))
  fireEvent.click(compare)
  await screen.findByText('Signatures: different.')
  expect(vi.mocked(hsm_slhdsaSign).mock.calls.at(-1)?.[4]).toMatchObject({
    deterministic: false,
    hedgedRequired: true,
  })
  vi.mocked(hsm_slhdsaSign).mockImplementationOnce(() => {
    throw new Error('signing unavailable')
  })
  fireEvent.click(compare)
  await waitFor(() =>
    expect(
      screen.queryByRole('region', { name: 'Signing-mode comparison' })
    ).not.toBeInTheDocument()
  )
  expect(screen.getAllByText(/signing unavailable/).length).toBeGreaterThan(0)
})

vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: {} },
    hSessionRef: { current: 1 },
    keys: [],
    log: [],
    registerKey: vi.fn(),
    clearLog: vi.fn(),
  }),
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({ LiveHSMToggle: () => null }))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/KatValidationPanel', () => ({ KatValidationPanel: () => null }))
vi.mock('@/wasm/softhsm', async (original) => ({
  ...(await original<typeof import('@/wasm/softhsm')>()),
  hsm_generateSLHDSAKeyPair: vi.fn(() => ({ pubHandle: 2, privHandle: 3 })),
  hsm_extractKeyValue: vi.fn(() => new Uint8Array([1])),
  hsm_slhdsaSign: vi.fn(() => new Uint8Array([1, 2])),
  hsm_slhdsaVerify: vi.fn(() => true),
}))

it('keeps empty defaults, forwards separate contexts and clears stale verdicts on edits/errors', async () => {
  render(
    <MemoryRouter>
      <SLHDSALiveDemo />
    </MemoryRouter>
  )
  const signing = screen.getByLabelText(/Signing context/)
  const verifying = screen.getByLabelText(/Verification context/)
  expect(signing).toHaveValue('')
  expect(verifying).toHaveValue('')
  fireEvent.click(screen.getByRole('button', { name: '1. Generate Key Pair' }))
  await waitFor(() => expect(screen.getByRole('button', { name: '2. Sign Message' })).toBeEnabled())
  fireEvent.change(signing, { target: { value: 'firmware-update' } })
  fireEvent.click(screen.getByRole('button', { name: '2. Sign Message' }))
  await waitFor(() => expect(hsm_slhdsaSign).toHaveBeenCalled())
  expect(vi.mocked(hsm_slhdsaSign).mock.calls.at(-1)?.[4]?.context).toEqual(
    new TextEncoder().encode('firmware-update')
  )
  fireEvent.change(verifying, { target: { value: 'firmware-update' } })
  fireEvent.click(screen.getByRole('button', { name: '3. Verify Signature' }))
  await screen.findByText('Signature Valid')
  fireEvent.change(verifying, { target: { value: 'document-signing' } })
  expect(screen.queryByText('Signature Valid')).not.toBeInTheDocument()
  vi.mocked(hsm_slhdsaVerify).mockReturnValueOnce(false)
  fireEvent.click(screen.getByRole('button', { name: '3. Verify Signature' }))
  await screen.findByText('Signature Invalid')
  expect(vi.mocked(hsm_slhdsaVerify).mock.calls.at(-1)?.[5]?.context).toEqual(
    new TextEncoder().encode('document-signing')
  )
  vi.mocked(hsm_slhdsaVerify).mockImplementationOnce(() => {
    throw new Error('engine unavailable')
  })
  fireEvent.click(screen.getByRole('button', { name: '3. Verify Signature' }))
  await waitFor(() => expect(screen.queryByText('Signature Invalid')).not.toBeInTheDocument())
  expect(screen.getAllByText(/engine unavailable/).length).toBeGreaterThan(0)
})
