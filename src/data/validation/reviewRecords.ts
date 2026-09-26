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
  /**
   * One named reviewer is enough for this item (decision 2026-09-26).
   *
   * Set ONLY where the subject's correctness can be checked against an external,
   * independently-pinned upstream rather than resting on a reviewer's judgement —
   * in practice `source.kind: 'nist-acvp-server'`, where the bytes are comparable
   * case-by-case against a pinned usnistgov/ACVP-Server commit. There the second
   * reviewer was adding ceremony, not assurance: anyone can re-run the comparison.
   *
   * It does NOT relax anything else. The reviewer must still be a real named
   * person, the record still binds to `subjectSha256`, and every other class —
   * oracle-generated, self-pinned snapshots, coverage waivers, public claims —
   * still needs two distinct reviewers, because for those the judgement IS the
   * evidence and there is no upstream to check against.
   */
  singleReviewerOk?: boolean
  /**
   * An automated source check may stand in for the review (maintainer decision
   * 2026-09-26: "nist is trusted and google is trusted — check source"; "the
   * automated match is enough").
   *
   * Set ONLY from `sourceCheckEligible(source)`, never from a record, for sources
   * that are both trusted AND mechanically re-checkable against a pinned upstream:
   * NIST ACVP-Server files and vendored Project Wycheproof files. For those, the
   * question a reviewer would answer — "did these expected values really come
   * from the cited source?" — has a mechanical answer that anyone can re-run, so a
   * recorded, hash-bound match answers it. Everything else (oracle output we
   * generated, self-pinned snapshots, waivers, public claims) still needs named
   * people, because there the judgement IS the evidence.
   */
  sourceCheckOk?: boolean
}

export type ReviewItemStatus =
  | 'awaiting-review'
  | 'approved'
  | 'source-verified'
  | 'changes-requested'
  | 'rejected'
  | 'stale-review'

/** Statuses that count as reviewed: a named approval, or an automated source match. */
export const REVIEWED_STATUSES: ReadonlySet<ReviewItemStatus> = new Set([
  'approved',
  'source-verified',
])

/**
 * Sources whose expected values can be re-verified mechanically against a pinned,
 * trusted upstream — the only ones an automated source check may review.
 * NIST ACVP-Server: `scripts/acvp/subset_reproduce.py --strict`.
 * Project Wycheproof (Google / C2SP): `scripts/acvp/vendor_wycheproof.py --check`.
 */
export function sourceCheckEligible(
  src: { kind?: string; url?: string; revision?: string } | undefined
): boolean {
  if (src?.kind === 'nist-acvp-server') return true
  return (
    src?.kind === 'oracle-generated' &&
    /^https:\/\/raw\.githubusercontent\.com\/C2SP\/wycheproof\/[0-9a-f]{40}\//.test(src.url ?? '')
  )
}

export const SOURCE_CHECK_SCHEMA = 'pqctoday.validation-source-check/v1'

/**
 * A machine-written record that one vector file matched its pinned upstream.
 * Lives beside the human records as src/data/validation/reviews/<id>.source-check.json,
 * written only by `npm run acvp:source-check`. Like a human record it binds to
 * the exact manifest entry (`subjectSha256`) and file bytes (`fileSha256`) it
 * checked, so any later change makes it stale rather than silently still valid.
 */
export interface SourceCheckRecord {
  schema: typeof SOURCE_CHECK_SCHEMA
  item: string
  subjectSha256: string
  /** SHA-256 of the vector file's bytes when checked. */
  fileSha256: string
  /** Only a full match is ever recorded; anything else writes no record. */
  result: 'match'
  /** The checker and the exact command that re-runs it. */
  tool: string
  command: string
  upstream: {
    repository: string
    revision: string
    files: { path: string; sha256: string }[]
  }
  /** What was compared, as the checker reported it. */
  compared: { cases: number; values?: number }
  /** ISO date (YYYY-MM-DD) the check ran. */
  checkedAt: string
}

const HEX40 = /^[0-9a-f]{40}$/

