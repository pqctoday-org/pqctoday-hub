#!/usr/bin/env tsx
/**
 * scripts/audit-content-freshness.ts
 *
 * Walks the content-freshness manifest (src/data/contentFreshness.ts) — every
 * time-sensitive claim the sim surfaces (CMVP/FIPS status, the protocol-matrix
 * snapshot, the Q-Day planning anchor) — and flags any whose `asOf` has aged
 * past the review window (default 90 days). Each flagged claim prints with the
 * live source URL to re-verify it against, so a stale snapshot can't slip by
 * unnoticed.
 *
 * Modes:
 *   (default)   human report; exits NON-ZERO if any claim is stale or malformed
 *   --warn      human report; always exits 0 (non-blocking CI — first rollout)
 *   --json      machine-readable summary on stdout; exit follows the same rule
 *   --write     also (re)generate reports/content-freshness.md (deterministic)
 *
 * Examples:
 *   npm run audit:content-freshness
 *   npm run audit:content-freshness -- --write
 *   npm run audit:content-freshness -- --warn      # CI non-blocking
 */
import { mkdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import {
  FRESHNESS_CLAIMS,
  FRESHNESS_MAX_AGE_DAYS,
  ageInDays,
  staleClaims,
  malformedClaims,
  freshnessReportMarkdown,
} from '../src/data/contentFreshness'
import {
  MODULE_REVIEW_MAX_AGE_DAYS,
  readModuleReviews,
  staleModuleReviews,
} from './moduleReviewFreshness'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_PATH = join(__dirname, '..', 'reports', 'content-freshness.md')
const MODULES_DIR = join(__dirname, '..', 'src', 'components', 'PKILearning', 'modules')

const args = process.argv.slice(2)
const JSON_MODE = args.includes('--json')
const WARN = args.includes('--warn')
const WRITE = args.includes('--write')
// WS21 §3.1: the module `lastReviewed` absolute-age check is WARN-level by
// default — it reports, it never fails the build. `--modules-strict` opts into
// gating it, so the check can be ratcheted later without a second script.
const MODULES_STRICT = args.includes('--modules-strict')

function main(): void {
  const now = new Date()
  const stale = staleClaims(FRESHNESS_CLAIMS, now)
  const malformed = malformedClaims()
  // Absolute-age module review dates. CM-C (trust-engine-checks.ts) only fires
  // when code changed AFTER the review date, so a module nobody touched is
  // invisible to it — this is the half that sees an untouched, aging module.
  const moduleReviews = readModuleReviews(MODULES_DIR)
  const staleModules = staleModuleReviews(moduleReviews, now)
  const failed =
    stale.length > 0 || malformed.length > 0 || (MODULES_STRICT && staleModules.length > 0)

  if (WRITE) {
    mkdirSync(dirname(REPORT_PATH), { recursive: true })
    writeFileSync(REPORT_PATH, freshnessReportMarkdown(), 'utf8')
  }

  if (JSON_MODE) {
    console.log(
      JSON.stringify(
        {
          maxAgeDays: FRESHNESS_MAX_AGE_DAYS,
          total: FRESHNESS_CLAIMS.length,
          stale: stale.map((c) => ({ id: c.id, asOf: c.asOf, ageDays: ageInDays(c.asOf, now) })),
          malformed: malformed.map((c) => c.id),
          moduleReviewMaxAgeDays: MODULE_REVIEW_MAX_AGE_DAYS,
          modulesScanned: moduleReviews.length,
          staleModules: staleModules.map((m) => ({
            moduleId: m.moduleId,
            lastReviewed: m.lastReviewed,
            ageDays: m.ageDays,
            reason: m.reason,
            file: m.file,
          })),
          modulesStrict: MODULES_STRICT,
          passed: !failed,
        },
        null,
        2
      )
    )
  } else {
    console.log(
      `Content freshness — ${FRESHNESS_CLAIMS.length} claims, window ${FRESHNESS_MAX_AGE_DAYS}d\n`
    )
    for (const c of FRESHNESS_CLAIMS) {
      const age = ageInDays(c.asOf, now)
      const flag = age > FRESHNESS_MAX_AGE_DAYS ? 'STALE ' : 'ok    '
      console.log(`  ${flag} ${c.asOf}  ${String(age).padStart(4)}d  ${c.id}`)
    }
    if (malformed.length) {
      console.log(`\n✗ ${malformed.length} malformed claim(s) (bad asOf or recheck URL):`)
      for (const c of malformed)
        console.log(`    - ${c.id}: asOf="${c.asOf}" recheck="${c.recheck}"`)
    }
    if (stale.length) {
      console.log(`\n✗ ${stale.length} stale claim(s) — re-verify and bump \`asOf\`:`)
      for (const c of stale) console.log(`    - ${c.id} (${c.claim})\n      → ${c.recheck}`)
    }
    console.log(
      `\nModule lastReviewed \u2014 ${moduleReviews.length} modules, absolute window ${MODULE_REVIEW_MAX_AGE_DAYS}d`
    )
    if (staleModules.length === 0) {
      console.log('  \u2713 every module review date is within the window')
    } else {
      const verb = MODULES_STRICT ? '\u2717' : '\u26a0'
      console.log(
        `  ${verb} ${staleModules.length} module(s) past the absolute review window` +
          (MODULES_STRICT ? '' : ' (warn-level \u2014 does not fail the build)')
      )
      for (const m of staleModules) {
        const age = m.ageDays === null ? m.reason.toUpperCase() : `${m.ageDays}d`
        console.log(
          `    - ${m.moduleId.padEnd(28)} ${String(m.lastReviewed ?? '(unset)').padEnd(12)} ${age}`
        )
        console.log(`      \u2192 ${m.file}`)
      }
      console.log(
        '    Re-verify the module\u2019s claims, then bump lastReviewed \u2014 never bump without re-verifying.'
      )
    }
    if (WRITE) console.log(`\nWrote ${REPORT_PATH}`)
    console.log(failed ? '\n✗ FAIL' : '\n✓ all claims fresh')
  }

  process.exit(failed && !WARN ? 1 : 0)
}

main()
