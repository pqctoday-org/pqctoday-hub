// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { IAM_VENDORS, getVendorPqcStatus } from './iamProviderData'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: IAM vendor rows must NOT store their own headline PQC
// status — it is derived from the central product catalog via `catalogName`.
describe('IAM vendor rows derive PQC status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const v of IAM_VENDORS) {
      expect(isInCatalog(v.catalogName), `${v.vendor} → "${v.catalogName}" not in catalog`).toBe(
        true
      )
    }
  })

  it('getVendorPqcStatus tracks catalog availability', () => {
    for (const v of IAM_VENDORS) {
      const avail = getCatalogStatus(v.catalogName)?.availability
      const status = getVendorPqcStatus(v)
      expect(['ga', 'preview', 'roadmap', 'planned', 'none']).toContain(status)
      if (avail === 'available') expect(status).toBe('ga')
      if (avail === 'partial') expect(status).toBe('preview')
      if (avail === 'roadmap') expect(status).toBe('roadmap')
      if (avail === 'none') expect(status).toBe('none')
    }
  })

  it('no vendor row reintroduces a hard-coded pqcStatus literal', () => {
    for (const v of IAM_VENDORS) {
      expect(v).not.toHaveProperty('pqcStatus')
    }
  })
})
