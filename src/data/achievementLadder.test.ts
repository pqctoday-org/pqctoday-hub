// SPDX-License-Identifier: GPL-3.0-only
/**
 * The rebuild's whole promise is that the board a role sees and the badges a
 * role can be given are THE SAME LIST. Before this, the grid hid rungs the
 * checker happily awarded, so an executive could be granted a badge the board
 * in front of them said did not exist.
 */
import { describe, it, expect } from 'vitest'
import { ACHIEVEMENT_CATALOG, personaLadder, personaLadderFor } from './achievementCatalog'
import { PERSONA_EXCLUDED_ACHIEVEMENTS } from './personaConfig'
import { PERSONAS, type PersonaId } from './learningPersonas'

const PERSONA_IDS = Object.keys(PERSONAS) as PersonaId[]

describe('persona achievement ladder', () => {
  it.each(PERSONA_IDS)('%s: the ladder excludes exactly what the decision says', (id) => {
    const excluded = PERSONA_EXCLUDED_ACHIEVEMENTS[id]
    const ladder = personaLadder(id, excluded)
    const ids = new Set(ladder.map((a) => a.id))
    for (const gone of excluded) expect(ids.has(gone)).toBe(false)
    expect(ladder.length).toBe(ACHIEVEMENT_CATALOG.length - excluded.length)
  })

  it.each(PERSONA_IDS)('%s: every role has a ladder worth climbing', (id) => {
    // A role whose ladder collapsed to a handful of rungs would be the same
    // demotivating scoreboard in a smaller box.
    const ladder = personaLadder(id, PERSONA_EXCLUDED_ACHIEVEMENTS[id])
    expect(ladder.length).toBeGreaterThan(ACHIEVEMENT_CATALOG.length * 0.7)
  })

  it('never deletes a badge somebody already earned under another role', () => {
    // Roles are switchable and progress is real. Retroactively removing a badge
    // because the reader changed hats would be a worse bug than the one this
    // rebuild fixes.
    const excluded = PERSONA_EXCLUDED_ACHIEVEMENTS.executive
    const alreadyEarned = new Set([excluded[0]])
    const shown = personaLadderFor('executive', excluded, alreadyEarned)
    expect(shown.some((a) => a.id === excluded[0])).toBe(true)
  })

  it('shows the whole catalog when no role is chosen', () => {
    expect(personaLadder(null).length).toBe(ACHIEVEMENT_CATALOG.length)
    expect(personaLadderFor(null, [], new Set()).length).toBe(ACHIEVEMENT_CATALOG.length)
  })

  it('every excluded id names a real achievement', () => {
    const catalogIds = new Set(ACHIEVEMENT_CATALOG.map((a) => a.id))
    for (const id of PERSONA_IDS) {
      for (const excludedId of PERSONA_EXCLUDED_ACHIEVEMENTS[id]) {
        expect(catalogIds.has(excludedId), `${id} excludes unknown "${excludedId}"`).toBe(true)
      }
    }
  })
})
