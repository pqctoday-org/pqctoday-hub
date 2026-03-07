// SPDX-License-Identifier: GPL-3.0-only

// ── AI Pipeline Types ─────────────────────────────────────────────────────

export type AIPipelineType = 'llm-training' | 'fine-tuning' | 'rag' | 'inference-only'

export type PipelineStage =
  | 'ingestion'
  | 'preprocessing'
  | 'storage'
  | 'training'
  | 'inference'
  | 'output'

export type CryptoOperation = 'encrypt' | 'sign' | 'hash' | 'key-wrap' | 'key-exchange' | 'attest'

export interface PipelineStageCrypto {
  id: string
  stage: PipelineStage
  operation: CryptoOperation
  description: string
  classicalAlgorithm: string
  pqcAlgorithm: string
  quantumVulnerable: boolean
  hndlExposure: boolean
  dataAtRisk: string
  migrationPriority: number // 1–5 (5 = most urgent)
}

export interface AIPipelineProfile {
  id: string
  name: string
  type: AIPipelineType
  description: string
  stages: PipelineStageCrypto[]
}

// ── Data Authenticity Types ───────────────────────────────────────────────

export type DatasetScenario = 'web-scraped' | 'curated' | 'synthetic-mixed' | 'federated'

export type VerificationLayer =
  | 'c2pa-credentials'
  | 'perceptual-hashing'
  | 'watermark-detection'
  | 'provenance-chain'
  | 'statistical-detection'

export interface VerificationLayerProfile {
  id: VerificationLayer
  name: string
  description: string
  cryptoInvolved: string
  pqcRelevance: string
  accuracy: string
  performanceOverhead: string
  maturity: 'production' | 'emerging' | 'research'
}

export interface ModelCollapseDataPoint {
  generation: number
  humanDataPercent: number
  syntheticDataPercent: number
  qualityScore: number // 0–100
  perplexityIncrease: number // % increase from baseline
}

export interface DatasetScenarioProfile {
  id: DatasetScenario
  name: string
  description: string
  typicalSyntheticPercent: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  recommendedVerification: VerificationLayer[]
  provenanceSigningNeeded: boolean
}

// ── Model Protection Types ────────────────────────────────────────────────

export type ModelSizeCategory = '1B' | '7B' | '13B' | '70B' | '405B'

export type EncryptionAtRest = 'aes-256-gcm' | 'chacha20-poly1305'

export type KeyWrappingAlgorithm =
  | 'rsa-2048'
  | 'ml-kem-768'
  | 'ml-kem-1024'
  | 'hybrid-ml-kem-x25519'

export type ModelSigningAlgorithm =
  | 'rsa-2048'
  | 'ecdsa-p256'
  | 'ml-dsa-44'
  | 'ml-dsa-65'
  | 'slh-dsa-sha2-128s'

export type DeploymentMode = 'cloud-tee' | 'on-prem-hsm' | 'edge-device' | 'federated'

export interface ModelSizeProfile {
  id: ModelSizeCategory
  label: string
  parameterCount: string
  typicalFileSizeGB: number
  trainingCostEstimate: string
  hndlValueAssessment: string
}

export interface ProtectionOverhead {
  algorithmId: string
  algorithmLabel: string
  keyOrSignatureSize: number // bytes
  operationTimeMs: number
  quantumSafe: boolean
  nistLevel: number // 0 = none, 1/2/3/5
}

// ── Agent Identity Types ──────────────────────────────────────────────────

export type AgentType = 'autonomous-service' | 'human-delegated' | 'multi-agent-coordinator'

export type CredentialType = 'x509-cert' | 'jwt-dpop' | 'oauth2-client-cert' | 'mtls'

export type DelegationDepth = 0 | 1 | 2 | 3

export interface AgentIdentityProfile {
  id: string
  name: string
  type: AgentType
  description: string
  typicalCredentialLifetimeHours: number
  renewalStrategy: string
  hndlExposureNotes: string
}

export interface DelegationChainLink {
  from: string
  to: string
  credentialType: CredentialType
  signingAlgorithm: string
  tokenSizeClassical: number // bytes
  tokenSizePQC: number // bytes
  quantumVulnerable: boolean
}

// ── Agentic Commerce Types ────────────────────────────────────────────────

export type CommerceScenario =
  | 'simple-purchase'
  | 'multi-agent-negotiation'
  | 'supply-chain'
  | 'subscription'

export type CommerceActor =
  | 'user'
  | 'buyer-agent'
  | 'seller-agent'
  | 'arbiter'
  | 'payment-service'
  | 'registry'

export interface CommerceFlowStep {
  id: string
  order: number
  label: string
  fromActor: CommerceActor
  toActor: CommerceActor
  description: string
  cryptoUsed: string[]
  quantumVulnerable: boolean
  pqcReplacement?: string
  latencyMs: number
  pqcLatencyMs: number
}

export interface CommerceFlow {
  id: string
  name: string
  scenario: CommerceScenario
  description: string
  steps: CommerceFlowStep[]
}

// ── Agent-to-Agent Protocol Types ─────────────────────────────────────────

export type TransportProtocol = 'tls-1.3' | 'dtls-1.3' | 'quic' | 'custom'

export type AuthMethod = 'mtls-ml-dsa' | 'dpop-token' | 'pre-shared-key'

