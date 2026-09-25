// SPDX-License-Identifier: GPL-3.0-only
import { useMemo } from 'react'
import type { SoftwareItem } from '@/types/MigrateTypes'

/** Counts of catalogue rows per canonical PQC status bucket. */
export interface CatalogScopeCounts {
  total: number
  /** Rows tagged catalogue_population=pqc_relevant (0 when the column is absent). */
  pqcRelevant: number
  /** Rows tagged catalogue_population=migration_baseline. */
  baseline: number
  available: number
  partial: number
  planned: number
  none: number
  unknown: number
}

/**
 * Bucket the live catalogue by pqc_status_canonical. "planned" folds the
 * catalogue's `roadmap` and `planned` values; everything that is not a
 * decided status (unknown, pending, na, blank) is "unknown".
 */
export function catalogScopeCounts(items: SoftwareItem[]): CatalogScopeCounts {
  const counts: CatalogScopeCounts = {
    total: items.length,
    pqcRelevant: 0,
    baseline: 0,
    available: 0,
    partial: 0,
    planned: 0,
    none: 0,
    unknown: 0,
  }
  for (const item of items) {
    if (item.cataloguePopulation === 'pqc_relevant') counts.pqcRelevant += 1
    else if (item.cataloguePopulation === 'migration_baseline') counts.baseline += 1
    const s = (item.pqcStatusCanonical || '').toLowerCase()
    if (s === 'available') counts.available += 1
    else if (s === 'partial') counts.partial += 1
    else if (s === 'roadmap' || s === 'planned') counts.planned += 1
    else if (s === 'none') counts.none += 1
    else counts.unknown += 1
  }
  return counts
}

/**
 * States what the catalogue is: a curated list, not the market, and how many
 * of its products have PQC support today versus none. Shown to every persona
 * (migrate remediation r2, M2-1) — the counts are rows in this catalogue,
 * never a share of all products that exist.
 */
export function CatalogScopeNote({ items }: { items: SoftwareItem[] }) {
  const c = useMemo(() => catalogScopeCounts(items), [items])
  const hasPopulations = c.pqcRelevant + c.baseline > 0
  return (
    <p className="mb-4 text-xs text-muted-foreground">
      A curated catalogue of {c.total} products — not an exhaustive list of the market.{' '}
      {hasPopulations ? (
        <>
          {c.pqcRelevant} products with PQC capability or a PQC plan ({c.available} available ·{' '}
          {c.partial} partial · {c.planned} planned or on a roadmap), and {c.baseline}{' '}
          migration-baseline products tracked because they matter to a PQC migration but have no
          confirmed PQC support yet. The two groups are counted separately.
        </>
      ) : (
        <>
          PQC support in this catalogue: {c.available} available · {c.partial} partial · {c.planned}{' '}
          planned or on a roadmap · {c.none} none · {c.unknown} not yet determined.
        </>
      )}
    </p>
  )
}
