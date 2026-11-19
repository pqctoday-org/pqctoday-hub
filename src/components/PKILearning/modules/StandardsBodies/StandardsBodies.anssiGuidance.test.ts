// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { ORGANIZATIONS, WORKSHOP_SCENARIOS } from './data'
import ragSummary from './rag-summary.md?raw'

const franceScenario = WORKSHOP_SCENARIOS.find((scenario) => scenario.id === 'france-bank')!
const anssi = ORGANIZATIONS.find((organization) => organization.id === 'anssi')!

describe('Standards Bodies: ANSSI PQC policy scope', () => {
  it('distinguishes the 2022 phased roadmap from a blanket current legal mandate', () => {
    expect(franceScenario.correctStandard).toBe('hybrid-pqc')
    expect(
      franceScenario.standardOptions.find((option) => option.id === 'hybrid-pqc')?.label
    ).toContain('recommended in ANSSI guidance')
    expect(franceScenario.detailedExplanation).toContain('not a blanket law')
    expect(franceScenario.detailedExplanation).toContain('Phase 2')
    expect(franceScenario.detailedExplanation).toContain('current ANSSI guidance')
    expect(franceScenario.detailedExplanation).not.toContain(
      'mandatory inside the regulated perimeter'
    )
  })

  it('keeps the organization record and retrieval summary consistent with the source scope', () => {
    expect(anssi.mission).toContain('do not establish a blanket legal requirement')
    expect(anssi.decisionMaking).toContain('not mandatory at publication')
    expect(anssi.keyPqcOutputs.join(' ')).not.toContain('mandatory inside the regulated perimeter')
    expect(ragSummary).toContain('not a blanket legal mandate for a named regulated perimeter')
    expect(ragSummary).not.toContain('makes it mandatory inside the French regulated perimeter')
  })
})