export type MessageSigning = 'ml-dsa-44' | 'ml-dsa-65' | 'slh-dsa' | 'none'

export type SessionKEM = 'ml-kem-768' | 'ml-kem-1024' | 'hybrid-ml-kem-x25519'

export type MessageFormat = 'signed-json' | 'cose' | 'protobuf-detached'

export interface ProtocolConfig {
  transport: TransportProtocol
  authMethod: AuthMethod
  messageSigning: MessageSigning
  sessionKEM: SessionKEM
  messageFormat: MessageFormat
}

export interface ProtocolMetrics {
  handshakeBytes: number
  perMessageOverheadBytes: number
  handshakeLatencyMs: number
  securityLevel: number
  quantumSafe: boolean
  interoperabilityScore: number // 1–5
}

// ── Scale Encryption Types ────────────────────────────────────────────────

export interface InfrastructureParams {
  datasetSizeGB: number
  modelCount: number
  inferenceRequestsPerDay: number
  agentCount: number
  retentionYears: number
  regions: number
}

export interface ScaleAnalysis {
  totalDEKs: number
  totalKEKs: number
  kmsOperationsPerDay: number
  storageOverheadGB: number
  bandwidthOverheadPercent: number
  hndlRiskWindow: string
  migrationPhases: MigrationPhase[]
}

export interface MigrationPhase {
  phase: number
  name: string
  durationMonths: number
  components: string[]
  pqcAlgorithms: string[]
  effortLevel: 'low' | 'medium' | 'high'
}

export type PrivacyTechnique = 'fhe' | 'mpc' | 'differential-privacy' | 'federated-learning' | 'tee'

export interface PrivacyTechProfile {
  id: PrivacyTechnique
  name: string
  description: string
  performanceOverhead: string
  pqcRelevance: string
  quantumSafe: boolean
  maturity: 'production' | 'emerging' | 'research'
  useCases: string[]
}

// ── UI Color Maps ─────────────────────────────────────────────────────────

export const PIPELINE_STAGE_COLORS: Record<PipelineStage, string> = {
  ingestion: 'bg-primary/20 text-primary border-primary/50',
  preprocessing: 'bg-status-info/20 text-status-info border-status-info/50',
  storage: 'bg-secondary/20 text-secondary border-secondary/50',
  training: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  inference: 'bg-status-success/20 text-status-success border-status-success/50',
  output: 'bg-accent/20 text-accent border-accent/50',
}

export const PIPELINE_STAGE_LABELS: Record<PipelineStage, string> = {
  ingestion: 'Data Ingestion',
  preprocessing: 'Preprocessing',
  storage: 'Storage',
  training: 'Training',
  inference: 'Inference',
  output: 'Output',
}

export const AGENT_TYPE_COLORS: Record<AgentType, string> = {
  'autonomous-service': 'bg-primary/20 text-primary border-primary/50',
  'human-delegated': 'bg-status-warning/20 text-status-warning border-status-warning/50',
  'multi-agent-coordinator': 'bg-status-info/20 text-status-info border-status-info/50',
}

export const AGENT_TYPE_LABELS: Record<AgentType, string> = {
  'autonomous-service': 'Autonomous Service',
  'human-delegated': 'Human-Delegated',
  'multi-agent-coordinator': 'Multi-Agent Coordinator',
}

export const COMMERCE_ACTOR_COLORS: Record<CommerceActor, string> = {
  user: 'bg-primary/20 text-primary border-primary/50',
  'buyer-agent': 'bg-status-info/20 text-status-info border-status-info/50',
  'seller-agent': 'bg-status-warning/20 text-status-warning border-status-warning/50',
  arbiter: 'bg-secondary/20 text-secondary border-secondary/50',
  'payment-service': 'bg-status-success/20 text-status-success border-status-success/50',
  registry: 'bg-accent/20 text-accent border-accent/50',
}

export const COMMERCE_ACTOR_LABELS: Record<CommerceActor, string> = {
  user: 'User',
  'buyer-agent': 'Buyer Agent',
  'seller-agent': 'Seller Agent',
  arbiter: 'Arbiter',
  'payment-service': 'Payment Service',
  registry: 'Registry',
}

export const DATASET_RISK_COLORS: Record<string, string> = {
  low: 'bg-status-success/20 text-status-success border-status-success/50',
  medium: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  high: 'bg-status-error/20 text-status-error border-status-error/50',
  critical: 'bg-status-error/30 text-status-error border-status-error/70',
}

export const PRIVACY_MATURITY_COLORS: Record<string, string> = {
  production: 'bg-status-success/20 text-status-success border-status-success/50',
  emerging: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  research: 'bg-secondary/20 text-secondary border-secondary/50',
}

export const EFFORT_COLORS: Record<string, string> = {
  low: 'bg-status-success/20 text-status-success border-status-success/50',
  medium: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  high: 'bg-status-error/20 text-status-error border-status-error/50',
}

export const CREDENTIAL_TYPE_LABELS: Record<CredentialType, string> = {
  'x509-cert': 'X.509 Certificate',
  'jwt-dpop': 'JWT with DPoP',
  'oauth2-client-cert': 'OAuth2 Client Cert',
  mtls: 'Mutual TLS',
}
