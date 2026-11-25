// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { PROTOCOL_MATRIX } from './pqcProtocolMatrix'
import { softwareData } from './migrateData'
import { vendorRoadmaps } from './vendorRoadmapData'
import { vendorMap } from './vendorData'

/**
 * A library listed in the protocol matrix is a product of the catalogue, so its name is the
 * catalogue's own `software_name`. The matrix keeps a different label only where the entry means
 * one component of the product (for example "OpenSSL pkcs11-provider" for the OpenSSL product);
 * those labels are listed here, so a new disagreement fails instead of drifting in.
 */
const DELIBERATE_LABELS: Record<string, string> = {
  'github-ssh-pqc': 'GitHub SSH (PQC)',
  'smallstep-certificate-authority': 'smallstep step-ca',
  'mls-rs': 'mls-rs',
  'sealsq-quantum-shield': 'SEALSQ Quantum Shield',
  'pqctoday-hsm-softhsmv3': 'SoftHSM v3 (pqctoday)',
  openssl: 'OpenSSL pkcs11-provider',
  cryptsoft: 'Cryptsoft PKCS#11 SDK',
  signal: 'libsignal',
}

describe('protocol matrix library names', () => {
  const catalogueName = new Map(softwareData.map((s) => [s.productId, s.softwareName]))
  const libraries = PROTOCOL_MATRIX.flatMap((row) => [
    ...row.ossLibraries,
    ...row.commercialLibraries,
  ])

  it('uses the catalogue name for a library, except the eight deliberate component labels', () => {
    const disagreements: Record<string, string> = {}
    for (const lib of libraries) {
      expect(catalogueName.has(lib.productId), lib.productId).toBe(true)
      if (catalogueName.get(lib.productId) !== lib.name) disagreements[lib.productId] = lib.name
    }
    expect(disagreements).toEqual(DELIBERATE_LABELS)
  })
})

describe('vendor roadmap vendor_name', () => {
  // Three active roadmap rows name their vendor differently from the vendor registry's display name
  // (the roadmap shows the legal or product name). The registry is the one copy of a vendor's name;
  // these three stay as the roadmap file words them until the owner chooses.
  const KNOWN_DIFFERENT = ['VND-017', 'VND-146', 'VND-269']

  it('matches the vendor registry, apart from the three rows listed above', () => {
    const different = new Set<string>()
    for (const r of vendorRoadmaps) {
      const vendor = vendorMap.get(r.vendorId)
      expect(vendor, r.vendorId).toBeDefined()
      if (r.vendorName !== vendor?.vendorName && r.vendorName !== vendor?.vendorDisplayName) {
        different.add(r.vendorId)
      }
    }
    expect([...different].sort()).toEqual(KNOWN_DIFFERENT)
  })
})
