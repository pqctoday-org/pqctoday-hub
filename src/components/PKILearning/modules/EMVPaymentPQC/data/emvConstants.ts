// SPDX-License-Identifier: AGPL-3.0-only

// ---------------------------------------------------------------------------
// Payment Network identifiers
// ---------------------------------------------------------------------------

export type PaymentNetworkId = 'visa' | 'mastercard' | 'amex' | 'unionpay' | 'discover'

export type PQCPosture =
  'prototype-testing' | 'published-guidance' | 'readiness-program' | 'shared-standards'

export interface PaymentNetworkSource {
  label: string
  url: string
}

export type RadarAxisKey =
  | 'scale'
  | 'offlineExposure'
  | 'tokenization'
  | 'pqcReadiness'
  | 'regulatoryPressure'
  | 'legacyBurden'

/** What a network's volume figure measures. Only `purchase-volume` rows can be added together. */
export type NetworkVolumeMetric =
  'purchase-volume' | 'network-volume-incl-cash-and-alternative-payments'

/** One dated volume figure with the population and period it describes. */
export interface NetworkVolumeFact {
  usdBn: number
  metric: NetworkVolumeMetric
  /** ISO dates, inclusive. */
  periodStart: string
  periodEnd: string
  currency: 'USD'
  /** True when the source reports "more than" rather than an exact figure. */
  lowerBound: boolean
  scope: string
  cashIncluded: boolean
}

export interface NetworkFiguresSource {
  label: string
  url: string
  /** Publication date when the source gives one. */
  published: string | null
  /** Date the page was checked when the source is undated. */
  checked: string | null
  /** Where in the source the figures appear. */
  location: string
}

/** Dated, sourced context for a network's card and volume figures. */
export interface NetworkFigures {
  cards: {
    /** ISO date the count refers to. Null for an older figure whose date and scope are not established. */
    asOf: string | null
    scope: string
    lowerBound: boolean
  }
  /** Null when no same-scope, dated volume is established for this network. */
  volume: NetworkVolumeFact | null
  /** Why the volume is absent or why it is described the way it is. */
  volumeNote: string
  /** Other separately named, sourced figures that are not part of the purchase-volume comparison. */
  otherFacts: string[]
  source: NetworkFiguresSource | null
}

export interface PaymentNetwork {
  id: PaymentNetworkId
  name: string
  abbreviation: string
  headquartersRegion: string
  /** Display text for the card count, with its date and unit where the source gives them. */
  cardsInCirculation: string
  cardsInCirculationNum: number
  /** Display text for the volume, with its metric and period where the source gives them. */
  annualTransactionVolume: string
  figures: NetworkFigures
  offlineAuthSupported: boolean
  tokenizationPlatform: string
  emvcoMember: boolean
  currentCrypto: {
    offlineAuth: string[]
    onlineAuth: string[]
    keyManagement: string[]
    ecommerce: string[]
  }
  pqcPosture: PQCPosture
  /** What the network or its owner has said or demonstrated publicly. */
  pqcStance: string
  pqcInitiatives: string[]
  /** Public next steps, or a clearly labelled inference when no network plan is published. */
  pqcTimeline: string
  evidenceBasis: string
  officialSources: PaymentNetworkSource[]
  /**
   * 0-5 scores for the radar chart, each derived from the rule in RADAR_RUBRIC and its basis.
   * Null means "not scored": no sourced basis is shown on the page. It never means 0.
   */
  radarScores: Record<RadarAxisKey, number | null>
  /** One sentence per axis saying where the score, or the absence of one, comes from. */
  radarBasis: Record<RadarAxisKey, string>
}

// ---------------------------------------------------------------------------
// EMV Transaction Flow
// ---------------------------------------------------------------------------

export type TransactionMode =
  'online' | 'offline-dda' | 'offline-cda' | 'contactless' | 'mobile-pay'

export type FlowActor =
  'card' | 'terminal' | 'acquirer' | 'network' | 'issuer' | 'tsp' | 'mobile-wallet'

export type FlowStepType = 'init' | 'authenticate' | 'authorize' | 'crypto' | 'response'

export interface TransactionFlowStep {
  id: string
  order: number
  label: string
  type: FlowStepType
  fromActor: FlowActor
  toActor: FlowActor
  description: string
  cryptoUsed: string[]
  quantumVulnerable: boolean
  pqcReplacement?: string
  dataSize: string
  latencyMs: number
}

export interface TransactionFlow {
  id: string
  name: string
  mode: TransactionMode
  description: string
  steps: TransactionFlowStep[]
  totalLatencyMs: number
  quantumVulnerableSteps: number
}

