// SPDX-License-Identifier: GPL-3.0-only
/**
 * lineage-checks.ts — LN-1 / LN-2 / LN-4 / LN-6
 *
 * Hub-side half of the data accuracy & lineage guarantee
 * (pqctoday-hub-data-lineage-guarantee-plan-09172026.md, §3). The
 * maintenance agent in pqctoday-priv is the only writer and stamps every
 * verdict; these checks make the hub refuse data that contradicts or
 * silently drops those stamps. Each one is a leak that actually happened on
 * 2026-09-17 while shipping 4.86.0:
 *
 *   LN-1  Verdict lock. A field that carries a verification stamp may only
 *         change together with a NEWER stamp. A capture lane loaded
 *         compliance-data.json, ran for 48 minutes, and wrote every record
 *         back — overwriting the two pqcCoverage verdicts a prune had set
 *         from the modules' own Security Policies 13 minutes earlier, and
 *         erasing every pqcCoverageVerifiedAt. Nothing caught it but a
 *         manual diff of two commits.
 *         Covers: compliance-data.json (pqcCoverage ↔ pqcCoverageVerifiedAt)
 *         and the concept_xwalks_* family (confidence / verified_by ↔
 *         verified_date). Compared against the merge base with origin/main
 *         (the same baseline check-module-version-bump.ts uses), so it runs
 *         identically in CI and pre-push.
 *
 *   LN-2  Typed evidence. `evidence_kind ∈ quote|rationale|citation` on every
 *         active crosswalk row, and the verbatim-quote verdict
 *         (`verified_by` = lineage:quote-*) only on `quote` rows. The column
 *         is written by the maintenance agent from the profile's claim kind;
 *         see typedEvidenceFindings for the 434-row category error it stops.
 *
 *   LN-4  Archive, never delete. A dated CSV leaves src/data/ only by moving
 *         to src/data/archive/. concept_xwalks_08292026.csv was `git rm`ed
 *         outright; public/data/rag-corpus.json still cited it as
 *         was_derived_from and only a unit test noticed. audit-csv-archival
 *         enforces "at most two generations", audit-csv-copy-forward
 *         enforces "no row lost between generations" — neither says where a
 *         retired generation must go. This does.
 *
 *   LN-6  CONTRADICTED never ships. The evidence door records
 *         identity=CONTRADICTED when the captured document is provably NOT
 *         the one the row names (wrong title, different standard number).
 *         Such a copy must not back a live entry. Two tiers: entries admitted
 *         on/after the cutoff are ERROR (block new), older ones are WARNING
 *         (report legacy — 8 on 2026-09-17, handed to the priv lane to
 *         re-fetch or deprecate).
 *
 * Two-tier severity everywhere: rows/records changed or admitted on/after
 * LINEAGE_CUTOFF fail the build; anything older is counted, never blocking
 * — the "block new/changed rows, report legacy" decision of 2026-09-17.
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import Papa from 'papaparse'
import { getDataDir } from './data-loader.js'
import { runClaimedCopyChecks } from './lineage-claimed-copy.js'
import { LINEAGE_CUTOFF } from './lineage-admission.js'
import type { CheckResult, Finding } from './types.js'

export { LINEAGE_CUTOFF } from './lineage-admission.js'

type Row = Record<string, string>

// ---------------------------------------------------------------------------
// git baseline (shared by LN-1 and LN-4)
// ---------------------------------------------------------------------------

// 256 MiB: compliance-data.json alone is >1 MiB, and execSync's default
// maxBuffer (1 MiB) makes `git show` THROW on it — which this helper would
// have swallowed into `null`, and the verdict lock would have compared
// against an empty baseline and passed. Found on the very first replay of
// leak L1 (2026-09-17): the gate said PASS on the exact commit pair it was
// written for. A gate that cannot read its baseline must say so, never pass.
const GIT_MAX_BUFFER = 256 * 1024 * 1024

function git(cmd: string): string | null {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: GIT_MAX_BUFFER,
    })
  } catch {
    return null
  }
}

/** A finding for "the baseline itself could not be read" — surfaced as a failure, never as an empty comparison. */
function baselineUnreadable(csv: string, base: string, relativePath: string): Finding {
  return {
    csv,
    row: null,
    field: 'baseline',
    value: `${base.slice(0, 9)}:${relativePath}`,
    message: `could not read the baseline copy of ${relativePath} at ${base.slice(0, 9)} — the verdict lock cannot compare, so it fails closed (is the file tracked at the baseline? is git available?)`,
  }
}

