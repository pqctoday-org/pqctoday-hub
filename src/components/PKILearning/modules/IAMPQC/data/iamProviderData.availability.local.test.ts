// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getCatalogStatus } from '@/data/catalogStatus'
import { getVendorPqcStatus, IAM_VENDORS, PQC_STATUS_LABELS } from './iamProviderData'

vi.mock('@/data/catalogStatus', () => ({ getCatalogStatus: vi.fn() }))
const lookup = vi.mocked(getCatalogStatus)

beforeEach(() => lookup.mockReset())

describe('IAM availability does not manufacture vendor release evidence', () => {
  it('keeps missing catalogue entries and unverified evidence unknown even with a target year', () => {
    const sample = {
      ...IAM_VENDORS[0],
      catalogName: 'Fictional unlisted provider',
      roadmapYear: 2020,
    }
    lookup.mockReturnValue(null)
    expect(getVendorPqcStatus(sample)).toBe('unverified')
    lookup.mockReturnValue({ canonical: '', availability: 'unverified' })
    expect(getVendorPqcStatus(sample)).toBe('unverified')
    expect(PQC_STATUS_LABELS[getVendorPqcStatus(sample)].label).toBe('Unverified')
  })

  it('preserves partial scope without inferring a preview release', () => {
    lookup.mockReturnValue({
      canonical: 'Partial: selected operations only',
      availability: 'partial',
    })
    expect(getVendorPqcStatus(IAM_VENDORS[0])).toBe('partial')
    expect(PQC_STATUS_LABELS[getVendorPqcStatus(IAM_VENDORS[0])].label).toBe('Partial support')
  })

  it('distinguishes catalogue availability from GA and an explicit roadmap from delivery', () => {
    lookup.mockReturnValue({ canonical: 'Available', availability: 'available' })
    expect(PQC_STATUS_LABELS[getVendorPqcStatus(IAM_VENDORS[0])].label).toBe(
      'Available (catalogue)'
    )
    lookup.mockReturnValue({ canonical: 'Roadmap', availability: 'roadmap' })
    expect(getVendorPqcStatus({ ...IAM_VENDORS[0], roadmapYear: 2020 })).toBe('roadmap')
    expect(PQC_STATUS_LABELS[getVendorPqcStatus(IAM_VENDORS[0])].label).toBe('Roadmap (catalogue)')
  })

  it.each([
    { availability: 'psk', label: 'PSK-only (not PQC)' },
    { availability: 'unverified', label: 'Unverified' },
    { availability: 'available', label: 'Available (catalogue)' },
  ] as const)('retains $availability without promoting its evidence', ({ availability, label }) => {
    lookup.mockReturnValue({ canonical: 'Sample catalogue record', availability })
    const status = getVendorPqcStatus(IAM_VENDORS[0])
    expect(status).toBe(availability)
    expect(PQC_STATUS_LABELS[getVendorPqcStatus(IAM_VENDORS[0])].label).toBe(label)
  })
})
