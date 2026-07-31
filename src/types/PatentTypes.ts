// SPDX-License-Identifier: GPL-3.0-only

export type CryptoAgilityMode = 'classical_only' | 'pqc_only' | 'hybrid' | 'negotiated' | 'unclear'
export type MigrationStrategy =
  | 'hybrid'
  | 'crypto_agility'
  | 'inventory'
  | 'assessment'
  | 'rip_and_replace'
  | 'in_place_upgrade'
  | 'none'
export type QuantumRelevance =
  | 'core_invention'
  | 'dependent_claim_only'
  | 'background_only'
  | 'none'
export type NistStatusValue =
  | 'fips_203'
  | 'fips_204'
  | 'fips_205'
  | 'round4_candidate'
  | 'withdrawn'
  | 'stateful_hash_standard'
  | 'proprietary'
  | 'classical'
export type ImpactLevel = 'High' | 'Medium' | 'Low'

export interface InsightsFilter {
  assignee?: string
  /** Matches against the raw patents.inventors field ("Surname; Givenname et al."),
   * word-set comparison not exact equality — see usePatentResults.ts's inventorMatches(). */
  inventor?: string
  /** Comma-separated patent_number list (bare or "US"-prefixed, either works —
   * see usePatentResults.ts). Used by the leaders page's "view N patents" link,
   * which already knows the exact patents (leader.patentRefs) rather than
   * needing to re-derive them via name matching — more reliable than `inventor`
   * for that one use case since patents.inventors is truncated/name-order-
   * inverted and can't always losslessly round-trip a display name. */
  patentIds?: string
  agility?: string
  domain?: string
  impact?: string
  quantumTech?: string
  quantumRelevance?: string
  region?: string
  protocol?: string
  classicalAlgorithm?: string
  hardwareComponent?: string
  nistStatus?: string
  /** Redesign: filter to patents covering a given PQC algorithm (leaderboard drill). */
  pqc?: string
  /** Redesign: synthetic predicate — patents mapping to a FIPS 203/4/5 standard (KPI drill). */
  fips?: string
  /** Redesign: filing-year chart bar click drill. */
  filingYear?: string
}

export interface ClaimDependency {
  claim: number
  depends_on: number[]
  subject: string
}

export interface NistStatus {
  algorithm: string
  status: NistStatusValue
}

export interface PatentItem {
  patentNumber: string
  title: string
  inventors: string
  assignee: string
  priorityDate: string
  issueDate: string
  filingDate: string
  cpcCodes: string
  summary: string
  primaryInventiveClaim: string
  cryptoAgilityMode: CryptoAgilityMode
  migrationStrategy: MigrationStrategy
  quantumRelevance: QuantumRelevance
  quantumNotes: string
  protocols: string[]
  classicalAlgorithms: string[]
  pqcAlgorithms: string[]
  quantumTechnology: string[]
  keyManagementOps: string[]
  hardwareComponents: string[]
  authenticationFactors: string[]
  standardsReferenced: string[]
  threatModel: string[]
  entropySource: string[]
  primitiveTypes: string[]
  applicationDomain: string[]
  independentClaimSubjects: string[]
  performanceClaims: string[]
  dataTypesProtected: string[]
  complianceTargets: string[]
  citationGraph: string[]
  claimDependencies: ClaimDependency[]
  nistRoundStatus: NistStatus[]
  // PQC migration relevance score (1–10, from score_patents_pqc.py). null when the
  // enrichment pipeline hasn't scored this patent yet — distinct from a genuine 0.
  pqcMigrationScore: number | null
  pqcMigrationReason: string
  // Computed
  impactScore: number
  impactLevel: ImpactLevel
  priorityYear: number
  filingYear: number
  // Corpus-diff badge: 'New' when absent from the previous dated CSV, 'Updated'
  // when present but any field changed. Undefined = unchanged since last update.
  status?: 'New' | 'Updated'
}
