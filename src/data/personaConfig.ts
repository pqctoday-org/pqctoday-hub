// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from './learningPersonas'
import { PERSONAS } from './learningPersonas'
import type { Region } from '../store/usePersonaStore'
import type { AssessmentMode } from '../store/useAssessmentStore'
import type { PhaseId } from './frameworkPhases'
import { libraryData } from './libraryData'
import { authoritativeSources } from './authoritativeSourcesData'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { CLASSICAL_HSM_DEFAULT, USE_CASES } from './hsmCapacityDefaults'
import { MIGRATION_KEYS } from '../components/Playground/kmip/migration/migrationKeys'

/**
 * Persona-aware "Practice in the Simulation" CTA — which migration phases each
 * profile actually practices in the sim. A Learn module shows the CTA when the
 * active persona practices that module's `frameworkPhase` (the sim climbs the
 * same phases p0–p7 + verify-close, and every module carries one).
 *
 * Linked to `ROLE_CROSSWALK`/`personaToRoles` (`roleCrosswalk.ts`), which is the
 * source of truth for which phases a seat actually *owns* in-sim (spec §7).
 * Every set below is the union of that persona's owned phases, so the CTA can
 * never point a player at a phase their seat doesn't own — the exact drift the
 * two-vocabulary split used to allow (07082026 remediation, simulation.md item
 * 2). `executive` carries three phases (p1/p2/p3) beyond its owned set as a
 * documented, deliberate exception: the Executive Overview tour
 * (`execTourConfig.ts` `EXEC_TOUR_STAGES`) genuinely walks the exec persona
 * through those phases' content (data-asset-sensitivity, CBOM, risk-register)
 * for board-oversight framing, even though `crypto-architect` — not any
 * executive-mapped role — drives them programmatically. The drift guard in
 * `personaConfig.test.ts` pins this relationship (owned ⊆ set, extras ⊆
 * allowlist) so it can't silently drift further.
 *
 * Personas with no entry here (researcher / curious / none) see the CTA on
 * every phase — a deliberate broad fallback (neither holds a program role in
 * `ROLE_CROSSWALK`, so there is no "owned" set to link to; see item 1).
 */
export const PERSONA_SIM_PRACTICE_PHASES: Partial<Record<PersonaId, PhaseId[]>> = {
  executive: ['p0', 'p1', 'p2', 'p3', 'p4', 'p7', 'verify-close', 'foundations'],
  architect: ['p1', 'p2', 'p3', 'p5'],
  ops: ['p5', 'p6'],
  developer: ['p5', 'p6'],
  // researcher / curious / (no persona) → undefined ⇒ broad (see helper)
}

/**
 * True when the active persona practices this module's phase in the sim, so the
 * "Practice in the Simulation" CTA should show. No persona — or a persona with
 * no phase set (researcher / curious) — returns true (broad fallback).
 */
export function personaPracticesModulePhase(
  persona: PersonaId | null,
  frameworkPhase: PhaseId | PhaseId[]
): boolean {
  // eslint-disable-next-line security/detect-object-injection
  const phases = persona ? PERSONA_SIM_PRACTICE_PHASES[persona] : undefined
  if (!phases) return true
  const modulePhases = Array.isArray(frameworkPhase) ? frameworkPhase : [frameworkPhase]
  return modulePhases.some((p) => phases.includes(p))
}

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
    '/algorithms',
    '/library',
    '/leaders',
    '/patents',
    // Persona-journeys A-grade redesign (2026-08-01): the Executive Overview
    // guided tour already exists (EXEC_TOUR_STAGES, SimulationView.tsx) but
    // /simulation was never nav-linked for this persona — it's the featured
    // "Walk the program" row (see PERSONA_MARKED_NAV_PATHS' sibling featured
    // set below), not a marked/pending one. /playground is added too, as the
    // dashed "Labs" preview row (real Playground tools, not yet exec-tailored).
    '/simulation',
    '/playground',
  ],
  developer: [
    '/migrate',
    '/compliance',
    '/business',
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/playground',
    '/patents',
    // Persona-journeys A-grade redesign (2026-08-01): /openssl dropped as a
    // standalone nav path — OpenSSL Studio is reachable via the Playground
    // grid's own 'openssl-studio' (PT-023) card (RAIL_HIDDEN_PATHS below),
    // per the redesign's "folded into Playground" decision. /simulation
    // added as a plain (non-marked) row — PERSONA_SIM_PRACTICE_PHASES.developer
    // is real, and the general console's "Exit to hub" affordance
    // (SimulationView.tsx) already shipped (verified 2026-08-01 final review,
    // pre-dating this branch — see PERSONA_MARKED_NAV_PATHS' doc comment for
    // why this is no longer marked/dashed).
    '/simulation',
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
    // Same redesign notes as developer above: /openssl folded into
    // Playground's own card; /simulation added as a plain (non-marked) row.
    '/simulation',
  ],
  researcher: null,
  ops: [
    '/migrate',
    '/compliance',
    '/business',
    '/assess',
    '/report',
    // /algorithms fits ops: the Certified filter + deployment-relevant status hints are
    // directly useful (see ALGORITHM_PERSONA_DEFAULTS.ops below). /patents deliberately
    // stays excluded — IP research isn't an ops task (07-19 follow-up remediation, O1).
    // NOTE (2026-08-01 persona-journeys redesign): the design handoff's ops rail
    // mockup showed a dashed "Patents" row alongside "Simulation" — deliberately
    // NOT implemented here. That would reverse the O1 decision directly above
    // without being asked to; only /simulation was added. Flagged for the user.
    '/algorithms',
    '/library',
    '/leaders',
    '/playground',
    // /openssl folded into Playground's own card (see developer's note above).
    // /simulation added as a plain (non-marked) row.
    '/simulation',
  ],
  curious: [
    '/explore',
    '/compliance',
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/leaders',
    '/migrate',
    '/playground',
    '/patents',
    // Persona-journeys A-grade redesign (2026-08-01): /simulation added as a
    // plain (non-featured, non-marked) entry — curious keeps every route
    // reachable but gives simulation no special rail treatment, per design.
    '/simulation',
  ],
}

/**
 * Rail rows that must never render as their own top-level nav item, for any
 * persona — the route stays real and reachable (URL, deep link, or a feature
 * card elsewhere), it just isn't offered as a rail destination in its own
 * right. Added 2026-08-01 (persona-journeys A-grade redesign) for '/openssl':
 * OpenSSL Studio is reachable via the Playground grid's own 'openssl-studio'
 * (PT-023) card, so the standalone nav item would be a duplicate front door.
 */
export const RAIL_HIDDEN_PATHS: string[] = ['/openssl']

