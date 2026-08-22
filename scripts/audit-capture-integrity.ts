#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-capture-integrity.ts — silent capture drift, detected without ever
 * overwriting a capture.
 *
 * WHY THIS EXISTS (two confirmed defects, 2026-08-21)
 * ---------------------------------------------------
 * 1. THE GRI CASE. A 2026-06-05 "refreshed to latest version" run overwrote
 *    `GRI-Quantum-Threat-Timeline-2024.pdf` with the 2025 edition AND rewrote
 *    that manifest entry's title/url to match the 2025 report. Two active
 *    library rows then held byte-identical PDFs while their rows described
 *    two different documents, and the 2024 row went on asserting figures no
 *    edition contains. Every existing gate passed: the file existed, it was
 *    large, it was a real PDF, it was not bot-blocked, and its on-disk hash
 *    matched the (rewritten) manifest hash exactly.
 * 2. THE FDA CASE. `FDA-Cybersecurity-in-Medical-Devices-Premarket-Guidance-
 *    2023` cites `https://www.fda.gov/media/119933/download` — a STABLE URL
 *    that FDA replaces in place. The cached bytes are now the February 2026
 *    guidance, two generations newer than the row's title claims.
 *
 * Both are the same shape: the bytes behind a URL, or the file on disk, stop
 * being the document the row describes — silently.
 *
 * WHAT ALREADY COVERED PART OF THIS (do not re-solve these here)
 * -------------------------------------------------------------
 * - `audit-reference-cache-drift.ts` (this directory) re-fetches every
 *   manifest URL and compares upstream against the stored hash. That is the
 *   FDA half — an unbounded, network-heavy sweep of all ~1,200 entries.
 *   This script imports its helpers rather than reimplementing them, and its
 *   `--upstream` mode is deliberately a bounded/rotating/checkpointed
 *   alternative for routine use, not a replacement for the full sweep.
 * - `pqctoday-priv` `audit-title-vs-evidence` compares a row's TITLE against
 *   its capture's `<title>`; `audit-library-evidence` asks whether the file
 *   is THE document or a page ABOUT it; `audit-capture-matches-title.py`
 *   screens title words against capture text.
 * - `deprecation-sweep` checks whether URLs still RESOLVE.
 *
 * NONE of them compares a capture's CURRENT bytes against the hash the
 * manifest recorded for it, and none of them notices that two rows describing
 * two different documents are backed by one identical file. Those two gaps
 * are what this script closes.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 * --------------------------------
 * It never writes, moves, or re-fetches a capture, and never touches a CSV.
 * An automatic refresh is exactly what caused the GRI defect: the right
 * response to drift is a human deciding whether the row should be re-pointed,
 * re-titled, or split into a new generation. Report-only by default;
 * `--strict` opts in to a non-zero exit for CI-style use.
 *
 * FINDINGS
 * --------
 *   disk-drift                 HIGH  file hash != manifest sha256 — something
 *                                    replaced the capture and the manifest
 *                                    was not told (or the manifest was
 *                                    rewritten and the file was not)
 *   duplicate-capture          HIGH  >=2 active entries are byte-identical AND
 *                                    declare >=2 distinct source URLs — the
 *                                    exact GRI signature
 *   upstream-drift             HIGH  the URL serves a document whose text
 *                                    differs from the capture (raw-hash
 *                                    mismatch, confirmed against the drift
 *                                    audit's normalized-text comparison so a
 *                                    site-chrome change is not called drift)
 *   capture-missing            MED   manifest says downloaded, nothing on disk
 *   duplicate-capture-same-url INFO  byte-identical entries that all declare
 *                                    ONE url — duplicate ROWS citing one
 *                                    document, benign for capture integrity
 *   no-stored-hash             LOW   nothing to compare against
 *   upstream-unreachable       LOW   the probe could not reach the URL; says
 *                                    nothing about the document
 *
 * USAGE
 *   npx tsx scripts/audit-capture-integrity.ts
 *   npx tsx scripts/audit-capture-integrity.ts --collection library --strict
 *   npx tsx scripts/audit-capture-integrity.ts --upstream 8      # polite probe
 *
 *   --collection library|timeline|threats|all   (default all)
 *   --cache-root PATH        default $REFERENCE_CACHE_ROOT, else
 *                            ../pqctoday-priv/local-evidence-cache
 *   --csv PATH               library row source for status + declared url;
 *                            default = newest src/data/library_*.csv
 *   --json PATH              also write the report as JSON (default: no file
 *                            is written at all)
 *   --strict                 exit 1 when any HIGH finding exists
 *   --upstream N             probe N entries upstream (bounded, rotating,
 *                            checkpointed; hard cap UPSTREAM_HARD_CAP)
 *   --checkpoint PATH        rotation state (default alongside the priv
 *                            maintenance checkpoints)
 *   --delay-ms N             pause between upstream fetches (default 2000)
 *   --quiet                  findings only, no per-collection progress
 *
 * Exit codes: 0 = audit completed (findings are findings, not errors).
 *             1 = --strict and at least one HIGH finding.
 *             2 = the audit could not run (bad path, unreadable manifest).
 */
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import Papa from 'papaparse'
import {
  cachedRelativePath,
  normalizedSha,
  stealthFetchViaBridge,
} from './audit-reference-cache-drift'

