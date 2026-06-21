// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computePosture } from './useMigrationPlan'
import { REPLACE_ASSETS, DECISIONS } from '@/data/migrationAssets'

describe('computePosture', () => {
  it('empty plan → zeroed posture', () => {
    const p = computePosture([], {})
    expect(p.plannedAssets).toEqual([])
    expect(p.readyPct).toBe(0)
    expect(p.nearestYear).toBeNull()
    expect(p.nextMove).toBeNull()
    expect(p.waves).toEqual([])
    expect(p.gaps).toEqual([])
  })

  it('ignores unknown + duplicate ids', () => {
    const p = computePosture(['tls', 'tls', 'not-an-asset'], {})
    expect(p.plannedAssets.map((a) => a.id)).toEqual(['tls'])
  })

  it('readiness counts only GA-path decisions', () => {
    // tls=dropin(ready), email=mitigate(blocked), hsm=roadmap(blocked)
    const p = computePosture(['tls', 'email', 'hsm'], {})
    expect(p.readyN).toBe(1)
    expect(p.blockedN).toBe(2)
    expect(p.readyPct).toBe(33)
    expect(p.blockedPct).toBe(67)
  })

  it('hndlCount + nearestYear computed over plan', () => {
    const p = computePosture(['tls', 'atrest'], {})
    // tls hndl(2025), atrest hndl(2035)
    expect(p.hndlCount).toBe(2)
    expect(p.nearestYear).toBe(2025)
    expect(p.nearestAsset?.id).toBe('tls')
  })

  it('nextMove = first ready by (wave, year), carries chosen product', () => {
    // certs (wave2, hybrid=ready) + hsm (wave3, roadmap=blocked)
    const p = computePosture(['hsm', 'certs'], { certs: ['My CA'] })
    expect(p.nextMove?.asset.id).toBe('certs')
    expect(p.nextMove?.product).toBe('My CA')
  })

  it('nextMove is null when nothing ready', () => {
    const p = computePosture(['email', 'hsm'], {}) // mitigate + roadmap
    expect(p.nextMove).toBeNull()
  })

  it('waves only include non-empty groups, ordered', () => {
    const p = computePosture(['atrest', 'tls'], {}) // wave4 + wave1
    expect(p.waves.map((w) => w.wave)).toEqual([1, 4])
  })

  it('gaps = mitigate assets', () => {
    const p = computePosture(['email', 'tls'], {})
    expect(p.gaps.map((a) => a.id)).toEqual(['email'])
  })

  it('plannedAssets sorted by wave then year', () => {
    const ids = REPLACE_ASSETS.map((a) => a.id)
    const p = computePosture([...ids].reverse(), {})
    for (let i = 1; i < p.plannedAssets.length; i++) {
      const prev = p.plannedAssets[i - 1]
      const cur = p.plannedAssets[i]
      expect(
        prev.wave < cur.wave || (prev.wave === cur.wave && prev.cnsaYear <= cur.cnsaYear)
      ).toBe(true)
    }
  })

  it('every asset decision references a real decision (data integrity)', () => {
    for (const a of REPLACE_ASSETS) expect(DECISIONS[a.decision]).toBeDefined()
  })
})
