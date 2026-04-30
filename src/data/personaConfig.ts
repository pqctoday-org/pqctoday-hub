// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from './learningPersonas'
import type { Region } from '../store/usePersonaStore'
import type { AssessmentMode } from '../store/useAssessmentStore'

/**
 * Nav paths shown per persona (on top of always-visible pages).
 * Always-visible: '/', '/learn', '/timeline', '/threats', '/about'
 * null = show all (researcher / no persona)
 */
export const PERSONA_NAV_PATHS: Record<PersonaId, string[] | null> = {
  executive: [
    '/migrate',
    '/compliance',
    '/business',
    '/assess',
    '/report',
    '/library',
    '/leaders',
    '/patents',
  ],
  developer: [
    '/migrate',
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/playground',
    '/openssl',
    '/patents',
  ],
  architect: [
    '/migrate',
    '/compliance',
    '/business',
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/playground',
    '/leaders',
    '/patents',
  ],
  researcher: null,
  ops: [
    '/migrate',
    '/compliance',
    '/business',
    '/assess',
    '/report',
    '/library',
    '/playground',
    '/openssl',
  ],
  curious: ['/explore', '/compliance', '/assess', '/report', '/library', '/leaders'],
}

/**
 * Top 3 landing page feature card paths to badge as "Recommended" per persona.
 */
export const PERSONA_RECOMMENDED_PATHS: Record<PersonaId, string[]> = {
  executive: ['/learn', '/assess', '/business', '/compliance'],
  developer: ['/learn', '/algorithms', '/playground', '/openssl'],
  architect: ['/learn', '/timeline', '/assess', '/business'],
  researcher: ['/learn', '/algorithms', '/playground', '/library', '/patents'],
  ops: ['/learn', '/migrate', '/openssl', '/assess'],
  curious: ['/learn', '/timeline', '/assess', '/threats'],
}

/**
 * Recommended assessment mode per persona.
 * Executives benefit from the quick path; technical personas from comprehensive.
 */
export const PERSONA_RECOMMENDED_MODE: Record<PersonaId, AssessmentMode> = {
  executive: 'quick',
  developer: 'comprehensive',
  architect: 'comprehensive',
  researcher: 'comprehensive',
  ops: 'comprehensive',
  curious: 'quick',
}

/**
 * Broad region → representative country name matching timeline CSV data.
 * null means no pre-filter (Global).
 * @deprecated Use REGION_COUNTRIES_MAP for multi-country region filtering.
 */
export const REGION_COUNTRY_MAP: Record<Region, string | null> = {
  americas: 'United States',
  eu: null,
  apac: 'Japan',
  global: null,
}

/**
 * Broad region → all matching country names in the timeline CSV data.
 * Used to power multi-country region filter in the Gantt chart.
 */
export const REGION_COUNTRIES_MAP: Record<Region, string[]> = {
  americas: ['United States', 'Canada'],
  eu: [
    'European Union',
    'France',
    'Germany',
    'Italy',
    'Spain',
    'United Kingdom',
    'Czech Republic',
    'Israel',
    'United Arab Emirates',
    'Saudi Arabia',
    'Bahrain',
    'Jordan',
  ],
  apac: [
    'Japan',
    'Singapore',
    'Australia',
    'South Korea',
    'Taiwan',
    'India',
    'China',
    'New Zealand',
    'Hong Kong',
    'Malaysia',
  ],
  global: ['Global', 'International', 'G7', 'NATO', 'BIS', 'GSMA'],
}

/**
 * Module ID → industries where this module is particularly relevant.
 * null means relevant to all industries.
 */
