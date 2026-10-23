// SPDX-License-Identifier: AGPL-3.0-only
//
// First visit: the workbench opens with ONE family ticked (ML-KEM), so the first "Run" is a
// short run rather than the whole 71-group suite. Every family stays reachable ("All").
import { describe, it, expect, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

vi.mock('../HsmContext', async () => {
  const actual = await vi.importActual<typeof import('../HsmContext')>('../HsmContext')
  return {
    ...actual,
    useHsmContext: () => ({
      moduleRef: { current: null },
      rawModuleRef: { current: null },
      crossCheckModuleRef: { current: null },
      hSessionRef: { current: 0 },
      slotRef: { current: 0 },
      engineMode: 'rust' as const,
      setEngineMode: vi.fn(),
      phase: 'idle' as const,
      setPhase: vi.fn(),
      tokenCreated: false,
      setTokenCreated: vi.fn(),
      isReady: false,
      hsmKeys: [],
      hsmKeysRef: { current: [] },
      addHsmKey: vi.fn(),
      registerKey: vi.fn(),
      removeHsmKey: vi.fn(),
      clearHsmKeys: vi.fn(),
      addHsmLog: vi.fn(),
      addHsmStepLog: vi.fn(),
      autoInit: vi.fn().mockResolvedValue(false),
    }),
  }
})

describe('useAcvpSuite first-run selection', () => {
  it('starts with ML-KEM only', async () => {
    const { useAcvpSuite, CATEGORIES } = await import('./useAcvpSuite')
    const { result } = renderHook(() => useAcvpSuite())
    expect([...result.current.selectedCategories]).toEqual(['ml_kem'])
    expect(CATEGORIES.some((c) => c.id === 'ml_kem')).toBe(true)
  })

  it("does not leak a reader's ticks into the next visit", async () => {
    const { useAcvpSuite } = await import('./useAcvpSuite')
    const view = renderHook(() => useAcvpSuite())
    act(() => view.result.current.setSelectedCategories(new Set(['kdf', 'ml_kem'])))
    expect(view.result.current.selectedCategories.size).toBe(2)
    view.unmount()
    const { result } = renderHook(() => useAcvpSuite())
    expect([...result.current.selectedCategories]).toEqual(['ml_kem'])
  })
})
