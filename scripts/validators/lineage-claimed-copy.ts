// SPDX-License-Identifier: GPL-3.0-only
/**
 * lineage-claimed-copy.ts — LN-3 / LN-3-FILE
 *
 * G3 of pqctoday-hub-data-lineage-guarantee-plan-09172026.md: a row that
 * CLAIMS a local copy of its evidence must have (a) a manifest record the
 * evidence door admitted — exactly admit.py's admission_state(), mirrored in
 * lineage-admission.ts — and (b) the file on disk. Leak L3 (2026-09-17): a
 * vendor-roadmap row shipped downloadable=yes + local_file for a capture
 * that never existed; no gate covered vendor-roadmaps, and the local-file
 * checks that exist for library/timeline/threats were excluded in CI.
 *
 *   LN-3       manifest admission — runs everywhere (the manifests are
 *              committed), so CI enforces it too. Decision 2026-09-17: CI is
 *              manifest-only.
 *   LN-3-FILE  the file itself — runs where the evidence cache exists
 *              (pre-push, dev: ../pqctoday-priv/local-evidence-cache and
 *              .cache), SKIPs elsewhere.
 *
 * Two tiers, as for every lineage gate: a claim is BLOCKING when the row is
 * new or its claim changed since the merge base with origin/main, or when
 * the manifest record was admitted on/after LINEAGE_CUTOFF; otherwise it is
 * LEGACY (WARNING, counted). "Not admitted" is NOT "missing": on 2026-09-17,
 * 661 manifest records had never been stamped by the door and 610 of them
 * had the document on disk — the priv lane stamps those in place. The
 * message says which of the two it is.
 *
 * The row → manifest join per source is taken from the priv profiles
 * (maintenance/lineage/profiles/<source>.yaml → evidence.manifest), not
 * invented here; the table below names the yaml it mirrors.
 */
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import Papa from 'papaparse'
import { getDataDir } from './data-loader.js'
import { admissionState, LINEAGE_CUTOFF, NOT_ADMITTED } from './lineage-admission.js'
import type { CheckResult, Finding } from './types.js'

type Row = Record<string, string>

export interface ManifestRecord {
  [k: string]: unknown
  url?: string
  file?: string
  filename?: string
  ok?: boolean
  admittedAt?: string
}

/** One evidence-bearing source: how a row claims a copy and how it joins its manifest. Mirrors the priv profile named in `profile`. */
export interface ClaimedCopySource {
  source: string
  profile: string
  /** src/data prefix (a digit must follow — excludes sibling families). */
  prefix: string
  idColumn: string
  /** The row claims a copy when this returns a non-empty claim string (the local_file or proof url it names). */
  claim: (row: Row) => string
  manifest: { path: string; entries: string; keyField: string }
  /** Extra manifests a source may borrow evidence from (industry-landscape → threats, library). */
  borrowed?: string[]
  /** How to pick ONE record among several with the same key: match the claim against url / file basename. Default: any. */
  disambiguate?: boolean
  /** Where the file lives, relative to the priv checkout / hub, tried in order (file check only). */
  fileRoots: string[]
}

const local = (col: string) => (r: Row) => (r[col] ?? '').trim()