/**
 * The commit this branch diverged from origin/main — what "before" means for
 * a diff-based gate. Null when there is no origin/main (a bare data-dir run,
 * a shallow clone). `LINEAGE_BASELINE=<rev>` overrides it, for replaying a
 * historical leak (`LINEAGE_BASELINE=233240a91 npm run validate:data` in a
 * worktree at eddf8f54a reproduces L1) or debugging a CI run locally.
 */
export function baselineCommit(): string | null {
  const override = process.env.LINEAGE_BASELINE?.trim()
  if (override) return git(`rev-parse --verify ${override}^{commit}`)?.trim() || null
  const base = git('merge-base HEAD origin/main')?.trim()
  return base || null
}

function showAtBaseline(base: string, relativePath: string): string | null {
  return git(`show ${base}:${relativePath}`)
}

// ---------------------------------------------------------------------------
// LN-1 — verdict lock
// ---------------------------------------------------------------------------

export interface StampedRecord {
  id: string
  value: string
  stamp: string
}

export interface VerdictLockOptions {
  /** Name of the file, for findings. */
  csv: string
  /** Name of the verified field, for findings. */
  field: string
}

/**
 * Pure core of LN-1: every record whose `value` differs from its baseline
 * must carry a `stamp` strictly newer than the baseline's stamp (or any
 * stamp at all, when the baseline had none). A record that disappears is
 * not this check's business (copy-forward covers it); a new record is free
 * to say anything — it is its first verdict.
 */
export function verdictLockFindings(
  before: readonly StampedRecord[],
  after: readonly StampedRecord[],
  { csv, field }: VerdictLockOptions
): Finding[] {
  const prev = new Map(before.map((r) => [r.id, r]))
  const findings: Finding[] = []
  after.forEach((cur, i) => {
    const old = prev.get(cur.id)
    if (!old || old.value === cur.value) return
    const oldStamp = old.stamp.trim()
    const newStamp = cur.stamp.trim()
    const ok = newStamp !== '' && (oldStamp === '' || newStamp > oldStamp)
    if (ok) return
    findings.push({
      csv,
      row: i + 1,
      field,
      value: `${old.value} → ${cur.value}`,
      message:
        newStamp === ''
          ? `${cur.id}: ${field} changed but the record carries no verification stamp — a verified value may only change with a newer stamp (was stamped ${oldStamp || 'never'})`
          : `${cur.id}: ${field} changed but its stamp did not move forward (${oldStamp} → ${newStamp}) — re-verify and stamp the new verdict`,
    })
  })
  return findings
}

interface CertRecord {
  id?: string | number
  [k: string]: unknown
}

/**
 * Stamped fields on a compliance-data.json record: `<field>` may only change
 * together with a newer `<stamp>`. securityTargetUrls added 2026-09-17 at
 * the maintenance agent's request — the 16 CMVP rows whose Security Policy
 * address serves a "Not Available" placeholder now carry
 * securityTargetUrls=[] with securityTargetUrlsVerifiedAt, and
 * sync-cert-data.py accepts that prune only with the stamp.
 */
export const CERT_STAMPED_FIELDS: ReadonlyArray<{ field: string; stamp: string }> = [
  { field: 'pqcCoverage', stamp: 'pqcCoverageVerifiedAt' },
  { field: 'securityTargetUrls', stamp: 'securityTargetUrlsVerifiedAt' },
]

function stableValue(v: unknown): string {
  if (v === undefined || v === null) return ''
  return typeof v === 'string' ? v : JSON.stringify(v)
}

function certRecords(json: string | null, field: string, stamp: string): StampedRecord[] {
  if (!json) return []
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    return []
  }
  const list: CertRecord[] = Array.isArray(parsed) ? (parsed as CertRecord[]) : []
  return list
    .filter((r) => r.id !== undefined && r.id !== null)
    .map((r) => ({
      id: String(r.id),
      // eslint-disable-next-line security/detect-object-injection -- field/stamp come from CERT_STAMPED_FIELDS, not user input
      value: stableValue(r[field]),
      // eslint-disable-next-line security/detect-object-injection -- field/stamp come from CERT_STAMPED_FIELDS, not user input
      stamp: stableValue(r[stamp]),
    }))
}

