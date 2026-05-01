// SPDX-License-Identifier: GPL-3.0-only
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill ResizeObserver — not available in jsdom but used by tabs.tsx
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock @tanstack/react-virtual — jsdom has no layout engine so virtualizers
// render zero items. The mock renders all items so table tests can query rows.
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: ({
    count,
    estimateSize,
  }: {
    count: number
    estimateSize: (i: number) => number
  }) => {
    const items = Array.from({ length: count }, (_, i) => ({
      index: i,
      key: i,
      start: Array.from({ length: i }, (_, j) => estimateSize(j)).reduce((a, b) => a + b, 0),
      end: Array.from({ length: i + 1 }, (_, j) => estimateSize(j)).reduce((a, b) => a + b, 0),
      size: estimateSize(i),
      lane: 0,
    }))
    const totalSize = items.reduce((sum, item) => sum + item.size, 0)
    return {
      getVirtualItems: () => items,
      getTotalSize: () => totalSize,
    }
  },
}))

// Default EmbedProvider mocks — components that call useIsEmbedded/useEmbedState
// outside an EmbedProvider (e.g. in unit tests) get safe non-embedded defaults.
vi.mock('@/embed/EmbedProvider', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/embed/EmbedProvider')>()
  return {
    ...actual,
    useEmbedState: () => ({ isEmbedded: false as const }),
    useIsEmbedded: () => false,
  }
})
