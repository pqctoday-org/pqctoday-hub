// SPDX-License-Identifier: AGPL-3.0-only
import { useEffect } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { OperationsProvider } from './OperationsProvider'
import { useOperationsContext } from './OperationsContext'
import { SignVerifyTab } from '../tabs/SignVerifyTab'
import type { OperationsContextType } from './types'
import type { Key } from '@/types'
import { sign, verify } from '@/wasm/liboqs_dsa'

const fixture = vi.hoisted(() => ({
  algorithm: 'ML-DSA-65',
  executionMode: 'wasm',
  selectedVerifyKeyId: 'pk-sample',
  setError: vi.fn(),
  setLoading: vi.fn(),
  addLog: vi.fn(),
}))
const keys: Key[] = [
  {
    id: 'sk-sample',
    name: 'Sample private',
    algorithm: 'ML-DSA-65',
    type: 'private',
    value: '',
    timestamp: 0,
    data: new Uint8Array([1]),
  },
  {
    id: 'pk-sample',
    name: 'Sample public',
    algorithm: 'ML-DSA-65',
    type: 'public',
    value: '',
    timestamp: 0,
    data: new Uint8Array([2]),
  },
  {
    id: 'pk-other',
    name: 'Other public',
    algorithm: 'ML-DSA-65',
    type: 'public',
    value: '',
    timestamp: 0,
    data: new Uint8Array([3]),
  },
]
vi.mock('./SettingsContext', () => ({
  useSettingsContext: () => ({ ...fixture, wasmLoaded: true, loading: false }),
}))
vi.mock('./KeyStoreContext', () => ({
  useKeyStoreContext: () => ({
    keyStore: keys,
    selectedSignKeyId: 'sk-sample',
    selectedVerifyKeyId: fixture.selectedVerifyKeyId,
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
function Probe() {
  const current = useOperationsContext()
  useEffect(() => {
    operations = current
  }, [current])
  return <SignVerifyTab />
}
const tree = () => (
  <OperationsProvider>
    <Probe />
  </OperationsProvider>
)
function expectVerifyBytes(signature: number[], key: Uint8Array) {
  const calls = vi.mocked(verify).mock.calls
  expect(calls.length).toBeGreaterThan(0)
  const actual = calls[calls.length - 1]
  expect(actual).toHaveLength(3)
  // Compare exact bytes across the jsdom and Node typed-array realms.
  expect(Array.from(actual[0])).toEqual(signature)
  expect(Array.from(actual[1])).toEqual(
    Array.from(new TextEncoder().encode('Hello Quantum World!'))
  )
  expect(actual[2]).toBe(key)
}
async function establishValid() {
  await act(async () => {
    await operations.runOperation('sign')
  })
  await act(async () => {
    await operations.runOperation('verify')
  })
  expectVerifyBytes([1, 2], keys[1].data as Uint8Array)
  expect(operations.verificationResult).toBe(true)
  expect(screen.getByText('VERIFICATION OK')).toBeVisible()
}
function expectUnverified() {
  expect(operations.verificationResult).toBeNull()
  expect(screen.queryByText('VERIFICATION OK')).not.toBeInTheDocument()
  expect(screen.queryByText('VERIFICATION FAILED')).not.toBeInTheDocument()
}
beforeEach(() => {
  vi.clearAllMocks()
  fixture.algorithm = 'ML-DSA-65'
  fixture.executionMode = 'wasm'
  fixture.selectedVerifyKeyId = 'pk-sample'
  vi.mocked(sign).mockResolvedValue(new Uint8Array([1, 2]))
  vi.mocked(verify).mockResolvedValue(true)
})

describe('software verification result ownership', () => {
  it('withdraws VALID when the visible signature input changes, and verifies the changed bytes on retry', async () => {
    render(tree())
    await establishValid()
    fireEvent.click(screen.getByRole('button', { name: 'Switch Signature (Input) to HEX view' }))
    fireEvent.change(screen.getByLabelText('Signature (Input)'), { target: { value: '0304' } })
    expectUnverified()
    vi.mocked(verify).mockResolvedValueOnce(false)
    await act(async () => {
      await operations.runOperation('verify')
    })
    expectVerifyBytes([3, 4], keys[1].data as Uint8Array)
    expect(operations.verificationResult).toBe(false)
    expect(screen.getByText('VERIFICATION FAILED')).toBeVisible()
  })

  it('withdraws VALID for a different selected public key and checks that key on retry', async () => {
    const view = render(tree())
    await establishValid()
    fixture.selectedVerifyKeyId = 'pk-other'
    view.rerender(tree())
    expectUnverified()
    vi.mocked(verify).mockResolvedValueOnce(false)
    await act(async () => {
      await operations.runOperation('verify')
    })
    expectVerifyBytes([1, 2], keys[2].data as Uint8Array)
    expect(operations.verificationResult).toBe(false)
    expect(screen.getByText('VERIFICATION FAILED')).toBeVisible()
  })

  it('withdraws VALID after the algorithm selection changes without claiming a check ran', async () => {
    const view = render(tree())
    await establishValid()
    fixture.algorithm = 'ML-DSA-87'
    view.rerender(tree())
    expectUnverified()
    expect(verify).toHaveBeenCalledTimes(1)
  })

  it('withdraws VALID immediately on a new sign attempt, including while signing is pending', async () => {
    render(tree())
    await establishValid()
    let resolveSign!: (value: Uint8Array) => void
    vi.mocked(sign).mockImplementationOnce(
      () =>
        new Promise<Uint8Array>((resolve) => {
          resolveSign = resolve
        })
    )
    let pending!: Promise<void>
    act(() => {
      pending = operations.runOperation('sign')
    })
    expectUnverified()
    expect(fixture.setLoading).toHaveBeenLastCalledWith(true)
    await act(async () => {
      resolveSign(new Uint8Array([5, 6]))
      await pending
    })
    expect(operations.signature).toBe('0506')
    expectUnverified()
    expect(verify).toHaveBeenCalledTimes(1)
  })

  it('does not retain VALID when verification throws, and a subsequent successful retry can verify again', async () => {
    render(tree())
    await establishValid()
    vi.mocked(verify).mockRejectedValueOnce(new Error('Controlled verification failure'))
    await act(async () => {
      await operations.runOperation('verify')
    })
    expectUnverified()
    expect(fixture.setError).toHaveBeenLastCalledWith('Controlled verification failure')
    expect(fixture.setLoading).toHaveBeenLastCalledWith(false)
    await act(async () => {
      await operations.runOperation('verify')
    })
    expect(operations.verificationResult).toBe(true)
    expect(screen.getByText('VERIFICATION OK')).toBeVisible()
    expect(fixture.setError).toHaveBeenLastCalledWith(null)
  })
})
