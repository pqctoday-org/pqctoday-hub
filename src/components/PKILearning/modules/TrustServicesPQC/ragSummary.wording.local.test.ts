// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('RFC 3161 wording in the topic summary', () => {
  it('names CMS SignedData and lists what a migration still needs', () => {
    const t = flat(ragSummary)
    expect(t).toMatch(/time-stamp tokens are CMS SignedData, which is algorithm-agile/)
    expect(t).toMatch(/signature algorithm identifier is carried in the CMS signer information/)
    expect(t).toMatch(
      /certified TSA key, TSA and HSM support, verifier support and interoperability/
    )
    expect(t).not.toMatch(/The layer that has to move is the trust list/)
    expect(t).not.toMatch(/without any protocol change at all/)
  })
})
