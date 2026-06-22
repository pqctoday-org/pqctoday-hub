// SPDX-License-Identifier: GPL-3.0-only
import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'

// Polyfill localStorage / sessionStorage with a real in-memory Storage.
// Node 22+ (and notably Node 26 on dev machines) ships a native global
// `localStorage` that is UNAVAILABLE unless the runtime is started with
// `--localstorage-file`. That broken native getter shadows jsdom's
// `window.localStorage`, so `createJSONStorage(() => localStorage)` resolves to
// `undefined` and every persisted Zustand store throws
// "Cannot read properties of undefined (reading 'getItem')" on rehydration.
// Installing a deterministic in-memory implementation makes the test suite
// independent of the host Node version.
class MemoryStorage {
  private store = new Map<string, string>()
  get length(): number {
    return this.store.size
  }
  clear(): void {
    this.store.clear()
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

// Expose the class as the global `Storage` constructor so its methods live on
// `Storage.prototype`. Tests spy via `vi.spyOn(Storage.prototype, 'setItem')`,
// and instance calls (`localStorage.setItem(...)`) route through that prototype,
// so the spies intercept them.
for (const target of [globalThis, typeof window !== 'undefined' ? window : undefined]) {
  if (target) {
    Object.defineProperty(target, 'Storage', {
      value: MemoryStorage,
      writable: true,
      configurable: true,
    })
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  const storage = new MemoryStorage() as unknown as Storage
  Object.defineProperty(globalThis, name, { value: storage, writable: true, configurable: true })
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, name, { value: storage, writable: true, configurable: true })
  }
}

// Keep tests isolated: a persisted store written in one test must not leak into
// the next. Clear web storage after every test.
afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

// Polyfill ResizeObserver — not available in jsdom but used by tabs.tsx
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Polyfill IntersectionObserver — not available in jsdom but used by
// LearnStepper / InPageToc (active-section scroll-spy) and rendered by several
// learn-module Introductions.
global.IntersectionObserver = class IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
} as unknown as typeof IntersectionObserver

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
