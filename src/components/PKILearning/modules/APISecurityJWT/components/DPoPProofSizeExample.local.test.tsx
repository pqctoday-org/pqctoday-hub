// SPDX-License-Identifier: AGPL-3.0-only
import { webcrypto } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { DPoPProofSizeExample } from './DPoPProofSizeExample'
import {
  DEFAULT_DPOP_SAMPLE_TARGET,
  generateDpopProofSample,
  type DpopProofSample,
} from '../dpopProofSample'

vi.mock('../dpopProofSample', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../dpopProofSample')>()
  return { ...actual, generateDpopProofSample: vi.fn(actual.generateDpopProofSample) }
})

const generate = vi.mocked(generateDpopProofSample)
let actual: DpopProofSample
beforeAll(async () => {
  vi.stubGlobal('crypto', webcrypto)
  const real = await vi.importActual<typeof import('../dpopProofSample')>('../dpopProofSample')
  actual = await real.generateDpopProofSample(DEFAULT_DPOP_SAMPLE_TARGET)
})
afterAll(() => vi.unstubAllGlobals())
beforeEach(async () => {
  const real = await vi.importActual<typeof import('../dpopProofSample')>('../dpopProofSample')
  generate.mockReset().mockImplementation(real.generateDpopProofSample)
})
function deferred<T>() {
  let settle!: (value: T) => void
  const promise = new Promise<T>((resolve) => {
    settle = resolve
  })
  return { promise, resolve: (value: T) => settle(value) }
}

// The positive case uses the actual generator/crypto. Deferred/error cases test
// the UI publication boundary; their prepared result is also an actual artifact.
describe('full DPoP proof measurement controls', () => {
  it('renders actual measured artifacts and names the historical/non-server boundary', async () => {
    render(<DPoPProofSizeExample />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate and measure full proof' }))
    const result = await screen.findByRole('region', { name: 'Measured DPoP sample results' })
    expect(within(result).getByText(/historical sample clock 2025-01-01/)).toBeInTheDocument()
    expect(within(result).getByText('Raw client public key')).toBeInTheDocument()
    expect(within(result).getByText('Encoded protected-header segment')).toBeInTheDocument()
    expect(within(result).getByText('Both field lines together')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy full proof' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Copy both HTTP field lines' })).toBeEnabled()
    expect(screen.getByText(/does not run an OAuth server/)).toBeInTheDocument()
  })

  it('clears a changed target and keeps the pending operation locked until it settles', async () => {
    const pending = deferred<DpopProofSample>()
    generate.mockImplementationOnce(() => pending.promise)
    render(<DPoPProofSizeExample />)
    const run = screen.getByRole('button', { name: 'Generate and measure full proof' })
    fireEvent.click(run)
    expect(run).toBeDisabled()
    const target = screen.getByRole('textbox', { name: 'htu sample target (no query or fragment)' })
    fireEvent.change(target, { target: { value: 'https://api.example.com/changed' } })
    expect(run).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/Target changed; waiting/)
    await act(async () => {
      pending.resolve(actual)
      await pending.promise
    })
    expect(
      screen.queryByRole('region', { name: 'Measured DPoP sample results' })
    ).not.toBeInTheDocument()
    expect(run).toBeEnabled()
    fireEvent.click(run)
    const result = await screen.findByRole('region', { name: 'Measured DPoP sample results' })
    expect(result).toHaveTextContent('https://api.example.com/changed')
    expect(generate).toHaveBeenCalledTimes(2)
  })

  it('keeps cancellation busy until actual settlement and suppresses an unmounted result', async () => {
    const pending = deferred<DpopProofSample>()
    const observed: { isCurrent?: () => boolean } = {}
    generate.mockImplementationOnce((_target, current) => {
      observed.isCurrent = current
      return pending.promise
    })
    const view = render(<DPoPProofSizeExample />)
    const run = screen.getByRole('button', { name: 'Generate and measure full proof' })
    fireEvent.click(run)
    fireEvent.click(screen.getByRole('button', { name: 'Cancel measurement' }))
    expect(run).toBeDisabled()
    expect(observed.isCurrent?.()).toBe(false)
    view.unmount()
    await act(async () => {
      pending.resolve(actual)
      await pending.promise
    })
    expect(
      screen.queryByRole('region', { name: 'Measured DPoP sample results' })
    ).not.toBeInTheDocument()
    expect(observed.isCurrent?.()).toBe(false)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('does not publish counts on failure and permits a real valid retry', async () => {
    generate.mockRejectedValueOnce(new Error('Sample signing operation failed'))
    render(<DPoPProofSizeExample />)
    const run = screen.getByRole('button', { name: 'Generate and measure full proof' })
    fireEvent.click(run)
    expect(await screen.findByRole('alert')).toHaveTextContent('Sample signing operation failed')
    expect(
      screen.queryByRole('region', { name: 'Measured DPoP sample results' })
    ).not.toBeInTheDocument()
    await waitFor(() => expect(run).toBeEnabled())
    fireEvent.click(run)
    expect(
      await screen.findByRole('region', { name: 'Measured DPoP sample results' })
    ).toBeVisible()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