export type Collection = 'library' | 'timeline' | 'threats'
export const ALL_COLLECTIONS: Collection[] = ['library', 'timeline', 'threats']

/** Upstream probing drives a real (sometimes headless-browser) fetch per URL
 *  against third-party servers. A run that sweeps hundreds of them is not a
 *  polite thing to do on a schedule, and the whole-corpus sweep already exists
 *  in audit-reference-cache-drift.ts for when it is genuinely wanted. */
export const UPSTREAM_HARD_CAP = 25

export type Severity = 'high' | 'medium' | 'low' | 'info'

export type FindingKind =
  | 'disk-drift'
  | 'duplicate-capture'
  | 'duplicate-capture-same-url'
  | 'capture-missing'
  | 'no-stored-hash'
  | 'upstream-drift'
  | 'upstream-unreachable'

export interface Finding {
  kind: FindingKind
  severity: Severity
  collection: Collection
  /** refIds involved. One for per-entry findings, N for duplicate groups. */
  refIds: string[]
  detail: string
  storedSha256?: string
  observedSha256?: string
  /** The distinct source URLs the involved rows declare. */
  urls?: string[]
  cachedPath?: string
}

export interface ManifestEntry {
  refId?: string
  title?: string
  url?: string
  status?: string
  filename?: string
  file?: string
  sizeBytes?: number
  sha256?: string
}

/** One entry, joined with whatever the catalogue CSV says about it. */
export interface Capture {
  collection: Collection
  refId: string
  entry: ManifestEntry
  /** Absolute path the capture should live at, or null when unresolvable. */
  cachedPath: string | null
  /** sha256 of the bytes actually on disk right now, or null when absent. */
  diskSha256: string | null
  /** The URL the ROW declares, preferred over the manifest's own `url`.
   *  The GRI defect rewrote the manifest url; the CSV kept the truth. */
  declaredUrl: string
  /** false only when a catalogue row explicitly says so. Unknown => active,
   *  so a missing/locked CSV can never silence a finding. */
  active: boolean
}

