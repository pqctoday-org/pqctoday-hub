// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { latestCombinedQaPath } from './moduleQaData'

const p = (name: string) => `./module-qa/module_qa_combined_${name}.csv`

describe('latestCombinedQaPath', () => {
  it('picks the newest date, not the string-largest name', () => {
    // MMDDYYYY as a string: "01012027" < "10162026", but January 2027 is newer.
    expect(latestCombinedQaPath([p('10162026'), p('01012027'), p('09302026')])).toBe(p('01012027'))
  })

  it('compares revisions as numbers: _r10 is newer than _r9', () => {
    expect(latestCombinedQaPath([p('10162026_r9'), p('10162026_r10'), p('10162026')])).toBe(
      p('10162026_r10')
    )
  })

  it('treats the unsuffixed file as the first revision of its day', () => {
    expect(latestCombinedQaPath([p('10162026'), p('10162026_r1')])).toBe(p('10162026_r1'))
  })

  it('ignores files that are not combined Q&A tables, and handles none', () => {
    expect(latestCombinedQaPath(['./module-qa/module_qa_tls-basics_10162026.csv'])).toBeNull()
    expect(latestCombinedQaPath([])).toBeNull()
  })
})
