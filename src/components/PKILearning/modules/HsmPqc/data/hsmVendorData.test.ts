// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { HSM_VENDORS, getVendorPqcSupportStatus } from './hsmVendorData'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: HSM vendor rows must NOT store their own headline PQC
// support status — it is derived from the central product catalog via `catalogName`.
describe('HSM vendor rows derive PQC support status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const v of HSM_VENDORS) {
      expect(isInCatalog(v.catalogName), `${v.name} → "${v.catalogName}" not in catalog`).toBe(true)
    }
  })

  it('getVendorPqcSupportStatus tracks catalog availability', () => {
    for (const v of HSM_VENDORS) {
      const avail = getCatalogStatus(v.catalogName)?.availability
      const status = getVendorPqcSupportStatus(v)
      expect(['production', 'beta', 'limited', 'roadmap']).toContain(status)
      if (avail === 'available') expect(status).toBe('production')
      if (avail === 'partial') expect(status).toBe('limited')
      if (avail === 'roadmap' || avail === 'none') expect(status).toBe('roadmap')
    }
  })

  it('no vendor row reintroduces a hard-coded pqcSupportStatus literal', () => {
    for (const v of HSM_VENDORS) {
      expect(v).not.toHaveProperty('pqcSupportStatus')
    }
  })
})
