// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { claimsWithTopic, getOpenClaim } from '@/data/openClaimsData'
import { headStatement } from '@/data/openClaimsView'
import {
  CRQC_ESTIMATES,
  formatEstimateYears,
  getCrqcForecast,
  getCrqcMigrationDeadlines,
} from './quantumConstants'

describe('CRQC_ESTIMATES (the Threats sources list)', () => {
  it('every source label is unique (the list keys rows by it)', () => {
    const labels = CRQC_ESTIMATES.map((e) => e.source)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it('every entry has a sane range, an https source link and a review date', () => {
    for (const e of CRQC_ESTIMATES) {
      expect(e.yearLow, e.source).toBeLessThanOrEqual(e.yearHigh)
      expect(e.url, e.source).toMatch(/^https:\/\//)
      expect(e.lastReviewed, e.source).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      expect(e.confidence.trim(), e.source).not.toBe('')
      expect(e.notes.trim(), e.source).not.toBe('')
    }
  })

  it('a government migration entry is never labelled as a forecast of arrival', () => {
    for (const e of getCrqcMigrationDeadlines())
      expect(e.confidence + ' ' + e.notes, e.source).not.toMatch(/predicts? (a )?CRQC arrival/i)
  })

  it('BSI shows the dates its guideline gives, with no 2040', () => {
    const bsi = CRQC_ESTIMATES.filter((e) => e.source.startsWith('BSI'))
    expect(bsi.length).toBeGreaterThan(0)
    for (const e of bsi) {
      expect(e.yearHigh, e.source).toBeLessThanOrEqual(2035)
      expect(e.source, e.source).toMatch(/TR-02102-1/)
    }
  })

  it('NSA names both documents, marks the newer one, and keeps the 2030–2033 range', () => {
    const nsa = CRQC_ESTIMATES.find((e) => e.source.startsWith('NSA CNSA 2.0'))!
    expect(nsa.source).toMatch(/2022.*FAQ version 2\.1, December 2024/)
    expect(nsa.notes).toMatch(/version 1\.0/)
    expect(nsa.notes).toMatch(/December 2024 FAQ is the newer/)
    expect([nsa.yearLow, nsa.yearHigh]).toEqual([2030, 2033])
    expect(nsa.kind).toBe('migration-deadline')
  })

  it('ANSSI shows one year, 2030, from its FAQ, and marks the 2022 paper as still standing', () => {
    const a = CRQC_ESTIMATES.find((e) => e.source.startsWith('ANSSI'))!
    expect(a.source).toBe('ANSSI France (2022 paper; current FAQ)')
    expect([a.yearLow, a.yearHigh]).toEqual([2030, 2030])
    expect(a.notes).toMatch(/2022 position paper .* still stands/)
    expect(a.notes).toMatch(/not a regulatory obligation today/)
    expect(a.kind).toBe('migration-deadline')
  })
})

describe('withdrawn range', () => {
  it('the site publishes no CRQC range of its own: only the survey is an arrival forecast', () => {
    expect(CRQC_ESTIMATES.some((e) => e.kind === 'site-derived-scenario')).toBe(false)
    expect(CRQC_ESTIMATES.some((e) => e.yearLow === 2029 && e.yearHigh === 2036)).toBe(false)
    const arrival = CRQC_ESTIMATES.filter((e) => e.kind === 'arrival-forecast')
    expect(arrival.map((e) => e.source)).toEqual(['Global Risk Institute (2025)'])
  })
})

describe('formatEstimateYears', () => {
  it('prints a range, or a single year when both ends are equal', () => {
    expect(formatEstimateYears({ yearLow: 2030, yearHigh: 2035 })).toBe('2030–2035')
    expect(formatEstimateYears({ yearLow: 2030, yearHigh: 2030 })).toBe('2030')
  })
  it("the forecast wording is the survey's own words, with no year span and no invented claim", () => {
    const f = getCrqcForecast()
    expect(f.label).toContain('28\u201349%')
    expect(f.label).toContain('51\u201370%')
    expect(f.label).toContain('26 experts')
    expect(f.label).not.toMatch(/20[34]\d/) // no 2030-2041 style span in the survey's words
    expect(f.headline).toBe('28\u201349%')
    const gri = CRQC_ESTIMATES.find((e) => e.source.startsWith('Global Risk Institute'))!
    expect(gri.notes).not.toMatch(/Majority consider CRQC by 2035/)
  })

  it("the calculators' years are labelled as a planning range set by this site", () => {
    const f = getCrqcForecast()
    expect(f.rangeLabel).toBe(`planning range ${f.low}\u2013${f.high}, set by this site`)
    expect(f.low).toBeLessThan(f.planningYear)
    expect(f.planningYear).toBeLessThan(f.high)
  })
})

describe('CRQC_ESTIMATES and the published claims', () => {
  it('every estimate names a published claim, and no two estimates share one', () => {
    const ids = CRQC_ESTIMATES.map((e) => e.claimId)
    for (const e of CRQC_ESTIMATES) {
      expect(e.claimId, e.source).toBeTruthy()
      expect(getOpenClaim(e.claimId!), `${e.source} -> ${e.claimId}`).toBeDefined()
    }
    expect(new Set(ids).size).toBe(ids.length)
  })

  it("the estimate's own source link is one of the sources of the claim shown for it", () => {
    for (const e of CRQC_ESTIMATES) {
      const shown = headStatement(e.claimId!)!
      const own = getOpenClaim(e.claimId!)!
      const links = [...shown.sources, ...own.sources].map((s) => s.url)
      expect(links, e.source).toContain(e.url)
    }
  })

  it('a forecast is an open question; a migration deadline is never marked as a forecast', () => {
    for (const e of CRQC_ESTIMATES) {
      const claim = headStatement(e.claimId!)!
      if (e.kind === 'arrival-forecast') expect(claim.state, e.source).toBe('Open')
      else expect(claim.state, e.source).toBe('Settled')
    }
  })

  it('every estimate stands on a claim tagged as an estimate, and its newer statement as an update', () => {
    for (const e of CRQC_ESTIMATES) {
      expect(getOpenClaim(e.claimId!)!.topics, e.source).toContain('estimates')
      const shown = headStatement(e.claimId!)!
      if (shown.id !== e.claimId) expect(shown.topics, e.source).toContain('estimate-update')
    }
  })

  it('every claim that stands for an estimate is tagged for it, and the open questions are the tagged ones', () => {
    const tagged = new Set(claimsWithTopic('estimates').map((c) => c.id))
    for (const e of CRQC_ESTIMATES) expect(tagged.has(e.claimId!), e.source).toBe(true)
    expect(claimsWithTopic('open-questions').every((c) => c.state === 'Open')).toBe(true)
  })
})
