// SPDX-License-Identifier: GPL-3.0-only
/**
 * Phone product sheet: if the on-demand maintainers list cannot be fetched (a tab left open across a
 * release, or no connection), the sheet stays and only the list is left out, not the whole screen.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'

vi.mock('@/components/Migrate/Workbench/ProductMaintainers', () => {
  throw new Error('Failed to fetch dynamically imported module')
})

import { MobileMigrateView } from './MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'

const product = softwareData.find((p) => (p.openSourceMaintainers?.length ?? 0) > 0)!

describe('MobileMigrateView — the maintainers list cannot be loaded', () => {
  const realLocation = window.location

  beforeEach(() => {
    window.localStorage.clear()
    sessionStorage.clear()
    useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
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

  it('keeps the product sheet and leaves the list out, without the error screen', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    render(
      <MemoryRouter initialEntries={[`/migrate?product=${encodeURIComponent(product.productId)}`]}>
        <MobileMigrateView />
      </MemoryRouter>
    )
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10_000)
    })
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('optional section could not be shown'),
      expect.anything(),
      expect.anything()
    )
    expect(screen.getByTestId('migrate-product-detail-sheet')).toBeInTheDocument()
    expect(screen.queryByText(/something went wrong/i)).toBeNull()
    expect(screen.queryByTestId('product-maintainers')).toBeNull()
  })
})
