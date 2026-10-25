// SPDX-License-Identifier: AGPL-3.0-only
//
// The OpenSSL maintainer's words on LMS key generation, quoted in lesson L5, its quiz explanation
// and the glossary, are the words he wrote in github.com/openssl/openssl/discussions/29619
// (comment of 16 January 2026): "I am not planning on adding key generation or signing. ...
// It indicates that this should be done in hardware not software." A paraphrase is not put in
// quotation marks, and the quiz may only say "cited directly" about a verbatim quote.
import { describe, it, expect } from 'vitest'
import { OPENSSL_LESSONS } from './opensslLessons'
import { OPENSSL_QUIZZES } from './opensslQuiz'
import { TERMS } from './opensslGlossary'

const VERBATIM = 'this should be done in hardware not software'
const PARAPHRASE = 'should be hardware, not software'

const lessonSetup = OPENSSL_LESSONS.find((l) => l.id === 'honest-lms')?.setup ?? ''
const quizWhy =
  OPENSSL_QUIZZES['honest-lms']?.find((q) => q.q.includes('intentionally leave out LMS/HSS'))
    ?.why ?? ''
const glossaryDef = TERMS.find((t) => t.id === 'stateful-signature')?.def ?? ''

describe('OpenSSL Studio: the quoted maintainer words on LMS key generation', () => {
  it('finds the three places that carry the quote', () => {
    expect(lessonSetup).toContain('discussions/29619')
    expect(quizWhy).toContain('discussions/29619')
    expect(glossaryDef).toContain('discussions/29619')
  })

  it("puts the maintainer's verbatim words in quotation marks in all three", () => {
    expect(lessonSetup).toContain(`"${VERBATIM}"`)
    expect(quizWhy).toContain(`"${VERBATIM}"`)
    expect(glossaryDef).toContain(`"${VERBATIM}.`)
  })

  it('no longer quotes the paraphrase', () => {
    for (const text of [lessonSetup, quizWhy, glossaryDef]) expect(text).not.toContain(PARAPHRASE)
  })
})
