// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Claim-scope guards for the AutomotivePQC module.
 *
 * Each test states a concept a reader must be able to rely on, and checks the
 * module's data and rendered lesson text against it:
 *  - hardware safety metrics are not presented as cryptographic requirements,
 *    and no ASIL letter is made to demand dedicated hardware or a classical backup;
 *  - a stateful hash-based signature is never recommended without its state/key-budget caveat;
 *  - harvest-now-decrypt-later is tied to confidentiality (key exchange), not to signatures,
 *    key destruction or disposal;
 *  - a hardware-security "standards" field does not cite an EMC test series;
 *  - TISAX assessment levels, labels and catalogue controls are kept apart, with no invented
 *    post-quantum add-on;
 *  - large signatures over Ethernet are not said to force IP fragmentation;
 *  - the AUTOSAR Classic CSM and the Adaptive CryptoAPI are not conflated;
 *  - R155/R156 are not given one universal date;
 *  - Galileo OSNMA is not called post-quantum.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { AutomotivePQCIntroduction } from './components/AutomotivePQCIntroduction'
import { AUTOMOTIVE_FUNCTIONS, ASIL_CRYPTO_REQUIREMENTS } from './data/safetyCryptoData'
import { SENSOR_PROFILES } from './data/sensorFusionData'
import {
  AUTOMOTIVE_HSM_TIERS,
  AUTOMOTIVE_COMPLIANCE_MILESTONES,
  LIFECYCLE_PHASES,
} from './data/lifecycleComplianceData'
import ragSummary from './rag-summary.md?raw'

/** The lesson with every collapsed section opened, as one string. */
function lessonText(): string {
  render(
    <MemoryRouter>
      <AutomotivePQCIntroduction onNavigateToWorkshop={() => {}} />
    </MemoryRouter>
  )
  for (let i = 0; i < 6; i++) {
    screen.queryAllByRole('button', { expanded: false }).forEach((b) => fireEvent.click(b))
  }
  return (document.body.textContent ?? '').replace(/\s+/g, ' ')
}

/** Split into clauses so a negation or qualifier has to sit next to the claim it governs. */
const clauses = (text: string) => text.split(/[.;]\s+|\s—\s/).filter(Boolean)

describe('safety and hardware metrics', () => {
  it('the ASIL table gives no hardware-metric percentage as a cryptographic requirement', () => {
    for (const row of ASIL_CRYPTO_REQUIREMENTS) {
      expect(row.diagnosticCoverage, `ASIL ${row.asilLevel}`).not.toMatch(/\d\s*%/)
    }
  })

  it('no function text says an ASIL level demands a second path or dedicated hardware', () => {
    const fields = AUTOMOTIVE_FUNCTIONS.flatMap((f) => [
      f.failModeDescription,
      f.pqcConstraint,
      f.pqcDesignPattern,
    ])
    const tableFields = ASIL_CRYPTO_REQUIREMENTS.flatMap((r) => [
      r.cryptoRequirement,
      r.redundancyLevel,
      r.pqcImpact,
    ])
    for (const text of [...fields, ...tableFields]) {
      for (const clause of clauses(text)) {
        if (/\b(no|not|never)\b/i.test(clause)) continue // a negation is the point of the caveat
        expect(clause, clause).not.toMatch(
          /\b(demands?|requires?|mandatory|must)\b[^.]*(dual|classical backup|redundan|ASIC)/i
        )
      }
    }
  })

  it('the lesson names no dedicated crypto ASIC as required for any ASIL level', () => {
    expect(lessonText()).not.toMatch(/\bASIC\b/)
  })

  it('every function that mentions LMS also states the stateful, finite-key caveat', () => {
    for (const f of AUTOMOTIVE_FUNCTIONS) {
      const text = [f.pqcConstraint, f.pqcDesignPattern].join(' ')
      if (/\bLMS\b/.test(text)) {
        expect(text, f.name).toMatch(/stateful|finite|exhaust|run out|never (be )?reused/i)
      }
    }
  })
})

