// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The six-module matrix (design note section 11, P4): six modules that span the stages and roles,
 * for every persona, with and without an objective that holds the module. The module page's three
 * decisions (step bar, other-role lens, "View as") are checked against an independent reading of
 * the persona's role path.
 */
import { describe, expect, it } from 'vitest'
import { PERSONA_IDS } from '@/data/personaIds'
import { moduleContext, personaWhoseRoleHolds } from './moduleContext'
import { allOnPath, rolePathForPersona } from './rolePaths'
import { lessonById } from './lessons'
import { MATRIX_MODULES, makeObjective } from './fixtures'

describe('the six modules exist in the learning order', () => {
  it.each(MATRIX_MODULES.map((m) => [m] as const))('%s', (id) => {
    expect(lessonById(id)).toBeDefined()
  })
})

describe('six-module matrix: every persona, every module', () => {
  for (const persona of PERSONA_IDS) {
    for (const moduleId of MATRIX_MODULES) {
      const tag = lessonById(moduleId)!.lmId
      const path = rolePathForPersona(persona)!
      const onPath = allOnPath(path).some((l) => l.lmId === tag)

      it(`${persona} · ${moduleId}: lens ${onPath ? 'off' : 'on'}, no step bar without an objective`, () => {
        const ctx = moduleContext({ moduleId, persona, focused: null })
        expect(ctx.tag).toBe(tag)
        expect(ctx.onRolePath).toBe(onPath)
        expect(ctx.lens).toBe(!onPath)
        expect(ctx.step).toBeNull()
        if (ctx.lens) {
          // "View as" names another persona whose own path holds the module, or nobody
          if (ctx.viewAs) {
            expect(ctx.viewAs).not.toBe(persona)
            expect(allOnPath(rolePathForPersona(ctx.viewAs)!).some((l) => l.lmId === tag)).toBe(
              true
            )
          } else {
            for (const other of PERSONA_IDS) {
              if (other !== persona) {
                expect(allOnPath(rolePathForPersona(other)!).some((l) => l.lmId === tag)).toBe(
                  false
                )
              }
            }
          }
        } else {
          expect(ctx.viewAs).toBeNull()
        }
      })

      it(`${persona} · ${moduleId}: a step of the objective in focus shows the step bar and never the lens`, () => {
        const objective = makeObjective({
          role: persona,
          steps: [
            {
              id: 'sx',
              position: 1,
              kind: 'module',
              resourceTag: tag,
              required: true,
              origin: { type: 'match' },
            },
          ],
        })
        const ctx = moduleContext({ moduleId, persona, focused: objective })
        expect(ctx.step?.id).toBe('sx')
        expect(ctx.lens).toBe(false)
        expect(ctx.viewAs).toBeNull()
      })
    }
  }

  it('shows no lens without a role, whatever the module', () => {
    for (const moduleId of MATRIX_MODULES) {
      const ctx = moduleContext({ moduleId, persona: null, focused: null })
      expect(ctx.lens).toBe(false)
      expect(ctx.onRolePath).toBe(false)
    }
  })

  it('has a page that is not a lesson (the quiz) with no tag, no lens and no step', () => {
    const ctx = moduleContext({ moduleId: 'quiz', persona: 'architect', focused: makeObjective() })
    expect(ctx).toMatchObject({ tag: null, step: null, lens: false, viewAs: null })
  })

  it('finds the persona whose role holds a lesson, in the Learn page order, skipping the learner', () => {
    const tag = lessonById('exec-quantum-impact')!.lmId
    const first = personaWhoseRoleHolds(tag, null)
    expect(first).not.toBeNull()
    expect(personaWhoseRoleHolds(tag, first)).not.toBe(first)
  })
})
