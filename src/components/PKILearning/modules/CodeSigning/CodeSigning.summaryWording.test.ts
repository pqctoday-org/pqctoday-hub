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

  it('describes the firmware benefit as protection against future forgery', () => {
    expect(curiousSummary).toContain('protects against future forgery of firmware signatures')
    expect(curiousSummary).not.toContain('"harvest now, decrypt later" firmware forgery')
  })

  it('keeps the Sigstore services in the migration scope', () => {
    expect(curiousSummary).toContain(
      'Developers no longer manage long-term signing keys themselves, but the Sigstore services (Fulcio and Rekor) must still move to post-quantum algorithms, so the migration is centralised there.'
    )
    expect(curiousSummary).not.toContain(
      'completely eliminates the need to manage long-term private keys'
    )
  })
})