function xwalkRecords(csv: string | null): StampedRecord[] {
  if (!csv) return []
  const rows = Papa.parse<Row>(csv.trim(), { header: true, skipEmptyLines: true }).data
  return rows
    .filter((r) => (r.xwalk_id ?? '').trim() !== '')
    .map((r) => ({
      id: r.xwalk_id.trim(),
      // confidence and verified_by move together: a different verifier
      // reaching the same label is still a new verdict and needs a stamp.
      value: `${(r.confidence ?? '').trim().toLowerCase()}|${(r.verified_by ?? '').trim()}`,
      stamp: (r.verified_date ?? '').trim(),
    }))
}

/** Newest dated generation of a family in src/data (latest first), by the same MMDDYYYY(_rN) ordering the loaders use. */
function newestGenerationPath(prefix: string): string | null {
  const dir = getDataDir()
  if (!fs.existsSync(dir)) return null
  const parsed = fs
    .readdirSync(dir)
    .filter((f) => f.startsWith(prefix) && /^\d/.test(f.slice(prefix.length)))
    .map((f) => {
      const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      return m
        ? { f, key: `${m[3]}-${m[1]}-${m[2]}#${String(Number(m[4] ?? 0)).padStart(3, '0')}` }
        : null
    })
    .filter((p): p is { f: string; key: string } => p !== null)
    .sort((a, b) => b.key.localeCompare(a.key))
  return parsed[0] ? path.join(dir, parsed[0].f) : null
}

export function runVerdictLockCheck(): CheckResult[] {
  const base = baselineCommit()
  const skip = (why: string): CheckResult[] => [
    {
      id: 'LN-1',
      category: 'structure',
      description: `Verdict lock: a verified value only changes with a newer stamp (skipped — ${why})`,
      sourceA: 'public/data/compliance-data.json + src/data/concept_xwalks_*.csv',
      sourceB: 'merge-base with origin/main',
      severity: 'ERROR',
      status: 'SKIP',
      findings: [],
    },
  ]
  if (!base) return skip('no origin/main to compare against')

  const findings: Finding[] = []

  // compliance-data.json — same path before and after.
  const certRel = 'public/data/compliance-data.json'
  const certAbs = path.join(process.cwd(), certRel)
  if (fs.existsSync(certAbs)) {
    const baselineJson = showAtBaseline(base, certRel)
    // A file that did not exist at the baseline is a first version — nothing
    // to lock against. A file that existed but cannot be read is a failure.
    const existedAtBase = (git(`ls-tree --name-only ${base} ${certRel}`) ?? '').trim() !== ''
    if (existedAtBase && baselineJson === null) {
      findings.push(baselineUnreadable('compliance-data.json', base, certRel))
    } else {
      const currentJson = fs.readFileSync(certAbs, 'utf-8')
      for (const { field, stamp } of CERT_STAMPED_FIELDS) {
        findings.push(
          ...verdictLockFindings(
            certRecords(baselineJson, field, stamp),
            certRecords(currentJson, field, stamp),
            { csv: 'compliance-data.json', field }
          )
        )
      }
    }
  }

  // concept_xwalks — the newest generation now vs the newest generation at
  // the baseline (the file name may differ: a new dated generation is the
  // normal way a change arrives).
  const xwalkNow = newestGenerationPath('concept_xwalks_')
  if (xwalkNow) {
    const baseFiles = (git(`ls-tree --name-only ${base} src/data/`) ?? '')
      .split('\n')
      .map((f) => path.basename(f))
      .filter((f) => /^concept_xwalks_\d{8}(?:_r\d+)?\.csv$/.test(f))
      .sort((a, b) => {
        const k = (f: string) => {
          const m = f.match(/_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)!
          return `${m[3]}-${m[1]}-${m[2]}#${String(Number(m[4] ?? 0)).padStart(3, '0')}`
        }
        return k(b).localeCompare(k(a))
      })
    const baseXwalk = baseFiles[0] ? showAtBaseline(base, `src/data/${baseFiles[0]}`) : null
    if (baseFiles[0] && baseXwalk === null) {
      findings.push(baselineUnreadable(path.basename(xwalkNow), base, `src/data/${baseFiles[0]}`))
    } else {
      findings.push(
        ...verdictLockFindings(
          xwalkRecords(baseXwalk),
          xwalkRecords(fs.readFileSync(xwalkNow, 'utf-8')),
          { csv: path.basename(xwalkNow), field: 'confidence/verified_by' }
        )
      )
    }
  }

  return [
    {
      id: 'LN-1',
      category: 'structure',
      description: 'Verdict lock: a verified value only changes with a newer stamp',
      sourceA: 'public/data/compliance-data.json + src/data/concept_xwalks_*.csv',
      sourceB: `merge-base ${base.slice(0, 9)}`,
      severity: 'ERROR',
      status: findings.length ? 'FAIL' : 'PASS',
      findings,
    },
  ]
}

