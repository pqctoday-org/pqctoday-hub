// SPDX-License-Identifier: AGPL-3.0-only
import { evidenceStrength, type ThreatItem } from '@/data/threatsData'
import { criticalityRank } from '@/data/threatRowRules'
import type { SortDirection, SortField } from './ThreatsTable'

const SORT_FIELDS: readonly SortField[] = ['industry', 'threatId', 'criticality', 'evidence']

/** `?sort=` → a known sort field, else the default (industry). */
export function threatSortFieldParam(value: string | null): SortField {
  return (SORT_FIELDS as readonly string[]).includes(value ?? '')
    ? (value as SortField)
    : 'industry'
}

/** `?dir=` → asc unless it says desc. */
export function threatSortDirParam(value: string | null): SortDirection {
  return value === 'desc' ? 'desc' : 'asc'
}

/**
 * The page's one ordering of threats, shared by the desktop table/cards and
 * the phone list. Industry sorts by name, then most critical first; unrated
 * sorts below Low — "we don't know" never outranks "we checked".
 */
export function compareThreats(
  a: ThreatItem,
  b: ThreatItem,
  field: SortField,
  dir: SortDirection
): number {
  if (field === 'industry') {
    if (a.industry !== b.industry) {
      return dir === 'asc'
        ? a.industry.localeCompare(b.industry)
        : b.industry.localeCompare(a.industry)
    }
    return criticalityRank(b.criticality) - criticalityRank(a.criticality)
  }
  let valA: string | number = ''
  let valB: string | number = ''
  if (field === 'threatId') {
    valA = a.threatId
    valB = b.threatId
  } else if (field === 'criticality') {
    valA = criticalityRank(a.criticality)
    valB = criticalityRank(b.criticality)
  } else if (field === 'evidence') {
    valA = evidenceStrength(a)
    valB = evidenceStrength(b)
  }
  if (valA < valB) return dir === 'asc' ? -1 : 1
  if (valA > valB) return dir === 'asc' ? 1 : -1
  return 0
}
