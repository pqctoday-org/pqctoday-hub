// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ARCHITECTURES, computeReadiness, edgeState } from './simArchitecture'

describe('simArchitecture', () => {
  it('every size has a mix of PQC and non-PQC products (never trivially 100%)', () => {
    for (const arch of Object.values(ARCHITECTURES)) {
      const statuses = new Set(arch.nodes.map((n) => n.pqcStatus))
      expect(statuses.has('none'), `${arch.size}: no non-PQC products`).toBe(true)
      expect(statuses.has('available'), `${arch.size}: no PQC products`).toBe(true)
    }
  })

  it('readiness is migratable ÷ vulnerable, under 100% for every size', () => {
    for (const arch of Object.values(ARCHITECTURES)) {
      const r = computeReadiness(arch)
      expect(r.vulnerable).toBeGreaterThan(0)
      expect(r.readinessPct).toBeLessThan(100)
      expect(r.migratable + r.blocked + r.residual).toBe(r.vulnerable)
    }
  })

  it('computes the expected readiness for the small estate', () => {
    const r = computeReadiness(ARCHITECTURES.small)
    expect(r).toMatchObject({
      vulnerable: 6,
      migratable: 3,
      blocked: 3,
      residual: 0,
      readinessPct: 50,
    })
  })

  it('classifies edges: product-blocked, vendor, monitor-only, migratable', () => {
    const a = ARCHITECTURES.small
    const find = (proto: string) => a.edges.find((e) => e.protocol === proto)!
    expect(edgeState(a, find('TLS (wire)'))).toBe('blocked') // → MongoDB (none)
    expect(edgeState(a, find('OIDC'))).toBe('vendor')
    expect(edgeState(a, find('IKEv2'))).toBe('migratable')
    expect(
      edgeState(ARCHITECTURES.mid, ARCHITECTURES.mid.edges.find((e) => e.protocol === 'Kerberos')!)
    ).toBe('monitor')
  })
})
