// SPDX-License-Identifier: GPL-3.0-only
/**
 * `lastReviewed` must be backed by a review record. `lastEdited` must not leak into it.
 *
 * WHY. Until 2026-08-23 `apply_approved.bump_module_review` set `lastReviewed` on every
 * applied edit, so editing a module marked it reviewed. That was not a cosmetic
 * inaccuracy — it destroyed the staleness signal it was supposed to carry. Three
 * modules the proposals queue had flagged as 122-132 days past the review window were
 * edited during the August accuracy pass and silently re-stamped to that day, and their
 * overdue status vanished while their claims stayed unverified. Measured across all 64
 * modules the day the fields were split: 55 overstated the real review date, by a
 * median of 13 days and up to 148, and every one of those numbers was rendered to
 * readers by ModuleReferencesTab as "Content last reviewed {date}".
 *
 * The authority is `public/data/revisions.jsonl`, whose `content:review` / `review_only`
 * entries are written only by `record_module_review.py` — which refuses bulk stamping.
 *
 * KEY ON record_ids, NOT module_id. A batched review writes ONE entry naming every
 * module in `record_ids`, with `module_id` holding just one of them. Keying on
 * `module_id` alone was tried first and reported 5 modules as never-reviewed that had
 * real reviews, and disagreed with the correct key on 34 more — a wrong answer that
 * looked entirely plausible.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { MODULE_LAST_REVIEWED, MODULE_LAST_EDITED } from './moduleContentRegistry'

const REVIEW_TYPES = new Set(['content:review', 'review_only'])

/** moduleId → latest ISO date on which a review was actually recorded. */
function recordedReviews(): Map<string, string> {
  const raw = readFileSync(join(process.cwd(), 'public/data/revisions.jsonl'), 'utf-8')
  const latest = new Map<string, string>()
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed) continue
    const entry = JSON.parse(trimmed) as {
      change_type?: string
      merge_timestamp?: string
      module_id?: string | null
      record_ids?: string[] | null
    }
    if (!entry.change_type || !REVIEW_TYPES.has(entry.change_type)) continue
    const day = (entry.merge_timestamp ?? '').slice(0, 10)
    if (!day) continue
    const keys = new Set(entry.record_ids ?? [])
    if (entry.module_id) keys.add(entry.module_id)
    for (const key of keys) {
      if (day > (latest.get(key) ?? '')) latest.set(key, day)
    }
  }
  return latest
}

describe('lastReviewed means reviewed', () => {
  const recorded = recordedReviews()

  it('every lastReviewed date is backed by a review record', () => {
    const unbacked = Object.entries(MODULE_LAST_REVIEWED)
      .filter(([id]) => !recorded.has(id))
      .map(([id, date]) => `${id} claims ${date}, no review record exists`)
    expect(unbacked).toEqual([])
  })

  it('no module claims to have been reviewed more recently than it was', () => {
    // The exact failure the split fixed: an edit-bump pushing the date past the
    // last real review. Equality is fine; ahead of the record is not.
    const overstated = Object.entries(MODULE_LAST_REVIEWED)
      .filter(([id, date]) => {
        const real = recorded.get(id)
        return real !== undefined && date > real
      })
      .map(([id, date]) => `${id} claims ${date}, last real review ${recorded.get(id)}`)
    expect(overstated).toEqual([])
  })

  it('the review record itself is non-trivial', () => {
    // Guards the guard. If revisions.jsonl were empty, missing, or filtered down to
    // nothing by a typo in REVIEW_TYPES, both assertions above would pass vacuously —
    // an empty `recorded` map makes the first test's filter match everything only if
    // MODULE_LAST_REVIEWED is non-empty, and the second test's filter match nothing.
    expect(recorded.size).toBeGreaterThan(20)
    expect(Object.keys(MODULE_LAST_REVIEWED).length).toBeGreaterThan(20)
  })

  it('a never-reviewed module is absent, not stamped with a placeholder', () => {
    // These three postdate the 2026-03-28 baseline and have never been through a
    // review. The honest representation is no key at all, so the UI shows no claim.
    // Remove an id from this list when it is genuinely reviewed — never to make a
    // test pass.
    for (const id of ['sbom', 'soc-implementation-pqc', 'verification-closure']) {
      if (recorded.has(id)) continue // reviewed since — nothing to assert
      expect(MODULE_LAST_REVIEWED[id], `${id} should carry no lastReviewed`).toBeUndefined()
    }
  })

  it('lastEdited is a separate field, populated, and not merely a copy', () => {
    // If a future change re-pointed the edit bump back at lastReviewed, the two maps
    // would drift into agreement everywhere. At the split, 58 modules had an edit date
    // differing from their review date.
    const edited = Object.keys(MODULE_LAST_EDITED)
    expect(edited.length).toBeGreaterThan(20)
    const differing = edited.filter((id) => MODULE_LAST_EDITED[id] !== MODULE_LAST_REVIEWED[id])
    expect(differing.length).toBeGreaterThan(20)
  })
})