// ---------------------------------------------------------------------------
// LN-4 — archive, never delete
// ---------------------------------------------------------------------------

/** One line of `git diff --name-status --no-renames`: `<status>\t<path>`. */
export interface NameStatusEntry {
  status: string
  from: string
  to?: string
}

export function parseNameStatus(output: string): NameStatusEntry[] {
  return output
    .split('\n')
    .filter((l) => l.trim() !== '')
    .map((l) => {
      const parts = l.split('\t')
      const status = parts[0].trim()
      return status.startsWith('R') || status.startsWith('C')
        ? { status, from: parts[1], to: parts[2] }
        : { status, from: parts[1] }
    })
}

const DATED_CSV = /^src\/data\/[^/]+_\d{8}(?:_r\d+)?\.csv$/

/**
 * Pure core of LN-4, over a `--no-renames` name-status listing: every
 * deleted dated generation in src/data/ must reappear, byte-identical in
 * intent, as an added src/data/archive/<same name> in the same change set.
 *
 * `--no-renames` is load-bearing. With rename detection on, git paired the
 * deleted concept_xwalks_08292026.csv with the NEW concept_xwalks_09172026_r1
 * (88% similar — consecutive generations always are) and reported one
 * "rename inside src/data", which a naive rule treats as an edit. The first
 * replay of leak L4 passed for exactly that reason. Renames are therefore
 * never expected here; if one appears anyway it is treated as a deletion of
 * its source.
 */
export function archiveOnlyFindings(entries: readonly NameStatusEntry[]): Finding[] {
  const added = new Set(entries.filter((e) => e.status === 'A').map((e) => e.from))
  for (const e of entries) if (e.to) added.add(e.to)
  const findings: Finding[] = []
  for (const e of entries) {
    const isGone = e.status === 'D' || e.status.startsWith('R')
    if (!isGone || !DATED_CSV.test(e.from)) continue
    const name = path.basename(e.from)
    if (added.has(`src/data/archive/${name}`)) continue // the one allowed exit
    findings.push({
      csv: name,
      row: null,
      field: 'generation',
      value: e.to ? `${e.from} → ${e.to}` : e.from,
      message: `${name} left src/data/ without arriving in src/data/archive/${name} — a dated generation is only ever archived (\`git mv\`; a copied file needs \`git add -f\`, src/data/archive/ is gitignored), never deleted or renamed, so downstream citations (rag-corpus was_derived_from, revisions) keep resolving`,
    })
  }
  return findings
}

export function runArchiveOnlyCheck(): CheckResult[] {
  const base = baselineCommit()
  const common = {
    id: 'LN-4',
    category: 'structure' as const,
    sourceA: 'src/data/*_MMDDYYYY(_rN).csv',
    sourceB: 'src/data/archive/',
    severity: 'ERROR' as const,
  }
  if (!base) {
    return [
      {
        ...common,
        description:
          'Archive, never delete: a dated CSV leaves src/data only via src/data/archive (skipped — no origin/main)',
        status: 'SKIP',
        findings: [],
      },
    ]
  }
  const out = git(`diff --name-status --no-renames ${base}...HEAD -- src/data`) ?? ''
  const findings = archiveOnlyFindings(parseNameStatus(out))
  return [
    {
      ...common,
      description: 'Archive, never delete: a dated CSV leaves src/data only via src/data/archive',
      status: findings.length ? 'FAIL' : 'PASS',
      findings,
    },
  ]
}

// ---------------------------------------------------------------------------
// LN-6 — CONTRADICTED never ships
// ---------------------------------------------------------------------------

export interface ManifestEntryLite {
  refId?: string
  url?: string
  identity?: string
  admittedAt?: string
  ok?: boolean
  status?: string
  [k: string]: unknown
}

