// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'

const flat = (s: string) => s.replace(/\s+/g, ' ')

describe('one-time-signature reuse wording in the topic summary', () => {
  it('describes partial chain exposure and a compromised key, not a complete break', () => {
    const t = flat(ragSummary)
    expect(t).toMatch(/breaks the one-time guarantee/)
    expect(t).toMatch(/without necessarily recovering the whole private key/)
    expect(t).toMatch(/treated as compromised and fully revoked/)
    expect(t).not.toMatch(/complete break/)
    expect(t).not.toMatch(/compute enough of the private key to forge arbitrary signatures/)
  })
})
