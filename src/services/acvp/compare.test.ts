// SPDX-License-Identifier: AGPL-3.0-only
// Comparator rules C1–C6 (compare.ts). Two kinds of evidence:
//  - the four byte-exact NIST ACVP-Server sample files pinned in
//    __fixtures__/nist-acvp-server/PROVENANCE.json, unchanged, with every
//    negative case built here as a clearly labelled mutation of those public
//    answers (they are not NIST vectors);
//  - small hand-written references, independent of those files, so that each
//    rule has a minimal counterexample of its own.
// Nothing here runs an engine: a response compared with its own reference only
// proves the comparator, never cryptographic correctness.
import { describe, it, expect } from 'vitest'
import {
  compareToExpected,
  GoldenComparisonError,
  isFullMatch,
  nonmatchingCaseCount,
  type CompareOptions,
  type GoldenComparison,
  type GoldenMismatchProblem,
} from './compare'
import { parsePromptText, parsePromptValue } from './parser'
import type { AcvpPromptIR } from './ir'
import { FIXTURE_NAMES, readFixture, type FixtureName } from './node/fixtures'
import { executePrepared, preparePrompt } from './run'
import { createExpectedResultsFakeEngine } from './testing/expectedResultsFakeEngine'

const repo = process.cwd()

type Test = Record<string, unknown>
interface VS {
  vsId?: unknown
  testGroups: Array<{ tgId?: unknown; tests: Test[] } & Record<string, unknown>>
  [k: string]: unknown
}

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T

/** The comparison plus the invariant every outcome must satisfy: counts reconcile by unique expected case. */
const compare = (
  response: unknown,
  reference: unknown,
  options?: CompareOptions
): GoldenComparison => {
  const c = compareToExpected(response, reference, options)
  expect(c.matched + nonmatchingCaseCount(c) + c.unanswered).toBe(c.expectedTotal)
  return c
}

/** Answers only: the reference without its vector-set metadata, as a response file looks. */
const answersOf = (ref: VS): VS => ({ vsId: ref.vsId, testGroups: clone(ref.testGroups) })

const diffsOf = (c: GoldenComparison) =>
  c.mismatched.map((m) => [m.tgId, m.tcId, m.field, m.problem, m.expected, m.actual])

const rejection = (fn: () => unknown): GoldenComparisonError => {
  try {
    fn()
  } catch (e) {
    // A rejection must be the comparator's own error, never an unrelated exception.
    expect(e).toBeInstanceOf(GoldenComparisonError)
    return e as GoldenComparisonError
  }
  throw new Error('expected the comparison to be rejected, but it produced a result')
}

// ── the pinned NIST samples ─────────────────────────────────────────────────

const referenceOf = (n: FixtureName): VS =>
  JSON.parse(readFixture(repo, n, 'expectedResults.json')) as VS
const promptOf = (n: FixtureName): AcvpPromptIR => {
  const p = parsePromptText(readFixture(repo, n, 'prompt.json'))
  if (!p.ok) throw new Error('fixture prompt rejected')
  return p.ir
}
const TOTALS: Record<FixtureName, number> = {
  'ML-KEM-encapDecap-FIPS203': 165,
  'ML-DSA-sigVer-FIPS204': 180,
}
// answer fields the reference carries: encapsulation c+k (75×2) + decapsulation k (30) + key checks (60)
const FIELD_TOTALS: Record<FixtureName, number> = {
  'ML-KEM-encapDecap-FIPS203': 240,
  'ML-DSA-sigVer-FIPS204': 180,
}

const flipLastNibble = (hex: string): string => {
  const last = hex.slice(-1).toUpperCase()
  return hex.slice(0, -1) + (last === '0' ? '1' : '0')
}

