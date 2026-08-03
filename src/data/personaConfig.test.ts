// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  getBeltTierLabel,
  PERSONA_BELT_TIER_LABELS,
  isComplianceFrameworkEmphasized,
  PERSONA_COMPLIANCE_FRAMEWORK_EMPHASIS,
  PERSONA_SIM_PRACTICE_PHASES,
  PERSONA_JOURNEY_BOARD,
  PERSONA_JOURNEY_BOARD_VARIANTS,
  EXEC_EXPOSURE,
  EXEC_MOSCA_AS_OF_YEAR,
  EXEC_MOSCA_START_BY_YEAR,
  EXEC_MOSCA_COMPLETE_BY_YEAR,
  EXEC_MOSCA_PUNCHLINE,
  EXEC_MOSCA_FOOTNOTE,
  PERSONA_MIGRATE_LAYERS,
  PERSONA_LIBRARY_CATEGORIES,
} from './personaConfig'
import { ROLE_CROSSWALK, personaToRoles } from './roleCrosswalk'
import { PERSONAS, type PersonaId } from './learningPersonas'
import type { PhaseId } from './frameworkPhases'
import { EXEC_TOUR_STAGES } from '@/components/Simulation/autorun/execTourConfig'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'
import { INITIAL_CHECKS } from '@/components/Playground/TpmPlayground/ComplianceRunner'
import { CSWP39_ZONE_DETAILS } from './cswp39ZoneData'

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

describe('PERSONA_JOURNEY_BOARD drift guards (HOME-PAGE-DYNAMIC-DATA-REMEDIATION-PLAN-2026-08-01.md rev. 2)', () => {
  // trackChips are deliberately hand-written, persona-appropriate labels (not
  // literal module titles — e.g. curious's "Risk basics" vs the module's real
  // title "PQC Risk Management"), so the plan's decision was: keep the wording
  // hand-authored, but guard the one thing that's a real drift risk — that
  // each chip still corresponds, in order, to a real essentials module.
  for (const personaId of Object.keys(PERSONAS) as PersonaId[]) {
    it(`${personaId}: trackChips count matches essentials.length`, () => {
      const board = PERSONA_JOURNEY_BOARD[personaId]
      const essentials = PERSONAS[personaId].essentials
      expect(
        board.trackChips.length,
        `${personaId} has ${essentials.length} essentials but ${board.trackChips.length} trackChips`
      ).toBe(essentials.length)
    })

    it(`${personaId}: every essentials module id still resolves to a real module`, () => {
      for (const moduleId of PERSONAS[personaId].essentials) {
        expect(
          MANIFEST_BY_ID[moduleId],
          `essentials id "${moduleId}" has no manifest`
        ).toBeDefined()
      }
    })
  }

  it('researcher: Library and Migrate filters really are both empty arrays (gridCards[0] asserts this by name)', () => {
    expect(PERSONA_MIGRATE_LAYERS.researcher).toEqual([])
    expect(PERSONA_LIBRARY_CATEGORIES.researcher).toEqual([])
  })

  /**
   * Both guards below became VARIANT-AWARE on 2026-08-02. Each role now has
   * three boards, and these two live facts sit on the board whose subject they
   * actually are — the TCG runner on researcher/reproduce, the mitigation-zone
   * citation on ops/capacity — not necessarily on the role's order-1 board.
   * Scanning every variant keeps the guard honest wherever the copy moves,
   * which is the point of a drift guard: it must follow the claim.
   */
  it('researcher: the TCG V1.85 runner claim cites its real check count, on whichever board makes it', () => {
    const bodies = PERSONA_JOURNEY_BOARD_VARIANTS.researcher.flatMap((v) =>
      v.board.gridCards.map((c) => c.body)
    )
    const claims = bodies.filter((b) => /TCG V1\.85 runner/.test(b))
    expect(claims, 'no researcher board mentions the TCG V1.85 runner').not.toHaveLength(0)
    for (const body of claims) {
      const match = /(\d+)-check TCG V1\.85 runner/.exec(body)
      expect(match, `expected an "N-check TCG V1.85 runner" phrase in: ${body}`).not.toBeNull()
      expect(Number(match?.[1])).toBe(INITIAL_CHECKS.length)
    }
  })

  it("ops: the CSWP.39 §4.6 citation matches the mitigation zone's own reference", () => {
    expect(CSWP39_ZONE_DETAILS.mitigation.cswpRef).toContain('§4.6')
    const bodies = PERSONA_JOURNEY_BOARD_VARIANTS.ops.flatMap((v) =>
      v.board.gridCards.map((c) => c.body)
    )
    expect(bodies.filter((b) => b.includes('CSWP.39 §4.6'))).not.toHaveLength(0)
  })
})

describe("exec/researcher exposure card — Mosca's inequality", () => {
  // Regressions for two defects that both shipped on this card. The first was a
  // hand-typed conclusion ("You are four years short.") sitting above literal
  // premises it did not follow from. The fix computed the conclusion but used
  // `z - y`, dropping x — so the card printed "12 yrs" as its own first row and
  // then never used it, and the number it produced (2028) disagreed by 12 years
  // with SectorExposureHero's `z - dataLife - MIGRATION_YEARS` for the same
  // question. These pin the formula itself, not the rendered string.

  it('start-by year is z - x - y, not z - y', () => {
    const z = EXEC_MOSCA_START_BY_YEAR + EXEC_EXPOSURE.secrecyYears + EXEC_EXPOSURE.migrationYears
    expect(EXEC_MOSCA_START_BY_YEAR).toBe(
      z - EXEC_EXPOSURE.secrecyYears - EXEC_EXPOSURE.migrationYears
    )
    // The specific wrong answer, named so it cannot come back silently.
    expect(EXEC_MOSCA_START_BY_YEAR).not.toBe(z - EXEC_EXPOSURE.migrationYears)
  })

  it('complete-by year is z - x, and start-by precedes it by the migration length', () => {
    expect(EXEC_MOSCA_COMPLETE_BY_YEAR - EXEC_MOSCA_START_BY_YEAR).toBe(
      EXEC_EXPOSURE.migrationYears
    )
  })

  it('the footnote shows the working, including x', () => {
    expect(EXEC_MOSCA_FOOTNOTE).toContain(`X ${EXEC_EXPOSURE.secrecyYears} yrs`)
    expect(EXEC_MOSCA_FOOTNOTE).toContain(`Y ${EXEC_EXPOSURE.migrationYears} yrs`)
    expect(EXEC_MOSCA_FOOTNOTE).toContain(`= ${EXEC_MOSCA_START_BY_YEAR}`)
  })

  it('the punchline never claims a passed deadline is still ahead of the reader', () => {
    const isPast = EXEC_MOSCA_AS_OF_YEAR > EXEC_MOSCA_START_BY_YEAR
    if (isPast) {
      expect(EXEC_MOSCA_PUNCHLINE).toMatch(/past it|was /)
      expect(EXEC_MOSCA_PUNCHLINE).not.toMatch(/^Start by/)
    } else {
      expect(EXEC_MOSCA_PUNCHLINE).toMatch(/^Start by/)
    }
  })

  it('the declared reference year has not drifted behind the real clock', () => {
    // EXEC_MOSCA_AS_OF_YEAR is declared, not clock-derived, so the generated
    // board stays byte-stable for the drift gate. This is what stops it rotting:
    // it fails once the constant is more than a year stale.
    expect(new Date().getFullYear() - EXEC_MOSCA_AS_OF_YEAR).toBeLessThanOrEqual(1)
  })
})
