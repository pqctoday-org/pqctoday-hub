// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  EXECUTIVE_SEQUENCE,
  GRC_SEQUENCE,
  DEVELOPER_SEQUENCE,
  RESEARCHER_SEQUENCE,
  GENERIC_SEQUENCE,
  getBusinessRoleSequence,
  isValidBusinessToolId,
} from './businessRoleConfig'

const ALL_SEQUENCES = {
  executive: EXECUTIVE_SEQUENCE,
  grc: GRC_SEQUENCE,
  developer: DEVELOPER_SEQUENCE,
  researcher: RESEARCHER_SEQUENCE,
  generic: GENERIC_SEQUENCE,
}

describe('businessRoleConfig', () => {
  it('every recommended tool id is a real id in businessToolsRegistry.tsx', () => {
    for (const [name, seq] of Object.entries(ALL_SEQUENCES)) {
      for (const step of seq.steps) {
        expect(isValidBusinessToolId(step.id), `${name}: "${step.id}"`).toBe(true)
      }
    }
  })

  it('steps are numbered contiguously starting at 1', () => {
    for (const [name, seq] of Object.entries(ALL_SEQUENCES)) {
      expect(
        seq.steps.map((s) => s.step),
        name
      ).toEqual(seq.steps.map((_, i) => i + 1))
    }
  })

  it('executive and GRC have distinct sequences from each other and from the generic fallback', () => {
    const execIds = EXECUTIVE_SEQUENCE.steps.map((s) => s.id)
    const grcIds = GRC_SEQUENCE.steps.map((s) => s.id)
    const genericIds = GENERIC_SEQUENCE.steps.map((s) => s.id)
    expect(execIds).not.toEqual(grcIds)
    expect(execIds).not.toEqual(genericIds)
    expect(grcIds).not.toEqual(genericIds)
  })

  it('getBusinessRoleSequence resolves executive, grc and developer to their own sequence', () => {
    expect(getBusinessRoleSequence('executive')).toBe(EXECUTIVE_SEQUENCE)
    expect(getBusinessRoleSequence('grc')).toBe(GRC_SEQUENCE)
    expect(getBusinessRoleSequence('developer')).toBe(DEVELOPER_SEQUENCE)
    expect(getBusinessRoleSequence('researcher')).toBe(RESEARCHER_SEQUENCE)
  })

  it('the researcher sequence holds no program deliverables (ROI, RACI, roadmap, board deck)', () => {
    const ids = RESEARCHER_SEQUENCE.steps.map((s) => s.id)
    expect(ids[0]).toBe('crqc-scenario')
    for (const id of ['roi-calculator', 'raci-builder', 'roadmap-builder', 'board-pitch']) {
      expect(ids).not.toContain(id)
    }
  })

  it('the developer sequence starts at the refactor audit and never at ROI or RACI', () => {
    const ids = DEVELOPER_SEQUENCE.steps.map((s) => s.id)
    expect(ids[0]).toBe('crypto-api-refactor-audit')
    expect(ids).not.toContain('roi-calculator')
    expect(ids).not.toContain('raci-builder')
  })

  it('getBusinessRoleSequence falls back to the generic sequence for every other persona and null', () => {
    for (const persona of ['architect', 'ops', 'curious'] as const) {
      expect(getBusinessRoleSequence(persona), persona).toBe(GENERIC_SEQUENCE)
    }
    expect(getBusinessRoleSequence(null)).toBe(GENERIC_SEQUENCE)
  })

  it('isValidBusinessToolId rejects a made-up id', () => {
    expect(isValidBusinessToolId('not-a-real-tool-id')).toBe(false)
  })
})