/** Validate one source-check record. Returns the problems (empty = valid). */
export function validateSourceCheck(
  rec: unknown,
  items: ReadonlyMap<string, ReviewItem>,
  today: string | null = null
): string[] {
  const out: string[] = []
  if (!rec || typeof rec !== 'object' || Array.isArray(rec)) return ['record is not an object']
  const r = rec as Partial<SourceCheckRecord>
  if (r.schema !== SOURCE_CHECK_SCHEMA) out.push(`schema must be "${SOURCE_CHECK_SCHEMA}"`)
  const item = typeof r.item === 'string' ? items.get(r.item) : undefined
  if (!item) out.push(`item ${JSON.stringify(r.item)} is not a known review item`)
  else if (!item.sourceCheckOk)
    out.push(
      `${item.id} is not eligible for an automated source check — its source is not a pinned NIST ACVP-Server or Wycheproof upstream, so it needs named reviewers`
    )
  if (typeof r.subjectSha256 !== 'string' || !HEX64.test(r.subjectSha256))
    out.push('subjectSha256 must be 64 lower-case hex characters')
  if (typeof r.fileSha256 !== 'string' || !HEX64.test(r.fileSha256))
    out.push('fileSha256 must be 64 lower-case hex characters')
  if (r.result !== 'match') out.push('result must be "match" (a failed check writes no record)')
  if (typeof r.tool !== 'string' || !r.tool.startsWith('scripts/acvp/'))
    out.push('tool must name the checker under scripts/acvp/')
  if (typeof r.command !== 'string' || r.command.trim().length < 10)
    out.push('command must be the exact command that re-runs the check')
  const u = r.upstream
  if (!u || typeof u.repository !== 'string' || !/^https:\/\/github\.com\//.test(u.repository))
    out.push('upstream.repository must be the upstream GitHub repository URL')
  if (!u || typeof u.revision !== 'string' || !HEX40.test(u.revision))
    out.push('upstream.revision must be a full 40-hex commit')
  if (
    !u ||
    !Array.isArray(u.files) ||
    u.files.length === 0 ||
    u.files.some((f) => !f || typeof f.path !== 'string' || !HEX64.test(f.sha256 ?? ''))
  )
    out.push('upstream.files must list every upstream file with its SHA-256')
  if (!r.compared || !Number.isInteger(r.compared.cases) || r.compared.cases < 1)
    out.push('compared.cases must be a positive integer')
  if (!validDate(r.checkedAt))
    out.push(`checkedAt must be an ISO date (got ${JSON.stringify(r.checkedAt)})`)
  else if (today && r.checkedAt > today) out.push(`checkedAt ${r.checkedAt} is in the future`)
  return out
}

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
  //
  // Exception (2026-09-26): an item flagged singleReviewerOk may name the same
  // person in both roles. That is confined to externally-verifiable sources
  // (nist-acvp-server), where the bytes can be re-checked against a pinned
  // upstream commit by anyone — so J-5's independence is supplied by the external
  // source rather than by a second person. Note the consequence honestly: for
  // those items the author MAY be the sole reviewer, which is why the flag is set
  // from the source kind and never from a per-record field.
  const item = typeof r.item === 'string' ? items.get(r.item) : undefined
  if (
    sv &&
    cr &&
    !item?.singleReviewerOk &&
    norm(r.sourceVerification!.reviewer) === norm(r.claimReview!.reviewer)
  )
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

/**
 * Evaluate every record file against the current items.
 *
 * `sourceChecks` are the machine-written *.source-check.json records. A valid,
 * current one marks its item 'source-verified' — but only when no human record
 * exists: a named reviewer's decision (including changes-requested or rejected)
 * always outranks the automated check.
 */
export function evaluateReviews(
  items: readonly ReviewItem[],
  records: ReadonlyArray<{ file: string; record: unknown }>,
  today: string | null = null,
  sourceChecks: ReadonlyArray<{ file: string; record: unknown }> = []
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
  const seenCheck = new Map<string, string>()
  for (const { file, record } of [...sourceChecks].sort((a, b) => a.file.localeCompare(b.file))) {
    const errs = validateSourceCheck(record, byId, today)
    if (errs.length) {
      for (const problem of errs) problems.push({ file, problem })
      continue
    }
    const r = record as SourceCheckRecord
    const prev = seenCheck.get(r.item)
    if (prev) {
      problems.push({ file, problem: `a second source check for ${r.item} (first: ${prev})` })
      continue
    }
    seenCheck.set(r.item, file)
    validRecords.push(file)
    if (seen.has(r.item)) continue // a human record exists and decides
    status[r.item] =
      r.subjectSha256 !== byId.get(r.item)!.subjectSha256 ? 'stale-review' : 'source-verified'
  }
  return { problems, status, validRecords }
}
