// SPDX-License-Identifier: GPL-3.0-only
import type { PersonaId } from './learningPersonas'
import { PERSONAS } from './learningPersonas'
import type { Region } from '../store/usePersonaStore'
import type { AssessmentMode } from '../store/useAssessmentStore'
import type { PhaseId } from './frameworkPhases'
import { ALGORITHM_REGISTRY } from './algorithmProperties'
import { TYPE_LABELS } from './artifactLabels'
// Value import; `reportSectionToCswp39` imports ReportSectionId back from here
// but as `import type`, which is erased at compile time — so this is a one-way
// runtime edge, not a cycle.
import { REPORT_SECTION_LABELS } from './reportSectionToCswp39'
import { CLASSICAL_HSM_DEFAULT, USE_CASES } from './hsmCapacityDefaults'
import { MIGRATION_KEYS } from '../components/Playground/kmip/migration/migrationKeys'
import { TRACK_INFO } from '../components/Assess/redesign/assessFlowModel'
import { getLandscapeIndustries } from './industryLandscapeData'
import { isCrossIndustry } from './industryMatch'
import {
  getCrqcConsensus,
  CRQC_ESTIMATES,
} from '../components/PKILearning/modules/QuantumThreats/data/quantumConstants'

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
 * B+ remediation 2.5 (2026-08-10) — the broad fallback is REVERSED for the two
 * personas that have no phase set. Showing "Practice in the Simulation" on
 * every single module for researcher and curious was a call to action for a
 * migration neither of them is running; a prompt on everything is a prompt on
 * nothing. `PERSONA_SIM_PRACTICE_NONE` below names them explicitly (rather
 * than leaving it to `undefined`, which cannot distinguish "no mapping yet"
 * from "deliberately none"), and `personaPracticesModulePhase` returns false
 * for them. `null` (no persona chosen) keeps the broad fallback — we know
 * nothing about that visitor, so we suppress nothing.
 */
export const PERSONA_SIM_PRACTICE_PHASES: Partial<Record<PersonaId, PhaseId[]>> = {
  executive: ['p0', 'p1', 'p2', 'p3', 'p4', 'p7', 'verify-close', 'foundations'],
  architect: ['p1', 'p2', 'p3', 'p5'],
  // B+ remediation 2.5 asked to "add developer's selection phase; add ops
  // verify-and-close" — REJECTED after checking ROLE_CROSSWALK, and recorded
  // here so it isn't re-proposed. `p4` (selection) is owned by 'qrpm' and
  // 'pmo-analyst', both executive-mapped; 'verify-close' by 'qrpm' alone.
  // Neither developer seat ('security-eng', 'appsec-lead') nor the ops seat
  // ('ot-specialist') drives either phase in-sim. Adding them here would make
  // the CTA offer a rehearsal for a phase the player's own seat cannot act in
  // — precisely the drift `personaConfig.test.ts`'s guard exists to catch, and
  // a worse outcome than the missing prompt it was meant to fix. If these
  // phases should genuinely be practised by those roles, the change belongs in
  // ROLE_CROSSWALK (seat ownership), not in this CTA map.
  ops: ['p5', 'p6'],
  developer: ['p5', 'p6'],
  // researcher / curious → deliberately none, see PERSONA_SIM_PRACTICE_NONE
}

/**
 * Personas for which the "Practice in the Simulation" CTA is deliberately
 * never shown, rather than merely unmapped. Neither holds a program role in
 * `ROLE_CROSSWALK` — there is no seat for them at the table the sim models —
 * so pointing them at a migration rehearsal is noise. This is a *decision*
 * recorded as data; `PERSONA_SIM_PRACTICE_PHASES` leaving them undefined only
 * recorded an absence of one.
 */
export const PERSONA_SIM_PRACTICE_NONE: readonly PersonaId[] = ['researcher', 'curious']

/**
 * True when the active persona practices this module's phase in the sim, so the
 * "Practice in the Simulation" CTA should show. A persona listed in
 * `PERSONA_SIM_PRACTICE_NONE` never shows it (B+ remediation 2.5). No persona
 * at all still returns true — the broad fallback for an unknown visitor.
 */