describe.each(FIXTURE_NAMES)('pinned NIST sample %s', (name) => {
  const ref = referenceOf(name)
  const total = TOTALS[name]

  it('the pinned reference has the expected number of cases (guards the counts below)', () => {
    expect(ref.testGroups.reduce((n, g) => n + g.tests.length, 0)).toBe(total)
  })

  it.each([
    ['without prompt context', undefined],
    ['with the prompt it answers', { prompt: promptOf(name) }],
  ] as Array<[string, CompareOptions | undefined]>)(
    'every expected answer present → every case matches (%s)',
    (_label, options) => {
      const c = compare(answersOf(ref), ref, options)
      expect(c).toEqual({
        matched: total,
        mismatched: [],
        unanswered: 0,
        unexpected: [],
        expectedTotal: total,
      })
      expect(isFullMatch(c)).toBe(true)
    }
  )

  it('the reference compared with itself, metadata included, is only a positive control', () => {
    expect(compare(ref, ref).matched).toBe(total)
  })

  it('envelope framing and lower-case hex still match', () => {
    const lower = JSON.parse(JSON.stringify(answersOf(ref), (_k, v) => v)) as VS
    for (const g of lower.testGroups) {
      for (const t of g.tests) {
        for (const [k, v] of Object.entries(t)) if (typeof v === 'string') t[k] = v.toLowerCase()
      }
    }
    expect(compare([{ acvVersion: '1.0' }, lower], ref).matched).toBe(total)
  })

  it('case ids only, no answers: nothing matches, every case is nonmatching, nothing is "unanswered"', () => {
    const idsOnly: VS = {
      vsId: ref.vsId,
      testGroups: ref.testGroups.map((g) => ({
        tgId: g.tgId,
        tests: g.tests.map((t) => ({ tcId: t.tcId })),
      })),
    }
    const c = compare(idsOnly, ref)
    expect(c.matched).toBe(0)
    expect(c.unanswered).toBe(0)
    expect(c.unexpected).toEqual([])
    expect(nonmatchingCaseCount(c)).toBe(total)
    expect(c.mismatched).toHaveLength(FIELD_TOTALS[name])
    expect(new Set(c.mismatched.map((m) => m.problem))).toEqual(new Set(['missing']))
    // field differences are not cases: the two counts differ for ML-KEM encapsulation (c and k)
    expect(c.mismatched.length >= nonmatchingCaseCount(c)).toBe(true)
    expect(isFullMatch(c)).toBe(false)
  })

  it('empty response groups: every case is unanswered, no full match', () => {
    const c = compare({ vsId: ref.vsId, testGroups: [] }, ref)
    expect(c).toMatchObject({ matched: 0, mismatched: [], unanswered: total, expectedTotal: total })
    expect(isFullMatch(c)).toBe(false)
  })

  it('removing any one answer field of any one operation leaves that case unmatched, all others matched', () => {
    let seen = 0
    ref.testGroups.forEach((g, gi) => {
      const fields = Object.keys(g.tests[0]).filter((f) => f !== 'tcId')
      for (const field of fields) {
        const resp = answersOf(ref)
        delete resp.testGroups[gi].tests[0][field]
        const c = compare(resp, ref)
        const label = `tgId ${String(g.tgId)} field ${field}`
        expect(c.matched, label).toBe(total - 1)
        expect(c.unanswered, label).toBe(0)
        expect(diffsOf(c), label).toEqual([
          [g.tgId, g.tests[0].tcId, field, 'missing', expect.anything(), null],
        ])
        seen++
      }
    })
    expect(seen).toBeGreaterThanOrEqual(4)
  })

  it('both reference outcomes of a boolean answer are exercised when the sample has them', () => {
    const outcomes = new Set<unknown>()
    ref.testGroups.forEach((g, gi) =>
      g.tests.forEach((t, ti) => {
        if (typeof t.testPassed !== 'boolean') return
        outcomes.add(t.testPassed)
        const missing = answersOf(ref)
        delete missing.testGroups[gi].tests[ti].testPassed
        const flipped = answersOf(ref)
        flipped.testGroups[gi].tests[ti].testPassed = !t.testPassed
        for (const resp of [missing, flipped]) {
          const c = compare(resp, ref)
          expect(c.matched).toBe(total - 1)
          expect(nonmatchingCaseCount(c)).toBe(1)
        }
      })
    )
    expect(outcomes).toEqual(new Set([true, false]))
  })

  it('one changed answer makes only its case nonmatching; the rest stay counted', () => {
    const resp = answersOf(ref)
    const t = resp.testGroups[0].tests[0]
    const field = Object.keys(t).find((f) => f !== 'tcId') as string
    const was = t[field]
    t[field] = typeof was === 'boolean' ? !was : flipLastNibble(was as string)
    const c = compare(resp, ref)
    expect(c.matched).toBe(total - 1)
    expect(c.mismatched).toHaveLength(1)
    expect(c.mismatched[0]).toMatchObject({
      tgId: ref.testGroups[0].tgId,
      tcId: t.tcId,
      field,
      problem: 'different',
    })
  })

  it('a well-formed case that is not in the sample is reported, and the sample is not a full match', () => {
    const resp = answersOf(ref)
    const last = resp.testGroups[resp.testGroups.length - 1]
    last.tests.push({ ...clone(last.tests[0]), tcId: 987654 })
    const c = compare(resp, ref)
    expect(c.matched).toBe(total)
    expect(c.unexpected).toEqual([{ tgId: last.tgId, tcId: 987654 }])
    expect(isFullMatch(c)).toBe(false)
  })

  it('the pinned reference is rejected when it is for another prompt', () => {
    const other = FIXTURE_NAMES.find((n) => n !== name) as FixtureName
    const e = rejection(() => compareToExpected(answersOf(ref), ref, { prompt: promptOf(other) }))
    expect(e.source).toBe('reference')
  })

  it('with the prompt, a reference that names another algorithm, mode and revision is rejected on that alone', () => {
    const other = referenceOf(FIXTURE_NAMES.find((n) => n !== name) as FixtureName)
    // Same cases and answers as the prompt expects; only the stated identity differs.
    const swapped: VS = {
      ...clone(ref),
      algorithm: other.algorithm,
      mode: other.mode,
      revision: other.revision,
    }
    const e = rejection(() =>
      compareToExpected(answersOf(swapped), swapped, { prompt: promptOf(name) })
    )
    expect(e.source).toBe('reference')
    expect(e.diagnostics.map((d) => d.keyword)).toEqual(['conflict'])
  })

  it('with the prompt, a reference that holds a case the prompt does not have is rejected', () => {
    const long = clone(ref)
    const last = long.testGroups[long.testGroups.length - 1]
    last.tests.push({ ...clone(last.tests[0]), tcId: 987654 })
    const e = rejection(() => compareToExpected(answersOf(long), long, { prompt: promptOf(name) }))
    expect(e.source).toBe('reference')
    expect(e.diagnostics.map((d) => d.keyword)).toEqual(['coverage'])
    expect(e.diagnostics[0].reason).toContain('not in the prompt')
  })

  it('with the prompt, a reference missing one of the prompt’s cases is rejected', () => {
    const short = clone(ref)
    short.testGroups[0].tests.pop()
    const e = rejection(() =>
      compareToExpected(answersOf(short), short, { prompt: promptOf(name) })
    )
    expect(e.source).toBe('reference')
    expect(e.diagnostics.some((d) => d.keyword === 'coverage')).toBe(true)
  })
})

