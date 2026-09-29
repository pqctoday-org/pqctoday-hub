// SPDX-License-Identifier: GPL-3.0-only
//
// Deep-link PR 4 (2026-09-29): an open product row and a Roadmaps vendor
// card each carry their own Share — the top-bar Share can hold the plan
// token — and it copies the CLEAN item link, never the reader's filters.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProductDetail } from './ProductDetail'
import { RoadmapsTab } from './RoadmapsTab'
import { productsForDomain } from './workbenchCatalog'
import { roadmapByVendorId } from '@/data/vendorRoadmapData'

const writeText = vi.fn<(text: string) => Promise<void>>()
beforeEach(() => {
  writeText.mockReset().mockResolvedValue(undefined)
  Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
})

async function copyVia(button: HTMLElement): Promise<string> {
  fireEvent.click(button)
  fireEvent.click(within(screen.getByRole('menu')).getByRole('button', { name: 'Copy link' }))
  await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
  return writeText.mock.calls[0][0]
}

describe('Migrate inline item Share', () => {
  it('ProductDetail shares /migrate?product=<product_id>', async () => {
    const [p] = productsForDomain('tls')
    render(
      <MemoryRouter initialEntries={['/migrate?tab=replace&domain=tls&q=foo']}>
        <ProductDetail product={p} />
      </MemoryRouter>
    )
    const share = screen.getByRole('button', { name: `Share ${p.softwareName} — PQC Today` })
    expect(await copyVia(share)).toBe(
      `${window.location.origin}/migrate?product=${encodeURIComponent(p.productId)}`
    )
  })

  it('a Roadmaps vendor card shares /migrate?tab=roadmaps&vendor=<id>', async () => {
    const vendorId = [...roadmapByVendorId.keys()][0]
    const vendorName = roadmapByVendorId.get(vendorId)![0].vendorName
    render(
      <MemoryRouter initialEntries={[`/migrate?tab=roadmaps&vendor=${vendorId}`]}>
        <RoadmapsTab focusVendorId={vendorId} focusKey="k" />
      </MemoryRouter>
    )
    const card = document.querySelector<HTMLElement>(`[data-deeplink-id="${vendorId}"]`)!
    const share = within(card).getByRole('button', { name: `Share ${vendorName} — PQC Today` })
    expect(await copyVia(share)).toBe(
      `${window.location.origin}/migrate?tab=roadmaps&vendor=${encodeURIComponent(vendorId)}`
    )
  })
})
