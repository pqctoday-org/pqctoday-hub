// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure patent link-filter matching shared by desktop (Patents/usePatentResults'
 * filterPatents) and the phone screen (Mobile/screens/MobilePatentsView), so
 * `?inventor=` and `?patentIds=` select exactly the same patents on both.
 * Also home of the full Explore URL-filter predicate (filterPatents) and its
 * region inference, so every desktop filter link narrows the phone list the
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
  withdrawn: 'Withdrawn',
  stateful_hash_standard: 'Stateful Hash Standard',
  proprietary: 'Proprietary',
  classical: 'Classical',
}

// Best-effort region inference from assignee string
const REGION_RULES: { pattern: RegExp; region: string }[] = [
  // Europe
  {
    pattern:
      /siemens|bosch|giesecke|nagravision|swiss re|thales(?! dis cpp usa)|\bsap\b|nokia|ericsson|philips|infineon|st micro|arm limited|entrust.*canada|blackberry|01 communique/i,
    region: 'Europe',
  },
  {
    pattern: /aktiengesellschaft|gmbh|ltd\b.*\buk\b|\bplc\b|s\.a\.\b|s\.r\.l\b/i,
    region: 'Europe',
  },
  // APAC
  {
    pattern: /huawei|alibaba|tencent|baidu|inspur|inventec|hikvision|byd|xiaomi|oppo|vivo/i,
    region: 'APAC',
  },
  { pattern: /samsung|lg electronics|sk hynix|kt corp|hyundai/i, region: 'APAC' },
  {
    pattern:
      /nippon|ntt|fujitsu|hitachi|toshiba|sony|panasonic|sharp|ricoh|softbank|rakuten|nec corp/i,
    region: 'APAC',
  },
  { pattern: /commonwealth scientific|csiro|atlassian/i, region: 'APAC' },
  { pattern: /jio platforms|wipro|infosys|tata/i, region: 'APAC' },
  // Oceania
  { pattern: /commonwealth scientific|csiro|atlassian|canva|afterpay|seek\b/i, region: 'Oceania' },
  // Middle East & Africa
  {
    pattern: /radware|checkpoint|amdocs|elbit|nice systems|lendoit|cellebrite/i,
    region: 'Middle East & Africa',
  },
  { pattern: /saudi|emirates|etisalat|du telecom/i, region: 'Middle East & Africa' },
  // Americas (catch-all for known US/CA companies and .N.A. / Inc. / LLC / Corp)
]

export function inferRegion(assignee: string): string {
  if (!assignee) return 'Unknown'
  for (const { pattern, region } of REGION_RULES) {
    if (pattern.test(assignee)) return region
  }
  // Heuristic: if it contains common US legal suffixes, it's Americas
  if (
    /\b(inc\.|llc|corp\.|n\.a\.|incorporated|limited liability|university of|national lab)/i.test(
      assignee
    )
  )
    return 'Americas'
  return 'Unknown'
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
    if (regionF && inferRegion(p.assignee) !== regionF) return false
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