export const CLAIMED_COPY_SOURCES: ClaimedCopySource[] = [
  {
    source: 'library',
    profile: 'library.yaml',
    prefix: 'library_',
    idColumn: 'reference_id',
    claim: (r) =>
      local('local_file')(r) || ((r.downloadable ?? '').trim() === 'yes' ? '<downloadable>' : ''),
    manifest: { path: 'public/library/manifest.json', entries: 'entries', keyField: 'refId' },
    fileRoots: ['../pqctoday-priv/local-evidence-cache', 'public'],
  },
  {
    source: 'timeline',
    profile: 'timeline.yaml',
    prefix: 'timeline_',
    idColumn: 'event_id',
    claim: local('local_file'),
    manifest: { path: 'public/timeline/manifest.json', entries: 'entries', keyField: 'refId' },
    fileRoots: ['../pqctoday-priv/local-evidence-cache', 'public'],
  },
  {
    source: 'threats',
    profile: 'threats.yaml',
    prefix: 'quantum_threats_hsm_industries_',
    idColumn: 'threat_id',
    claim: local('local_file'),
    manifest: { path: 'public/threats/manifest.json', entries: 'entries', keyField: 'threatId' },
    fileRoots: ['../pqctoday-priv/local-evidence-cache', 'public'],
  },
  {
    source: 'compliance',
    profile: 'compliance.yaml',
    prefix: 'compliance_',
    idColumn: 'id',
    claim: local('local_file'),
    manifest: { path: 'public/compliance/manifest.json', entries: 'entries', keyField: 'refId' },
    fileRoots: ['../pqctoday-priv/local-evidence-cache', 'public'],
  },
  {
    source: 'vendor-roadmaps',
    profile: 'vendor-roadmaps.yaml',
    prefix: 'migrate_vendor_roadmap_',
    idColumn: 'vendor_id',
    // Several announcements per vendor since 4.86.0 — the key alone is not
    // unique, so the record is picked by the claimed file/url (disambiguate).
    claim: (r) =>
      local('local_file')(r) ||
      ((r.downloadable ?? '').trim() === 'yes' ? local('roadmap_url')(r) : ''),
    manifest: {
      path: 'public/vendor-roadmaps/manifest.json',
      entries: 'entries',
      keyField: 'vendorId',
    },
    disambiguate: true,
    // Captures live under vendor/ in the priv cache, not vendor-roadmaps/.
    fileRoots: [
      '../pqctoday-priv/local-evidence-cache',
      '../pqctoday-priv/local-evidence-cache/vendor',
      'public',
    ],
  },
  {
    source: 'industry-landscape',
    profile: 'industry-landscape.yaml',
    prefix: 'industry_landscape_',
    idColumn: 'use_case_id',
    claim: local('local_file'),
    manifest: {
      path: 'public/industry-landscape/evidence/manifest.json',
      entries: 'entries',
      keyField: 'refId',
    },
    borrowed: ['public/threats/manifest.json', 'public/library/manifest.json'],
    disambiguate: true,
    fileRoots: ['../pqctoday-priv/local-evidence-cache', 'public'],
  },
  {
    source: 'migrate-proofs',
    profile: 'migrate-catalog.yaml',
    prefix: 'pqc_product_catalog_',
    idColumn: 'product_id',
    claim: local('proof_url'),
    manifest: {
      path: 'public/migrate-proofs/manifest.json',
      entries: 'downloads',
      keyField: 'product_id',
    },
    disambiguate: true,
    fileRoots: ['../pqctoday-priv/local-evidence-cache', 'public'],
  },
  {
    source: 'patents',
    profile: 'patents.yaml',
    prefix: 'patents_',
    idColumn: 'patent_number',
    // Every active in-scope patent is expected to be provable (727/729 on
    // 2026-09-17); the claim is the row itself.
    claim: (r) => (r.patent_number ?? '').trim() && '<in-scope patent>',
    manifest: { path: 'public/patents/manifest.json', entries: 'entries', keyField: 'refId' },
    // The OCR-layered scans (US{id}.md) live under patents/enrichment/; the
    // Google Patents captures (US{id}.html) under local-evidence-cache/.
    fileRoots: [
      '../pqctoday-priv/patents/enrichment',
      '../pqctoday-priv/local-evidence-cache',
      '../pqctoday-priv/local-evidence-cache/patents',
    ],
  },
]

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function git(cmd: string): string | null {
  try {
    return execSync(`git ${cmd}`, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 256 * 1024 * 1024,
    })
  } catch {
    return null
  }
}

const GEN_RE = /_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
const genKey = (f: string) => {
  const m = f.match(GEN_RE)
  return m ? `${m[3]}-${m[1]}-${m[2]}#${String(Number(m[4] ?? 0)).padStart(3, '0')}` : ''
}
const isGeneration = (prefix: string, f: string) =>
  f.startsWith(prefix) && /^\d/.test(f.slice(prefix.length))

function newestGeneration(files: string[], prefix: string): string | null {
  const c = files
    .filter((f) => isGeneration(prefix, path.basename(f)))
    .sort((a, b) => genKey(b).localeCompare(genKey(a)))
  return c[0] ?? null
}

function parseRows(csv: string): Row[] {
  return Papa.parse<Row>(csv.trim(), { header: true, skipEmptyLines: true }).data
}

function readManifestRecords(relPath: string, entriesKey: string): ManifestRecord[] | null {
  const abs = path.join(process.cwd(), relPath)
  if (!fs.existsSync(abs)) return null
  try {
    const m = JSON.parse(fs.readFileSync(abs, 'utf-8')) as
      | Record<string, unknown>
      | ManifestRecord[]
    if (Array.isArray(m)) return m as ManifestRecord[]
    const list = m[entriesKey]
    return Array.isArray(list) ? (list as ManifestRecord[]) : null
  } catch {
    return null
  }
}

/**
 * Pure core: pick the manifest record(s) for a row's key. For a source whose
 * key is not unique (several captures per vendor, several proofs per
 * product), the claim must match a record's url, file, or file basename —
 * and a miss is a MISS. Falling back to "any record for the key" is exactly
 * how leak L3 slipped through in the first version of this function: a row
 * claiming a capture that never existed was satisfied by the vendor's other,
 * genuine capture (caught by this module's own L3 replay test).
 */
