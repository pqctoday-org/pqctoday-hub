// SPDX-License-Identifier: GPL-3.0-only
/**
 * Two-person evidence review records (ACVP validation remediation plan
 * 2026-09-24, WS-J item J-5; decision Q8).
 *
 * A new trusted vector source, a coverage waiver, or a public coverage claim
 * needs TWO distinct, named reviewers before it counts as reviewed: one who
 * verifies the source (did the expected value really come from where the
 * manifest says?) and one who reviews the implementation / claim (does the
 * test, label or figure say exactly what the evidence supports?). At least one
 * of them must not be the author.
 *
 * Records live in src/data/validation/reviews/*.review.json (format pinned by
 * review-record.schema.json next to them). This module only VALIDATES records
 * and derives the list of items awaiting review — it never creates a record.
 * Reviewer names are for the people doing the review to supply.
 *
 * A record binds to the exact bytes it reviewed (`subjectSha256`). When the
 * subject changes afterwards the record is `stale`: kept, shown, but no longer
 * counted as a review.
 */

export const REVIEW_RECORD_SCHEMA = 'pqctoday.validation-review/v1'

export const REVIEW_DECISIONS = ['approved', 'changes-requested', 'rejected'] as const
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number]

export interface ReviewerEntry {
  /** Full name of the person — never a role, placeholder or "unassigned". */
  reviewer: string
  /** ISO date (YYYY-MM-DD) the reviewer recorded the decision. */
  date: string
  decision: ReviewDecision
  notes?: string
}

export interface ReviewRecord {
  schema: typeof REVIEW_RECORD_SCHEMA
  /** Review item id, e.g. "vector-source:mldsa_sigver_test" (see ReviewItem.id). */
  item: string
  /** SHA-256 of the reviewed subject at review time (ReviewItem.subjectSha256). */
  subjectSha256: string
  /** Who authored the test / source import / claim under review. */
  author: string
  /** Role 1: source verification. */
  sourceVerification: ReviewerEntry
  /** Role 2: implementation / claim review. */
  claimReview: ReviewerEntry
  /** Overall outcome; "approved" needs both roles to have approved. */
  decision: ReviewDecision
}

export type ReviewItemKind =
  'vector-source' | 'coverage-waiver' | 'public-claim' | 'learn-module-practitioner'

export interface ReviewItem {
  id: string
  kind: ReviewItemKind
  title: string
  /** What must be reviewed and by whom. */
  requirement: string
  /** Hash of the current subject bytes; a record for an older hash is stale. */
  subjectSha256: string
}

export type ReviewItemStatus =
  'awaiting-review' | 'approved' | 'changes-requested' | 'rejected' | 'stale-review'

export interface ReviewProblem {
  file: string
  problem: string
}

export interface ReviewEvaluation {
  /** Problems that make a record invalid — the release check fails on any. */
  problems: ReviewProblem[]
  /** Status per item id (every item listed, reviewed or not). */
  status: Record<string, ReviewItemStatus>
  /** Valid records counted, by file. */
  validRecords: string[]
}

const PLACEHOLDER_NAMES = new Set([
  '',
  'unassigned',
  'unknown',
  'tbd',
  'todo',
  'n/a',
  'na',
  'none',
  '-',
  'reviewer',
  'author',
  'claude',
  'ai',
])

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const HEX64 = /^[0-9a-f]{64}$/

const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

