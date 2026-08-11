// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildObligations,
  groupObligations,
  milestonesFor,
  resolveRequirements,
  summarize,
  COLLAPSED_BY_DEFAULT,
} from './obligationsModel'
import type { ComplianceFramework } from '@/data/complianceData'
import { complianceFrameworks } from '@/data/complianceData'

const EU_FINANCE = {
  country: 'France',
  industry: 'Finance & Insurance',
  region: 'eu' as const,
}

function frameworkById(id: string): ComplianceFramework {
  const fw = complianceFrameworks.find((f) => f.id === id)
  if (!fw) throw new Error(`fixture row ${id} missing from the catalogue`)
  return fw
}

describe('resolveRequirements', () => {
  it('takes the union across citations, not just the first that resolves', () => {
    // ANSSI cites four of its own papers. The detail drawer resolves only the
    // first; a register that did the same would under-report the row.
    const anssi = frameworkById('ANSSI')
    const { count, sources } = resolveRequirements(anssi)
    expect(sources.length).toBeGreaterThan(1)
    const firstOnly = resolveRequirements({ ...anssi, libraryRefs: [anssi.libraryRefs[0]] }).count
    expect(count).toBeGreaterThan(firstOnly)
  })

  it('counts a repeated citation once', () => {
    const dora = frameworkById('DORA')
    const once = resolveRequirements(dora)
    const twice = resolveRequirements({
      ...dora,
      libraryRefs: [...dora.libraryRefs, ...dora.libraryRefs],
    })
    expect(twice.count).toBe(once.count)
    expect(twice.sources).toEqual(once.sources)
  })

  it('omits citations that carry no extracted requirements', () => {
    const fw = { ...frameworkById('DORA'), libraryRefs: ['DORA', 'not-a-real-ref-id'] }
    const { sources } = resolveRequirements(fw)
    expect(sources).not.toContain('not-a-real-ref-id')
  })

  it('reports zero for a row whose citations resolve to nothing', () => {
    // Common Criteria's own row cites a document with no extracted
    // requirements — the empty state has to be a real, renderable case.
    const fw = { ...frameworkById('DORA'), libraryRefs: [] }
    expect(resolveRequirements(fw)).toEqual({ count: 0, sources: [] })
  })
})

describe('milestonesFor', () => {
  it('reads the structured column and sorts ascending', () => {
    const eidas = frameworkById('EIDAS')
    const years = milestonesFor(eidas).map((m) => m.year)
    expect(years.length).toBeGreaterThan(1)
    expect([...years].sort((a, b) => a - b)).toEqual(years)
  })

  it('returns nothing for an ongoing row rather than inventing a date', () => {
    // GDPR binds continuously and states no milestone. Prose-parsing its
    // deadline text is how a mock ends up asserting "Art. 32, 2018".
    expect(milestonesFor(frameworkById('GDPR'))).toEqual([])
  })
})

describe('buildObligations', () => {
  it('returns the engine result set with reasons preserved verbatim', () => {
    const rows = buildObligations(EU_FINANCE)
    expect(rows.length).toBeGreaterThan(20)
    const anssi = rows.find((r) => r.framework.id === 'ANSSI')
    expect(anssi?.tier).toBe('mandatory')
    expect(anssi?.reason).toBe('Your regulator: ANSSI')
  })

  it('tiers national regulators carried as regulatory_body as mandatory', () => {
    // Regression companion to the regulatorMap fix: ACPR and AMF are French
    // regulators and must not read as foreign authorities here.
    const rows = buildObligations(EU_FINANCE)
    for (const id of ['ACPR', 'AMF-FR']) {
      expect(rows.find((r) => r.framework.id === id)?.tier).toBe('mandatory')
    }
  })

  it('is empty when the profile carries no scope at all', () => {
    expect(buildObligations({ country: null, industry: null, region: null })).toEqual([])
  })
})

describe('groupObligations', () => {
  it('orders bands by tier and drops empty ones', () => {
    const groups = groupObligations(buildObligations(EU_FINANCE))
    expect(groups.map((g) => g.tier)).toEqual(['mandatory', 'recognized', 'advisory'])
    for (const g of groups) expect(g.rows.length).toBeGreaterThan(0)
  })

  it('sorts dated rows before undated ones within a band', () => {
    const groups = groupObligations(buildObligations(EU_FINANCE))
    const mandatory = groups.find((g) => g.tier === 'mandatory')!
    const firstUndated = mandatory.rows.findIndex((r) => r.framework.deadlineStart === undefined)
    if (firstUndated !== -1) {
      const after = mandatory.rows.slice(firstUndated)
      expect(after.every((r) => r.framework.deadlineStart === undefined)).toBe(true)
    }
  })

  it('collapses the advisory band by default, never the mandatory one', () => {
    expect(COLLAPSED_BY_DEFAULT.has('advisory')).toBe(true)
    expect(COLLAPSED_BY_DEFAULT.has('mandatory')).toBe(false)
    expect(COLLAPSED_BY_DEFAULT.has('recognized')).toBe(false)
  })
})

describe('summarize', () => {
  it('counts obligations per tier', () => {
    const rows = buildObligations(EU_FINANCE)
    const s = summarize(rows)
    expect(s.total).toBe(rows.length)
    expect(Object.values(s.byTier).reduce((a, b) => a + b, 0)).toBe(rows.length)
  })

  it('reports how many in scope actually mandate PQC', () => {
    // The headline the page exists to protect: for an EU finance profile the
    // engine-matched set mandates PQC nowhere. If this ever becomes non-zero
    // it is a data change worth reading, not a test to relax.
    const s = summarize(buildObligations(EU_FINANCE))
    expect(s.pqcMandated).toBe(0)
  })
})
