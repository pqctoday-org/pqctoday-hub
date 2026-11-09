// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { OpenSslLearnView } from './OpenSslLearnView'
import { useOpenSSLStore } from '../store'

const put = (name: string, length: number) =>
  useOpenSSLStore.getState().addFile({
    name,
    content: new Uint8Array(length),
    size: length,
    type: 'key',
    timestamp: Date.now(),
  })
const show = (runCommand: (cmd: string) => Promise<{ stdout: string }>) =>
  render(
    <MemoryRouter>
      <OpenSslLearnView isReady runCommand={runCommand} onTryInWorkbench={vi.fn()} />
    </MemoryRouter>
  )
const restart = () =>
  fireEvent.click(screen.getByRole('button', { name: /^L1\s*Your first keypair/ }))
const keyRow = () => within(screen.getByRole('row', { name: /Private key \(PEM\)/ }))
beforeEach(() => {
  useOpenSSLStore.getState().clearFiles()
})
afterEach(() => {
  vi.restoreAllMocks()
})

describe('Studio comparisons follow the current completed attempt', () => {
  it('retains captured lengths, resets on lesson reselection, and recomputes after a successful retry', async () => {
    let rsaLength = 1712
    const run = vi.fn(async (cmd: string) => {
      put(
        cmd.includes('RSA') ? 'learn-l1-rsa.key' : 'learn-l1-mldsa.key',
        cmd.includes('RSA') ? rsaLength : 5620
      )
      return { stdout: '' }
    })
    const view = show(run)
    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Compare')
    expect(keyRow().getByText('1712 B (RSA-2048)')).toBeInTheDocument()
    expect(keyRow().getByText('5620 B (ML-DSA-65)')).toBeInTheDocument()
    expect(
      screen.getByText(
        '2. The completed private-key comparison shows the lengths from this lesson attempt. Where do those numbers come from?'
      )
    ).toBeInTheDocument()
    put('learn-l1-rsa.key', 9999)
    view.rerender(
      <MemoryRouter>
        <OpenSslLearnView isReady runCommand={run} onTryInWorkbench={vi.fn()} />
      </MemoryRouter>
    )
    expect(keyRow().getByText('1712 B (RSA-2048)')).toBeInTheDocument()
    restart()
    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
    run.mockRejectedValueOnce(new Error('Sample engine failure'))
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: 'Retry' })
    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
    rsaLength = 1708
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByText('Compare')
    expect(keyRow().getByText('1708 B (RSA-2048)')).toBeInTheDocument()
  })

  it('renders the signature table with headers and a summary tied to it', async () => {
    const lengths = new Map([
      ['learn-l3-rsa.sig', 200],
      ['learn-l3-mldsa.sig', 500],
    ])
    const run = vi.fn(async (cmd: string) => {
      const out = /-out (\S+)/.exec(cmd)?.[1]
      if (out) put(out, lengths.get(out) ?? 64)
      return { stdout: '' }
    })
    show(run)
    fireEvent.click(screen.getByRole('button', { name: /^L3\s*Sign & verify/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    const table = await screen.findByRole('table', { name: 'Compare' })
    expect(within(table).getByRole('columnheader', { name: 'RSA-2048' })).toBeInTheDocument()
    expect(within(table).getByRole('columnheader', { name: 'ML-DSA-65' })).toBeInTheDocument()
    const row = within(within(table).getByRole('row', { name: /Signature size/ }))
    expect(row.getByRole('rowheader', { name: 'Signature size' })).toBeInTheDocument()
    expect(row.getByText('200 B (RSA-2048)')).toBeInTheDocument()
    expect(row.getByText('500 B (ML-DSA-65)')).toBeInTheDocument()
    const summary =
      'Measured signature-file ratio: ML-DSA-65 / RSA-2048 ≈ 2.5×. These configured samples are not equivalent-strength profiles.'
    expect(screen.getByText(summary)).toBeInTheDocument()
    expect(table).toHaveAccessibleDescription(summary)
  })

  it('keeps missing current output incomplete even if the command returns successfully', async () => {
    const run = vi.fn(async () => ({ stdout: '' }))
    show(run)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    await screen.findByRole('button', { name: 'Retry' })
    expect(run).toHaveBeenCalledTimes(1)
    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
    expect(screen.queryByText('Notes')).not.toBeInTheDocument()
  })

  it('cannot attach late measurement results to a reselected lesson', async () => {
    let finish!: (value: { stdout: string }) => void
    const run = vi.fn(
      () =>
        new Promise<{ stdout: string }>((resolve) => {
          finish = resolve
        })
    )
    show(run)
    fireEvent.click(screen.getByRole('button', { name: 'Run all' }))
    restart()
    expect(screen.getByRole('button', { name: 'Run all' })).toBeDisabled()
    await act(async () => {
      put('learn-l1-rsa.key', 1712)
      finish({ stdout: '' })
    })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Run all' })).toBeEnabled())
    expect(screen.queryByText('Compare')).not.toBeInTheDocument()
    expect(screen.queryByText(/1712 B PEM/)).not.toBeInTheDocument()
  })
})
