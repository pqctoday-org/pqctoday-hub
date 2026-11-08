// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ProviderPatternWorkshop } from './ProviderPatternWorkshop'

const sample = vi.hoisted(() => ({
  module: { sample: true },
  keygen: vi.fn(() => ({ pubHandle: 11, privHandle: 12 })),
  extract: vi.fn(() => new Uint8Array([1, 2, 3])),
  list: vi.fn(() => [0x0f, 0x17, 0x2d, 0x403b, 0x80001234]),
  info: vi.fn(),
  registerKey: vi.fn(),
  clearLog: vi.fn(),
}))
vi.mock('@/hooks/useHSM', () => ({
  useHSM: () => ({
    isReady: true,
    moduleRef: { current: sample.module },
    hSessionRef: { current: 7 },
    slotRef: { current: 3 },
    keys: [],
    log: [],
    registerKey: sample.registerKey,
    clearLog: sample.clearLog,
  }),
}))
vi.mock('@/wasm/softhsm', () => ({
  hsm_generateMLDSAKeyPair: sample.keygen,
  hsm_extractKeyValue: sample.extract,
  hsm_getMechanismList: sample.list,
  hsm_getMechanismInfo: sample.info,
}))
vi.mock('@/components/shared/LiveHSMToggle', () => ({
  LiveHSMToggle: ({ operations }: { operations: string[] }) => (
    <p aria-label="Advertised sample operations">{operations.join(', ')}</p>
  ),
}))
vi.mock('@/components/shared/Pkcs11LogPanel', () => ({ Pkcs11LogPanel: () => null }))
vi.mock('@/components/shared/HsmKeyInspector', () => ({ HsmKeyInspector: () => null }))

beforeEach(() => {
  vi.clearAllMocks()
  sample.keygen.mockReturnValue({ pubHandle: 11, privHandle: 12 })
  sample.list.mockReturnValue([0x0f, 0x17, 0x2d, 0x403b, 0x80001234])
})

it('keeps actual generation/list arguments and labels only the selected example subset', async () => {
  render(<ProviderPatternWorkshop />)
  expect(screen.getByLabelText('Advertised sample operations')).not.toHaveTextContent(
    'C_GetMechanismInfo'
  )
  expect(screen.getByText(/It does not execute C_GetMechanismInfo/)).toBeVisible()
  fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
  expect(await screen.findByText(/returned 5 IDs/)).toBeVisible()
  expect(sample.keygen).toHaveBeenCalledWith(sample.module, 7, 65)
  expect(sample.list).toHaveBeenCalledWith(sample.module, 3)
  expect(sample.info).not.toHaveBeenCalled()
  expect(screen.getByText(/six-ID subset, not complete capability/)).toHaveTextContent(
    '0x000f, 0x0017, 0x002d'
  )
  expect(screen.getByText(/six-ID subset, not complete capability/)).not.toHaveTextContent('0x403b')
  expect(screen.getByText(/list presence alone/)).toHaveTextContent(
    /does not establish that an operation will succeed/
  )
})

it('does not interpret an empty helper result as proof of no provider support', async () => {
  sample.list.mockReturnValue([])
  render(<ProviderPatternWorkshop />)
  fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
  expect(await screen.findByText(/returned 0 IDs/)).toHaveTextContent(
    'does not establish no support'
  )
  expect(screen.getByText(/An empty helper result/)).toHaveTextContent('query failure')
  expect(screen.getByText(/six-ID subset, not complete capability/)).toHaveTextContent(
    'none returned from this subset'
  )
})

it('does not call a filtered-out returned mechanism unsupported', async () => {
  sample.list.mockReturnValue([0x403b])
  render(<ProviderPatternWorkshop />)
  fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
  expect(await screen.findByText(/returned 1 IDs/)).toBeVisible()
  expect(screen.getByText(/six-ID subset, not complete capability/)).toHaveTextContent(
    'none returned from this subset'
  )
  expect(screen.queryByText(/unsupported mechanism/i)).not.toBeInTheDocument()
})

it('preserves an actual thrown sample-operation error instead of reporting a list outcome', async () => {
  sample.keygen.mockImplementationOnce(() => {
    throw new Error('fictional operation failed')
  })
  render(<ProviderPatternWorkshop />)
  fireEvent.click(screen.getByRole('button', { name: 'Execute (Live WASM)' }))
  expect(await screen.findByText('fictional operation failed')).toBeVisible()
  expect(sample.list).not.toHaveBeenCalled()
  expect(screen.queryByText(/C_GetMechanismList helper\(slot/)).not.toBeInTheDocument()
})

it('distinguishes shared business intent from API-specific migration requirements', () => {
  render(<ProviderPatternWorkshop />)
  const heading = screen.getByRole('heading', {
    name: 'Key Insight: Separate Business Intent from Algorithm Details',
  })
  const footer = heading.parentElement!
  expect(footer).toHaveTextContent('others instantiate algorithm classes directly')
  expect(footer).toHaveTextContent('parameters, key types and storage, signatures and wire formats')
  expect(footer).toHaveTextContent('identifiers, and peer support')
  expect(footer).toHaveTextContent('do not establish a drop-in migration')
  expect(footer).not.toHaveTextContent('only thing that changes')
  expect(
    screen.getByText('Direct class instantiation — no provider registration needed')
  ).toBeVisible()
  expect(screen.getByRole('button', { name: 'Execute (Live WASM)' })).toBeEnabled()
  expect(sample.keygen).not.toHaveBeenCalled()
  expect(sample.list).not.toHaveBeenCalled()
})
