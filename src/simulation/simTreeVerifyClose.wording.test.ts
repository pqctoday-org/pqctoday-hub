// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import TREE from './trees/simTree.verify-close.09072026'

type Activity = { id: string; title: string; decision: string; do: string }

const findActivity = (id: string): Activity => {
  for (const level of TREE.levels ?? []) {
    for (const a of level.activities ?? []) {
      if (a.id === id) return a as unknown as Activity
    }
  }
  throw new Error(`activity ${id} not found`)
}

describe('verify-close tree — migration evidence dossier', () => {
  it('asks for evidence that fits transport, storage and signing separately', () => {
    const a = findActivity('VC.2')
    expect(a.decision).toMatch(/transport, storage or signing/i)
    expect(a.do).toMatch(/Transport/)
    expect(a.do).toMatch(/Storage/)
    expect(a.do).toMatch(/Signing/)
    // One evidence standard (negotiation + negative testing) is not offered for all three.
    expect(a.decision).not.toMatch(/observed negotiation, negative testing, attestation/i)
  })

  it('explains rewrap versus re-encryption, trust retirement and the exposure that remains', () => {
    const a = findActivity('VC.2')
    expect(a.do).toMatch(/rewrapped \(same data key, new wrapping key\)/i)
    expect(a.do).toMatch(/re-encrypted \(new data key\)/i)
    expect(a.do).toMatch(/old signing keys and trust anchors were retired/i)
    expect(a.do).toMatch(/historic exposure that remains/i)
    expect(a.do).toMatch(/already captured under classical keys are not protected/i)
  })
})
