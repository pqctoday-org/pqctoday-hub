// SPDX-License-Identifier: GPL-3.0-only
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Deterministic Web Storage for tests, identical across Node/jsdom versions.
// Two version-dependent traps otherwise break every persisted-store test:
//   1. jsdom refuses localStorage on opaque origins, and Node 22+ ships an
//      experimental global `localStorage` that is unavailable without
//      `--localstorage-file` and shadows jsdom's — so zustand's persist
//      middleware (which reads a bare `localStorage`) throws on hydration and
//      hundreds of store-backed tests fail, even though CI (Node 20) is green.
//   2. A plain-object shim would fix (1) but break tests that do
//      `vi.spyOn(Storage.prototype, 'setItem')`, because its prototype isn't
//      `Storage.prototype`.
// Installing ONE real Storage class as the global constructor *and* the backing
// for both storage instances fixes both: storage works everywhere, and
// `Object.getPrototypeOf(localStorage) === Storage.prototype`, so prototype
// spies still intercept.
class MemoryStorage {
  private store = new Map<string, string>()
  get length() {
    return this.store.size
  }
  clear() {
    this.store.clear()
  }
  getItem(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value))
  }
  removeItem(key: string) {
    this.store.delete(key)
  }
  key(index: number) {
    return Array.from(this.store.keys())[index] ?? null
  }
}

function installStorage(name: 'Storage' | 'localStorage' | 'sessionStorage', value: unknown) {
  Object.defineProperty(globalThis, name, { value, configurable: true, writable: true })
}

installStorage('Storage', MemoryStorage)
installStorage('localStorage', new MemoryStorage())
installStorage('sessionStorage', new MemoryStorage())

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
