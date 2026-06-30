// SPDX-License-Identifier: GPL-3.0-only
/**
 * One-time notice for users whose assessment country gained its own sim archetype
 * in the Phase 3 consolidation (CA/EU/JP/KR/SG/IN previously resolved to a nearby
 * archetype; they now resolve to their own). The banner shows once, then stores a
 * version stamp in localStorage so it never reappears even after page refresh.
 */
import { useState, useCallback } from 'react'
import { ARCHETYPE_CHANGED_COUNTRIES } from '@/simulation/assessBridge'

const STORAGE_KEY = 'pqctoday.archetypeSchemaVersion'
const CURRENT_VERSION = 2

function readStoredVersion(): number {
  try {
    return parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10) || 0
  } catch {
    return CURRENT_VERSION // SSR / storage blocked — treat as seen
  }
}

function markSeen(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(CURRENT_VERSION))
  } catch {
    // storage blocked — silently ignore
  }
}

/**
 * Returns `{ shouldShow, dismiss }` for the one-time archetype-change notice.
 * `shouldShow` is true when:
 *   - the user has a completed assessment for one of the affected countries, AND
 *   - they haven't dismissed the notice yet (localStorage version < CURRENT_VERSION)
 */
export function useArchetypeChangeNotice(country: string | undefined): {
  shouldShow: boolean
  dismiss: () => void
} {
  const [dismissed, setDismissed] = useState(() => readStoredVersion() >= CURRENT_VERSION)

  const dismiss = useCallback(() => {
    markSeen()
    setDismissed(true)
  }, [])

  const shouldShow = !dismissed && !!country && ARCHETYPE_CHANGED_COUNTRIES.has(country)

  return { shouldShow, dismiss }
}
