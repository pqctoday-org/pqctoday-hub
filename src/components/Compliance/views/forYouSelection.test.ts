// SPDX-License-Identifier: AGPL-3.0-only
// One test per persona: the rows the For You export lists for that persona are the rows its
// view selects (the same helpers the views call).
import { describe, it, expect } from 'vitest'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import type { ApplicabilityResult } from '@/utils/applicabilityEngine'
import type { DerivedResult } from '@/utils/trustPathTraversal'
import { PQC_EXPECTATION, REGION_ORDER, forYouViewRows, ruleMakerBodies } from './forYouSelection'

const active = complianceFrameworks.filter((f) => f.status !== 'deprecated')
const results: ApplicabilityResult<ComplianceFramework>[] = active.slice(0, 80).map((item, i) => ({
  item,
  tier: (['mandatory', 'recognized', 'cross-border', 'advisory'] as const)[i % 4],
  reason: `reason ${i}`,
}))
const derived: DerivedResult[] = [
  {
    standardId: 'DERIVED-X',
    standardLabel: 'Derived X',
    paths: [],
    bestPath: {} as never,
    derivedTier: 'derived',
  },
]
const count = (rows: { section: string }[], section: string) =>
  rows.filter((r) => r.section === section).length

describe('For You rows by persona', () => {
  it('default panel: the applicable set in full, then the derived frameworks', () => {
    const rows = forYouViewRows(null, results, derived)
    expect(rows).toHaveLength(results.length + 1)
    expect(rows[rows.length - 1].id).toBe('DERIVED-X')
    expect(rows[rows.length - 1].tier).toBe('derived')
  })

  it('executive: the applicable set in full, with derived frameworks', () => {
    const rows = forYouViewRows('executive', results, derived)
    expect(rows.some((r) => r.id === 'DERIVED-X')).toBe(true)
    expect(rows.filter((r) => r.section === '').length).toBe(results.length)
  })

  it('grc: the applicable set in full, with derived frameworks', () => {
    expect(forYouViewRows('grc', results, derived).some((r) => r.id === 'DERIVED-X')).toBe(true)
  })

  it('researcher: the applicable set in full, with derived frameworks', () => {
    expect(forYouViewRows('researcher', results, derived).some((r) => r.id === 'DERIVED-X')).toBe(
      true
    )
  })

  it('architect: up to eight frameworks per region, in region order, each with its tier', () => {
    const rows = forYouViewRows('architect', results, derived)
    const sections = [...new Set(rows.map((r) => r.section))]
    expect(sections.every((s) => (REGION_ORDER as string[]).includes(s))).toBe(true)
    expect(sections.map((s) => (REGION_ORDER as string[]).indexOf(s))).toEqual(
      [...sections.map((s) => (REGION_ORDER as string[]).indexOf(s))].sort((a, b) => a - b)
    )
    for (const s of sections) expect(count(rows, s)).toBeLessThanOrEqual(8)
    expect(rows.every((r) => r.tier !== undefined)).toBe(true)
  })

  it('developer: the first twelve applicable frameworks in tier order', () => {
    const rows = forYouViewRows('developer', results, derived)
    expect(rows.length).toBe(12)
    expect(rows[0].section).toBe('')
  })

  it('ops: deadline phase lanes of up to four, then the deadline table of up to ten', () => {
    const rows = forYouViewRows('ops', results, derived)
    expect(count(rows, 'table')).toBeLessThanOrEqual(10)
    const lanes = rows.filter((r) => r.section !== 'table')
    for (const phase of new Set(lanes.map((r) => r.section))) {
      expect(count(lanes, phase)).toBeLessThanOrEqual(4)
    }
    expect(
      rows.slice(rows.findIndex((r) => r.section === 'table')).every((r) => r.section === 'table')
    ).toBe(true)
  })

  it('cert-engineer: only certification schemes that expect PQC', () => {
    const rows = forYouViewRows('cert-engineer', results, derived)
    const byId = new Map(active.map((f) => [f.id, f]))
    for (const r of rows) {
      const fw = byId.get(r.id)
      expect(fw?.bodyType).toBe('certification_body')
      expect(fw?.pqcRequirement && fw.pqcRequirement in PQC_EXPECTATION).toBe(true)
    }
  })

  it('curious: the enforcement bodies of the PQC-requiring frameworks, six at most', () => {
    const rows = forYouViewRows('curious', results, derived)
    expect(rows.length).toBeLessThanOrEqual(6)
    expect(rows.map((r) => r.id)).toEqual(ruleMakerBodies().map((b) => b.body))
    expect(new Set(rows.map((r) => r.id)).size).toBe(rows.length)
  })
})