// ---------------------------------------------------------------------------
// Card Authentication
// ---------------------------------------------------------------------------

export type AuthMethod = 'sda' | 'dda' | 'cda'

export interface CardAuthSpec {
  id: AuthMethod
  name: string
  fullName: string
  algorithm: string
  keySize: number
  signatureBytes: number
  offlineCapable: boolean
  quantumVulnerable: boolean
  description: string
  howItWorks: string[]
  strengths: string[]
  weaknesses: string[]
  pqcMigrationPath: string
  prevalence: string
}

// ---------------------------------------------------------------------------
// Card Provisioning
// ---------------------------------------------------------------------------

export type ProvisioningPhase =
  'chip-os' | 'pre-perso' | 'personalization' | 'key-injection' | 'activation'

export interface ProvisioningStep {
  id: string
  phase: ProvisioningPhase
  order: number
  label: string
  description: string
  actor: string
  cryptoUsed: string[]
  quantumVulnerable: boolean
  pqcReplacement?: string
  dataElements: string[]
}

export type CertChainAlgorithm = 'rsa-2048' | 'ml-dsa-44' | 'fn-dsa-512'

export interface CertChainLevel {
  level: string
  label: string
  algorithm: string
  publicKeyBytes: number
  signatureBytes: number
  certificateBytes: number
}

export interface CertChainComparison {
  algorithm: CertChainAlgorithm
  label: string
  description: string
  fipsStatus: string
  levels: CertChainLevel[]
  totalChainBytes: number
}

// ---------------------------------------------------------------------------
// Tokenization
// ---------------------------------------------------------------------------

export type TokenServiceProviderId = 'visa-vts' | 'mc-mdes' | 'amex-est'

export type MobileWalletId = 'apple-pay' | 'google-pay' | 'samsung-pay'

export interface TokenizationProtectionComponent {
  boundary:
    | 'transport-key-establishment'
    | 'transport-authentication'
    | 'request-authentication'
    | 'payload-protection'
    | 'key-delivery'
    | 'device-attestation'
    | 'internal-operation'
  assessment: 'classical-public-key' | 'symmetric' | 'unspecified'
  provenance: 'authored-sample' | 'approved-shared-tls-assumption'
  description: string
}

export interface TokenizationStep {
  id: string
  order: number
  label: string
  actor: string
  description: string
  cryptoUsed: string[]
  protectionComponents: TokenizationProtectionComponent[]
  quantumVulnerable: boolean | null
  pqcReplacement?: string
}

export interface TokenizationFlow {
  id: string
  name: string
  tsp: TokenServiceProviderId
  description: string
  steps: TokenizationStep[]
}

export interface MobileWallet {
  id: MobileWalletId
  name: string
  secureElement: string
  tokenProtocol: string
  biometricAuth: string[]
  cryptoCapabilities: string[]
  pqcStatus: string
}

// ---------------------------------------------------------------------------
// POS Terminal & Key Management
// ---------------------------------------------------------------------------

export type TerminalType = 'traditional-pos' | 'mpos' | 'softpos' | 'atm' | 'unattended'

export type KeyScheme = 'dukpt-3des' | 'dukpt-aes' | 'mk-sk' | 'rsa-key-transport'

export interface POSTerminalProfile {
  id: string
  name: string
  type: TerminalType
  processorClass: string
  ramKB: number
  flashKB: number
  tamperResistant: boolean
  keySchemes: KeyScheme[]
  cryptoChips: string[]
  quantumVulnerabilities: string[]
  pqcConstraints: string[]
}

export interface KeyInjectionStep {
  order: number
  label: string
  description: string
  cryptoUsed: string
  quantumVulnerable: boolean
  pqcReplacement: string
}

export interface KeyInjectionCeremony {
  id: string
  name: string
  description: string
  steps: KeyInjectionStep[]
}

// ---------------------------------------------------------------------------
// Migration Risk Matrix
// ---------------------------------------------------------------------------

export type PaymentComponent =
  | 'emv-offline-auth'
  | 'online-authorization'
  | 'pin-encryption'
  | 'key-injection'
  | 'tokenization'
  | 'ecommerce-tls'
  | '3ds-authentication'
  | 'hsm-key-wrapping'
  | 'card-personalization'
  | 'mobile-wallet-provisioning'