/** Pure core of LN-6: live entries (not retired with ok:false) whose identity is CONTRADICTED, split into the two tiers by admission date. */
export function contradictedFindings(
  source: string,
  entries: readonly ManifestEntryLite[],
  cutoff = LINEAGE_CUTOFF
): { blocking: Finding[]; legacy: Finding[] } {
  const blocking: Finding[] = []
  const legacy: Finding[] = []
  entries.forEach((e, i) => {
    if (e.identity !== 'CONTRADICTED') return
    if (e.ok === false) return // retired by the door (aside under _superseded)
    const admitted = (e.admittedAt ?? '').slice(0, 10)
    const finding: Finding = {
      csv: `${source}/manifest.json`,
      row: i + 1,
      field: 'identity',
      value: 'CONTRADICTED',
      message: `${e.refId ?? e.url ?? '?'}: the admitted copy is provably not the document this row names (admitted ${admitted || 'unknown'}) — re-fetch the right document through the door or deprecate the row; a CONTRADICTED copy must not back a live entry`,
    }
    ;(admitted >= cutoff ? blocking : legacy).push(finding)
  })
  return { blocking, legacy }
}

/**
 * The records of one manifest.json: a bare array, `entries` (most sources) or
 * `downloads` (migrate-proofs). Reading only `entries` silently skipped the
 * migrate proofs (migrate remediation r2 W-E1).
 */
export function manifestEntries(m: unknown): ManifestEntryLite[] | null {
  if (Array.isArray(m)) return m as ManifestEntryLite[]
  if (m && typeof m === 'object') {
    const o = m as { entries?: unknown; downloads?: unknown }
    if (Array.isArray(o.entries)) return o.entries as ManifestEntryLite[]
    if (Array.isArray(o.downloads)) return o.downloads as ManifestEntryLite[]
  }
  return null
}

function readManifests(): Array<{ source: string; entries: ManifestEntryLite[] }> {
  const pub = path.join(process.cwd(), 'public')
  if (!fs.existsSync(pub)) return []
  const out: Array<{ source: string; entries: ManifestEntryLite[] }> = []
  for (const dir of fs.readdirSync(pub)) {
    const p = path.join(pub, dir, 'manifest.json')
    if (!fs.existsSync(p)) continue
    try {
      const entries = manifestEntries(JSON.parse(fs.readFileSync(p, 'utf-8')))
      if (entries) out.push({ source: dir, entries })
    } catch {
      /* not a manifest we understand — other checks own JSON validity */
    }
  }
  return out
}

export function runContradictedCheck(): CheckResult[] {
  const blocking: Finding[] = []
  const legacy: Finding[] = []
  for (const { source, entries } of readManifests()) {
    const r = contradictedFindings(source, entries)
    blocking.push(...r.blocking)
    legacy.push(...r.legacy)
  }
  return [
    {
      id: 'LN-6',
      category: 'local-resource',
      description: `CONTRADICTED evidence never ships: live manifest entries admitted on/after ${LINEAGE_CUTOFF} whose copy is not the named document`,
      sourceA: 'public/*/manifest.json',
      sourceB: null,
      severity: 'ERROR',
      status: blocking.length ? 'FAIL' : 'PASS',
      findings: blocking,
    },
    {
      id: 'LN-6-LEGACY',
      category: 'local-resource',
      description: `CONTRADICTED evidence admitted before ${LINEAGE_CUTOFF} still backing live entries (legacy — reported, not blocking; priv lane re-fetches or deprecates)`,
      sourceA: 'public/*/manifest.json',
      sourceB: null,
      severity: 'WARNING',
      status: legacy.length ? 'FAIL' : 'PASS',
      findings: legacy,
    },
  ]
}

// ---------------------------------------------------------------------------
// LN-2 — typed evidence
// ---------------------------------------------------------------------------

export const EVIDENCE_KINDS = new Set(['quote', 'rationale', 'citation'])

/**
 * Pure core of LN-2. The verbatim-quote verdict (`verified_by` starting
 * `lineage:quote-`) is only meaningful on evidence that claims to BE a
 * quote. On 2026-09-17 it ran over 434 hand-curated rows whose `evidence`
 * is a curator's rationale ("CSWP 39 §3 cites ML-KEM (FIPS 203)…") and
 * marked them low — CSWP 39 → FIPS 203 sank to the bottom of the Compliance
 * page. The column that prevents that is `evidence_kind`, written by the
 * maintenance agent from the profile's claim kind (concept-xwalks.yaml).
 *
 * Returns blocking findings (invalid/missing value on an active row when the
 * column exists; lineage:quote-* on a non-quote row) and, when the column is
 * absent altogether, one legacy finding — or a blocking one if the generation
 * is dated on/after the cutoff, since every generation written from then on
 * must carry it.
 */
