// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 2 (2026-09-29): `?prod=<productId>` expands a Products row.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ProductsTab } from './ProductsTab'
import { buildProductRows, productKey } from './productsModel'
import { certsByProduct } from '@/data/certificationXrefData'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

const ROWS = buildProductRows(certsByProduct)
const TARGET = ROWS[1]
const KEY = productKey(TARGET)

const rowButton = (name: string) =>
  screen
    .getAllByRole('button', { expanded: undefined })
    .find((b) => b.hasAttribute('aria-expanded') && b.textContent?.includes(name))!

describe('ProductsTab ?prod=', () => {
  beforeEach(() => {
    useMigrateSelectionStore.setState({ myProducts: [] })
  })

  it('expands the linked product and marks it as the deep-link target', () => {
    render(<ProductsTab openProductId={KEY} />)
    expect(rowButton(TARGET.softwareName)).toHaveAttribute('aria-expanded', 'true')
    expect(rowButton(TARGET.softwareName).closest('li')).toHaveAttribute('data-deeplink-id', KEY)
    expect(screen.queryByTestId(/deeplink-notice/)).not.toBeInTheDocument()
  })

  it('expanding pushes the product, collapsing it clears the param', () => {
    const onOpen = vi.fn()
    const onClose = vi.fn()
    const { rerender } = render(
      <ProductsTab openProductId={null} onOpenProduct={onOpen} onCloseProduct={onClose} />
    )
    fireEvent.click(rowButton(TARGET.softwareName))
    expect(onOpen).toHaveBeenCalledWith(KEY)
    rerender(<ProductsTab openProductId={KEY} onOpenProduct={onOpen} onCloseProduct={onClose} />)
    fireEvent.click(rowButton(TARGET.softwareName))
    expect(onClose).toHaveBeenCalled()
  })

  it('collapses the row when the param goes away (Back)', () => {
    const { rerender } = render(<ProductsTab openProductId={KEY} />)
    expect(rowButton(TARGET.softwareName)).toHaveAttribute('aria-expanded', 'true')
    rerender(<ProductsTab openProductId={null} />)
    expect(rowButton(TARGET.softwareName)).toHaveAttribute('aria-expanded', 'false')
  })

  it('widens the inventory view for a product the reader does not own, with Undo', () => {
    const other = ROWS.find((r) => r !== TARGET)!
    useMigrateSelectionStore.setState({ myProducts: [other.productId] })
    render(<ProductsTab openProductId={KEY} />)
    expect(screen.getByTestId('deeplink-notice-widened')).toHaveTextContent(TARGET.softwareName)
    expect(rowButton(TARGET.softwareName)).toHaveAttribute('aria-expanded', 'true')
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.queryByTestId('deeplink-notice-widened')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /My products \(1\)/ })).toBeInTheDocument()
  })

  it('says not-found for an unknown product, and dismissing clears the param', () => {
    const onClose = vi.fn()
    render(<ProductsTab openProductId="no-such-product" onCloseProduct={onClose} />)
    expect(screen.getByTestId('deeplink-notice-not-found')).toHaveTextContent('no-such-product')
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notice' }))
    expect(onClose).toHaveBeenCalled()
  })
})
