// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A Learn track is a topic grouping, never a persona (GRC journey audit, 15 Oct
 * 2026). Six GRC Essentials used to carry an "EXECUTIVE" badge because the
 * governance track was named after one persona; GRC readers saw another role's
 * name on their own path. This keeps track names and persona names apart.
 */
import { describe, it, expect } from 'vitest'
import { MODULE_TRACKS } from './moduleData'
import { PERSONAS } from '@/data/learningPersonas'

describe('Learn track names', () => {
  it('no track is named after a persona', () => {
    // Short form = the part before " / " ("Executive / Business Leader" → "Executive").
    const personaNames = new Set(
      Object.values(PERSONAS).flatMap((p) => [p.label, p.label.split(' / ')[0]])
    )
    for (const { track } of MODULE_TRACKS) {
      expect(personaNames.has(track), `track "${track}" is a persona name`).toBe(false)
    }
  })
})