describe('the prompt pins the answer fields each ML-KEM operation needs', () => {
  const name: FixtureName = 'ML-KEM-encapDecap-FIPS203'
  const prompt = promptOf(name)
  const decapGroup = prompt.testGroups.findIndex((g) => g.properties.function === 'decapsulation')

  it('a decapsulation case whose reference carries testPassed is rejected with the prompt, accepted without', () => {
    const ref = referenceOf(name)
    const group = ref.testGroups.find((g) => g.tgId === prompt.testGroups[decapGroup].tgId)!
    group.tests[0] = { tcId: group.tests[0].tcId, testPassed: true }
    expect(compare(answersOf(ref), ref).matched).toBe(165)
    const e = rejection(() => compareToExpected(answersOf(ref), ref, { prompt }))
    expect(e.source).toBe('reference')
    expect(e.diagnostics.some((d) => d.keyword === 'function-fields')).toBe(true)
  })

  it('a prompt for a different vector set id is rejected', () => {
    const ref = referenceOf(name)
    const other = { ...prompt, vsId: prompt.vsId + 1 }
    const e = rejection(() => compareToExpected(answersOf(ref), ref, { prompt: other }))
    expect(e.diagnostics.some((d) => d.path === '$.vsId')).toBe(true)
  })

  it('an envelope prompt fixes the framing version a response may carry', () => {
    const env = parsePromptValue([
      { acvVersion: '1.0' },
      JSON.parse(readFixture(repo, name, 'prompt.json')),
    ])
    if (!env.ok) throw new Error('envelope prompt rejected')
    const ref = referenceOf(name)
    const ok = compare([{ acvVersion: '1.0' }, answersOf(ref)], ref, { prompt: env.ir })
    expect(ok.matched).toBe(165)
    const e = rejection(() =>
      compareToExpected([{ acvVersion: '2.0' }, answersOf(ref)], ref, { prompt: env.ir })
    )
    expect(e.source).toBe('response')
    expect(e.diagnostics.some((d) => d.keyword === 'envelope')).toBe(true)
  })
})

// ── minimal counterexamples, independent of the NIST files ──────────────────

const kemRef = (): VS => ({
  vsId: 7,
  algorithm: 'ML-KEM',
  mode: 'encapDecap',
  revision: 'FIPS203',
  testGroups: [
    {
      tgId: 1, // encapsulation: c and k
      tests: [
        { tcId: 1, c: 'AABB', k: 'CCDD' },
        { tcId: 2, c: '0102', k: '0304' },
      ],
    },
    { tgId: 2, tests: [{ tcId: 1, k: 'EEFF' }] }, // decapsulation: k; same tcId 1 as in group 1
    {
      tgId: 3, // key check: testPassed, both outcomes
      tests: [
        { tcId: 1, testPassed: true },
        { tcId: 2, testPassed: false },
      ],
    },
  ],
})

const dsaRef = (): VS => ({
  vsId: 9,
  algorithm: 'ML-DSA',
  mode: 'sigVer',
  revision: 'FIPS204',
  testGroups: [
    {
      tgId: 1,
      tests: [
        { tcId: 1, testPassed: true },
        { tcId: 2, testPassed: false },
      ],
    },
    { tgId: 2, tests: [{ tcId: 1, testPassed: false }] },
  ],
})

type Diff = [
  number,
  number,
  string,
  GoldenMismatchProblem,
  string | boolean | null,
  string | boolean | null,
]

interface Row {
  name: string
  ref?: () => VS
  mutate: (r: VS) => unknown
  matched: number
  unanswered?: number
  unexpected?: Array<{ tgId: number; tcId: number }>
  diffs?: Diff[]
  /** Distinct nonmatching cases (field differences are counted separately). */
  cases?: number
}

const lowerHex = (r: VS): VS => {
  for (const g of r.testGroups) {
    for (const t of g.tests) {
      for (const [k, v] of Object.entries(t)) if (typeof v === 'string') t[k] = v.toLowerCase()
    }
  }
  return r
}

const set = (r: VS, gi: number, ti: number, patch: Test): VS => {
  Object.assign(r.testGroups[gi].tests[ti], patch)
  return r
}
const drop = (r: VS, gi: number, ti: number, field: string): VS => {
  delete r.testGroups[gi].tests[ti][field]
  return r
}

const COMPLETE: Row[] = [
  { name: 'complete response matches every case', mutate: (r) => r, matched: 5 },
  { name: 'lower-case hex matches', mutate: lowerHex, matched: 5 },
  {
    name: 'a valid false answer is preserved: false equals false',
    ref: dsaRef,
    mutate: (r) => r,
    matched: 3,
  },
  {
    name: 'envelope framing with no version conflict matches',
    mutate: (r) => [{ acvVersion: '1.0' }, r],
    matched: 5,
  },
  {
    name: 'a response that repeats the reference identity is accepted',
    mutate: (r) => ({ ...r, algorithm: 'ML-KEM', mode: 'encapDecap', revision: 'FIPS203' }),
    matched: 5,
  },
]

