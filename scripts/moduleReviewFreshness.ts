// SPDX-License-Identifier: GPL-3.0-only
/**
 * moduleReviewFreshness — the ABSOLUTE-AGE half of the module `lastReviewed`
 * guard.
 *
 * Why this exists (WS21 §3.1). Two mechanisms already look at module review
 * dates and neither can see a module that is merely OLD:
 *
 *  - `scripts/validators/trust-engine-checks.ts` CM-C is RELATIVE: it fires
 *    only when a module's code changed MORE than 30 days after its
 *    `lastReviewed`. A module nobody has touched for a year has no such commit,
 *    so it trips nothing, forever.
 *  - `src/data/contentFreshness.ts` covers the `{asOf, recheck}` claim manifest
 *    (Q-Day anchor, protocol matrix, IBM baselines, sim moves). Module
 *    `content.ts` dates were never in that manifest.
 *
 * The hole that produced: `confidential-computing` sat at `lastReviewed:
 * '2026-04-12'` while its peers were re-verified on 2026-08-10, and nothing in
 * the repo said so.
 *
 * Deliberately WARN-level in the CI script (see audit-content-freshness.ts):
 * a hard gate on ~65 editorial dates would block releases on content debt,
 * which is exactly the failure mode CM-C avoided by being warn-level too.
 *
 * Pure + deterministic: `now` is a parameter, and the scan is a plain text read
 * (no TS import of 65 module barrels), so the local test and the CI script
 * agree and neither pulls the app's runtime graph into a script process.
 */
import { readdirSync, readFileSync, statSync } from 'fs'
import { join } from 'path'

/**
 * Absolute review window for a module's `lastReviewed`, in days.
 *
 * 120 = one quarter plus a month of grace. Chosen against the live spread
 * rather than picked round: the 2026-08-10 sweep re-verified 30+ modules on one
 * day, so a quarterly cadence is the demonstrated intent, and 120 gives a
 * month's slack before anything is called stale. It must stay BELOW ~131 days
 * or it re-opens the exact gap this guard was written for
 * (`confidential-computing`, 2026-04-12, was 131 days stale when WS21 found it
 * and nothing had flagged it).
 */
export const MODULE_REVIEW_MAX_AGE_DAYS = 120

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const MODULE_ID_RE = /moduleId:\s*'([^']+)'|moduleId:\s*"([^"]+)"/
// Quote style is deliberately BOTH — a single-quote-only regex is how a guard
// goes quietly blind on a Prettier config change.
const LAST_REVIEWED_RE = /lastReviewed:\s*'([^']*)'|lastReviewed:\s*"([^"]*)"/

/** One module's declared review date, as read from its `content.ts`. */
export interface ModuleReview {
  /** `moduleId` declared in content.ts, or the directory name if absent. */
  moduleId: string
  /** Repo-relative path of the content.ts the date was read from. */
  file: string
  /** Raw `lastReviewed` literal — `null` when the field is absent entirely. */
  lastReviewed: string | null
}

/** Whole days between an ISO date (UTC midnight) and `now`. */
export function ageInDays(isoDate: string, now: Date): number {
  return Math.floor((now.getTime() - Date.parse(`${isoDate}T00:00:00Z`)) / 86_400_000)
}

function firstGroup(m: RegExpMatchArray | null): string | null {
  if (!m) return null
  return m[1] ?? m[2] ?? null
}

/**
 * Read every `<modulesDir>/<Module>/content.ts` and extract its declared
 * `moduleId` + `lastReviewed`. Directories without a `content.ts` are skipped
 * silently (custom modules legitimately have none); a `content.ts` that HAS one
 * but no parseable date is reported with `lastReviewed: null`, because an unset
 * date is a worse state than an old one, not an exempt one.
 */
export function readModuleReviews(modulesDir: string): ModuleReview[] {
  let entries: string[]
  try {
    entries = readdirSync(modulesDir)
  } catch {
    return []
  }
  const out: ModuleReview[] = []
  for (const name of entries.sort()) {
    const dir = join(modulesDir, name)
    let isDir = false
    try {
      isDir = statSync(dir).isDirectory()
    } catch {
      continue
    }
    if (!isDir) continue
    const file = join(dir, 'content.ts')
    let src: string
    try {
      src = readFileSync(file, 'utf8')
    } catch {
      continue
    }
    out.push({
      moduleId: firstGroup(src.match(MODULE_ID_RE)) ?? name,
      file: `src/components/PKILearning/modules/${name}/content.ts`,
      lastReviewed: firstGroup(src.match(LAST_REVIEWED_RE)),
    })
  }
  return out
}

/** A module flagged by the absolute-age check, with why. */
export interface StaleModuleReview extends ModuleReview {
  /** Age in days, or `null` when the date is missing/malformed. */
  ageDays: number | null
  reason: 'stale' | 'missing' | 'malformed'
}

/**
 * The modules whose `lastReviewed` is absent, malformed, or older than
 * `maxDays` relative to `now` — the guard's flag set. Sorted oldest-first so a
 * reviewer works the worst debt first; missing/malformed sort ahead of stale.
 */
export function staleModuleReviews(
  reviews: ModuleReview[],
  now: Date,
  maxDays: number = MODULE_REVIEW_MAX_AGE_DAYS
): StaleModuleReview[] {
  const flagged: StaleModuleReview[] = []
  for (const r of reviews) {
    if (r.lastReviewed === null) {
      flagged.push({ ...r, ageDays: null, reason: 'missing' })
      continue
    }
    if (!ISO_DATE.test(r.lastReviewed) || Number.isNaN(Date.parse(`${r.lastReviewed}T00:00:00Z`))) {
      flagged.push({ ...r, ageDays: null, reason: 'malformed' })
      continue
    }
    const age = ageInDays(r.lastReviewed, now)
    if (age > maxDays) flagged.push({ ...r, ageDays: age, reason: 'stale' })
  }
  return flagged.sort((a, b) => (b.ageDays ?? Infinity) - (a.ageDays ?? Infinity))
}