export interface AuditReport {
  generated: string
  cacheRoot: string
  csvPath: string | null
  collections: Collection[]
  counts: Record<string, number>
  findings: Finding[]
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

/** Same resolution as audit-reference-cache-drift.ts's private cacheRoot(),
 *  honouring the same env var so both audits always read the same tree.
 *  Read per call, not frozen at module load, so a test can redirect it. */
export function defaultCacheRoot(): string {
  return (
    process.env.REFERENCE_CACHE_ROOT ??
    path.resolve(process.cwd(), '..', 'pqctoday-priv', 'local-evidence-cache')
  )
}

/** The library cache has TWO live roots, and reading only one is wrong.
 *
 *  Evidence moved to `local-evidence-cache/` on 2026-07-12, but the
 *  pre-relocation `pqctoday-priv/public/` tree still holds 843 library files,
 *  3 of which exist ONLY there. Resolving against the new root alone reported
 *  those 3 as `capture-missing` when the file was on disk the whole time.
 *
 *  `audit-capture-matches-title.py` has always resolved this correctly:
 *  CACHE_ROOTS = ("local-evidence-cache", "public"), first match wins. Same
 *  order here, and the order matters — where both roots hold a copy they
 *  usually DISAGREE (97 of 107 captures checked on 2026-08-22), because
 *  `public/` predates the relocation and every refetch since has landed in
 *  `local-evidence-cache/`. The new root is the live one; `public/` is a
 *  fallback for what was never migrated, never an alternative reading of a
 *  file that exists in both.
 *
 *  A THIRD directory, `pqctoday-priv/cowork/public/`, holds 438 captures, 26
 *  of them found nowhere else. It is deliberately NOT a root here: it is a
 *  working area last written on 2026-06-05, carrying CSVs dated March-May, and
 *  every one of its unique captures is superseded — with capture-missing at 0,
 *  no row depends on it. Adding it would resolve live rows against May-vintage
 *  copies, which is the same mistake as preferring `public/` over the
 *  relocated root, one generation further back. If a future row ever does
 *  depend on it, that shows up here as a capture-missing finding, which is the
 *  right way to learn it.
 *
 *  SWEPT 2026-08-21, a negative result worth not repeating. The threats
 *  collection turned out to have TWO competing manifests — the flow wrote
 *  `public/threats/evidence/manifest.json` while the app and this audit read
 *  `public/threats/manifest.json` — which cost real verification work before
 *  it surfaced. A systematic sweep for the same shape found NO others: no
 *  other collection has both `<c>/manifest.json` and
 *  `<c>/evidence/manifest.json`. Seven further artifacts the flow writes have
 *  no hub-side reader (the compliance, compliance-docs, vendor-roadmaps and
 *  embed manifests, vendor-cert-counts, trusted-source-hashes, and the
 *  industry-landscape evidence manifest), but each has several priv-side
 *  readers — maintenance state, correctly absent from the app, not orphans. */
export function fallbackCacheRoots(primary: string): string[] {
  const priv = path.resolve(primary, '..')
  const legacy = path.join(priv, 'public')
  return primary === legacy ? [primary] : [primary, legacy]
}

/** First root that actually holds the file, or the primary path so a genuinely
 *  missing capture still reports against the location it should have been in. */
export function resolveCapturePath(roots: string[], collection: string, rel: string): string {
  for (const root of roots) {
    const candidate = path.join(root, collection, rel)
    if (fs.existsSync(candidate)) return candidate
  }
  return path.join(roots[0], collection, rel)
}

/** Rotation state lives with the other maintenance checkpoints in the private
 *  checkout, never in the hub's tracked tree — a bounded sweep's cursor is
 *  operational state, not published data. */
export function defaultCheckpointPath(): string {
  return path.resolve(
    process.cwd(),
    '..',
    'pqctoday-priv',
    'maintenance',
    'capture_integrity_checkpoint.json'
  )
}

/** Newest `src/data/library_*.csv`, by the generate-data-filenames convention
 *  (MMDDYYYY plus an optional _rN revision). Sorted by mtime rather than by
 *  name because a same-day _r10 sorts before _r9 lexically. */
export function newestLibraryCsv(dataDir: string): string | null {
  let names: string[]
  try {
    names = fs.readdirSync(dataDir)
  } catch {
    return null
  }
  const candidates = names
    .filter((n) => /^library_[0-9]{8}(?:_r[0-9]+)?\.csv$/u.test(n))
    .map((n) => path.join(dataDir, n))
  if (candidates.length === 0) return null
  return candidates.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)[0]
}

// ---------------------------------------------------------------------------
// Loading
// ---------------------------------------------------------------------------

export function sha256File(p: string): string | null {
  try {
    return createHash('sha256').update(fs.readFileSync(p)).digest('hex')
  } catch {
    return null
  }
}

interface CsvRow {
  status?: string
  download_url?: string
}

/** refId -> {status, download_url} from a library CSV. Read-only, and a
 *  failure to read is never fatal: this audit must still work when another
 *  process holds the catalogue. */
export function loadLibraryRows(csvPath: string | null): Map<string, CsvRow> {
  const out = new Map<string, CsvRow>()
  if (!csvPath) return out
  let text: string
  try {
    text = fs.readFileSync(csvPath, 'utf8').trim()
  } catch {
    return out
  }
  const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true })
  for (const row of parsed.data) {
    const id = (row.reference_id ?? '').trim()
    if (!id) continue
    out.set(id, {
      status: (row.status ?? '').trim(),
      download_url: (row.download_url ?? '').trim(),
    })
  }
  return out
}

