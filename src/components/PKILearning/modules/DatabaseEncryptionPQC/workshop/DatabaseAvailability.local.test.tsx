// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import type { CatalogAvailability } from '@/data/catalogStatus'
import { getCatalogStatus } from '@/data/catalogStatus'
import { EncryptionLayerMapper } from './EncryptionLayerMapper'
import { DatabaseMigrationReadiness } from './DatabaseMigrationReadiness'
import { DATABASE_PROFILES } from '../data/databaseConstants'
vi.mock('@/data/catalogStatus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/catalogStatus')>()),
  getCatalogStatus: vi.fn(),
}))
const lookup = vi.mocked(getCatalogStatus)
const states: Array<[CatalogAvailability, string]> = [
  ['available', 'Available (catalogue)'],
  ['partial', 'Partial support'],
  ['psk', 'PSK-only (not PQC)'],
  ['roadmap', 'Planned (catalogue)'],
  ['none', 'No PQC listed'],
  ['unverified', 'Unverified'],
]
beforeEach(() => lookup.mockReset())
describe('database learners see catalogue scope in actual consumers', () => {
  it.each(states)('layer mapper displays %s as %s', (availability, label) => {
    lookup.mockReturnValue({ canonical: 'Fictional catalogue evidence', availability })
    render(
      <MemoryRouter>
        <EncryptionLayerMapper />
      </MemoryRouter>
    )
    expect(screen.getByText(label, { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('GA', { exact: true })).not.toBeInTheDocument()
  })
  it.each(states)('fleet table displays %s as %s', (availability, label) => {
    lookup.mockReturnValue({ canonical: 'Fictional catalogue evidence', availability })
    render(
      <MemoryRouter>
        <DatabaseMigrationReadiness />
      </MemoryRouter>
    )
    const table = screen.getByRole('table')
    expect(within(table).getAllByText(label, { exact: true })).toHaveLength(5)
    expect(within(table).queryByText('GA', { exact: true })).not.toBeInTheDocument()
  })
  it('switches a missing database entry to an explicitly planned one with the normal selector', async () => {
    const user = userEvent.setup(),
      mongo = DATABASE_PROFILES.find((p) => p.id === 'mongodb')!
    lookup.mockImplementation((name) =>
      name === mongo.catalogName
        ? { canonical: 'Explicit fictional roadmap', availability: 'roadmap' }
        : null
    )
    render(
      <MemoryRouter>
        <EncryptionLayerMapper />
      </MemoryRouter>
    )
    expect(screen.getByText('Unverified', { exact: true })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Database:/ }))
    await user.click(await screen.findByRole('option', { name: mongo.dbName }))
    expect(screen.getByText('Planned (catalogue)', { exact: true })).toBeInTheDocument()
    expect(screen.queryByText('Unverified', { exact: true })).not.toBeInTheDocument()
  })
  it('catalogue status does not pre-award checklist coverage or change its review counter', () => {
    lookup.mockReturnValue(null)
    const view = render(
      <MemoryRouter>
        <DatabaseMigrationReadiness />
      </MemoryRouter>
    )
    expect(screen.getByText('0 of 10 items reviewed')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Cryptographic algorithm audit complete/ }))
    expect(screen.getByText('1 of 10 items reviewed')).toBeInTheDocument()
    lookup.mockReturnValue({ canonical: 'Available', availability: 'available' })
    view.rerender(
      <MemoryRouter>
        <DatabaseMigrationReadiness />
      </MemoryRouter>
    )
    expect(screen.getByText('1 of 10 items reviewed')).toBeInTheDocument()
    expect(
      within(screen.getByRole('table')).getAllByText('Available (catalogue)', { exact: true })
    ).toHaveLength(5)
  })
})
