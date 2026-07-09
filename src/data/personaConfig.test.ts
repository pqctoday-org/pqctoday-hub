// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  getBeltTierLabel,
  PERSONA_BELT_TIER_LABELS,
  isComplianceFrameworkEmphasized,
  PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS,
  PERSONA_SIM_PRACTICE_PHASES,
} from './personaConfig'
import { ROLE_CROSSWALK, personaToRoles } from './roleCrosswalk'
import type { PersonaId } from './learningPersonas'
import type { PhaseId } from './frameworkPhases'
import { EXEC_TOUR_STAGES } from '@/components/Simulation/autorun/execTourConfig'

describe('getBeltTierLabel', () => {
  it('returns null when no persona is selected', () => {
    expect(getBeltTierLabel(null, 'White Belt')).toBeNull()
  })

  it('returns null for personas without tier overrides', () => {
    expect(getBeltTierLabel('developer', 'White Belt')).toBeNull()
    expect(getBeltTierLabel('architect', 'Black Belt')).toBeNull()
    expect(getBeltTierLabel('researcher', 'Green Belt')).toBeNull()
    expect(getBeltTierLabel('ops', 'Brown Belt')).toBeNull()
  })

  it('maps executive belts to "Briefed → Aligned → Sponsoring → Board-Ready"', () => {
    expect(getBeltTierLabel('executive', 'White Belt')).toBe('Briefed')
    expect(getBeltTierLabel('executive', 'Yellow Belt')).toBe('Briefed')
    expect(getBeltTierLabel('executive', 'Orange Belt')).toBe('Aligned')
    expect(getBeltTierLabel('executive', 'Green Belt')).toBe('Aligned')
    expect(getBeltTierLabel('executive', 'Blue Belt')).toBe('Sponsoring')
    expect(getBeltTierLabel('executive', 'Brown Belt')).toBe('Sponsoring')
    expect(getBeltTierLabel('executive', 'Black Belt')).toBe('Board-Ready')
  })

  it('maps curious belts to "Aware → Informed → Confident → Quantum-Native"', () => {
    expect(getBeltTierLabel('curious', 'White Belt')).toBe('Aware')
    expect(getBeltTierLabel('curious', 'Yellow Belt')).toBe('Aware')
    expect(getBeltTierLabel('curious', 'Orange Belt')).toBe('Informed')
    expect(getBeltTierLabel('curious', 'Green Belt')).toBe('Informed')
    expect(getBeltTierLabel('curious', 'Blue Belt')).toBe('Confident')
    expect(getBeltTierLabel('curious', 'Brown Belt')).toBe('Confident')
    expect(getBeltTierLabel('curious', 'Black Belt')).toBe('Quantum-Native')
  })

  it('returns null for unknown belt names', () => {
    expect(getBeltTierLabel('executive', 'Pink Belt')).toBeNull()
    expect(getBeltTierLabel('curious', '')).toBeNull()
  })

  it('exposes only executive + curious tier overrides', () => {
    expect(Object.keys(PERSONA_BELT_TIER_LABELS).sort()).toEqual(['curious', 'executive'])
  })
})

describe('isComplianceFrameworkEmphasized', () => {
  it('returns false when no persona is selected', () => {
    expect(isComplianceFrameworkEmphasized(null, 'NIST')).toBe(false)
  })

  it('emphasizes developer-relevant frameworks for developer', () => {
    expect(isComplianceFrameworkEmphasized('developer', 'FIPS')).toBe(true)
    expect(isComplianceFrameworkEmphasized('developer', 'CMMC')).toBe(true)
    expect(isComplianceFrameworkEmphasized('developer', 'CC')).toBe(true)
    expect(isComplianceFrameworkEmphasized('developer', 'FedRAMP')).toBe(true)
  })

  it('does not emphasize unrelated frameworks', () => {
    expect(isComplianceFrameworkEmphasized('developer', 'HIPAA')).toBe(false)
    expect(isComplianceFrameworkEmphasized('executive', 'FIPS')).toBe(false)
  })

  it('exposes a non-empty emphasis set for every persona', () => {
    for (const [persona, set] of Object.entries(PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS)) {
      expect(set, `${persona} has no emphasis`).toBeDefined()
      expect((set ?? []).length).toBeGreaterThan(0)
    }
  })
})

describe('PERSONA_SIM_PRACTICE_PHASES ↔ ROLE_CROSSWALK drift guard', () => {
  // Deliberate, documented exceptions where the CTA's phase set is wider than
  // the persona's owned phases (see the doc comment above
  // PERSONA_SIM_PRACTICE_PHASES). Executive's exec-tour walks p1/p2/p3 content
  // for board-oversight framing even though crypto-architect drives them
  // in-sim. Any OTHER persona/phase combo beyond owned phases is drift, not a
  // deliberate exception, and this test fails to catch it.
  const ALLOWED_EXTRAS: Partial<Record<PersonaId, PhaseId[]>> = {
    executive: ['p1', 'p2', 'p3'],
  }

  function ownedPhases(persona: PersonaId): Set<PhaseId> {
    const roles = personaToRoles[persona]
    const phases = new Set<PhaseId>()
    for (const roleId of roles) {
      for (const p of ROLE_CROSSWALK[roleId].phases) phases.add(p)
    }
    return phases
  }

  for (const [persona, practicePhases] of Object.entries(PERSONA_SIM_PRACTICE_PHASES) as [
    PersonaId,
    PhaseId[],
  ][]) {
    it(`${persona}: every practice phase is either owned in-sim or an allow-listed exception`, () => {
      const owned = ownedPhases(persona)
      const allowed = new Set(ALLOWED_EXTRAS[persona] ?? [])
      for (const phase of practicePhases) {
        expect(
          owned.has(phase) || allowed.has(phase),
          `${persona} practices ${phase} in the Learn CTA, but that persona's seat ` +
            `doesn't own it in ROLE_CROSSWALK and it isn't an allow-listed exception`
        ).toBe(true)
      }
    })

    it(`${persona}: every owned in-sim phase is offered by the Learn CTA`, () => {
      const owned = ownedPhases(persona)
      for (const phase of owned) {
        expect(
          practicePhases.includes(phase),
          `${persona}'s seat owns ${phase} in ROLE_CROSSWALK, but the Learn CTA never offers it`
        ).toBe(true)
      }
    })
  }

  it("executive's allow-listed extras are backed by real Executive Overview tour content", () => {
    // The exception exists BECAUSE the tour visits these phases — if the tour
    // stops covering one, the allowlist (and this test) should shrink with it.
    const tourPhases = new Set(EXEC_TOUR_STAGES.map((s) => s.phase))
    for (const phase of ALLOWED_EXTRAS.executive ?? []) {
      expect(tourPhases.has(phase), `exec tour no longer visits ${phase}`).toBe(true)
    }
  })
})
