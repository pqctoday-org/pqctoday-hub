// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure, testable logic behind the two-axis rail (persona-journeys A-grade
 * redesign, 2026-08-01). MainLayout.tsx renders from this; this file owns no
 * JSX so its coverage invariant can be unit-tested without mounting the DOM.
 */
import {
  AlertTriangle,
  ArrowRightLeft,
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
  RAIL_HIDDEN_PATHS,
  NAV_PATH_LABELS,
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
 * selection). `null` and `researcher` (whose PERSONA_NAV_PATHS is `null`,
 * meaning "show everything, no gating") both yield an empty FOR YOU — the rail
 * shows a collapsed "FOR YOU" header with nothing under it and the full nav
 * universe sits in MORE, which is the correct behavior for "no gating at all",
 * not a bug.
 *
 * The union `forYou ∪ more ∪ RAIL_ALWAYS_VISIBLE_PATHS ∪ RAIL_HIDDEN_PATHS`
 * always equals every key in NAV_PATH_LABELS — see railNav.test.ts.
 */
export function getRailSections(persona: PersonaId | null): RailSections {
  // eslint-disable-next-line security/detect-object-injection
  const allowed = persona ? PERSONA_NAV_PATHS[persona] : null
  const forYou = (allowed ?? []).filter((path) => !RAIL_HIDDEN_PATHS.includes(path))
  const more = Object.keys(NAV_PATH_LABELS).filter(
    (path) =>
      !RAIL_ALWAYS_VISIBLE_PATHS.includes(path) &&
      !RAIL_HIDDEN_PATHS.includes(path) &&
      !forYou.includes(path)
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