/**
 * Per-persona rail rows that should render with the "marked/pending" dashed
 * left-border treatment (persona-journeys A-grade redesign, 2026-08-01) — a
 * route the persona can already reach, but that isn't fully tailored to them
 * yet. Distinct from PERSONA_NAV_PATHS (which controls FOR YOU vs MORE
 * placement) and from any row given the separate "featured" green treatment
 * (e.g. executive's '/simulation', styled as the Executive Overview tour
 * entry point, is intentionally NOT in this list).
 *
 * CORRECTION (2026-08-01 final self-review): an earlier pass in this same
 * build marked developer/architect/ops's '/simulation' row as dashed/pending,
 * citing IMPLEMENTATION-PLAN-2026-08-01.md §4.5's "general console, pending
 * its exit-affordance fix" caveat — but per that same plan section's own
 * instruction ("before wiring this row live, verify the exit-affordance fix
 * has actually shipped"), a build-time check was required and was not done.
 * Checking now: SimulationView.tsx already ships a working "Exit to hub" link
 * (`aria-label="Exit to hub"`, covered by SimulationView.test.tsx) via commits
 * 691eb55a0 and 6ee1e91f3, BOTH already merged into main well before this
 * branch's own base commit — the dependency this plan flagged was resolved
 * before this build even started. developer/architect/ops's '/simulation'
 * therefore gets the same plain (non-marked) treatment as curious's, not
 * dashed — PERSONA_SIM_PRACTICE_PHASES already gives all three a real,
 * accurate phase mapping into the same general console exec's tour points at.
 */
