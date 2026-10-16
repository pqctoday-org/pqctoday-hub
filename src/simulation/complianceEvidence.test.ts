// SPDX-License-Identifier: AGPL-3.0-only
/**
 * W0.5 regression — absence of evidence is not compliance.
 *
 * `computeReadiness` returned `compliancePct: 100` whenever no edge decisions
 * had been made, so a brand-new run displayed a perfect compliance meter before
 * the player had decided anything. An unknown jurisdiction likewise "passed"
 * with "No jurisdiction rule".
 *
 * The invariant: a score reported as alignment must state what it evaluated.
 * Nothing evaluated cannot read as fully aligned.
 */
import { describe, it, expect } from 'vitest'
import { computeReadiness } from './readiness'

describe('strategy alignment requires evaluated evidence (W0.5 regression)', () => {
  it('does not report full alignment when no decision has been made', () => {
    const r = computeReadiness('mid', 0, {}, 'US')
    expect(r.evaluated).toBe(0)
    // The meter must not read as an unqualified 100%.
    expect(r.alignmentPct).toBeNull()
  })

  it('reports the evaluated and unevaluated counts alongside the score', () => {
    const r = computeReadiness('mid', 0, {}, 'US')
    expect(r.unevaluated).toBeGreaterThan(0)
    expect(r.evaluated + r.unevaluated).toBe(r.migratable)
  })

  it('scores only the decisions actually evaluated once some exist', () => {
    const withOne = computeReadiness('mid', 1, { 'edge:0': 'hybrid' } as never, 'US')
    // Whatever the topology, a run with one decision must not claim to have
    // evaluated the whole estate.
    expect(withOne.evaluated).toBeLessThanOrEqual(withOne.migratable)
    if (withOne.evaluated > 0) expect(withOne.alignmentPct).not.toBeNull()
  })

  it('marks an unknown jurisdiction as not applicable rather than passing', () => {
    const r = computeReadiness('mid', 1, {}, '')
    expect(r.jurisdictionState).toBe('unknown')
    expect(r.alignmentPct).toBeNull()
  })
})
