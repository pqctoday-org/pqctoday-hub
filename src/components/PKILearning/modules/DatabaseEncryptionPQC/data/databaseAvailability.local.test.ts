// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  canonicalToAvailability,
  getCatalogStatus,
  type CatalogAvailability,
} from '@/data/catalogStatus'
import {
  DATABASE_PROFILES,
  DATABASE_PQC_STATUS_LABELS,
  getProfilePqcSupport,
} from './databaseConstants'
vi.mock('@/data/catalogStatus', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/data/catalogStatus')>()),
  getCatalogStatus: vi.fn(),
}))
const lookup = vi.mocked(getCatalogStatus)
const labels: Array<[CatalogAvailability, string]> = [
  ['available', 'Available (catalogue)'],
  ['partial', 'Partial support'],
  ['psk', 'PSK-only (not PQC)'],
  ['roadmap', 'Planned (catalogue)'],
  ['none', 'No PQC listed'],
  ['unverified', 'Unverified'],
]
beforeEach(() => lookup.mockReset())
describe('database catalogue availability retains evidence scope', () => {
  it.each(labels)('preserves %s as %s without inferring a release stage', (availability, label) => {
    lookup.mockReturnValue({ canonical: 'Fictional catalogue evidence', availability })
    expect(getProfilePqcSupport(DATABASE_PROFILES[0])).toBe(availability)
    expect(DATABASE_PQC_STATUS_LABELS[getProfilePqcSupport(DATABASE_PROFILES[0])].label).toBe(label)
  })
  it('keeps a missing catalogue entry unknown even with an elapsed fictional target year', () => {
    lookup.mockReturnValue(null)
    const sample = {
      ...DATABASE_PROFILES[0],
      catalogName: 'Unlisted sample',
      pqcTimeline: 'Fictional target 2020',
    }
    expect(getProfilePqcSupport(sample)).toBe('unverified')
  })
  it('keeps empty evidence unknown through the existing canonical parser', () => {
    lookup.mockReturnValue({ canonical: '', availability: canonicalToAvailability('') })
    expect(getProfilePqcSupport(DATABASE_PROFILES[0])).toBe('unverified')
  })
  it('does not convert a roadmap to delivery when its target year has elapsed', () => {
    lookup.mockReturnValue({ canonical: 'Roadmap', availability: 'roadmap' })
    const sample = { ...DATABASE_PROFILES[0], pqcTimeline: 'Fictional target 2020' }
    expect(getProfilePqcSupport(sample)).toBe('roadmap')
    expect(DATABASE_PQC_STATUS_LABELS[getProfilePqcSupport(sample)].label).toBe(
      'Planned (catalogue)'
    )
  })
})