const ABSENT: Row[] = [
  {
    name: 'one case absent → unanswered, never matched',
    mutate: (r) => (r.testGroups[0].tests.splice(1, 1), r),
    matched: 4,
    unanswered: 1,
  },
  {
    name: 'one group absent → its cases unanswered',
    mutate: (r) => (r.testGroups.splice(2, 1), r),
    matched: 3,
    unanswered: 2,
  },
  {
    name: 'a subset response keeps the rest unanswered',
    mutate: (r) => ({ vsId: r.vsId, testGroups: [r.testGroups[1]] }),
    matched: 1,
    unanswered: 4,
  },
  {
    name: 'empty testGroups → everything unanswered, no full match',
    mutate: (r) => ({ vsId: r.vsId, testGroups: [] }),
    matched: 0,
    unanswered: 5,
  },
]

const MISSING: Row[] = [
  {
    name: 'encapsulation without c (k correct)',
    mutate: (r) => drop(r, 0, 0, 'c'),
    matched: 4,
    diffs: [[1, 1, 'c', 'missing', 'AABB', null]],
    cases: 1,
  },
  {
    name: 'encapsulation without k (c correct)',
    mutate: (r) => drop(r, 0, 0, 'k'),
    matched: 4,
    diffs: [[1, 1, 'k', 'missing', 'CCDD', null]],
    cases: 1,
  },
  {
    name: 'encapsulation without c and k: two field differences, one case',
    mutate: (r) => drop(drop(r, 0, 0, 'c'), 0, 0, 'k'),
    matched: 4,
    diffs: [
      [1, 1, 'c', 'missing', 'AABB', null],
      [1, 1, 'k', 'missing', 'CCDD', null],
    ],
    cases: 1,
  },
  {
    name: 'decapsulation without k',
    mutate: (r) => drop(r, 1, 0, 'k'),
    matched: 4,
    diffs: [[2, 1, 'k', 'missing', 'EEFF', null]],
    cases: 1,
  },
  {
    name: 'key check without testPassed (reference true)',
    mutate: (r) => drop(r, 2, 0, 'testPassed'),
    matched: 4,
    diffs: [[3, 1, 'testPassed', 'missing', true, null]],
    cases: 1,
  },
  {
    name: 'key check without testPassed (reference false)',
    mutate: (r) => drop(r, 2, 1, 'testPassed'),
    matched: 4,
    diffs: [[3, 2, 'testPassed', 'missing', false, null]],
    cases: 1,
  },
  {
    name: 'signature check without testPassed (reference true)',
    ref: dsaRef,
    mutate: (r) => drop(r, 0, 0, 'testPassed'),
    matched: 2,
    diffs: [[1, 1, 'testPassed', 'missing', true, null]],
    cases: 1,
  },
  {
    name: 'signature check without testPassed (reference false)',
    ref: dsaRef,
    mutate: (r) => drop(r, 0, 1, 'testPassed'),
    matched: 2,
    diffs: [[1, 2, 'testPassed', 'missing', false, null]],
    cases: 1,
  },
  {
    name: 'a wrong c and a missing k in one case: still one case',
    mutate: (r) => drop(set(r, 0, 0, { c: '0000' }), 0, 0, 'k'),
    matched: 4,
    diffs: [
      [1, 1, 'c', 'different', 'AABB', '0000'],
      [1, 1, 'k', 'missing', 'CCDD', null],
    ],
    cases: 1,
  },
  {
    name: 'case ids only: every case nonmatching, seven fields missing',
    mutate: (r) => ({
      vsId: r.vsId,
      testGroups: r.testGroups.map((g) => ({
        tgId: g.tgId,
        tests: g.tests.map((t) => ({ tcId: t.tcId })),
      })),
    }),
    matched: 0,
    cases: 5,
    diffs: [
      [1, 1, 'c', 'missing', 'AABB', null],
      [1, 1, 'k', 'missing', 'CCDD', null],
      [1, 2, 'c', 'missing', '0102', null],
      [1, 2, 'k', 'missing', '0304', null],
      [2, 1, 'k', 'missing', 'EEFF', null],
      [3, 1, 'testPassed', 'missing', true, null],
      [3, 2, 'testPassed', 'missing', false, null],
    ],
  },
]

