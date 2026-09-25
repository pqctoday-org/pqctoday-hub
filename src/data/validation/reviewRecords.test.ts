// SPDX-License-Identifier: GPL-3.0-only
// J-5 two-person review records: the validator is the gate, so every rule is
// proven to FAIL on a record that breaks it. Names below are test fixtures,
// not review records — no real record is created by these tests.
import { describe, it, expect } from 'vitest'
import {
  REVIEW_RECORD_SCHEMA,
  evaluateReviews,
  validateReviewRecord,
  type ReviewItem,
  type ReviewRecord,
} from './reviewRecords'

const HASH = 'a'.repeat(64)
const ITEM: ReviewItem = {
  id: 'vector-source:mldsa_sigver_test',
  kind: 'vector-source',
  title: 'fixture',
  requirement: 'two reviewers',
  subjectSha256: HASH,
}
const ITEMS = new Map([[ITEM.id, ITEM]])

const good = (): ReviewRecord => ({
  schema: REVIEW_RECORD_SCHEMA,
  item: ITEM.id,
  subjectSha256: HASH,
  author: 'Fixture Author',
  sourceVerification: {
    reviewer: 'Fixture Source Reviewer',
    date: '2026-09-20',
    decision: 'approved',
  },
  claimReview: { reviewer: 'Fixture Claim Reviewer', date: '2026-09-21', decision: 'approved' },
  decision: 'approved',
})

describe('validateReviewRecord', () => {
  it('accepts a complete record with two distinct named reviewers', () => {
    expect(validateReviewRecord(good(), ITEMS, '2026-09-24')).toEqual([])
  })

  it('SABOTAGE: the same person in both roles fails (two distinct reviewers required)', () => {
    const r = good()
    r.claimReview.reviewer = '  fixture SOURCE reviewer '
    expect(validateReviewRecord(r, ITEMS).join('\n')).toMatch(/two distinct reviewers/)
  })

  it('SABOTAGE: a placeholder or role instead of a name fails', () => {
    for (const name of ['unassigned', 'TBD', 'reviewer', '', '—', 'Claude']) {
      const r = good()
      r.sourceVerification.reviewer = name
      expect(validateReviewRecord(r, ITEMS).join('\n'), name).toMatch(/must be a person's name/)
    }
  })

  it('SABOTAGE: an unknown item, a malformed hash or a wrong schema fails', () => {
    expect(validateReviewRecord({ ...good(), item: 'vector-source:nope' }, ITEMS).join()).toMatch(
      /not a known review item/
    )
    expect(validateReviewRecord({ ...good(), subjectSha256: 'abc' }, ITEMS).join()).toMatch(/hex/)
    expect(validateReviewRecord({ ...good(), schema: 'v0' }, ITEMS).join()).toMatch(/schema/)
  })

  it('SABOTAGE: an invalid or future date fails', () => {
    const r = good()
    r.claimReview.date = '2026-02-30'
    expect(validateReviewRecord(r, ITEMS).join()).toMatch(/ISO date/)
    const f = good()
    f.claimReview.date = '2026-10-01'
    expect(validateReviewRecord(f, ITEMS, '2026-09-24').join()).toMatch(/in the future/)
  })

  it('SABOTAGE: "approved" overall while one role requested changes fails', () => {
    const r = good()
    r.claimReview.decision = 'changes-requested'
    expect(validateReviewRecord(r, ITEMS).join()).toMatch(/needs both/)
    r.decision = 'changes-requested'
    expect(validateReviewRecord(r, ITEMS)).toEqual([])
  })
})

describe('evaluateReviews', () => {
  it('lists every item as awaiting review when there are no records', () => {
    const ev = evaluateReviews([ITEM], [])
    expect(ev.status).toEqual({ [ITEM.id]: 'awaiting-review' })
    expect(ev.problems).toEqual([])
  })

  it('a valid record approves its item; an invalid one is a problem and approves nothing', () => {
    expect(
      evaluateReviews([ITEM], [{ file: 'a.review.json', record: good() }]).status[ITEM.id]
    ).toBe('approved')
    const bad = { ...good(), claimReview: { ...good().sourceVerification } }
    const ev = evaluateReviews([ITEM], [{ file: 'b.review.json', record: bad }])
    expect(ev.status[ITEM.id]).toBe('awaiting-review')
    expect(ev.problems.map((p) => p.file)).toEqual(['b.review.json'])
  })

  it('a record for older subject bytes is stale, not a review', () => {
    const ev = evaluateReviews(
      [{ ...ITEM, subjectSha256: 'b'.repeat(64) }],
      [{ file: 'a.review.json', record: good() }]
    )
    expect(ev.status[ITEM.id]).toBe('stale-review')
  })

  it('a second record for the same item is a problem', () => {
    const ev = evaluateReviews(
      [ITEM],
      [
        { file: 'a.review.json', record: good() },
        { file: 'b.review.json', record: good() },
      ]
    )
    expect(ev.problems).toHaveLength(1)
    expect(ev.problems[0].problem).toMatch(/second record/)
  })
})
