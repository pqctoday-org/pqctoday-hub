// SPDX-License-Identifier: AGPL-3.0-only
// The role picker tells each role which pages "are left out of your menus,
// and search still finds them" (personaTradeSentence). This checks that
// claim against what the desktop rail and the phone's group menus actually
// list, so the sentence cannot drift from the menus again (it miscounted
// Business Tools, which the menus always show, until 2026-11-14).
import { describe, it, expect } from 'vitest'
import { PERSONA_IDS } from '@/data/learningPersonas'
import {
  describePersonaAdaptation,
  personaTradeSentence,
  NAV_PATH_LABELS,
} from '@/data/personaConfig'
import {
  computeGroupDisplayPaths,
  getForYouGroups,
  getRailSections,
  RAIL_ALWAYS_VISIBLE_PATHS,
} from './railNav'
import { mobileGroupDisplayPaths } from '../Mobile/shell/mobileNavGroups'

const pathForLabel = new Map(Object.entries(NAV_PATH_LABELS).map(([path, label]) => [label, path]))

describe.each(PERSONA_IDS.filter((p) => p !== 'researcher'))('%s', (persona) => {
  const { forYou } = getRailSections(persona)
  const groups = getForYouGroups(forYou)
  const desktop = new Set([
    ...RAIL_ALWAYS_VISIBLE_PATHS,
    ...forYou,
    ...groups.flatMap((g) => computeGroupDisplayPaths(g, forYou)),
  ])
  const phone = new Set(groups.flatMap((g) => mobileGroupDisplayPaths(g, forYou)))
  const leftOut = describePersonaAdaptation(persona).behindSearchLabels.map(
    (label) => pathForLabel.get(label) ?? label
  )

  it('every page the sentence says is left out is missing from both menus', () => {
    expect(leftOut.filter((p) => desktop.has(p))).toEqual([])
    expect(leftOut.filter((p) => phone.has(p))).toEqual([])
  })

  it('the sentence names search, not a More section the rail does not have', () => {
    const sentence = personaTradeSentence(persona)
    expect(sentence).not.toMatch(/More/)
    if (leftOut.length > 0) expect(sentence).toMatch(/search still finds/)
  })
})
