// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ROLE_CROSSWALK, personaToRoles, type FrameworkRoleId } from './roleCrosswalk'
import { FRAMEWORK_PHASES, PHASE_ORDER } from './frameworkPhases'
import type { Cswp39StepId } from './frameworkPhases'
import { PERSONAS } from './learningPersonas'
import type { PersonaId } from './learningPersonas'
import { NICE_WORK_ROLES } from './niceFramework'

const ALL_ROLE_IDS: FrameworkRoleId[] = [
  'qrpm',
  'exec-sponsor',
  'crypto-architect',
  'security-eng',
  'appsec-lead',
  'ot-specialist',
  'vendor-lead',
  'pmo-analyst',
]

const ALL_PERSONA_IDS: PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'researcher',
  'ops',
  'curious',
]

const PHASE_SET = new Set(PHASE_ORDER)
const PERSONA_SET = new Set(Object.keys(PERSONAS))
const NICE_SET = new Set(Object.keys(NICE_WORK_ROLES))

const STEP_ORDER: Cswp39StepId[] = [
  'govern',
  'inventory',
  'identify-gaps',
  'prioritise',
  'implement',
]

describe('ROLE_CROSSWALK', () => {
  it('declares every FrameworkRoleId exactly once', () => {
    expect(Object.keys(ROLE_CROSSWALK).sort()).toEqual([...ALL_ROLE_IDS].sort())
  })

  it('every record id matches its key', () => {
    for (const id of ALL_ROLE_IDS) {
      expect(ROLE_CROSSWALK[id].id).toBe(id)
    }
  })

  it('every role.phases is a subset of PHASE_ORDER (and non-empty)', () => {
    for (const id of ALL_ROLE_IDS) {
      const { phases } = ROLE_CROSSWALK[id]
      expect(phases.length).toBeGreaterThan(0)
      for (const phase of phases) {
        expect(PHASE_SET.has(phase)).toBe(true)
      }
    }
  })

  it('every role.persona is a real PersonaId', () => {
    for (const id of ALL_ROLE_IDS) {
      expect(PERSONA_SET.has(ROLE_CROSSWALK[id].persona)).toBe(true)
    }
  })

  it('every role.niceRoles entry is a real NiceWorkRoleId (and non-empty)', () => {
    for (const id of ALL_ROLE_IDS) {
      const { niceRoles } = ROLE_CROSSWALK[id]
      expect(niceRoles.length).toBeGreaterThan(0)
      for (const nice of niceRoles) {
        expect(NICE_SET.has(nice)).toBe(true)
      }
    }
  })

  it('every role.cswp39Steps equals the union of its phases steps (spec §7.5 drift key)', () => {
    for (const id of ALL_ROLE_IDS) {
      const role = ROLE_CROSSWALK[id]
      const expected = new Set<Cswp39StepId>()
      for (const phase of role.phases) {
        for (const step of FRAMEWORK_PHASES[phase].cswp39Steps) {
          expected.add(step)
        }
      }
      const inCanonicalOrder = STEP_ORDER.filter((s) => expected.has(s))
      expect([...role.cswp39Steps].sort()).toEqual([...expected].sort())
      // declared list is itself in canonical Govern→Implement order
      expect(role.cswp39Steps).toEqual(inCanonicalOrder)
    }
  })
})

describe('personaToRoles', () => {
  it('is total over every PersonaId', () => {
    expect(Object.keys(personaToRoles).sort()).toEqual([...ALL_PERSONA_IDS].sort())
  })

  it('is a faithful inverse of ROLE_CROSSWALK.persona', () => {
    for (const persona of ALL_PERSONA_IDS) {
      const expected = ALL_ROLE_IDS.filter((id) => ROLE_CROSSWALK[id].persona === persona)
      expect([...personaToRoles[persona]].sort()).toEqual([...expected].sort())
    }
  })

  it('every listed role id is a real FrameworkRoleId', () => {
    for (const persona of ALL_PERSONA_IDS) {
      for (const roleId of personaToRoles[persona]) {
        expect(ROLE_CROSSWALK[roleId]).toBeDefined()
      }
    }
  })

  it('researcher and curious map to no framework roles (orphan personas)', () => {
    expect(personaToRoles.researcher).toEqual([])
    expect(personaToRoles.curious).toEqual([])
  })

  it('executive fans out to QRPM, Exec-Sponsor, Vendor-Lead and PMO-Analyst', () => {
    expect([...personaToRoles.executive].sort()).toEqual(
      ['qrpm', 'exec-sponsor', 'vendor-lead', 'pmo-analyst'].sort()
    )
  })
})
