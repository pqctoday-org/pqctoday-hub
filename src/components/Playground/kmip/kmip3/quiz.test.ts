// SPDX-License-Identifier: AGPL-3.0-only
//
// quiz.test.ts — the Learn quiz answers must agree with the facts the lessons and the
// shared algorithm table state, and must not turn an idealized figure or a sample policy
// choice into a universal verdict. These tests read the question banks as a learner would:
// the right option plus its explanation.
import { describe, it, expect } from 'vitest'
import { QUIZZES } from './quiz'
import { LESSONS } from './learnLessons'
import { ALGO_FACTS } from '@/components/Playground/learnkit/algoFacts'
import type { QuizQuestion } from '@/components/Playground/learnkit/QuizCard'

const rightText = (q: QuizQuestion) => `${q.options[q.answer]} ${q.why}`
const allText = (q: QuizQuestion) => `${q.q} ${q.options.join(' ')} ${q.why}`
const BANKS = new Map(Object.entries(QUIZZES))
const bank = (id: string): QuizQuestion[] => {
  const questions = BANKS.get(id)
  if (!questions) throw new Error(`no quiz bank "${id}"`)
  return questions
}

describe('symmetric lesson quiz', () => {
  const aes128 = bank('symmetric').find((q) => /128-bit key search/.test(q.q))

  it('has a question about the AES-128 key-search count', () => {
    expect(aes128).toBeDefined()
  })

  it('does not present the idealized Grover query count as a verdict that AES-128 must go', () => {
    const q = aes128!
    // The right answer must make the replacement decision depend on policy and data needs,
    // and must not say AES-128 is broken or must be replaced.
    expect(q.options[q.answer]).toMatch(/policy/i)
    expect(q.options[q.answer]).toMatch(/assurance|confidential/i)
    expect(q.options[q.answer]).not.toMatch(/must be replaced|is broken|below acceptable/i)
    // The wrong answers include the unconditional verdict, so a learner can reject it.
    expect(q.options.some((o) => /broken by quantum computers/i.test(o))).toBe(true)
  })

  it('names the resource limit behind the query count', () => {
    const text = rightText(aes128!)
    expect(text).toMatch(/serial/i)
    expect(text).toMatch(/MAXDEPTH/)
  })

  it('says a new key does not re-encrypt data that already exists', () => {
    expect(rightText(aes128!)).toMatch(/re-encrypted/i)
  })

  it('never states a halved key strength as fact without the idealized, query-count framing', () => {
    for (const q of bank('symmetric')) {
      const text = allText(q)
      if (/~\s?64-bit|~\s?128-bit|halv/i.test(text)) {
        expect(text, q.q).toMatch(/idealized|quer(y|ies)/i)
      }
    }
  })
})

describe('hybrid lesson quiz', () => {
  const facts = ALGO_FACTS['X25519MLKEM768']
  const combiner = bank('hybrid').find((q) => /X25519MLKEM768/.test(q.q) && /combined/.test(q.q))

  it('the shared algorithm table records a concatenation combiner with no KDF', () => {
    expect(facts.basis).toMatch(/concatenation/i)
    expect(facts.basis).toMatch(/no KDF/i)
    expect(facts.secret).toBe(64)
  })

  it('the combiner question agrees with that table: concatenation, no KDF inside the KEM', () => {
    expect(combiner).toBeDefined()
    const text = rightText(combiner!)
    expect(text).toMatch(/concatenat/i)
    expect(text).toMatch(/no KDF/i)
    expect(text).toContain(`${facts.secret} bytes`)
  })

  it('separates the raw hybrid secret from the key schedule of the protocol that consumes it', () => {
    const text = rightText(combiner!)
    expect(text).toMatch(/key schedule/i)
    expect(text).toMatch(/not a finished session key/i)
    // The design goal is stated for the analysed construction, not as an absolute guarantee.
    expect(text).toMatch(/not a guarantee|other protocols/i)
  })

  it('no hybrid answer says the secrets are combined through a KDF', () => {
    for (const q of bank('hybrid')) {
      expect(rightText(q), q.q).not.toMatch(/combined through a KDF/i)
    }
  })
})

describe('certificate-services lesson quiz', () => {
  it('the lesson says a bare CreateKeyPair output can be certified by UID', () => {
    const lesson = LESSONS.find((l) => l.id === 'certificate-services')
    expect(lesson).toBeDefined()
    expect(lesson!.notes.join(' ')).toMatch(/bare CreateKeyPair output works too/)
  })

  it('no right answer requires registering a generated key before Certify', () => {
    for (const q of bank('certificate-services')) {
      const right = q.options[q.answer]
      expect(right, q.q).not.toMatch(/until the key is Register/i)
      expect(right, q.q).not.toMatch(/only accepts keys that were Register/i)
    }
  })

  it('the Certify-by-UID question teaches the live-lookup fallback', () => {
    const q = bank('certificate-services').find(
      (x) => /CreateKeyPair/.test(x.q) && /Certify/.test(x.q)
    )
    expect(q).toBeDefined()
    expect(q!.options[q!.answer]).toMatch(/live lookup/i)
    expect(q!.why).toMatch(/sample object/i)
  })
})

describe('migration claims across the quiz banks', () => {
  it('no answer promises a migration with zero changes or no code change', () => {
    for (const [id, questions] of Object.entries(QUIZZES)) {
      for (const q of questions) {
        expect(allText(q), `${id}: ${q.q}`).not.toMatch(/zero changes|no code change|no re-?issue/i)
      }
    }
  })

  it('the sign lesson notes that keys, certificates and verifiers still change', () => {
    const q = bank('sign').find((x) => /stays exactly the same/.test(x.q))
    expect(q).toBeDefined()
    expect(q!.why).toMatch(/reissued certificates/i)
    expect(q!.why).toMatch(/verifier/i)
  })
})