function validDate(s: unknown): s is string {
  if (typeof s !== 'string') return false
  const m = ISO_DATE.exec(s)
  if (!m) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

function isName(s: unknown): s is string {
  return typeof s === 'string' && !PLACEHOLDER_NAMES.has(norm(s)) && /\p{L}/u.test(s)
}

function checkReviewer(
  role: string,
  e: unknown,
  today: string | null,
  out: string[]
): e is ReviewerEntry {
  if (!e || typeof e !== 'object') {
    out.push(`${role} is missing`)
    return false
  }
  const r = e as Partial<ReviewerEntry>
  const before = out.length
  if (!isName(r.reviewer))
    out.push(`${role}.reviewer must be a person's name (got ${JSON.stringify(r.reviewer)})`)
  if (!validDate(r.date))
    out.push(`${role}.date must be an ISO date (got ${JSON.stringify(r.date)})`)
  else if (today && r.date > today) out.push(`${role}.date ${r.date} is in the future`)
  if (!REVIEW_DECISIONS.includes(r.decision as ReviewDecision))
    out.push(`${role}.decision must be one of ${REVIEW_DECISIONS.join(', ')}`)
  return out.length === before
}

/**
 * Validate one parsed record against the item list. Returns the problems
 * (empty = valid). `today` (YYYY-MM-DD) rejects future-dated entries.
 */
export function validateReviewRecord(
  rec: unknown,
  items: ReadonlyMap<string, ReviewItem>,
  today: string | null = null
): string[] {
  const out: string[] = []
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return ['record is not an object']
  const r = rec as Partial<ReviewRecord>
  if (r.schema !== REVIEW_RECORD_SCHEMA) out.push(`schema must be "${REVIEW_RECORD_SCHEMA}"`)
  if (typeof r.item !== 'string' || !items.has(r.item))
    out.push(`item ${JSON.stringify(r.item)} is not a known review item`)
  if (typeof r.subjectSha256 !== 'string' || !HEX64.test(r.subjectSha256))
    out.push('subjectSha256 must be 64 lower-case hex characters')
  if (!isName(r.author))
    out.push(`author must be a person's name (got ${JSON.stringify(r.author)})`)
  const sv = checkReviewer('sourceVerification', r.sourceVerification, today, out)
  const cr = checkReviewer('claimReview', r.claimReview, today, out)
  // Two distinct reviewers also guarantees J-5's "at least one reviewer is not
  // the author": at most one of two different people can be the author.
  if (sv && cr && norm(r.sourceVerification!.reviewer) === norm(r.claimReview!.reviewer))
    out.push(
      'sourceVerification and claimReview name the same person — two distinct reviewers are required'
    )
  if (!REVIEW_DECISIONS.includes(r.decision as ReviewDecision))
    out.push(`decision must be one of ${REVIEW_DECISIONS.join(', ')}`)
  else if (
    r.decision === 'approved' &&
    sv &&
    cr &&
    (r.sourceVerification!.decision !== 'approved' || r.claimReview!.decision !== 'approved')
  )
    out.push('decision "approved" needs both sourceVerification and claimReview to be "approved"')
  return out
}

/** Evaluate every record file against the current items. */
export function evaluateReviews(
  items: readonly ReviewItem[],
  records: ReadonlyArray<{ file: string; record: unknown }>,
  today: string | null = null
): ReviewEvaluation {
  const byId = new Map(items.map((i) => [i.id, i]))
  const status: Record<string, ReviewItemStatus> = Object.fromEntries(
    items.map((i) => [i.id, 'awaiting-review' as ReviewItemStatus])
  )
  const problems: ReviewProblem[] = []
  const validRecords: string[] = []
  const seen = new Map<string, string>()
  for (const { file, record } of [...records].sort((a, b) => a.file.localeCompare(b.file))) {
    const errs = validateReviewRecord(record, byId, today)
    if (errs.length) {
      for (const problem of errs) problems.push({ file, problem })
      continue
    }
    const r = record as ReviewRecord
    const prev = seen.get(r.item)
    if (prev) {
      problems.push({ file, problem: `a second record for ${r.item} (first: ${prev})` })
      continue
    }
    seen.set(r.item, file)
    validRecords.push(file)
    const item = byId.get(r.item)!
    status[r.item] = r.subjectSha256 !== item.subjectSha256 ? 'stale-review' : r.decision
  }
  return { problems, status, validRecords }
}