export const MODULE_INDUSTRY_RELEVANCE: Record<string, string[] | null> = {
  'pqc-101': null,
  'quantum-threats': null,
  'hybrid-crypto': ['Finance & Banking', 'Government & Defense', 'Technology'],
  'crypto-agility': ['Finance & Banking', 'Government & Defense', 'Telecommunications'],
  'tls-basics': ['Technology', 'Finance & Banking', 'Telecommunications'],
  'vpn-ssh-pqc': ['Technology', 'Government & Defense', 'Energy & Utilities'],
  'email-signing': ['Healthcare', 'Government & Defense', 'Finance & Banking'],
  'pki-workshop': ['Government & Defense', 'Finance & Banking', 'Healthcare'],
  'kms-pqc': ['Finance & Banking', 'Government & Defense', 'Healthcare', 'Technology'],
  'hsm-pqc': ['Finance & Banking', 'Government & Defense', 'Healthcare', 'Technology'],
  'stateful-signatures': ['Government & Defense', 'Aerospace', 'Technology'],
  'merkle-tree-certs': ['Technology', 'Finance & Banking', 'Government & Defense'],
  'digital-assets': ['Finance & Banking', 'Retail & E-Commerce', 'Technology'],
  '5g-security': ['Telecommunications', 'Government & Defense'],
  'digital-id': ['Government & Defense', 'Healthcare', 'Finance & Banking', 'Retail & E-Commerce'],
  'entropy-randomness': null,
  qkd: ['Government & Defense', 'Telecommunications', 'Finance & Banking', 'Energy & Utilities'],
  'code-signing': ['Technology', 'Government & Defense', 'Finance & Banking'],
  'api-security-jwt': ['Technology', 'Finance & Banking', 'Healthcare', 'Retail & E-Commerce'],
  'iot-ot-pqc': [
    'Energy & Utilities',
    'Automotive',
    'Telecommunications',
    'Government & Defense',
    'Healthcare',
  ],
  'pqc-risk-management': null,
  'pqc-business-case': null,
  'pqc-governance': null,
  'vendor-risk': [
    'Finance & Banking',
    'Government & Defense',
    'Healthcare',
    'Technology',
    'Energy & Utilities',
  ],
  'migration-program': null,
  'compliance-strategy': [
    'Finance & Banking',
    'Government & Defense',
    'Healthcare',
    'Telecommunications',
    'Energy & Utilities',
  ],
  'data-asset-sensitivity': [
    'Finance & Banking',
    'Government & Defense',
    'Healthcare',
    'Technology',
    'Telecommunications',
    'Energy & Utilities',
    'Retail & E-Commerce',
  ],
  'web-gateway-pqc': [
    'Technology',
    'Finance & Banking',
    'Retail & E-Commerce',
    'Healthcare',
    'Telecommunications',
  ],
  'ai-security-pqc': ['Technology', 'Finance & Banking', 'Government & Defense', 'Healthcare'],
  'emv-payment-pqc': ['Finance & Banking', 'Retail & E-Commerce'],
  'energy-utilities-pqc': ['Energy & Utilities', 'Government & Defense'],
  'healthcare-pqc': ['Healthcare', 'Government & Defense', 'Finance & Banking'],
  'aerospace-pqc': ['Aerospace', 'Government & Defense'],
  'automotive-pqc': ['Automotive'],
  'confidential-computing': [
    'Technology',
    'Finance & Banking',
    'Government & Defense',
    'Healthcare',
  ],
  'crypto-dev-apis': ['Technology', 'Finance & Banking', 'Government & Defense'],
  'database-encryption-pqc': [
    'Finance & Banking',
    'Healthcare',
    'Government & Defense',
    'Technology',
    'Retail & E-Commerce',
  ],
  'secrets-management-pqc': [
    'Technology',
    'Finance & Banking',
    'Healthcare',
    'Government & Defense',
  ],
  'network-security-pqc': [
    'Technology',
    'Finance & Banking',
    'Government & Defense',
    'Healthcare',
    'Telecommunications',
    'Energy & Utilities',
  ],
  'iam-pqc': [
    'Finance & Banking',
    'Government & Defense',
    'Healthcare',
    'Technology',
    'Retail & E-Commerce',
  ],
  'platform-eng-pqc': ['Technology', 'Finance & Banking', 'Government & Defense'],
  'secure-boot-pqc': [
    'Government & Defense',
    'Technology',
    'Aerospace',
    'Automotive',
    'Energy & Utilities',
  ],
  'os-pqc': ['Technology', 'Government & Defense', 'Finance & Banking'],
  'pqc-testing-validation': [
    'Technology',
    'Finance & Banking',
    'Government & Defense',
    'Telecommunications',
    'Healthcare',
  ],
  'standards-bodies': null,
  'exec-quantum-impact': null,
  'dev-quantum-impact': null,
  'arch-quantum-impact': null,
  'ops-quantum-impact': null,
  'research-quantum-impact': null,
  'crypto-mgmt-modernization': [
    'Finance & Banking',
    'Government & Defense',
    'Technology',
    'Healthcare',
  ],
  'slh-dsa': ['Government & Defense', 'Finance & Banking', 'Technology'],
}