export type MigrationSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface PaymentMigrationVector {
  id: string
  component: PaymentComponent
  componentLabel: string
  currentCrypto: string[]
  vulnerability: string
  severity: MigrationSeverity
  hndlExposure: boolean
  affectedScale: string
  /** 1-5 (1 = easy, 5 = extremely hard) */
  migrationEffort: number
  migrationTimeline: string
  pqcSolution: string[]
  /** Other components that must migrate first */
  dependencies: PaymentComponent[]
  /** Empty = all networks */
  networkSpecific: PaymentNetworkId[]
  crossModuleRef?: string
}

// ---------------------------------------------------------------------------
// PQC Algorithm Size Comparison (for constrained environments)
// ---------------------------------------------------------------------------

export interface AlgorithmSizeProfile {
  algorithm: string
  publicKeyBytes: number
  signatureOrCiphertextBytes: number
  suitableForCard: boolean
  suitableForTerminal: boolean
  notes: string
}

// ---------------------------------------------------------------------------
// UI Constants — semantic tokens only
// ---------------------------------------------------------------------------

export const PQC_POSTURE_COLORS: Record<PQCPosture, string> = {
  'prototype-testing': 'bg-status-success/20 text-status-success border-status-success/50',
  'published-guidance': 'bg-primary/20 text-primary border-primary/50',
  'readiness-program': 'bg-status-warning/20 text-status-warning border-status-warning/50',
  'shared-standards': 'bg-muted text-muted-foreground border-border',
}

export const PQC_POSTURE_LABELS: Record<PQCPosture, string> = {
  'prototype-testing': 'Prototype Testing',
  'published-guidance': 'Published Guidance',
  'readiness-program': 'Readiness Program',
  'shared-standards': 'Shared Standards Work',
}

export const SEVERITY_COLORS: Record<MigrationSeverity, string> = {
  critical: 'bg-status-error/20 text-status-error border-status-error/50',
  high: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  medium: 'bg-primary/20 text-primary border-primary/50',
  low: 'bg-muted text-muted-foreground border-border',
}

export const SEVERITY_LABELS: Record<MigrationSeverity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

export const ACTOR_COLORS: Record<FlowActor, string> = {
  card: 'bg-primary/20 text-primary border-primary/50',
  terminal: 'bg-status-warning/20 text-status-warning border-status-warning/50',
  acquirer: 'bg-accent/20 text-accent border-accent/50',
  network: 'bg-status-info/20 text-status-info border-status-info/50',
  issuer: 'bg-status-success/20 text-status-success border-status-success/50',
  tsp: 'bg-status-error/20 text-status-error border-status-error/50',
  'mobile-wallet': 'bg-primary/20 text-primary border-primary/50',
}

export const ACTOR_LABELS: Record<FlowActor, string> = {
  card: 'Card / Chip',
  terminal: 'Terminal',
  acquirer: 'Acquirer',
  network: 'Network',
  issuer: 'Issuer',
  tsp: 'TSP',
  'mobile-wallet': 'Mobile Wallet',
}

export const TERMINAL_TYPE_LABELS: Record<TerminalType, string> = {
  'traditional-pos': 'Traditional POS',
  mpos: 'mPOS',
  softpos: 'SoftPOS',
  atm: 'ATM',
  unattended: 'Unattended',
}

export const AUTH_METHOD_LABELS: Record<AuthMethod, string> = {
  sda: 'SDA',
  dda: 'DDA',
  cda: 'CDA',
}

export const PROVISIONING_PHASE_LABELS: Record<ProvisioningPhase, string> = {
  'chip-os': 'Chip OS',
  'pre-perso': 'Pre-Personalization',
  personalization: 'Personalization',
  'key-injection': 'Key Injection',
  activation: 'Activation',
}

export const TRANSACTION_MODE_LABELS: Record<TransactionMode, string> = {
  online: 'Online',
  'offline-dda': 'Offline (DDA)',
  'offline-cda': 'Offline (CDA)',
  contactless: 'Contactless',
  'mobile-pay': 'Mobile Pay',
}

export const RADAR_AXES = [
  { key: 'scale' as const, label: 'Scale' },
  { key: 'offlineExposure' as const, label: 'Offline Exposure' },
  { key: 'tokenization' as const, label: 'Tokenization' },
  { key: 'pqcReadiness' as const, label: 'PQC Readiness' },
  { key: 'regulatoryPressure' as const, label: 'Regulatory' },
  { key: 'legacyBurden' as const, label: 'Legacy Burden' },
]

export const KEY_SCHEME_LABELS: Record<KeyScheme, string> = {
  'dukpt-3des': 'DUKPT (3DES)',
  'dukpt-aes': 'DUKPT (AES)',
  'mk-sk': 'Master/Session',
  'rsa-key-transport': 'RSA Key Transport',
}
