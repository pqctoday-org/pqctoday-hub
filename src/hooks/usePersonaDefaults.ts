// SPDX-License-Identifier: GPL-3.0-only
/**
 * usePersonaDefaults — URL-state primitives for the "persona-aware default
 * filter" pattern used across /library, /migrate, /threats, /timeline,
 * /assess, and /playground.
 *
 * Three concerns this hook handles:
 *
 *   1. Reading whether the user has opted out of persona defaults via the
 *      `?prefs=off` URL param. Pages combine this with their own preferred-
 *      set logic (e.g. PERSONA_LIBRARY_CATEGORIES, PERSONA_MIGRATE_LAYERS)
 *      to decide if persona narrowing is currently active.
 *
 *   2. Providing a `resetToFullSet()` callback that writes `?prefs=off`
 *      into the URL so the opt-out is shareable / bookmarkable.
 *
 *   3. Auto-stripping `?prefs=off` when the persona changes — switching
 *      persona means asking for a new set of defaults, so a lingering
 *      opt-out is no longer the user's intent.
 *
 * See `<PersonaDefaultsBanner>` for the matching UI surface.
 */
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePersonaStore } from '@/store/usePersonaStore'

export interface UsePersonaDefaultsResult {
  /** True when the user has opted out of persona defaults via `?prefs=off`.
   *  Pages should treat persona narrowing as inactive when this is true. */
  prefsOff: boolean
  /** Write `?prefs=off` into the URL. Use as the onClick for the
   *  "See all N" reset link in `<PersonaDefaultsBanner>`. */
  resetToFullSet: () => void
  /** Strip `?prefs=off` from the URL. Called internally when persona
   *  changes; exposed for pages that need to clear it explicitly. */
  reapplyDefaults: () => void
}

export function usePersonaDefaults(): UsePersonaDefaultsResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const prefsOff = searchParams.get('prefs') === 'off'

  const resetToFullSet = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set('prefs', 'off')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  const reapplyDefaults = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.delete('prefs')
        return next
      },
      { replace: true }
    )
  }, [setSearchParams])

  // On persona change, strip a lingering `?prefs=off` so the new persona's
  // defaults apply. The user just told us their role changed; the prior
  // opt-out is stale.
  useEffect(() => {
    if (prefsOff) {
      reapplyDefaults()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPersona])

  return { prefsOff, resetToFullSet, reapplyDefaults }
}
