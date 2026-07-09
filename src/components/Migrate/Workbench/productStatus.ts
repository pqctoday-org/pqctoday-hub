// SPDX-License-Identifier: GPL-3.0-only
//
// Normalize a catalog product's PQC + FIPS status into badge-ready shapes for
// the workbench product rows. Reads the clean `pqcStatusCanonical` field
// (available | partial | roadmap | none) rather than parsing the free-text
// `pqcSupport`.

import type { SoftwareItem } from '@/types/MigrateTypes'

export type ProductPqcStatus = 'ga' | 'partial' | 'roadmap' | 'none'

export interface ProductStatusBadge {
  status: ProductPqcStatus
  label: string
  tone: 'success' | 'info' | 'warning' | 'muted'
}

const PQC_BADGE: Record<ProductPqcStatus, ProductStatusBadge> = {
  ga: { status: 'ga', label: 'GA', tone: 'success' },
  partial: { status: 'partial', label: 'Partial', tone: 'info' },
  roadmap: { status: 'roadmap', label: 'Roadmap', tone: 'warning' },
  none: { status: 'none', label: 'No PQC', tone: 'muted' },
}

/** Rank for sorting: GA first, then Partial, Roadmap, None. */
export const PQC_STATUS_RANK: Record<ProductPqcStatus, number> = {
  ga: 0,
  partial: 1,
  roadmap: 2,
  none: 3,
}

export function productPqcStatus(item: SoftwareItem): ProductStatusBadge {
  switch ((item.pqcStatusCanonical || '').toLowerCase()) {
    case 'available':
      return PQC_BADGE.ga
    case 'partial':
      return PQC_BADGE.partial
    case 'roadmap':
      return PQC_BADGE.roadmap
    case 'none':
      return PQC_BADGE.none
    default:
      // fall back to the coarse free-text field if canonical is missing
      return (item.pqcSupport || '').toLowerCase().startsWith('yes') ? PQC_BADGE.ga : PQC_BADGE.none
  }
}

export interface FipsBadge {
  label: string
  tone: 'success' | 'warning'
}

/** FIPS validation badge, or null when not applicable. */
export function productFipsBadge(item: SoftwareItem): FipsBadge | null {
  const v = (item.fipsValidated || '').toLowerCase().trim()
  if (!v || v === 'no' || v === 'none' || v === 'n/a') return null
  if (v.includes('process') || v.includes('pending') || v.includes('progress')) {
    return { label: 'FIPS pending', tone: 'warning' }
  }
  // "yes", "140-3", "validated", a cert number, etc.
  return { label: 'FIPS 140-3', tone: 'success' }
}

export interface VerificationBadge {
  label: string
  tone: 'success' | 'info' | 'warning' | 'muted'
}

/**
 * Badge for the already-computed `verificationStatus` field (derived from proof
 * evidence at load time, see `deriveVerificationStatus` in migrateData.ts) — makes
 * the proof-gate discipline visible on the product card/detail, not just enforced
 * silently behind the scenes.
 */
export function productVerificationBadge(item: SoftwareItem): VerificationBadge {
  switch ((item.verificationStatus || '').toLowerCase()) {
    case 'verified':
      return { label: 'Verified', tone: 'success' }
    case 'partially verified':
      return { label: 'Partially Verified', tone: 'info' }
    case 'pending verification':
      return { label: 'Pending Verification', tone: 'warning' }
    default:
      return { label: 'Needs Verification', tone: 'muted' }
  }
}
