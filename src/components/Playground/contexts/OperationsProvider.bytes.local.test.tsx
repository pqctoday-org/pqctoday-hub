// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationsProvider } from './OperationsProvider'
import { useOperationsContext } from './OperationsContext'
import { SignVerifyTab } from '../tabs/SignVerifyTab'
import { sign, verify } from '@/wasm/liboqs_dsa'
import type { OperationsContextType } from './types'

vi.mock('./SettingsContext', () => ({
  useSettingsContext: () => ({
    algorithm: 'ML-DSA-65',
    executionMode: 'wasm',
    wasmLoaded: true,
    setLoading: vi.fn(),
    setError: vi.fn(),
    addLog: vi.fn(),
    loading: false,
  }),
}))
vi.mock('./KeyStoreContext', () => ({
  useKeyStoreContext: () => ({
    keyStore: [
      {
        id: 'sk-sample',
        name: 'Sample private',
        algorithm: 'ML-DSA-65',
        type: 'private',
        data: new Uint8Array([1]),
      },
      {
        id: 'pk-sample',
        name: 'Sample public',
        algorithm: 'ML-DSA-65',
        type: 'public',
        data: new Uint8Array([2]),
      },
    ],
    selectedSignKeyId: 'sk-sample',
    selectedVerifyKeyId: 'pk-sample',
    setSelectedSignKeyId: vi.fn(),
    setSelectedVerifyKeyId: vi.fn(),
  }),
}))
vi.mock('@/wasm/liboqs_dsa', () => ({ sign: vi.fn(), verify: vi.fn() }))
vi.mock('../hooks/useKemOperations', () => ({
  useKemOperations: () => ({ runKemOperation: vi.fn() }),
}))
vi.mock('../hooks/useSymmetricOperations', () => ({
  useSymmetricOperations: () => ({ runSymmetricOperation: vi.fn() }),
}))

let operations: OperationsContextType
const Probe = () => {
  const current = useOperationsContext()
  useEffect(() => {
    operations = current
  }, [current])
  return <SignVerifyTab />
}
const show = () =>
  render(
    <OperationsProvider>
      <Probe />
    </OperationsProvider>
  )
beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(sign).mockResolvedValue(new Uint8Array([1, 2]))
  vi.mocked(verify).mockResolvedValue(true)
})
describe('signature message bytes and result validity', () => {
  it('signs exactly the entered hex bytes, including invalid UTF-8', async () => {
    show()
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch Message to Sign (Input) to HEX view' })
    )
    fireEvent.change(screen.getByLabelText('Message to Sign (Input)'), { target: { value: 'ff' } })
    fireEvent.click(screen.getByRole('button', { name: 'Sign Message' }))
    await waitFor(() => expect(sign).toHaveBeenCalled())
    expect(Array.from(vi.mocked(sign).mock.calls[0][0])).toEqual([255])
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch Message to Sign (Input) to UTF-8 text view' })
    )
    expect(screen.getAllByText(/These bytes are not valid UTF-8/).length).toBeGreaterThan(0)
    expect(Array.from(operations.dataToSignBytes!)).toEqual([255])
  })
  it('does not sign an incomplete visible hex draft', () => {
    show()
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch Message to Sign (Input) to HEX view' })
    )
    fireEvent.change(screen.getByLabelText('Message to Sign (Input)'), { target: { value: 'f' } })
    expect(screen.getByRole('button', { name: 'Sign Message' })).toBeDisabled()
    expect(sign).not.toHaveBeenCalled()
  })
  it('uses UTF-8 for text and clears a previous validity result after edits', async () => {
    show()
    act(() => operations.setDataToSign('é'))
    await act(async () => operations.runOperation('sign'))
    expect(Array.from(vi.mocked(sign).mock.calls[0][0])).toEqual([0xc3, 0xa9])
    await act(async () => operations.runOperation('verify'))
    expect(operations.verificationResult).toBe(true)
    act(() => operations.setDataToSign('edited'))
    expect(operations.verificationResult).toBeNull()
  })
})
