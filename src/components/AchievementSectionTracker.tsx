// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useLocation } from 'react-router'
import { useAchievementStore } from '@/store/useAchievementStore'

const SECTION_MAP: Record<string, string> = {
  '/timeline': 'timeline',
  '/algorithms': 'algorithms',
  '/playground': 'playground',
  '/openssl': 'openssl',
  '/threats': 'threats',
  '/library': 'library',
  '/leaders': 'leaders',
  '/compliance': 'compliance',
  '/migrate': 'migrate',
  '/assess': 'assess',
  '/report': 'report',
  '/business': 'business',
  '/simulation': 'simulation',
  '/explore': 'explore',
  '/patents': 'patents',
  '/navigate': 'navigate',
  '/revisions': 'revisions',
  '/about': 'about',
  // '/' is deliberately excluded — every session hits it, so counting it would
  // hand out the Explorer/Full Journey achievements for free rather than for
  // exploring. '/embed/...' is also deliberately untracked — embed is a
  // distinct product surface with its own persistence layer
  // (useEmbedPersistence), not part of the gamified journey (2026-08-15).
}

/** Nested routes that belong to their parent section. Explicit, not a generic
 *  first-segment rule — only sections whose children genuinely are that
 *  section (mirrors MainLayout.tsx's ROUTE_PAGE_ID + NESTED_ROUTE_PAGE_ID
 *  pattern). A new nested route added here needs a matching case in
 *  AchievementSectionTracker.coverage.test.tsx — nothing enforces that link
 *  automatically; see the test file's own header comment. */
const SECTION_PREFIXES: ReadonlyArray<readonly [string, string]> = [
  ['/learn', 'learn'],
  ['/playground/', 'playground'],
  ['/business/', 'business'],
]

/** Reverse of SECTION_MAP: section key → a representative route for it.
 *  Derived, not a fourth hand-maintained list — for the sections that map
 *  many routes to one key (learn, business via SECTION_PREFIXES) this only
 *  recovers the one exact-match route, which is enough for a single
 *  "you visited X" link. Used by useJourneyMap's off-path section. */
export const SECTION_TO_ROUTE: Record<string, string> = Object.fromEntries(
  Object.entries(SECTION_MAP).map(([route, section]) => [section, route])
)

function resolveSection(pathname: string): string | null {
  // eslint-disable-next-line security/detect-object-injection
  const exact = SECTION_MAP[pathname]
  if (exact) return exact
  for (const [prefix, section] of SECTION_PREFIXES) {
    if (pathname.startsWith(prefix)) return section
  }
  return null
}

export function AchievementSectionTracker() {
  const { pathname } = useLocation()
  const recordSectionVisit = useAchievementStore((s) => s.recordSectionVisit)

  useEffect(() => {
    const section = resolveSection(pathname)
    if (section) {
      recordSectionVisit(section)
    }
  }, [pathname, recordSectionVisit])

  return null
}
