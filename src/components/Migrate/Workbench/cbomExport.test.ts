// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { buildPlanCbom } from './cbomExport'

const TS = '2026-10-18T00:00:00.000Z'

describe('migration planning draft export', () => {
  it('does not claim CycloneDX or CBOM conformance', () => {
    const doc = buildPlanCbom({ planIds: ['tls'], choice: {}, timestamp: TS })
    expect(doc.format).toBe('pqctoday-migration-planning-draft')
    expect(doc.generatedAt).toBe(TS)
    expect(doc).not.toHaveProperty('bomFormat')
    expect(String(doc.disclaimer)).toMatch(/not a discovered inventory, CBOM/i)
  })

  it('exports known assets and drops unknown ids', () => {
    const doc = buildPlanCbom({ planIds: ['tls', 'vpn', 'nope'], choice: {}, timestamp: TS })
    const items = doc.items as Array<{ name: string }>
    expect(items.map((item) => item.name)).toEqual(['TLS key exchange', 'IPsec / IKEv2 VPN'])
  })

  it('pins catalog examples without readiness or deadline claims', () => {
    const doc = buildPlanCbom({
      planIds: ['certs'],
      choice: { certs: ['My CA'] },
      timestamp: TS,
      products: [{ productId: 'ca-1', softwareName: 'My CA', latestVersion: '4' }],
      catalogSnapshot: 'catalog.csv',
    })
    const item = (doc.items as Array<Record<string, unknown>>)[0]
    expect(item.selectedCatalogExamples).toEqual([
      { name: 'My CA', productId: 'ca-1', catalogVersion: '4' },
    ])
    expect(JSON.stringify(doc)).not.toMatch(/cnsaYear|gaPathExists/)
    expect(JSON.stringify(doc)).toContain('catalog.csv')
  })

  it('includes selected foundation examples', () => {
    const doc = buildPlanCbom({
      planIds: ['foundations'],
      choice: { foundations: ['liboqs'] },
      timestamp: TS,
    })
    expect(doc.items).toEqual([
      {
        id: 'foundations',
        name: 'Crypto libraries & frameworks',
        kind: 'foundation',
        selectedCatalogExamples: [{ name: 'liboqs' }],
      },
    ])
  })
})
