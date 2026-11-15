// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { BC_ZONE_EMPHASIS_BY_PERSONA } from '@/data/personaConfig'
import { PERSONA_IDS, type PersonaId } from '@/data/personaIds'
import type { ZoneId } from '@/data/cswp39ZoneData'
import { ZONE_ARTIFACT_TYPES } from './cswp39StepMapping'
import { defaultOpenZoneFor } from './lensZone'

describe('defaultOpenZoneFor', () => {
  it('opens Governance for the certification engineer, whose lens is the evidence view', () => {
    expect(defaultOpenZoneFor('cert-engineer')).toBe('governance')
  })

  it('opens each role with its own lens at that lens zone', () => {
    expect(defaultOpenZoneFor('executive')).toBe('governance')
    expect(defaultOpenZoneFor('ops')).toBe('migration')
    expect(defaultOpenZoneFor('researcher')).toBe('risk-management')
  })

  it('a role with no lens opens the no-lens default zone', () => {
    expect(defaultOpenZoneFor('curious')).toBe('assets')
    expect(defaultOpenZoneFor(null)).toBe('assets')
  })
})

describe('featured artifacts sit in the zone they are featured under', () => {
  it('every lens entry is a type that zone lists', () => {
    for (const id of PERSONA_IDS as readonly PersonaId[]) {
      const lens = BC_ZONE_EMPHASIS_BY_PERSONA[id]
      if (!lens) continue
      for (const [zone, types] of Object.entries(lens.featuredArtifacts)) {
        const listed = ZONE_ARTIFACT_TYPES[zone as ZoneId]
        for (const type of types ?? []) {
          expect(listed, `${id} / ${zone} / ${type}`).toContain(type)
        }
      }
    }
  })

  it('the certification engineer lens has a headline and a tagline', () => {
    const lens = BC_ZONE_EMPHASIS_BY_PERSONA['cert-engineer']
    expect(lens?.headline).toBe('Certification & conformance — evidence view')
    expect(lens?.tagline).toBeTruthy()
  })
})
