// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import inventory from './workshop/IAMCryptoInventory.tsx?raw'
import simpleSummary from './curious-summary.md?raw'
import ragSummary from './rag-summary.md?raw'
import { content } from './content'
import { DIRECTORY_SERVICES } from './data/iamConstants'

describe('IAM quantum-risk wording', () => {
  it('distinguishes signature forgery from HNDL and avoids an obsolete planning year', () => {
    expect(inventory).toContain('not a standards deadline or vendor commitment')
    expect(inventory).not.toContain('2025-2026')
    expect(simpleSummary).not.toContain('built entirely on cryptographic signatures')
    expect(ragSummary).toContain('signed JWT, SAML and OIDC tokens carry a forgery risk')
    expect(content.narratives?.keyConcepts).toContain('not an HNDL risk for the token itself')
  })

  it('does not teach universal LDAP hybrid TLS availability or unsupported SAML timing', () => {
    const openLdap = DIRECTORY_SERVICES.find((service) => service.id === 'openldap')
    expect(openLdap?.migrationPath).toContain('confirming the deployed TLS library')
    expect(openLdap?.vendorTimeline).toContain('depends on the OpenLDAP build')
    expect(openLdap?.vulnerabilities.join(' ')).toContain('without TLS is already exposed')
  })
})
