// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PqcCertificationTrendChart } from './PqcCertificationTrendChart'
vi.mock('@/data/migrateData', () => ({ softwareData: [] }))
vi.mock('@/data/certificationXrefData', () => ({ certsByProduct: new Map() }))
beforeEach(() =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => ({ matches: [], iut: [], mip: [] }) }))
  )
)
afterEach(() => vi.unstubAllGlobals())
const asOf = new Date('2026-11-01T00:00:00Z')
describe('chart scope reflects selected data branch', () => {
  it('catalogue evidence scope does not claim surrounding current/all record filtering', async () => {
    const view = render(<PqcCertificationTrendChart data={[]} asOf={asOf} recordScope="current" />)
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())
    const text = screen.getByText(/Catalogue evidence scope:/).textContent
    expect(text).toContain('does not restrict this product evidence set')
    expect(text).toContain('specific module and configuration scope')
    expect(screen.queryByText('current and validated records only')).not.toBeInTheDocument()
    view.rerender(<PqcCertificationTrendChart data={[]} asOf={asOf} recordScope="all" />)
    expect(screen.getByText(/Catalogue evidence scope:/).textContent).toBe(text)
    expect(
      screen.queryByText('current plus historical, archived and revoked records')
    ).not.toBeInTheDocument()
  })
  it('listings retains existing record-scope explanation and mode switching restores catalogue limits', async () => {
    const view = render(<PqcCertificationTrendChart data={[]} asOf={asOf} recordScope="current" />)
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'NIST listings' }))
    expect(screen.getByText('current and validated records only')).toBeInTheDocument()
    expect(screen.queryByText(/Catalogue evidence scope:/)).not.toBeInTheDocument()
    view.rerender(<PqcCertificationTrendChart data={[]} asOf={asOf} recordScope="all" />)
    expect(
      screen.getByText('current plus historical, archived and revoked records')
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Catalogue products' }))
    expect(screen.getByText(/Catalogue evidence scope:/)).toBeInTheDocument()
    expect(
      screen.queryByText('current plus historical, archived and revoked records')
    ).not.toBeInTheDocument()
  })
})
