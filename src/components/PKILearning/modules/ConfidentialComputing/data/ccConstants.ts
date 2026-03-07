// SPDX-License-Identifier: GPL-3.0-only

// ── TEE Vendor Types ─────────────────────────────────────────────────────

export type TEEVendor =
  | 'intel-sgx'
  | 'intel-tdx'
  | 'arm-trustzone'
  | 'arm-cca'
  | 'amd-sev-snp'
  | 'risc-v-keystone'
  | 'aws-nitro'

export type TEEScope = 'process' | 'vm' | 'hardware-partition'

export type PQCReadiness = 'production' | 'preview' | 'planned' | 'community-only' | 'none'

export type MaturityLevel = 'mature' | 'emerging' | 'experimental'

export interface TEEArchitecture {
  id: TEEVendor
  name: string
  vendor: string
  scope: TEEScope
  description: string
  isolationMechanism: string
  memoryEncryption: string
  attestationType: 'local' | 'remote' | 'both'
  attestationRoot: string
  maxEnclaveSize: string
  keyManagement: string
  sideChannelProtection: string[]
  deploymentModel: 'on-prem' | 'cloud' | 'both'
  cloudProviders: string[]
  maturityLevel: MaturityLevel
  pqcReadiness: PQCReadiness
  pqcNotes: string
  strengths: string[]
  limitations: string[]
  /** Normalized 0–5 scores for radar chart */
  radarScores: {
    isolation: number
    encryption: number
    attestation: number
    cloud: number
    pqc: number
    maturity: number
  }
}

// ── Attestation Types ────────────────────────────────────────────────────

export type AttestationStepType = 'generate' | 'sign' | 'verify' | 'provision'

export type AttestationActor = 'enclave' | 'platform' | 'attestation-service' | 'relying-party'

export interface AttestationStep {
  id: string
  order: number
  label: string
  type: AttestationStepType
  actor: AttestationActor
  description: string
  cryptoUsed: string[]
  quantumVulnerable: boolean
  pqcReplacement?: string
  dataExchanged: string
}

export interface AttestationFlow {
  id: string
  name: string
  teeVendor: TEEVendor
  steps: AttestationStep[]
  rootOfTrust: string
  signingAlgorithm: string
  hashAlgorithm: string
  pqcMigrationStatus: PQCReadiness
  pqcMigrationNotes: string
}

// ── Memory Encryption Types ──────────────────────────────────────────────

export type QuantumImpact = 'none' | 'grover-halved' | 'key-expansion-needed'

export interface MemoryEncryptionEngine {
  id: string
  name: string
  vendor: string
  algorithm: string
  keyWidth: number
  granularity: string
  integrityProtection: boolean
  integrityMechanism?: string
  quantumImpact: QuantumImpact
  quantumNotes: string
  sealingKeyDerivation: string
  /** Scope of protection */
  protectionScope: string[]
}

// ── TEE-HSM Integration Types ────────────────────────────────────────────

export type ChannelType = 'pkcs11' | 'kmip' | 'rest-api' | 'proprietary'

export interface TEEHSMIntegration {
  id: string
  name: string
  teeVendor: TEEVendor
  hsmVendor: string
  channelType: ChannelType
  mutualAttestation: boolean
  tlsChannelBinding: boolean
  currentSigningAlgo: string
  currentKEM: string
  pqcSigningAlgo?: string
  pqcKEM?: string
  keyProvisioningFlow: string
  migrationComplexity: 'low' | 'medium' | 'high'
  notes: string
}

// ── Quantum Threat Assessment Types ──────────────────────────────────────

export type ThreatSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface QuantumThreatVector {
  id: string
  name: string
  component: string
  currentCrypto: string
  vulnerability: string
  severity: ThreatSeverity
  migrationPriority: number
  pqcSolution: string
  vendorTimeline: string
  hndlExposure: boolean
  /** Normalized effort score 1-5 (1 = easy, 5 = hard) */
  migrationEffort: number
}

// ── UI Helper Constants ──────────────────────────────────────────────────

export const SEVERITY_COLORS: Record<ThreatSeverity, string> = {
  critical: 'bg-status-error/20 text-status-error border-status-error/50',
  high: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  medium: 'bg-primary/20 text-primary border-primary/50',
  low: 'bg-muted text-muted-foreground border-border',
}

export const SCOPE_LABELS: Record<TEEScope, string> = {
  process: 'Process-Level',
  vm: 'VM-Level',
  'hardware-partition': 'Hardware Partition',
}

export const PQC_READINESS_COLORS: Record<PQCReadiness, string> = {
  production: 'bg-status-success/20 text-status-success border-status-success/50',
  preview: 'bg-primary/20 text-primary border-primary/50',
  planned: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  'community-only': 'bg-secondary/20 text-secondary border-secondary/50',
  none: 'bg-muted text-muted-foreground border-border',
}

export const MATURITY_COLORS: Record<MaturityLevel, string> = {
  mature: 'bg-status-success/20 text-status-success border-status-success/50',
  emerging: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  experimental: 'bg-secondary/20 text-secondary border-secondary/50',
}

export const ACTOR_LABELS: Record<AttestationActor, string> = {
  enclave: 'Enclave',
  platform: 'Platform Agent',
  'attestation-service': 'Attestation Service',
  'relying-party': 'Relying Party',
}

export const ACTOR_COLORS: Record<AttestationActor, string> = {
  enclave: 'bg-primary/20 text-primary border-primary/50',
  platform: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  'attestation-service': 'bg-secondary/20 text-secondary border-secondary/50',
  'relying-party': 'bg-status-success/20 text-status-success border-status-success/50',
}

export const RADAR_AXES = [
  { key: 'isolation' as const, label: 'Isolation' },
  { key: 'encryption' as const, label: 'Encryption' },
  { key: 'attestation' as const, label: 'Attestation' },
  { key: 'cloud' as const, label: 'Cloud' },
  { key: 'pqc' as const, label: 'PQC' },
  { key: 'maturity' as const, label: 'Maturity' },
]
