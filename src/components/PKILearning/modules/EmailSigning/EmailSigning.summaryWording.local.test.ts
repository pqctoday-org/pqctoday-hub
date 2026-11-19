// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

describe('Email signing summaries describe RSA-KEM and the KEM alternative accurately', () => {
  it('says RSA-KEM is not a post-quantum KEM and that the CMS RFCs set formats, not deadlines', () => {
    expect(ragSummary).toContain(
      'RSA-KEM (RFC 9690) puts RSA behind the KEM interface and is not a post-quantum KEM; the CMS RFCs define formats, not deadlines'
    )
    expect(ragSummary).not.toContain('transitional option')
  })

  it('distinguishes signature validation, KEM ciphertext, and product deployment', () => {
    expect(curiousSummary).toContain(
      'signature supports integrity and proves control of the signing key'
    )
    expect(curiousSummary).toContain('transmits a KEM ciphertext')
    expect(curiousSummary).toContain('do not say that a particular mail client')
    expect(curiousSummary).toContain('RFC 10073')
    expect(curiousSummary).not.toContain('definitively prove the sender')
    expect(curiousSummary).not.toContain('without ever actually sending it')
    expect(ragSummary).toContain(
      'dual separate certificates are not a universal standards requirement'
    )
    expect(ragSummary).toContain('RFC 10073')
    expect(ragSummary).not.toContain('ML-DSA-65 signatures are approximately 3.3 KB')
  })
})
