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
  // Computed
  impactScore: number
  impactLevel: ImpactLevel
  priorityYear: number
}
