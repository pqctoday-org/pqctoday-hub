// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { LEARN_MODULES } from '@/data/generated/learnModules.generated'
import { NICE_COMPETENCY_AREAS } from '@/data/niceFramework'
import {
  facetChips,
  lessonHasFacets,
  NO_FACETS,
  parseFacets,
  resolveArea,
  resolveStage,
} from './learnFacets'

describe('the Learn address facets ?stage= and ?area=', () => {
  it('reads a stage the catalogue has and ignores the rest', () => {
    expect(resolveStage('3')).toBe(3)
    for (const bad of ['0', '9', 'x', '', '03', null, undefined])
      expect(resolveStage(bad)).toBeNull()
  })

  it('reads a NICE area the Hub defines and ignores the rest', () => {
    expect(resolveArea('CA-CRYPTO')).toBe('CA-CRYPTO')
    for (const bad of ['CA-NOPE', 'toString', '', null]) expect(resolveArea(bad)).toBeNull()
  })

  it('filters lessons by stage, by area and by both', () => {
    const stage3 = LEARN_MODULES.filter((m) => m.stage === 3).map((m) => m.id)
    expect(stage3.length).toBeGreaterThan(0)
    for (const id of stage3) expect(lessonHasFacets(id, { stage: 3, area: null })).toBe(true)
    const other = LEARN_MODULES.find((m) => m.stage !== undefined && m.stage !== 3)
    expect(lessonHasFacets(other!.id, { stage: 3, area: null })).toBe(false)
    for (const area of Object.keys(
      NICE_COMPETENCY_AREAS
    ) as (keyof typeof NICE_COMPETENCY_AREAS)[]) {
      const names = LEARN_MODULES.filter((m) => m.niceCompetencyAreas.includes(area))
      for (const m of names) expect(lessonHasFacets(m.id, { stage: null, area })).toBe(true)
    }
    expect(lessonHasFacets('no-such-lesson', { stage: 1, area: null })).toBe(false)
    expect(lessonHasFacets('no-such-lesson', NO_FACETS)).toBe(true)
  })

  it('names an active facet in words, never a NICE code', () => {
    const f = parseFacets(new URLSearchParams('stage=2&area=CA-RISK'))
    const labels = facetChips(f).map((c) => c.label)
    expect(labels).toEqual([
      'Stage 2: Core concepts',
      `NICE area: ${NICE_COMPETENCY_AREAS['CA-RISK'].title}`,
    ])
    expect(labels.join(' ')).not.toMatch(/CA-/)
    expect(facetChips(NO_FACETS)).toEqual([])
  })
})
