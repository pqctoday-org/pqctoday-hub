// SPDX-License-Identifier: GPL-3.0-only
/**
 * personaLensRegistry — one entry per routed surface, declaring HOW that
 * surface adapts to the reader's role, or stating plainly that it does not.
 *
 * WHY THIS EXISTS. The B+ remediation programme's finding, restated: the hub's
 * largest mechanic is that it reshapes itself around a declared role, and there
 * was no single place that said which surfaces actually do that. The result was
 * a landscape where "this page ignores your role" and "this page's role support
 * quietly broke" looked identical from the outside, and where a deliberate
 * absence (ops without Patents) was indistinguishable from a bug.
 *
 * This registry makes both visible and, via `scripts/audit-persona-lens.ts`,
 * enforceable. The audit fails the build when:
 *
 *   1. a route declared in `App.tsx` has no entry here;
 *   2. an entry's `configKeys` name an export that does not exist in
 *      `personaConfig.ts` (or the named sibling data file);
 *   3. an entry excludes a persona, or declares `deliberately-none`, without an
 *      `onScreenNotice` naming the component that says so on screen;
 *   4. a role-board CTA or journey milestone targets a rail-hidden route other
 *      than that route's declared canonical door.
 *
 * Rule 3 is the important one. It is the machine-checkable form of the
 * programme's second grading principle — *a deliberate absence must be visible
 * where it takes effect* — and it is what stops a future gating decision from
 * being recorded only in a code comment again.
 */

export type LensKind =
  /** Adapts via named keys in personaConfig (or a declared sibling data file). */
  | 'per-persona-config'
  /** Adapts via a persona branch inside the view itself. */
  | 'per-persona-view'
  /** Deliberately identical for every role. Requires an on-screen notice. */
  | 'deliberately-none'

export interface PersonaLensEntry {
  lens: LensKind
  /**
   * Exported symbol names in `personaConfig.ts` — or in the file named by
   * `configModule` — that drive this surface's lens. Verified to exist.
   */
  configKeys?: string[]
  /** Non-default module for `configKeys`, repo-relative. */
  configModule?: string
  /**
   * REQUIRED when a persona is excluded from this route, or when `lens` is
   * `deliberately-none`: the component that renders the on-screen statement.
   * Repo-relative path, verified to exist.
   */
  onScreenNotice?: string
  /**
   * For rail-hidden routes: the single front door that IS offered. Board CTAs
   * and milestones must target this, not the bare route.
   */
  canonicalDoor?: string
  /** Why, in one line. Read by humans, not the audit. */
  note?: string
}

