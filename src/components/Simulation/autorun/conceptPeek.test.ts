// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { conceptBody } from './SimConceptPeek'
import { EXEC_TOUR_CONCEPTS, EXEC_TOUR_OPENING_CONCEPTS, EXEC_TOUR_STAGES } from './execTourConfig'
import { executiveSummaryForPhase } from './execTourConfig'

describe('walkthrough concept peeks', () => {
  it('does not attribute the bank case to a different sector', () => {
    for (const stage of EXEC_TOUR_STAGES) {
      expect(executiveSummaryForPhase(stage.phase, 'healthcare')).not.toMatch(/\bbank\b/i)
    }
    expect(executiveSummaryForPhase('p1', 'financial')).toContain('fictional bank')
  })
  it('every configured concept resolves to a non-empty body (GUIDED_DEFS keys align)', () => {
    for (const c of Object.values(EXEC_TOUR_CONCEPTS)) {
      const body = conceptBody(c)
      expect(body.length, `concept '${c.id}' resolved to an empty body`).toBeGreaterThan(0)
    }
  })

  it('every referenced concept id exists in EXEC_TOUR_CONCEPTS', () => {
    const referenced = [
      ...EXEC_TOUR_OPENING_CONCEPTS,
      ...EXEC_TOUR_STAGES.flatMap((s) => s.conceptCards ?? []),
    ]
    for (const id of referenced) {
      expect(EXEC_TOUR_CONCEPTS[id], `concept '${id}' missing from EXEC_TOUR_CONCEPTS`).toBeTruthy()
    }
  })
})