const WRONG: Row[] = [
  {
    name: 'different k',
    mutate: (r) => set(r, 1, 0, { k: '0000' }),
    matched: 4,
    diffs: [[2, 1, 'k', 'different', 'EEFF', '0000']],
    cases: 1,
  },
  {
    name: 'one changed byte in c, k intact',
    mutate: (r) => set(r, 0, 1, { c: '0103' }),
    matched: 4,
    diffs: [[1, 2, 'c', 'different', '0102', '0103']],
    cases: 1,
  },
  {
    name: 'true answered as false',
    mutate: (r) => set(r, 2, 0, { testPassed: false }),
    matched: 4,
    diffs: [[3, 1, 'testPassed', 'different', true, false]],
    cases: 1,
  },
  {
    name: 'false answered as true',
    mutate: (r) => set(r, 2, 1, { testPassed: true }),
    matched: 4,
    diffs: [[3, 2, 'testPassed', 'different', false, true]],
    cases: 1,
  },
  {
    name: 'k as a number',
    mutate: (r) => set(r, 1, 0, { k: 5 }),
    matched: 4,
    diffs: [[2, 1, 'k', 'invalid', 'EEFF', null]],
    cases: 1,
  },
  {
    name: 'k as a boolean',
    mutate: (r) => set(r, 1, 0, { k: true }),
    matched: 4,
    diffs: [[2, 1, 'k', 'invalid', 'EEFF', true]],
    cases: 1,
  },
  {
    name: 'k as null',
    mutate: (r) => set(r, 1, 0, { k: null }),
    matched: 4,
    diffs: [[2, 1, 'k', 'invalid', 'EEFF', null]],
    cases: 1,
  },
  {
    name: 'testPassed as a string',
    mutate: (r) => set(r, 2, 0, { testPassed: 'true' }),
    matched: 4,
    diffs: [[3, 1, 'testPassed', 'invalid', true, 'TRUE']],
    cases: 1,
  },
  {
    name: 'testPassed as a number',
    mutate: (r) => set(r, 2, 1, { testPassed: 0 }),
    matched: 4,
    diffs: [[3, 2, 'testPassed', 'invalid', false, null]],
    cases: 1,
  },
  {
    name: 'testPassed as null',
    ref: dsaRef,
    mutate: (r) => set(r, 0, 1, { testPassed: null }),
    matched: 2,
    diffs: [[1, 2, 'testPassed', 'invalid', false, null]],
    cases: 1,
  },
  {
    name: 'odd-length hex',
    mutate: (r) => set(r, 1, 0, { k: 'EEF' }),
    matched: 4,
    diffs: [[2, 1, 'k', 'invalid', 'EEFF', 'EEF']],
    cases: 1,
  },
  {
    name: 'non-hex text of even length',
    mutate: (r) => set(r, 1, 0, { k: 'ZZZZ' }),
    matched: 4,
    diffs: [[2, 1, 'k', 'invalid', 'EEFF', 'ZZZZ']],
    cases: 1,
  },
  {
    name: 'a decapsulation case carrying c as well as k',
    mutate: (r) => set(r, 1, 0, { c: 'AABB' }),
    matched: 4,
    diffs: [[2, 1, 'c', 'unexpected', null, 'AABB']],
    cases: 1,
  },
  {
    name: 'an encapsulation case carrying testPassed',
    mutate: (r) => set(r, 0, 0, { testPassed: true }),
    matched: 4,
    diffs: [[1, 1, 'testPassed', 'unexpected', null, true]],
    cases: 1,
  },
  {
    name: 'a field no schema defines',
    mutate: (r) => set(r, 1, 0, { extra: 7 }),
    matched: 4,
    diffs: [[2, 1, 'extra', 'unexpected', null, null]],
    cases: 1,
  },
  {
    name: 'a signature case carrying k',
    ref: dsaRef,
    mutate: (r) => set(r, 0, 0, { k: 'AA' }),
    matched: 2,
    diffs: [[1, 1, 'k', 'unexpected', null, 'AA']],
    cases: 1,
  },
  {
    name: 'the same tcId in two groups is two cases: a wrong answer in one leaves the other matched',
    mutate: (r) => set(r, 1, 0, { k: '0000' }),
    matched: 4,
    diffs: [[2, 1, 'k', 'different', 'EEFF', '0000']],
    cases: 1,
  },
]

const EXTRA: Row[] = [
  {
    name: 'a well-formed extra case in a known group is reported',
    mutate: (r) => (r.testGroups[1].tests.push({ tcId: 99, k: 'AA' }), r),
    matched: 5,
    unexpected: [{ tgId: 2, tcId: 99 }],
  },
  {
    name: 'a well-formed extra group is reported case by case',
    mutate: (r) => (
      r.testGroups.push({
        tgId: 9,
        tests: [
          { tcId: 1, testPassed: true },
          { tcId: 2, testPassed: false },
        ],
      }),
      r
    ),
    matched: 5,
    unexpected: [
      { tgId: 9, tcId: 1 },
      { tgId: 9, tcId: 2 },
    ],
  },
  {
    name: 'a case moved to the wrong group is unexpected there and unanswered where it belongs',
    mutate: (r) => (r.testGroups[1].tests.push(r.testGroups[0].tests.splice(1, 1)[0]), r),
    matched: 4,
    unanswered: 1,
    unexpected: [{ tgId: 2, tcId: 2 }],
  },
]

describe.each([
  ['complete answers', COMPLETE],
  ['absent cases', ABSENT],
  ['present cases missing an output', MISSING],
  ['wrong, mistyped, non-hex or unpermitted answers', WRONG],
  ['extra cases', EXTRA],
])('behaviour: %s', (_title, rows: Row[]) => {
  it.each(rows)('$name', (row) => {
    const reference = (row.ref ?? kemRef)()
    const c = compare(row.mutate(answersOf(reference)), reference)
    expect(c.matched).toBe(row.matched)
    expect(c.unanswered).toBe(row.unanswered ?? 0)
    expect(c.unexpected).toEqual(row.unexpected ?? [])
    expect(diffsOf(c)).toEqual(row.diffs ?? [])
    expect(nonmatchingCaseCount(c)).toBe(row.cases ?? 0)
    expect(c.expectedTotal).toBe(reference.testGroups.reduce((n, g) => n + g.tests.length, 0))
    expect(isFullMatch(c)).toBe(
      row.matched === c.expectedTotal && !row.diffs?.length && !row.unexpected?.length
    )
  })
})

