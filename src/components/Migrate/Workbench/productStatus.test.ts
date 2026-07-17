// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { SoftwareItem } from '@/types/MigrateTypes'
import { productPqcStatus, productVerificationBadge } from './productStatus'

function item(overrides: Partial<SoftwareItem>): SoftwareItem {
  return {
    productId: 'p1',
    softwareName: 'Test Product',
    pqcSupport: '',
    lastVerifiedDate: '',
    ...overrides,
  } as SoftwareItem
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

describe('productPqcStatus', () => {
  it('honors a canonical status when present', () => {
    expect(
      productPqcStatus(item({ pqcStatusCanonical: 'available', pqcSupport: 'No' })).status
    ).toBe('ga')
    expect(productPqcStatus(item({ pqcStatusCanonical: 'none', pqcSupport: 'Yes' })).status).toBe(
      'none'
    )
  })

  it('falls back to a "Yes" pqcSupport as GA', () => {
    expect(productPqcStatus(item({ pqcSupport: 'Yes (ML-KEM)' })).status).toBe('ga')
  })

  it('falls back to a "No" pqcSupport as none', () => {
    expect(productPqcStatus(item({ pqcSupport: 'No' })).status).toBe('none')
  })

  // Regression: migrate-process remediation Phase 5 (U2) — a blank or
  // "Unknown" pqcSupport used to badge as "No PQC" (false negative), same
  // as a genuine "No". An enrichment gap must render as Unknown, not as a
  // confident negative claim.
  it('treats a blank pqcSupport as unknown, not none', () => {
    expect(productPqcStatus(item({ pqcSupport: '' })).status).toBe('unknown')
  })

  it('treats a literal "Unknown" pqcSupport as unknown, not none', () => {
    expect(productPqcStatus(item({ pqcSupport: 'Unknown' })).status).toBe('unknown')
  })

  it('treats "Pending Verification" pqcSupport as unknown, not none', () => {
    expect(productPqcStatus(item({ pqcSupport: 'Pending Verification' })).status).toBe('unknown')
  })
})

// Regression: migrate-process remediation Phase 5 (U1) — a "Verified" badge
// used to render identically whether the row was checked yesterday or four
// months ago, with the date visible only after expanding the row.
describe('productVerificationBadge', () => {
  it('shows a green tone with the date in the title for a recently verified row', () => {
    const badge = productVerificationBadge(
      item({ verificationStatus: 'Verified', lastVerifiedDate: daysAgo(5) })
    )
    expect(badge.tone).toBe('success')
    expect(badge.title).toContain(daysAgo(5))
  })

  it('downgrades to a warning tone when verified more than 90 days ago', () => {
    const badge = productVerificationBadge(
      item({ verificationStatus: 'Verified', lastVerifiedDate: daysAgo(120) })
    )
    expect(badge.tone).toBe('warning')
    expect(badge.label).toBe('Verified')
  })

  it('reports "Never verified" when lastVerifiedDate is blank', () => {
    const badge = productVerificationBadge(item({ verificationStatus: 'Verified' }))
    expect(badge.title).toBe('Never verified')
  })
})
