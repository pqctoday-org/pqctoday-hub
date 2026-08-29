// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure, testable logic behind the two-axis rail (persona-journeys A-grade
 * redesign, 2026-08-01). MainLayout.tsx renders from this; this file owns no
 * JSX so its coverage invariant can be unit-tested without mounting the DOM.
 */
import {
  AlertTriangle,
  ArrowRightLeft,
  Atom,
  BookOpen,
  ClipboardCheck,
  Compass,
  FileBarChart,
  FlaskConical,
  Gamepad2,
  Globe,
  GraduationCap,
  History,
  Home,
  Info,
  LayoutDashboard,
  ScrollText,
  Shield,
  ShieldCheck,
  Users,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import type { PersonaId } from '@/data/learningPersonas'
import {
  PERSONA_NAV_PATHS,
  PERSONA_MARKED_NAV_PATHS,
  PERSONA_ABSENT_PATHS,
  RAIL_HIDDEN_PATHS,
  NAV_PATH_LABELS,
  type PersonaAbsence,
} from '@/data/personaConfig'

/**
 * The 5 pages treated as globally-implicit chrome — always reachable, never
 * rendered as a FOR YOU/MORE rail row for any persona. Deliberately narrower
 * than personaConfig's own `ALWAYS_VISIBLE_PATHS` (which also carries
 * '/simulation', '/changelog', '/faq', '/terms' for unrelated gating/footer
 * purposes) — '/simulation' specifically MUST render as its own rail row
 * (featured for executive, marked for developer/architect/ops, plain for
 * curious), so it cannot be lumped in with the truly-implicit five here.
 */
export const RAIL_ALWAYS_VISIBLE_PATHS = ['/', '/learn', '/timeline', '/threats', '/about']

export interface RailSections {
  /** Paths for the current persona's FOR YOU section, in PERSONA_NAV_PATHS' own order. */
  forYou: string[]
  /** Everything else in NAV_PATH_LABELS, minus the always-visible five and RAIL_HIDDEN_PATHS. */
  more: string[]
}

/**
 * Computes the FOR YOU / MORE rail sections for a persona (or `null` for no
 * selection).
 *
 * `researcher` is a deliberate special case (2026-08-02). Its
 * `PERSONA_NAV_PATHS` entry is `null`, meaning "no gating — sees everything",
 * and that `null` is load-bearing well outside the rail: `ReportContent.tsx`
 * (`personaPaths === null` → every report section visible) and `GuidedTour.tsx`
 * (`null` → no slide filtering) both branch on it. So we do NOT give researcher
 * a PERSONA_NAV_PATHS array — that would silently gate its report sections and
 * tour slides.
 *
 * What we DO fix here is the rail's *presentation*. Previously an empty FOR YOU
 * dropped researcher into the flat "Everything, unfiltered" + MORE fallback —
 * the same layout a brand-new visitor with no persona gets. Those two cases are
 * genuinely different: no-persona means "we know nothing about you yet", while
 * researcher is an explicit choice that deserves the same grouped
 * Workflow/Practice/Reference rail every other persona gets. So researcher's
 * FOR YOU is the full nav universe, ordered by NAV_PATH_LABELS, and
 * `getForYouGroups` buckets it exactly as it does for everyone else.
 *
 * `null` (no persona yet) keeps the flat fallback — unchanged.
 *
 * The union `forYou ∪ more ∪ RAIL_ALWAYS_VISIBLE_PATHS ∪ RAIL_HIDDEN_PATHS ∪
 * PERSONA_ABSENT_PATHS[persona]` always equals every key in NAV_PATH_LABELS —
 * see railNav.test.ts. The last term is what keeps the coverage invariant true
 * while still letting a route render no row at all for a given role.
 */
// Paths MainLayout places itself, outside the FOR YOU group mechanism:
// '/' renders at the very top of the rail and '/about' as the very last row;
// '/learn', '/timeline' and '/threats' are appended to the Reference group
// and '/business/tools' to Practice, both unconditionally and by path
// literal (see MainLayout's `displayPaths`). Including any of them in
// researcher's FOR YOU would render them TWICE — once from group.paths and
// once from that render-only append.
// '/revisions' is excluded for the same reason it was dropped from every
// persona's PERSONA_NAV_PATHS on 2026-08-01 ("remove more and revisions from
// the left bar"). Researcher takes the whole nav universe, so without this it
// would silently reappear inside the Reference group — invisible today only
// because Reference is collapsed by default, which is not a guarantee.
//
// Hoisted to module scope (2026-08-23, mobile UX layer) so
// `getUngatedGroupablePaths` below can reuse it without duplicating the
// list — purely a refactor, `getRailSections`'s own behavior is unchanged.
export const RAIL_SELF_PLACED_PATHS = [
  '/',
  '/about',
  '/learn',
  '/timeline',
  '/threats',
  '/business/tools',
  '/revisions',
]

/**
 * Every path `getForYouGroups` can meaningfully bucket, with no persona
 * gating applied — the same "whole nav universe" computation
 * `getRailSections` already does for researcher, generalized. Needed because
 * `getForYouGroups(forYou)` returns an empty array for `forYou: null` (no
 * persona selected) — the desktop rail's no-persona state shows a flat
 * "Everything, unfiltered" list instead of grouped tiles, but the mobile
 * shell's Workflow/Practice/Reference tabs are fixed UI slots that need
 * *something* to show even with no persona chosen yet. This keeps that
 * "everything, unfiltered" behavior consistent rather than inventing a
 * second, ungated taxonomy.
 */
export function getUngatedGroupablePaths(): string[] {
  return Object.keys(NAV_PATH_LABELS).filter(
    (path) => !RAIL_SELF_PLACED_PATHS.includes(path) && !RAIL_HIDDEN_PATHS.includes(path)
  )
}

export function getRailSections(persona: PersonaId | null): RailSections {
  // eslint-disable-next-line security/detect-object-injection
  const allowed = persona ? PERSONA_NAV_PATHS[persona] : null
  const researcherSeesAll = persona === 'researcher' ? getUngatedGroupablePaths() : null
  const forYou = (researcherSeesAll ?? allowed ?? []).filter(
    (path) => !RAIL_HIDDEN_PATHS.includes(path)
  )
  // B+ remediation 1.3 (2026-08-10): a path with a PERSONA_ABSENT_PATHS entry
  // leaves MORE as well as FOR YOU. That is what distinguishes an absence from
  // a demotion — a demoted path is still a MORE row one click away and needs no
  // explanation, whereas an absence renders no row at all and is replaced by
  // the "not offered for your role — why" notice in its group footer. Without
  // this filter the notice and a live row for the same path would both render,
  // which reads as a bug rather than a decision.
  // eslint-disable-next-line security/detect-object-injection
  const absent = persona ? PERSONA_ABSENT_PATHS[persona] : undefined
  const more = Object.keys(NAV_PATH_LABELS).filter(
    (path) =>
      !RAIL_ALWAYS_VISIBLE_PATHS.includes(path) &&
      !RAIL_HIDDEN_PATHS.includes(path) &&
      !forYou.includes(path) &&
      !(absent && path in absent)
  )
  return { forYou, more }
}

export type RailRowTreatment = 'featured' | 'marked' | 'active' | 'plain'

/**
 * Which visual treatment a FOR YOU rail row gets. `isActive` only matters for
 * the default case — a "marked" row stays dashed even while active, and
 * executive's '/simulation' row stays "featured" (green) regardless, per the
 * persona-journeys A-grade spec (§3.1 special cases).
 */
export function getRowTreatment(
  persona: PersonaId | null,
  path: string,
  isActive: boolean
): RailRowTreatment {
  if (persona === 'executive' && path === '/simulation') return 'featured'
  // eslint-disable-next-line security/detect-object-injection
  if (persona && PERSONA_MARKED_NAV_PATHS[persona]?.includes(path)) return 'marked'
  return isActive ? 'active' : 'plain'
}

/** Icon per rail-eligible path. Deliberately excludes '/openssl' (RAIL_HIDDEN_PATHS —
 * never rendered as a row for any persona) and '/faq'/'/changelog'/'/terms' (not in
 * NAV_PATH_LABELS — reached via footer/FAQButton instead, not the rail). */
export const RAIL_ICON_MAP: Record<string, LucideIcon> = {
  '/': Home,
  '/simulation': Gamepad2,
  '/explore': Compass,
  '/learn': GraduationCap,
  '/timeline': Globe,
  '/algorithms': Shield,
  '/migrate': ArrowRightLeft,
  '/compliance': ShieldCheck,
  '/assess': ClipboardCheck,
  '/report': FileBarChart,
  '/business': LayoutDashboard,
  '/business/tools': Wrench,
  '/playground': FlaskConical,
  '/threats': AlertTriangle,
  '/library': BookOpen,
  '/leaders': Users,
  '/patents': ScrollText,
  '/navigate': Atom,
  '/revisions': History,
  '/about': Info,
}

/**
 * Rail declutter follow-up (2026-08-01, post-launch user review: "too
 * cluttered... collapsible [sections] and better organization"). Screenshots
 * of the live rail showed the actual wall-of-rows problem is FOR YOU itself
 * for 5 of 6 personas (11-12 flat rows) — only `researcher`/no-persona put
 * the bulk in MORE (empty FOR YOU, full universe in MORE). Chunking FOR YOU
 * into a few calmer visual clusters addresses both cases with one taxonomy,
 * rather than special-casing researcher.
 *
 * One FIXED grouping definition shared by every persona (not a bespoke
 * per-persona taxonomy) — deliberately simple:
 *  - `workflow`  — the actual migration-governance work (assess risk, read
 *    the report, plan the migration, track compliance, the command center).
 *  - `practice`  — hands-on/interactive surfaces (simulation, playground,
 *    explore).
 *  - `reference` — standing reference & community material (algorithms,
 *    library, community, patents, revisions).
 */
export type ForYouGroupId = 'workflow' | 'practice' | 'reference'

export const FOR_YOU_GROUP_LABELS: Record<ForYouGroupId, string> = {
  workflow: 'Workflow',
  practice: 'Practice',
  reference: 'Reference',
}

/**
 * One line saying what each rail group means — B+ remediation 1.3
 * (2026-08-10). "Workflow, Practice and Reference are the hub's vocabulary,
 * not the reader's, and nothing on screen says what they mean." Rendered as
 * the group header's `title` and as sub-text when the group is expanded, so
 * the rail stops being something to decode.
 */
export const FOR_YOU_GROUP_BLURBS: Record<ForYouGroupId | 'other', string> = {
  workflow: 'The migration work itself — assess, plan, prove.',
  practice: 'Hands-on surfaces where you run the thing rather than read about it.',
  reference: 'Standing material to look something up in.',
  other: 'Everything else your role reaches from here.',
}

/**
 * The absences to render in a given group's footer, bucketed by the same fixed
 * path→group map the rows use — so "Patents is not offered for your role"
 * appears under Reference, where the row would have been, and not floating at
 * the bottom of the rail. Absences whose path has no group mapping fall into
 * the trailing catch-all, mirroring `getForYouGroups`.
 */
export function getGroupAbsences(
  persona: PersonaId | null,
  groupId: ForYouGroupId | 'other'
): (PersonaAbsence & { path: string; label: string })[] {
  if (!persona) return []
  // eslint-disable-next-line security/detect-object-injection
  const absences = PERSONA_ABSENT_PATHS[persona] ?? {}
  return Object.entries(absences)
    .filter(([path]) => {
      // eslint-disable-next-line security/detect-object-injection
      const mapped = FOR_YOU_PATH_GROUP[path]
      return groupId === 'other' ? mapped === undefined : mapped === groupId
    })
    .map(([path, absence]) => ({
      ...absence,
      path,
      // eslint-disable-next-line security/detect-object-injection
      label: NAV_PATH_LABELS[path] ?? path,
    }))
}

/** Fixed path → group assignment. Deliberately a `Partial` — any path absent
 * here (there are none among today's 13 gateable paths, but a future addition
 * to NAV_PATH_LABELS could land before this map is updated) still renders,
 * just bucketed into a trailing "More for you" catch-all by
 * `getForYouGroups` below, so a missed mapping can never silently drop a row. */
const FOR_YOU_PATH_GROUP: Partial<Record<string, ForYouGroupId>> = {
  '/assess': 'workflow',
  '/report': 'workflow',
  '/migrate': 'workflow',
  '/compliance': 'workflow',
  '/business': 'workflow',
  '/simulation': 'practice',
  '/playground': 'practice',
  '/explore': 'practice',
  '/algorithms': 'reference',
  '/library': 'reference',
  '/leaders': 'reference',
  '/patents': 'reference',
  '/navigate': 'reference',
  '/revisions': 'reference',
}

const FOR_YOU_GROUP_ORDER: ForYouGroupId[] = ['workflow', 'practice', 'reference']

export interface ForYouGroup {
  id: ForYouGroupId | 'other'
  label: string
  paths: string[]
}

/**
 * Partitions a persona's FOR YOU rows into fixed, ordered visual groups
 * (Workflow → Practice → Reference → an "Other" catch-all for anything
 * unmapped), preserving each path's original relative order within its
 * group. Purely a rendering aid — the union of every returned group's
 * `paths`, in some order, always equals `forYou` exactly (see
 * railNav.test.ts's "groups partition FOR YOU" coverage); this never changes
 * reachability, just how FOR YOU rows are visually chunked. Groups with zero
 * matching rows for this persona are omitted so e.g. curious (no '/business')
 * doesn't render an empty "Workflow" header.
 */
export function getForYouGroups(forYou: string[]): ForYouGroup[] {
  const groups: ForYouGroup[] = FOR_YOU_GROUP_ORDER.map((id) => ({
    id,
    // eslint-disable-next-line security/detect-object-injection -- id is drawn from the typed FOR_YOU_GROUP_ORDER literal union, not user input
    label: FOR_YOU_GROUP_LABELS[id],
    // eslint-disable-next-line security/detect-object-injection
    paths: forYou.filter((path) => FOR_YOU_PATH_GROUP[path] === id),
  }))
  const grouped = new Set(groups.flatMap((g) => g.paths))
  const other = forYou.filter((path) => !grouped.has(path))
  if (other.length > 0) groups.push({ id: 'other', label: 'More for you', paths: other })
  return groups.filter((g) => g.paths.length > 0)
}

// Workflow's visual display order (2026-08-01 follow-up: "reorder workflow:
// migrate; assess; report; command center", then 2026-08-02: "compliance
// should be first ... before migrate") — independent of PERSONA_NAV_PATHS'
// own array order. '/explore' no longer belongs here (2026-08-23: "explore
// should be after learn and not into workflow", reversing the 2026-08-01
// "Explore goes first in workflow section" call) — it's now promoted to
// RAIL_ALWAYS_VISIBLE_PATHS and renders as its own row/tab directly under
// Learn instead, on both the desktop rail and the mobile shell. Anything not
// in this list keeps its original relative order, appended after the
// prioritized ones. '/explore' moved back into Workflow, first slot
// (2026-08-23 follow-up: "move back explore into workflow for both mobile ux
// and full page ux" — reversing the same day's earlier "explore after learn"
// promotion). Still classified 'practice' in FOR_YOU_PATH_GROUP above; this
// is purely a rendering reassignment, not a reachability change.
const WORKFLOW_DISPLAY_ORDER = [
  '/explore',
  '/compliance',
  '/migrate',
  '/assess',
  '/report',
  '/business',
]

// Practice's visual display order (2026-08-28: "reorder practice left bar -
// playground - business tools - simulation") — independent of each persona's
// own PERSONA_NAV_PATHS array order, which previously put Simulation before
// Playground for some personas and after for others. Same fixed-order /
// append-the-rest pattern as WORKFLOW_DISPLAY_ORDER above.
const PRACTICE_DISPLAY_ORDER = ['/playground', '/business/tools', '/simulation']

// Reference's visual display order (2026-08-28: "reorder reference left bar -
// threats - library - algorithms - timeline - community - patents") —
// independent of FOR_YOU_PATH_GROUP's declaration order and of '/timeline'/
// '/threats' previously being appended unconditionally at the end. Same
// fixed-order / append-the-rest pattern as WORKFLOW_DISPLAY_ORDER above.
const REFERENCE_DISPLAY_ORDER = [
  '/threats',
  '/library',
  '/algorithms',
  '/timeline',
  '/leaders',
  '/patents',
  '/navigate',
]

/**
 * The real display-position adjustments MainLayout's desktop rail applies on
 * top of getForYouGroups' plain FOR_YOU_PATH_GROUP bucketing — reordering
 * Workflow (including pulling '/explore' into its first slot) per
 * WORKFLOW_DISPLAY_ORDER, adding '/business/tools' to Practice (reached via
 * an in-page tab bar before 2026-08-01, now a real rail row, never added to
 * FOR_YOU_PATH_GROUP itself) and fixing Practice's order per
 * PRACTICE_DISPLAY_ORDER, and adding '/timeline'/'/threats' to Reference
 * (RAIL_ALWAYS_VISIBLE_PATHS, never persona-gated) and fixing Reference's
 * order per REFERENCE_DISPLAY_ORDER. Pure-moved out of MainLayout.tsx's inline JSX
 * (2026-08-23) so the mobile Practice/Workflow/Reference group panels use
 * this exact same real logic instead of the raw, unadjusted group.paths —
 * confirmed via a real usage report that mobile's Practice panel was missing
 * Business Tools entirely because of that gap.
 */
export function computeGroupDisplayPaths(
  group: Pick<ForYouGroup, 'id' | 'paths'>,
  forYou: string[]
): string[] {
  if (group.id === 'workflow') {
    return [
      ...WORKFLOW_DISPLAY_ORDER.filter(
        (p) => group.paths.includes(p) || (p === '/explore' && forYou.includes(p))
      ),
      ...group.paths.filter((p) => !WORKFLOW_DISPLAY_ORDER.includes(p)),
    ]
  }
  if (group.id === 'practice') {
    const candidates = [...group.paths.filter((p) => p !== '/explore'), '/business/tools']
    return [
      ...PRACTICE_DISPLAY_ORDER.filter((p) => candidates.includes(p)),
      ...candidates.filter((p) => !PRACTICE_DISPLAY_ORDER.includes(p)),
    ]
  }
  if (group.id === 'reference') {
    const candidates = [...group.paths, '/timeline', '/threats']
    return [
      ...REFERENCE_DISPLAY_ORDER.filter((p) => candidates.includes(p)),
      ...candidates.filter((p) => !REFERENCE_DISPLAY_ORDER.includes(p)),
    ]
  }
  return group.paths
}

/**
 * Curated small set of paths kept as top-level icons in the MOBILE nav row
 * (below `lg`), independent of FOR YOU/MORE classification — this is the
 * already-tuned overflow fix from the 2026-08-01 remediation (see MainLayout's
 * inline comment history): with 8 always-visible items the 390px row had
 * nothing reachable without scrolling. Everything NOT in this set folds into
 * the mobile "More" bottom sheet instead, grouped by FOR YOU/MORE.
 */
export function getMobileVisiblePaths(persona: PersonaId | null): string[] {
  const base = ['/', '/simulation', '/learn', '/timeline', '/migrate', '/assess']
  const extra: string[] = []
  if (persona === 'curious') extra.push('/explore')
  if (persona === 'executive' || persona === 'architect') extra.push('/business')
  return [...base, ...extra]
}