/** Trailing-slash and case-of-scheme differences are not two documents. */
export function normalizeUrl(u: string): string {
  return u.trim().replace(/\/+$/, '').toLowerCase()
}

export function loadCaptures(
  publicDir: string,
  collection: Collection,
  cacheRoot: string,
  rows: Map<string, CsvRow>
): Capture[] {
  const manifestPath = path.join(publicDir, collection, 'manifest.json')
  const raw = fs.readFileSync(manifestPath, 'utf8')
  const manifest = JSON.parse(raw) as { entries?: ManifestEntry[] }
  const entries = manifest.entries ?? []
  const out: Capture[] = []
  for (const entry of entries) {
    if ((entry.status ?? '') !== 'downloaded') continue
    // `url` is optional here but required by the drift audit's own interface —
    // timeline entries do exist without one. cachedRelativePath reads only
    // filename/file, so filling a blank url is a shape adapter, not a value.
    const rel = cachedRelativePath({
      ...entry,
      url: entry.url ?? '',
      status: entry.status ?? '',
    })
    const cachedPath = rel
      ? resolveCapturePath(fallbackCacheRoots(cacheRoot), collection, rel)
      : null
    // refId is absent on most timeline entries; fall back to the filename so
    // findings are still addressable rather than a list of "undefined".
    const refId = (entry.refId ?? '').trim() || rel || entry.url || '(unidentified entry)'
    const row = rows.get(refId)
    out.push({
      collection,
      refId,
      entry,
      cachedPath,
      diskSha256: cachedPath ? sha256File(cachedPath) : null,
      declaredUrl: (row?.download_url || entry.url || '').trim(),
      active: (row?.status ?? '').toLowerCase() !== 'deprecated',
    })
  }
  return out
}

// ---------------------------------------------------------------------------
// Check 1 — on-disk drift
// ---------------------------------------------------------------------------

/** A capture whose current bytes differ from the hash the manifest recorded
 *  for it. Either something replaced the file without updating the manifest,
 *  or the manifest was rewritten without the file — both mean the recorded
 *  hash no longer proves anything about what is on disk, and neither can be
 *  told from tampering once they are allowed to persist. */
export function checkDiskDrift(captures: Capture[]): Finding[] {
  const findings: Finding[] = []
  for (const c of captures) {
    if (!c.cachedPath) {
      findings.push({
        kind: 'capture-missing',
        severity: 'medium',
        collection: c.collection,
        refIds: [c.refId],
        detail: 'manifest entry is marked downloaded but names no file',
      })
      continue
    }
    if (c.diskSha256 === null) {
      findings.push({
        kind: 'capture-missing',
        severity: 'medium',
        collection: c.collection,
        refIds: [c.refId],
        detail: 'manifest entry is marked downloaded but no file is present',
        cachedPath: c.cachedPath,
        storedSha256: c.entry.sha256,
      })
      continue
    }
    const stored = (c.entry.sha256 ?? '').trim().toLowerCase()
    if (!stored) {
      findings.push({
        kind: 'no-stored-hash',
        severity: 'low',
        collection: c.collection,
        refIds: [c.refId],
        detail: 'capture present but the manifest records no sha256 to compare against',
        cachedPath: c.cachedPath,
        observedSha256: c.diskSha256,
      })
      continue
    }
    if (stored !== c.diskSha256) {
      findings.push({
        kind: 'disk-drift',
        severity: 'high',
        collection: c.collection,
        refIds: [c.refId],
        detail: 'the file on disk is not the capture the manifest recorded',
        cachedPath: c.cachedPath,
        storedSha256: stored,
        observedSha256: c.diskSha256,
      })
    }
  }
  return findings
}

// ---------------------------------------------------------------------------
// Check 2 — duplicate-capture collision (the GRI signature)
// ---------------------------------------------------------------------------

