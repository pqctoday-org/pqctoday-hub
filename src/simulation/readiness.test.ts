// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computeReadiness, type EdgeChoice } from './readiness'
import { ARCHITECTURES, edgeState, edgeKey } from '@/data/simArchitecture'

/** The migratable edges of a topology (PQC path + both ends ready). */
const migratableEdges = (size: keyof typeof ARCHITECTURES) => {
  const arch = ARCHITECTURES[size]
  return arch.edges.filter((e) => e.vulnerable && edgeState(arch, e) === 'migratable')
}
const vulnCount = (size: keyof typeof ARCHITECTURES) =>
  ARCHITECTURES[size].edges.filter((e) => e.vulnerable).length

/** Decide every migratable edge with one strategy. */
const decideAll = (size: keyof typeof ARCHITECTURES, choice: EdgeChoice) =>
  Object.fromEntries(migratableEdges(size).map((e) => [edgeKey(e), choice])) as Record<
    string,
    EdgeChoice
  >

describe('computeReadiness (WS-04 — two-gate, estate-grounded)', () => {
  it('exposes the topology counts: denominator is ALL vulnerable edges', () => {
    const r = computeReadiness('mid', 1, {}, 'US')
    expect(r.vulnerable).toBe(vulnCount('mid'))
    expect(r.migratable).toBe(migratableEdges('mid').length)
    // mid has residual (vendor/blocked/monitor) edges, so the ceiling is below total
    expect(r.migratable).toBeLessThan(r.vulnerable)
  })

  it('needs BOTH gates — neither activity nor decision alone migrates anything', () => {
    // decisions made, but no P5 activity done → nothing unlocked → 0
    expect(computeReadiness('mid', 0, decideAll('mid', 'hybrid'), 'US').migrated).toBe(0)
    // all activities done, but no decisions → 0
    expect(computeReadiness('mid', 1, {}, 'US').migrated).toBe(0)
  })

  it('counts an edge only when activity-unlocked AND decided', () => {
    const all = decideAll('mid', 'hybrid')
    const m = migratableEdges('mid').length
    const full = computeReadiness('mid', 1, all, 'US')
    expect(full.migrated).toBe(m)
    expect(full.pct).toBe(Math.round((m / vulnCount('mid')) * 100))
    // half the activities unlock half (floor) the migratable links, even with all decided
    const half = computeReadiness('mid', 0.5, all, 'US')
    expect(half.migrated).toBe(Math.min(m, Math.floor(0.5 * m)))
    expect(half.migrated).toBeLessThan(full.migrated)
  })

  it('residual edges keep readiness below 100% even fully migrated', () => {
    const full = computeReadiness('mid', 1, decideAll('mid', 'hybrid'), 'US')
    expect(full.pct).toBeLessThan(100)
  })

  it('non-compliant choice still migrates but lowers compliance (separate meter)', () => {
    const all = decideAll('mid', 'pure')
    // DE (BSI) requires hybrid → pure is non-compliant
    const de = computeReadiness('mid', 1, all, 'DE')
    const us = computeReadiness('mid', 1, all, 'US')
    // readiness is identical — the pure edges still count as migrated
    expect(de.migrated).toBe(us.migrated)
    expect(de.migrated).toBeGreaterThan(0)
    // but compliance differs: 0% in DE, 100% in US (CNSA 2.0 accepts pure)
    expect(de.compliancePct).toBe(0)
    expect(us.compliancePct).toBe(100)
    // hybrid is compliant in DE
    expect(computeReadiness('mid', 1, decideAll('mid', 'hybrid'), 'DE').compliancePct).toBe(100)
  })

  it('clamps out-of-range fractions and falls back to a known size', () => {
    expect(computeReadiness('mid', -1, decideAll('mid', 'hybrid'), 'US').migrated).toBe(0)
    const over = computeReadiness('mid', 2, decideAll('mid', 'hybrid'), 'US')
    expect(over.migrated).toBe(migratableEdges('mid').length)
    // unknown size falls back to the mid topology (no throw)
    expect(computeReadiness('does-not-exist', 1, {}, 'US').vulnerable).toBe(vulnCount('mid'))
  })
})
