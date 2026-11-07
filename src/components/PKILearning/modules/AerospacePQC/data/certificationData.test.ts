// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CERTIFICATION_AUTHORITIES, DAL_DESCRIPTIONS } from './certificationData'

const byId = (id: string) => CERTIFICATION_AUTHORITIES.find((a) => a.id === id)!

describe('design assurance level descriptions', () => {
  it('names MC/DC for level A without making formal methods mandatory', () => {
    const a = DAL_DESCRIPTIONS.A
    expect(a.description).toMatch(/MC\/DC/)
    expect(a.description).toMatch(/formal methods are an optional technique/i)
    expect(a.description).not.toMatch(/requires .*formal methods/i)
    expect(a.description).not.toMatch(/and formal methods verification/i)
    expect(a.coverage).not.toMatch(/formal/i)
  })

  it('does not require formal methods at any level', () => {
    for (const level of Object.values(DAL_DESCRIPTIONS)) {
      expect(level.description).not.toMatch(/requires[^.]*formal methods/i)
    }
  })

  it('grades structural coverage from level C to level A', () => {
    expect(DAL_DESCRIPTIONS.C.description).toMatch(/all statements were exercised/)
    expect(DAL_DESCRIPTIONS.B.description).toMatch(/all statements and all decisions/)
    expect(DAL_DESCRIPTIONS.A.description).toMatch(
      /all statements, all decisions and all conditions/
    )
  })
})

describe('certification authority guidance', () => {
  it('does not present the Brazilian unmanned-aircraft rule as an airworthiness-security standard', () => {
    const anac = byId('anac')
    expect(anac.standard).not.toMatch(/RBAC/)
    expect(anac.framework).not.toMatch(/DO-326/)
    expect(anac.notes).toMatch(/civil unmanned aircraft/)
    expect(anac.notes).toMatch(/not a general airworthiness-security standard/)
    expect(anac.status).toMatch(/not verified/i)
  })

  it('leaves the unsupported Canadian mapping unverified instead of inventing an equivalent', () => {
    const tcca = byId('tcca')
    expect(tcca.standard).toMatch(/not verified/i)
    expect(tcca.standard).not.toMatch(/500-025/)
    expect(tcca.framework).not.toMatch(/adopted/i)
    expect(tcca.notes).not.toMatch(/bilateral agreements\.$/)
  })

  it('keeps EASA AMC 20-42 as a non-mandatory accepted means of compliance', () => {
    const easa = byId('easa')
    expect(easa.standard).toBe('AMC 20-42')
    expect(easa.notes).toMatch(/not mandatory/)
  })
})
