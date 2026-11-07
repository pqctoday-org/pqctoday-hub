// SPDX-License-Identifier: AGPL-3.0-only
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LmsConfig } from './LmsConfig'
import { useOpenSSLStore } from '../../store'
const operation = vi.hoisted(() => ({ sign: vi.fn() }))
vi.mock('../../../../wasm/LmsService', () => ({ lmsService: { sign: operation.sign } }))
const addFile = useOpenSSLStore.getState().addFile
const props = {
  mode: 'sign' as const,
  setMode: vi.fn(),
  lmsKeyFile: 'sample.key',
  setLmsKeyFile: vi.fn(),
  lmsSigFile: '',
  setLmsSigFile: vi.fn(),
  lmsDataFile: 'sample.txt',
  setLmsDataFile: vi.fn(),
}
const result = { signature: Uint8Array.of(7, 8, 9), updatedPrivateKey: Uint8Array.of(10, 11, 12) }
const show = () =>
  render(
    <MemoryRouter>
      <LmsConfig {...props} />
    </MemoryRouter>
  )
beforeEach(() => {
  vi.clearAllMocks()
  useOpenSSLStore.getState().resetStore()
  useOpenSSLStore.setState({ addFile })
  addFile({
    name: 'sample.key',
    type: 'binary',
    content: Uint8Array.of(4, 5, 6),
    size: 3,
    timestamp: 1,
  })
  addFile({ name: 'sample.txt', type: 'text', content: 'sample message', size: 14, timestamp: 1 })
  operation.sign.mockResolvedValue(result)
})
afterEach(() => {
  act(() => {
    useOpenSSLStore.setState({ addFile })
    useOpenSSLStore.getState().resetStore()
  })
})
describe('LMS signing form serializes requests and consumes current saved state', () => {
  it('keeps one request in flight and disables signing and mode changes', async () => {
    let finish!: (value: typeof result) => void
    operation.sign.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finish = resolve
        })
    )
    show()
    const button = screen.getByRole('button', { name: 'Sign Selected Data File' })
    fireEvent.click(button)
    fireEvent.click(button)
    await waitFor(() => expect(operation.sign).toHaveBeenCalledTimes(1))
    expect(screen.getByRole('button', { name: 'Signing sample…' })).toBeDisabled()
    expect(screen.getByTestId('lms-mode-generate')).toBeDisabled()
    await act(async () => {
      finish(result)
    })
    expect(await screen.findByRole('button', { name: 'Sign Selected Data File' })).toBeEnabled()
    const files = useOpenSSLStore.getState().files
    expect(files.findIndex((file) => file.name === 'sample.key')).toBeLessThan(
      files.findIndex((file) => file.name.endsWith('.sig'))
    )
  })
  it('passes the updated key bytes to the next request instead of the old file state', async () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
    await waitFor(() => expect(props.setLmsSigFile).toHaveBeenCalledTimes(1))
    expect(Array.from(operation.sign.mock.calls[0][0])).toEqual([4, 5, 6])
    fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
    await waitFor(() => expect(props.setLmsSigFile).toHaveBeenCalledTimes(2))
    expect(operation.sign).toHaveBeenCalledTimes(2)
    expect(Array.from(operation.sign.mock.calls[1][0])).toEqual([10, 11, 12])
  })
  it('shows an operational error without publishing a signature or claiming a state update', async () => {
    operation.sign.mockRejectedValue(new Error('sample signing failed'))
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('sample signing failed')
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Do not assume an earlier saved key state is safe to retry'
    )
    expect(props.setLmsSigFile).not.toHaveBeenCalled()
    expect(useOpenSSLStore.getState().files.some((file) => file.name.endsWith('.sig'))).toBe(false)
  })
  it('does not use a key removed while the signing module was loading', async () => {
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
    act(() => useOpenSSLStore.getState().removeFile('sample.key'))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Private key file sample.key not found'
    )
    expect(operation.sign).not.toHaveBeenCalled()
  })
  it('does not publish the signature when saving the updated browser-session key fails', async () => {
    useOpenSSLStore.setState({
      addFile: () => {
        throw new Error('sample file update failed')
      },
    })
    show()
    fireEvent.click(screen.getByRole('button', { name: 'Sign Selected Data File' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('sample file update failed')
    expect(props.setLmsSigFile).not.toHaveBeenCalled()
    expect(useOpenSSLStore.getState().files.some((file) => file.name.endsWith('.sig'))).toBe(false)
  })
})
