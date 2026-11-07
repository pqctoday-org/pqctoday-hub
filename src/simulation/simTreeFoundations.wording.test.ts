// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import TREE from './trees/simTree.foundations.09072026'

describe('foundations tree — evidence-dossier pitfall', () => {
  const pitfall = TREE.pitfalls.find((p) => /evidence dossier/i.test(p.title))

  it('teaches that records support explanation and review, without promising a legal defense', () => {
    expect(pitfall).toBeDefined()
    const why = pitfall!.why
    expect(why).not.toMatch(/no negligence defen[cs]e/i)
    expect(why).not.toMatch(/is defensible; undocumented inaction is not/i)
    expect(why).toMatch(/explain why a decision was made/i)
    expect(why).toMatch(/support later review/i)
    expect(why).toMatch(/does not guarantee a legal defense/i)
    expect(why).toMatch(/jurisdiction/i)
    expect(why).toMatch(/legal counsel/i)
  })
})
