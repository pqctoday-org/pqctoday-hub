#!/usr/bin/env tsx
/**
 * scripts/audit-migrate-proof-freshness.ts
 *
 * Tracks the migrate catalog's proof debt: claims whose evidence is undated,
 * stale, or missing.
 *
 * WHY THIS EXISTS. The B+ review said "the repository already tracks products
 * with missing or stale proof, and that tracking is currently invisible to the
 * reader". Half of that was true and half was not. The reader-facing half is
 * now fixed — every catalog row shows its proof age, or says "vendor claim"
 * where we hold no document. But the tracking it referred to
 * (`reports/products-no-proofurl*.json`) does not exist in this repo, so there
 * was no maintainer-facing view of the backlog at all. This is that view.
 *
 * WHAT IT MEASURES, and why each category is separate:
 *
 *   - NO PROOF — a PQC claim with no document behind it. The catalog's own
 *     proof-gate rule says a claim without evidence should not stand, so this
 *     is the only category that FAILS the build.
 *   - UNDATED — we hold the document but not its publication date, so we cannot
 *     tell the reader how current it is. Reported, never failed: the evidence
 *     exists and a missing date is a metadata gap, not a false claim.
 *   - STALE — dated, but older than the freshness window. Also reported rather
 *     than failed. A three-year-old proof is not wrong; it is just old, and
 *     deciding whether the product moved on is a human judgement with the
 *     vendor, not something a gate can make.
 *
 * That split is deliberate. A gate that failed on staleness would either be
 * permanently red or would push someone to re-date documents they had not
 * actually re-checked — which is precisely the kind of false freshness the
 * proof-gate exists to prevent.
 *
 * Modes:
 *   (default) human-readable report
 *   --json    machine-readable summary, for tracking the backlog over time
 *
 * Run via:  npm run audit:migrate-proof
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { latestDatedCsv } from './lib/latestDatedCsv'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

/** Matches `pqc_product_catalog_MMDDYYYY[_rN].csv`. */
const CATALOG_RE = /^pqc_product_catalog_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

/** Same window the reader-facing badge uses (`proofFreshness.ts`). */
const STALE_AFTER_MONTHS = 18

interface Row {
  software_name?: string
  pqc_support?: string
  proof_url?: string
  proof_publication_date?: string
  status?: string
}

function monthsSince(iso: string): number | null {
  const then = new Date(iso)
  if (Number.isNaN(then.getTime())) return null
  const now = new Date()
  const months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth())
  return months < 0 ? 0 : months
}

const csvPath = latestDatedCsv(join(ROOT, 'src/data'), CATALOG_RE)
if (!csvPath) {
  process.stderr.write('No pqc_product_catalog CSV found.\n')
  process.exit(1)
}

const parsed = Papa.parse<Row>(readFileSync(csvPath, 'utf8'), {
  header: true,
  skipEmptyLines: true,
})

const active = parsed.data.filter((r) => (r.status ?? 'active') !== 'deprecated')
// A claim is anything that is not an explicit "no". 'Planned', 'Partial' and
// 'Pending Verification' all assert something a reader may act on, so they all
// need evidence.
const claims = active.filter(
  (r) => r.pqc_support?.trim() && !/^(no|none)\b/i.test(r.pqc_support.trim())
)

const noProof = claims.filter((r) => !r.proof_url?.trim())
const undated = claims.filter((r) => r.proof_url?.trim() && !r.proof_publication_date?.trim())
const stale = claims.filter((r) => {
  const d = r.proof_publication_date?.trim()
  if (!r.proof_url?.trim() || !d) return false
  const m = monthsSince(d)
  return m !== null && m > STALE_AFTER_MONTHS
})

const name = (r: Row) => r.software_name?.trim() || '(unnamed)'
const filename = csvPath.slice(csvPath.lastIndexOf('/') + 1)

if (process.argv.includes('--json')) {
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: noProof.length === 0,
        catalog: filename,
        claims: claims.length,
        noProof: noProof.map(name),
        undated: undated.map(name),
        stale: stale.map((r) => ({ name: name(r), proofDate: r.proof_publication_date })),
      },
      null,
      2
    )}\n`
  )
} else {
  process.stdout.write('\nmigrate proof freshness\n')
  process.stdout.write(`  · catalog: ${filename}\n`)
  process.stdout.write(`  · ${claims.length} products claim post-quantum support\n`)
  process.stdout.write(`  · ${undated.length} have a proof document with no publication date\n`)
  process.stdout.write(`  · ${stale.length} have a proof older than ${STALE_AFTER_MONTHS} months\n`)

  if (undated.length > 0) {
    process.stdout.write('\n  UNDATED (evidence exists; currency unknown to the reader)\n')
    for (const r of undated.slice(0, 20)) process.stdout.write(`    · ${name(r)}\n`)
    if (undated.length > 20) process.stdout.write(`    … and ${undated.length - 20} more\n`)
  }

  if (stale.length > 0) {
    process.stdout.write('\n  STALE (worth re-checking with the vendor)\n')
    for (const r of stale.slice(0, 20))
      process.stdout.write(`    · ${name(r)} — ${r.proof_publication_date}\n`)
    if (stale.length > 20) process.stdout.write(`    … and ${stale.length - 20} more\n`)
  }

  if (noProof.length > 0) {
    process.stdout.write('\n  FAIL — claims with NO proof document at all:\n')
    for (const r of noProof) process.stdout.write(`    · ${name(r)} — "${r.pqc_support}"\n`)
    process.stdout.write(
      '\n  A support claim with no evidence behind it should not stand. Either attach the\n' +
        '  proof, or correct pqc_support to what the product actually does.\n\n'
    )
  } else {
    process.stdout.write(
      '\n  PASS — every claim has a proof document. Undated and stale entries above are\n' +
        '  backlog, not failures: a missing date is a metadata gap, and an old document is\n' +
        '  old rather than wrong. Neither is something a gate can decide for you.\n\n'
    )
  }
}

process.exit(noProof.length === 0 ? 0 : 1)
