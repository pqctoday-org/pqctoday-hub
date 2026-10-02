// SPDX-License-Identifier: GPL-3.0-only
/**
 * The Constrained Algorithm Explorer's fit table, its RAM figures, and its
 * per-class guidance prose must agree.
 *
 * THE FAILURE THIS EXISTS FOR, found 2026-08-22 while reviewing this module
 * against the algorithm catalogue. It was one wrong number with two visible
 * consequences, and neither was caught by types, tests, or the accuracy pass:
 *
 *  - `FrodoKEM-640.ramKB` was 180. That is FrodoKEM-1344's figure; the catalogue
 *    gives ~60000 / ~120000 / ~180000 stack bytes for -640 / -976 / -1344. A
 *    threefold overstatement on the smallest parameter set.
 *  - Built on top of it, the Class 3+ guidance told the reader "Only FrodoKEM
 *    remains infeasible" — on a 256 KB device that FrodoKEM-640 uses under a
 *    quarter of. The reader was steered away from a working option.
 *  - `suitableForClass` was `[]`, and THAT is what the badge reads — not ramKB.
 *    So correcting the number alone would have shipped a paragraph saying
 *    FrodoKEM fits next to a red "exceeds capabilities" badge on the same screen.
 *
 * Assertions derive from the data, never restate it: a test that hardcodes
 * "60" is a second copy of the number that drifts on its own.
 */
import { describe, it, expect } from 'vitest'
import { DEVICE_CLASSES, CONSTRAINED_ALGORITHMS } from './constants'
// ?raw so the assertion reads the component's real source, wherever vitest is run
// from — a cwd-relative readFileSync makes the test depend on the invocation.
import explorerSource from './workshop/ConstrainedAlgorithmExplorer.tsx?raw'

const LARGEST_CLASS_IDX = DEVICE_CLASSES.length - 1

describe('constrained algorithm fit table', () => {
  it('never claims an algorithm suits a class whose RAM it exceeds', () => {
    const offenders = CONSTRAINED_ALGORITHMS.flatMap((alg) =>
      alg.suitableForClass
        .filter((idx) => alg.ramKB > DEVICE_CLASSES[idx].ramKB)
        .map(
          (idx) =>
            `${alg.name}: ${alg.ramKB} KB claimed to suit ${DEVICE_CLASSES[idx].name} (${DEVICE_CLASSES[idx].ramKB} KB)`
        )
    )
    expect(offenders).toEqual([])
  })

  it('lists every algorithm that fits the largest class as suiting it', () => {
    // The direction that caught the real bug. suitableForClass is hand-maintained
    // and may legitimately exclude a class for reasons beyond RAM (code size, stack
    // depth) — but an algorithm the top class can hold and that is excluded from it
    // is an unexplained contradiction between the two fields.
    const top = DEVICE_CLASSES[LARGEST_CLASS_IDX]
    const offenders = CONSTRAINED_ALGORITHMS.filter(
      (alg) => alg.ramKB <= top.ramKB && !alg.suitableForClass.includes(LARGEST_CLASS_IDX)
    ).map(
      (alg) => `${alg.name}: ${alg.ramKB} KB fits ${top.name} (${top.ramKB} KB) but is excluded`
    )
    expect(offenders).toEqual([])
  })

  it('no guidance sentence claims an algorithm fits a class the fit table excludes', () => {
    // The seam. The paragraph and the badge are rendered by the same component from
    // two different sources — hand-written prose and the fit table — and nothing
    // else compares them. Read the source rather than rendering: the guidance is an
    // inline literal keyed by class index, so a static read is exact and the render
    // would only reach one class at a time.
    //
    // Scoped to the SENTENCE, not the paragraph. Class 1's guidance legitimately
    // names ML-KEM-768 to say it does NOT fit; a paragraph-level check would have to
    // exempt that whole paragraph and would then miss a fit claim sitting next to it.
    const guidance = [
      ...explorerSource.matchAll(/selectedClassIdx === (\d+) &&\s*\n?\s*'([^']*)'/g),
    ]
    // Guard the guard: if the literals are refactored out of this file the regex
    // silently matches nothing and the test passes on an empty set.
    expect(guidance.length).toBe(DEVICE_CLASSES.length)

    const FIT_CLAIM =
      /\bfits?\b|\bcan run\b|\bsupports?\b|\bcomfortabl|\bfeasible\b|\bcan only use\b/i
    const offenders: string[] = []
    for (const [, idxStr, text] of guidance) {
      const idx = Number(idxStr)
      for (const sentence of text.split(/(?<=[.;])\s+/)) {
        if (!FIT_CLAIM.test(sentence)) continue
        if (/\bno\b|\bnot\b|\bexceeds?\b|\binfeasible\b/i.test(sentence)) continue
        for (const alg of CONSTRAINED_ALGORITHMS) {
          if (!sentence.includes(alg.name)) continue
          if (alg.suitableForClass.includes(idx)) continue
          offenders.push(
            `${DEVICE_CLASSES[idx].name}: "${sentence.trim()}" claims ${alg.name} fits, but the fit table excludes it`
          )
        }
      }
    }
    expect(offenders).toEqual([])
  })
})
