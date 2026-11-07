// SPDX-License-Identifier: AGPL-3.0-only
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
  /** Only quantum protection is a pre-shared key; not PQC-ready and not part of `baselineWithPqc`. */
  psk: number
  planned: number
  none: number
  unknown: number
  /** The same status buckets, counted inside the PQC-relevant population only. */
  relevant: StatusBuckets
  /** Migration-baseline rows whose status is available or partial (never psk). */
  baselineWithPqc: number
  /** Migration-baseline rows whose only quantum protection is a pre-shared key. */
  baselinePsk: number
  /** Rows in neither population (blank catalogue_population). */
  unassigned: number
}

export interface StatusBuckets {
  available: number
  partial: number
  psk: number
  planned: number
  none: number
  unknown: number
}

function bucketOf(status: string | undefined): keyof StatusBuckets {
  const s = (status || '').toLowerCase()
  if (s === 'available') return 'available'
  if (s === 'partial') return 'partial'
  if (s === 'psk') return 'psk'
  if (s === 'roadmap' || s === 'planned') return 'planned'
  if (s === 'none') return 'none'
  return 'unknown'
}

/**
 * Bucket the live catalogue by pqc_status_canonical. "planned" folds the
 * catalogue's `roadmap` and `planned` values; "psk" is a pre-shared key as the
 * only quantum protection (counted apart from partial, and not as PQC support);
 * everything that is not a decided status (unknown, pending, na, blank) is
 * "unknown".
 */
export function catalogScopeCounts(items: SoftwareItem[]): CatalogScopeCounts {
  const counts: CatalogScopeCounts = {
    total: items.length,
    pqcRelevant: 0,
    baseline: 0,
    available: 0,
    partial: 0,
    psk: 0,
    planned: 0,
    none: 0,
    unknown: 0,
    relevant: { available: 0, partial: 0, psk: 0, planned: 0, none: 0, unknown: 0 },
    baselineWithPqc: 0,
    baselinePsk: 0,
    unassigned: 0,
  }
  for (const item of items) {
    const bucket = bucketOf(item.pqcStatusCanonical)
    counts[bucket] += 1
    if (item.cataloguePopulation === 'pqc_relevant') {
      counts.pqcRelevant += 1
      counts.relevant[bucket] += 1
    } else if (item.cataloguePopulation === 'migration_baseline') {
      counts.baseline += 1
      if (bucket === 'available' || bucket === 'partial') counts.baselineWithPqc += 1
      if (bucket === 'psk') counts.baselinePsk += 1
    } else {
      counts.unassigned += 1
    }
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
          {c.pqcRelevant} PQC-relevant products ({c.relevant.available} available ·{' '}
          {c.relevant.partial} partial · {c.relevant.planned} planned or on a roadmap ·{' '}
          {c.relevant.unknown} not yet determined
          {c.relevant.psk > 0 ? ` · ${c.relevant.psk} pre-shared key (PSK) only` : ''}
          {c.relevant.none > 0 ? ` · ${c.relevant.none} none` : ''}), and {c.baseline}{' '}
          migration-baseline products tracked because they matter to a PQC migration
          {c.baselineWithPqc > 0
            ? ` (${c.baselineWithPqc} of them already have some PQC support)`
            : ', with no confirmed PQC support yet'}
          {c.baselinePsk > 0
            ? `; ${c.baselinePsk} of them rely on a pre-shared key (PSK) only`
            : ''}
          .{c.unassigned > 0 ? ` ${c.unassigned} more are not yet assigned to either group.` : ''}
          {c.relevant.psk + c.baselinePsk > 0
            ? ' A pre-shared key (PSK) alone is not counted as PQC support.'
            : ''}{' '}
          The groups are counted separately.
        </>
      ) : (
        <>
          PQC support in this catalogue: {c.available} available · {c.partial} partial
          {c.psk > 0
            ? ` · ${c.psk} pre-shared key (PSK) only, not counted as PQC support`
            : ''} · {c.planned} planned or on a roadmap · {c.none} none · {c.unknown} not yet
          determined.
        </>
      )}
    </p>
  )
}