export function recordsFor(
  records: readonly ManifestRecord[],
  keyField: string,
  key: string,
  claim: string,
  disambiguate: boolean
): ManifestRecord[] {
  // eslint-disable-next-line security/detect-object-injection -- keyField comes from CLAIMED_COPY_SOURCES, not user input
  const byKey = records.filter((e) => String(e[keyField] ?? '') === key && e.ok !== false)
  if (!disambiguate || !claim || claim.startsWith('<')) return byKey
  const base = path.basename(claim)
  return byKey.filter(
    (e) =>
      e.url === claim ||
      e.file === claim ||
      path.basename(String(e.file ?? e.filename ?? '')) === base
  )
}

export interface ClaimVerdict {
  /** 'ok' | 'no-record' | <admission reason> */
  state: string
  record: ManifestRecord | null
}

/** Pure core of LN-3 for one row. */
export function claimVerdict(
  records: readonly ManifestRecord[],
  src: Pick<ClaimedCopySource, 'manifest' | 'disambiguate'>,
  key: string,
  claim: string
): ClaimVerdict {
  const candidates = recordsFor(records, src.manifest.keyField, key, claim, !!src.disambiguate)
  if (candidates.length === 0) return { state: 'no-record', record: null }
  // Any admitted record for the claim satisfies it; otherwise report the first reason.
  const admitted = candidates.find((e) => admissionState(e) === 'admitted')
  if (admitted) return { state: 'ok', record: admitted }
  return { state: admissionState(candidates[0]), record: candidates[0] }
}

// ---------------------------------------------------------------------------
// tiering: is this row's claim new/changed vs the baseline generation?
// ---------------------------------------------------------------------------

function baselineClaims(src: ClaimedCopySource, base: string | null): Map<string, string> | null {
  if (!base) return null
  const files = (git(`ls-tree --name-only ${base} src/data/`) ?? '').split('\n').filter(Boolean)
  const gen = newestGeneration(files, src.prefix)
  if (!gen) return new Map() // family did not exist at the baseline: every row is new
  const csv = git(`show ${base}:${gen}`)
  if (csv === null) return null // unreadable → caller treats every claim as blocking (fail closed)
  const m = new Map<string, string>()
  for (const r of parseRows(csv)) m.set((r[src.idColumn] ?? '').trim(), src.claim(r))
  return m
}

// ---------------------------------------------------------------------------
// LN-3 — manifest admission
// ---------------------------------------------------------------------------

export function runClaimedCopyCheck(): CheckResult[] {
  const base = git('merge-base HEAD origin/main')?.trim() || null
  const dataDir = getDataDir()
  const blocking: Finding[] = []
  const legacy: Finding[] = []
  const covered: string[] = []

  for (const src of CLAIMED_COPY_SOURCES) {
    if (!fs.existsSync(dataDir)) continue
    const gen = newestGeneration(fs.readdirSync(dataDir), src.prefix)
    if (!gen) continue
    const records = readManifestRecords(src.manifest.path, src.manifest.entries)
    if (records === null) continue // source without a manifest yet — other checks own that
    const pool = [...records]
    for (const b of src.borrowed ?? []) pool.push(...(readManifestRecords(b, 'entries') ?? []))
    const before = baselineClaims(src, base)
    const rows = parseRows(fs.readFileSync(path.join(dataDir, gen), 'utf-8'))
    covered.push(`${src.source}:${gen}`)

    rows.forEach((r, i) => {
      if ((r.status ?? 'active').trim() === 'deprecated') return
      const key = (r[src.idColumn] ?? '').trim()
      const claim = src.claim(r)
      if (!key || !claim) return
      const v = claimVerdict(pool, src, key, claim)
      if (v.state === 'ok') return
      const isNew = before === null ? true : before.get(key) !== claim
      const admitted = String(v.record?.admittedAt ?? '').slice(0, 10)
      const tier = isNew || (admitted && admitted >= LINEAGE_CUTOFF) ? blocking : legacy
      const what =
        v.state === 'no-record'
          ? `claims a copy (${claim.startsWith('<') ? claim.slice(1, -1) : claim}) but ${src.manifest.path} has no record for it — the door never admitted this document; fetch it through admit.py (or drop the claim)`
          : v.state === NOT_ADMITTED
            ? `has a manifest record that was never stamped by the door (no artefact/identity/unified) — not missing: if the file is on disk, stamp it in place (admit.py --stamp-existing); do not re-fetch`
            : `has a manifest record the door does not admit (${v.state}) — a rejected/contradicted copy must not back a live row`
      tier.push({
        csv: gen,
        row: i + 2,
        field: 'local_file',
        value: claim.length > 80 ? `${claim.slice(0, 77)}…` : claim,
        message: `${src.source} ${key}: ${what}`,
      })
    })
  }

  const sourceA = covered.join(', ') || 'src/data (no evidence-bearing generation found)'
  return [
    {
      id: 'LN-3',
      category: 'local-resource',
      description:
        'Claimed copy is admitted: every active row that names a local copy has a manifest record the evidence door admitted (new/changed rows, or records admitted on/after the cutoff)',
      sourceA,
      sourceB: 'public/*/manifest.json (admission_state mirror of admit.py)',
      severity: 'ERROR',
      status: blocking.length ? 'FAIL' : 'PASS',
      findings: blocking,
    },
    {
      id: 'LN-3-LEGACY',
      category: 'local-resource',
      description: `Claimed copy is admitted — rows unchanged since before ${LINEAGE_CUTOFF} whose record is missing or not yet stamped (legacy — reported, not blocking; priv lane stamps in place or re-fetches)`,
      sourceA,
      sourceB: 'public/*/manifest.json',
      severity: 'WARNING',
      status: legacy.length ? 'FAIL' : 'PASS',
      findings: legacy,
    },
  ]
}

