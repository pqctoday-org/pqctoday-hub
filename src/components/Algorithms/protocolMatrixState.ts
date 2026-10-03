// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure filter/sort/URL-param helpers for the PQC Protocol Support matrix,
 * shared by the desktop PQCProtocolMatrix and the phone
 * MobileProtocolMatrixView so a `?matrixQ/matrixStatus/matrixAvailability/
 * matrixSort` link means exactly the same row set on both.
 */
import type { DimensionStatusValue, ProtocolMatrixRow } from '@/data/pqcProtocolMatrix'

export type SortKey = 'matrix' | 'name' | 'maturity' | 'oss' | 'commercial' | 'deployments'
export type SortDirection = 'asc' | 'desc'
export type AvailabilityFilter =
  | 'all'
  | 'has-oss'
  | 'has-commercial'
  | 'has-playground'
  | 'has-deployment'
  | 'no-oss'
  | 'no-commercial'
  | 'no-deployment'

export const AVAILABILITY_LABELS: Record<AvailabilityFilter, string> = {
  all: 'All rows',
  'has-oss': 'Has OSS',
  'no-oss': 'No OSS',
  'has-commercial': 'Has commercial',
  'no-commercial': 'No commercial',
  'has-playground': 'Has playground',
  'has-deployment': 'Has live deployment',
  'no-deployment': 'No live deployment',
}

export const SORT_LABELS: Record<SortKey, string> = {
  matrix: 'Matrix order',
  name: 'Name',
  maturity: 'Maturity score',
  oss: 'OSS count',
  commercial: 'Commercial count',
  deployments: 'Live deployments',
}

const DIMENSION_MATURITY: Record<DimensionStatusValue, number> = {
  rfc: 4,
  draft: 3,
  experimental: 2,
  none: 1,
  na: 0,
}

export function rowDimensionValues(row: ProtocolMatrixRow): DimensionStatusValue[] {
  return [
    row.dimensions.pureKem.value,
    row.dimensions.hybridKem.value,
    row.dimensions.pureSig.value,
    row.dimensions.hybridSig.value,
  ]
}

export function rowMaturity(row: ProtocolMatrixRow): number {
  return (
    DIMENSION_MATURITY[row.dimensions.pureKem.value] +
    DIMENSION_MATURITY[row.dimensions.hybridKem.value] +
    DIMENSION_MATURITY[row.dimensions.pureSig.value] +
    DIMENSION_MATURITY[row.dimensions.hybridSig.value]
  )
}

/** Max possible maturity score for this row — 4 points per dimension that
 *  actually applies (`na` dimensions don't count against the row). Prevents
 *  signature-only or KEM-only protocols (DNSSEC, Signal PQXDH, PKCS#11) from
 *  reading as structurally immature purely for having fewer applicable
 *  dimensions than a full 4-dimension protocol like TLS 1.3. */
export function rowMaturityMax(row: ProtocolMatrixRow): number {
  return rowDimensionValues(row).filter((v) => v !== 'na').length * 4
}

/** Normalized 0..1 maturity ratio — 0 when no dimension applies at all. Use
 *  this (not the raw score) for sorting and percentage-bar width so rows with
 *  different applicable-dimension counts compare fairly. */
export function rowMaturityRatio(row: ProtocolMatrixRow): number {
  const max = rowMaturityMax(row)
  return max === 0 ? 0 : rowMaturity(row) / max
}

const VALID_STATUS_VALUES: DimensionStatusValue[] = ['rfc', 'draft', 'experimental', 'none', 'na']
const VALID_AVAILABILITY_FILTERS = Object.keys(AVAILABILITY_LABELS) as AvailabilityFilter[]
const VALID_SORT_KEYS = Object.keys(SORT_LABELS) as SortKey[]

/** Serializes sort state to `?matrixSort=key:direction`; omitted at the default (matrix:asc). */
export function matrixSortParam(key: SortKey, direction: SortDirection): string | null {
  if (key === 'matrix' && direction === 'asc') return null
  return `${key}:${direction}`
}

export function parseMatrixSortParam(raw: string | null): {
  key: SortKey
  direction: SortDirection
} {
  const [rawKey, rawDir] = (raw ?? '').split(':')
  const key = VALID_SORT_KEYS.includes(rawKey as SortKey) ? (rawKey as SortKey) : 'matrix'
  const direction: SortDirection = rawDir === 'desc' ? 'desc' : 'asc'
  return { key, direction }
}

/** `?matrixStatus=rfc,draft` → validated list (unknown values dropped). */
export function parseMatrixStatusParam(raw: string | null): DimensionStatusValue[] {
  if (!raw) return []
  return raw
    .split(',')
    .filter((s): s is DimensionStatusValue =>
      VALID_STATUS_VALUES.includes(s as DimensionStatusValue)
    )
}

export function parseMatrixAvailabilityParam(raw: string | null): AvailabilityFilter {
  return raw && VALID_AVAILABILITY_FILTERS.includes(raw as AvailabilityFilter)
    ? (raw as AvailabilityFilter)
    : 'all'
}

export function passesAvailabilityFilter(
  row: ProtocolMatrixRow,
  filter: AvailabilityFilter
): boolean {
  const deployments = row.liveDeployments?.length ?? 0
  switch (filter) {
    case 'has-oss':
      return row.ossLibraries.length > 0
    case 'no-oss':
      return row.ossLibraries.length === 0
    case 'has-commercial':
      return row.commercialLibraries.length > 0
    case 'no-commercial':
      return row.commercialLibraries.length === 0
    case 'has-playground':
      return row.playgrounds.length > 0
    case 'has-deployment':
      return deployments > 0
    case 'no-deployment':
      return deployments === 0
    default:
      return true
  }
}

/** A row passes the status filter when ANY of its 4 dimensions matches (OR). */
export function passesStatusFilter(
  row: ProtocolMatrixRow,
  statuses: DimensionStatusValue[]
): boolean {
  if (statuses.length === 0) return true
  const values = rowDimensionValues(row)
  return statuses.some((s) => values.includes(s))
}

/** Returns `rows` itself for the default matrix order, else a sorted copy. */
export function sortProtocolRows(
  rows: ProtocolMatrixRow[],
  key: SortKey,
  direction: SortDirection
): ProtocolMatrixRow[] {
  if (key === 'matrix') return rows
  const dir = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    switch (key) {
      case 'name':
        return a.name.localeCompare(b.name) * dir
      case 'maturity':
        return (rowMaturityRatio(a) - rowMaturityRatio(b)) * dir
      case 'oss':
        return (a.ossLibraries.length - b.ossLibraries.length) * dir
      case 'commercial':
        return (a.commercialLibraries.length - b.commercialLibraries.length) * dir
      case 'deployments':
        return ((a.liveDeployments?.length ?? 0) - (b.liveDeployments?.length ?? 0)) * dir
      default:
        return 0
    }
  })
}
