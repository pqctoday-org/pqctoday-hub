// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The summary the site assistant reads must describe the routes the module
 * actually offers: two learn paths with their own durations, section counts,
 * exercise and workshop-step counts, not one route of a different length.
 */
import { describe, it, expect } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import manifest from './manifest'

const WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine']
const ORDINALS = [
  '',
  'first',
  'second',
  'third',
  'fourth',
  'fifth',
  'sixth',
  'seventh',
  'eighth',
  'ninth',
]

const overview = ragSummary.split('## Key Concepts')[0]
const paths = manifest.learnPaths ?? []
const foundations = paths.find((p) => p.id === 'fhe-foundations')!
const advanced = paths.find((p) => p.id === 'hsm-custody')!

const workshopStepsOn = (pathId: string) =>
  (manifest.workshopSteps ?? []).filter((s) => !s.paths || s.paths.includes(pathId)).length

describe('Homomorphic Encryption summary describes the real routes', () => {
  it('states the duration of each learn path from the manifest', () => {
    for (const p of paths) {
      const minutes = parseInt(p.duration ?? '', 10)
      expect(Number.isFinite(minutes)).toBe(true)
      expect(overview).toContain(`about ${minutes} minutes`)
    }
  })

  it('does not describe the module as one route of another length', () => {
    expect(paths).toHaveLength(2)
    expect(overview).not.toMatch(/one\s+~?\d+-minute route/i)
    expect(overview).not.toContain('~45-minute')
  })

  it('counts the learn sections of the foundations route and the one the advanced route adds', () => {
    expect(overview).toContain(`${WORDS[foundations.sections.length]} learn sections`)
    const added = advanced.sections.filter((s) => !foundations.sections.includes(s))
    expect(added).toEqual(['fhe-hsm-custody'])
    // The added HSM custody section is the last section of the advanced route, after the implementations.
    expect(advanced.sections[advanced.sections.length - 1]).toBe('fhe-hsm-custody')
    expect(advanced.sections[advanced.sections.length - 2]).toBe('fhe-implementations')
    expect(overview).toContain(
      `adds a ${ORDINALS[advanced.sections.length]} learn section after the open-source implementations`
    )
  })

  it('counts the workshop steps on each route', () => {
    expect(overview).toContain(`${WORDS[workshopStepsOn(foundations.id)]} workshop step`)
    expect(overview).toContain(`${ORDINALS[workshopStepsOn(advanced.id)]} workshop step`)
  })

  it('keeps the custody lab and the advanced concept views off the foundations route', () => {
    const workshop = ragSummary.split('## Workshop / Interactive Activities')[1].split('##')[0]
    expect(workshop).toMatch(/FHE \+ HSM Flows_ \(the Advanced HSM custody route only\)/)
    expect(workshop).toMatch(/last three on the Advanced HSM custody route only/)
  })
})
