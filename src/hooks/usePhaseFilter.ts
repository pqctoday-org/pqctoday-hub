// SPDX-License-Identifier: GPL-3.0-only
/**
 * `usePhaseFilter` — read the `?phase=<id>` query param and expose a matcher so
 * any page can narrow its phase-tagged items to the active phase.
 *
 * Part of the Migration-Program phase overlay (Option C, see
 * `reports/framework-gap/PHASE-OVERLAY-SPEC.md` §4.1, §5). The param is the same
 * additive filter pattern as `?zone=`: with no `?phase=` (or an invalid value),
 * `activePhase` is `null` and `matches()` returns `true` for everything, so the
 * default, unfiltered page behaviour is unchanged.
 */
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type PhaseId, PHASE_ORDER } from '../data/frameworkPhases'

const PHASE_SET = new Set<PhaseId>(PHASE_ORDER)

const isPhaseId = (value: string | null): value is PhaseId =>
  value !== null && PHASE_SET.has(value as PhaseId)

export interface PhaseFilter {
  /** The validated `?phase=` value, or `null` when absent/invalid. */
  activePhase: PhaseId | null
  /**
   * `true` when an item tagged with `tag` (a single phase or a list of phases)
   * should be shown under the current filter. Always `true` while no phase is
   * active, so untagged/default rendering is preserved.
   */
  matches: (tag: PhaseId | PhaseId[]) => boolean
}

export function usePhaseFilter(): PhaseFilter {
  const [searchParams] = useSearchParams()
  const raw = searchParams.get('phase')

  return useMemo<PhaseFilter>(() => {
    const activePhase = isPhaseId(raw) ? raw : null

    const matches = (tag: PhaseId | PhaseId[]): boolean => {
      if (activePhase === null) return true
      return Array.isArray(tag) ? tag.includes(activePhase) : tag === activePhase
    }

    return { activePhase, matches }
  }, [raw])
}
