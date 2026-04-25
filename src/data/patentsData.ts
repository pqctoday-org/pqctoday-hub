// SPDX-License-Identifier: GPL-3.0-only
import { loadLatestCSV, splitSemicolon } from './csvUtils'
import type {
  PatentItem,
  CryptoAgilityMode,
  MigrationStrategy,
  QuantumRelevance,
  ClaimDependency,
  NistStatus,
  ImpactLevel,
  NistStatusValue,
} from '../types/PatentTypes'

interface RawPatentRow {
  patent_number: string
  title: string
  inventors: string
  assignee: string
  priority_date: string
  issue_date: string
  cpc_codes: string
  one_sentence_summary: string
  primary_inventive_claim: string
  crypto_agility_mode: string
  migration_strategy: string
  quantum_relevance: string
  quantum_notes: string
  protocols: string
  classical_algorithms: string
  pqc_algorithms: string
  quantum_technology: string
  key_management_ops: string
  hardware_components: string
  authentication_factors: string
  standards_referenced: string
  threat_model: string
  entropy_source: string
  primitive_types: string
  application_domain: string
  independent_claim_subjects: string
  performance_claims: string
  data_types_protected: string
  compliance_targets: string
  citation_graph: string
  claim_dependencies: string
  nist_round_status: string
}

const FIPS_STATUSES: NistStatusValue[] = ['fips_203', 'fips_204', 'fips_205']

function computeImpactScore(item: Omit<PatentItem, 'impactScore' | 'impactLevel'>): number {
  // Migration urgency (0–40)
  let urgency = 14
  const hasQuantumAttack = item.threatModel.includes('quantum-attack')
  if (item.cryptoAgilityMode === 'classical_only') {
    urgency = hasQuantumAttack ? 40 : 28
  } else if (item.cryptoAgilityMode === 'hybrid') {
    urgency = hasQuantumAttack ? 22 : 16
  } else if (item.cryptoAgilityMode === 'pqc_only') {
    urgency = 10
  } else if (item.cryptoAgilityMode === 'negotiated') {
    urgency = 18
  }

  // PQC coverage (0–30): count distinct FIPS-standardized algorithms
  const fipsCount = item.nistRoundStatus.filter((s) =>
    FIPS_STATUSES.includes(s.status as NistStatusValue)
  ).length
  const coverage = Math.min(fipsCount * 10, 30)

  // Claim breadth (0–20)
  const breadth = Math.min(item.independentClaimSubjects.length * item.applicationDomain.length, 20)

  // Data sensitivity (0–10)
  let sensitivity = 0
  const types = item.dataTypesProtected
  if (types.includes('PHI') || types.includes('biometric')) sensitivity += 5
  if (types.includes('financial')) sensitivity += 3
  if (types.includes('PII')) sensitivity += 2
  sensitivity = Math.min(sensitivity, 10)

  return urgency + coverage + breadth + sensitivity
}

function toImpactLevel(score: number): ImpactLevel {
  if (score >= 65) return 'High'
  if (score >= 35) return 'Medium'
  return 'Low'
}

function parseJsonField<T>(raw: string, fallback: T): T {
  if (!raw || raw.trim() === '') return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function transformRow(row: RawPatentRow): PatentItem | null {
  if (!row.patent_number?.trim()) return null

  const partial: Omit<PatentItem, 'impactScore' | 'impactLevel'> = {
    patentNumber: `US${row.patent_number.trim()}`,
    title: row.title?.trim() ?? '',
    inventors: row.inventors?.trim() ?? '',
    assignee: row.assignee?.trim() ?? '',
    priorityDate: row.priority_date?.trim() ?? '',
    issueDate: row.issue_date?.trim() ?? '',
    cpcCodes: row.cpc_codes?.trim() ?? '',
    summary: row.one_sentence_summary?.trim() ?? '',
    primaryInventiveClaim: row.primary_inventive_claim?.trim() ?? '',
    cryptoAgilityMode: (row.crypto_agility_mode?.trim() as CryptoAgilityMode) || 'unclear',
    migrationStrategy: (row.migration_strategy?.trim() as MigrationStrategy) || 'none',
    quantumRelevance: (row.quantum_relevance?.trim() as QuantumRelevance) || 'none',
    quantumNotes: row.quantum_notes?.trim() ?? '',
    protocols: splitSemicolon(row.protocols),
    classicalAlgorithms: splitSemicolon(row.classical_algorithms),
    pqcAlgorithms: splitSemicolon(row.pqc_algorithms),
    quantumTechnology: splitSemicolon(row.quantum_technology),
    keyManagementOps: splitSemicolon(row.key_management_ops),
    hardwareComponents: splitSemicolon(row.hardware_components),
    authenticationFactors: splitSemicolon(row.authentication_factors),
    standardsReferenced: splitSemicolon(row.standards_referenced),
    threatModel: splitSemicolon(row.threat_model),
    entropySource: splitSemicolon(row.entropy_source),
    primitiveTypes: splitSemicolon(row.primitive_types),
    applicationDomain: splitSemicolon(row.application_domain),
    independentClaimSubjects: splitSemicolon(row.independent_claim_subjects),
    performanceClaims: splitSemicolon(row.performance_claims),
    dataTypesProtected: splitSemicolon(row.data_types_protected),
    complianceTargets: splitSemicolon(row.compliance_targets),
    citationGraph: splitSemicolon(row.citation_graph),
    claimDependencies: parseJsonField<ClaimDependency[]>(row.claim_dependencies, []),
    nistRoundStatus: parseJsonField<NistStatus[]>(row.nist_round_status, []),
    priorityYear: parseInt(row.priority_date?.slice(0, 4) ?? '0', 10) || 0,
  }

  const impactScore = computeImpactScore(partial)
  return { ...partial, impactScore, impactLevel: toImpactLevel(impactScore) }
}

const modules = import.meta.glob('./patents_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
})

const result = loadLatestCSV<RawPatentRow, PatentItem>(
  modules,
  /patents_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
  transformRow
)

export const patentsData: PatentItem[] = result.data
export const patentsMetadata = result.metadata