export const PERSONA_MARKED_NAV_PATHS: Record<PersonaId, string[]> = {
  executive: ['/playground'],
  // developer/architect/ops: no marked rows — see CORRECTION note above.
  developer: [],
  architect: [],
  // researcher: PERSONA_NAV_PATHS is null (no gating at all) — nothing marked.
  researcher: [],
  ops: [],
  // curious: every route is already reachable and un-gated — nothing marked.
  curious: [],
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Algorithms page — per-persona default tab / filter preset / open-section set.
 *
 * Drives the first-paint experience on `/algorithms` when no URL params are
 * present. Deep-links win; once any of {tab, family, fn, level, region, status,
 * highlight, q, compare, section, cnsa, gap, mode, protocol, matrixView,
 * matrixQ, matrixStatus, matrixAvailability, matrixSort} are set in the URL,
 * defaults give way to the URL-driven state. See `AlgorithmsView.tsx`
 * `hasActiveParams`.
 * ────────────────────────────────────────────────────────────────────────────── */

export type AlgorithmTabId = 'transition' | 'detailed' | 'support' | 'landscape' | 'validation'

export type AlgorithmFilterKey = 'family' | 'fn' | 'level' | 'region' | 'status'

// Was 6 values ('performance' | 'security' | 'sizes' | 'usecases' | 'attacks'
// | 'kat') seeded from a since-removed accordion layout on the Detailed
// Comparison view (see ca994b18); that view is now a flat sortable table
// with no per-section open/closed state, so those 4 ids had zero consumers.
// Narrowed to the two ids that still map to real UI — the Validation tab's
// two collapsible sections (AlgorithmValidationView.tsx) — and wired below
// instead of left as dead config.
export type AlgorithmSectionId = 'attacks' | 'kat'

export interface AlgorithmDefaults {
  /** First-paint tab. */
  tab: AlgorithmTabId
  /** Filter preset; keys map to the URL params used by AlgorithmsView. */
  filters: Partial<Record<AlgorithmFilterKey, string>>
  /** Validation-tab sections open by default (see AlgorithmValidationView.tsx). */
  openSections: AlgorithmSectionId[]
  /** Algorithm names to pre-highlight in the Detailed table. */
  highlight?: string[]
}

export const ALGORITHM_PERSONA_DEFAULTS: Record<PersonaId, AlgorithmDefaults> = {
  executive: {
    // Business-relevant default: the classical→PQC mapping (Transition Guide),
    // not the developer parameter comparison. Specialist tabs are one click away.
    tab: 'transition',
    filters: { status: 'Certified' },
    openSections: [],
    highlight: ['ML-KEM-768', 'ML-DSA-65', 'SLH-DSA-SHA2-128s', 'FN-DSA-512'],
  },
  ops: {
    tab: 'transition',
    filters: { status: 'Certified' },
    openSections: [],
  },
  developer: {
    tab: 'transition',
    filters: { status: 'Certified' },
    openSections: [],
  },
  architect: {
    tab: 'transition',
    filters: { status: 'Certified' },
    openSections: [],
  },
  researcher: {
    // "All sections open" — both Validation-tab sections, not just KAT.
    tab: 'detailed',
    filters: { status: 'Certified' },
    openSections: ['attacks', 'kat'],
  },
  curious: {
    tab: 'transition',
    filters: { status: 'Certified', fn: 'KEM' },
    openSections: [],
    highlight: ['ML-KEM-768', 'ML-DSA-65', 'SLH-DSA-SHA2-128s'],
  },
}

const ALGORITHM_FALLBACK_DEFAULTS: AlgorithmDefaults = {
  tab: 'transition',
  filters: { status: 'Certified' },
  openSections: [],
}

/** Resolve the algorithms-page defaults for the active persona, or a
 *  developer-like baseline when no persona is selected. */
export function getAlgorithmDefaults(persona: PersonaId | null): AlgorithmDefaults {
  if (!persona) return ALGORITHM_FALLBACK_DEFAULTS
  // eslint-disable-next-line security/detect-object-injection -- persona is the typed PersonaId union, not user input
  return ALGORITHM_PERSONA_DEFAULTS[persona] ?? ALGORITHM_FALLBACK_DEFAULTS
}

/**
 * Canonical path → human label for every path referenced by PERSONA_NAV_PATHS /
 * PERSONA_RECOMMENDED_PATHS. MainLayout's nav items source their labels from
 * this same map, so a rename here propagates to every consumer that lists
 * paths by label (e.g. Landing's "How does this adapt content?" modal).
 */
export const NAV_PATH_LABELS: Record<string, string> = {
  '/': 'Home',
  '/simulation': 'Simulation',
  '/explore': 'Explore',
  '/learn': 'Learn',
  '/timeline': 'Timeline',
  '/algorithms': 'Algorithms',
  '/migrate': 'Migrate',
  '/compliance': 'Compliance',
  '/assess': 'Assess',
  '/report': 'Report',
  '/business': 'Command Center',
  '/business/tools': 'Business Tools',
  '/playground': 'Playground',
  '/threats': 'Threats',
  '/library': 'Library',
  '/leaders': 'Community',
  '/patents': 'Patents',
  '/openssl': 'OpenSSL Studio',
  '/revisions': 'Revisions',
  '/about': 'About',
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
 * Revisions-feed domain priorities per persona.
 *
 * On the /revisions route, entries are still loaded in chronological (most-
 * recent-first) order, but when a persona is selected and persona-sort is
 * enabled, entries in the persona's priority domains float above entries in
 * non-priority domains. Within each group the chronological order is
 * preserved. This implements the persona-aware ranking described in the
 * trust-engine explainability doc §9.3.
 *
 * The lists below are derived from each persona's nav-path interests
 * (PERSONA_NAV_PATHS / PERSONA_RECOMMENDED_PATHS), normalised to the
 * revision-feed domain vocabulary: module, tool, library, compliance,
 * migrate, threats, algorithms.
 *
 * `researcher` returns an empty list deliberately — researchers see all
 * revisions equally, with strict chronological ordering.
 */
export const PERSONA_REVISION_DOMAINS: Record<PersonaId, readonly string[]> = {
  executive: ['compliance', 'migrate', 'threats'],
  developer: ['algorithms', 'migrate', 'tool'],
  architect: ['compliance', 'migrate', 'algorithms', 'library'],
  researcher: [],
  ops: ['migrate', 'compliance', 'threats'],
  curious: ['compliance', 'library'],
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
  mena: 'Israel',
  apac: 'Japan',
  global: null,
}

/**
 * Broad region → all matching country names in the timeline CSV data.
 * Used to power multi-country region filter in the Gantt chart.
 */
/**
 * Per-persona default region for /timeline when the user has no
 * `selectedRegion` in the persona store and no `?region=` URL param.
 *
 * Per the persona-overwhelm audit (2026-05-22): every persona was landing
 * on the same 40-country × ~225-event chart regardless of role. This map
 * provides a sensible default region per persona so the Gantt chart is
 * useful on first paint.
 *
 * Researcher = 'All' — the page is a research instrument for them.
 * Other personas get a single region matched to their primary regulator
 * or operating geography. Users can switch regions in the dropdown or
 * opt out of the persona default via the "See all" reset link
 * (which writes ?prefs=off).
 */
export const PERSONA_TIMELINE_REGION: Record<PersonaId, Region | 'All'> = {
  executive: 'americas',
  developer: 'americas',
  architect: 'global',
  researcher: 'All',
  ops: 'americas',
  curious: 'americas',
}

export const REGION_COUNTRIES_MAP: Record<Region, string[]> = {
  americas: ['United States', 'Canada'],
  eu: ['European Union', 'France', 'Germany', 'Italy', 'Spain', 'United Kingdom', 'Czech Republic'],
  mena: ['Israel', 'United Arab Emirates', 'Saudi Arabia', 'Bahrain', 'Jordan'],
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
  'pqc-candidates': null,
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
  'government-defense-pqc': ['Government & Defense'],
  'trust-services-pqc': ['Finance & Banking', 'Government & Defense', 'Technology'],
}

/** Nav paths that are always shown regardless of persona. */
export const ALWAYS_VISIBLE_PATHS = [
  '/',
  '/simulation',
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

/**
 * Per-persona default industries for /threats when no industry is picked.
 *
 * The persona-overwhelm audit (2026-05-22) flagged that /threats renders
 * the full unfiltered corpus when the user has a persona set but no
 * industry — the only page on the site where persona alone doesn't
 * pre-shape the view. This map provides a sensible default industry set
 * per persona so the page is useful on first paint.
 *
 * Each value is an array of INDUSTRY_TO_THREATS_MAP keys; the resolver
 * in `ThreatsDashboard` then maps these through INDUSTRY_TO_THREATS_MAP
 * to actual threat-industry strings.
 *
 * Researcher + curious are intentionally empty: researcher wants the
 * full corpus; curious gets a plain-language narrative card instead
 * (see `personaSummary` in ThreatsDashboard).
 *
 * 'Cross-cutting & Other' is included for every narrowed persona — it
 * covers threats (e.g. NIST FIPS finalization, cross-industry mandates)
 * that don't belong to any single sector but are broadly relevant.
 */
export const PERSONA_THREATS_DEFAULT_INDUSTRIES: Record<PersonaId, string[]> = {
  executive: ['Finance & Banking', 'Government & Defense', 'Cross-cutting & Other'],
  developer: ['Technology', 'Cross-cutting & Other'],
  architect: ['Technology', 'Telecommunications', 'Cross-cutting & Other'],
  researcher: [],
  ops: ['Energy & Utilities', 'Telecommunications', 'Cross-cutting & Other'],
  curious: [],
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
    'Hardware Security Modules',
  ],
  'Energy & Utilities': [
    // "Critical Infrastructure" and "Energy / Critical Infrastructure" are
    // canonicalized to one sector in threatsData.ts (Threats #5) — reference
    // the single post-canonicalization label here.
    'Critical Infrastructure / Energy',
    'Water / Wastewater',
  ],
  Automotive: ['Automotive / Connected Vehicles', 'Rail / Transit'],
  Aerospace: ['Aerospace / Aviation'],
  'Retail & E-Commerce': ['Retail / E-Commerce'],
  'Cross-cutting & Other': ['Cross-Industry', 'Education / Research'],
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
  | 'discovery'
  | 'cbom'
  | 'algorithmMigration'
  | 'complianceImpact'
  | 'recommendedActions'
  | 'migrationRoadmap'
  | 'migrationToolkit'
  | 'vendorRisk'
  | 'threatLandscape'
  | 'simulationOutcomes'

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
  discovery: { state: 'collapsed' },
  cbom: { state: 'collapsed' },
  algorithmMigration: { state: 'open' },
  complianceImpact: { state: 'open' },
  recommendedActions: { state: 'open' },
  migrationRoadmap: { state: 'open' },
  migrationToolkit: { state: 'open' },
  vendorRisk: { state: 'collapsed' },
  threatLandscape: { state: 'collapsed' },
  simulationOutcomes: { state: 'collapsed' },
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

// curious is nav-blocked from /business — see PERSONA_NAV_PATHS line 55
export const BC_ZONE_EMPHASIS_BY_PERSONA: Partial<Record<PersonaId, BCZoneEmphasis>> = {
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
        'cloud-responsibility-matrix',
      ],
      'risk-management': ['risk-register', 'risk-treatment-plan'],
      migration: [
        'mti-negotiator',
        'hybrid-transition',
        'crypto-api-refactor',
        'migration-roadmap',
      ],
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
    { afterPhase: 'exec-cp-4', route: '/migrate', label: 'Browse Migration Workbench' },
  ],
  developer: [
    { afterPhase: 'dev-cp-3', route: '/playground', label: 'Try the Playground' },
    { afterPhase: 'dev-cp-3', route: '/openssl', label: 'OpenSSL Studio' },
    { afterPhase: 'dev-cp-4', route: '/assess', label: 'Run Risk Assessment' },
    { afterPhase: 'dev-cp-5', route: '/migrate', label: 'Browse Migration Workbench' },
    { afterPhase: 'dev-cp-5', route: '/playground', label: 'Run ACVP Tests' },
  ],
  architect: [
    { afterPhase: 'arch-cp-2', route: '/assess', label: 'Run Risk Assessment' },
    { afterPhase: 'arch-cp-2', route: '/compliance', label: 'Check Compliance Deadlines' },
    { afterPhase: 'arch-cp-3b', route: '/playground', label: 'Try the Playground' },
    { afterPhase: 'arch-cp-4', route: '/migrate', label: 'Browse Migration Workbench' },
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
    { afterPhase: 'ops-cp-4a', route: '/migrate', label: 'Browse Migration Workbench' },
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
  ops: [
    'PKI Certificate Management',
    'Protocols',
    'Government & Policy',
    'Migration Guidance',
    'NIST Standards',
    'Algorithm Specifications',
  ],
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
    // Curious-only (CC-15)
    'first-jargon-decoded',
    'first-standard-read',
    'met-the-quantum-threat',
  ],
  developer: [
    'first-exec-doc',
    'business-first',
    'business-strategist',
    'business-complete',
    // Curious-only (CC-15)
    'first-jargon-decoded',
    'first-standard-read',
    'met-the-quantum-threat',
  ],
  architect: [
    'first-exec-doc',
    // Curious-only (CC-15)
    'first-jargon-decoded',
    'first-standard-read',
    'met-the-quantum-threat',
  ],
  researcher: [
    // Curious-only (CC-15)
    'first-jargon-decoded',
    'first-standard-read',
    'met-the-quantum-threat',
  ],
  ops: [
    'first-exec-doc',
    // Curious-only (CC-15)
    'first-jargon-decoded',
    'first-standard-read',
    'met-the-quantum-threat',
  ],
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

/**
 * Compliance frameworks each persona benefits from emphasizing in the
 * landscape grid (P11-P1-02). Used to add a soft visual treatment to the
 * FrameworkCard ring/badge — does NOT filter the list, so other frameworks
 * remain reachable.
 *
 * Empty array means "no emphasis" (default rendering for every framework).
 * Framework IDs come from `complianceData.ts` (case-sensitive).
 */
export const PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS: Partial<Record<PersonaId, readonly string[]>> =
  {
    executive: ['CNSA-2', 'DORA', 'NIS2', 'SOX', 'GDPR', 'PCI-DSS'],
    developer: ['FIPS', 'FedRAMP', 'CMMC', 'CC', 'NIST', 'CNSA-2'],
    architect: ['NIST', 'BSI', 'ANSSI', 'ENISA', 'CNSA-2', 'FIPS'],
    ops: ['CNSA-2', 'FedRAMP', 'NIS2', 'PCI-DSS', 'DORA'],
    researcher: ['NIST', 'ENISA', 'BSI', 'ANSSI', '3GPP-PQC', 'BIS-158-PQC'],
    curious: ['NIST', 'ENISA', 'CNSA-2', 'GDPR', 'HIPAA'],
  }

export function isComplianceFrameworkEmphasized(
  persona: PersonaId | null,
  frameworkId: string
): boolean {
  if (!persona) return false
  // eslint-disable-next-line security/detect-object-injection -- persona is the typed PersonaId union, not user input
  const set = PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS[persona]
  if (!set) return false
  return set.includes(frameworkId)
}

/**
 * Persona-flavored maturity tier overlay for the awareness-score belt ladder.
 *
 * The 7 generic belts (White → Black) still drive scoring math, but Executive
 * and Curious see role-relevant tier names alongside the belt — "Briefed →
 * Aligned → Sponsoring → Board-Ready" for execs, "Aware → Informed → Confident
 * → Quantum-Native" for curious. Other personas inherit the belt names as-is.
 *
 * Mapping: 7 belts collapse into 4 tiers
 *   White / Yellow         → tier[0]
 *   Orange / Green         → tier[1]
 *   Blue / Brown           → tier[2]
 *   Black                  → tier[3]
 */
export const PERSONA_BELT_TIER_LABELS: Partial<
  Record<PersonaId, [string, string, string, string]>
> = {
  executive: ['Briefed', 'Aligned', 'Sponsoring', 'Board-Ready'],
  curious: ['Aware', 'Informed', 'Confident', 'Quantum-Native'],
}

const BELT_TIER_INDEX: Record<string, 0 | 1 | 2 | 3> = {
  'White Belt': 0,
  'Yellow Belt': 0,
  'Orange Belt': 1,
  'Green Belt': 1,
  'Blue Belt': 2,
  'Brown Belt': 2,
  'Black Belt': 3,
}

/**
 * Returns a persona-flavored tier label for the active belt, or null when the
 * persona doesn't have an override (developer / architect / ops / researcher
 * keep the generic belt name). Returns null for unknown belt names too.
 */
export function getBeltTierLabel(persona: PersonaId | null, beltName: string): string | null {
  if (!persona) return null
  // eslint-disable-next-line security/detect-object-injection -- persona is the typed PersonaId union, not user input
  const tiers = PERSONA_BELT_TIER_LABELS[persona]
  if (!tiers) return null
  // eslint-disable-next-line security/detect-object-injection -- bounded lookup, guarded by the undefined check below
  const idx = BELT_TIER_INDEX[beltName]
  if (idx === undefined) return null
  // eslint-disable-next-line security/detect-object-injection -- idx is narrowed to the 0|1|2|3 tuple index
  return tiers[idx]
}

/* ──────────────────────────────────────────────────────────────────────────────
 * Persona journey board — persona-journeys A-grade redesign (2026-08-01).
 *
 * Content config for the redesigned per-persona journey page: hero copy, a
 * "sourced vs illustrative" side-card, a curated 3-card "what you walk out
 * with" grid, and the learning-track strip. Pure data — the shared board
 * skeleton component (built separately, config-driven per §3.3 of
 * IMPLEMENTATION-PLAN-2026-08-01.md) is the only thing that renders this.
 *
 * The 3rd element of every `gridCards` tuple is always the one the renderer
 * highlights — that is a rendering concern, not encoded here, but every
 * persona's content below is ordered so index [2] really is the intended
 * highlight.
 * ────────────────────────────────────────────────────────────────────────────── */

export interface PersonaJourneyBoard {
  heroEyebrow: string
  heroBadge?: { text: string; tone: 'sourced' | 'illustrative' }
  headline: string
  sub: string
  ctaPrimary: string
  /** Real in-app route the primary CTA navigates to — see PersonaBoardView.tsx.
   * 2026-08-01 follow-up: these buttons rendered with zero click behavior at
   * all ("none of the buttons on the page does anything") — every CTA now
   * has a real destination, not just display text. */
  ctaPrimaryHref: string
  ctaSecondary: string
  ctaSecondaryHref: string
  proofChips: string[]
  sideCard: {
    title: string
    tone: 'bad' | 'warn' | 'info' | 'accent'
    provenance: 'sourced' | 'illustrative'
    rows: { label: string; value: string }[]
    punchline: string
    footnote?: string
  }
  gridTitle: string
  gridSub: string
  /** Always exactly 3 cards; the renderer highlights index [2]. */
  gridCards: [
    { title: string; body: string },
    { title: string; body: string },
    { title: string; body: string },
  ]
  trackTitle: string
  trackNote?: string
  trackChips: string[]
  /** Absent for researcher only — the deliberate "no funnel" persona (no capstone). */
  capstoneChip?: { label: string }
}

/**
 * Live active-row count for the library corpus, read from the same loader
 * every other page uses (`libraryData.ts`, already filtered to `status !==
 * 'deprecated'/'obsolete'` rows). The design mockup's "691 sources" was a
 * snapshot against an older CSV — hardcoding it here would reintroduce the
 * exact staleness problem this redesign exists to fix, so it is recomputed
 * from the live import instead every time this module loads.
 */
const LIBRARY_ACTIVE_SOURCE_COUNT = libraryData.length

/** Formats an ISO `YYYY-MM-DD` as "D Mon YYYY" (UTC — no local-timezone drift). */
function formatVerifiedDate(isoDate: string): string {
  const d = new Date(`${isoDate}T00:00:00Z`)
  if (Number.isNaN(d.getTime())) return isoDate
  return d.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

/**
 * Live "regulatory data last verified" date for the executive board's proof
 * chip — the most recent `lastVerifiedDate` among authoritative sources that
 * actually feed the compliance CSV (`complianceCsv === true`), read from
 * `authoritativeSourcesData.ts`. The design mockup's "30 Jul 2026" was a
 * snapshot of when the mockup was authored, not a computed value; there is no
 * single existing "compliance data verified as of" field anywhere else in the
 * codebase, so this derives the closest real equivalent from data that already
 * exists rather than hardcoding a date or inventing new plumbing. `undefined`
 * only if the authoritative-sources CSV somehow has zero compliance-tagged
 * rows with a verified date, which is not expected in practice.
 */
const REGULATORY_DATA_VERIFIED_DATE: string | undefined = (() => {
  const dates = authoritativeSources
    .filter((s) => s.complianceCsv && s.lastVerifiedDate)
    .map((s) => s.lastVerifiedDate)
    .sort()
  const latest = dates[dates.length - 1]
  return latest ? formatVerifiedDate(latest) : undefined
})()

/* ──────────────────────────────────────────────────────────────────────────────
 * Persona-board copy helpers — 2026-08-01 dynamic-data remediation
 * (HOME-PAGE-DYNAMIC-DATA-REMEDIATION-PLAN-2026-08-01.md rev. 2). Every number
 * or list below used to be a hand-typed string literal; these read the same
 * source files every other page already uses, so a future change to an
 * algorithm size, an HSM default, a zone's featured artifacts, or a persona's
 * learning path can't silently leave this page's copy wrong.
 * ────────────────────────────────────────────────────────────────────────────── */

const SMALL_NUMBER_WORDS = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
]

function toWordIfSmall(n: number): string {
  // eslint-disable-next-line security/detect-object-injection -- n is bounds-checked above
  return n >= 0 && n < SMALL_NUMBER_WORDS.length ? SMALL_NUMBER_WORDS[n] : String(n)
}

function capitalizedSmallNumberWord(n: number): string {
  const word = toWordIfSmall(n)
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** "a, b and c" — no Oxford comma, matching this page's existing house style. */
function joinWithAnd(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function formatBytes(n: number): string {
  return `${n.toLocaleString()} B`
}

const ML_DSA_65 = ALGORITHM_REGISTRY['ML-DSA-65']

const ML_DSA_65_PUBLIC_KEY_ROW = `${formatBytes(ML_DSA_65.publicKeyBytes)} · was 64`
const ML_DSA_65_SIGNATURE_ROW = `${formatBytes(ML_DSA_65.signatureOrCiphertextBytes)} · was 64`
const ML_DSA_65_SIGNATURE_ONLY = formatBytes(ML_DSA_65.signatureOrCiphertextBytes)

/**
 * ops sideCard's "150 ops/s · ~133× slower than ECDSA" — both figures already
 * exist as the HSM Capacity Calculator's own defaults (`CLASSICAL_HSM_DEFAULT.
 * opsPerSec`), the same numbers the calculator itself uses. There is no need
 * for a new constant here; this was mis-diagnosed as missing during planning
 * (a truncated grep hid the `opsPerSec` block further down the file) — it
 * exists, so this is a plain wiring fix like the byte-size rows above.
 */
const OPS_SIDECARD_THROUGHPUT_ROW = `${CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']} ops/s · ~${Math.round(
  CLASSICAL_HSM_DEFAULT.opsPerSec['ecdsa-p256'] / CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']
)}× slower than ECDSA`

const OCSP_CRL_SIGNATURE_ONLY_KB = (ML_DSA_65.signatureOrCiphertextBytes / 1000).toFixed(1)
const OCSP_CRL_WITH_KEY_KB = Math.round(
  (ML_DSA_65.signatureOrCiphertextBytes + ML_DSA_65.publicKeyBytes) / 1000
)
const OPS_SIDECARD_OCSP_ROW = `+${OCSP_CRL_SIGNATURE_ONLY_KB} KB · ~${OCSP_CRL_WITH_KEY_KB} KB with key`

/** HSM Capacity Calculator's real workflow count — "ten enterprise use cases". */
const HSM_CAPACITY_USE_CASE_COUNT = USE_CASES.length

/** The CACP migration tab's real estate size — "seven-key business estate". */
const MIGRATION_ESTATE_KEY_COUNT = MIGRATION_KEYS.length

/**
 * Combines a persona's featured artifacts across the given Fig 3 zones, in
 * zone order then within-zone config order. Board copy that names these
 * artifacts by hand (§3 Tier 2 of the remediation plan) reads this instead —
 * note this may reorder 1-2 items relative to the old hand-tuned sentence
 * flow (e.g. a trailing item moved earlier to match config order); the set of
 * artifacts named is what matters and stays exact.
 */
function combinedArtifacts(personaId: PersonaId, zones: ZoneId[]): string[] {
  // eslint-disable-next-line security/detect-object-injection -- personaId is a PersonaId union, not user input
  const emphasis = BC_ZONE_EMPHASIS_BY_PERSONA[personaId]
  if (!emphasis) return []
  // eslint-disable-next-line security/detect-object-injection -- zone is a ZoneId union, not user input
  return zones.flatMap((zone) => emphasis.featuredArtifacts[zone] ?? [])
}

/** Report section ids whose displayed name differs from the literal id. */
const REPORT_SECTION_DISPLAY_LABEL: Partial<Record<ReportSectionId, string>> = {
  hndlHnfl: 'HNDL',
}

function reportSectionLabel(id: ReportSectionId): string {
  // eslint-disable-next-line security/detect-object-injection -- id is a ReportSectionId union, not user input
  return REPORT_SECTION_DISPLAY_LABEL[id] ?? id
}

function reportSectionsByState(personaId: PersonaId, state: SectionState): ReportSectionId[] {
  // eslint-disable-next-line security/detect-object-injection -- personaId is a PersonaId union, not user input
  const config = PERSONA_REPORT_CONFIG[personaId] ?? {}
  return (Object.entries(config) as [ReportSectionId, ReportSectionConfig][])
    .filter(([, cfg]) => cfg.state === state)
    .map(([id]) => id)
}

const REPORT_SECTION_TOTAL_COUNT = Object.keys(REPORT_SECTION_DEFAULTS).length
const DEVELOPER_REPORT_OVERRIDE_COUNT = Object.keys(PERSONA_REPORT_CONFIG.developer).length

/**
 * "3 hours 20, not 10¼" — the essentials-vs-full-path fragment used by 4 of
 * the 5 personas whose trackTitle carries this shape (researcher's doesn't;
 * curious's uses a different sentence built separately below). Reads the same
 * `essentialsMinutes`/`estimatedMinutes` fields `RoleHomeView.tsx`'s
 * `trackLine()` already computes live, tested there.
 *
 * The "not Z¼" figure rounds the full-path total to the nearest quarter hour.
 * Every persona except ops lands on an exact quarter hour today; ops's real
 * total (1765 min = 29h25m) doesn't, so its figure is a ~5-minute rounding
 * approximation — same as its hand-typed predecessor, just computed instead
 * of typed, so it can't drift further without this formula changing with it.
 */
function formatEssentialsVsFull(personaId: PersonaId): string {
  // eslint-disable-next-line security/detect-object-injection -- personaId is a PersonaId union, not user input
  const persona = PERSONAS[personaId]
  const essentialsH = Math.floor(persona.essentialsMinutes / 60)
  const essentialsM = persona.essentialsMinutes % 60
  const essentialsPhrase =
    essentialsM === 0 ? `${essentialsH} hours` : `${essentialsH} hours ${essentialsM}`

  const totalQuarters = Math.round((persona.estimatedMinutes / 60) * 4)
  const fullWhole = Math.floor(totalQuarters / 4)
  const remainderQuarters = totalQuarters % 4
  const fractionGlyph =
    remainderQuarters === 1
      ? '¼'
      : remainderQuarters === 2
        ? '½'
        : remainderQuarters === 3
          ? '¾'
          : ''

  return `${essentialsPhrase}, not ${fullWhole}${fractionGlyph}`
}

export const PERSONA_JOURNEY_BOARD: Record<PersonaId, PersonaJourneyBoard> = {
  executive: {
    heroEyebrow: "Illustrative — this user's inputs",
    heroBadge: {
      text: 'Default: Americas · Finance & Banking — scenario shown: EU',
      tone: 'illustrative',
    },
    headline: 'Answer the board in eleven minutes.',
    sub: 'Eight questions about your estate. You get a defensible risk position, the regulatory dates that already bind you under NIS2 and DORA, and a board pack you can present on Thursday.',
    ctaPrimary: 'Start — 8 questions, about 6 minutes',
    ctaPrimaryHref: '/assess',
    ctaSecondary: 'See a finished example',
    ctaSecondaryHref: '/report',
    proofChips: [
      'Verified in your browser against NIST ACVP vectors',
      `${LIBRARY_ACTIVE_SOURCE_COUNT} sources, trust-tiered`,
      REGULATORY_DATA_VERIFIED_DATE
        ? `Regulatory data verified ${REGULATORY_DATA_VERIFIED_DATE}`
        : 'Regulatory data verified against source',
      'How we verify',
    ],
    sideCard: {
      title: 'Your exposure window',
      tone: 'bad',
      provenance: 'illustrative',
      rows: [
        { label: 'Data must stay secret', value: '12 yrs' },
        { label: 'Your migration takes', value: '5 yrs' },
        { label: 'Cryptanalytic quantum computer', value: '2032 ±4' },
      ],
      punchline: 'You are four years short.',
      footnote:
        "Mosca's inequality. The 2032 estimate is a median across 4 published expert surveys; the ±4 band is their interquartile range, not a forecast.",
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Generated from your 8 answers',
    gridCards: [
      {
        title: 'Risk position',
        body: `From riskScore, keyFindings and riskBreakdown — three of the ${REPORT_SECTION_TOTAL_COUNT} report sections, all already open by default for your role.`,
      },
      {
        title: 'Two already bind you',
        // NIS2/DORA/roadmap dates are intentionally NOT wired live here — see
        // COMPLIANCE-DEADLINE-DATE-FIELDS-PLAN-2026-08-01.md. 3 of these 4
        // dates aren't in a structured CSV field on their own record today;
        // that's a separate CSV-schema task, decoupled from this one.
        body: 'NIS2 (since Oct 2024) · DORA (since Jan 2025) · National PQC roadmap due (Dec 2026) · High-risk systems migrated (Dec 2030)',
      },
      {
        title: 'Your board pack',
        body: `The ${toWordIfSmall(combinedArtifacts('executive', ['governance']).length)} artifacts already featured in your Governance zone: ${combinedArtifacts('executive', ['governance']).join(', ')}.`,
      },
    ],
    trackTitle: `Then, if you want the background: ${formatEssentialsVsFull('executive')}.`,
    trackNote: `${capitalizedSmallNumberWord(PERSONAS.executive.essentials.length)} essentials against the full ${PERSONAS.executive.recommendedPath.filter((id) => id !== 'quiz').length}-module, ${PERSONAS.executive.estimatedMinutes}-minute path. The path already inserts your real milestones after exec-cp-3/exec-cp-4.`,
    trackChips: [
      'PQC 101',
      'Quantum impact',
      'Quantum threats',
      'Risk management',
      'Business case',
      'Governance',
      'Compliance strategy',
    ],
    capstoneChip: { label: 'Board-Ready' },
  },

  developer: {
    heroEyebrow: 'Developer · Node + Go services · TLS termination at the edge',
    heroBadge: { text: 'Americas · Technology', tone: 'sourced' },
    headline: 'Five minutes to a real ML-KEM handshake.',
    sub: 'Not a diagram. Real WASM crypto in this tab, with the PKCS#11 call log open and a plain-English column beside it. Then we tell you what to change in your stack.',
    ctaPrimary: 'Run X25519MLKEM768 now',
    ctaPrimaryHref: '/playground/tls-simulator',
    ctaSecondary: 'Compare against my stack',
    ctaSecondaryHref: '/migrate',
    proofChips: [
      'Real liboqs + SoftHSMv3 in your browser',
      'Verified against NIST ACVP vectors',
      'No signup, no key required',
    ],
    sideCard: {
      title: 'What this breaks in your code',
      tone: 'warn',
      provenance: 'sourced',
      rows: [
        { label: 'ML-DSA-65 public key', value: ML_DSA_65_PUBLIC_KEY_ROW },
        { label: 'ML-DSA-65 signature', value: ML_DSA_65_SIGNATURE_ROW },
        { label: 'Your VARCHAR(256) key column', value: 'overflows' },
      ],
      punchline: 'Your schema breaks before your crypto does.',
      footnote:
        'Real sizes, not illustrative — the second of the four anti-patterns the Crypto Agility module already teaches.',
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Real surfaces mapped to what you actually own',
    gridCards: [
      {
        title: 'Migrate, scoped to your layers',
        body: `Your persona gives you ${joinWithAnd(PERSONA_MIGRATE_LAYERS.developer)} — the catalogue opens pre-filtered to the ${toWordIfSmall(PERSONA_MIGRATE_LAYERS.developer.length)} you actually own.`,
      },
      {
        title: 'Command Center · Implementation View',
        body: `Opens on the Migration zone with ${joinWithAnd(combinedArtifacts('developer', ['migration', 'mitigation', 'governance']))} featured.`,
      },
      {
        title: 'A report that is finally yours',
        body:
          DEVELOPER_REPORT_OVERRIDE_COUNT === 0
            ? `Your report config is untouched — all ${REPORT_SECTION_TOTAL_COUNT} sections at defaults. This version opens algorithmMigration and cbom first.`
            : `Your report now tailors ${DEVELOPER_REPORT_OVERRIDE_COUNT} section${DEVELOPER_REPORT_OVERRIDE_COUNT === 1 ? '' : 's'} for this persona. This version opens algorithmMigration and cbom first.`,
      },
    ],
    trackTitle: `Then, the background: ${formatEssentialsVsFull('developer')}.`,
    trackChips: [
      'PQC 101',
      'Dev quantum impact',
      'PQC candidates',
      'TLS basics',
      'Hybrid crypto',
      'Crypto agility',
      'PKI workshop',
      'Crypto dev APIs',
    ],
    capstoneChip: { label: 'capstone' },
  },

  architect: {
    heroEyebrow: 'Security architect · Multi-region PKI · 40k certificates',
    heroBadge: { text: 'Global · Technology, Telecommunications', tone: 'sourced' },
    headline: 'Change one policy line. Watch the estate rekey.',
    sub: 'A KMIP 3.0 control plane and a real PKCS#11 HSM, both in this tab. Create keys by business label, flip Classical → Hybrid → Full PQC, and watch the same request get allowed, denied, or auto-rekeyed.',
    ctaPrimary: 'Open the control plane',
    ctaPrimaryHref: '/playground/cacp',
    ctaSecondary: `See the ${toWordIfSmall(MIGRATION_ESTATE_KEY_COUNT)}-key estate`,
    ctaSecondaryHref: '/playground/cacp?plane=migration',
    proofChips: [
      'Real ML-KEM / ML-DSA / SLH-DSA, no server',
      'KMIP 3.0 conformance corpus replays live',
      'All 66 KMIP operations documented',
    ],
    sideCard: {
      title: 'Why agility, not just algorithms',
      tone: 'info',
      provenance: 'illustrative',
      rows: [
        { label: 'Algorithms you will migrate to', value: '3' },
        { label: 'Times you will migrate again', value: '≥ 2' },
        { label: 'Cost of the second migration', value: 'near zero' },
      ],
      punchline: 'Agility is the deliverable. PQC is the first test of it.',
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Real artifacts from your zone configuration',
    gridCards: [
      {
        title: 'A rekey lineage',
        body: `Old to new across the ${toWordIfSmall(MIGRATION_ESTATE_KEY_COUNT)}-key business estate, per mode, with the KMIP log per key — from the CACP migration tab.`,
      },
      {
        title: 'Command Center · System View',
        body: `Governance zone featuring ${joinWithAnd(combinedArtifacts('architect', ['governance']))}.`,
      },
      {
        title: 'Migration artifacts',
        body: `${joinWithAnd(combinedArtifacts('architect', ['migration']))} — the richest featured set of any persona.`,
      },
    ],
    trackTitle: `Then, the background: ${formatEssentialsVsFull('architect')}.`,
    trackChips: [
      'PQC 101',
      'Arch quantum impact',
      'PQC candidates',
      'Crypto agility',
      'Crypto mgmt modernization',
      'Hybrid crypto',
      'KMS',
      'HSM',
      'PKI workshop',
    ],
    capstoneChip: { label: 'capstone' },
  },

  ops: {
    heroEyebrow: 'IT Ops · 12k certs · 4 HSM partitions · next renewal window in 90 days',
    heroBadge: {
      text: 'Americas · Energy & Utilities, Telecommunications',
      tone: 'sourced',
    },
    headline: 'Will your HSMs survive the cutover?',
    sub: `${capitalizedSmallNumberWord(HSM_CAPACITY_USE_CASE_COUNT)} enterprise workflows, sized side by side: RSA-3072 and ECDSA P-256 today against ML-DSA-44/65/87. Storage, bandwidth, and CPU cores per workflow, with a totals row.`,
    ctaPrimary: 'Size my fleet',
    ctaPrimaryHref: '/playground/hsm',
    ctaSecondary: 'Import my cert inventory',
    ctaSecondaryHref: '/migrate',
    proofChips: [
      'Sizing from real FIPS 203/204 key sizes',
      'Benchmarked through a real PKCS#11 engine',
      'CNSA 2.0 mandate dates built in',
    ],
    sideCard: {
      title: 'What changes on renewal day',
      tone: 'warn',
      provenance: 'sourced',
      rows: [
        { label: 'ML-DSA-65 signature', value: ML_DSA_65_SIGNATURE_ONLY },
        // Tightened from the design mockup's ambiguous "classical HSM" label —
        // the ops/s figure needs to name which algorithm it's benchmarking, or
        // it doesn't disambiguate against the ML-DSA-65 signature row above.
        {
          label: "ML-DSA-65 sign rate on today's HSM",
          value: OPS_SIDECARD_THROUGHPUT_ROW,
        },
        { label: 'Per OCSP / CRL response', value: OPS_SIDECARD_OCSP_ROW },
      ],
      punchline: 'Your next renewal window is your migration window.',
      footnote:
        'Real figures, not illustrative — the same defaults behind the HSM Capacity Calculator this page opens with.',
    },
    gridTitle: 'What you walk out with',
    gridSub: 'Real zones and artifacts for your fleet',
    gridCards: [
      {
        title: 'A sizing verdict',
        body: `Per workflow: storage MB, aggregate network MB/s, CPU cores, and whether your fleet clears it — across the calculator's ${toWordIfSmall(HSM_CAPACITY_USE_CASE_COUNT)} enterprise use cases.`,
      },
      {
        title: 'Command Center · Run View',
        body: `Opens on Migration with ${joinWithAnd(combinedArtifacts('ops', ['mitigation', 'risk-management', 'migration', 'governance']))}. Mitigation gateways carry mandatory sunset dates per CSWP.39 §4.6.`,
      },
      {
        title: 'A report built for the cutover',
        body: `Your report opens ${joinWithAnd(reportSectionsByState('ops', 'open'))}, and hides ${joinWithAnd(reportSectionsByState('ops', 'hidden').map(reportSectionLabel))} — correct emphasis, already shipped.`,
      },
    ],
    trackTitle: `Then, the background: ${formatEssentialsVsFull('ops')}.`,
    trackChips: [
      'PQC 101',
      'Ops quantum impact',
      'TLS basics',
      'VPN/SSH',
      'PKI workshop',
      'Crypto agility',
      'Migration program',
      'KMS',
      'HSM',
    ],
    capstoneChip: { label: 'capstone' },
  },

  researcher: {
    heroEyebrow: 'Researcher · unfiltered corpus · strict chronological · no gating',
    heroBadge: { text: 'All regions · unfiltered', tone: 'illustrative' },
    headline: 'Check our work.',
    sub: 'Every claim on this site carries a source tier, a verification date, and where one exists, the strongest published argument against it. Run the known-answer tests yourself in this tab.',
    ctaPrimary: 'Open the evidence workspace',
    ctaPrimaryHref: '/library',
    ctaSecondary: 'Run the ACVP vectors',
    ctaSecondaryHref: '/playground/hsm',
    proofChips: [
      'ACVP + KAT run locally, not asserted',
      'Authoritative / High / Moderate / Low source tiers',
      'Counter-claims dataset · CVE snapshots',
      'Drift guards fail the build on silent data change',
    ],
    // NOTE: the researcher side-card is intentionally a stub. Per
    // IMPLEMENTATION-PLAN-2026-08-01.md §6, "Changed in your fields since
    // [date]" is a separate, real, in-scope workstream (a new persisted
    // followed-fields store + a live revision/deprecation counter), owned by
    // ResearcherFieldWatchCard — NOT this static config. That component
    // overrides this whole sideCard at render time with its own live-computed
    // title/rows/punchline/footnote. rows: [] only exists so this object still
    // satisfies the PersonaJourneyBoard type; do not add real row content here.
    sideCard: {
      title: 'Changed in your fields since your last visit',
      tone: 'info',
      provenance: 'illustrative',
      rows: [],
      punchline: '',
    },
    gridTitle: 'What the workspace gives you',
    gridSub: 'Not a funnel — instruments, named from source',
    gridCards: [
      {
        title: 'Provenance on every claim',
        body: 'Source tier, verification date, and the counter-claim where one is on file. Library and Migrate filters are both empty arrays for this persona — the corpus arrives unfiltered by design.',
      },
      {
        title: 'Reproducible verification',
        body: 'ACVP vectors, KATs and the 25-check TCG V1.85 runner, all in your browser, log exportable.',
      },
      {
        title: 'Command Center · Risk Analysis',
        body: `The one persona that opens on the risk-management zone: ${joinWithAnd(combinedArtifacts('researcher', ['risk-management', 'governance']))} as citable evidence.`,
      },
    ],
    trackTitle: 'Learning path: available, never pushed.',
    trackNote:
      'For this persona it is a reference shelf, not a curriculum, and the UI should say so.',
    trackChips: [
      'PQC 101',
      'Research quantum impact',
      'PQC candidates',
      'Entropy & randomness',
      'Hybrid crypto',
      'Crypto agility',
      'Standards bodies',
      'TLS basics',
      'PKI workshop',
    ],
    // Deliberately no capstoneChip — the only persona without one, matching
    // the "no funnel" framing. Do not add one.
  },

  curious: {
    heroEyebrow: 'No background needed · about 6 minutes · nothing to install',
    heroBadge: { text: 'Americas · unfiltered', tone: 'illustrative' },
    headline: 'What actually breaks, and when.',
    sub: 'The padlock in your browser relies on maths a quantum computer would undo. Watch it happen to a real connection in this tab, then decide how much further you want to go.',
    ctaPrimary: 'Show me',
    ctaPrimaryHref: '/playground/tls-simulator',
    ctaSecondary: 'I have 30 seconds — the short version',
    ctaSecondaryHref: '/timeline',
    proofChips: [
      'Real cryptography, running here',
      'Plain English by default',
      'Every term explained on hover',
    ],
    sideCard: {
      title: 'The bit that surprises people',
      tone: 'bad',
      provenance: 'illustrative',
      rows: [
        { label: 'Encrypted data captured today', value: 'still readable later' },
        { label: 'If it must stay secret for', value: '12 years' },
        { label: 'And the machine arrives in', value: '~2032' },
      ],
      punchline: 'The deadline already passed for some data.',
      footnote:
        'Harvest now, decrypt later. That is the whole argument, and it is the one idea worth leaving with even if you read nothing else.',
    },
    gridTitle: 'Where you can go next',
    gridSub: 'Optional, none of it locked — all of it real',
    gridCards: [
      {
        title: 'The short version',
        body: `${capitalizedSmallNumberWord(PERSONAS.curious.essentials.length)} modules, ${PERSONAS.curious.essentialsMinutes} minutes, plain language throughout. Milestones already sit in the path: ${PERSONA_MILESTONES.curious.map((m) => m.label).join(', ')}.`,
      },
      {
        title: 'A library worth browsing',
        body: `Today your library is ${toWordIfSmall(PERSONA_LIBRARY_CATEGORIES.curious.length)} categories — ${joinWithAnd(PERSONA_LIBRARY_CATEGORIES.curious)}. A library with ${toWordIfSmall(PERSONA_LIBRARY_CATEGORIES.curious.length)} shelves.`,
      },
      {
        title: 'A read on your own risk',
        body: `Today the report hides ${joinWithAnd(reportSectionsByState('curious', 'hidden').map(reportSectionLabel))} and caps actions at ${PERSONA_REPORT_CONFIG.curious.recommendedActions?.maxItems}. Here it explains rather than withholds.`,
      },
    ],
    trackTitle: `${capitalizedSmallNumberWord(PERSONAS.curious.essentials.length)} modules, ${PERSONAS.curious.essentialsMinutes} minutes — and yes, that is still a lot.`,
    trackNote: `Honest note: this is the one number the redesign cannot fix by re-fronting. The curious essentials track (${PERSONAS.curious.essentialsMinutes} min) is longer than the executive one (${PERSONAS.executive.essentialsMinutes} min), for a less technical audience. That is a content problem, not a mockup problem.`,
    trackChips: [
      'PQC 101',
      'PQC candidates',
      'Quantum threats',
      'Risk basics',
      'Compliance timelines',
      'TLS basics',
    ],
    capstoneChip: { label: 'Quantum-Native' },
  },
}
