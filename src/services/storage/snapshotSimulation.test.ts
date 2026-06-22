// SPDX-License-Identifier: GPL-3.0-only
/**
 * WS-08 — the app-wide snapshot (Drive/backup) includes the Migration Simulation
 * run, so a signed-in player's run resumes across devices.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { UnifiedStorageService } from './UnifiedStorageService'
import { useSimulationStore } from '@/store/useSimulationStore'

const sim = () => useSimulationStore.getState()

beforeEach(() => sim().reset())

describe('AppSnapshot ↔ simulation store', () => {
  it('captures the simulation run into the snapshot', () => {
    sim().setSector('financial')
    sim().setSize('global')
    sim().autoCompleteSteps(['p1::/learn/data-asset-sensitivity'])
    const snap = UnifiedStorageService.exportSnapshot()
    expect(snap._version).toBe(2)
    expect(snap.stores.simulation).toBeDefined()
    expect(snap.stores.simulation!.sector).toBe('financial')
    expect(snap.stores.simulation!.size).toBe('global')
    expect(snap.stores.simulation!.auto).toContain('p1::/learn/data-asset-sensitivity')
  })

  it('restores the simulation run from a snapshot', () => {
    sim().setSector('telecom')
    sim().applyQuarter({
      checks: { ...sim().checks, p0: 2 },
      crqcShift: 1,
      year: 2030,
      q: 2,
      newEvents: [],
    })
    const snap = UnifiedStorageService.exportSnapshot()

    sim().reset()
    expect(sim().sector).not.toBe('telecom')

    UnifiedStorageService.restoreSnapshot(snap)
    expect(sim().sector).toBe('telecom')
    expect(sim().year).toBe(2030)
    expect(sim().q).toBe(2)
    expect(sim().checks.p0).toBe(2)
    expect(sim().crqcShift).toBe(1)
  })

  it('tolerates a legacy snapshot with no simulation store (back-compat)', () => {
    const snap = UnifiedStorageService.exportSnapshot()
    delete (snap.stores as { simulation?: unknown }).simulation
    sim().setSector('government')
    // restoring a sim-less snapshot must not throw and must leave the run intact
    expect(() => UnifiedStorageService.restoreSnapshot(snap)).not.toThrow()
    expect(sim().sector).toBe('government')
    // validation reports it as a (skippable) missing store, not an error
    const res = UnifiedStorageService.validateSnapshot(snap)
    expect(res.valid).toBe(true)
  })
})
