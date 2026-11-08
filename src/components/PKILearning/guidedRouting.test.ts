// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { FRAMEWORK_PHASES, PHASE_ORDER } from '@/data/frameworkPhases'
import { ROUTE_META } from '@/seo/routeMeta'
import { MODULE_CATALOG } from './moduleData'
import {
  CROSSWALK_FRAMEWORKS,
  START_BRANCHES,
  crosswalkRows,
  phaseHeading,
  routingSourceNote,
} from './guidedRouting'

describe('guided routing — the six "Where do I start?" statements', () => {
  it('has six statements with distinct ids and wording', () => {
    expect(START_BRANCHES).toHaveLength(6)
    expect(new Set(START_BRANCHES.map((b) => b.id)).size).toBe(6)
    expect(new Set(START_BRANCHES.map((b) => b.question)).size).toBe(6)
  })

  // New guard: before this, a renamed module or page left a statement pointing at nothing,
  // and the first anyone knew was a reader landing on the not-found page.
  it.each(START_BRANCHES.map((b) => [b.id, b.to] as const))(
    '%s: its target %s is a real module or a known page',
    (_id, to) => {
      const moduleId = /^\/learn\/([^/?#]+)$/.exec(to)?.[1]
      if (moduleId) {
        expect(MODULE_CATALOG[moduleId], `${to} is a module id`).toBeDefined()
      } else {
        expect(Object.hasOwn(ROUTE_META, to), `${to} is a known page`).toBe(true)
      }
    }
  )

  it.each(START_BRANCHES.map((b) => [b.id, b.phase] as const))(
    '%s: its phase %s exists in the framework model',
    (_id, phase) => {
      expect(PHASE_ORDER).toContain(phase)
      expect(FRAMEWORK_PHASES[phase]).toBeDefined()
    }
  )

  it('every button label names a place the target actually is', () => {
    for (const b of START_BRANCHES) {
      expect(b.cta).toMatch(/^(Start|Open): \S/)
      if (b.to.startsWith('/learn/')) {
        const title = MODULE_CATALOG[b.to.slice('/learn/'.length)]?.title
        expect(title, `${b.to} has a catalogue title`).toBeTruthy()
      }
    }
  })
})

describe('guided routing — the crosswalk', () => {
  it('lists the four frameworks, each with text, for every phase a statement enters', () => {
    for (const b of START_BRANCHES) {
      const rows = crosswalkRows(b.phase)
      expect(rows.map((r) => r.label)).toEqual(CROSSWALK_FRAMEWORKS.map((f) => f.label))
      for (const row of rows)
        expect(row.text.trim().length, `${b.phase} ${row.label}`).toBeGreaterThan(0)
    }
  })

  it('returns no rows for an unknown phase instead of throwing', () => {
    expect(crosswalkRows('nope' as never)).toEqual([])
  })

  it('names the phase: numbered, and a dash for the unnumbered Foundations phase', () => {
    expect(phaseHeading('p3')).toBe(`Phase 3: ${FRAMEWORK_PHASES.p3.name}`)
    expect(phaseHeading('foundations')).toBe(`Phase —: ${FRAMEWORK_PHASES.foundations.name}`)
  })

  it('states the phase count it derives from the model', () => {
    expect(routingSourceNote()).toContain(`App. G (${PHASE_ORDER.length} phases)`)
  })
})
