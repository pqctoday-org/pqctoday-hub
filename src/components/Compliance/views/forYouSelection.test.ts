// SPDX-License-Identifier: AGPL-3.0-only
// One test per persona. Each checks the rows, their order and their limits against what the
// view's own selection gives for the same input.
import { describe, it, expect } from 'vitest'
import { complianceFrameworks, type ComplianceFramework } from '@/data/complianceData'
import type { ApplicabilityResult } from '@/utils/applicabilityEngine'
import type { DerivedResult } from '@/utils/trustPathTraversal'
import {
  ARCHITECT_PER_REGION,
  DEVELOPER_ROWS,
  OPS_PHASE_LANE,
  OPS_TABLE_ROWS,
  PQC_EXPECTATION,
  REGION_ORDER,
  applicableFrameworks,
  applicableInTierOrder,
  forYouViewRows,
  frameworksByPhase,
  frameworksByRegion,
  ruleMakerBodies,
  sortedByConfidence,
} from './forYouSelection'

const active = complianceFrameworks.filter((f) => f.status !== 'deprecated')
const TIERS = ['mandatory', 'recognized', 'cross-border', 'advisory'] as const
const results: ApplicabilityResult<ComplianceFramework>[] = active.slice(0, 120).map((item, i) => ({
  item,
  tier: TIERS[i % 4],
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
const ids = (rows: { id: string }[]) => rows.map((r) => r.id)

describe('For You rows by persona', () => {
  it('default panel: the applicable set in tier order, then the derived frameworks', () => {
    const rows = forYouViewRows(null, results, derived)
    expect(ids(rows.slice(0, -1))).toEqual(applicableInTierOrder(results).map((r) => r.item.id))
    expect(rows[rows.length - 1]).toMatchObject({ id: 'DERIVED-X', tier: 'derived' })
    expect(rows[rows.length - 1].reason).toMatch(/trust path/)
  })

  it('executive: the applicable set in tier order, with derived frameworks', () => {
    const rows = forYouViewRows('executive', results, derived)
    expect(ids(rows.slice(0, -1))).toEqual(applicableInTierOrder(results).map((r) => r.item.id))
    expect(rows[rows.length - 1].id).toBe('DERIVED-X')
  })

  it('grc: sorted by data confidence, least first, frameworks without a score last', () => {
    const rows = forYouViewRows('grc', results, derived)
    expect(ids(rows.slice(0, -1))).toEqual(
      sortedByConfidence(results, 'ascending').map((r) => r.item.id)
    )
    expect(rows[rows.length - 1].id).toBe('DERIVED-X')
    const scores = rows.map((r) => r.confidenceScore ?? Number.MAX_SAFE_INTEGER)
    expect(scores).toEqual([...scores].sort((a, b) => a - b))
  })

  it('researcher: sorted by data confidence, most first, frameworks without a score last', () => {
    const rows = forYouViewRows('researcher', results, derived)
    expect(ids(rows.slice(0, -1))).toEqual(
      sortedByConfidence(results, 'descending').map((r) => r.item.id)
    )
    expect(rows[rows.length - 1].id).toBe('DERIVED-X')
    const scores = rows.map((r) => r.confidenceScore ?? -1)
    expect(scores).toEqual([...scores].sort((a, b) => b - a))
  })

  it('architect: up to the per-region limit, in region order, each framework with its tier', () => {
    const rows = forYouViewRows('architect', results, [])
    const byRegion = frameworksByRegion(applicableFrameworks(results))
    const expected = REGION_ORDER.filter((r) => byRegion.has(r)).flatMap((region) =>
      (byRegion.get(region) ?? []).slice(0, ARCHITECT_PER_REGION).map((fw) => `${region}|${fw.id}`)
    )
    expect(rows.map((r) => `${r.section}|${r.id}`)).toEqual(expected)
    expect(rows.every((r) => r.tier !== undefined)).toBe(true)
  })

  it('developer: the first twelve applicable frameworks, in tier order', () => {
    const rows = forYouViewRows('developer', results, [])
    expect(ids(rows)).toEqual(
      applicableFrameworks(results)
        .slice(0, DEVELOPER_ROWS)
        .map((f) => f.id)
    )
  })

  it('ops: deadline lanes of the per-phase limit, in phase order, then the table of its limit', () => {
    const rows = forYouViewRows('ops', results, [])
    const byPhase = frameworksByPhase(applicableFrameworks(results))
    const lanes = [...byPhase.keys()].length
    const lanesRows = rows.filter((r) => r.section !== 'table')
    const tableRows = rows.filter((r) => r.section === 'table')
    expect(lanesRows.length).toBeGreaterThan(0)
    expect(lanes).toBeGreaterThan(0)
    for (const phase of new Set(lanesRows.map((r) => r.section))) {
      expect(lanesRows.filter((r) => r.section === phase).length).toBe(
        Math.min(OPS_PHASE_LANE, byPhase.get(phase as never)?.length ?? 0)
      )
    }
    expect(ids(tableRows)).toEqual(
      applicableFrameworks(results)
        .slice(0, OPS_TABLE_ROWS)
        .map((f) => f.id)
    )
  })

  it('cert-engineer: only PQC-expecting certification schemes, in the engine order', () => {
    const rows = forYouViewRows('cert-engineer', results, [])
    const expected = results
      .map((r) => r.item)
      .filter((fw) => fw.bodyType === 'certification_body')
      .filter((fw) => fw.pqcRequirement && fw.pqcRequirement in PQC_EXPECTATION)
      .map((fw) => fw.id)
    expect(ids(rows)).toEqual(expected)
  })

  it('curious: the six enforcement bodies with the most PQC-requiring frameworks, earliest first', () => {
    const rows = forYouViewRows('curious', results, [])
    const bodies = ruleMakerBodies()
    expect(ids(rows)).toEqual(bodies.map((b) => b.body))
    expect(rows.length).toBeLessThanOrEqual(6)
    const first = rows[0]
    const independentCount = complianceFrameworks.filter(
      (f) => f.requiresPQC && f.enforcementBody?.trim() === first.id
    ).length
    expect(first.reason).toContain(`${independentCount} framework`)
  })
})
