// SPDX-License-Identifier: GPL-3.0-only
import '@testing-library/jest-dom'

// Polyfill ResizeObserver — not available in jsdom but used by tabs.tsx
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
