// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { ROTATION_POLICIES } from './kmsConstants'

const policy = (id: string) => ROTATION_POLICIES.find((p) => p.id === id)!

describe('rotation policy reference', () => {
  it('presents every interval as illustrative or as a scoped rule, never as a universal maximum', () => {
    for (const p of ROTATION_POLICIES) {
      expect(p.rotationInterval).toMatch(/^(Illustrative|Publicly trusted TLS certificates)/)
    }
  })

  it('does not call any generic key-role interval a maximum', () => {
    for (const p of ROTATION_POLICIES.filter((x) => x.id !== 'tls-server')) {
      expect(p.rotationInterval).not.toMatch(/\bmax(imum)?\b/i)
      expect(p.complianceFramework).not.toMatch(/PCI DSS|HIPAA|WebTrust/)
    }
  })

  it('scopes the validity limits to publicly trusted TLS certificates and uses the dated schedule', () => {
    const tls = policy('tls-server')
    expect(tls.rotationInterval).toMatch(/200 days from 15 March 2026/)
    expect(tls.rotationInterval).toMatch(/100 days from 15 March 2027/)
    expect(tls.rotationInterval).toMatch(/47 days from 15 March 2029/)
    expect(tls.rotationInterval).toMatch(/private CA follow that CA.s own policy/)
    expect(tls.rotationInterval).not.toMatch(/398/)
    expect(tls.complianceFramework).toMatch(/publicly trusted TLS certificates only/)
  })

  it('gives the NIST SP 800-57 figures for the key roles it covers, as suggestions', () => {
    expect(policy('code-signing').rotationInterval).toMatch(/about 1 to 3 years/)
    expect(policy('code-signing').rotationInterval).toMatch(/rough order-of-magnitude guidelines/)
    expect(policy('data-encryption').rotationInterval).toMatch(/under 2 years/)
    expect(policy('kek').rotationInterval).toMatch(/under that plus 3 years of unwrapping/)
  })

  it('says the CA intervals are policy choices and not NIST figures', () => {
    for (const id of ['ca-intermediate', 'root-ca']) {
      expect(policy(id).rotationInterval).toMatch(/Not a figure from NIST SP 800-57/)
      expect(policy(id).complianceFramework).toMatch(/not a fixed standard maximum/)
    }
  })
})
