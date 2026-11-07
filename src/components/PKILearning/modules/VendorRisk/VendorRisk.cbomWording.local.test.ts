// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import ragSummary from './rag-summary.md?raw'
import curiousSummary from './curious-summary.md?raw'

describe('vendor risk summaries describe a CBOM as visibility, not a full answer', () => {
  it('says a CBOM lists the algorithms the supplier records', () => {
    expect(ragSummary).toContain(
      'supports component visibility and lists the algorithms the supplier records'
    )
    expect(ragSummary).not.toContain('essential for assessing quantum vulnerability')
    expect(curiousSummary).toContain(
      'supports component visibility and lists the algorithms the supplier records'
    )
    expect(curiousSummary).not.toContain('reveals all algorithms')
  })
})
