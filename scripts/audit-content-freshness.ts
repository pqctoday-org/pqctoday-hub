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

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPORT_PATH = join(__dirname, '..', 'reports', 'content-freshness.md')

const args = process.argv.slice(2)
const JSON_MODE = args.includes('--json')
const WARN = args.includes('--warn')
const WRITE = args.includes('--write')

function main(): void {
  const now = new Date()
  const stale = staleClaims(FRESHNESS_CLAIMS, now)
  const malformed = malformedClaims()
  const failed = stale.length > 0 || malformed.length > 0

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
    if (WRITE) console.log(`\nWrote ${REPORT_PATH}`)
    console.log(failed ? '\n✗ FAIL' : '\n✓ all claims fresh')
  }

  process.exit(failed && !WARN ? 1 : 0)
}

main()
