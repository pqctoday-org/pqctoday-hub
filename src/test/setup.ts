// SPDX-License-Identifier: GPL-3.0-only
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Polyfill ResizeObserver — not available in jsdom but used by tabs.tsx
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

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
