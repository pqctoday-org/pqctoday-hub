// SPDX-License-Identifier: AGPL-3.0-only
import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useHSM } from './useHSM'

const engine = vi.hoisted(() => ({
  _C_Initialize: vi.fn(() => 0),
  _C_CloseSession: vi.fn(() => 0),
}))
const load = vi.hoisted(() => vi.fn(() => Promise.resolve(engine)))
const openSession = vi.hoisted(() => vi.fn(() => 7))

vi.mock('../wasm/softhsm', () => ({
  getSoftHSMRustModule: load,
  getSoftHSMCppModule: load,
  createLoggingProxy: (module: typeof engine) => module,
  hsm_getFirstFreeSlot: () => 1,
  hsm_getFirstInitializedSlot: () => 1,
  hsm_initToken: () => 1,
  hsm_openUserSession: openSession,
}))

describe('useHSM session lifetime', () => {
  beforeEach(() => {
    load.mockReset().mockResolvedValue(engine)
    openSession.mockReset().mockReturnValue(7)
    engine._C_CloseSession.mockClear()
  })

  it('coalesces overlapping initialization calls and only closes sessions owned by that hook', async () => {
    openSession.mockReturnValueOnce(7).mockReturnValueOnce(8)
    const { result: first, unmount: unmountFirst } = renderHook(() => useHSM())
    const { result: second, unmount: unmountSecond } = renderHook(() => useHSM())
    await act(async () => {
      await Promise.all([first.current.initialize(), first.current.initialize()])
      await second.current.initialize()
    })
    expect(openSession).toHaveBeenCalledTimes(2)
    expect(second.current.hSessionRef.current).toBe(8)

    unmountFirst()
    expect(engine._C_CloseSession.mock.calls).toEqual([[7]])
    expect(second.current.isReady).toBe(true)
    unmountSecond()
    expect(engine._C_CloseSession.mock.calls).toEqual([[7], [8]])
  })

  it('does not open a session when the engine finishes loading after unmount', async () => {
    const { result, unmount } = renderHook(() => useHSM())
    let finishLoading: ((module: typeof engine) => void) | undefined
    load.mockReturnValueOnce(
      new Promise((resolve) => {
        finishLoading = resolve
      })
    )
    let operation: Promise<void> | undefined
    act(() => {
      operation = result.current.initialize()
    })
    expect(result.current.phase).toBe('loading')
    unmount()
    await act(async () => {
      finishLoading?.(engine)
      await operation
    })
    expect(openSession).not.toHaveBeenCalled()
  })

  it('lets a new attempt open a session after cancelling an earlier pending initialization', async () => {
    const { result } = renderHook(() => useHSM())
    let finishLoading: ((module: typeof engine) => void) | undefined
    load.mockReturnValueOnce(
      new Promise((resolve) => {
        finishLoading = resolve
      })
    )
    let cancelled: Promise<void> | undefined
    act(() => {
      cancelled = result.current.initialize()
    })
    act(() => result.current.finalize())
    await act(async () => {
      await result.current.initialize()
      finishLoading?.(engine)
      await cancelled
    })
    expect(openSession).toHaveBeenCalledTimes(1)
    expect(result.current.hSessionRef.current).toBe(7)
  })
})
