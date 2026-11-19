// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

describe('code signing summaries: signatures are forged in future, not harvested', () => {
  it('says signed files are not encrypted, so harvest-now-decrypt-later does not apply to the signature', () => {
    expect(ragSummary).toContain(
      "an adversary able to derive a publisher's private key from its public key could forge that publisher's signatures. Signed files are not encrypted, so harvest-now-decrypt-later does not apply to the signature; the risk is future forgery while the public key is still trusted (the update channel that delivers a file is assessed separately); a quantum-compromised Root CA key affects the entire ecosystem simultaneously"
    )
    expect(ragSummary).not.toContain('HNDL applied to signed artifacts')
  })

  it('qualifies future forgery risk and avoids universal publisher compromise claims', () => {
    expect(curiousSummary).toContain('If it recovered a trusted signing key')
    expect(curiousSummary).toContain('under their configured trust policies')
    expect(curiousSummary).not.toContain('compromises every publisher simultaneously')
    expect(curiousSummary).not.toContain('"harvest now, decrypt later" firmware forgery')
  })

  it('scopes signature size ratios and requires workflow-specific measurement', () => {
    expect(curiousSummary).toContain('64-byte raw ECDSA P-256 signature')
    expect(curiousSummary).toContain('measure storage, bandwidth, and verification costs')
    expect(curiousSummary).not.toContain('verified once per install')
  })

  it('scopes Sigstore migration across clients, formats, services, and verifiers', () => {
    expect(curiousSummary).toContain('signing clients, certificate issuance, artifact formats')
    expect(curiousSummary).toContain('upgrading a central service alone does not make')
    expect(curiousSummary).not.toContain(
      'completely eliminates the need to manage long-term private keys'
    )
  })
})
