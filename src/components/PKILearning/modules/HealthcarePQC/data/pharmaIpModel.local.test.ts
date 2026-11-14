// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PHARMA_PIPELINE,
  PHARMA_EXERCISE_COMPOUND,
  PHARMA_SAMPLE_SCENARIO,
  computePharmaCompound,
  computePharmaExerciseFigures,
  computePharmaPortfolio,
  type PharmaCompoundInput,
} from './pharmaIpModel'

const base = PHARMA_EXERCISE_COMPOUND
const scenario = PHARMA_SAMPLE_SCENARIO

function withChanges(changes: Partial<PharmaCompoundInput>): PharmaCompoundInput {
  return { ...base, ...changes }
}

describe('Pharma IP shared model arithmetic', () => {
  it('uses a fictional 2026 base year and a 2033 CRQC year, never the clock', () => {
    expect(scenario).toEqual({ baseYear: 2026, crqcYear: 2033 })
  })

  it('gives the worked 2 + 3 + 7 year example: 12 total, 2 omittable, 10 retained', () => {
    const r = computePharmaCompound(base, scenario)
    expect(r.developmentYearsTotal).toBe(12)
    expect(r.rdYearsSaved).toBe(2)
    expect(r.rdYearsRetained).toBe(10)
  })

  it('no longer returns the old always-zero or 15-plus-year answers', () => {
    const r = computePharmaCompound(base, scenario)
    expect(r.rdYearsSaved).not.toBe(0)
    expect(r.rdYearsSaved).toBeLessThan(15)
  })

  it('shows total value and the vulnerable-path part separately for RSA-2048', () => {
    const r = computePharmaCompound(base, scenario)
    expect(r.totalValueM).toBe(800)
    expect(r.valueOnVulnerablePathM).toBe(800)
    expect(r.status).toBe('exposed-in-scenario')
    expect(r.confidentialityEndYear).toBe(2046)
  })

  it('changes only the vulnerable-path part when the key protection changes', () => {
    const rsa = computePharmaCompound(withChanges({ keyProtection: 'rsa-2048' }), scenario)
    const psk = computePharmaCompound(withChanges({ keyProtection: 'preshared-aes-256' }), scenario)
    const hyb = computePharmaCompound(
      withChanges({ keyProtection: 'hybrid-x25519-mlkem768' }),
      scenario
    )
    expect(rsa.valueOnVulnerablePathM).toBe(800)
    expect(psk.valueOnVulnerablePathM).toBe(0)
    expect(hyb.valueOnVulnerablePathM).toBe(0)
    for (const r of [rsa, psk, hyb]) {
      expect(r.totalValueM).toBe(800)
      expect(r.rdYearsSaved).toBe(2)
      expect(r.confidentialityEndYear).toBe(2046)
    }
    expect(psk.status).toBe('path-not-exposed')
    expect(hyb.status).toBe('path-not-exposed')
  })

  it('keeps zero value, ended confidentiality and unknown protection as distinct results', () => {
    const zero = computePharmaCompound(withChanges({ commercialValueM: 0 }), scenario)
    const ended = computePharmaCompound(withChanges({ confidentialityYearsRemaining: 5 }), scenario)
    const unknown = computePharmaCompound(withChanges({ keyProtection: 'not-specified' }), scenario)
    expect(zero.status).toBe('no-value')
    expect(zero.valueOnVulnerablePathM).toBe(0)
    expect(ended.status).toBe('confidentiality-ended')
    expect(ended.valueOnVulnerablePathM).toBe(0)
    expect(unknown.status).toBe('path-unknown')
    expect(unknown.valueOnVulnerablePathM).toBeNull()
    expect(new Set([zero.status, ended.status, unknown.status]).size).toBe(3)
  })

  it('treats confidentiality ending exactly in the CRQC year as ended', () => {
    const edge = computePharmaCompound(withChanges({ confidentialityYearsRemaining: 7 }), scenario)
    expect(edge.confidentialityEndYear).toBe(2033)
    expect(edge.status).toBe('confidentiality-ended')
    const next = computePharmaCompound(withChanges({ confidentialityYearsRemaining: 8 }), scenario)
    expect(next.status).toBe('exposed-in-scenario')
  })

  it('moves the total by the edited amount when an omittable step changes', () => {
    const steps = base.steps.map((s) => (s.id === 'c1-s1' ? { ...s, years: 4 } : s))
    const r = computePharmaCompound(withChanges({ steps }), scenario)
    expect(r.rdYearsSaved).toBe(4)
    expect(r.developmentYearsTotal).toBe(14)
    expect(r.rdYearsRetained).toBe(10)
  })

  it('moves only the development total when a retained trial changes', () => {
    const steps = base.steps.map((s) => (s.id === 'c1-s3' ? { ...s, years: 9 } : s))
    const r = computePharmaCompound(withChanges({ steps }), scenario)
    expect(r.rdYearsSaved).toBe(2)
    expect(r.developmentYearsTotal).toBe(14)
    expect(r.rdYearsRetained).toBe(12)
  })

  it('reports 0 saved years when no step is omittable, and never invents savings', () => {
    const steps = base.steps.map((s) => ({ ...s, disclosedRecordAllowsSkip: false }))
    const r = computePharmaCompound(withChanges({ steps }), scenario)
    expect(r.rdYearsSaved).toBe(0)
    expect(r.developmentYearsTotal).toBe(12)
    expect(computePharmaCompound(withChanges({ steps: [] }), scenario).developmentYearsTotal).toBe(
      0
    )
  })

  it('does not let patent or exclusivity dates change the confidentiality result', () => {
    const a = computePharmaCompound(withChanges({ patentExpiryYear: 2030 }), scenario)
    const b = computePharmaCompound(
      withChanges({ patentExpiryYear: 2060, exclusivityEndYear: 2065 }),
      scenario
    )
    expect(a.status).toBe(b.status)
    expect(a.confidentialityEndYear).toBe(b.confidentialityEndYear)
    expect(a.valueOnVulnerablePathM).toBe(b.valueOnVulnerablePathM)
    expect(a.patentExpiryYear).toBe(2030)
    expect(b.patentExpiryYear).toBe(2060)
    expect(b.exclusivityEndYear).toBe(2065)
  })

  it('is deterministic and repeats exactly for identical inputs', () => {
    expect(computePharmaCompound(base, scenario)).toEqual(computePharmaCompound(base, scenario))
  })

  it('moves the confidentiality year with the editable base year', () => {
    const r = computePharmaCompound(base, { baseYear: 2010, crqcYear: 2033 })
    expect(r.confidentialityEndYear).toBe(2030)
    expect(r.status).toBe('confidentiality-ended')
  })

  it('cleans invalid numeric input instead of propagating it', () => {
    const r = computePharmaCompound(
      withChanges({
        commercialValueM: Number.NaN,
        steps: [{ id: 'x', name: 'x', years: -3, disclosedRecordAllowsSkip: true }],
      }),
      scenario
    )
    expect(r.totalValueM).toBe(0)
    expect(r.rdYearsSaved).toBe(0)
  })

  it('adds up the default portfolio from the same per-compound function', () => {
    const p = computePharmaPortfolio(DEFAULT_PHARMA_PIPELINE, scenario)
    expect(p.totalValueM).toBe(800 + 3200 + 5500)
    expect(p.valueOnVulnerablePathM).toBe(800)
    expect(p.compoundsOnVulnerablePath).toBe(1)
    expect(p.compoundsPathUnknown).toBe(0)
    expect(p.rdYearsSaved).toBe(2 + 1.5 + 1)
  })

  it('leaves unknown-path value out of the vulnerable-path sum and counts it', () => {
    const p = computePharmaPortfolio(
      [base, { ...base, id: 'u', keyProtection: 'not-specified' }],
      scenario
    )
    expect(p.totalValueM).toBe(1600)
    expect(p.valueOnVulnerablePathM).toBe(800)
    expect(p.compoundsPathUnknown).toBe(1)
  })

  it('exposes the exercise figures from the same function', () => {
    const f = computePharmaExerciseFigures()
    expect(f.rsa).toEqual(computePharmaCompound(base, scenario))
    expect(f.preshared.valueOnVulnerablePathM).toBe(0)
    expect(f.hybrid.valueOnVulnerablePathM).toBe(0)
  })
})
