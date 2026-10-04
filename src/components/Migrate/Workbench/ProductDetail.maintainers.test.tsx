// SPDX-License-Identifier: GPL-3.0-only
/** Product → maintainer Community links (open_source_maintainers). Real data. */
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProductDetail } from './ProductDetail'
import { softwareData } from '@/data/migrateData'
import { leadersData } from '@/data/leadersData'
import { maintainerLinksFor } from './maintainerLeaders'

const product = softwareData.find(
  (p) =>
    (p.openSourceMaintainers?.length ?? 0) > 0 &&
    maintainerLinksFor(p, leadersData).some((m) => m.leader) &&
    maintainerLinksFor(p, leadersData).some((m) => !m.leader)
)!
const links = maintainerLinksFor(product, leadersData)

const renderDetail = (p = product) =>
  render(
    <MemoryRouter>
      <ProductDetail product={p} />
    </MemoryRouter>
  )

describe('ProductDetail — open-source maintainers', () => {
  it('has a real product mixing linked and plain maintainers', () => {
    expect(product).toBeDefined()
  })

  it('links each maintainer with a Community profile to /leaders?leader=<leader_id>', async () => {
    renderDetail()
    const section = screen.getByTestId('product-maintainers')
    for (const m of links.filter((l) => l.leader)) {
      const a = await within(section).findByRole('link', { name: m.name })
      expect(a).toHaveAttribute('href', `/leaders?leader=${encodeURIComponent(m.leader!.leaderId)}`)
    }
  })

  it('shows the rest as plain text, without the forge handle', async () => {
    renderDetail()
    const section = screen.getByTestId('product-maintainers')
    const linked = links.find((l) => l.leader)!
    await within(section).findByRole('link', { name: linked.name })
    for (const m of links.filter((l) => !l.leader)) {
      expect(within(section).getByText(m.name)).toBeInTheDocument()
      expect(within(section).queryByRole('link', { name: m.name })).toBeNull()
    }
    expect(section).not.toHaveTextContent('github:')
  })

  it('renders no maintainers section when the column is empty', () => {
    const none = softwareData.find((p) => (p.openSourceMaintainers?.length ?? 0) === 0)!
    renderDetail(none)
    expect(screen.queryByTestId('product-maintainers')).toBeNull()
  })
})