describe('the comparison result keeps its documented shape', () => {
  it('has exactly the five fields consumers read, and field entries carry a problem label', () => {
    const resp = answersOf(kemRef())
    drop(resp, 0, 0, 'c')
    const c = compare(resp, kemRef())
    expect(Object.keys(c).sort()).toEqual([
      'expectedTotal',
      'matched',
      'mismatched',
      'unanswered',
      'unexpected',
    ])
    expect(Object.keys(c.mismatched[0]).sort()).toEqual([
      'actual',
      'expected',
      'field',
      'problem',
      'tcId',
      'tgId',
    ])
  })
})

// ── rejections ──────────────────────────────────────────────────────────────

interface Reject {
  name: string
  ref?: () => unknown
  mutate: (r: VS) => unknown
  keyword: string
  path?: string
}

const RESPONSE_REJECTIONS: Reject[] = [
  { name: 'null response', mutate: () => null, keyword: 'type', path: '$' },
  { name: 'a string instead of a vector set', mutate: () => 'x', keyword: 'type', path: '$' },
  { name: 'a number instead of a vector set', mutate: () => 42, keyword: 'type', path: '$' },
  { name: 'an empty array', mutate: () => [], keyword: 'envelope', path: '$' },
  {
    name: 'a three-element array',
    mutate: (r) => [{ acvVersion: '1.0' }, r, r],
    keyword: 'envelope',
    path: '$',
  },
  {
    name: 'an envelope head without acvVersion',
    mutate: (r) => [{}, r],
    keyword: 'envelope',
    path: '$[0].acvVersion',
  },
  {
    name: 'an envelope acvVersion that is not text',
    mutate: (r) => [{ acvVersion: 1 }, r],
    keyword: 'envelope',
    path: '$[0].acvVersion',
  },
  {
    name: 'an envelope head with another property',
    mutate: (r) => [{ acvVersion: '1.0', note: 'x' }, r],
    keyword: 'envelope',
    path: '$[0].note',
  },
  {
    name: 'an envelope whose vector set is null',
    mutate: () => [{ acvVersion: '1.0' }, null],
    keyword: 'type',
    path: '$[1]',
  },
  {
    name: 'a framing version that conflicts with the expected results’ envelope',
    ref: () => [{ acvVersion: '1.0' }, kemRef()],
    mutate: (r) => [{ acvVersion: '2.0' }, r],
    keyword: 'envelope',
  },
  {
    name: 'missing vsId',
    mutate: (r) => (delete r.vsId, r),
    keyword: 'required',
    path: '$.vsId',
  },
  { name: 'vsId as text', mutate: (r) => ({ ...r, vsId: '7' }), keyword: 'type', path: '$.vsId' },
  { name: 'negative vsId', mutate: (r) => ({ ...r, vsId: -1 }), keyword: 'type', path: '$.vsId' },
  {
    name: 'fractional vsId',
    mutate: (r) => ({ ...r, vsId: 7.5 }),
    keyword: 'type',
    path: '$.vsId',
  },
  { name: 'null vsId', mutate: (r) => ({ ...r, vsId: null }), keyword: 'type', path: '$.vsId' },
  {
    name: 'another vector set’s vsId',
    mutate: (r) => ({ ...r, vsId: 8 }),
    keyword: 'identity',
    path: '$.vsId',
  },
  {
    name: 'missing testGroups',
    mutate: (r) => (delete (r as { testGroups?: unknown }).testGroups, r),
    keyword: 'required',
    path: '$.testGroups',
  },
  {
    name: 'testGroups as an object',
    mutate: (r) => ({ ...r, testGroups: {} }),
    keyword: 'type',
    path: '$.testGroups',
  },
  {
    name: 'testGroups as null',
    mutate: (r) => ({ ...r, testGroups: null }),
    keyword: 'type',
    path: '$.testGroups',
  },
  {
    name: 'a null group',
    mutate: (r) => ({ ...r, testGroups: [null, ...r.testGroups] }),
    keyword: 'type',
    path: '$.testGroups[0]',
  },
  {
    name: 'a group that is an array',
    mutate: (r) => ({ ...r, testGroups: [[], ...r.testGroups] }),
    keyword: 'type',
    path: '$.testGroups[0]',
  },
  {
    name: 'an empty group object',
    mutate: (r) => ({ ...r, testGroups: [{}, ...r.testGroups] }),
    keyword: 'required',
    path: '$.testGroups[0].tgId',
  },
  {
    name: 'a group without tests',
    mutate: (r) => ({ ...r, testGroups: [{ tgId: 8 }, ...r.testGroups] }),
    keyword: 'required',
    path: '$.testGroups[0].tests',
  },
  {
    name: 'a group with an empty tests list',
    mutate: (r) => ({ ...r, testGroups: [{ tgId: 8, tests: [] }, ...r.testGroups] }),
    keyword: 'minItems',
    path: '$.testGroups[0].tests',
  },
  {
    name: 'tests as an object',
    mutate: (r) => ({ ...r, testGroups: [{ tgId: 8, tests: {} }, ...r.testGroups] }),
    keyword: 'type',
    path: '$.testGroups[0].tests',
  },
  {
    name: 'a group without tgId',
    mutate: (r) => (delete r.testGroups[1].tgId, r),
    keyword: 'required',
    path: '$.testGroups[1].tgId',
  },
  {
    name: 'tgId as text',
    mutate: (r) => ((r.testGroups[1].tgId = '2'), r),
    keyword: 'type',
    path: '$.testGroups[1].tgId',
  },
  {
    name: 'negative tgId',
    mutate: (r) => ((r.testGroups[1].tgId = -2), r),
    keyword: 'type',
    path: '$.testGroups[1].tgId',
  },
  {
    name: 'a null test',
    mutate: (r) => (r.testGroups[0].tests.unshift(null as unknown as Test), r),
    keyword: 'type',
    path: '$.testGroups[0].tests[0]',
  },
  {
    name: 'a test that is an array',
    mutate: (r) => (r.testGroups[0].tests.unshift([] as unknown as Test), r),
    keyword: 'type',
    path: '$.testGroups[0].tests[0]',
  },
  {
    name: 'an empty test object',
    mutate: (r) => (r.testGroups[0].tests.unshift({}), r),
    keyword: 'required',
    path: '$.testGroups[0].tests[0].tcId',
  },
  {
    name: 'a test without tcId',
    mutate: (r) => (delete r.testGroups[0].tests[1].tcId, r),
    keyword: 'required',
    path: '$.testGroups[0].tests[1].tcId',
  },
  {
    name: 'tcId as text',
    mutate: (r) => ((r.testGroups[0].tests[1].tcId = '2'), r),
    keyword: 'type',
    path: '$.testGroups[0].tests[1].tcId',
  },
  {
    name: 'fractional tcId',
    mutate: (r) => ((r.testGroups[0].tests[1].tcId = 2.5), r),
    keyword: 'type',
    path: '$.testGroups[0].tests[1].tcId',
  },
  {
    name: 'null tcId',
    mutate: (r) => ((r.testGroups[0].tests[1].tcId = null), r),
    keyword: 'type',
    path: '$.testGroups[0].tests[1].tcId',
  },
  {
    name: 'a duplicate tgId even though the duplicate agrees with the original',
    mutate: (r) => (r.testGroups.push(clone(r.testGroups[0])), r),
    keyword: 'unique',
    path: '$.testGroups[3].tgId',
  },
  {
    name: 'a duplicate tcId in one group even though the values agree',
    mutate: (r) => (r.testGroups[0].tests.push(clone(r.testGroups[0].tests[0])), r),
    keyword: 'unique',
    path: '$.testGroups[0].tests[2].tcId',
  },
  {
    name: 'an algorithm that conflicts with the expected results',
    mutate: (r) => ({ ...r, algorithm: 'ML-DSA' }),
    keyword: 'identity',
  },
  {
    name: 'a revision that conflicts with the expected results',
    mutate: (r) => ({ ...r, revision: 'FIPS999' }),
    keyword: 'identity',
  },
  {
    name: 'an algorithm that is not text',
    mutate: (r) => ({ ...r, algorithm: 5 }),
    keyword: 'type',
    path: '$.algorithm',
  },
  {
    name: 'an empty algorithm',
    mutate: (r) => ({ ...r, algorithm: '' }),
    keyword: 'type',
    path: '$.algorithm',
  },
  {
    name: 'a malformed extra case (tcId as text)',
    mutate: (r) => (r.testGroups[1].tests.push({ tcId: '99', k: 'AA' }), r),
    keyword: 'type',
  },
  {
    name: 'duplicate extra cases',
    mutate: (r) => (r.testGroups[1].tests.push({ tcId: 99, k: 'AA' }, { tcId: 99, k: 'AA' }), r),
    keyword: 'unique',
  },
  {
    name: 'an extra case with a mistyped answer',
    mutate: (r) => (r.testGroups[1].tests.push({ tcId: 99, c: 5 }), r),
    keyword: 'invalid',
    path: '.c',
  },
  {
    name: 'an extra case with an odd-length hex answer',
    mutate: (r) => (r.testGroups[1].tests.push({ tcId: 99, k: 'AAA' }), r),
    keyword: 'invalid',
    path: '.k',
  },
  {
    name: 'an extra case with a field no schema defines',
    mutate: (r) => (r.testGroups[1].tests.push({ tcId: 99, nonsense: 1 }), r),
    keyword: 'unexpected',
    path: '.nonsense',
  },
  {
    name: 'an extra group that duplicates a known tgId',
    mutate: (r) => (r.testGroups.push({ tgId: 2, tests: [{ tcId: 50, k: 'AA' }] }), r),
    keyword: 'unique',
  },
]

