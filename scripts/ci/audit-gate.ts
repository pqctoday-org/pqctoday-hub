// SPDX-License-Identifier: GPL-3.0-only
/**
 * Dependency audit gate with narrow, dated exceptions.
 *
 * Replaces a bare `npm audit --audit-level=high --omit=dev` in CI. The bare
 * command is all-or-nothing: one unfixable advisory makes the gate permanently
 * red, and a permanently red gate stops being read. This keeps the gate
 * meaningful by failing on everything EXCEPT advisories that are explicitly
 * listed here with a reason and a date to look again.
 *
 * REVERSES a deliberate decision recorded in .github/workflows/ci.yml on
 * 2026-08-09 ("KNOWN RED since 2026-08-07, deliberately not suppressed"). That
 * decision was made on the same findings this file records — no upstream fix,
 * exposure believed nil — and chose visible redness over an exception, with
 * merges going through an admin override instead. The trade was reversed on
 * 2026-08-11: the redness had begun blocking unrelated work, and an exception
 * that expires is easier to keep honest than an override nobody records.
 *
 * Three ways this fails, so an exception cannot quietly become permanent:
 *   1. an advisory at or above the threshold that is NOT listed here
 *   2. a listed advisory whose `recheckAfter` date has passed
 *   3. a listed advisory that no longer appears in the audit — the entry is
 *      stale and must be deleted, which is how the list stays short
 */
import { execFileSync } from 'node:child_process'

interface Exception {
  /** GitHub advisory id, as npm reports it in `via[].url`. */
  ghsa: string
  package: string
  /** Why this cannot be fixed, and why it is tolerable meanwhile. */
  reason: string
  /** ISO date. Past this, the gate fails until someone re-reads the advisory. */
  recheckAfter: string
}

// Empty, and that is the desired state. Both entries that used to live here were
// image-size DoS advisories (GHSA-w3rx-r6r6-pgpr, GHSA-5p2g-fcmc-qvqq) reaching us
// only through pptxgenjs. pptxgenjs was replaced on 2026-08-22 by a direct
// PresentationML writer (services/export/pptxOoxml.ts), the dependency went away, and
// this gate then failed on the exceptions themselves — exactly as designed: an
// exception that no longer matches any advisory is dead weight that would silently
// pre-authorise a future advisory with the same id. Add a new entry only with a reason
// that says why it cannot be fixed AND why it is unreachable, plus a recheck date.
const EXCEPTIONS: Exception[] = [
  {
    ghsa: 'GHSA-rgj7-g3m4-5g8c',
    package: 'sharp',
    reason:
      'libheif HEIC/HEIF-decode vulnerabilities in sharp <0.35.4; no fix available upstream ' +
      'as of 2026-09-09. sharp is a transitive dependency of @huggingface/transformers, ' +
      "pulled in only by this app's TEXT embedding pipeline (bge-small, used by " +
      'embeddingRetrieval.ts / scripts/build-embedding-index.ts for RAG search) — no code ' +
      'path here ever runs image preprocessing through transformers.js, so the vulnerable ' +
      'HEIC/HEIF decode path in sharp is never invoked.',
    recheckAfter: '2026-12-01',
  },
]

/** Severities that fail the build when unlisted. */
const BLOCKING = new Set(['high', 'critical'])

interface AuditVia {
  url?: string
  title?: string
  severity?: string
}
interface AuditVulnerability {
  name: string
  severity: string
  via: (string | AuditVia)[]
}

function runAudit(): Record<string, AuditVulnerability> {
  let raw: string
  try {
    raw = execFileSync('npm', ['audit', '--json', '--omit=dev'], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    })
  } catch (err) {
    // npm audit exits non-zero when it finds anything — that is the normal
    // path here, and stdout still holds the report.
    const e = err as { stdout?: string }
    if (!e.stdout) throw err
    raw = e.stdout
  }
  const parsed = JSON.parse(raw) as { vulnerabilities?: Record<string, AuditVulnerability> }
  return parsed.vulnerabilities ?? {}
}

function advisoryIds(vuln: AuditVulnerability): string[] {
  const ids: string[] = []
  for (const via of vuln.via) {
    if (typeof via === 'string') continue
    const match = via.url?.match(/GHSA-[0-9a-z-]+/i)
    if (match) ids.push(match[0])
  }
  return ids
}

function main(): void {
  const vulns = runAudit()
  const today = new Date().toISOString().slice(0, 10)

  const seen = new Set<string>()
  const unlisted: string[] = []

  for (const vuln of Object.values(vulns)) {
    if (!BLOCKING.has(vuln.severity)) continue
    for (const id of advisoryIds(vuln)) {
      seen.add(id)
      if (!EXCEPTIONS.some((e) => e.ghsa === id)) {
        unlisted.push(`${id}  ${vuln.name}  (${vuln.severity})`)
      }
    }
  }

  const expired = EXCEPTIONS.filter((e) => e.recheckAfter < today)
  const stale = EXCEPTIONS.filter((e) => !seen.has(e.ghsa))

  const problems: string[] = []
  if (unlisted.length > 0) {
    problems.push(
      `Unlisted high/critical advisories — fix them, or add a dated exception in scripts/ci/audit-gate.ts:\n` +
        unlisted.map((u) => `    ${u}`).join('\n')
    )
  }
  if (expired.length > 0) {
    problems.push(
      `Exceptions past their recheck date — re-read the advisory and either fix it or move the date with a reason:\n` +
        expired.map((e) => `    ${e.ghsa} (${e.package}) due ${e.recheckAfter}`).join('\n')
    )
  }
  if (stale.length > 0) {
    problems.push(
      `Exceptions that no longer match any advisory — delete them, the problem is gone:\n` +
        stale.map((e) => `    ${e.ghsa} (${e.package})`).join('\n')
    )
  }

  if (problems.length > 0) {
    console.error('\n✗ dependency audit gate failed\n')
    for (const p of problems) console.error(`  ${p}\n`)
    process.exit(1)
  }

  console.log(
    `✓ dependency audit gate passed — no unlisted high/critical advisories; ` +
      `${EXCEPTIONS.length} dated exception${EXCEPTIONS.length === 1 ? '' : 's'} still current.`
  )
  for (const e of EXCEPTIONS) {
    console.log(`    ${e.ghsa} (${e.package}) — recheck after ${e.recheckAfter}`)
  }
}

main()
