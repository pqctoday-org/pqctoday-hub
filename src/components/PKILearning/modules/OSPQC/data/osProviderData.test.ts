// SPDX-License-Identifier: AGPL-3.0-only
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

describe('Ubuntu row names only supported releases as current', () => {
  const ubuntu = OS_VENDORS.find((v) => v.id === 'ubuntu')!

  it('lists Ubuntu 26.04 LTS as the platform and 25.10 only as an end-of-life release', () => {
    expect(ubuntu.platform).toBe('Ubuntu 26.04 LTS (Resolute Raccoon)')
    expect(ubuntu.platform).not.toContain('25.10')
    expect(ubuntu.opensslVersion).toContain(
      '25.10 (OpenSSL 3.5) reached end of life on 9 July 2026'
    )
    expect(ubuntu.opensslVersion).toContain('24.04 LTS is OpenSSL 3.0')
  })
})