/** Nav paths that are always shown regardless of persona. */
export const ALWAYS_VISIBLE_PATHS = [
  '/',
  '/learn',
  '/timeline',
  '/threats',
  '/about',
  '/changelog',
  '/faq',
  '/terms',
]

/**
 * Maps AVAILABLE_INDUSTRIES names (used in Assessment + store) to the
 * exact industry strings used in the threats CSV data.
 * Empty array = no matching threat category.
 * Multiple values = fold those CSV industries under this landing-page category.
 */
/**
 * Maps VendorPolicy cert industry slugs (e.g. 'finance') to the canonical
 * display labels used by compliance CSV, assessment data, and persona store.
 * Single source of truth — used in EmbedLayout to translate before seeding store.
 */
export const INDUSTRY_SLUG_TO_LABEL: Record<string, string> = {
  finance: 'Finance & Banking',
  healthcare: 'Healthcare',
  government: 'Government & Defense',
  defense: 'Government & Defense',
  telecom: 'Telecommunications',
  energy: 'Energy & Utilities',
  technology: 'Technology',
  education: 'Education',
  automotive: 'Automotive',
  aerospace: 'Aerospace',
  retail: 'Retail & E-Commerce',
}

export const INDUSTRY_TO_THREATS_MAP: Record<string, string[]> = {
  'Finance & Banking': [
    'Financial Services / Banking',
    'Insurance',
    'Payment Card Industry',
    'Cryptocurrency / Blockchain',
  ],
  'Government & Defense': ['Government / Defense', 'Legal / Notary / eSignature'],
  Healthcare: ['Healthcare / Pharmaceutical'],
  Telecommunications: ['Telecommunications'],
  Technology: [
    'IT Industry / Software',
    'Cloud Computing / Data Centers',
    'Internet of Things (IoT)',
    'Media / Entertainment / DRM',
    'Supply Chain / Logistics',
  ],
  'Energy & Utilities': ['Energy / Critical Infrastructure', 'Water / Wastewater'],
  Automotive: ['Automotive / Connected Vehicles', 'Rail / Transit'],
  Aerospace: ['Aerospace / Aviation'],
  'Retail & E-Commerce': ['Retail / E-Commerce'],
  Other: [],
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Report section configuration — per-persona open/collapsed/hidden states
 * ────────────────────────────────────────────────────────────────────────────── */

export type SectionState = 'open' | 'collapsed' | 'hidden'

export type ReportSectionId =
  | 'countryTimeline'
  | 'riskScore'
  | 'keyFindings'
  | 'riskBreakdown'
  | 'executiveSummary'
  | 'assessmentProfile'
  | 'hndlHnfl'
  | 'algorithmMigration'
  | 'complianceImpact'
  | 'recommendedActions'
  | 'migrationRoadmap'
  | 'migrationToolkit'
  | 'threatLandscape'

export interface ReportSectionConfig {
  state: SectionState
  /** Max items to show in summary mode (e.g., top 5 actions for executives). */
  maxItems?: number
}

/** Default section states when no persona is selected. */
const REPORT_SECTION_DEFAULTS: Record<ReportSectionId, ReportSectionConfig> = {
  countryTimeline: { state: 'collapsed' },
  riskScore: { state: 'open' },
  keyFindings: { state: 'open' },
  riskBreakdown: { state: 'open' },
  executiveSummary: { state: 'open' },
  assessmentProfile: { state: 'collapsed' },
  hndlHnfl: { state: 'open' },
  algorithmMigration: { state: 'open' },
  complianceImpact: { state: 'open' },
  recommendedActions: { state: 'open' },
  migrationRoadmap: { state: 'open' },
  migrationToolkit: { state: 'open' },
  threatLandscape: { state: 'collapsed' },
}

/** Per-persona overrides — only differences from defaults. */
export const PERSONA_REPORT_CONFIG: Record<
  PersonaId,
  Partial<Record<ReportSectionId, ReportSectionConfig>>
> = {
  executive: {
    hndlHnfl: { state: 'collapsed' },
    algorithmMigration: { state: 'hidden' },
    migrationRoadmap: { state: 'collapsed' },
    migrationToolkit: { state: 'collapsed' },
    recommendedActions: { state: 'open', maxItems: 5 },
  },
  developer: {},
  architect: {
    assessmentProfile: { state: 'open' },
    threatLandscape: { state: 'open' },
  },
  researcher: {
    assessmentProfile: { state: 'open' },
    threatLandscape: { state: 'open' },
  },
  ops: {
    hndlHnfl: { state: 'hidden' },
    migrationRoadmap: { state: 'open' },
    migrationToolkit: { state: 'open' },
    algorithmMigration: { state: 'open' },
  },
  curious: {
    hndlHnfl: { state: 'hidden' },
    algorithmMigration: { state: 'hidden' },
    migrationRoadmap: { state: 'hidden' },
    migrationToolkit: { state: 'hidden' },
    recommendedActions: { state: 'open', maxItems: 3 },
  },
}

/**
 * Resolve the effective section config for a given persona.
 * When `showFullReport` is true, hidden sections become collapsed instead.
 */
export function getReportSectionConfig(
  personaId: PersonaId | null,
  sectionId: ReportSectionId,
  showFullReport = false
): ReportSectionConfig {
  // eslint-disable-next-line security/detect-object-injection
  const defaults = REPORT_SECTION_DEFAULTS[sectionId]
  if (!personaId) return defaults
  // eslint-disable-next-line security/detect-object-injection
  const overrides = PERSONA_REPORT_CONFIG[personaId]?.[sectionId]
  const resolved = overrides ? { ...defaults, ...overrides } : defaults
  if (showFullReport && resolved.state === 'hidden') {
    return { ...resolved, state: 'collapsed' }
  }
  return resolved
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Command Center — per-persona CSWP.39 Fig 3 zone emphasis
 *
 * The Command Center renders the six Fig 3 zones (Governance, Assets,
 * Management Tools, Data-Centric Risk Mgmt, Mitigation, Migration) in fixed
 * sequence. Personas choose which zone is highlighted/expanded first and which
 * artifacts surface at the top of each zone panel.
 * ────────────────────────────────────────────────────────────────────────────── */

import type { ExecutiveDocumentType } from '@/services/storage/types'
import type { ZoneId } from '@/data/cswp39ZoneData'

export interface BCZoneEmphasis {
  /** Zone highlighted on the Fig 3 diagram and expanded on landing. */
  defaultActiveZone: ZoneId
  /** Per-zone artifact-type ordering (unlisted types render after, in default order). */
  featuredArtifacts: Partial<Record<ZoneId, ExecutiveDocumentType[]>>
  /** Optional persona-tailored sub-headline. Falls back to the page default. */
  headline?: string
  /** Optional persona-tailored description. Falls back to the page default. */
  tagline?: string
}

const DEFAULT_ZONE_EMPHASIS: BCZoneEmphasis = {
  defaultActiveZone: 'governance',
  featuredArtifacts: {},
}

export const BC_ZONE_EMPHASIS_BY_PERSONA: Record<PersonaId, BCZoneEmphasis> = {
  // Executive: open with Governance (board/policy framing).
  executive: {
    defaultActiveZone: 'governance',
    headline: 'Crypto Risk — Board View',
    tagline:
      'Quantum-readiness scorecard organised around the NIST CSWP.39 strategic plan. Surface the artifacts your board needs first: ROI model, board deck, policy, KPIs.',
    featuredArtifacts: {
      governance: ['board-deck', 'roi-model', 'policy-draft', 'audit-checklist'],
      'risk-management': ['kpi-dashboard', 'risk-register'],
    },
  },
  // Architect: open with Governance — surface RACI, vendor scorecards, crypto
  // architecture diagram first (architecture-of-organisation lens).
  architect: {
    defaultActiveZone: 'governance',
    headline: 'Crypto Architecture — System View',
    tagline:
      'Map the as-is and to-be cryptographic architecture across libraries, HSMs, protocols, and CAs. Track agility per asset and ownership via RACI.',
    featuredArtifacts: {
      governance: [
        'crypto-architecture',
        'raci-matrix',
        'policy-draft',
        'vendor-scorecard',
        'supply-chain-matrix',
      ],
      'risk-management': ['risk-register', 'risk-treatment-plan'],
      migration: ['migration-roadmap'],
    },
  },
  // Ops: open with Migration — surface deployment, roadmap, KPI tracker.
  ops: {
    defaultActiveZone: 'migration',
    headline: 'Migration & Mitigation — Run View',
    tagline:
      'Track migration phases, deployment playbooks, and KPI burndown. Mitigation gateways carry mandatory sunset dates per CSWP.39 §4.6.',
    featuredArtifacts: {
      migration: ['migration-roadmap'],
      mitigation: ['deployment-playbook'],
      'risk-management': ['kpi-tracker', 'kpi-dashboard'],
      governance: ['supply-chain-matrix', 'audit-checklist'],
    },
  },
  // Developer: open with Migration — implementation focus.
  developer: {
    defaultActiveZone: 'migration',
    headline: 'Implementation View',
    tagline:
      'Algorithm transitions, library + HSM upgrade paths, and the deployment playbook for the systems you own.',
    featuredArtifacts: {
      migration: ['migration-roadmap'],
      mitigation: ['deployment-playbook'],
      governance: ['crypto-architecture', 'policy-draft'],
    },
  },
  // Researcher: open with Risk Management — surface risk + policy reference.
  researcher: {
    defaultActiveZone: 'risk-management',
    headline: 'Risk Analysis & Reference',
    tagline:
      'CRQC scenarios, HNDL/HNFL windows, risk-register evidence, and policy citations to anchor your write-ups.',
    featuredArtifacts: {
      'risk-management': ['risk-register', 'risk-treatment-plan'],
      governance: ['policy-draft', 'audit-checklist', 'crqc-scenario'],
    },
  },
  // Curious: beginner subset — start in Governance with the most approachable artifacts.
  curious: {
    defaultActiveZone: 'governance',
    headline: 'Start Here — Crypto Agility 101',
    tagline:
      'Walk through the CSWP.39 strategic plan one step at a time. Friendliest artifacts surface first; deeper tools unlock as you go.',
    featuredArtifacts: {
      governance: ['policy-draft', 'crqc-scenario'],
      'risk-management': ['risk-register', 'kpi-dashboard'],
    },
  },
}

export function getBusinessCenterZoneEmphasis(personaId: PersonaId | null): BCZoneEmphasis {
  if (!personaId) return DEFAULT_ZONE_EMPHASIS
  // eslint-disable-next-line security/detect-object-injection
  return BC_ZONE_EMPHASIS_BY_PERSONA[personaId] ?? DEFAULT_ZONE_EMPHASIS
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Report CTAs — persona-specific next-step actions shown at the bottom of report
 * ────────────────────────────────────────────────────────────────────────────── */

export interface ReportCTA {
  label: string
  path: string
  /** lucide-react icon name (resolved in the component) */
  icon:
    | 'Share2'
    | 'Calendar'
    | 'BookOpen'
    | 'FlaskConical'
    | 'Package'
    | 'BarChart3'
    | 'Terminal'
    | 'Layers'
  /** If true, triggers the share handler instead of navigating */
  isShareAction?: boolean
}

export const PERSONA_REPORT_CTAS: Record<PersonaId, ReportCTA[]> = {
  executive: [
    { label: 'Open Command Center', path: '/business', icon: 'BarChart3' },
    { label: 'Share with your board', path: '', icon: 'Share2', isShareAction: true },
    { label: 'View compliance deadlines', path: '/compliance', icon: 'Calendar' },
  ],
  developer: [
    { label: 'Try algorithms in Playground', path: '/playground', icon: 'FlaskConical' },
    { label: 'Browse PQC libraries', path: '/migrate', icon: 'Package' },
    { label: 'Start learning path', path: '/learn', icon: 'BookOpen' },
  ],
  architect: [
    { label: 'View migration catalog', path: '/migrate', icon: 'Package' },
    { label: 'Explore infrastructure layers', path: '/migrate', icon: 'Layers' },
    { label: 'Start learning path', path: '/learn', icon: 'BookOpen' },
  ],
  researcher: [
    { label: 'Compare algorithms', path: '/algorithms', icon: 'BarChart3' },
    { label: 'Explore in OpenSSL', path: '/openssl', icon: 'Terminal' },
    { label: 'Start learning path', path: '/learn', icon: 'BookOpen' },
  ],
  ops: [
    { label: 'Browse migration catalog', path: '/migrate', icon: 'Package' },
    { label: 'Try OpenSSL Studio', path: '/openssl', icon: 'Terminal' },
    { label: 'Start learning path', path: '/learn', icon: 'BookOpen' },
  ],
  curious: [
    { label: 'Share report', path: '', icon: 'Share2', isShareAction: true },
    { label: 'Explore the timeline', path: '/timeline', icon: 'Calendar' },
    { label: 'Continue learning', path: '/learn', icon: 'BookOpen' },
  ],
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Journey map milestones — page-level actions inserted between learning phases
 * ────────────────────────────────────────────────────────────────────────────── */

export interface JourneyMilestoneConfig {
  /** Insert this milestone after the checkpoint with this ID */
  afterPhase: string
  route: string
  label: string
}

export const PERSONA_MILESTONES: Record<PersonaId, JourneyMilestoneConfig[]> = {
  executive: [
    { afterPhase: 'exec-cp-3', route: '/assess', label: 'Run Risk Assessment' },
    { afterPhase: 'exec-cp-3', route: '/compliance', label: 'Check Compliance Deadlines' },
    { afterPhase: 'exec-cp-4', route: '/business', label: 'Explore Business Tools' },
    { afterPhase: 'exec-cp-4', route: '/migrate', label: 'Browse Migration Catalog' },
  ],
  developer: [
    { afterPhase: 'dev-cp-3', route: '/playground', label: 'Try the Playground' },
    { afterPhase: 'dev-cp-3', route: '/openssl', label: 'OpenSSL Studio' },
    { afterPhase: 'dev-cp-4', route: '/assess', label: 'Run Risk Assessment' },
    { afterPhase: 'dev-cp-5', route: '/migrate', label: 'Browse Migration Catalog' },
    { afterPhase: 'dev-cp-5', route: '/playground', label: 'Run ACVP Tests' },
  ],
  architect: [
    { afterPhase: 'arch-cp-2', route: '/assess', label: 'Run Risk Assessment' },
    { afterPhase: 'arch-cp-2', route: '/compliance', label: 'Check Compliance Deadlines' },
    { afterPhase: 'arch-cp-3b', route: '/playground', label: 'Try the Playground' },
    { afterPhase: 'arch-cp-4', route: '/migrate', label: 'Browse Migration Catalog' },
  ],
  researcher: [
    { afterPhase: 'res-cp-2', route: '/playground', label: 'Try the Playground' },
    { afterPhase: 'res-cp-2', route: '/algorithms', label: 'Compare Algorithms' },
    { afterPhase: 'res-cp-4', route: '/openssl', label: 'OpenSSL Studio' },
    { afterPhase: 'res-cp-5', route: '/assess', label: 'Run Risk Assessment' },
  ],
  ops: [
    { afterPhase: 'ops-cp-2', route: '/openssl', label: 'OpenSSL Studio' },
    { afterPhase: 'ops-cp-3', route: '/playground', label: 'Try the Playground' },
    { afterPhase: 'ops-cp-3', route: '/assess', label: 'Run Risk Assessment' },
    { afterPhase: 'ops-cp-3', route: '/playground', label: 'Run ACVP Tests' },
    { afterPhase: 'ops-cp-4a', route: '/migrate', label: 'Browse Migration Catalog' },
  ],
  curious: [
    { afterPhase: 'curious-cp-2', route: '/assess', label: 'Take Assessment' },
    { afterPhase: 'curious-cp-3', route: '/timeline', label: 'Explore Timeline' },
    { afterPhase: 'curious-cp-4', route: '/threats', label: 'Explore Threat Landscape' },
  ],
}

// ── Workflow banner: persona-specific phase labels ───────────────────────

type WorkflowPhaseId = 'assess' | 'comply' | 'migrate' | 'timeline'

export const PERSONA_WORKFLOW_LABELS: Record<PersonaId, Record<WorkflowPhaseId, string>> = {
  executive: {
    assess: 'Organizational Risk Assessment',
    comply: 'Audit Compliance Deadlines',
    migrate: 'Evaluate Migration Vendors',
    timeline: 'Review Planning Horizon',
  },
  developer: {
    assess: 'Technical Risk Assessment',
    comply: 'Check Certification Requirements',
    migrate: 'Select Libraries & Tools',
    timeline: 'Review Migration Deadlines',
  },
  architect: {
    assess: 'Architecture Risk Assessment',
    comply: 'Map Compliance Controls',
    migrate: 'Evaluate Infrastructure Options',
    timeline: 'Plan Migration Phases',
  },
  researcher: {
    assess: 'Risk Assessment',
    comply: 'Compliance Review',
    migrate: 'Product Selection',
    timeline: 'Timeline Review',
  },
  ops: {
    assess: 'Infrastructure Risk Assessment',
    comply: 'Map Operational Compliance',
    migrate: 'Select Deployment Tools',
    timeline: 'Schedule Rollout Windows',
  },
  curious: {
    assess: 'Check Your Exposure',
    comply: 'See Who Sets the Rules',
    migrate: 'What Organizations Are Doing',
    timeline: 'When Is This Happening?',
  },
}

// ── Migrate catalog: persona → preferred infrastructure layers ───────────

export const PERSONA_MIGRATE_LAYERS: Record<PersonaId, string[]> = {
  executive: ['Cloud', 'AppServers'],
  developer: ['Libraries', 'Cloud', 'Database'],
  architect: ['Cloud', 'Network', 'AppServers', 'Security Stack'],
  researcher: [],
  ops: ['Network', 'Hardware', 'OS', 'Security Stack'],
  curious: [],
}

// ── Library: persona → preferred document categories ─────────────────────

export const PERSONA_LIBRARY_CATEGORIES: Record<PersonaId, string[]> = {
  executive: ['Government & Policy', 'Migration Guidance', 'Industry & Research'],
  developer: ['Protocols', 'KEM', 'Digital Signature', 'Algorithm Specifications'],
  architect: [
    'PKI Certificate Management',
    'KEM',
    'Protocols',
    'NIST Standards',
    'International Frameworks',
  ],
  researcher: [],
  ops: ['PKI Certificate Management', 'Protocols', 'Government & Policy', 'Migration Guidance'],
  curious: ['Migration Guidance', 'Government & Policy'],
}

// ── Achievement exclusions: achievements structurally unreachable per persona ──

/**
 * Achievements that are not achievable for a given persona because the
 * required feature or artifact type is not in their learning path or nav.
 */
export const PERSONA_EXCLUDED_ACHIEVEMENTS: Record<PersonaId, string[]> = {
  executive: [
    'playground-first',
    'playground-breadth-3',
    'playground-breadth-10',
    'playground-hsm',
    'playground-hybrid',
    'first-cert',
    'first-key',
    'five-keys',
  ],
  developer: ['first-exec-doc', 'business-first', 'business-strategist', 'business-complete'],
  architect: ['first-exec-doc'],
  researcher: [], // all paths available
  ops: ['first-exec-doc'],
  curious: [
    'playground-first',
    'playground-breadth-3',
    'playground-breadth-10',
    'playground-hsm',
    'playground-hybrid',
    'first-cert',
    'first-key',
    'five-keys',
    'business-first',
    'business-strategist',
    'business-complete',
  ],
}