describe('malformed or conflicting responses are rejected before anything is counted', () => {
  it.each(RESPONSE_REJECTIONS)('$name', (row) => {
    const reference = row.ref ? row.ref() : kemRef()
    const e = rejection(() => compareToExpected(row.mutate(answersOf(kemRef())), reference))
    expect(e.source).toBe('response')
    expect(e.message).toMatch(/^The response cannot be compared: /)
    expect(
      e.diagnostics.some(
        (d) => d.keyword === row.keyword && (row.path === undefined || d.path.includes(row.path))
      ),
      JSON.stringify(e.diagnostics)
    ).toBe(true)
  })

  it('a rejection reports every problem found, not only the first', () => {
    const e = rejection(() =>
      compareToExpected({ vsId: 'x', testGroups: [null, { tgId: 1 }] }, kemRef())
    )
    expect(e.diagnostics.length).toBeGreaterThanOrEqual(3)
  })
})

const REFERENCE_REJECTIONS: Reject[] = [
  { name: 'a null reference', ref: () => null, mutate: (r) => r, keyword: 'type', path: '$' },
  {
    name: 'a reference with no cases',
    ref: () => ({ vsId: 7, testGroups: [] }),
    mutate: (r) => r,
    keyword: 'minItems',
  },
  {
    name: 'a reference group with an empty tests list',
    ref: () => ({ vsId: 7, testGroups: [{ tgId: 1, tests: [] }] }),
    mutate: (r) => r,
    keyword: 'minItems',
  },
  {
    name: 'a reference without vsId',
    ref: () => ({ testGroups: [{ tgId: 1, tests: [{ tcId: 1, testPassed: true }] }] }),
    mutate: (r) => r,
    keyword: 'required',
    path: '$.vsId',
  },
  {
    name: 'a duplicate tgId in the reference, even when the copies agree',
    ref: () => {
      const d = kemRef()
      d.testGroups.push(clone(d.testGroups[0]))
      return d
    },
    mutate: (r) => r,
    keyword: 'unique',
  },
  {
    name: 'a duplicate tcId in a reference group',
    ref: () => {
      const d = kemRef()
      d.testGroups[0].tests.push(clone(d.testGroups[0].tests[0]))
      return d
    },
    mutate: (r) => r,
    keyword: 'unique',
  },
  {
    name: 'a reference case with no answer at all',
    ref: () => {
      const d = kemRef()
      d.testGroups[0].tests.push({ tcId: 3 })
      return d
    },
    mutate: (r) => r,
    keyword: 'required',
  },
  {
    name: 'a reference answer of the wrong type',
    ref: () => {
      const d = kemRef()
      d.testGroups[2].tests[0].testPassed = 'true'
      return d
    },
    mutate: (r) => r,
    keyword: 'invalid',
  },
  {
    name: 'a reference answer that is not valid hex',
    ref: () => {
      const d = kemRef()
      d.testGroups[1].tests[0].k = 'ZZ'
      return d
    },
    mutate: (r) => r,
    keyword: 'invalid',
  },
  {
    name: 'a reference field no schema defines',
    ref: () => {
      const d = kemRef()
      d.testGroups[1].tests[0].other = 'AA'
      return d
    },
    mutate: (r) => r,
    keyword: 'unexpected',
  },
  {
    name: 'a reference ML-KEM case carrying c without k',
    ref: () => {
      const d = kemRef()
      delete d.testGroups[0].tests[0].k
      return d
    },
    mutate: (r) => r,
    keyword: 'function-fields',
  },
  {
    name: 'a reference ML-KEM case mixing k and testPassed',
    ref: () => {
      const d = kemRef()
      d.testGroups[1].tests[0].testPassed = true
      return d
    },
    mutate: (r) => r,
    keyword: 'function-fields',
  },
  {
    name: 'a reference ML-DSA case with a hex answer',
    ref: () => {
      const d = dsaRef()
      d.testGroups[0].tests[0].k = 'AA'
      return d
    },
    mutate: (r) => r,
    keyword: 'function-fields',
  },
  {
    name: 'a reference for a revision no schema is pinned for',
    ref: () => ({ ...kemRef(), revision: 'FIPS999' }),
    mutate: (r) => r,
    keyword: 'unsupported-vector-set',
  },
  {
    name: 'a reference naming only some of algorithm, mode and revision',
    ref: () => {
      const d = kemRef()
      delete d.revision
      return d
    },
    mutate: (r) => r,
    keyword: 'identity',
  },
  {
    name: 'a reference group that is not an object',
    ref: () => ({ vsId: 7, testGroups: [3] }),
    mutate: (r) => r,
    keyword: 'type',
  },
]

