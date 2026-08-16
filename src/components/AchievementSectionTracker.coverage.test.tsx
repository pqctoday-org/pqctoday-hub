// SPDX-License-Identifier: GPL-3.0-only
/**
 * Coverage guard for AchievementSectionTracker's route → section resolution.
 *
 * The 2026-08-15 journey-tracking audit found four real routes (/explore,
 * /patents, /business/tools, /revisions) recording no section at all —
 * SECTION_MAP had drifted piecemeal since gamification launch (1095c51d9),
 * with completeness checked exactly once, pointwise, for /simulation (see
 * AchievementSectionTracker.local.test.tsx's own header comment). This test
 * asserts the property that pointwise fix should have been generalized into:
 * EVERY route in NAV_PATH_LABELS (the same universe railNav.test.ts already
 * treats as authoritative for rail coverage) resolves to a tracked section,
 * except a small, cited exempt list.
 *
 * Known residual limit: the nested-route cases below are still a
 * hand-maintained list, same as SECTION_PREFIXES itself in the source file —
 * this test cannot fully close that gap without a central route manifest,
 * which doesn't exist today. A newly added nested route (a new
 * /playground/<tool> or /business/tools/<tool>) needs a matching case added
 * here by hand; nothing forces that link automatically.
 */
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { NAV_PATH_LABELS } from '@/data/personaConfig'
import { AchievementSectionTracker } from './AchievementSectionTracker'
import { useAchievementStore } from '@/store/useAchievementStore'

// '/' is the only NAV_PATH_LABELS entry deliberately excluded from
// SECTION_MAP — see the comment beside it there.
const EXEMPT = new Set<string>(['/'])

function visitedSection(path: string): string | undefined {
  useAchievementStore.setState({ sectionsVisited: [] })
  render(
    <MemoryRouter initialEntries={[path]}>
      <AchievementSectionTracker />
    </MemoryRouter>
  )
  return useAchievementStore.getState().sectionsVisited[0]
}

describe('AchievementSectionTracker — coverage guard', () => {
  const universe = Object.keys(NAV_PATH_LABELS).filter((p) => !EXEMPT.has(p))

  it.each(universe)('records a section for %s', (path) => {
    expect(visitedSection(path)).toBeTruthy()
  })

  it.each([
    '/playground/cacp',
    '/playground/hsm',
    '/playground/docker',
    '/playground/openssl-studio',
    '/business/tools/roi-calculator',
    '/learn/pqc-101',
  ])('records a section for nested route %s', (path) => {
    expect(visitedSection(path)).toBeTruthy()
  })

  it('does not record a section for the untracked home route', () => {
    expect(visitedSection('/')).toBeUndefined()
  })
})
