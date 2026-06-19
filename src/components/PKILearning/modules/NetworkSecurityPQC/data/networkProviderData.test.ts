// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { VENDOR_MIGRATION_DATA, getVendorPqcStatus } from './networkProviderData'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: network vendor rows must NOT store their own headline
// PQC status — it is derived from the central product catalog via `catalogName`.
describe('Network vendor rows derive PQC status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const v of VENDOR_MIGRATION_DATA) {
      expect(isInCatalog(v.catalogName), `${v.vendor} → "${v.catalogName}" not in catalog`).toBe(
        true
      )
    }
  })

  it('getVendorPqcStatus tracks catalog availability', () => {
    for (const v of VENDOR_MIGRATION_DATA) {
      const avail = getCatalogStatus(v.catalogName)?.availability
      const status = getVendorPqcStatus(v)
      expect(['ga', 'beta', 'roadmap', 'not-planned']).toContain(status)
      if (avail === 'available') expect(status).toBe('ga')
      if (avail === 'partial') expect(status).toBe('beta')
      if (avail === 'none') expect(status).toBe('not-planned')
      if (avail === 'roadmap') expect(status).toBe('roadmap')
    }
  })

  it('no vendor row reintroduces a hard-coded pqcStatus literal', () => {
    for (const v of VENDOR_MIGRATION_DATA) {
      expect(v).not.toHaveProperty('pqcStatus')
    }
  })
})
