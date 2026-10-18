// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computePosture } from './useMigrationPlan'
import { REPLACE_ASSETS, DECISIONS } from '@/data/migrationAssets'

describe('computePosture', () => {
  it('empty plan → zeroed posture', () => {
    const p = computePosture([], {})
    expect(p.plannedAssets).toEqual([])
    expect(p.planningPct).toBe(0)
    expect(p.nextMove).toBeNull()
    expect(p.waves).toEqual([])
    expect(p.cautions).toEqual([])
  })

  it('ignores unknown + duplicate ids', () => {
    const p = computePosture(['tls', 'tls', 'not-an-asset'], {})
    expect(p.plannedAssets.map((a) => a.id)).toEqual(['tls'])
  })

  it('planning coverage counts selected catalog examples, not readiness', () => {
    const p = computePosture(['tls', 'email', 'hsm'], { tls: ['Example TLS'] })
    expect(p.productSelectedN).toBe(1)
    expect(p.needsProductN).toBe(2)
    expect(p.planningPct).toBe(33)
  })

  it('counts HNDL review cues over the plan', () => {
    const p = computePosture(['tls', 'atrest'], {})
    expect(p.hndlCount).toBe(2)
  })

  it('nextMove prioritizes an item without a selected catalog example', () => {
    // certs (wave2, hybrid=ready) + hsm (wave3, roadmap=blocked)
    const p = computePosture(['hsm', 'certs'], { certs: ['My CA'] })
    expect(p.nextMove?.asset.id).toBe('hsm')
    expect(p.nextMove?.product).toBeUndefined()
  })

  it('nextMove is null when nothing is planned', () => {
    expect(computePosture([], {}).nextMove).toBeNull()
  })

  it('waves only include non-empty groups, ordered', () => {
    const p = computePosture(['atrest', 'tls'], {}) // wave4 + wave1
    expect(p.waves.map((w) => w.wave)).toEqual([1, 4])
  })

  it('cautions = interim-control examples', () => {
    const p = computePosture(['email', 'tls'], {})
    expect(p.cautions.map((a) => a.id)).toEqual(['email'])
  })

  it('plannedAssets sorted by teaching wave', () => {
    const ids = REPLACE_ASSETS.map((a) => a.id)
    const p = computePosture([...ids].reverse(), {})
    for (let i = 1; i < p.plannedAssets.length; i++) {
      const prev = p.plannedAssets[i - 1]
      const cur = p.plannedAssets[i]
      expect(prev.wave <= cur.wave).toBe(true)
    }
  })

  it('every asset decision references a real decision (data integrity)', () => {
    for (const a of REPLACE_ASSETS) expect(DECISIONS[a.decision]).toBeDefined()
  })
})
