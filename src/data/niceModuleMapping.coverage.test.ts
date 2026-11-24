// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { NICE_MODULE_MAP } from './niceModuleMapping'
import { NICE_WORK_ROLES, PERSONA_DEFAULT_ROLE, personaDefaultRole } from './niceFramework'
import { PERSONA_IDS } from './personaIds'

describe('NICE mapping coverage', () => {
  it('every Learn module has a NICE mapping', () => {
    const mapped = new Set(NICE_MODULE_MAP.map((m) => m.moduleId))
    const missing = Object.keys(MODULE_CATALOG).filter((id) => !mapped.has(id))
    expect(missing).toEqual([])
  })

  it('every mapped work role exists', () => {
    for (const m of NICE_MODULE_MAP) {
      expect(m.workRoles.length, `${m.moduleId} lists no work role`).toBeGreaterThan(0)
      for (const r of m.workRoles) {
        expect(NICE_WORK_ROLES[r], `${m.moduleId} lists unknown role ${r}`).toBeDefined()
      }
    }
  })

  it('every persona has a default work role, or deliberately none', () => {
    expect(Object.keys(PERSONA_DEFAULT_ROLE).sort()).toEqual([...PERSONA_IDS].sort())
    for (const id of PERSONA_IDS) {
      const role = PERSONA_DEFAULT_ROLE[id]
      if (role !== null) expect(NICE_WORK_ROLES[role]).toBeDefined()
    }
    expect(personaDefaultRole('curious')).toBeNull()
    expect(personaDefaultRole('not-a-persona')).toBeNull()
    expect(personaDefaultRole(null)).toBeNull()
  })

  it('the new supply-chain role reaches the Vendor & Supply Chain Risk module', () => {
    const vendor = NICE_MODULE_MAP.find((m) => m.moduleId === 'vendor-risk')
    expect(vendor?.workRoles).toContain('supply-chain-risk-manager')
    expect(NICE_WORK_ROLES['supply-chain-risk-manager'].niceCode).toBe('OG-WRL-017')
  })
})
