// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Pure patent link-filter matching shared by desktop (Patents/usePatentResults'
 * filterPatents) and the phone screen (Mobile/screens/MobilePatentsView), so
 * `?inventor=` and `?patentIds=` select exactly the same patents on both.
 * Also home of the full Explore URL-filter predicate (filterPatents) and its
 * sourced filing-office labels, so every desktop filter link narrows the phone list the
 * same way. No JSX, no component imports — Mobile may import it.
 */
import type { PatentItem } from '@/types/PatentTypes'

function inventorWords(s: string): string[] {
  return s
    .replace(/\bet\s+al\.?\s*$/i, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/** patents.inventors is raw USPTO/Google-Patents format — "Surname; Givenname
 * et al." — inverted order from a leader's "Givenname Surname" and truncated
 * to the first-named inventor. An exact-equality match (like assignee uses)
 * can never work here, so this compares normalized word sets instead: every
 * word in the filter name must appear among the record's inventor-field
 * words, order-independent. Mirrors leaders_patents_xref.py's normalization
 * on the Python side (lowercase, strip "et al.", strip punctuation). */
export function inventorMatches(inventorsField: string, filterName: string): boolean {
  const recordWords = new Set(inventorWords(inventorsField))
  const filterWords = inventorWords(filterName)
  return filterWords.length > 0 && filterWords.every((w) => recordWords.has(w))
}

/** `?patentIds=` value → the set of ids it names (comma list, trimmed). */
export function parsePatentIds(value: string): Set<string> {
  return new Set(
    value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

/** A patent is wanted when its number is listed US-prefixed or bare. */
export function patentIdMatches(patentNumber: string, wanted: Set<string>): boolean {
  return wanted.has(patentNumber) || wanted.has(patentNumber.replace(/^US/i, ''))
}

/** Applies just the `?inventor` / `?patentIds` link filters, with
 *  filterPatents' semantics: an empty string is off; any other value filters
 *  (so a value naming no usable id/word matches nothing). */
export function filterByPatentLinkParams(
  patents: PatentItem[],
  inventor: string,
  patentIds: string
): PatentItem[] {
  if (!inventor && !patentIds) return patents
  const wanted = parsePatentIds(patentIds)
  return patents.filter(
    (p) =>
      (!inventor || inventorMatches(p.inventors, inventor)) &&
      (!patentIds || patentIdMatches(p.patentNumber, wanted))
  )
}

export const NIST_STATUS_LABELS: Record<string, string> = {
  fips_203: 'FIPS 203 (ML-KEM)',
  fips_204: 'FIPS 204 (ML-DSA)',
  fips_205: 'FIPS 205 (SLH-DSA)',
  round4_candidate: 'Round 4 Candidate',
  selected_for_standardization: 'Selected for standardization',
  withdrawn: 'Withdrawn',
  stateful_hash_standard: 'Stateful Hash Standard',
  proprietary: 'Proprietary',
  classical: 'Classical',
}

/** The jurisdiction of this sourced publication/application, never the assignee
 * or all members of its patent family. Unbound legacy rows remain unassigned. */
export function filingJurisdictionLabel(
  patent: Pick<
    PatentItem,
    'filingJurisdiction' | 'filingJurisdictionApplication' | 'filingJurisdictionSourceUrl'
  >
): string {
  const code = patent.filingJurisdiction?.trim()
  if (
    !code ||
    !/^[A-Z]{2}$/.test(code) ||
    !patent.filingJurisdictionApplication?.trim() ||
    !/^https:\/\//.test(patent.filingJurisdictionSourceUrl ?? '')
  )
    return 'Unassigned'
  const labels = new Map([
    ['US', 'United States (US)'],
    ['CA', 'Canada (CA)'],
    ['EP', 'European Patent Office (EP)'],
    ['WO', 'PCT international publication (WO)'],
  ])
  return labels.get(code) ?? `Patent office (${code})`
}

/** Every Explore URL filter, with desktop's semantics (an absent/empty param
 *  is off). Desktop's usePatentResults re-exports this as its filterPatents. */
export function filterPatents(patents: PatentItem[], params: URLSearchParams): PatentItem[] {
  const q = (params.get('search') ?? '').toLowerCase()
  const assigneeF = params.get('assignee') ?? ''
  const inventorF = params.get('inventor') ?? ''
  const patentIdsF = params.get('patentIds') ?? ''
  const wantedIds = parsePatentIds(patentIdsF)
  const agilityF = params.get('agility') ?? ''
  const domainF = params.get('domain') ?? ''
  const impactF = params.get('impact') ?? ''
  const quantumTechF = params.get('quantumTech') ?? ''
  const quantumRelevanceF = params.get('quantumRelevance') ?? ''
  const regionF = params.get('region') ?? ''
  const protocolF = params.get('protocol') ?? ''
  const classicalAlgorithmF = params.get('classicalAlgorithm') ?? ''
  const hardwareComponentF = params.get('hardwareComponent') ?? ''
  const nistStatusF = params.get('nistStatus') ?? ''
  const pqcF = params.get('pqc') ?? ''
  const fipsF = params.get('fips') ?? ''
  const filingYearF = params.get('filingYear') ?? ''

  return patents.filter((p) => {
    if (
      q &&
      !p.title.toLowerCase().includes(q) &&
      !p.summary.toLowerCase().includes(q) &&
      !p.primaryInventiveClaim.toLowerCase().includes(q) &&
      !p.assignee.toLowerCase().includes(q) &&
      !p.patentNumber.toLowerCase().includes(q)
    )
      return false
    if (assigneeF && p.assignee !== assigneeF) return false
    if (inventorF && !inventorMatches(p.inventors, inventorF)) return false
    if (patentIdsF && !patentIdMatches(p.patentNumber, wantedIds)) return false
    if (agilityF && p.cryptoAgilityMode !== agilityF) return false
    if (domainF && !p.applicationDomain.includes(domainF)) return false
    if (impactF && p.impactLevel !== impactF) return false
    if (quantumTechF && !p.quantumTechnology.includes(quantumTechF)) return false
    if (quantumRelevanceF && p.quantumRelevance !== quantumRelevanceF) return false
    if (regionF && filingJurisdictionLabel(p) !== regionF) return false
    if (protocolF && !p.protocols.includes(protocolF)) return false
    if (classicalAlgorithmF && !p.classicalAlgorithms.includes(classicalAlgorithmF)) return false
    if (hardwareComponentF && !p.hardwareComponents.includes(hardwareComponentF)) return false
    if (nistStatusF && !p.nistRoundStatus.some((n) => n.status === nistStatusF)) return false
    // Redesign-only filters (legacy never sets these params):
    if (pqcF && !p.pqcAlgorithms.includes(pqcF)) return false
    if (fipsF && !p.nistRoundStatus.some((n) => n.status.startsWith('fips_'))) return false
    if (filingYearF && p.filingYear !== Number(filingYearF)) return false
    return true
  })
}
