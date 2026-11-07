// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'

describe('CryptoDevAPIs summary separates the two Luna Java integrations', () => {
  it('describes JCPROV as the PKCS#11 wrapper and the Luna JSP as the JCA/JCE provider', () => {
    const line =
      'Java wrapper for the PKCS#11 API (com.safenetinc.jcprov); the JCA/JCE provider is the separate Luna JSP (LunaProvider). FIPS validation is per HSM model and firmware.'
    expect(ragSummary).toContain(`- **JCPROV**: ${line}`)
    expect(ragSummary).toContain(`- **JCPROV** — ${line}`)
  })

  it('no longer calls JCProv a hardware-backed JCA provider', () => {
    expect(ragSummary).not.toContain('PKCS#11 JCA bridge')
    expect(ragSummary).not.toContain('JCA provider bridging PKCS#11')
    expect(ragSummary).not.toMatch(/JCProv[^\n]*FIPS 140-3 Level 3 hardware-backed JCA provider/)
  })
})
