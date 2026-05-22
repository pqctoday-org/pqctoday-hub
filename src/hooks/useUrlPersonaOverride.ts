// SPDX-License-Identifier: GPL-3.0-only
import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { usePersonaStore } from '@/store/usePersonaStore'
import { logPersonaSelected } from '@/utils/analytics'
import type { PersonaId } from '@/data/learningPersonas'

const VALID_PERSONAS: readonly PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'researcher',
  'ops',
  'curious',
]

function isPersonaId(value: string | null): value is PersonaId {
  return value !== null && (VALID_PERSONAS as readonly string[]).includes(value)
}

/**
 * Reads `?persona=<id>` from the URL on mount. If the value is a valid PersonaId,
 * sets it as the active persona and strips the param from the URL so reloads /
 * deep-shares don't re-trigger the override. Invalid values are ignored.
 *
 * Deep-link entry point for the Business + Curious UX plan (CC-11).
 */
export function useUrlPersonaOverride() {
  const [searchParams, setSearchParams] = useSearchParams()
  const setPersona = usePersonaStore((s) => s.setPersona)

  useEffect(() => {
    const raw = searchParams.get('persona')
    if (!raw) return

    if (isPersonaId(raw)) {
      setPersona(raw)
      logPersonaSelected(raw, 'switch')
    }

    // Strip the param either way — invalid values shouldn't linger in the URL.
    const next = new URLSearchParams(searchParams)
    next.delete('persona')
    setSearchParams(next, { replace: true })
    // We intentionally depend only on the first searchParams snapshot; subsequent
    // history navigations are handled by the effect re-running.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
