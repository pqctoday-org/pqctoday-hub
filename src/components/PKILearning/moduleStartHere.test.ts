// SPDX-License-Identifier: GPL-3.0-only
/**
 * B+ round 8, Wave C (2026-09-18) — "Start here" drift guard.
 *
 * Every manifest that carries a startHere must point at a step the same
 * manifest declares in workshopSteps, and the text must be a full sentence.
 * The first drafts of these lines named steps that do not exist ("the CMVP
 * transition step", "step 3 maps…"); this test makes that impossible to ship.
 */
import { describe, it, expect } from 'vitest'
import { MANIFESTS } from '@/components/PKILearning/manifest/registry'

const withStartHere = MANIFESTS.filter((m) => m.startHere)

describe('module manifests — Start here', () => {
  it('ships on the 38 Wave C modules', () => {
    expect(withStartHere.length).toBe(38)
  })

  it('every Start-here step is a declared workshop step of the same module', () => {
    for (const m of withStartHere) {
      const ids = (m.workshopSteps ?? []).map((s) => s.id)
      expect(ids, `${m.id}: startHere.step '${m.startHere!.step}' not in workshopSteps`).toContain(
        m.startHere!.step
      )
    }
  })

  it('every Start-here text is one full sentence (ends with a period, 60–320 chars)', () => {
    for (const m of withStartHere) {
      const t = m.startHere!.text.trim()
      expect(t.endsWith('.'), `${m.id}: no terminal period`).toBe(true)
      expect(t.length, `${m.id}: length ${t.length}`).toBeGreaterThanOrEqual(60)
      expect(t.length, `${m.id}: length ${t.length}`).toBeLessThanOrEqual(320)
    }
  })
})
