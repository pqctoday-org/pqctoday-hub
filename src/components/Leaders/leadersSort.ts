// SPDX-License-Identifier: AGPL-3.0-only
import type { Leader } from '@/data/leadersData'
import { normalizeLeaderName } from './leaderDeepLink'

/** Name order without honorifics: "Dr. Dustin Moody" sorts under D for Dustin,
 *  next to the people without a title, not in a block of every "Dr.". */
export function compareLeaderNames(a: string, b: string): number {
  return normalizeLeaderName(a).localeCompare(normalizeLeaderName(b)) || a.localeCompare(b)
}

/** Country order with blank countries last, whichever the direction. Returns
 *  the comparison for ascending order; pass `dir` so blanks stay last on desc. */
export function compareLeaderCountries(a: string, b: string, dir: 1 | -1 = 1): number {
  const aBlank = !a.trim()
  const bBlank = !b.trim()
  if (aBlank !== bBlank) return aBlank ? 1 : -1
  return a.localeCompare(b) * dir
}

/**
 * Words that tie a profile to an industry the reader picked in their role
 * settings, matched as whole words in the bio, organizations and title.
 * Deliberately narrow: a profile is marked "Relevant to you" only when its own
 * text names the industry or a body specific to it. "Other" has no keywords.
 * The old rule split the industry label into substrings, which matched nobody
 * for 7 of 12 industries, marked two bios for "Other" because they contained
 * the word "other", and marked every "Institute of Technology" for Technology.
 */
export const INDUSTRY_LEADER_KEYWORDS: Record<string, string[]> = {
  'Finance & Banking': [
    'bank',
    'banking',
    'banks',
    'financial',
    'finance',
    'fintech',
    'payments',
    'swift',
    'fs-isac',
    'mastercard',
    'visa',
    'jpmorgan',
    'santander',
  ],
  'Government & Defense': [
    'government',
    'defense',
    'defence',
    'military',
    'nsa',
    'cisa',
    'anssi',
    'bsi',
    'ncsc',
    'national security',
  ],
  Healthcare: ['healthcare', 'health care', 'hospital', 'medical', 'hipaa'],
  Telecommunications: ['telecom', 'telecommunications', '5g', 'gsma', '3gpp', 'mobile network'],
  Technology: ['software', 'cloud', 'tech company', 'technology company'],
  'Energy & Utilities': ['energy', 'utilities', 'utility', 'power grid', 'smart grid', 'scada'],
  Automotive: ['automotive', 'vehicle', 'vehicles', 'v2x'],
  Aerospace: ['aerospace', 'satellite', 'satellites', 'space agency', 'avionics'],
  'Retail & E-Commerce': ['retail', 'e-commerce', 'ecommerce'],
  Education: ['university', 'professor', 'education', 'teaching'],
  Manufacturing: ['manufacturing', 'industrial control', 'iec 62443', 'ot security'],
  Other: [],
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const industryPatterns = new Map<string, RegExp | null>(
  Object.entries(INDUSTRY_LEADER_KEYWORDS).map(([industry, words]) => [
    industry,
    words.length > 0
      ? new RegExp(`(?:^|[^a-z0-9])(?:${words.map(escapeRegex).join('|')})(?![a-z0-9])`, 'i')
      : null,
  ])
)

/** True when the profile's own text names one of the reader's industries. */
export function leaderMatchesIndustries(leader: Leader, industries: readonly string[]): boolean {
  if (industries.length === 0) return false
  const text = `${leader.bio} ${leader.organizations.join(' ')} ${leader.title}`
  return industries.some((ind) => industryPatterns.get(ind)?.test(text) ?? false)
}
