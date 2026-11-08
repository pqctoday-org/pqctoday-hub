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

  it('says PQC adds a KEM-based alternative instead of replacing key transport entirely', () => {
    expect(curiousSummary).toContain('PQC adds a KEM-based alternative')
    expect(curiousSummary).not.toContain('replaces this entirely')
  })
})
