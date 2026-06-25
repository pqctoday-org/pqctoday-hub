// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { buildPlanCbom } from './cbomExport'

const TS = '2026-06-21T00:00:00.000Z'

describe('buildPlanCbom', () => {
  it('produces a CycloneDX 1.6 document', () => {
    const doc = buildPlanCbom({ planIds: ['tls'], choice: {}, timestamp: TS })
    expect(doc.bomFormat).toBe('CycloneDX')
    expect(doc.specVersion).toBe('1.6')
    expect((doc.metadata as { timestamp: string }).timestamp).toBe(TS)
  })

  it('one component per known planned asset; unknown ids dropped', () => {
    const doc = buildPlanCbom({ planIds: ['tls', 'vpn', 'nope'], choice: {}, timestamp: TS })
    const components = doc.components as Array<{ name: string }>
    expect(components).toHaveLength(2)
    expect(components.map((c) => c.name)).toEqual(['TLS key exchange', 'IPsec / IKEv2 VPN'])
  })

  it('carries classical→target, decision, and chosen product', () => {
    const doc = buildPlanCbom({ planIds: ['certs'], choice: { certs: ['My CA'] }, timestamp: TS })
    const props = (
      doc.components as Array<{ properties: Array<{ name: string; value: string }> }>
    )[0].properties
    const get = (n: string) => props.find((p) => p.name === n)?.value
    expect(get('pqc:classical')).toBe('RSA-2048 / ECDSA')
    expect(get('pqc:target')).toBe('ML-DSA-87')
    expect(get('pqc:decision')).toBe('Hybrid config')
    expect(get('pqc:chosenProduct')).toBe('My CA')
  })

  it('omits chosenProduct when none chosen', () => {
    const doc = buildPlanCbom({ planIds: ['tls'], choice: {}, timestamp: TS })
    const props = (doc.components as Array<{ properties: Array<{ name: string }> }>)[0].properties
    expect(props.find((p) => p.name === 'pqc:chosenProduct')).toBeUndefined()
  })
})
