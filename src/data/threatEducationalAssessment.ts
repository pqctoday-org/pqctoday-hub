// SPDX-License-Identifier: AGPL-3.0-only
import type { ThreatData } from './threatsData'
import { getThreatRecordType, type ThreatRecordType } from './threatRecordTypes'

export const CANDIDATE_RESPONSE_MATURITY = [
  'not specified',
  'standardized components; deployment pattern unverified',
  'draft or proposed',
  'experimental or research',
  'site-derived suggestion',
] as const

export type CandidateResponseMaturity = (typeof CANDIDATE_RESPONSE_MATURITY)[number]

const PRIORITY_FOCUS: Record<ThreatRecordType, string> = {
  'threat scenario': 'a scenario that can expose a cryptographic security property',
  'implementation vulnerability': 'an implementation weakness that can defeat a PQC control',
  'migration constraint': 'a constraint that can delay or complicate migration',
  'policy/deadline signal': 'an authority signal that can change transition timing or scope',
  'standards/adoption milestone': 'a milestone that changes available migration options',
  'quantum-capability evidence': 'evidence relevant to assessing quantum capability',
  'educational guidance': 'guidance that can shape a learner’s migration decisions',
}

function consequenceText(threat: ThreatData): string {
  if (threat.threatClass === 'hndl') return 'long-lived confidentiality exposure'
  if (threat.threatClass === 'hnfl') return 'authentication or signature-lifecycle exposure'
  if (threat.threatClass === 'both') {
    return 'both long-lived confidentiality and authentication/signature exposure'
  }
  return 'the cryptographic consequence described in the record'
}

/** Explain the existing editorial label without inventing a likelihood score. */
export function sitePriorityRationale(threat: ThreatData): string {
  const type = getThreatRecordType(threat)
  return `${threat.criticality} is a PQC Today editorial triage label for ${PRIORITY_FOCUS[type]} involving ${consequenceText(threat)}. It does not measure likelihood, regulatory applicability, or your organisation’s risk.`
}

/**
 * Conservative maturity derived only from the candidate-response text. Even
 * standardized components do not make the combined deployment pattern a
 * standard or an authority recommendation.
 */
export function candidateResponseMaturity(threat: ThreatData): CandidateResponseMaturity {
  const response = threat.pqcReplacement.trim()
  if (!response) return 'not specified'
  if (/\b(experiment(?:al)?|research|prototype|proof[- ]of[- ]concept|trial)\b/i.test(response)) {
    return 'experimental or research'
  }
  if (/\b(draft|proposed|planned|candidate|future)\b/i.test(response)) return 'draft or proposed'
  if (/\b(ML-KEM|ML-DSA|SLH-DSA|FIPS 203|FIPS 204|FIPS 205|AES-256|LMS|XMSS)\b/i.test(response)) {
    return 'standardized components; deployment pattern unverified'
  }
  return 'site-derived suggestion'
}

export function candidateResponseMaturityText(threat: ThreatData): string {
  const maturity = candidateResponseMaturity(threat)
  if (maturity === 'not specified') return 'Maturity: not specified.'
  if (maturity === 'standardized components; deployment pattern unverified') {
    return 'Maturity: standardized components are named, but this deployment pattern is not verified by that fact alone.'
  }
  if (maturity === 'draft or proposed') {
    return 'Maturity: the response names draft, proposed, planned, candidate, or future work.'
  }
  if (maturity === 'experimental or research') {
    return 'Maturity: the response is experimental or research-oriented.'
  }
  return 'Maturity: site-derived suggestion; validate applicability and supporting authority.'
}
