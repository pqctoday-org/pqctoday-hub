// SPDX-License-Identifier: GPL-3.0-only
import { ROUTE_VIEW_TYPE, ROUTE_PAGE_ID, pageIdForNestedRoute } from '@/data/routePageMeta'
import type { ViewType } from '@/data/authoritativeSourcesData'
import type { PageId } from '@/data/userManualData'
import { FAQ_DATA } from '@/components/FAQ/faqData'

const FAQ_QUESTION_COUNT = FAQ_DATA.reduce((sum, cat) => sum + cat.items.length, 0)

export type MobilePageActionId =
  | 'assistant'
  | 'journey'
  | 'faq'
  | 'sources'
  | 'glossary'
  | 'whatsNew'
  | 'about'

export interface MobilePageAction {
  id: MobilePageActionId
  label: string
  sub: string
}

export interface MobilePageActionsResult {
  actions: MobilePageAction[]
  /** Only present when Sources is in `actions`. */
  sourcesViewType: ViewType | undefined
}

/**
 * The mobile shell's single ⋯ sheet selector — composes the same real gates
 * the desktop top bar uses (ROUTE_VIEW_TYPE for Sources, ROUTE_PAGE_ID /
 * pageIdForNestedRoute for Guide) so a route that doesn't register a source
 * on desktop (e.g. /compliance, per ux-standard.md P10's MUST NOT) doesn't
 * register one on mobile either. Assistant, Journey, FAQ and What's new have
 * no route gate — they're always available, matching the handoff.
 *
 * Guide isn't included here: the handoff promotes it into the header itself
 * (one of the 4 icon buttons next to ⋯), not the ⋯ sheet — see MobileHeader.
 * This selector still exposes `pageIdForRoute` isn't needed by callers
 * outside MobileHeader, so it's computed there directly from the same
 * exported table rather than duplicated here.
 *
 * About ('/about') is appended last, always available — real bug found
 * 2026-08-23 (Phase 7, About screen): the legacy mobile "More" sheet in
 * MainLayout.tsx explicitly appends '/about' (its own comment cites an
 * identical bug found there on 2026-08-07 — "no reachable nav entry point
 * on mobile at all"), but that sheet only renders for `!isMobileShell`. The
 * new shell's own nav data (mobileNavGroups.ts, the bottom bar's Workflow/
 * Practice/Reference tabs) never carried '/about' over, so isMobileShell
 * readers had zero path to it despite MobileAboutView.tsx existing. Mirrors
 * desktop rail nav (railNav.ts RAIL_ALWAYS_VISIBLE_PATHS), which self-places
 * '/about' as its own always-visible last row for the same reason.
 */
export function getMobilePageActions(pathname: string): MobilePageActionsResult {
  const viewType = ROUTE_VIEW_TYPE[pathname]
  const actions: MobilePageAction[] = [
    { id: 'assistant', label: 'Assistant', sub: 'Ask a question about this page' },
    { id: 'journey', label: 'Journey', sub: 'Your recent activity, in order' },
    {
      id: 'faq',
      label: 'FAQ',
      sub: `${FAQ_QUESTION_COUNT} real questions, including "is this advice?"`,
    },
  ]
  if (viewType) {
    actions.push({ id: 'sources', label: 'Sources', sub: "Where this page's data comes from" })
  }
  actions.push({ id: 'glossary', label: 'Glossary', sub: 'Search PQC terms' })
  actions.push({ id: 'whatsNew', label: "What's new", sub: 'Recent changes to this site' })
  actions.push({ id: 'about', label: 'About', sub: 'Vision, trust, data & open source' })
  return { actions, sourcesViewType: viewType }
}

/** Guide's own gate — exact-path table, falling back to the nested-route
 *  prefix table (e.g. every /learn/<module> shares '/learn's page id). */
export function pageIdForMobileRoute(pathname: string): PageId | undefined {
  return ROUTE_PAGE_ID[pathname] ?? pageIdForNestedRoute(pathname)
}
