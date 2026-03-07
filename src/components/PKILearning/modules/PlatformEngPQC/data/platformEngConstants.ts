// SPDX-License-Identifier: GPL-3.0-only

export type PipelineStageName = 'source' | 'build' | 'sign' | 'registry' | 'deploy' | 'runtime'

export type CryptoAssetType =
  | 'signing-key'
  | 'tls-session'
  | 'certificate'
  | 'token'
  | 'secret'
  | 'hash'

export type AlgorithmFamily =
  | 'ecdsa'
  | 'rsa'
  | 'hmac'
  | 'ecdh'
  | 'ed25519'
  | 'aes'
  | 'sha'
  | 'ml-dsa'
  | 'ml-kem'
  | 'slh-dsa'

export type HNDLExposure = 'high' | 'medium' | 'low' | 'none'

export type PQCReadiness = 'available' | 'beta' | 'roadmap' | 'not-planned'

export type SigningSchemeId = 'cosign' | 'notation' | 'gpg' | 'sigstore-bundle' | 'dct'

export type PolicyEngine = 'opa' | 'kyverno' | 'conftest' | 'cel'

export type MonitoringSource = 'cert-manager' | 'prometheus' | 'vault' | 'istio' | 'siem'

export type MigrationPriority = 'critical' | 'high' | 'medium' | 'low'

export interface CryptoAsset {
  id: string
  name: string
  type: CryptoAssetType
  algorithm: AlgorithmFamily
  keySize: string
  quantumVulnerable: boolean
  hndlRisk: HNDLExposure
  pqcReplacement: string
  pqcAlgorithm: AlgorithmFamily
  /** How long signatures / certs from this asset must remain trusted */
  exposureWindow: string
  notes?: string
}

export interface PipelineStage {
  id: PipelineStageName
  label: string
  description: string
  tools: string[]
  cryptoAssets: CryptoAsset[]
  hndlExposure: HNDLExposure
  migrationPriority: MigrationPriority
}

export interface SigningTool {
  id: SigningSchemeId
  name: string
  description: string
  vendor: string
  signingAlgorithm: AlgorithmFamily
  signatureFormat: string
  transparencyLog: boolean
  pqcReadiness: PQCReadiness
  pqcNotes: string
  pqcAlgorithm?: AlgorithmFamily
  estimatedPqcYear: string
  strengths: string[]
  limitations: string[]
}

export interface IaCPattern {
  id: string
  tool: 'terraform' | 'helm' | 'cert-manager' | 'vault' | 'kubernetes'
  title: string
  vulnerability: string
  vulnerableConfig: string
  pqcConfig: string
  algorithm: AlgorithmFamily
  pqcAlgorithm: AlgorithmFamily
  impact: string
}

export interface PolicyRule {
  id: string
  engine: PolicyEngine
  name: string
  description: string
  targetResource: string
  blockedAlgorithms: string[]
  requiredAlgorithms: string[]
  slsaLevel?: 1 | 2 | 3 | 4
  rule: string
  severity: 'error' | 'warning'
}

export interface AlertRule {
  name: string
  expression: string
  threshold: string
  severity: 'critical' | 'warning' | 'info'
}

export interface MonitoringTool {
  id: string
  name: string
  source: MonitoringSource
  description: string
  metricExamples: string[]
  alertExamples: AlertRule[]
  pqcSignal: string
  integrations: string[]
}

// ── Color maps (semantic tokens only) ──────────────────────────────────────

export const HNDL_COLORS: Record<HNDLExposure, string> = {
  high: 'bg-status-error/15 text-status-error border-status-error/30',
  medium: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  low: 'bg-status-info/15 text-status-info border-status-info/30',
  none: 'bg-muted text-muted-foreground border-border',
}

export const PQC_READINESS_COLORS: Record<PQCReadiness, string> = {
  available: 'bg-status-success/15 text-status-success border-status-success/30',
  beta: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  roadmap: 'bg-status-info/15 text-status-info border-status-info/30',
  'not-planned': 'bg-muted text-muted-foreground border-border',
}

export const PRIORITY_COLORS: Record<MigrationPriority, string> = {
  critical: 'bg-status-error/15 text-status-error border-status-error/30',
  high: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  medium: 'bg-status-info/15 text-status-info border-status-info/30',
  low: 'bg-muted text-muted-foreground border-border',
}

export const ALGORITHM_LABELS: Record<AlgorithmFamily, string> = {
  ecdsa: 'ECDSA',
  rsa: 'RSA',
  hmac: 'HMAC',
  ecdh: 'ECDH',
  ed25519: 'Ed25519',
  aes: 'AES',
  sha: 'SHA',
  'ml-dsa': 'ML-DSA',
  'ml-kem': 'ML-KEM',
  'slh-dsa': 'SLH-DSA',
}

export const HNDL_LABELS: Record<HNDLExposure, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  none: 'None',
}

export const PQC_READINESS_LABELS: Record<PQCReadiness, string> = {
  available: 'Available',
  beta: 'Beta',
  roadmap: 'On Roadmap',
  'not-planned': 'Not Planned',
}
