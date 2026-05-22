// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  stageCollapse,
  stageCollapseAt,
  granularityForPersona,
  PERSONA_STAGE_GRANULARITY,
  DRAFT_STAGE_LEVEL,
  type DraftStage,
  type PersonaStageGranularity,
} from './pqcProtocolMatrix'
import { STAGE_VALUE_CONSISTENCY } from '../../scripts/audit-matrix-refs'
import type { PersonaId } from './learningPersonas'

const ALL_STAGES: DraftStage[] = [
  'none',
  'identified',
  'experimental',
  'individual-draft',
  'wg-document',
  'wg-last-call',
  'iesg-submitted',
  'ietf-last-call',
  'rfc-editor-queue',
  'rfc-published',
  'na',
]

const ALL_PERSONAS: PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'researcher',
  'ops',
  'curious',
]

describe('stageCollapse — persona-aware tier mapping', () => {
  it('na collapses to 0 regardless of persona', () => {
    for (const persona of [...ALL_PERSONAS, null] as Array<PersonaId | null>) {
      expect(stageCollapse('na', persona)).toBe(0)
    }
  })

  it('rfc-published collapses to tier 7 for every persona (binary, ternary, full)', () => {
    for (const persona of [...ALL_PERSONAS, null] as Array<PersonaId | null>) {
      expect(stageCollapse('rfc-published', persona)).toBe(7)
    }
  })

  it('binary personas (executive/ops/curious) only emit tiers {0, 7}', () => {
    const binaryPersonas: PersonaId[] = ['executive', 'ops', 'curious']
    for (const persona of binaryPersonas) {
      for (const stage of ALL_STAGES) {
        const tier = stageCollapse(stage, persona)
        expect([0, 7]).toContain(tier)
      }
    }
  })

  it('ternary personas (developer/architect) only emit tiers {0, 1, 4, 7}', () => {
    const ternaryPersonas: PersonaId[] = ['developer', 'architect']
    for (const persona of ternaryPersonas) {
      for (const stage of ALL_STAGES) {
        const tier = stageCollapse(stage, persona)
        expect([0, 1, 4, 7]).toContain(tier)
      }
    }
  })

  it('researcher / no-persona keeps the full DRAFT_STAGE_LEVEL palette (1:1 mapping)', () => {
    for (const stage of ALL_STAGES) {
      const expected = stage === 'na' ? 0 : DRAFT_STAGE_LEVEL[stage]
      expect(stageCollapse(stage, 'researcher')).toBe(expected)
      expect(stageCollapse(stage, null)).toBe(expected)
    }
  })

  it('individual-draft collapses to tier 0 for binary, tier 1 for ternary, tier 3 for full', () => {
    expect(stageCollapse('individual-draft', 'executive')).toBe(0)
    expect(stageCollapse('individual-draft', 'ops')).toBe(0)
    expect(stageCollapse('individual-draft', 'curious')).toBe(0)
    expect(stageCollapse('individual-draft', 'developer')).toBe(1)
    expect(stageCollapse('individual-draft', 'architect')).toBe(1)
    expect(stageCollapse('individual-draft', 'researcher')).toBe(3)
  })
})

describe('stageCollapseAt — granularity-keyed helper', () => {
  it('matches stageCollapse when granularity matches persona', () => {
    for (const persona of ALL_PERSONAS) {
      const g = granularityForPersona(persona)
      for (const stage of ALL_STAGES) {
        expect(stageCollapseAt(stage, g)).toBe(stageCollapse(stage, persona))
      }
    }
  })

  it('full granularity preserves DRAFT_STAGE_LEVEL exactly (except na → 0)', () => {
    for (const stage of ALL_STAGES) {
      const expected = stage === 'na' ? 0 : DRAFT_STAGE_LEVEL[stage]
      expect(stageCollapseAt(stage, 'full')).toBe(expected)
    }
  })
})

describe('granularityForPersona — persona → granularity lookup', () => {
  it('matches PERSONA_STAGE_GRANULARITY directly', () => {
    for (const persona of ALL_PERSONAS) {
      // eslint-disable-next-line security/detect-object-injection
      expect(granularityForPersona(persona)).toBe(PERSONA_STAGE_GRANULARITY[persona])
    }
  })

  it('returns "full" for null persona', () => {
    expect(granularityForPersona(null)).toBe('full')
  })

  it('binary personas: executive, ops, curious', () => {
    const expected: PersonaStageGranularity = 'binary'
    expect(granularityForPersona('executive')).toBe(expected)
    expect(granularityForPersona('ops')).toBe(expected)
    expect(granularityForPersona('curious')).toBe(expected)
  })

  it('ternary personas: developer, architect', () => {
    const expected: PersonaStageGranularity = 'ternary'
    expect(granularityForPersona('developer')).toBe(expected)
    expect(granularityForPersona('architect')).toBe(expected)
  })

  it('full granularity: researcher', () => {
    expect(granularityForPersona('researcher')).toBe('full')
  })
})

describe('stageCollapse — drift guard against STAGE_VALUE_CONSISTENCY (plan §P1.3)', () => {
  it('every stage that uniquely maps to value=rfc collapses to tier 7 for every persona', () => {
    // Only `rfc-published` uniquely maps to ['rfc']; `rfc-editor-queue` allows
    // both 'draft' and 'rfc', so its tier-7 status is conditional on the
    // dimension's coarse `value`, not on the stage alone. This test guards
    // the strict invariant: stages whose ONLY allowed value is 'rfc' MUST
    // be tier 7 across all personas.
    const rfcOnlyStages = (Object.entries(STAGE_VALUE_CONSISTENCY) as Array<[DraftStage, string[]]>)
      .filter(([, values]) => values.length === 1 && values[0] === 'rfc')
      .map(([stage]) => stage)
    expect(rfcOnlyStages).toContain('rfc-published')
    for (const stage of rfcOnlyStages) {
      for (const persona of [...ALL_PERSONAS, null] as Array<PersonaId | null>) {
        expect(stageCollapse(stage, persona)).toBe(7)
      }
    }
  })

  it('every DraftStage key is handled (exhaustive switch guard)', () => {
    // Ensures future stage additions force a stageCollapse update.
    const consistencyKeys = Object.keys(STAGE_VALUE_CONSISTENCY).sort()
    expect(ALL_STAGES.slice().sort()).toEqual(consistencyKeys)
  })
})
