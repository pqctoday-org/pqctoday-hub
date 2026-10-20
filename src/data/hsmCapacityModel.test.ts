// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { computeScenarios, distributeInventory, type HsmScenarioInputs } from './hsmCapacityModel'
import {
  USE_CASES,
  CLASSICAL_HSM_DEFAULT,
  PQC_HSM_DEFAULT,
  PAYMENT_HSM_DEFAULT,
} from './hsmCapacityDefaults'

const base: HsmScenarioInputs = {
  useCases: USE_CASES,
  state: { tls: { enabled: true, tps: 1000 } },
  classical: CLASSICAL_HSM_DEFAULT,
  pqc: PQC_HSM_DEFAULT,
  redundancy: 'n+1',
  hsmsPerLocation: { today: 0, tomorrow: 0, upgraded: 2 },
  numLocations: 3,
  inventoryTotal: 10,
}

describe('approved HSM model regressions', () => {
  it('keeps ten devices across three sites as 4/3/3, not twelve', () => {
    const r = computeScenarios(base)[0]
    expect(r.siteAllocations).toEqual([4, 3, 3])
    expect(r.deployedHsms).toBe(10)
    expect(r.perSiteTps).toBe(1000)
    expect(r.aggregateTps).toBe(3000)
  })
  it('does not let a passing aggregate hide a site shortfall', () => {
    // Classical TLS costs 1/20k + 1/10k = .00015 device-seconds per transaction.
    // 14k TPS → 2.1 nominal devices → ceil(2.1/.7)=3 → N+1=4 at EACH site.
    const r = computeScenarios({ ...base, state: { tls: { enabled: true, tps: 14000 } } })[0]
    expect(r.perLocationRequired).toBe(4)
    expect(r.siteResults.map((s) => s.sufficient)).toEqual([true, false, false])
    expect(r.sufficient).toBe(false)
  })
  it('handles fewer devices than sites and empty inventory', () => {
    expect(distributeInventory(2, 3)).toEqual([1, 1, 0])
    expect(distributeInventory(0, 3)).toEqual([0, 0, 0])
    const r = computeScenarios({ ...base, inventoryTotal: 0 })[0]
    expect(r.sufficient).toBe(false)
    expect(r.fleetUtilizationPct).toBe(Infinity)
  })
  it('defaults to 70% and applies N+1 or 2N after headroom', () => {
    const p = { ...base, state: { 'code-signing': { enabled: true, tps: 10000 } } }
    const n = computeScenarios(p)[0] // 10k RSA signs / 10k rate = one nominal device
    expect(n.targetUtilizationPct).toBe(70)
    expect(n.deviceTime).toBe(1)
    expect(n.perLocationRaw).toBe(2)
    expect(n.perLocationRequired).toBe(3)
    expect(computeScenarios({ ...p, redundancy: '2n' })[0].perLocationRequired).toBe(4)
    expect(computeScenarios({ ...p, targetUtilizationPct: 100 })[0].perLocationRequired).toBe(2)
  })
  it('requires no spare devices for zero demand', () => {
    const r = computeScenarios({ ...base, state: {}, inventoryTotal: 0 })
    expect(r.every((s) => s.requiredWithRedundancy === 0 && s.sufficient)).toBe(true)
    expect(r.every((s) => s.fleetUtilizationPct === 0)).toBe(true)
  })
  it.each([0, -1, NaN, Infinity, undefined])(
    'does not pass a demanded missing or invalid rate: %s',
    (rate) => {
      const classical = {
        ...CLASSICAL_HSM_DEFAULT,
        opsPerSec: { ...CLASSICAL_HSM_DEFAULT.opsPerSec, 'ml-dsa-65': rate as number },
      }
      const r = computeScenarios({ ...base, classical })[1]
      expect(r.supported).toBe(false)
      expect(r.sufficient).toBe(false)
      expect(r.unsupportedAlgorithms).toEqual(['ml-dsa-65'])
      expect(r.requiredWithRedundancy).toBe(Infinity)
    }
  )
  it('does not reject a zero-rate algorithm without demand', () => {
    const r = computeScenarios({ ...base, state: {}, classical: PAYMENT_HSM_DEFAULT })
    expect(r.every((s) => s.supported)).toBe(true)
  })
  it('isolates payment demand and payment inventory from the general fleet', () => {
    const state = { ...base.state, payment: { enabled: true, tps: 100000 } }
    expect(computeScenarios({ ...base, state })).toEqual(computeScenarios(base))
    const p = {
      ...base,
      state,
      fleet: 'payment' as const,
      classical: PAYMENT_HSM_DEFAULT,
      pqc: PAYMENT_HSM_DEFAULT,
    }
    const payments = computeScenarios(p)
    expect(payments[0].perSiteTps).toBe(100000)
    expect(payments[0].sufficient).toBe(false)
    expect(
      computeScenarios({ ...p, state: { ...state, tls: { enabled: true, tps: 1e6 } } })
    ).toEqual(payments)
  })
  it('counts one server signature and the hybrid exchange, not chain signatures', () => {
    const r = computeScenarios({ ...base, hybridSigningTransition: true })[1]
    expect(r.algoLoad.filter((a) => a.opsPerSec > 0)).toEqual([
      { algo: 'ecdh-p256', opsPerSec: 1000 },
      { algo: 'ml-dsa-65', opsPerSec: 1000 },
      { algo: 'ml-kem-768', opsPerSec: 1000 },
    ])
  })
  it('is monotonic in workload and operation rate', () => {
    const r = computeScenarios(base)[1].perLocationRequired
    expect(
      computeScenarios({ ...base, state: { tls: { enabled: true, tps: 2000 } } })[1]
        .perLocationRequired
    ).toBeGreaterThanOrEqual(r)
    const classical = {
      ...CLASSICAL_HSM_DEFAULT,
      opsPerSec: { ...CLASSICAL_HSM_DEFAULT.opsPerSec, 'ml-dsa-65': 75 },
    }
    expect(computeScenarios({ ...base, classical })[1].perLocationRequired).toBeGreaterThanOrEqual(
      r
    )
  })
  it.each([
    { numLocations: 0 },
    { numLocations: 1.5 },
    { targetUtilizationPct: 0 },
    { targetUtilizationPct: 101 },
    { inventoryTotal: -1 },
  ])('rejects invalid sizing inputs %j', (bad) => {
    expect(() => computeScenarios({ ...base, ...bad })).toThrow(RangeError)
  })
  it('rejects overflowing finite calculations rather than emitting a passing result', () => {
    const classical = {
      ...CLASSICAL_HSM_DEFAULT,
      opsPerSec: { ...CLASSICAL_HSM_DEFAULT.opsPerSec, 'ml-dsa-65': Number.MIN_VALUE },
    }
    expect(() => computeScenarios({ ...base, classical })).toThrow(RangeError)
  })
})
