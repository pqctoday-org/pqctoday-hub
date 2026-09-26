// SPDX-License-Identifier: GPL-3.0-only
// J-5 two-person review records: the validator is the gate, so every rule is
// proven to FAIL on a record that breaks it. Names below are test fixtures,
// not review records — no real record is created by these tests.
import { describe, it, expect } from 'vitest'
import {
  REVIEWED_STATUSES,
  REVIEW_RECORD_SCHEMA,
  SOURCE_CHECK_SCHEMA,
  evaluateReviews,
  sourceCheckEligible,
  validateReviewRecord,
  validateSourceCheck,
  type ReviewItem,
  type ReviewRecord,
  type SourceCheckRecord,
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

  it('a human record outranks a source check, even when it is not an approval', () => {
    const r = { ...good(), decision: 'changes-requested' as const }
    r.claimReview = { ...r.claimReview, decision: 'changes-requested' }
    const ev = evaluateReviews(
      [CHECK_ITEM],
      [{ file: 'a.review.json', record: { ...r, item: CHECK_ITEM.id } }],
      null,
      [{ file: 'a.source-check.json', record: check() }]
    )
    expect(ev.status[CHECK_ITEM.id]).toBe('changes-requested')
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

// ── automated source checks (maintainer decision 2026-09-26) ──────────────────
// "nist is trusted and google is trusted — check source"; "the automated match is
// enough". Each rule that keeps that from being a rubber stamp is broken once here.

const CHECK_ITEM: ReviewItem = {
  id: 'vector-source:kbkdf_acvp_test',
  kind: 'vector-source',
  title: 'fixture',
  requirement: 'automated source check',
  subjectSha256: HASH,
  sourceCheckOk: true,
}
const CHECK_ITEMS = new Map([[CHECK_ITEM.id, CHECK_ITEM]])

const check = (): SourceCheckRecord => ({
  schema: SOURCE_CHECK_SCHEMA,
  item: CHECK_ITEM.id,
  subjectSha256: HASH,
  fileSha256: 'c'.repeat(64),
  result: 'match',
  tool: 'scripts/acvp/subset_reproduce.py',
  command: 'python3 scripts/acvp/subset_reproduce.py --id kbkdf_acvp_test --strict',
  upstream: {
    repository: 'https://github.com/usnistgov/ACVP-Server',
    revision: 'd'.repeat(40),
    files: [{ path: 'gen-val/json-files/KDF-1.0/internalProjection.json', sha256: 'e'.repeat(64) }],
  },
  compared: { cases: 56, values: 600 },
  checkedAt: '2026-09-26',
})

describe('sourceCheckEligible', () => {
  it('accepts NIST ACVP-Server and pinned Wycheproof sources only', () => {
    expect(sourceCheckEligible({ kind: 'nist-acvp-server' })).toBe(true)
    expect(
      sourceCheckEligible({
        kind: 'oracle-generated',
        url: `https://raw.githubusercontent.com/C2SP/wycheproof/${'f'.repeat(40)}/testvectors_v1/x25519_test.json`,
      })
    ).toBe(true)
  })

  it('SABOTAGE: our own oracle output, a snapshot, or an unpinned Wycheproof URL is not eligible', () => {
    expect(sourceCheckEligible({ kind: 'oracle-generated', url: 'node-crypto' })).toBe(false)
    expect(sourceCheckEligible({ kind: 'self-pinned-snapshot' })).toBe(false)
    expect(sourceCheckEligible({ kind: 'published-document' })).toBe(false)
    expect(
      sourceCheckEligible({
        kind: 'oracle-generated',
        url: 'https://raw.githubusercontent.com/C2SP/wycheproof/main/testvectors_v1/x25519_test.json',
      })
    ).toBe(false)
    expect(sourceCheckEligible(undefined)).toBe(false)
  })
})

describe('validateSourceCheck', () => {
  it('accepts a complete matching record', () => {
    expect(validateSourceCheck(check(), CHECK_ITEMS, '2026-09-26')).toEqual([])
  })

  it('SABOTAGE: a record for an item not eligible for automated review fails', () => {
    const items = new Map([[CHECK_ITEM.id, { ...CHECK_ITEM, sourceCheckOk: false }]])
    expect(validateSourceCheck(check(), items).join()).toMatch(/not eligible/)
  })

  it('SABOTAGE: anything but a full match, or a missing upstream digest, fails', () => {
    expect(validateSourceCheck({ ...check(), result: 'mismatch' }, CHECK_ITEMS).join()).toMatch(
      /result must be "match"/
    )
    const noFiles = check()
    noFiles.upstream.files = []
    expect(validateSourceCheck(noFiles, CHECK_ITEMS).join()).toMatch(/upstream\.files/)
    const shortRev = check()
    shortRev.upstream.revision = 'main'
    expect(validateSourceCheck(shortRev, CHECK_ITEMS).join()).toMatch(/40-hex commit/)
  })

  it('SABOTAGE: a checker outside scripts/acvp/, a future date or a bad schema fails', () => {
    expect(validateSourceCheck({ ...check(), tool: 'manual' }, CHECK_ITEMS).join()).toMatch(
      /scripts\/acvp/
    )
    expect(
      validateSourceCheck({ ...check(), checkedAt: '2026-10-01' }, CHECK_ITEMS, '2026-09-26').join()
    ).toMatch(/in the future/)
    expect(validateSourceCheck({ ...check(), schema: 'v0' }, CHECK_ITEMS).join()).toMatch(/schema/)
  })
})

describe('evaluateReviews with source checks', () => {
  it('a current source check marks its item source-verified, which counts as reviewed', () => {
    const ev = evaluateReviews([CHECK_ITEM], [], null, [
      { file: 'k.source-check.json', record: check() },
    ])
    expect(ev.status[CHECK_ITEM.id]).toBe('source-verified')
    expect(REVIEWED_STATUSES.has(ev.status[CHECK_ITEM.id])).toBe(true)
  })

  it('SABOTAGE: a source check for older bytes is stale, and stale is not reviewed', () => {
    const ev = evaluateReviews([{ ...CHECK_ITEM, subjectSha256: 'b'.repeat(64) }], [], null, [
      { file: 'k.source-check.json', record: check() },
    ])
    expect(ev.status[CHECK_ITEM.id]).toBe('stale-review')
    expect(REVIEWED_STATUSES.has(ev.status[CHECK_ITEM.id])).toBe(false)
  })

  it('SABOTAGE: an invalid source check is a problem and verifies nothing', () => {
    const ev = evaluateReviews([CHECK_ITEM], [], null, [
      { file: 'k.source-check.json', record: { ...check(), result: 'mismatch' } },
    ])
    expect(ev.status[CHECK_ITEM.id]).toBe('awaiting-review')
    expect(ev.problems.map((p) => p.file)).toEqual(['k.source-check.json'])
  })
})