export const PERSONA_LENS_REGISTRY: Record<string, PersonaLensEntry> = {
  '/': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_RECOMMENDED_PATHS', 'resolveRoleBoardVariant', 'PERSONA_MILESTONES'],
    note: 'Role boards are the whole surface — six roles, distinct copy, generated from CSV.',
  },
  '/explore': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_RECOMMENDED_PATHS'],
    note: 'Tiles sort by the role’s recommended path; the full grid stays below.',
  },
  '/learn': {
    lens: 'per-persona-config',
    configKeys: ['MODULE_INDUSTRY_RELEVANCE', 'PERSONA_SIM_PRACTICE_PHASES'],
  },
  '/timeline': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_TIMELINE_REGION', 'REGION_COUNTRIES_MAP'],
    note: 'Stored region wins; the per-role constant is only the fallback before one is picked.',
  },
  '/algorithms': {
    lens: 'per-persona-config',
    configKeys: ['ALGORITHM_PERSONA_DEFAULTS', 'getAlgorithmDefaults'],
  },
  '/library': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_LIBRARY_CATEGORIES'],
  },
  '/migrate': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_MIGRATE_LAYERS'],
  },
  '/compliance': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS', 'isComplianceFrameworkEmphasized'],
  },
  '/threats': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_THREATS_DEFAULT_INDUSTRIES', 'INDUSTRY_TO_THREATS_MAP'],
    note: 'Persona default applies only when the reader has picked no industry.',
  },
  '/assess': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_RECOMMENDED_MODE'],
  },
  '/report': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_REPORT_CONFIG', 'getReportSectionConfig', 'PERSONA_REPORT_CTAS'],
  },
  '/business': {
    lens: 'per-persona-config',
    configKeys: ['BC_ZONE_EMPHASIS_BY_PERSONA', 'getBusinessCenterZoneEmphasis'],
    // curious is excluded from /business — the notice is the rail affordance.
    onScreenNotice: 'src/components/Layout/MainLayout.tsx',
  },
  '/playground': {
    lens: 'per-persona-view',
    configKeys: ['PERSONA_MARKED_NAV_PATHS'],
    onScreenNotice: 'src/components/common/SimplifiedViewNotice.tsx',
    note: 'Curious gets a labelled simplified build; executive’s row is dashed with a legend.',
  },
  '/openssl': {
    lens: 'deliberately-none',
    onScreenNotice: 'src/components/Layout/railNav.ts',
    canonicalDoor: '/playground/openssl-studio',
    note: 'Rail-hidden. One tool, one door — the Playground card PT-023.',
  },
  '/simulation': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_SIM_PRACTICE_PHASES', 'PERSONA_SIM_PRACTICE_NONE'],
    onScreenNotice: 'src/data/personaConfig.ts',
    note: 'Researcher/curious are deliberately never prompted — recorded in PERSONA_SIM_PRACTICE_NONE.',
  },
  '/leaders': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_LEADER_GUIDANCE'],
    configModule: 'src/components/Leaders/leadersConstants.ts',
    // developer is excluded from /leaders on the rail.
    onScreenNotice: 'src/components/Layout/MainLayout.tsx',
  },
  '/patents': {
    lens: 'per-persona-view',
    configKeys: ['ALGORITHM_PERSONA_DEFAULTS'],
    // ops and curious are both excluded.
    onScreenNotice: 'src/components/Layout/MainLayout.tsx',
  },
  '/changelog': {
    lens: 'per-persona-view',
    onScreenNotice: 'src/components/Changelog/ChangelogView.tsx',
    note: 'The "For me" filter states its tagged-vs-guessed split; curious gets a framing line.',
  },
  '/navigate': {
    lens: 'deliberately-none',
    onScreenNotice: 'src/components/Layout/railNav.ts',
    note: 'The whole-hub graph is derived live from real data, not persona-filtered; every persona gets the same unconditional rail entry (PERSONA_NAV_PATHS).',
  },
  '/revisions': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_REVISION_DOMAINS'],
  },
  '/about': {
    lens: 'per-persona-view',
    configKeys: ['describePersonaAdaptation', 'personaTradeSentence'],
    note: 'The personalization section is itself the explanation of every other lens.',
  },
  '/faq': {
    lens: 'per-persona-config',
    configKeys: ['PERSONA_FAQ_LEAD', 'personaLeadItems'],
    configModule: 'src/components/FAQ/faqData.ts',
  },
  '/terms': {
    lens: 'deliberately-none',
    onScreenNotice: 'src/components/Layout/MainLayout.tsx',
    note: 'Legal text is identical for everyone by design; reachable from the global footer.',
  },
  '/editorial-independence': {
    lens: 'deliberately-none',
    onScreenNotice: 'src/components/Layout/MainLayout.tsx',
    note: 'The trust argument must read the same for every reader — that is the point of it.',
  },
  '/sponsor': {
    lens: 'deliberately-none',
    onScreenNotice: 'src/components/Sponsor/SponsorView.tsx',
    note: 'Segmented by sponsor AUDIENCE (vendor/foundation/individual), not by reader role.',
  },
  '/embed': {
    lens: 'per-persona-config',
    configKeys: ['INDUSTRY_SLUG_TO_LABEL'],
    note: 'Embedded readers seed from the host’s industry slug; newcomers default to curious.',
  },
}