// ---------------------------------------------------------------------------
// LN-3-FILE — the file itself (pre-push / dev only)
// ---------------------------------------------------------------------------

const PRIV_CACHE = '../pqctoday-priv/local-evidence-cache'

/** Pure core: where a claimed/recorded file would be, tried in order. */
export function candidatePaths(
  src: ClaimedCopySource,
  claim: string,
  record: ManifestRecord | null
): string[] {
  const names = new Set<string>()
  const rel = String(record?.file ?? '')
  if (rel) names.add(rel)
  if (claim && !claim.startsWith('<') && !/^https?:/.test(claim)) names.add(claim)
  const bases = [...names].map((n) => path.basename(n))
  const out: string[] = []
  for (const root of src.fileRoots) {
    for (const n of names) out.push(path.join(root, n))
    for (const b of bases) out.push(path.join(root, src.source, b), path.join(root, b))
  }
  return [...new Set(out)]
}

export function runClaimedFileCheck(): CheckResult[] {
  const common = {
    id: 'LN-3-FILE',
    category: 'local-resource' as const,
    sourceA: 'src/data evidence-bearing generations',
    sourceB: `${PRIV_CACHE} + public/`,
  }
  if (!fs.existsSync(path.join(process.cwd(), PRIV_CACHE))) {
    return [
      {
        ...common,
        description:
          'Claimed copy exists on disk (skipped — no evidence cache here; runs pre-push/dev)',
        severity: 'ERROR',
        status: 'SKIP',
        findings: [],
      },
    ]
  }
  const base = git('merge-base HEAD origin/main')?.trim() || null
  const dataDir = getDataDir()
  const blocking: Finding[] = []
  const legacy: Finding[] = []
  for (const src of CLAIMED_COPY_SOURCES) {
    const gen = newestGeneration(fs.readdirSync(dataDir), src.prefix)
    if (!gen) continue
    const records = readManifestRecords(src.manifest.path, src.manifest.entries) ?? []
    const pool = [...records]
    for (const b of src.borrowed ?? []) pool.push(...(readManifestRecords(b, 'entries') ?? []))
    const before = baselineClaims(src, base)
    const rows = parseRows(fs.readFileSync(path.join(dataDir, gen), 'utf-8'))
    rows.forEach((r, i) => {
      if ((r.status ?? 'active').trim() === 'deprecated') return
      const key = (r[src.idColumn] ?? '').trim()
      const claim = src.claim(r)
      if (!key || !claim) return
      const v = claimVerdict(pool, src, key, claim)
      if (v.state === 'no-record') return // LN-3 already reports it; nothing to look for on disk
      const paths = candidatePaths(src, claim, v.record)
      if (paths.some((p) => fs.existsSync(path.resolve(process.cwd(), p)))) return
      const isNew = before === null ? true : before.get(key) !== claim
      ;(isNew ? blocking : legacy).push({
        csv: gen,
        row: i + 2,
        field: 'local_file',
        value: String(v.record?.file ?? claim).slice(0, 80),
        message: `${src.source} ${key}: the recorded copy is not on disk (looked under ${src.fileRoots.join(', ')}) — the manifest says it was captured; the cache and the manifest disagree`,
      })
    })
  }
  return [
    {
      ...common,
      description: 'Claimed copy exists on disk (new/changed rows)',
      severity: 'ERROR',
      status: blocking.length ? 'FAIL' : 'PASS',
      findings: blocking,
    },
    {
      ...common,
      id: 'LN-3-FILE-LEGACY',
      description:
        'Claimed copy exists on disk — rows unchanged since before the cutoff (legacy, not blocking)',
      severity: 'WARNING',
      status: legacy.length ? 'FAIL' : 'PASS',
      findings: legacy,
    },
  ]
}

export function runClaimedCopyChecks(): CheckResult[] {
  return [...runClaimedCopyCheck(), ...runClaimedFileCheck()]
}
