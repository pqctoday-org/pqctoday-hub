// SPDX-License-Identifier: GPL-3.0-only
//
// Coverage invariant for the Migrate Workbench redesign.
//
// The asset-first IA only shows a product if it maps to a domain. If ANY active
// catalog row fails to classify, that product becomes unreachable in the new UI.
// This test fails the build in that case — extend MATCH_RULES / LAYER_FALLBACK
// in migrationAssets.ts rather than letting products silently disappear.
//
// It imports `softwareData` (the loader's canonical, active-only dataset), so it
// automatically tracks whichever pqc_product_catalog_*.csv the loader selects.

import { describe, it, expect } from 'vitest'
import { softwareData } from './migrateData'
import {
  classifyProductDomain,
  DOMAINS,
  REPLACE_ASSETS,
  DECISIONS,
  type DomainId,
} from './migrationAssets'

describe('migrationAssets coverage', () => {
  it('classifies every active catalog product to a domain (no orphans)', () => {
    const orphans = softwareData.filter(
      (item) => classifyProductDomain(item.categoryName, item.infrastructureLayer) === null
    )
    const sample = orphans
      .slice(0, 20)
      .map((o) => `${o.softwareName} [${o.categoryName} / ${o.infrastructureLayer}]`)
    expect(
      orphans.length,
      `${orphans.length} catalog products have no domain — they would be unreachable in the ` +
        `asset-first Migrate UI. Add a keyword/layer rule for:\n  ${sample.join('\n  ')}`
    ).toBe(0)
  })

  it('every classified domain is a registered domain', () => {
    for (const item of softwareData) {
      const d = classifyProductDomain(item.categoryName, item.infrastructureLayer)
      // d is a validated DomainId (or null); DOMAINS is a typed Record.
      // eslint-disable-next-line security/detect-object-injection
      if (d) expect(DOMAINS[d]).toBeDefined()
    }
  })

  it('every replace-asset maps to at least one catalog product', () => {
    // A "replace what you run" asset with zero products would show an empty
    // contextual catalog (only `email` is allowed to be a deliberate gap).
    const counts = new Map<DomainId, number>()
    for (const item of softwareData) {
      const d = classifyProductDomain(item.categoryName, item.infrastructureLayer)
      if (d) counts.set(d, (counts.get(d) ?? 0) + 1)
    }
    const emptyReplaceAssets = REPLACE_ASSETS.filter((a) => (counts.get(a.id) ?? 0) === 0).map(
      (a) => a.id
    )
    // `email` is a known coverage gap (no GA product → "mitigate").
    const unexpected = emptyReplaceAssets.filter((id) => id !== 'email')
    expect(unexpected, `replace-assets with no products: ${unexpected.join(', ')}`).toEqual([])
  })

  it('replace-asset ids are unique and reference valid decisions', () => {
    const ids = REPLACE_ASSETS.map((a) => a.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const a of REPLACE_ASSETS) {
      expect(DECISIONS[a.decision]).toBeDefined()
    }
  })

  it('classifier maps representative categories as expected', () => {
    const cases: ReadonlyArray<[string, string, DomainId]> = [
      ['TLS/SSL Implementation Software', 'AppServers', 'tls'],
      ['VPN and IPsec Software', 'Network', 'vpn'],
      ['SSH Implementation Software', 'SecSoftware', 'ssh'],
      ['Code Signing and Software Integrity', 'DevSecOps', 'codesign'],
      ['Public Key Infrastructure (PKI) Software', 'Security Stack', 'certs'],
      ['Hardware Security Module (HSM) Software', 'Hardware', 'hsm'],
      ['Key Management Systems (KMS)', 'Security Stack', 'kms'],
      ['Database Encryption Software', 'Database', 'atrest'],
      ['Email Encryption Software', 'SecSoftware', 'email'],
      ['Cryptographic Libraries', 'Libraries', 'foundations'],
      ['Cryptographic Discovery Platforms', 'Security Stack', 'discovery'],
      ['Blockchain & DLT Protocols', 'Application', 'blockchain'],
      ['National PQC Roadmap', 'Standard', 'programs'],
    ]
    for (const [cat, layer, expected] of cases) {
      expect(classifyProductDomain(cat, layer), `${cat}`).toBe(expected)
    }
  })
})