/** Byte-identical captures behind entries that describe DIFFERENT documents.
 *
 *  Grouping is done over the union of two hashes per entry — the bytes on
 *  disk AND the hash the manifest recorded — because each proves the
 *  collision on its own. The GRI pair was visible in the manifest alone (two
 *  entries, one sha256) before anything was hashed; a pair whose manifest
 *  hashes have since diverged is still visible on disk.
 *
 *  The severity split is what keeps this usable. Many rows legitimately cite
 *  ONE document — four threats rows all pointing at CNSA 2.0 share a capture
 *  by design, and flagging that would bury the real signal. What is never
 *  legitimate is one file standing in for two DIFFERENT declared URLs: that
 *  means at least one row's evidence is not its document. Deprecated rows are
 *  excluded because a superseded row sharing bytes with its successor is the
 *  expected end state, not a defect. */
export function checkDuplicateCaptures(captures: Capture[]): Finding[] {
  const groups = new Map<string, Capture[]>()
  for (const c of captures) {
    if (!c.active) continue
    const hashes = new Set<string>()
    if (c.diskSha256) hashes.add(c.diskSha256)
    const stored = (c.entry.sha256 ?? '').trim().toLowerCase()
    if (stored) hashes.add(stored)
    for (const h of hashes) {
      const bucket = groups.get(h)
      if (bucket) {
        if (!bucket.includes(c)) bucket.push(c)
      } else {
        groups.set(h, [c])
      }
    }
  }

  const findings: Finding[] = []
  const reported = new Set<string>()
  for (const [hash, members] of groups) {
    if (members.length < 2) continue
    // One entry can appear under both its disk hash and its (different)
    // manifest hash; dedupe by refId so a single row is never a "pair".
    const byRef = new Map<string, Capture>()
    for (const m of members) if (!byRef.has(m.refId)) byRef.set(m.refId, m)
    if (byRef.size < 2) continue

    const refIds = [...byRef.keys()].sort()
    const key = refIds.join('|')
    if (reported.has(key)) continue
    reported.add(key)

    const urls = [...new Set([...byRef.values()].map((m) => normalizeUrl(m.declaredUrl)))].filter(
      Boolean
    )
    const distinct = urls.length > 1
    findings.push({
      kind: distinct ? 'duplicate-capture' : 'duplicate-capture-same-url',
      severity: distinct ? 'high' : 'info',
      collection: [...byRef.values()][0].collection,
      refIds,
      detail: distinct
        ? `${refIds.length} active entries declare ${urls.length} different source URLs but are backed by ONE byte-identical capture — at least one row's evidence is not its document`
        : `${refIds.length} active entries share one capture and one source URL — duplicate rows citing the same document, not a capture defect`,
      observedSha256: hash,
      urls: [...new Set([...byRef.values()].map((m) => m.declaredUrl))].filter(Boolean),
      cachedPath: [...byRef.values()][0].cachedPath ?? undefined,
    })
  }
  return findings
}

// ---------------------------------------------------------------------------
// Check 3 — bounded, rotating, checkpointed upstream probe
// ---------------------------------------------------------------------------

interface CheckpointEntry {
  last_checked_id?: string
  cumulative_checked_ids?: string[]
  updated?: string
}
type Checkpoint = Record<string, CheckpointEntry>

export function loadCheckpoint(p: string): Checkpoint {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8')) as Checkpoint
  } catch {
    return {}
  }
}

export function saveCheckpoint(p: string, key: string, lastId: string, cumulative: string[]): void {
  const cp = loadCheckpoint(p)
  // eslint-disable-next-line security/detect-object-injection -- `key` is a Collection literal from ALL_COLLECTIONS, never external input
  cp[key] = {
    last_checked_id: lastId,
    cumulative_checked_ids: [...cumulative].sort(),
    updated: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  }
  fs.mkdirSync(path.dirname(p), { recursive: true })
  const tmp = `${p}.${process.pid}.tmp`
  fs.writeFileSync(tmp, `${JSON.stringify(cp, null, 2)}\n`)
  fs.renameSync(tmp, p)
}

export interface RotationInfo {
  cumulativeCount: number
  total: number
  cumulativePct: number
  newCumulative: string[]
  lastIdInSample: string | null
}

/** Membership-based rotation, ported from pqctoday-priv/scripts/rotation_util.py.
 *  Deliberately NOT positional: a positional cursor breaks the moment the
 *  caller's ordering changes between runs (the 2026-08-10 learn-modules bug,
 *  where checking a row moved it and the cursor followed it). Take the first N
 *  ids this cycle has not seen; when every id has been seen, start a fresh lap. */
