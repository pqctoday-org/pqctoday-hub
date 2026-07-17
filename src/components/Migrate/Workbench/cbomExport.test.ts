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
    expect(get('pqc:target')).toBe('ML-DSA-65')
    expect(get('pqc:decision')).toBe('Hybrid config')
    expect(get('pqc:chosenProduct')).toBe('My CA')
  })

  it('omits chosenProduct when none chosen', () => {
    const doc = buildPlanCbom({ planIds: ['tls'], choice: {}, timestamp: TS })
    const props = (doc.components as Array<{ properties: Array<{ name: string }> }>)[0].properties
    expect(props.find((p) => p.name === 'pqc:chosenProduct')).toBeUndefined()
  })

  // Regression: migrate-process remediation Phase 5 (U7) — planIds mixes
  // real ReplaceAsset ids with foundation/infrastructure domain ids (crypto
  // libraries etc. have no ReplaceAsset). A product chosen for a foundation
  // domain used to silently never appear in the exported CBOM at all.
  it('includes a foundation-domain choice as its own component', () => {
    const doc = buildPlanCbom({
      planIds: ['tls', 'foundations'],
      choice: { foundations: ['liboqs'] },
      timestamp: TS,
    })
    const components = doc.components as Array<{
      name: string
      properties: Array<{ name: string; value: string }>
    }>
    expect(components).toHaveLength(2)
    const foundation = components.find((c) => c.name === 'Crypto libraries & frameworks')
    expect(foundation).toBeDefined()
    expect(foundation!.properties.find((p) => p.name === 'pqc:domainKind')?.value).toBe(
      'foundation'
    )
    expect(foundation!.properties.find((p) => p.name === 'pqc:chosenProduct')?.value).toBe('liboqs')
    // assetCount in metadata reflects the combined component count, not just replace-assets.
    expect(
      (doc.metadata as { properties: Array<{ name: string; value: string }> }).properties.find(
        (p) => p.name === 'pqc:assetCount'
      )?.value
    ).toBe('2')
  })

  it('a foundation domain with no chosen product still appears with no chosenProduct property', () => {
    const doc = buildPlanCbom({ planIds: ['foundations'], choice: {}, timestamp: TS })
    const components = doc.components as Array<{
      name: string
      properties: Array<{ name: string }>
    }>
    expect(components).toHaveLength(1)
    expect(components[0].properties.find((p) => p.name === 'pqc:chosenProduct')).toBeUndefined()
  })
})
