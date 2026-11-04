// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Wording the PKCS#11 v3.3 lesson track must keep:
 *  - where a lesson compares behaviour, the v3.2 way is named next to the draft's;
 *  - the engines' limit on SHAKE and KMAC output length is stated with its reason;
 *  - the draft is never called "vNext".
 */
import { describe, it, expect } from 'vitest'
import { V33_LESSONS } from './pkcs11LessonsV33'
import { TERM_BY_ID } from './pkcs11Glossary'

const lesson = (id: string) => {
  const l = V33_LESSONS.find((x) => x.id === id)
  if (!l) throw new Error(`lesson ${id} not found`)
  return l
}
const allText = (id: string) => JSON.stringify([lesson(id).setup, lesson(id).notes])

describe('v3.3 lesson wording', () => {
  it('lesson 1 states the SHAKE and KMAC output-length limit with its reason', () => {
    const text = lesson('v33-what-is-v33').setup
    expect(text).toContain('do not implement the SHAKE digest mechanisms')
    expect(text).toContain('C_DigestXof')
    expect(text).toContain('header does not declare')
  })

  it('the glossary explains the same limit', () => {
    const t = TERM_BY_ID['xof-digest-limit']
    expect(t.def).toContain('CKM_SHAKE_128')
    expect(t.def).toContain('result length of 0')
    expect(t.def).toContain('as the draft requires')
    expect(t.def).not.toContain('the engines here refuse')
  })

  it('lesson 2 names the before-3.3 way (two signs) beside the one-call way', () => {
    const text = allText('v33-composite-mldsa')
    expect(text).toContain('Before 3.3')
    expect(text).toContain('signs it twice')
    expect(text).toContain('After 3.3, one CKM_COMP_SIG call')
  })

  it('lesson 3 labels the hand-built steps as the before-3.3 way', () => {
    expect(allText('v33-composite-mlkem')).toContain('before-3.3 way')
  })

  it('lesson 4 says the external-mu mechanism refuses a context instead of ignoring it', () => {
    const text = allText('v33-external-mu')
    expect(text).toContain('refuse a non-empty one rather than ignore it')
    expect(text).not.toContain('ignores any context')
  })

  it('no lesson calls the draft "vNext"', () => {
    expect(JSON.stringify(V33_LESSONS)).not.toMatch(/vNext/i)
  })
})
