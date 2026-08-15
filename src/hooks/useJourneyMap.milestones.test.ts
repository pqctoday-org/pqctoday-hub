// SPDX-License-Identifier: GPL-3.0-only
/**
 * Coverage guard for getMilestoneStatus.
 *
 * The 2026-08-15 journey-tracking audit found four milestone routes
 * (/business, /playground/openssl-studio, /timeline, /threats) configured in
 * PERSONA_MILESTONES with no matching case in getMilestoneStatus's switch —
 * they silently fell to the unconditional `default: return 'available'`, so
 * five of the six personas could never reach 100% Journey Progress no matter
 * what the user did. Nothing anywhere asserted that every configured
 * milestone route actually has a way to complete.
 *
 * This collects every distinct route across all six personas'
 * PERSONA_MILESTONES and asserts each one's status can move off its
 * "nothing done yet" baseline when every relevant input is maxed out — the
 * signature of a route that's actually wired to a signal, versus one that's
 * quietly falling through to `default`.
 *
 * EXEMPT routes must cite a reason. An uncited exemption is exactly how the
 * four original gaps went unnoticed.
 */
import { describe, it, expect } from 'vitest'
import { getMilestoneStatus, type MilestoneStatusInputs } from './useJourneyMap'
import { PERSONA_MILESTONES } from '@/data/personaConfig'

const HIGH: MilestoneStatusInputs = {
  assessmentStatus: 'complete',
  myFrameworkCount: 5,
  migrationStarted: true,
  artifactCount: 5,
  execDocCount: 5,
  opensslFileCount: 5,
}

const LOW: MilestoneStatusInputs = {
  assessmentStatus: 'not-started',
  myFrameworkCount: 0,
  migrationStarted: false,
  artifactCount: 0,
  execDocCount: 0,
  opensslFileCount: 0,
}

// Every exemption here must say why, and the "why" must be a real, current
// reason — not just "not implemented yet" with no plan to revisit.
const EXEMPT: Record<string, string> = {
  '/algorithms':
    'browse-only by design — useJourneyMap.ts getMilestoneStatus, case "/algorithms": "no completion signal for browsing"',
  '/timeline':
    'deferred 2026-08-15 — the only available signal (bookmarking a country) was judged too narrow an opt-in action to call "completed"; see journey-tracking-remediation-plan-v2-08152026.md §2.1. Revisit when a better signal exists — do not treat as permanent.',
  '/threats':
    'deferred 2026-08-15 — same reasoning as /timeline (bookmarking a threat); see plan §2.2. Revisit when a better signal exists — do not treat as permanent.',
}

function allMilestoneRoutes(): string[] {
  const routes = new Set<string>()
  for (const milestones of Object.values(PERSONA_MILESTONES)) {
    for (const m of milestones) routes.add(m.route)
  }
  return [...routes]
}

describe('getMilestoneStatus — coverage guard', () => {
  const routes = allMilestoneRoutes().filter((r) => !(r in EXEMPT))

  it.each(routes)('status for %s can move off its baseline', (route) => {
    const low = getMilestoneStatus(route, LOW)
    const high = getMilestoneStatus(route, HIGH)
    expect(high).not.toBe(low)
  })

  it.each(Object.entries(EXEMPT))('%s is exempt for a cited reason: %s', (route) => {
    // Just documents the exemption exists and is reachable — the reason
    // itself is read by a human, not asserted on.
    expect(getMilestoneStatus(route, LOW)).toBe('available')
  })

  it('every configured milestone route is either covered or exempt', () => {
    const covered = new Set(routes)
    const exempt = new Set(Object.keys(EXEMPT))
    for (const route of allMilestoneRoutes()) {
      expect(covered.has(route) || exempt.has(route)).toBe(true)
    }
  })
})