export function typedEvidenceFindings(
  csv: string,
  rows: readonly Row[],
  generationDate: string,
  cutoff = LINEAGE_CUTOFF
): { blocking: Finding[]; legacy: Finding[] } {
  const blocking: Finding[] = []
  const legacy: Finding[] = []
  const hasColumn =
    rows.length > 0 && Object.prototype.hasOwnProperty.call(rows[0], 'evidence_kind')
  if (!hasColumn) {
    const f: Finding = {
      csv,
      row: null,
      field: 'evidence_kind',
      value: '<column missing>',
      message: `${csv} has no evidence_kind column — every generation from ${cutoff} on must say whether each row's evidence is a quote, a rationale or a citation (written by the maintenance agent from the profile's claim kind)`,
    }
    ;(generationDate >= cutoff ? blocking : legacy).push(f)
    return { blocking, legacy }
  }
  rows.forEach((r, i) => {
    if ((r.status ?? 'active').trim() === 'deprecated') return
    const kind = (r.evidence_kind ?? '').trim().toLowerCase()
    const verifiedBy = (r.verified_by ?? '').trim()
    const id = (r.xwalk_id ?? `row ${i + 2}`).trim()
    if (!EVIDENCE_KINDS.has(kind)) {
      blocking.push({
        csv,
        row: i + 2,
        field: 'evidence_kind',
        value: kind,
        message: `${id}: evidence_kind must be one of quote | rationale | citation (got '${kind}')`,
      })
      return
    }
    if (verifiedBy.startsWith('lineage:quote-') && kind !== 'quote') {
      blocking.push({
        csv,
        row: i + 2,
        field: 'verified_by',
        value: verifiedBy,
        message: `${id}: a verbatim-quote verdict (${verifiedBy}) on a ${kind} row — the quote check may only judge evidence that claims to be a quote; this is the 2026-09-17 category error (434 rationale rows marked low)`,
      })
    }
  })
  return { blocking, legacy }
}

function generationDateOf(file: string): string {
  const m = path.basename(file).match(/_(\d{2})(\d{2})(\d{4})(?:_r\d+)?\.csv$/)
  return m ? `${m[3]}-${m[1]}-${m[2]}` : ''
}

export function runTypedEvidenceCheck(): CheckResult[] {
  const blocking: Finding[] = []
  const legacy: Finding[] = []
  for (const prefix of ['concept_xwalks_', 'compliance_xwalk_candidates_']) {
    const file = newestGenerationPath(prefix)
    if (!file) continue
    const rows = Papa.parse<Row>(fs.readFileSync(file, 'utf-8').trim(), {
      header: true,
      skipEmptyLines: true,
    }).data
    const r = typedEvidenceFindings(path.basename(file), rows, generationDateOf(file))
    blocking.push(...r.blocking)
    legacy.push(...r.legacy)
  }
  return [
    {
      id: 'LN-2',
      category: 'structure',
      description:
        'Typed evidence: evidence_kind ∈ quote|rationale|citation on every active row; the verbatim-quote verdict only on quote rows',
      sourceA: 'src/data/concept_xwalks_*.csv + compliance_xwalk_candidates_*.csv',
      sourceB: null,
      severity: 'ERROR',
      status: blocking.length ? 'FAIL' : 'PASS',
      findings: blocking,
    },
    {
      id: 'LN-2-LEGACY',
      category: 'structure',
      description: `Typed evidence: generations dated before ${LINEAGE_CUTOFF} without an evidence_kind column (legacy — reported, not blocking)`,
      sourceA: 'src/data/concept_xwalks_*.csv + compliance_xwalk_candidates_*.csv',
      sourceB: null,
      severity: 'WARNING',
      status: legacy.length ? 'FAIL' : 'PASS',
      findings: legacy,
    },
  ]
}

export function runLineageChecks(): CheckResult[] {
  return [
    ...runClaimedCopyChecks(),
    ...runVerdictLockCheck(),
    ...runTypedEvidenceCheck(),
    ...runArchiveOnlyCheck(),
    ...runContradictedCheck(),
  ]
}