describe('a malformed reference is rejected, never turned into a successful comparison', () => {
  it.each(REFERENCE_REJECTIONS)('$name', (row) => {
    const reference = (row.ref as () => unknown)()
    // The response equals the reference's own answers where it can: even then nothing may "match".
    const response =
      typeof reference === 'object' && reference !== null ? reference : answersOf(kemRef())
    const e = rejection(() => compareToExpected(response, reference))
    expect(e.source).toBe('reference')
    expect(e.message).toMatch(/^The expected results cannot be compared: /)
    expect(
      e.diagnostics.some(
        (d) => d.keyword === row.keyword && (row.path === undefined || d.path.includes(row.path))
      ),
      JSON.stringify(e.diagnostics)
    ).toBe(true)
  })
})

describe('running a prompt hands that prompt to the comparison', () => {
  it('an expected-results file that does not fit the prompt is refused, not compared', async () => {
    const name: FixtureName = 'ML-KEM-encapDecap-FIPS203'
    const prepared = await preparePrompt(readFixture(repo, name, 'prompt.json'))
    if (!prepared.ok) throw new Error('fixture prompt rejected')
    const ref = referenceOf(name)
    const dropped = ref.testGroups[ref.testGroups.length - 1].tests.pop()
    expect(dropped).toBeDefined()
    const run = (expectedText: string) =>
      executePrepared(prepared, {
        engine: createExpectedResultsFakeEngine(
          readFixture(repo, name, 'expectedResults.json'),
          readFixture(repo, name, 'prompt.json')
        ),
        codePath: 'cli',
        appVersion: null,
        expectedText,
      })
    // control: the unchanged file compares fully (the bounded profile answers 30 of the 165)
    const ok = await run(readFixture(repo, name, 'expectedResults.json'))
    expect(ok.golden).toMatchObject({ matched: 30, mismatched: [], unanswered: 135 })
    await expect(run(JSON.stringify(ref))).rejects.toBeInstanceOf(GoldenComparisonError)
  })
})
