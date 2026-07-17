// SPDX-License-Identifier: GPL-3.0-only
//
// Normalize a catalog product's PQC + FIPS status into badge-ready shapes for
// the workbench product rows. Reads the clean `pqcStatusCanonical` field
// (available | partial | roadmap | none) rather than parsing the free-text
// `pqcSupport`.

import type { SoftwareItem } from '@/types/MigrateTypes'

export type ProductPqcStatus = 'ga' | 'partial' | 'roadmap' | 'none' | 'unknown'

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
  // ADDED 2026-07-16 (migrate-process remediation Phase 5, U2): the fallback
  // below used to badge ANY row with no canonical status and a non-"Yes"
  // pqcSupport as "No PQC" — including rows whose pqcSupport was blank or
  // literally "Unknown". An enrichment gap (no assessment yet) rendered
  // identically to a confirmed negative finding, which is a false claim in
  // the "No PQC" direction, not an honest gap.
  unknown: { status: 'unknown', label: 'Unknown', tone: 'muted' },
}

/** Rank for sorting: GA first, then Partial, Roadmap, None, Unknown. */
export const PQC_STATUS_RANK: Record<ProductPqcStatus, number> = {
  ga: 0,
  partial: 1,
  roadmap: 2,
  none: 3,
  unknown: 4,
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
    default: {
      // fall back to the coarse free-text field if canonical is missing —
      // only a field that actually SAYS "no" earns the "No PQC" badge; a
      // blank, "Unknown", or "Pending Verification" value is an honest gap.
      const support = (item.pqcSupport || '').toLowerCase().trim()
      if (support.startsWith('yes')) return PQC_BADGE.ga
      if (support.startsWith('no')) return PQC_BADGE.none
      return PQC_BADGE.unknown
    }
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
  /** Tooltip text — the actual last_verified_date. ADDED 2026-07-16
   *  (migrate-process remediation Phase 5, U1): a collapsed ProductRow used
   *  to show this badge with no date at all, so a row verified 4 months ago
   *  read identically to one verified yesterday. */
  title: string
}

/** Rows verified longer ago than this read as stale (amber), not a
 *  confident-looking green "Verified". Matches the remediation plan's
 *  90-day threshold. */
const STALE_DAYS = 90

function daysSince(dateStr: string): number | null {
  if (!dateStr) return null
  const parsed = new Date(dateStr)
  if (Number.isNaN(parsed.getTime())) return null
  return Math.floor((Date.now() - parsed.getTime()) / 86_400_000)
}

/**
 * Badge for the already-computed `verificationStatus` field (derived from proof
 * evidence at load time, see `deriveVerificationStatus` in migrateData.ts) — makes
 * the proof-gate discipline visible on the product card/detail, not just enforced
 * silently behind the scenes.
 */
export function productVerificationBadge(item: SoftwareItem): VerificationBadge {
  const days = daysSince(item.lastVerifiedDate)
  const title = item.lastVerifiedDate
    ? `Last verified ${item.lastVerifiedDate}${days !== null ? ` (${days} day${days === 1 ? '' : 's'} ago)` : ''}`
    : 'Never verified'
  const stale = days !== null && days > STALE_DAYS

  switch ((item.verificationStatus || '').toLowerCase()) {
    case 'verified':
      return { label: 'Verified', tone: stale ? 'warning' : 'success', title }
    case 'partially verified':
      return { label: 'Partially Verified', tone: 'info', title }
    case 'pending verification':
      return { label: 'Pending Verification', tone: 'warning', title }
    default:
      return { label: 'Needs Verification', tone: 'muted', title }
  }
}
