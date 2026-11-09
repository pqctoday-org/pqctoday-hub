// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MeasuredChainExample } from './MeasuredChainExample'
import { openSSLService } from '@/services/crypto/OpenSSLService'
import type { OpenSSLCommandResult } from '@/services/crypto/OpenSSLService'

vi.mock('@/services/crypto/OpenSSLService', () => ({
  openSSLService: { execute: vi.fn(), deleteFile: vi.fn() },
}))
beforeEach(() => {
  vi.mocked(openSSLService.execute).mockReset()
  vi.mocked(openSSLService.deleteFile).mockResolvedValue(undefined)
})

function page() {
  const onBusyChange = vi.fn(),
    onInspect = vi.fn()
  const view = render(<MeasuredChainExample onBusyChange={onBusyChange} onInspect={onInspect} />)
  return { ...view, onBusyChange, onInspect }
}

describe('Measured chain sample controller', () => {
  it('reports an actual operation rejection without results and permits a retry', async () => {
    vi.mocked(openSSLService.execute).mockRejectedValue(new Error('sample engine unavailable'))
    const view = page()
    fireEvent.click(screen.getByRole('button', { name: 'Generate measured sample chains' }))
    await screen.findByText('sample engine unavailable')
    expect(
      screen.queryByRole('region', { name: 'Measured certificate-chain results' })
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate measured sample chains' })).toBeEnabled()
    fireEvent.click(screen.getByRole('button', { name: 'Generate measured sample chains' }))
    await waitFor(() => expect(openSSLService.execute).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(view.onBusyChange).toHaveBeenLastCalledWith(false))
    expect(view.onInspect).not.toHaveBeenCalled()
  })
  it('keeps busy until a canceled await settles and never starts a dependent command', async () => {
    let resolve!: (value: OpenSSLCommandResult) => void
    vi.mocked(openSSLService.execute).mockReturnValue(
      new Promise((done) => {
        resolve = done
      })
    )
    const view = page()
    fireEvent.click(screen.getByRole('button', { name: 'Generate measured sample chains' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancel sample generation' }))
    expect(
      screen.getByRole('button', { name: 'Generating and checking sample chains…' })
    ).toBeDisabled()
    expect(
      screen.queryByRole('region', { name: 'Measured certificate-chain results' })
    ).not.toBeInTheDocument()
    expect(view.onBusyChange).not.toHaveBeenLastCalledWith(false)
    resolve({ stdout: '', stderr: '', files: [] })
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Generate measured sample chains' })).toBeEnabled()
    )
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
    expect(view.onBusyChange).toHaveBeenLastCalledWith(false)
  })
  it('does not publish or start a dependent command after unmount', async () => {
    let resolve!: (value: OpenSSLCommandResult) => void
    vi.mocked(openSSLService.execute).mockReturnValue(
      new Promise((done) => {
        resolve = done
      })
    )
    const view = page()
    fireEvent.click(screen.getByRole('button', { name: 'Generate measured sample chains' }))
    view.unmount()
    resolve({ stdout: '', stderr: '', files: [] })
    await waitFor(() => expect(openSSLService.deleteFile).toHaveBeenCalled())
    expect(openSSLService.execute).toHaveBeenCalledTimes(1)
    expect(view.onInspect).not.toHaveBeenCalled()
    expect(view.onBusyChange).not.toHaveBeenLastCalledWith(false)
  })
})