export function rotatingSlice<T extends { refId: string }>(
  items: T[],
  cp: CheckpointEntry,
  limit: number
): { sample: T[]; rotation: RotationInfo } {
  if (items.length === 0) {
    return {
      sample: [],
      rotation: {
        cumulativeCount: 0,
        total: 0,
        cumulativePct: 0,
        newCumulative: [],
        lastIdInSample: null,
      },
    }
  }
  const cumulative = new Set(cp.cumulative_checked_ids ?? [])
  const n = Math.min(limit, items.length)
  const unseen = items.filter((i) => !cumulative.has(i.refId))
  let sample: T[]
  if (unseen.length > 0) {
    sample = unseen.slice(0, n)
  } else {
    const ids = items.map((i) => i.refId)
    const at = cp.last_checked_id ? ids.indexOf(cp.last_checked_id) : -1
    const start = at >= 0 ? (at + 1) % items.length : 0
    sample = Array.from({ length: n }, (_, k) => items[(start + k) % items.length])
  }
  let next = new Set([...cumulative, ...sample.map((s) => s.refId)])
  // A completed lap resets the counter so coverage % stays meaningful rather
  // than pinning at 100% forever.
  if (next.size >= items.length) next = new Set(sample.map((s) => s.refId))
  return {
    sample,
    rotation: {
      cumulativeCount: next.size,
      total: items.length,
      cumulativePct: (100 * next.size) / items.length,
      newCumulative: [...next],
      lastIdInSample:
        sample.length > 0 ? sample[sample.length - 1].refId : (cp.last_checked_id ?? null),
    },
  }
}

export interface UpstreamFetchResult {
  ok: boolean
  bytes: Uint8Array | null
  tier: string
  error: string | null
}

export type UpstreamFetchImpl = (url: string) => UpstreamFetchResult

/** The ONLY network path here, and it is the repo's bot-resistant ladder
 *  (curl_cffi -> playwright-stealth -> crawl4ai) via the existing one-shot
 *  bridge — never a bare fetch(), and never anything that would walk past an
 *  access wall. The bytes fetched are hashed and thrown away; nothing is
 *  written to the cache under any flag. */
export function defaultUpstreamFetch(url: string): UpstreamFetchResult {
  const pythonBin = path.resolve(process.cwd(), '..', '.venv-enrich', 'bin', 'python3')
  const bridge = path.resolve(
    process.cwd(),
    '..',
    'pqctoday-priv',
    'scripts',
    'fetch_resilient_bridge.py'
  )
  const r = stealthFetchViaBridge(url, pythonBin, bridge)
  if (!r.ok) return { ok: false, bytes: null, tier: r.tier, error: r.error }
  const bytes =
    r.binary && r.dataB64 ? Buffer.from(r.dataB64, 'base64') : Buffer.from(r.text, 'utf8')
  return { ok: true, bytes, tier: r.tier, error: null }
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))

/** True when a raw byte mismatch is only the publisher's page furniture.
 *
 *  The stored hash is a RAW hash, so a raw-vs-raw comparison is all a stored
 *  hash alone permits — and that comparison is dominated by the CONTAINER
 *  rather than the contents. audit-reference-cache-drift.ts learned this the
 *  expensive way: one deploy of the RFC Editor's website changed a footer
 *  build string and re-flagged every cached RFC as drifted. Its normalizedText
 *  extraction (content region, entities decoded, whitespace collapsed) is the
 *  fix, and it is imported here rather than re-derived.
 *
 *  Applying it needs BOTH sides normalized, so this reads the cached file — the
 *  one thing that makes the comparison meaningful. When the cache copy is
 *  absent there is nothing to normalize against and the raw mismatch stands,
 *  which is the honest default: report it and let a human look. */
function sameDocumentText(c: Capture, upstream: Uint8Array): boolean {
  if (!c.cachedPath) return false
  let cached: Uint8Array
  try {
    cached = fs.readFileSync(c.cachedPath)
  } catch {
    return false
  }
  return normalizedSha(cached) === normalizedSha(upstream)
}

