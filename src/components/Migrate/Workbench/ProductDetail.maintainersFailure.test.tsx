// SPDX-License-Identifier: GPL-3.0-only
/**
 * The maintainers list is loaded on demand. If its code cannot be fetched (a tab left open across a
 * release, or no connection), the product view must stay and only the list is left out, not be
 * replaced by the page-level error screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('./ProductMaintainers', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

import { ProductDetail } from './ProductDetail'
import { softwareData } from '@/data/migrateData'

const product = softwareData.find((p) => (p.openSourceMaintainers?.length ?? 0) > 0)!

describe('ProductDetail — the maintainers list cannot be loaded', () => {
  const realLocation = window.location

  beforeEach(() => {
    sessionStorage.clear()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    // The loader reloads the page once when its retries run out; do not navigate the test window.
    Object.defineProperty(window, 'location', {
      value: { ...realLocation, reload: vi.fn() },
      writable: true,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'location', { value: realLocation, writable: true })
    vi.restoreAllMocks()
  })

  it('keeps the product view and leaves the list out, without the error screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <MemoryRouter>
        <ProductDetail product={product} />
      </MemoryRouter>
    )
    // Run out the loader's retries (1 s, 2 s, 4 s) so the failure reaches the section.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('optional section could not be shown'),
      expect.anything(),
      expect.anything()
    )
    expect(screen.queryByText(/something went wrong/i)).toBeNull()
    expect(screen.queryByTestId('product-maintainers')).toBeNull()
    // the rest of the product view is still there
    expect(screen.getByText(/verification status/i)).toBeInTheDocument()
  })
})
