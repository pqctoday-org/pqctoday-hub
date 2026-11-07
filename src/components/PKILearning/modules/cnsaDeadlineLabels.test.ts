// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { CNSA_PHASE_OUT_LABEL } from './PQCRiskManagement/data/cnsaLabels'

// Every lesson's deadline list, keyed by lesson folder.
const lessons = import.meta.glob<{ content: ModuleContent }>('./*/content.ts', { eager: true })

const entries = Object.entries(lessons).flatMap(([path, mod]) =>
  (mod.content.deadlines ?? []).map((d) => ({ folder: path.split('/')[1], ...d }))
)

const cnsaPhaseOut = entries.filter(
  (d) => /CNSA 2\.0/.test(d.source) && d.year === CNSA_2_0.softwareExclusive
)

describe('lesson deadline lists describe the 2030 CNSA 2.0 date as the FAQ does', () => {
  it('finds the 2030 CNSA 2.0 entry in many lessons', () => {
    expect(cnsaPhaseOut.length).toBeGreaterThan(25)
  })

  it('labels each one with the shared phase-out wording', () => {
    const wrong = cnsaPhaseOut.filter((d) => d.label !== CNSA_PHASE_OUT_LABEL)
    expect(wrong.map((d) => `${d.folder}: ${d.label}`)).toEqual([])
  })

  it('no longer lists a software or networking "exclusive" entry', () => {
    const old = entries.filter((d) =>
      /software exclusive|signing (and networking )?exclusive|networking equipment exclusive/i.test(
        d.label
      )
    )
    expect(old.map((d) => `${d.folder}: ${d.label}`)).toEqual([])
  })
})
