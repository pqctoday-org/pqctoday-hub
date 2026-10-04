// SPDX-License-Identifier: GPL-3.0-only
/** Phone product sheet: maintainer → Community links, same as desktop. Real data. */
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MobileMigrateView } from './MobileMigrateView'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'
import { softwareData } from '@/data/migrateData'
import { leadersData } from '@/data/leadersData'
import { maintainerLinksFor } from '@/components/Migrate/Workbench/maintainerLeaders'

const product = softwareData.find((p) => maintainerLinksFor(p, leadersData).some((m) => m.leader))!

describe('MobileMigrateView — product sheet maintainers', () => {
  beforeEach(() => {
    window.localStorage.clear()
    useMigrateSelectionStore.setState({ plan: [], choice: {}, nameToProductId: {} })
  })

  it('links a maintainer with a Community profile to /leaders?leader=<leader_id>', async () => {
    render(
      <MemoryRouter initialEntries={[`/migrate?product=${encodeURIComponent(product.productId)}`]}>
        <MobileMigrateView />
      </MemoryRouter>
    )
    const sheet = screen.getByTestId('migrate-product-detail-sheet')
    const section = await within(sheet).findByTestId('product-maintainers')
    const linked = maintainerLinksFor(product, leadersData).find((m) => m.leader)!
    const a = await within(section).findByRole('link', { name: linked.name })
    expect(a).toHaveAttribute(
      'href',
      `/leaders?leader=${encodeURIComponent(linked.leader!.leaderId)}`
    )
  })
})