describe('harvest-now-decrypt-later is a confidentiality risk, not a signature or disposal one', () => {
  const texts: string[] = [
    ...SENSOR_PROFILES.map((s) => s.quantumThreat),
    ...AUTOMOTIVE_HSM_TIERS.map((t) => t.quantumThreat),
    ...LIFECYCLE_PHASES.flatMap((p) => p.pqcRequirements),
  ]

  it('each mention is tied to key exchange/sessions or explicitly separated from forgery and hygiene', () => {
    for (const text of texts) {
      for (const clause of clauses(text)) {
        if (/HNDL|harvest[- ]now/i.test(clause)) {
          expect(clause, clause).toMatch(
            /\b(not|separate|different|rather than)\b|TLS|key exchange|ECDH|session/i
          )
        }
      }
    }
  })

  it('key destruction is described as hygiene with stated limits, not as a harvest-now defence', () => {
    const eol = LIFECYCLE_PHASES.find((p) => p.id === 'end-of-life')!
    const destroy = eol.pqcRequirements.find((r) => /decapsulation/i.test(r))!
    expect(destroy).toMatch(/hygiene|not a defen[cs]e/i)
    expect(eol.pqcRequirements.join(' ')).toMatch(/backup|escrow/i)
    expect(eol.pqcRequirements.join(' ')).toMatch(/retroactive|already/i)
  })
})

describe('hardware security profile fields', () => {
  it('no tier cites an EMC immunity test series as its security standard', () => {
    for (const tier of AUTOMOTIVE_HSM_TIERS) {
      expect(tier.standard, tier.name).not.toMatch(/11452|\bEMC\b|electromagnetic/i)
    }
  })
})

describe('Galileo OSNMA', () => {
  it('is not called post-quantum, and its classical signature is stated', () => {
    const gnss = SENSOR_PROFILES.find((s) => s.id === 'gps-imu')!
    expect(gnss.quantumThreat).not.toMatch(/PQC-signed/i)
    if (/OSNMA/i.test(gnss.quantumThreat)) {
      expect(gnss.quantumThreat).toMatch(/ECDSA|classical/i)
      expect(gnss.quantumThreat).toMatch(/jamming|ranging/i)
    }
  })
})

describe('lesson text', () => {
  let text = ''
  beforeAll(() => {
    text = lessonText()
  })

  it('keeps TISAX assessment levels, labels and catalogue controls apart, with no invented PQC add-on', () => {
    expect(text).not.toMatch(/PQC addendum/i)
    expect(text).not.toMatch(/labels?\s*\(AL\s*1/i)
    expect(text).not.toMatch(/TISAX[^.]*scope is expanding[^.]*quantum/i)
    expect(text).not.toMatch(/TISAX assessments must verify/i)
  })

  it('does not say Ethernet will require IP fragmentation for large signatures', () => {
    expect(text).not.toMatch(/Ethernet[^.]*(will|must) require IP fragmentation/i)
  })

  it('does not give the Adaptive Platform the Classic Crypto Service Manager or transparent algorithm swaps', () => {
    expect(text).not.toMatch(
      /Adaptive[^.;]{0,40}(provides|includes)[^.;]{0,20}Crypto Service Manager/i
    )
    expect(text).not.toMatch(
      /Crypto Service Manager\s*\(ara::crypto\)|ara::crypto\)?\s+Crypto Service Manager/i
    )
    expect(text).not.toMatch(/Adaptive \(Crypto Service Manager\)/i)
    expect(text).not.toMatch(/without changing application code/i)
    expect(text).not.toMatch(/receive the change transparently/i)
  })

  it('does not give R155/R156 one universal start date', () => {
    expect(text).not.toMatch(/since July 2024 vehicle types need/i)
  })
})

describe('regulatory milestones and summary', () => {
  it('no milestone presents EU registration dates as a global R155/R156 rule', () => {
    const m = AUTOMOTIVE_COMPLIANCE_MILESTONES.find((x) => x.id === 'wp29-all-vehicles')!
    expect(m.region).toBe('eu')
    // the date belongs to the EU legal act, not to the UN regulation
    expect(m.authority).not.toBe('UNECE')
    expect(m.description).toMatch(/2019\/2144/)
  })

  it('no TISAX milestone invents projected PQC criteria', () => {
    const m = AUTOMOTIVE_COMPLIANCE_MILESTONES.find((x) => x.id === 'tisax-v7')!
    expect(m.name).not.toMatch(/PQC Criteria/i)
    expect(m.confidence).not.toBe('projected')
  })

  it('the assistant summary has no universal 2027 or retroactive R155 deadline', () => {
    for (const clause of clauses(ragSummary)) {
      if (/R15[56]/.test(clause) && /2027|retroactiv|retrofit/i.test(clause)) {
        expect(clause, clause).toMatch(/\b(no|not)\b/i)
      }
    }
    expect(ragSummary).not.toMatch(/TISAX v7/i)
  })
})
