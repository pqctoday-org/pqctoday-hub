// SPDX-License-Identifier: GPL-3.0-only
/**
 * W4.4 — the threat horizon and the regulatory due date are different claims.
 *
 * The clock used to collapse them with `Math.min(CRQC estimate, country
 * deadline)` and present the result through Q-Day/Mosca language. A country
 * with an earlier compliance date therefore appeared to have an earlier
 * cryptanalytic prediction, which is not what a deadline means.
 *
 * Acceptance (plan, W4): "changing regulatory due date does not change a
 * displayed CRQC prediction".
 */
import { describe, it, expect } from 'vitest'
import { deriveSimClock } from './useSimClock'
import { SIM_CRQC_YEAR, COUNTRY_DEADLINE_YEAR, deadlineScopeFor } from '@/data/moscaClock'

const base = {
  year: 2026,
  q: 1,
  sector: 'financial',
  size: 'mid',
  crqcShift: 0,
  assessMosca: null,
}

/** A country the scenario gives a dated obligation, and one it does not. */
const withDeadline = Object.keys(COUNTRY_DEADLINE_YEAR)[0]!

describe('threat horizon vs regulatory due date (W4.4)', () => {
  it('reports the CRQC threat horizon independently of any jurisdiction', () => {
    const a = deriveSimClock({ ...base, country: withDeadline })
    const b = deriveSimClock({ ...base, country: '__no_such_country__' })
    // The regulatory date differs between these two; the threat horizon must not.
    expect(a.threatHorizonYear).toBe(SIM_CRQC_YEAR)
    expect(b.threatHorizonYear).toBe(SIM_CRQC_YEAR)
    expect(a.threatHorizonYear).toBe(b.threatHorizonYear)
  })

  it('only an in-run threat event moves the threat horizon', () => {
    const shifted = deriveSimClock({ ...base, country: withDeadline, crqcShift: 3 })
    expect(shifted.threatHorizonYear).toBe(SIM_CRQC_YEAR - 3)
  })

  it('reports a missing regulatory date as absent, not as "no deadline"', () => {
    const none = deriveSimClock({ ...base, country: '__no_such_country__' })
    expect(none.regulatoryDueYear).toBeNull()
    // With no dated obligation, the schedule is bound by the threat horizon.
    expect(none.bindingHorizon).toBe('threat')
    expect(none.horizonYear).toBe(none.threatHorizonYear)
  })

  it('names which of the two actually binds the schedule', () => {
    const due = COUNTRY_DEADLINE_YEAR[withDeadline]!
    const c = deriveSimClock({ ...base, country: withDeadline })
    expect(c.regulatoryDueYear).toBe(due)
    if (due < SIM_CRQC_YEAR) {
      expect(c.bindingHorizon).toBe('regulatory')
      expect(c.horizonYear).toBe(due)
    } else {
      expect(c.bindingHorizon).toBe('threat')
    }
    // whichever binds, the planning anchor is never later than either input
    expect(c.horizonYear).toBeLessThanOrEqual(c.threatHorizonYear)
  })
})

describe('a country deadline states what it actually binds (W4.2/W4.3)', () => {
  it('does not let a private organisation inherit a federal mandate from its country', () => {
    const us = deadlineScopeFor('US')
    expect(us).not.toBeNull()
    expect(us!.appliesTo).toMatch(/federal/i)
    // the audit's specific finding: NSS are excluded from the EO, and the
    // private sector is not bound by it at all
    expect(us!.appliesTo).toMatch(/national security systems are excluded/i)
    expect(us!.appliesTo).toMatch(/private-sector organisations are not bound/i)
    expect(us!.sourceUrl).toMatch(/^https:\/\//)
  })

  it('distinguishes guidance from a requirement', () => {
    // The UK's jurisdiction code in this repo is 'UK' (flag code 'gb'), and
    // TIMELINE_COUNTRY_DEADLINE_YEAR is keyed the same way. The first version of
    // this scope table was hand-written in moscaClock.ts under 'GB' — a key no
    // run ever produces, so it could never have matched. Moving the table into
    // jurisdictions_*.csv, where the codes are authoritative, surfaced it.
    expect(deadlineScopeFor('US')!.force).toBe('requirement')
    expect(deadlineScopeFor('UK')!.force).toBe('guidance')
    expect(deadlineScopeFor('UK')!.appliesTo).toMatch(/not a single binding cut-off/i)
    expect(deadlineScopeFor('GB')).toBeNull()
  })

  it('reports scope for every jurisdiction that has a dated obligation', () => {
    // Any country with a deadline the clock can bind to should be able to say
    // what that deadline actually binds — otherwise the sim shows a date with
    // no scope and the learner infers universality.
    const missing = Object.keys(COUNTRY_DEADLINE_YEAR).filter((c) => !deadlineScopeFor(c))
    expect(
      missing,
      `deadline with no recorded scope: ${missing.join(', ')} — add applies_to/force to jurisdictions_*.csv`
    ).toEqual([])
  })

  it('reports an unrecorded scope as unknown rather than inventing one', () => {
    expect(deadlineScopeFor('__no_such_country__')).toBeNull()
  })
})