export async function probeUpstream(
  captures: Capture[],
  opts: {
    limit: number
    checkpointPath: string
    checkpointKey: string
    delayMs: number
    fetcher: UpstreamFetchImpl
    persist: boolean
    log: (m: string) => void
  }
): Promise<Finding[]> {
  const eligible = captures.filter((c) => c.active && c.entry.sha256 && c.declaredUrl)
  const cp = loadCheckpoint(opts.checkpointPath)[opts.checkpointKey] ?? {}
  const { sample, rotation } = rotatingSlice(eligible, cp, Math.min(opts.limit, UPSTREAM_HARD_CAP))
  opts.log(
    `[capture-integrity] upstream probe: ${sample.length} of ${eligible.length} eligible ` +
      `(rotating; cumulative coverage after this run ${rotation.cumulativeCount}/${rotation.total}, ` +
      `${rotation.cumulativePct.toFixed(0)}%)`
  )

  const findings: Finding[] = []
  for (let i = 0; i < sample.length; i++) {
    const c = sample[i]
    if (i > 0 && opts.delayMs > 0) await sleep(opts.delayMs)
    const r = opts.fetcher(c.declaredUrl)
    if (!r.ok || !r.bytes) {
      findings.push({
        kind: 'upstream-unreachable',
        severity: 'low',
        collection: c.collection,
        refIds: [c.refId],
        detail: `upstream not reached (${r.tier}): ${r.error ?? 'unknown'} — says nothing about the document`,
        urls: [c.declaredUrl],
      })
      continue
    }
    const observed = createHash('sha256').update(r.bytes).digest('hex')
    const stored = (c.entry.sha256 ?? '').toLowerCase()
    if (observed !== stored && !sameDocumentText(c, r.bytes)) {
      findings.push({
        kind: 'upstream-drift',
        severity: 'high',
        collection: c.collection,
        refIds: [c.refId],
        detail:
          'the bytes served by this URL today are not the bytes captured — a human decides whether the row is re-pointed, re-titled, or split into a new generation. Nothing was overwritten.',
        storedSha256: stored,
        observedSha256: observed,
        urls: [c.declaredUrl],
        cachedPath: c.cachedPath ?? undefined,
      })
    }
  }

  if (opts.persist && rotation.lastIdInSample) {
    saveCheckpoint(
      opts.checkpointPath,
      opts.checkpointKey,
      rotation.lastIdInSample,
      rotation.newCumulative
    )
  }
  return findings
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------

export interface RunOptions {
  publicDir: string
  dataDir?: string
  cacheRoot: string
  collections: Collection[]
  csvPath?: string | null
  upstream?: number
  checkpointPath?: string
  delayMs?: number
  upstreamFetcher?: UpstreamFetchImpl
  persistCheckpoint?: boolean
  quiet?: boolean
}

export async function run(opts: RunOptions): Promise<AuditReport> {
  const log = opts.quiet ? () => {} : (m: string) => console.log(m)
  const csvPath =
    opts.csvPath === undefined
      ? newestLibraryCsv(opts.dataDir ?? path.resolve(opts.publicDir, '..', 'src', 'data'))
      : opts.csvPath
  const rows = loadLibraryRows(csvPath)
  if (csvPath) log(`[capture-integrity] catalogue rows: ${csvPath} (${rows.size} rows, read-only)`)
  else log('[capture-integrity] no library CSV found — every entry treated as active')

  const findings: Finding[] = []
  for (const collection of opts.collections) {
    const captures = loadCaptures(opts.publicDir, collection, opts.cacheRoot, rows)
    log(`[capture-integrity] ${collection}: ${captures.length} downloaded captures`)
    findings.push(...checkDiskDrift(captures))
    findings.push(...checkDuplicateCaptures(captures))
    if (opts.upstream && opts.upstream > 0) {
      findings.push(
        ...(await probeUpstream(captures, {
          limit: opts.upstream,
          checkpointPath: opts.checkpointPath ?? defaultCheckpointPath(),
          checkpointKey: collection,
          delayMs: opts.delayMs ?? 2000,
          fetcher: opts.upstreamFetcher ?? defaultUpstreamFetch,
          persist: opts.persistCheckpoint ?? true,
          log,
        }))
      )
    }
  }

  const counts: Record<string, number> = {}
  for (const f of findings) counts[f.kind] = (counts[f.kind] ?? 0) + 1

  return {
    generated: new Date().toISOString(),
    cacheRoot: opts.cacheRoot,
    csvPath,
    collections: opts.collections,
    counts,
    findings,
  }
}

export function highCount(report: AuditReport): number {
  return report.findings.filter((f) => f.severity === 'high').length
}

export function formatReport(report: AuditReport): string {
  const lines: string[] = []
  const order: Severity[] = ['high', 'medium', 'low', 'info']
  for (const sev of order) {
    const group = report.findings.filter((f) => f.severity === sev)
    if (group.length === 0) continue
    lines.push('')
    lines.push(
      `── ${sev.toUpperCase()} (${group.length}) ${'─'.repeat(Math.max(0, 50 - sev.length))}`
    )
    for (const f of group) {
      lines.push(`  [${f.kind}] ${f.collection}: ${f.refIds.join(' + ')}`)
      lines.push(`      ${f.detail}`)
      if (f.storedSha256 || f.observedSha256) {
        lines.push(
          `      stored=${(f.storedSha256 ?? '-').slice(0, 16)} observed=${(f.observedSha256 ?? '-').slice(0, 16)}`
        )
      }
      if (f.urls && f.urls.length > 0) for (const u of f.urls) lines.push(`      url: ${u}`)
    }
  }
  lines.push('')
  lines.push(
    `Totals: ${
      Object.entries(report.counts)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join(' ') || 'no findings'
    }`
  )
  lines.push('Report-only. No capture, manifest, or CSV was written by this audit.')
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

interface Cli {
  collections: Collection[]
  cacheRoot: string
  csvPath: string | null | undefined
  jsonPath: string | null
  strict: boolean
  upstream: number
  checkpointPath: string
  delayMs: number
  quiet: boolean
}

export function parseCli(argv: string[]): Cli {
  const arg = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`)
    return i >= 0 && i + 1 < argv.length ? argv[i + 1] : undefined
  }
  const collectionArg = (arg('collection') ?? 'all').toLowerCase()
  const collections: Collection[] =
    collectionArg === 'all'
      ? ALL_COLLECTIONS
      : (collectionArg
          .split(',')
          .filter((c): c is Collection =>
            (ALL_COLLECTIONS as string[]).includes(c)
          ) as Collection[])
  if (collections.length === 0) {
    throw new Error(`--collection must be one of ${ALL_COLLECTIONS.join('|')}|all`)
  }
  const upstreamRaw = Number(arg('upstream') ?? 0)
  return {
    collections,
    cacheRoot: arg('cache-root') ?? defaultCacheRoot(),
    csvPath: arg('csv'),
    jsonPath: arg('json') ?? null,
    strict: argv.includes('--strict'),
    upstream: Number.isFinite(upstreamRaw)
      ? Math.min(Math.max(0, upstreamRaw), UPSTREAM_HARD_CAP)
      : 0,
    checkpointPath: arg('checkpoint') ?? defaultCheckpointPath(),
    delayMs: Number(arg('delay-ms') ?? 2000),
    quiet: argv.includes('--quiet'),
  }
}

async function main(): Promise<void> {
  const cli = parseCli(process.argv)
  if (!fs.existsSync(cli.cacheRoot)) {
    console.error(`[capture-integrity] cache root not found: ${cli.cacheRoot}`)
    process.exit(2)
  }
  const report = await run({
    publicDir: path.resolve(process.cwd(), 'public'),
    dataDir: path.resolve(process.cwd(), 'src', 'data'),
    cacheRoot: cli.cacheRoot,
    collections: cli.collections,
    csvPath: cli.csvPath,
    upstream: cli.upstream,
    checkpointPath: cli.checkpointPath,
    delayMs: cli.delayMs,
    quiet: cli.quiet,
  })
  console.log(formatReport(report))
  if (cli.jsonPath) {
    fs.writeFileSync(cli.jsonPath, `${JSON.stringify(report, null, 2)}\n`)
    console.log(`[capture-integrity] JSON written to ${cli.jsonPath}`)
  }
  const high = highCount(report)
  if (cli.strict && high > 0) {
    console.error(`[capture-integrity] --strict: ${high} HIGH finding(s)`)
    process.exit(1)
  }
}

if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('audit-capture-integrity.ts')
) {
  main().catch((err) => {
    console.error('[capture-integrity] Unexpected error:', err)
    process.exit(2)
  })
}