export function personaPracticesModulePhase(
  persona: PersonaId | null,
  frameworkPhase: PhaseId | PhaseId[]
): boolean {
  if (persona && PERSONA_SIM_PRACTICE_NONE.includes(persona)) return false
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
    '/navigate',
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
    '/navigate',
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
    '/navigate',
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
    '/navigate',
    // /openssl folded into Playground's own card (see developer's note above).
    // /simulation added as a plain (non-marked) row.
    '/simulation',
  ],
  curious: [
    '/explore',
    // Migrate → Compliance kept adjacent, matching every other persona's
    // order below (executive/developer/architect/ops all list them as a
    // consecutive pair) — curious was the one inconsistent list.
    '/migrate',
    '/compliance',
    '/assess',
    '/report',
    '/algorithms',
    '/library',
    '/playground',
    '/navigate',
    // B+ remediation 2.2 (2026-08-10). Two changes to this list:
    //  - '/patents' removed entirely — it now carries a PERSONA_ABSENT_PATHS
    //    entry instead, so the rail says "not offered, and why" rather than
    //    offering a newcomer a patent database. Patent law is further from a
    //    first-time reader than from an operator, and ops was already excluded.
    //  - '/leaders' demoted to MORE (dropped from this list, no absence entry)
    //    — still one click away, just not a FOR YOU row for someone who has no
    //    reason yet to care who any of these people are.
    // '/migrate' and '/compliance' are deliberately KEPT: the handoff's own
    // §4.6 specifies curious lenses for both ("who has already moved" /
    // "who makes the rules"), which its §2.2 rail list contradicted.
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

/**
 * Routes deliberately NOT offered to a persona, with the reason and the place
 * that need is met instead.
 *
 * The B+ remediation program's second grading principle: *a deliberate absence
 * must be visible where it takes effect*. Several correct decisions on this
 * page (ops without `/patents`, curious without `/business`) previously lived
 * only in the doc comments above and therefore read as bugs on screen — a
 * missing row is indistinguishable from a broken one. Every entry here is
 * rendered by the rail as a "not offered for your role — why" affordance in
 * the owning group's footer (`MainLayout.tsx`), and summarised in the persona
 * picker and on About via `describePersonaAdaptation` below.
 *
 * IMPORTANT — this is NOT "everything missing from `PERSONA_NAV_PATHS`". A path
 * left out of a persona's FOR YOU list still renders as a MORE row and stays
 * one click away; that is *deprioritisation*, and it needs no notice. An entry
 * here is stronger: `getRailSections` drops the path from FOR YOU **and** MORE,
 * so the rail offers no row at all, and this notice takes its place. Reserve it
 * for routes a role genuinely should not be pointed at (the route itself stays
 * live — URL, deep link and ⌘K all still work).
 *
 * `insteadPath` MUST be reachable by that same persona — an absence notice
 * that points at another closed door is worse than no notice. Enforced by
 * `scripts/audit-persona-lens.ts`.
 */
export interface PersonaAbsence {
  /** One plain sentence: why this role isn't offered this route. */
  reason: string
  /** Where the same underlying need is met for this role. */
  insteadPath: string
  insteadLabel: string
}

export const PERSONA_ABSENT_PATHS: Record<PersonaId, Record<string, PersonaAbsence>> = {
  executive: {},
  developer: {
    // Settled 2026-08-10 (B+ remediation 4.1): a developer role board links
    // /leaders while the rail excludes it — a live contradiction. Kept OFF the
    // rail (a directory is not a build surface) and stated here instead, so
    // the board link still works and the rail explains why it isn't a row.
    '/leaders': {
      reason:
        'The community directory is a reading list, not a build surface — your boards still link it where a name matters.',
      insteadPath: '/library',
      insteadLabel: 'Library',
    },
  },
  architect: {},
  // researcher: PERSONA_NAV_PATHS is null — no gating at all, so no absences.
  researcher: {},
  ops: {
    // The O1 decision (07-19 follow-up remediation), previously recorded only
    // in PERSONA_NAV_PATHS' comment above.
    '/patents': {
      reason:
        'Patent research is not an operations task. The licensing angle you need rides on the vendors in the migration catalog.',
      insteadPath: '/migrate',
      insteadLabel: 'Migrate',
    },
  },
  curious: {
    '/business': {
      reason:
        'The Command Center works from your own assessment answers, so it opens after you finish the assessment.',
      insteadPath: '/assess',
      insteadLabel: 'Assess',
    },
    // Added 2026-08-10 (B+ remediation 2.2): patent law is further from a
    // newcomer than from an operator, and ops is already excluded above — the
    // previous shape had this exactly the wrong way round.
    '/patents': {
      reason:
        'Patent law is a specialist read, and none of it changes what post-quantum means for you.',
      insteadPath: '/algorithms',
      insteadLabel: 'Algorithms',
    },
  },
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
  '/navigate': 'Navigate',
  '/openssl': 'OpenSSL Studio',
  '/revisions': 'Revisions',
  '/about': 'About',
}

/**
 * Top 3 landing page feature card paths to badge as "Recommended" per persona.
 */
export const PERSONA_RECOMMENDED_PATHS: Record<PersonaId, string[]> = {
  executive: ['/learn', '/assess', '/business', '/compliance'],
  // B+ remediation 4.6 (2026-08-10): '/openssl' is rail-hidden
  // (RAIL_HIDDEN_PATHS) — badging it "Recommended" on a landing card that
  // the rail then refuses to show was the second half of the two-front-doors
  // contradiction. Recommend the Playground, whose PT-023 card IS the door.
  developer: ['/learn', '/algorithms', '/playground'],
  architect: ['/learn', '/timeline', '/assess', '/business'],
  researcher: ['/learn', '/algorithms', '/playground', '/library', '/patents'],
  ops: ['/learn', '/migrate', '/playground', '/assess'],
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
    'Finance & Banking',
    'Insurance',
    'Payment Card Industry',
    'Cryptocurrency / Blockchain',
  ],
  'Government & Defense': ['Government & Defense', 'Legal / Notary / eSignature'],
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
  'Retail & E-Commerce': ['Retail & E-Commerce'],
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
  // WS4a (2026-08-02) — this was `{}`. Five personas carried real overrides and
  // developer carried none, so an implementer got the no-persona report and the
  // page said so out loud ("All N report sections, at their defaults"). The
  // profile below leads with what an implementer acts on and demotes the
  // board-framing sections rather than hiding them — a developer sometimes has
  // to present upward, so nothing is removed, only ordered by usefulness.
  developer: {
    // The two an implementer opens first: what to replace, and the inventory of
    // what they have. `cbom` is collapsed by default; for this persona it is
    // the working document.
    cbom: { state: 'open' },
    discovery: { state: 'open' },
    // Concrete integration surfaces.
    migrationToolkit: { state: 'open' },
    migrationRoadmap: { state: 'open' },
    // Dependencies a developer cannot fix in their own code — needed, but not
    // the first thing they read.
    vendorRisk: { state: 'collapsed' },
    // Board framing: demoted, never hidden.
    executiveSummary: { state: 'collapsed' },
    riskBreakdown: { state: 'collapsed' },
    complianceImpact: { state: 'collapsed' },
  },
  architect: {
    assessmentProfile: { state: 'open' },
    threatLandscape: { state: 'open' },
  },
  // B+ remediation 4.4 (2026-08-10): researcher had been inheriting the
  // architect profile wholesale (the two entries were byte-identical). A
  // researcher reads for METHOD before conclusions — what went in, how it was
  // scored, and what the evidence behind each claim is — so the inputs and the
  // threat corpus lead, the derived score keeps its working open beneath them,
  // and the programme-management sections that assume you are running a
  // migration are demoted rather than hidden.
  researcher: {
    assessmentProfile: { state: 'open' },
    threatLandscape: { state: 'open' },
    riskBreakdown: { state: 'open' },
    hndlHnfl: { state: 'open' },
    // Not a migration this reader is running: kept, but out of the way.
    migrationRoadmap: { state: 'collapsed' },
    migrationToolkit: { state: 'collapsed' },
    recommendedActions: { state: 'collapsed' },
    executiveSummary: { state: 'collapsed' },
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
    // B+ remediation 4.4 (2026-08-10): was 'hidden'. The roadmap was curious's
    // only "what happens next", and hiding it left the report ending on a score
    // with no follow-on. Collapsed (not open) and capped at three steps keeps it
    // a simplified answer rather than a programme plan.
    migrationRoadmap: { state: 'collapsed', maxItems: 3 },
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
  icon: 'Calendar' | 'BookOpen' | 'FlaskConical' | 'Package' | 'BarChart3' | 'Terminal' | 'Layers'
}

export const PERSONA_REPORT_CTAS: Record<PersonaId, ReportCTA[]> = {
  executive: [
    { label: 'Open Command Center', path: '/business', icon: 'BarChart3' },
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
    { label: 'Explore in OpenSSL', path: '/playground/openssl-studio', icon: 'Terminal' },
    { label: 'Start learning path', path: '/learn', icon: 'BookOpen' },
  ],
  ops: [
    { label: 'Browse migration catalog', path: '/migrate', icon: 'Package' },
    { label: 'Try OpenSSL Studio', path: '/playground/openssl-studio', icon: 'Terminal' },
    { label: 'Start learning path', path: '/learn', icon: 'BookOpen' },
  ],
  curious: [
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
  /**
   * One line saying what this milestone is FOR — B+ remediation 4.6
   * (2026-08-10). "A milestone is a page visit with no stated purpose" was the
   * review's whole finding here; a nudge without a reason is not a nudge.
   * Required (not optional) so a new milestone cannot be added without one.
   */
  purpose: string
}

export const PERSONA_MILESTONES: Record<PersonaId, JourneyMilestoneConfig[]> = {
  executive: [
    {
      afterPhase: 'exec-cp-3',
      route: '/assess',
      label: 'Run Risk Assessment',
      purpose: 'Fifteen questions produce the risk score your board paper needs.',
    },
    {
      afterPhase: 'exec-cp-3',
      route: '/compliance',
      label: 'Check Compliance Deadlines',
      purpose: 'See which of the frameworks you answer to have already set a date.',
    },
    {
      afterPhase: 'exec-cp-4',
      route: '/business',
      label: 'Explore Business Tools',
      purpose: 'Turn the assessment into a charter, a risk register and a roadmap.',
    },
    {
      afterPhase: 'exec-cp-4',
      route: '/migrate',
      label: 'Browse Migration Workbench',
      purpose: 'Check whether the products you already run have shipped post-quantum support.',
    },
  ],
  developer: [
    {
      afterPhase: 'dev-cp-3',
      route: '/playground',
      label: 'Try the Playground',
      purpose: 'Run the algorithms yourself — real ML-KEM and ML-DSA, in your browser.',
    },
    {
      afterPhase: 'dev-cp-3',
      route: '/playground/openssl-studio',
      label: 'OpenSSL Studio',
      purpose: 'Drive the same commands you would run in production, against a real OpenSSL build.',
    },
    {
      afterPhase: 'dev-cp-4',
      route: '/assess',
      label: 'Run Risk Assessment',
      purpose: 'Fifteen questions produce the risk score your board paper needs.',
    },
    {
      afterPhase: 'dev-cp-5',
      route: '/migrate',
      label: 'Browse Migration Workbench',
      purpose: 'Check whether the products you already run have shipped post-quantum support.',
    },
    {
      afterPhase: 'dev-cp-5',
      route: '/playground',
      label: 'Run ACVP Tests',
      purpose:
        "Verify our numbers against NIST's own known-answer vectors rather than trusting them.",
    },
  ],
  architect: [
    {
      afterPhase: 'arch-cp-2',
      route: '/assess',
      label: 'Run Risk Assessment',
      purpose: 'Fifteen questions produce the risk score your board paper needs.',
    },
    {
      afterPhase: 'arch-cp-2',
      route: '/compliance',
      label: 'Check Compliance Deadlines',
      purpose: 'See which of the frameworks you answer to have already set a date.',
    },
    {
      afterPhase: 'arch-cp-3b',
      route: '/playground',
      label: 'Try the Playground',
      purpose: 'Run the algorithms yourself — real ML-KEM and ML-DSA, in your browser.',
    },
    {
      afterPhase: 'arch-cp-4',
      route: '/migrate',
      label: 'Browse Migration Workbench',
      purpose: 'Check whether the products you already run have shipped post-quantum support.',
    },
  ],
  researcher: [
    {
      afterPhase: 'res-cp-2',
      route: '/playground',
      label: 'Try the Playground',
      purpose: 'Run the algorithms yourself — real ML-KEM and ML-DSA, in your browser.',
    },
    {
      afterPhase: 'res-cp-2',
      route: '/algorithms',
      label: 'Compare Algorithms',
      purpose: 'Put the parameter sets side by side — sizes, levels and standardisation status.',
    },
    {
      afterPhase: 'res-cp-4',
      route: '/playground/openssl-studio',
      label: 'OpenSSL Studio',
      purpose: 'Drive the same commands you would run in production, against a real OpenSSL build.',
    },
    {
      afterPhase: 'res-cp-5',
      route: '/assess',
      label: 'Run Risk Assessment',
      purpose: 'Fifteen questions produce the risk score your board paper needs.',
    },
  ],
  ops: [
    {
      afterPhase: 'ops-cp-2',
      route: '/playground/openssl-studio',
      label: 'OpenSSL Studio',
      purpose: 'Drive the same commands you would run in production, against a real OpenSSL build.',
    },
    {
      afterPhase: 'ops-cp-3',
      route: '/playground',
      label: 'Try the Playground',
      purpose: 'Run the algorithms yourself — real ML-KEM and ML-DSA, in your browser.',
    },
    {
      afterPhase: 'ops-cp-3',
      route: '/assess',
      label: 'Run Risk Assessment',
      purpose: 'Fifteen questions produce the risk score your board paper needs.',
    },
    {
      afterPhase: 'ops-cp-3',
      route: '/playground',
      label: 'Run ACVP Tests',
      purpose:
        "Verify our numbers against NIST's own known-answer vectors rather than trusting them.",
    },
    {
      afterPhase: 'ops-cp-4a',
      route: '/migrate',
      label: 'Browse Migration Workbench',
      purpose: 'Check whether the products you already run have shipped post-quantum support.',
    },
  ],
  curious: [
    {
      afterPhase: 'curious-cp-2',
      route: '/assess',
      label: 'Take Assessment',
      purpose: 'Ten minutes, plain questions, and a picture of what actually reaches you.',
    },
    {
      afterPhase: 'curious-cp-3',
      route: '/timeline',
      label: 'Explore Timeline',
      purpose: "See when your own country's deadlines land.",
    },
    {
      afterPhase: 'curious-cp-4',
      route: '/threats',
      label: 'Explore Threat Landscape',
      purpose: 'See which threats apply to the industry you work in.',
    },
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
  // B+ remediation 4.1 (2026-08-10): researcher was the only role given the
  // generic phase names while every other role got copy in its own language.
  // These read as a research workflow — characterise, corroborate, compare
  // evidence, track the record — not as a migration programme the researcher
  // is not running.
  researcher: {
    assess: 'Characterise the Exposure',
    comply: 'Corroborate the Mandates',
    migrate: 'Compare Vendor Claims to Evidence',
    timeline: 'Track the Standardisation Record',
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
  // 'Compliance & Certification', 'Blockchain Standards' and 'Implementations'
  // were added to LIBRARY_CATEGORIES on 2026-08-22. A category absent from every
  // persona list is invisible in persona-filtered views, so each is assigned
  // here rather than left to default: compliance to the roles that answer for
  // it, implementations to the ones that ship code.
  executive: [
    'Government & Policy',
    'Migration Guidance',
    'Industry & Research',
    'Compliance & Certification',
  ],
  developer: [
    'Protocols',
    'KEM',
    'Digital Signature',
    'Algorithm Specifications',
    'Implementations',
    'Blockchain Standards',
  ],
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
    'Compliance & Certification',
    'Implementations',
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
    // B+ remediation 2.3 (2026-08-10): the three 'business-*' achievements were
    // excluded here while the developer role boards send this persona to FIVE
    // Command Center tools (compliance-checklist, crypto-api-refactor-audit,
    // crypto-cbom-builder, migration-verification, mti-negotiator — see
    // role_board_content_08092026.csv). Sending someone somewhere they can earn
    // nothing is the live contradiction the review named; the exclusions are
    // removed, not the board links. `recordBusinessToolUsage` is wired from
    // BusinessToolRoute.tsx, so these unlock for real.
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
    // B+ remediation 2.3: researcher's own ladder is the three 'research-*'
    // achievements added to achievementCatalog.ts (cite → reproduce →
    // counter-claim). Nothing is excluded here — every other rung is genuinely
    // reachable for this persona, whose PERSONA_NAV_PATHS is `null` (sees all).
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
    // B+ remediation 2.3: 'business-first' un-excluded. The curious role boards
    // link three Command Center tools (breach-simulator, cost-of-inaction,
    // initial-scoping) and '/business/tools' is a rail row for every persona,
    // so opening one is genuinely reachable — the same contradiction developer
    // had, in smaller form. 'business-strategist' (5 tools) and
    // 'business-complete' (all 14) stay excluded: those are a practitioner's
    // ladder, and offering a newcomer a rung they will never climb is the
    // structural hole this item removes rather than adds.
    'business-strategist',
    'business-complete',
  ],
}

/**
 * The three research-ladder achievements (see `achievementCatalog.ts`) are
 * researcher-shaped, not researcher-gated — anyone can trace a citation or
 * reproduce an operation. Named here so the ladder has one place to be read
 * from, and so `getPersonaLadder` below can lead with it for researcher.
 */
export const RESEARCH_LADDER_ACHIEVEMENTS: readonly string[] = [
  'research-sourced',
  'research-reproduced',
  'research-counter-claim',
]

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
  // B+ remediation 2.3 (2026-08-10): four of six roles previously fell through
  // to the generic karate-belt names while executive and curious got ladders
  // written in their own language — "generic copy on the one reader who reads
  // most closely is the most conspicuous possible place to leave it
  // unfinished". Each ladder below is that role's own progression vocabulary,
  // in the same four-tier shape the belt index maps onto.
  developer: ['Reading', 'Building', 'Shipping', 'Migration-Ready'],
  architect: ['Scoping', 'Designing', 'Reviewing', 'Blueprint-Ready'],
  ops: ['Inventorying', 'Piloting', 'Rolling Out', 'Run-Ready'],
  researcher: ['Sourcing', 'Reproducing', 'Corroborating', 'Peer-Ready'],
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
 * persona doesn't have an override. Every one of the six personas now has one
 * (B+ remediation 2.3) — the null path survives for `null` persona and for
 * unknown belt names, both of which are real states, not leftovers.
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
    /**
     * What the rows ARE. Three meanings, three values — `illustrative` used to
     * carry two of them, and its chip says "THIS USER'S INPUTS", which is
     * false of a card asserting a general rule (2026-08-09).
     *   sourced      — read from repo data (sizes, dates, counts)
     *   illustrative — a placeholder for an answer you have not given yet
     *   guidance     — a rule of thumb this site is asserting, and will never
     *                  become your data
     */
    provenance: 'sourced' | 'illustrative' | 'guidance'
    rows: { label: string; value: string }[]
    punchline: string
    footnote?: string
    /**
     * Copy shown when a live side card has nothing to report yet — researcher
     * only, where `ResearcherFieldWatchCard` replaces the static rows with a
     * computed field watch and needs a prompt before any field is followed.
     * Lives here, in the CSV, rather than hardcoded in the component: the
     * component's own hardcoded strings were exactly what the 2026-08-02
     * editorial pass could not see or fix.
     */
    emptyState?: string
  }
  gridTitle: string
  gridSub: string
  /**
   * Always exactly 3 cards; the renderer highlights index [2].
   *
   * `href` (2026-08-09) is optional. Where present the card renders as a real
   * link; where absent it renders as static copy, exactly as every card did
   * before. It exists because a board's only outbound links were its two CTAs
   * and the track chips — 12 link slots per role against 18 sections — so
   * per-role coverage of the site was arithmetically impossible without it.
   * A card headed "What you walk out with" that names a destination and then
   * does not go there was also a small, repeated dead end.
   *
   * Every href is registered and proof-gated in `role_board_ctas_*.csv` on the
   * same terms as a CTA — see `scripts/audit-role-board-ctas.ts`.
   */
  gridCards: [
    { title: string; body: string; href?: string },
    { title: string; body: string; href?: string },
    { title: string; body: string; href?: string },
  ]
  trackTitle: string
  trackNote?: string
  trackChips: string[]
  /** Absent for researcher only — the deliberate "no funnel" persona (no capstone). */
  capstoneChip?: { label: string }
}

/**
 * One of the three board options a role can be shown, with the grounding that
 * justifies it existing.
 *
 * The three options per role are the top three use cases for that role in
 * supporting a PQC migration, drawn from the Simulation's own phase vocabulary
 * (`frameworkPhases.ts`) and cross-checked against `BC_ZONE_EMPHASIS_BY_PERSONA`.
 * `curious` is the deliberate exception: that persona is not running a
 * migration, so its three are entry points and carry no `phaseId`/`cswp39Zone`
 * — forcing the phase axis onto it would invent a use case it does not have.
 *
 * A board carries whichever tools genuinely fit its use case and role — a
 * business tool, a playground workshop, or one of each. Neither kind is
 * mandatory and neither is used by more than one board.
 *
 * ALLOCATION PRIORITY (set 2026-08-02). No destination may serve two boards,
 * so two boards wanting the same tool is a conflict that needs a rule rather
 * than a coin toss. Resolve in this order:
 *
 *   1. DEVELOPER-SPECIFIC RESOURCES GO TO DEVELOPER. Tools whose audience is
 *      someone writing code — OpenSSL Studio, the JWT workshop, the hybrid KEM
 *      pipeline, the cert calculator, and the developer-facing business tools —
 *      are developer's regardless of anything below.
 *   2. Otherwise, first claim in this order wins:
 *        curious > developer > ops > architect > researcher > executive
 *      Curious leads because it is the entry persona: a first-time visitor gets
 *      the single most legible tool, and if that board fails to land, the other
 *      seventeen never get read. Researcher and executive rank last because
 *      they have the most substitutes — the corpus and the business-tool shelf
 *      both offer several equally good options for any given board.
 *
 * Worked example: curious/break and developer/pilot both wanted the TLS 1.3
 * simulator. Rule 1 does not apply (a protocol demo is not developer-only), so
 * rule 2 gives it to curious, and developer/pilot took the hybrid KEM pipeline
 * — which is the more developer-specific tool anyway.
 *
 * `moduleIds`, `workshopIds` and `businessToolIds` are not decoration. A priv-side validator
 * asserts every workshop id is a real `workshopRegistry.tsx` entry and every
 * module id sits on THAT ROLE's own `recommendedPath` — which is what makes
 * "relevant for this role" a check rather than a claim.
 */
export interface RoleBoardVariant {
  id: string
  /** 1-based; order 1 is what the role opens on. */
  order: number
  /** Chip text in the switcher. */
  chipLabel: string
  /** One line of "what this option is for". */
  chipDescription: string
  /** `frameworkPhases.ts` phase id, or '' for the curious entry-point axis. */
  phaseId: string
  /** `cswp39ZoneData.ts` ZoneId, or '' for the curious entry-point axis. */
  cswp39Zone: string
  moduleIds: string[]
  /** Playground workshop ids this board links to (`/playground/:toolId`). */
  workshopIds: string[]
  /** Business tool ids this board links to (`/tools/:toolId`). */
  businessToolIds: string[]
  board: PersonaJourneyBoard
}

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

export function toWordIfSmall(n: number): string {
  // eslint-disable-next-line security/detect-object-injection -- n is bounds-checked above
  return n >= 0 && n < SMALL_NUMBER_WORDS.length ? SMALL_NUMBER_WORDS[n] : String(n)
}

export function capitalizedSmallNumberWord(n: number): string {
  const word = toWordIfSmall(n)
  return word.charAt(0).toUpperCase() + word.slice(1)
}

/** "a, b and c" — no Oxford comma, matching this page's existing house style. */
export function joinWithAnd(items: string[]): string {
  if (items.length === 0) return ''
  if (items.length === 1) return items[0]
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

function formatBytes(n: number): string {
  return `${n.toLocaleString()} B`
}

const ML_DSA_65 = ALGORITHM_REGISTRY['ML-DSA-65']

export const ML_DSA_65_PUBLIC_KEY_ROW = `${formatBytes(ML_DSA_65.publicKeyBytes)} · was 64`
export const ML_DSA_65_SIGNATURE_ROW = `${formatBytes(ML_DSA_65.signatureOrCiphertextBytes)} · was 64`
export const ML_DSA_65_SIGNATURE_ONLY = formatBytes(ML_DSA_65.signatureOrCiphertextBytes)

/**
 * Signature size for any ML-DSA parameter set, read from the same registry.
 *
 * The 2026-08-09 "choose the algorithm" board compares 44/65/87 side by side.
 * Only 65 had a derived constant, so 44 and 87 would have been hand-typed
 * literals sitting next to a live one — the exact drift this file's derived
 * values exist to prevent, and harder to spot because two of the three numbers
 * would still look maintained.
 */
export function mlDsaSignatureBytes(paramSet: string): string {
  const entry = ALGORITHM_REGISTRY[`ML-DSA-${paramSet}` as keyof typeof ALGORITHM_REGISTRY]
  if (!entry) throw new Error(`mlDsaSignatureBytes: no registry entry for ML-DSA-${paramSet}`)
  return formatBytes(entry.signatureOrCiphertextBytes)
}

/* ── Executive side card: Mosca exposure window ──────────────────────────────
 *
 * WHY THESE ARE DERIVED (2026-08-02). All four values on this card — the three
 * rows and the punchline — were hand-typed literals in the CSV, and the
 * punchline had drifted out of agreement with its own rows: it read "You are
 * four years short" above "Data must stay secret 12 yrs / Your migration takes
 * 5 yrs / Cryptanalytic quantum computer 2032 ±4". Mosca's inequality on those
 * numbers gives 11, not 4. ("Four" is what 12 would have been if the secrecy
 * figure were still 5, which is the likeliest history.) A literal conclusion
 * sitting above literal premises cannot be kept honest by review alone, so the
 * conclusion is now computed from the premises.
 *
 * The CRQC year is no longer a literal either. It comes from
 * `getCrqcConsensus()` — the single place the Threats page reduces its six
 * sourced `CRQC_ESTIMATES` rows to headline numbers, which every Q-Day figure
 * on that page already calls so they agree by construction. Its current output
 * (zEstimate 2033, consensus window 2030–2036) does not match the card's old
 * hand-typed "2032 ±4" either, and the old footnote's "median across 4
 * published expert surveys ... interquartile range" misdescribed both the
 * source count and the derivation.
 *
 * The punchline is expressed as a START-BY YEAR rather than a countdown from
 * "now" deliberately: a `Date.now()`-dependent string would make the generated
 * board differ every day and turn the CSV-vs-generated drift gate permanently
 * red. A fixed year is stable, derived, and the more actionable number for the
 * reader anyway.
 *
 * That start-by year is `z - x - y`, NOT `z - y`. This was wrong until
 * 2026-08-02: it computed `z - y` (2033 - 5 = 2028), which drops x — the
 * secrecy requirement — and so is not Mosca's inequality at all, merely
 * "finish as the machine arrives". It also contradicted this app's other
 * implementation of the same formula: SectorExposureHero.tsx computes
 * `z - dataLife - MIGRATION_YEARS` and shows its working on screen
 * ("Z 2033 − X 12 − Y 5"), so the two surfaces disagreed by 12 years on the
 * same question from the same inputs. Finishing as the machine arrives
 * protects nothing already encrypted under a 12-year requirement, which is
 * why the old punchline had to append "or your 12-year secrets are already
 * late" — a clause conceding the conclusion its own number denied.
 *
 * Whether that year is behind us is decided against `EXEC_MOSCA_AS_OF_YEAR`, a
 * DECLARED constant rather than the wall clock, for the same drift-gate reason
 * as above. It is NOT in FRESHNESS_CLAIMS — that registry requires a live
 * source URL to re-verify against, and "what year is it" has none. A unit test
 * asserts it stays within a year of the real clock instead.
 */

/** Illustrative planning assumptions for the executive board's exposure card. */
export const EXEC_EXPOSURE = {
  /** Mosca's x — how long the data must stay confidential. */
  secrecyYears: 12,
  /** Mosca's y — how long a migration of this estate takes. */
  migrationYears: 5,
} as const

const CRQC = getCrqcConsensus()

/** e.g. "2033 (2030–2036)" — consensus estimate with its data-derived window. */
export const EXEC_CRQC_ESTIMATE_ROW = `${CRQC.zEstimate} (${CRQC.qdayLow}–${CRQC.qdayHigh})`

/** e.g. "12 yrs" / "5 yrs". */
export const EXEC_SECRECY_ROW = `${EXEC_EXPOSURE.secrecyYears} yrs`
export const EXEC_MIGRATION_ROW = `${EXEC_EXPOSURE.migrationYears} yrs`

/**
 * Question count and time estimate for the /assess quick track — the one every
 * "Start — N questions, about M minutes" home-board CTA actually lands on
 * (executive's persona-recommended mode, and every explicit ?mode=quick link).
 * Single source with assessFlowModel.ts's own TRACK_INFO.quick, so a board CTA
 * can never quote a question count or duration the live flow doesn't match —
 * added 2026-08-23 after three boards independently guessed "8 questions" at
 * 6/10/11 minutes against a flow that is actually 6 questions, 3 minutes.
 */
export const ASSESS_QUICK_QUESTION_COUNT = TRACK_INFO.quick.count
export const ASSESS_QUICK_MINUTES = TRACK_INFO.quick.minutes

/**
 * Distinct REAL industries in the industry-landscape catalogue — re-exported
 * so a board claim like "22 sectors" can be tokenised against the same count
 * `getLandscapeIndustries()` returns everywhere else, rather than a literal
 * that silently goes stale when a sector is added or retired. Added
 * 2026-08-23 as the first fix driven by audit-role-board-literals.ts's
 * backfill run.
 *
 * Excludes `isCrossIndustry()` labels (2026-08-29): 'Cross-Industry' and its
 * 'Cross-Industry / X' sub-labels aren't sectors — they're the "applies to
 * every sector" bucket, split by topic only so the per-industry
 * learn_module_id consistency guard can give each topic its own honest
 * module. Counting them would inflate "22 sectors" to "25" the moment a
 * sub-label is added, overstating real sector coverage.
 */
export const INDUSTRY_LANDSCAPE_SECTOR_COUNT = getLandscapeIndustries().filter(
  (i) => !isCrossIndustry(i)
).length

/**
 * Mosca's inequality as a deadline: data that must stay secret for `x` years
 * against a threat arriving in `z`, via a migration taking `y` years, had to
 * BEGIN by `z - x - y`. Migration must be COMPLETE by `z - x`, because
 * anything encrypted after that date is still within its secrecy window when
 * the machine arrives.
 */
export const EXEC_MOSCA_START_BY_YEAR =
  CRQC.zEstimate - EXEC_EXPOSURE.secrecyYears - EXEC_EXPOSURE.migrationYears

/** The year migration had to be finished by — `z - x`. */
export const EXEC_MOSCA_COMPLETE_BY_YEAR = CRQC.zEstimate - EXEC_EXPOSURE.secrecyYears

/**
 * Declared reference year for "is that deadline behind us". Not `Date.now()`:
 * this string is baked into the generated board, so a clock-derived value
 * would change it daily and turn the drift gate permanently red. The unit test
 * in personaConfig.test.ts fails once this drifts a year behind the clock.
 */
export const EXEC_MOSCA_AS_OF_YEAR = 2026

const EXEC_MOSCA_YEARS_LATE = EXEC_MOSCA_AS_OF_YEAR - EXEC_MOSCA_START_BY_YEAR

/**
 * e.g. "Your start-by year was 2016 — you are ten years past it." Reads as a
 * plain future deadline when the year has not yet passed.
 */
export const EXEC_MOSCA_PUNCHLINE =
  EXEC_MOSCA_YEARS_LATE > 0
    ? `Your start-by year was ${EXEC_MOSCA_START_BY_YEAR} — you are ${toWordIfSmall(EXEC_MOSCA_YEARS_LATE)} years past it.`
    : `Start by ${EXEC_MOSCA_START_BY_YEAR} to keep ${EXEC_MOSCA_COMPLETE_BY_YEAR} data safe.`

/** Footnote describing the derivation, with the real source count. */
export const EXEC_MOSCA_FOOTNOTE = `Mosca's inequality: Z ${CRQC.zEstimate} − X ${EXEC_EXPOSURE.secrecyYears} yrs − Y ${EXEC_EXPOSURE.migrationYears} yrs = ${EXEC_MOSCA_START_BY_YEAR}. A ${EXEC_EXPOSURE.migrationYears}-year migration had to finish by ${EXEC_MOSCA_COMPLETE_BY_YEAR}, because ${EXEC_EXPOSURE.secrecyYears}-year secrets encrypted after that are still confidential when the machine arrives — finishing as it arrives protects nothing already sent. The ${CRQC.zEstimate} estimate is the median across ${CRQC_ESTIMATES.length} tracked sources; ${CRQC.qdayLow}–${CRQC.qdayHigh} is the consensus window, not a forecast.`

/**
 * ops sideCard's "150 ops/s · ~133× slower than ECDSA" — both figures already
 * exist as the HSM Capacity Calculator's own defaults (`CLASSICAL_HSM_DEFAULT.
 * opsPerSec`), the same numbers the calculator itself uses. There is no need
 * for a new constant here; this was mis-diagnosed as missing during planning
 * (a truncated grep hid the `opsPerSec` block further down the file) — it
 * exists, so this is a plain wiring fix like the byte-size rows above.
 */
export const OPS_SIDECARD_THROUGHPUT_ROW = `${CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']} ops/s · ~${Math.round(
  CLASSICAL_HSM_DEFAULT.opsPerSec['ecdsa-p256'] / CLASSICAL_HSM_DEFAULT.opsPerSec['ml-dsa-65']
)}× slower than ECDSA`

const OCSP_CRL_SIGNATURE_ONLY_KB = (ML_DSA_65.signatureOrCiphertextBytes / 1000).toFixed(1)
const OCSP_CRL_WITH_KEY_KB = Math.round(
  (ML_DSA_65.signatureOrCiphertextBytes + ML_DSA_65.publicKeyBytes) / 1000
)
export const OPS_SIDECARD_OCSP_ROW = `+${OCSP_CRL_SIGNATURE_ONLY_KB} KB · ~${OCSP_CRL_WITH_KEY_KB} KB with key`

/** HSM Capacity Calculator's real workflow count — "ten enterprise use cases". */
export const HSM_CAPACITY_USE_CASE_COUNT = USE_CASES.length

/** The CACP migration tab's real estate size — "seven-key business estate". */
export const MIGRATION_ESTATE_KEY_COUNT = MIGRATION_KEYS.length

/**
 * Combines a persona's featured artifacts across the given Fig 3 zones, in
 * zone order then within-zone config order. Board copy that names these
 * artifacts by hand (§3 Tier 2 of the remediation plan) reads this instead —
 * note this may reorder 1-2 items relative to the old hand-tuned sentence
 * flow (e.g. a trailing item moved earlier to match config order); the set of
 * artifacts named is what matters and stays exact.
 */
export function combinedArtifacts(personaId: PersonaId, zones: ZoneId[]): string[] {
  // eslint-disable-next-line security/detect-object-injection -- personaId is a PersonaId union, not user input
  const emphasis = BC_ZONE_EMPHASIS_BY_PERSONA[personaId]
  if (!emphasis) return []
  // Mapped through TYPE_LABELS (2026-08-02). This returned RAW IDS until then,
  // and the role-home board copy renders its result directly into prose — so
  // five of six roles read like "Governance zone featuring crypto-architecture,
  // raci-matrix, policy-draft, vendor-scorecard…". The label map was already
  // complete; it just lived inside a React component this data module could not
  // import, so it was never applied. Falls back to the id if one is ever
  // missing, which is still better than dropping the artifact silently.
  return zones.flatMap((zone) =>
    // eslint-disable-next-line security/detect-object-injection -- zone is a ZoneId union, not user input
    (emphasis.featuredArtifacts[zone] ?? []).map((id) => TYPE_LABELS[id] ?? id)
  )
}

/**
 * Short display names for report sections, used in board copy.
 *
 * Until 2026-08-02 this was a one-entry map (`hndlHnfl: 'HNDL'`) with an
 * `?? id` fallback, so every OTHER section rendered as its literal camelCase
 * identifier — "Your report opens migrationRoadmap, migrationToolkit and
 * algorithmMigration, and hides HNDL" was the shipped IT Ops copy, mapped and
 * unmapped in the same sentence. It now defers to `REPORT_SECTION_LABELS`, the
 * registry `/report` itself renders from (and which a test asserts is complete),
 * with this map kept only for the few places board copy wants something SHORTER
 * than the on-page heading.
 */
const REPORT_SECTION_SHORT_LABEL: Partial<Record<ReportSectionId, string>> = {
  hndlHnfl: 'HNDL',
}

export function reportSectionLabel(id: ReportSectionId): string {
  // eslint-disable-next-line security/detect-object-injection -- id is a ReportSectionId union, not user input
  return REPORT_SECTION_SHORT_LABEL[id] ?? REPORT_SECTION_LABELS[id] ?? id
}

export function reportSectionsByState(
  personaId: PersonaId,
  state: SectionState
): ReportSectionId[] {
  // eslint-disable-next-line security/detect-object-injection -- personaId is a PersonaId union, not user input
  const config = PERSONA_REPORT_CONFIG[personaId] ?? {}
  return (Object.entries(config) as [ReportSectionId, ReportSectionConfig][])
    .filter(([, cfg]) => cfg.state === state)
    .map(([id]) => id)
}

export const REPORT_SECTION_TOTAL_COUNT = Object.keys(REPORT_SECTION_DEFAULTS).length
export const DEVELOPER_REPORT_OVERRIDE_COUNT = Object.keys(PERSONA_REPORT_CONFIG.developer).length

/**
 * One real milestone label per distinct insertion point in a persona's path
 * (e.g. "Run Risk Assessment and Explore Business Tools" for executive, whose
 * milestones insert after 2 distinct checkpoints). Deliberately surfaces the
 * human-readable `label`, not the internal `afterPhase` checkpoint id
 * ("exec-cp-3") - that id means nothing to a site visitor; an earlier pass of
 * this fix made the id computed-instead-of-hardcoded but missed that it was
 * still the wrong thing to show at all.
 */
export function firstMilestoneLabelPerCheckpoint(personaId: PersonaId): string[] {
  const seen = new Set<string>()
  const labels: string[] = []
  // eslint-disable-next-line security/detect-object-injection -- personaId is a PersonaId union, not user input
  for (const m of PERSONA_MILESTONES[personaId]) {
    if (!seen.has(m.afterPhase)) {
      seen.add(m.afterPhase)
      labels.push(m.label)
    }
  }
  return labels
}

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
export function formatEssentialsVsFull(personaId: PersonaId): string {
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

/**
 * Role-home board content — GENERATED from src/data/role_board_content_*.csv
 * (2026-08-02 migration). Edit the CSV, not this import; regenerate with
 * `npm run generate:role-board-content`, wired into `npm run build`.
 *
 * The helper functions and constants above (toWordIfSmall, joinWithAnd,
 * combinedArtifacts, formatEssentialsVsFull, etc., plus the ML_DSA_65 /
 * OPS_SIDECARD / HSM_CAPACITY_USE_CASE_COUNT / MIGRATION_ESTATE_KEY_COUNT /
 * REPORT_SECTION_TOTAL_COUNT / DEVELOPER_REPORT_OVERRIDE_COUNT constants) are
 * NOT dead code even though nothing in the browser bundle calls them anymore
 * — `scripts/generate-role-board-content.ts` loads this file via Vite's SSR
 * module loader at BUILD time and calls them directly through
 * `scripts/lib/roleBoardTokens.ts`'s token registry. They must stay exported
 * for that pipeline to keep working; do not remove them as unused.
 */
export {
  PERSONA_JOURNEY_BOARD,
  PERSONA_JOURNEY_BOARD_VARIANTS,
} from './generated/roleBoardContent.generated'

import { PERSONA_JOURNEY_BOARD_VARIANTS as BOARD_VARIANTS } from './generated/roleBoardContent.generated'

/**
 * The board option to render for `personaId`, given a requested variant id
 * that may be stale, hand-typed, or absent.
 *
 * Falls back to the role's order-1 variant rather than throwing: the id can
 * arrive from a persisted store or a `?variant=` URL, neither of which stays
 * trustworthy once a variant is renamed or retired.
 *
 * Exported so PersonaBoardView and LandingView resolve this the SAME way.
 * They both need the answer — the board to draw, and whether the researcher's
 * live field-watch card belongs on it — and two copies of the fallback rule
 * would be free to disagree the moment one of them changed.
 */
export function resolveRoleBoardVariant(
  personaId: PersonaId,
  variantId: string | undefined
): RoleBoardVariant {
  // eslint-disable-next-line security/detect-object-injection -- personaId is the typed PersonaId union, not user input
  const variants = BOARD_VARIANTS[personaId]
  return variants.find((v) => v.id === variantId) ?? variants[0]
}

/**
 * The one researcher variant whose side card is the live field watch.
 *
 * `ResearcherFieldWatchCard` reports what changed in the library corpus, which
 * is the "trace every claim" option's subject — not the other two, which
 * carry their own authored side cards (the reproducibility surface, and the
 * CRQC consensus). Before this was scoped, the custom card replaced the side
 * card on ALL THREE researcher boards, silently discarding two of them.
 */
export const RESEARCHER_FIELD_WATCH_VARIANT_ID = 'provenance'

/* ──────────────────────────────────────────────────────────────────────────────
 * "How this hub adapts to you" — B+ remediation 1.1 / 1.2 / 1.3 (2026-08-10)
 *
 * Personalisation is the hub's largest mechanic and was, until this point,
 * entirely unexplained: choosing a role shrinks the navigation, and the shrink
 * was never stated at the moment of choosing. The reward for telling the hub
 * who you are read as "fewer doors".
 *
 * This block is the single source that says what a role changes. It is
 * DERIVED from the config above, never typed alongside it — the repo has
 * burned itself on typed conclusions drifting from their premises twice (see
 * the Mosca-window comment and `mlDsaSignatureBytes`). Three surfaces read it:
 * the About page's "How this hub adapts to you" section, the persona picker's
 * at-selection-time summary, and the rail's absence notices. If the config
 * changes, all three change with it and none of them can be stale.
 * ────────────────────────────────────────────────────────────────────────── */

export interface PersonaAdaptation {
  personaId: PersonaId
  /** Rail rows this role gets in FOR YOU, as human labels, in rail order. */
  focusLabels: string[]
  /** Reachable but demoted behind MORE / search, as human labels. */
  behindSearchLabels: string[]
  /** Routes deliberately not offered at all, with the reason and the alternative. */
  absences: (PersonaAbsence & { path: string; label: string })[]
  /** Report sections this role opens by default, as human labels. */
  reportOpenLabels: string[]
  /** Report sections this role does not get at all, as human labels. */
  reportHiddenLabels: string[]
  /** Compliance frameworks emphasised on the landscape grid. */
  emphasisedFrameworks: readonly string[]
  /** Where /algorithms lands this role on first paint. */
  algorithmsLanding: { tab: AlgorithmTabId; filterSummary: string }
  /** Which region the Timeline falls back to before the reader picks one. */
  timelineRegion: Region | 'All'
  /** The role's own four-tier progress ladder. */
  beltLadder: readonly string[] | null
  /** True when the sim's "practice this phase" prompt is deliberately never shown. */
  simPracticeSuppressed: boolean
}

/**
 * Everything a persona changes about the hub, computed from the config above.
 *
 * `researcher` is the deliberate special case throughout this file:
 * `PERSONA_NAV_PATHS.researcher` is `null` ("no gating at all"), which is
 * load-bearing in `ReportContent.tsx` and `GuidedTour.tsx`. Here that reads as
 * "every route is in focus, nothing is behind search, nothing is absent" —
 * which is exactly true and worth saying out loud on the picker.
 */
export function describePersonaAdaptation(personaId: PersonaId): PersonaAdaptation {
  // eslint-disable-next-line security/detect-object-injection -- typed PersonaId union, not user input
  const navPaths = PERSONA_NAV_PATHS[personaId]
  // eslint-disable-next-line security/detect-object-injection
  const absenceMap = PERSONA_ABSENT_PATHS[personaId] ?? {}
  const labelFor = (path: string): string =>
    // eslint-disable-next-line security/detect-object-injection -- keys come from this file's own config, not user input
    NAV_PATH_LABELS[path] ?? path

  const gateable = Object.keys(NAV_PATH_LABELS).filter(
    (p) => !ALWAYS_VISIBLE_PATHS.includes(p) && !RAIL_HIDDEN_PATHS.includes(p)
  )
  const focus = navPaths ?? gateable
  const behindSearch = gateable.filter((p) => !focus.includes(p) && !(p in absenceMap))

  // eslint-disable-next-line security/detect-object-injection
  const reportOverrides = PERSONA_REPORT_CONFIG[personaId]
  const reportOpen: string[] = []
  const reportHidden: string[] = []
  for (const id of Object.keys(REPORT_SECTION_DEFAULTS) as ReportSectionId[]) {
    const state = getReportSectionConfig(personaId, id).state
    if (state === 'open') reportOpen.push(reportSectionLabel(id))
    if (state === 'hidden') reportHidden.push(reportSectionLabel(id))
  }
  void reportOverrides

  const algo = getAlgorithmDefaults(personaId)
  const filterValues = Object.values(algo.filters).filter(Boolean)

  return {
    personaId,
    focusLabels: focus.map(labelFor),
    behindSearchLabels: behindSearch.map(labelFor),
    absences: Object.entries(absenceMap).map(([path, absence]) => ({
      ...absence,
      path,
      label: labelFor(path),
    })),
    reportOpenLabels: reportOpen,
    reportHiddenLabels: reportHidden,
    // eslint-disable-next-line security/detect-object-injection
    emphasisedFrameworks: PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS[personaId] ?? [],
    algorithmsLanding: {
      tab: algo.tab,
      filterSummary: filterValues.length > 0 ? filterValues.join(' · ') : 'no preset filter',
    },
    // eslint-disable-next-line security/detect-object-injection
    timelineRegion: PERSONA_TIMELINE_REGION[personaId],
    // eslint-disable-next-line security/detect-object-injection
    beltLadder: PERSONA_BELT_TIER_LABELS[personaId] ?? null,
    simPracticeSuppressed: PERSONA_SIM_PRACTICE_NONE.includes(personaId),
  }
}

/**
 * The one-line version of the above, for the persona picker — the sentence the
 * review asked for at selection time: what gets emphasised AND what leaves the
 * rail. Deliberately names the loss; "a silent downgrade is the worst kind of
 * downgrade", and saying it converts a confusing loss into an understood trade.
 */
export function personaTradeSentence(personaId: PersonaId): string {
  const a = describePersonaAdaptation(personaId)
  const focus = a.focusLabels.slice(0, 3)
  const focusPart =
    focus.length > 0
      ? `Your rail leads with ${joinWithAnd(focus)}`
      : 'Your rail keeps every page in view'
  const movedCount = a.behindSearchLabels.length
  const movedPart =
    movedCount > 0
      ? `${toWordIfSmall(movedCount)} other ${movedCount === 1 ? 'page moves' : 'pages move'} behind More and search`
      : 'nothing is moved out of reach'
  const absencePart =
    a.absences.length > 0
      ? `; ${joinWithAnd(a.absences.map((x) => x.label))} ${a.absences.length === 1 ? 'is' : 'are'} not offered for this role, and the rail says why`
      : ''
  return `${focusPart} · ${movedPart}${absencePart}.`
}
