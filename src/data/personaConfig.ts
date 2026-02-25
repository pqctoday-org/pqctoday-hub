import type { PersonaId } from './learningPersonas'
import type { Region } from '../store/usePersonaStore'

/**
 * Nav paths shown per persona (on top of always-visible pages).
 * Always-visible: '/', '/learn', '/timeline', '/threats', '/about'
 * null = show all (researcher / no persona)
 */
export const PERSONA_NAV_PATHS: Record<PersonaId, string[] | null> = {
  executive: ['/assess', '/report', '/leaders', '/library', '/compliance', '/migrate'],
  developer: [
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/migrate',
    '/playground',
    '/openssl',
  ],
  architect: [
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/migrate',
    '/compliance',
    '/leaders',
    '/playground',
  ],
  researcher: null,
}

/**
 * Top 3 landing page feature card paths to badge as "Recommended" per persona.
 */
export const PERSONA_RECOMMENDED_PATHS: Record<PersonaId, string[]> = {
  executive: ['/assess', '/timeline', '/compliance'],
  developer: ['/playground', '/openssl', '/algorithms'],
  architect: ['/assess', '/compliance', '/timeline'],
  researcher: ['/algorithms', '/openssl', '/playground'],
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
  'key-management': ['Finance & Banking', 'Government & Defense', 'Healthcare', 'Technology'],
  'stateful-signatures': ['Government & Defense', 'Aerospace'],
  'digital-assets': ['Finance & Banking', 'Retail & E-Commerce'],
  '5g-security': ['Telecommunications', 'Government & Defense'],
  'digital-id': ['Government & Defense', 'Healthcare', 'Finance & Banking'],
  'entropy-randomness': null,
  'code-signing': ['Technology', 'Government & Defense', 'Finance & Banking'],
  'api-security-jwt': ['Technology', 'Finance & Banking', 'Healthcare', 'Retail & E-Commerce'],
}

/** Nav paths that are always shown regardless of persona. */
export const ALWAYS_VISIBLE_PATHS = ['/', '/learn', '/timeline', '/threats', '/about']

/**
 * Maps AVAILABLE_INDUSTRIES names (used in Assessment + store) to the
 * exact industry strings used in the threats CSV data.
 * null = no matching threat category.
 */
export const INDUSTRY_TO_THREATS_MAP: Record<string, string | null> = {
  'Finance & Banking': 'Financial Services / Banking',
  'Government & Defense': 'Government / Defense',
  Healthcare: 'Healthcare / Pharmaceutical',
  Telecommunications: 'Telecommunications',
  Technology: 'IT Industry / Software',
  'Energy & Utilities': 'Energy / Critical Infrastructure',
  Automotive: 'Automotive / Connected Vehicles',
  Aerospace: 'Aerospace / Aviation',
  'Retail & E-Commerce': 'Retail / E-Commerce',
  Education: null,
  Other: null,
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
    hndlHnfl: { state: 'hidden' },
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
