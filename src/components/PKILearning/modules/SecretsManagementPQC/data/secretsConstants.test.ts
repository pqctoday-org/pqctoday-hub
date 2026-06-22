// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { CLOUD_SECRETS_PROVIDERS, getProviderPqcStatus } from './secretsConstants'
import { isInCatalog, getCatalogStatus } from '@/data/catalogStatus'

// Single-source guardrail: cloud secrets providers must NOT store their own
// headline PQC status — it is derived from the central catalog via `catalogName`.
describe('Secrets providers derive PQC status from the central catalog', () => {
  it('every catalogName resolves in the product catalog (no typos, no drift)', () => {
    for (const p of CLOUD_SECRETS_PROVIDERS) {
      expect(isInCatalog(p.catalogName), `${p.name} → "${p.catalogName}" not in catalog`).toBe(true)
    }
  })

  it('getProviderPqcStatus tracks catalog availability', () => {
    for (const p of CLOUD_SECRETS_PROVIDERS) {
      const avail = getCatalogStatus(p.catalogName)?.availability
      const status = getProviderPqcStatus(p)
      expect(['ga', 'preview', 'planned', 'none']).toContain(status)
      if (avail === 'available') expect(status).toBe('ga')
      if (avail === 'partial') expect(status).toBe('preview')
      if (avail === 'roadmap') expect(status).toBe('planned')
      if (avail === 'none') expect(status).toBe('none')
    }
  })

  it('no provider reintroduces a hard-coded pqcStatus literal', () => {
    for (const p of CLOUD_SECRETS_PROVIDERS) {
      expect(p).not.toHaveProperty('pqcStatus')
    }
  })
})
