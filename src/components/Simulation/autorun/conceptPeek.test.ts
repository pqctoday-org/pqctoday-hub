// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { conceptBody } from './SimConceptPeek'
import { EXEC_TOUR_CONCEPTS, EXEC_TOUR_OPENING_CONCEPTS, EXEC_TOUR_STAGES } from './execTourConfig'

describe('walkthrough concept peeks', () => {
  it('every configured concept resolves to a non-empty body (GUIDED_DEFS keys align)', () => {
    for (const c of Object.values(EXEC_TOUR_CONCEPTS)) {
      const body = conceptBody(c)
      expect(body.length, `concept '${c.id}' resolved to an empty body`).toBeGreaterThan(0)
    }
  })

  it('every referenced concept id exists in EXEC_TOUR_CONCEPTS', () => {
    const referenced = [
      ...EXEC_TOUR_OPENING_CONCEPTS,
      ...EXEC_TOUR_STAGES.map((s) => s.conceptCard).filter((x): x is NonNullable<typeof x> => !!x),
    ]
    for (const id of referenced) {
      expect(EXEC_TOUR_CONCEPTS[id], `concept '${id}' missing from EXEC_TOUR_CONCEPTS`).toBeTruthy()
    }
  })
})
