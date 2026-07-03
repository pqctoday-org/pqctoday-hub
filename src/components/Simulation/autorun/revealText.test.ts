// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { revealText } from './revealText'
import { EXEC_TOUR_REVEAL_TYPES } from './execTourConfig'

describe('artifact reveal text', () => {
  it('every reveal artifact type resolves to a non-empty "what this is" line', () => {
    for (const t of EXEC_TOUR_REVEAL_TYPES) {
      const r = revealText(t)
      expect(r, `reveal '${t}' has no resolvable text`).not.toBeNull()
      expect(r!.body.length, `reveal '${t}' resolved to an empty body`).toBeGreaterThan(0)
      expect(r!.title.length).toBeGreaterThan(0)
    }
  })
})
