// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { OS_VENDORS, getOsPqcStatus } from './osProviderData'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: OS vendor rows must NOT store their own headline PQC
// status — it is derived from the central product catalog via `catalogName`.
describe('OS vendor rows derive PQC status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const v of OS_VENDORS) {
      expect(isInCatalog(v.catalogName), `${v.vendor} → "${v.catalogName}" not in catalog`).toBe(
        true
      )
    }
  })

  it('getOsPqcStatus tracks catalog availability', () => {
    for (const v of OS_VENDORS) {
      const avail = getCatalogStatus(v.catalogName)?.availability
      const status = getOsPqcStatus(v)
      expect(['ga', 'preview', 'roadmap', 'not-planned']).toContain(status)
      if (avail === 'available') expect(status).toBe('ga')
      if (avail === 'partial') expect(status).toBe('preview')
      if (avail === 'roadmap') expect(status).toBe('roadmap')
      if (avail === 'none') expect(status).toBe('not-planned')
    }
  })

  it('no vendor row reintroduces a hard-coded pqcStatus literal', () => {
    for (const v of OS_VENDORS) {
      expect(v).not.toHaveProperty('pqcStatus')
    }
  })
})
