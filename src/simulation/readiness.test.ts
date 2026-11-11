// SPDX-License-Identifier: AGPL-3.0-only
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
    // Existing named choices exceed half-effort capacity. No arbitrary subset earns credit.
    const half = computeReadiness('mid', 0.5, all, 'US')
    expect(half.unlocked).toBe(Math.floor(0.5 * m))
    expect(half.migrated).toBe(0)
    expect(half.planning.overCapacity).toBe(true)
    expect(half.planning.creditedKeys).toEqual([])
    expect(half.planning.selectedKeys).toEqual(full.planning.selectedKeys)
  })

  it('residual edges keep readiness below 100% even fully migrated', () => {
    const full = computeReadiness('mid', 1, decideAll('mid', 'hybrid'), 'US')
    expect(full.pct).toBeLessThan(100)
  })

  it('non-compliant choice still migrates but lowers compliance (separate meter)', () => {
    const all = decideAll('mid', 'pure')
    // DE (BSI guidance) expects hybrid → pure departs from it
    const de = computeReadiness('mid', 1, all, 'DE')
    const us = computeReadiness('mid', 1, all, 'US')
    // readiness is identical — the pure edges still count as migrated
    expect(de.migrated).toBe(us.migrated)
    expect(de.migrated).toBeGreaterThan(0)
    // but strategy alignment differs: 0% in DE, 100% in US (CNSA 2.0 accepts pure)
    expect(de.alignmentPct).toBe(0)
    expect(us.alignmentPct).toBe(100)
    // hybrid is aligned in DE
    expect(computeReadiness('mid', 1, decideAll('mid', 'hybrid'), 'DE').alignmentPct).toBe(100)
  })

  it('clamps out-of-range fractions and falls back to a known size', () => {
    expect(computeReadiness('mid', -1, decideAll('mid', 'hybrid'), 'US').migrated).toBe(0)
    const over = computeReadiness('mid', 2, decideAll('mid', 'hybrid'), 'US')
    expect(over.migrated).toBe(migratableEdges('mid').length)
    // unknown size falls back to the mid topology (no throw)
    expect(computeReadiness('does-not-exist', 1, {}, 'US').vulnerable).toBe(vulnCount('mid'))
  })

  it('restores exact named credit after Undo or restored effort without choosing a first-N subset', () => {
    const all = decideAll('small', 'hybrid')
    const original = { ...all }
    const full = computeReadiness('small', 1, all, 'US')
    expect(full.planning.creditedKeys).toEqual([
      'admin-vpn-IKEv2',
      'cdn-app-TLS',
      'user-cdn-TLS 1.3',
    ])
    expect(computeReadiness('small', 0.5, all, 'US').planning.creditedKeys).toEqual([])
    const undone = { ...all }
    delete undone['cdn-app-TLS']
    delete undone['user-cdn-TLS 1.3']
    const remaining = computeReadiness('small', 0.5, undone, 'US')
    expect(remaining.planning.creditedKeys).toEqual(['admin-vpn-IKEv2'])
    expect(remaining.planning.groups['hndl-critical'].completedKeys).toEqual(['admin-vpn-IKEv2'])
    expect(remaining.planning.groups['tnfl-critical'].completedKeys).toEqual(['admin-vpn-IKEv2'])
    expect(remaining.planning.groups['hndl-general'].completedKeys).toEqual([])
    expect(computeReadiness('small', 1, all, 'US').planning.creditedKeys).toEqual(
      full.planning.creditedKeys
    )
    expect(all).toEqual(original)
  })

  it('distinguishes actual general and critical identities even when the headline percentage matches', () => {
    // Both are actual eligible C+A links, but their approved case tiers differ.
    const general = computeReadiness('small', 1, { 'user-cdn-TLS 1.3': 'hybrid' }, 'US')
    const critical = computeReadiness('small', 1, { 'admin-vpn-IKEv2': 'hybrid' }, 'US')
    expect(general.migrated).toBe(1)
    expect(critical.migrated).toBe(1)
    expect(general.pct).toBe(critical.pct)
    expect(general.planning.groups['hndl-critical'].progress).toBe(0)
    expect(general.planning.groups['tnfl-critical'].progress).toBe(0)
    expect(critical.planning.groups['hndl-critical'].progress).toBe(0.5)
    expect(critical.planning.groups['tnfl-critical'].progress).toBeCloseTo(1 / 3)
    expect(general.planning.groups['hndl-general'].completedKeys).toEqual(['user-cdn-TLS 1.3'])
    expect(critical.planning.groups['hndl-general'].completedKeys).toEqual([])
    // Neither can complete unresolved declared dependencies.
    expect(general.planning.criticalDone).toBe(false)
    expect(critical.planning.criticalDone).toBe(false)
  })

  it('does not count malformed, unknown or unavailable saved choices, or evaluate their alignment', () => {
    const raw = { 'user-cdn-TLS 1.3': 'invalid', 'app-db-TLS (wire)': 'pure', obsolete: 'hybrid' }
    const result = computeReadiness('small', 1, raw as Record<string, EdgeChoice>, 'DE')
    expect(result).toMatchObject({ migrated: 0, pct: 0, alignmentPct: null, evaluated: 0 })
    expect(result.planning).toMatchObject({
      invalidChoiceKeys: ['user-cdn-TLS 1.3'],
      unknownKeys: ['obsolete'],
      unavailableKeys: ['app-db-TLS (wire)'],
    })
    expect(raw).toEqual({
      'user-cdn-TLS 1.3': 'invalid',
      'app-db-TLS (wire)': 'pure',
      obsolete: 'hybrid',
    })
  })

  it('keeps jurisdiction alignment independent when all choices lose effort credit', () => {
    const all = decideAll('small', 'pure')
    const de = computeReadiness('small', 0, all, 'DE')
    const us = computeReadiness('small', 0, all, 'US')
    expect(de.migrated).toBe(0)
    expect(us.migrated).toBe(0)
    expect(de.evaluated).toBe(3)
    expect(us.evaluated).toBe(3)
    expect(de.alignmentPct).toBe(0)
    expect(us.alignmentPct).toBe(100)
  })
})
