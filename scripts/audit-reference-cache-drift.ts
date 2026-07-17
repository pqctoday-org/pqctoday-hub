#!/usr/bin/env tsx
// SPDX-License-Identifier: GPL-3.0-only
/**
 * audit-reference-cache-drift.ts — detect silent upstream changes to cached
 * reference documents
 *
 * Closes the gap noted in trust-engine-explainability §16 Weakness
 * "Reference-document caching is point-in-time" and Opportunity #14
 * "Per-document content hashes". The manifest entry schema already carries
 * a `sha256` field for every `downloaded` entry (3 library + 23 timeline +
 * 11 threats = 37 entries with full coverage as of 2026-05-14). What was
 * missing was the second half of the loop: a script that periodically
 * re-fetches each cached URL, hashes the response, and compares against
 * the manifest snapshot.
 *
 * For each `downloaded` entry in
 * `public/{library,timeline,threats}/manifest.json` the script:
 *
 *   1. Fetches the `url` with a short timeout
 *   2. Computes SHA-256 over the response body
 *   3. Compares against the stored `sha256`
 *   4. Classifies as: ok / drift / fetch-error / size-mismatch / blocked
 *
 * `blocked` (added 2026-07-12): a hash/size mismatch where the fetched
 * content itself looks like a bot-gate/consent/interstitial page (keyword
 * scan, see looksBlocked()) or byte-identically matches another finding's
 * observed content (see dedupeBlockedByHash()) — a false "drift", since the
 * real document was never actually re-fetched. Found via a real run:
 * ecfr.gov's "Request Access" bot-gate page was being served (and
 * misclassified as drift) for several unrelated CFR citations.
 *
 * The report is written to `public/data/reference-cache-drift.json`.
 * RELOCATED 2026-07-12: previously surfaced by the public hub's
 * reference-cache-drift.yml GitHub Actions workflow (removed — GitHub
 * Actions on this repo is release-safety only; scheduled data/drift
 * checks run from the private pipeline, see pqctoday-priv/maintenance/
 * sources.yaml's `reference-cache` source). The script ALWAYS exits 0 when
 * it completes (drift is a finding, not an error); exits 2 on
 * configuration / IO problems that prevent the audit from running at all.
 *
 * Usage:
 *   npx tsx scripts/audit-reference-cache-drift.ts [--collection library|timeline|threats|all]
 *                                                  [--concurrency 4]
 *                                                  [--timeout-ms 20000]
 *                                                  [--limit N] (audit only the first N entries — for smoke-tests)
 *                                                  [--dry-run] (don't write the report file)
 *                                                  [--stealth-retry] (see below)
 *                                                  [--stealth-retry-limit N] (default 50)
 *                                                  [--stealth-concurrency N] (default 3 — each
 *                                                    retry may launch a real headless browser)
 *
 * --stealth-retry (added 2026-07-17): the first pass above always uses a bare
 * `fetch()` — no anti-bot handling — so a real bot-gate page reads exactly
 * like a fetch success (HTTP 200) with different bytes, landing as `blocked`
 * (content-keyword/hash-dedup detected) or, if the gate itself errors out,
 * `fetch-error`. Neither classification tells you whether the REAL document
 * has actually changed — the naive fetcher never got past the gate to look.
 * When this flag is set, after the normal pass + dedup, findings classified
 * `blocked` or `fetch-error` (up to `--stealth-retry-limit`, oldest-finding-
 * first) are re-fetched through `pqctoday-priv/scripts/fetch_resilient.py`'s
 * curl_cffi -> playwright-stealth -> crawl4ai ladder via a one-shot Python
 * bridge (`fetch_resilient_bridge.py` — one URL in, one JSON line out;
 * see its own docstring). The recovered text is re-classified with the SAME
 * `looksBlocked()` + hash-compare logic as the first pass:
 *   - still looks blocked even under stealth -> classification unchanged,
 *     `stealthOutcome: 'still-blocked'` (a confirmed, not assumed, block)
 *   - stealth tier itself failed (network/browser error) ->
 *     `stealthOutcome: 'still-failing'`, classification unchanged
 *   - real content recovered, hash matches storedSha256 -> reclassified `ok`
 *   - real content recovered, hash differs -> reclassified `drift` (or
 *     `size-mismatch` if byte length matches) — a genuine content change,
 *     now actually observed instead of inferred from a blocked non-fetch
 * Every stealth-retried finding carries `stealthOutcome` + `stealthTier` in
 * the report so a reader can tell "confirmed via stealth" from "naive fetch
 * only" — this is strictly additive, the field is absent when the flag isn't
 * passed. Bounded by `--stealth-retry-limit` because each retry may drive a
 * real headless browser (playwright-stealth), materially slower than tier 1.
 */
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { execFileSync } from 'child_process'

interface ManifestEntry {
  refId?: string
  title?: string
  url: string
  status: string
  filename?: string
  sizeBytes?: number
  contentType?: string
  sha256?: string
}

interface Manifest {
  generated?: string
  source?: string
  summary?: Record<string, number>
  entries: ManifestEntry[]
}

type DriftClassification =
  | 'ok'
  | 'drift'
  | 'fetch-error'
  | 'size-mismatch'
  | 'no-stored-hash'
  | 'blocked'

interface DriftFinding {
  collection: string
  refId: string
  title: string
  url: string
  classification: DriftClassification
  /** Stored hash from the manifest. */
  storedSha256: string | null
  /** Hash computed from the just-fetched bytes. Null on fetch error. */
  observedSha256: string | null
  /** Stored size from the manifest, when present. */
  storedSizeBytes: number | null
  /** Size of the just-fetched response body, in bytes. */
  observedSizeBytes: number | null
  errorMessage?: string
  checkedAt: string
  /** Present only when --stealth-retry attempted a second-pass fetch on this
   * finding (see module docstring). Absent entirely when the flag isn't set. */
  stealthOutcome?: 'recovered-ok' | 'recovered-drift' | 'still-blocked' | 'still-failing'
  stealthTier?: string
}

interface DriftReport {
  generatedAt: string
  totalEntries: number
  fetched: number
  classifications: Record<DriftClassification, number>
  findings: DriftFinding[]
}

const COLLECTIONS = ['library', 'timeline', 'threats'] as const
type Collection = (typeof COLLECTIONS)[number]

// ---------------------------------------------------------------------------
// CLI parsing
// ---------------------------------------------------------------------------

interface CliOptions {
  collections: Collection[]
  concurrency: number
  timeoutMs: number
  limit: number | null
  dryRun: boolean
  stealthRetry: boolean
  stealthRetryLimit: number
  stealthConcurrency: number
}

function parseCli(argv: string[]): CliOptions {
  const args = argv.slice(2)
  let collections: Collection[] = [...COLLECTIONS]
  let concurrency = 4
  let timeoutMs = 20000
  let limit: number | null = null
  let dryRun = false
  let stealthRetry = false
  let stealthRetryLimit = 50
  let stealthConcurrency = 3

  for (let i = 0; i < args.length; i++) {
    // eslint-disable-next-line security/detect-object-injection -- i is a monotonic loop counter into a string[]
    const a = args[i]
    if (a === '--collection') {
      const v = args[++i]
      if (v === 'all') collections = [...COLLECTIONS]
      else if (COLLECTIONS.includes(v as Collection)) collections = [v as Collection]
      else throw new Error(`--collection must be one of: ${COLLECTIONS.join(', ')}, all`)
    } else if (a === '--concurrency') {
      concurrency = Math.max(1, parseInt(args[++i], 10) || 4)
    } else if (a === '--timeout-ms') {
      timeoutMs = Math.max(1000, parseInt(args[++i], 10) || 20000)
    } else if (a === '--limit') {
      limit = Math.max(1, parseInt(args[++i], 10) || 1)
    } else if (a === '--dry-run') {
      dryRun = true
    } else if (a === '--stealth-retry') {
      stealthRetry = true
    } else if (a === '--stealth-retry-limit') {
      stealthRetryLimit = Math.max(1, parseInt(args[++i], 10) || 50)
    } else if (a === '--stealth-concurrency') {
      stealthConcurrency = Math.max(1, parseInt(args[++i], 10) || 3)
    }
  }
  return {
    collections,
    concurrency,
    timeoutMs,
    limit,
    dryRun,
    stealthRetry,
    stealthRetryLimit,
    stealthConcurrency,
  }
}

// ---------------------------------------------------------------------------
// Fetch + classify — exported pure-ish helpers for testing
// ---------------------------------------------------------------------------

export interface FetchedResource {
  bytes: Uint8Array
  sha256: string
}

// eslint-disable-next-line no-unused-vars -- function-type parameters document the callback contract
export type FetchImpl = (url: string, timeoutMs: number) => Promise<FetchedResource>

const realFetch: FetchImpl = async (url, timeoutMs) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      // Identify ourselves clearly so upstream maintainers can spot the
      // crawl in their logs if they care to.
      headers: {
        'User-Agent':
          'pqctoday-reference-cache-drift/1.0 (+https://github.com/pqctoday-org/pqctoday-hub)',
        Accept: '*/*',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    const buf = new Uint8Array(await res.arrayBuffer())
    const sha = createHash('sha256').update(buf).digest('hex')
    return { bytes: buf, sha256: sha }
  } finally {
    clearTimeout(timer)
  }
}

// Same keyword list as pqctoday-priv/scripts/fetch_resilient.py's _CHALLENGE
// (plus "request access", evidenced below) — don't hand-roll a second
// heuristic, per that module's own cross-reference comments in sources.yaml.
// "request access" added 2026-07-12: a real run found ecfr.gov's bot-gate
// page ("Federal Register :: Request Access", served from
// unblock.federalregister.gov) was NOT caught by the plain keyword list
// alone in this corpus's testing until this phrase was added.
const CHALLENGE_RE =
  /just a moment|attention required|cf-browser-verification|access denied|request blocked|enable javascript|verify you are human|captcha|cf-challenge|unusual traffic|are you a robot|request access/i

// Content-based classification threshold. fetch_resilient.py's Python
// equivalent gates its keyword scan at 8000 bytes on the assumption a real
// challenge/interstitial page is tiny — but the actual block pages found in
// THIS corpus (ecfr.gov's Request Access page, 2026-07-12) are modern,
// styled pages with web fonts and bundled JS: a real spot-check found
// observed (collapsed) sizes from 314B up to 65,724B. 100KB gives a wide
// margin above that observed range while staying well under real documents
// (this corpus's stored sizes run from the tens of KB into the megabytes)
// — a boundary set from an actual measured cluster, not a guess, but not a
// mathematically airtight one either; the cross-entry hash-dedup pass below
// is the stronger, evidence-based signal and doesn't depend on this number.
const BLOCKED_SCAN_MAX_BYTES = 100_000

// Real bug found the SAME day this was added (2026-07-12): scanning the
// whole body for keywords up to 100KB false-positived on legitimate IETF
// datatracker pages (40-97KB) whose generic <noscript>Please enable
// Javascript...</noscript> fallback matched "enable javascript" — a phrase
// that's common on ANY modern site's noscript tag and has nothing to do
// with bot-blocking. Real block pages reliably announce themselves in the
// <title> (confirmed: ecfr.gov's is literally "Federal Register :: Request
// Access"); legitimate pages essentially never do. Below 8000 bytes (a
// real interstitial's actual size, matching fetch_resilient.py's own
// threshold) a body-wide keyword match is still trustworthy — a
// legitimately short page containing one of these phrases AND being that
// short is implausible. Above it, only trust a title match.
const TITLE_ONLY_MIN_BYTES = 8_000

function extractTitle(text: string): string {
  const m = /<title[^>]*>([^<]*)<\/title>/i.exec(text)
  return m ? m[1] : ''
}

/**
 * True if `bytes` looks like a bot-block/consent/interstitial page rather
 * than genuine document content — a hash/size mismatch against a blocked
 * response is a false "drift", not a real content change. Content-only
 * signal; classifyEntry additionally cross-checks observed hashes across
 * ALL entries in a run (see dedupeBlockedByHash below) since a shared exact
 * hash across unrelated documents is even stronger evidence than a keyword
 * match and catches block-page templates this list doesn't know about yet.
 */
export function looksBlocked(bytes: Uint8Array): boolean {
  if (bytes.byteLength < 1500) return true
  if (bytes.byteLength >= BLOCKED_SCAN_MAX_BYTES) return false
  const text = Buffer.from(bytes.slice(0, 20_000)).toString('utf-8')
  if (bytes.byteLength < TITLE_ONLY_MIN_BYTES) {
    return CHALLENGE_RE.test(text)
  }
  return CHALLENGE_RE.test(extractTitle(text))
}

/**
 * Classifies a single entry. Pure: only depends on inputs + an injected
 * fetcher. Exported so the unit tests can pass deterministic fakes.
 */
export async function classifyEntry(
  collection: string,
  entry: ManifestEntry,
  fetcher: FetchImpl,
  timeoutMs: number,
  now: Date = new Date()
): Promise<DriftFinding> {
  const base: Omit<
    DriftFinding,
    'classification' | 'observedSha256' | 'observedSizeBytes' | 'errorMessage'
  > = {
    collection,
    refId: entry.refId ?? entry.filename ?? entry.url,
    title: entry.title ?? '',
    url: entry.url,
    storedSha256: entry.sha256 ?? null,
    storedSizeBytes: entry.sizeBytes ?? null,
    checkedAt: now.toISOString(),
  }

  if (!entry.sha256) {
    return {
      ...base,
      classification: 'no-stored-hash',
      observedSha256: null,
      observedSizeBytes: null,
    }
  }

  let result: FetchedResource
  try {
    result = await fetcher(entry.url, timeoutMs)
  } catch (e) {
    return {
      ...base,
      classification: 'fetch-error',
      observedSha256: null,
      observedSizeBytes: null,
      errorMessage: String((e as Error).message ?? e).slice(0, 200),
    }
  }

  const observedSize = result.bytes.byteLength
  if (result.sha256 === entry.sha256) {
    return {
      ...base,
      classification: 'ok',
      observedSha256: result.sha256,
      observedSizeBytes: observedSize,
    }
  }
  // Hash mismatch: a bot-block/consent page returned instead of the real
  // document is a FALSE "drift" — checked before the size-mismatch/drift
  // split below, since a block page can coincidentally match the stored
  // size (rare but not impossible) and would otherwise misreport as the
  // more alarming 'size-mismatch' class. Real bug found 2026-07-12: byte-
  // identical block-page responses across unrelated documents (different
  // domains) were being classified as 'drift' — see the cross-entry
  // dedupeBlockedByHash() pass in run() for the second, hash-based signal
  // this single-entry content check can't provide on its own.
  if (looksBlocked(result.bytes)) {
    return {
      ...base,
      classification: 'blocked',
      observedSha256: result.sha256,
      observedSizeBytes: observedSize,
    }
  }
  // Hash mismatch, not a detected block: distinguish full drift (different
  // content) from a size-only mismatch (rare but informative — same byte
  // count yet different bytes is a meaningful subset of drift).
  const sizeMatched = base.storedSizeBytes !== null && base.storedSizeBytes === observedSize
  return {
    ...base,
    classification: sizeMatched ? 'size-mismatch' : 'drift',
    observedSha256: result.sha256,
    observedSizeBytes: observedSize,
  }
}

// ---------------------------------------------------------------------------
// Stealth retry — second-pass fetch for blocked/fetch-error findings via the
// Python fetch_resilient ladder (curl_cffi -> playwright-stealth -> crawl4ai).
// See module docstring's --stealth-retry section for the full rationale.
// ---------------------------------------------------------------------------

export interface StealthResult {
  ok: boolean
  tier: string
  text: string
  error: string | null
}

/** Not exported as the default path — callers inject this so tests can fake
 * it without actually shelling out to Python. */
export function stealthFetchViaBridge(
  url: string,
  pythonBin: string,
  bridgePath: string
): StealthResult {
  try {
    const out = execFileSync(pythonBin, [bridgePath, url], {
      encoding: 'utf-8',
      timeout: 60_000,
      maxBuffer: 64 * 1024 * 1024,
    })
    const parsed = JSON.parse(out.trim().split('\n').pop() ?? '{}')
    return {
      ok: Boolean(parsed.ok),
      tier: parsed.tier ?? 'unknown',
      text: parsed.text ?? '',
      error: parsed.error ?? null,
    }
  } catch (e) {
    return {
      ok: false,
      tier: 'bridge',
      text: '',
      error: String((e as Error).message ?? e).slice(0, 200),
    }
  }
}

export type StealthFetchImpl = (url: string) => StealthResult

// Real default: pqctoday-priv lives one level up from this repo (sibling
// checkout convention used throughout this codebase — see CLAUDE.md's
// local-evidence-cache note). The venv-enrich Python has curl_cffi +
// playwright + playwright-stealth installed; the repo's own `python3` on
// PATH generally does not.
const DEFAULT_PYTHON_BIN = path.resolve(process.cwd(), '..', '.venv-enrich', 'bin', 'python3')
const DEFAULT_BRIDGE_PATH = path.resolve(
  process.cwd(),
  '..',
  'pqctoday-priv',
  'scripts',
  'fetch_resilient_bridge.py'
)

function defaultStealthFetch(url: string): StealthResult {
  return stealthFetchViaBridge(url, DEFAULT_PYTHON_BIN, DEFAULT_BRIDGE_PATH)
}

/**
 * Re-checks ONE blocked/fetch-error finding via the stealth ladder. Pure
 * given an injected stealth fetcher — the same testability pattern as
 * classifyEntry above. Returns the finding unchanged (but with
 * stealthOutcome/stealthTier set) if stealth recovery didn't change the
 * verdict; returns a reclassified finding if it did.
 */
export function stealthRecheck(
  finding: DriftFinding,
  stealthFetch: StealthFetchImpl
): DriftFinding {
  const result = stealthFetch(finding.url)
  if (!result.ok) {
    return { ...finding, stealthOutcome: 'still-failing', stealthTier: result.tier }
  }
  const bytes = Buffer.from(result.text, 'utf-8')
  if (looksBlocked(bytes)) {
    return { ...finding, stealthOutcome: 'still-blocked', stealthTier: result.tier }
  }
  const observedSha256 = createHash('sha256').update(bytes).digest('hex')
  const observedSizeBytes = bytes.byteLength
  if (finding.storedSha256 && observedSha256 === finding.storedSha256) {
    return {
      ...finding,
      classification: 'ok',
      observedSha256,
      observedSizeBytes,
      stealthOutcome: 'recovered-ok',
      stealthTier: result.tier,
    }
  }
  const sizeMatched =
    finding.storedSizeBytes !== null && finding.storedSizeBytes === observedSizeBytes
  return {
    ...finding,
    classification: sizeMatched ? 'size-mismatch' : 'drift',
    observedSha256,
    observedSizeBytes,
    stealthOutcome: 'recovered-drift',
    stealthTier: result.tier,
  }
}

// ---------------------------------------------------------------------------
// Pool — bounded-concurrency map
// ---------------------------------------------------------------------------

/* eslint-disable no-unused-vars -- function-type parameters document the callback contract */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  /* eslint-enable no-unused-vars */
  const results: R[] = new Array(items.length)
  let cursor = 0
  async function worker(): Promise<void> {
    for (;;) {
      const idx = cursor++
      if (idx >= items.length) return
      // eslint-disable-next-line security/detect-object-injection -- idx is a monotonically increasing integer
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

export interface RunOptions {
  publicDir: string
  outPath: string
  collections: Collection[]
  concurrency: number
  timeoutMs: number
  limit: number | null
  dryRun: boolean
  fetcher: FetchImpl
  stealthRetry?: boolean
  stealthRetryLimit?: number
  stealthConcurrency?: number
  stealthFetch?: StealthFetchImpl
  // eslint-disable-next-line no-unused-vars -- function-type parameter
  log?: (msg: string) => void
}

/**
 * Second, independent block-detection signal: if the SAME observed hash
 * shows up on 2+ different findings still classified 'drift'/'size-
 * mismatch', that's byte-identical content served for unrelated documents —
 * strictly stronger evidence than looksBlocked()'s keyword scan (which can
 * only catch block-page templates already in CHALLENGE_RE) and catches
 * anything that heuristic misses. Real evidence this was needed: a
 * 2026-07-12 run found ecfr.gov's "Request Access" page served byte-
 * identical (same sha256) for COPPA-16-CFR-312, FDA-21-CFR-11, and the
 * unrelated threats entry ENERGY-002 — three different domains/topics
 * returning IDENTICAL bytes is not a coincidence a size/keyword heuristic
 * alone would necessarily catch for every future block-page variant.
 */
export function dedupeBlockedByHash(findings: DriftFinding[]): DriftFinding[] {
  const hashCounts = new Map<string, number>()
  for (const f of findings) {
    if (
      f.observedSha256 &&
      (f.classification === 'drift' || f.classification === 'size-mismatch')
    ) {
      hashCounts.set(f.observedSha256, (hashCounts.get(f.observedSha256) ?? 0) + 1)
    }
  }
  return findings.map((f) => {
    const isDriftLike = f.classification === 'drift' || f.classification === 'size-mismatch'
    if (isDriftLike && f.observedSha256 && (hashCounts.get(f.observedSha256) ?? 0) > 1) {
      return { ...f, classification: 'blocked' }
    }
    return f
  })
}

export async function run(opts: RunOptions): Promise<DriftReport> {
  const log = opts.log ?? ((m: string) => console.log(m))

  const findings: DriftFinding[] = []
  for (const collection of opts.collections) {
    const manifestPath = path.join(opts.publicDir, collection, 'manifest.json')
    if (!fs.existsSync(manifestPath)) {
      log(`[drift] ${collection}: manifest.json missing at ${manifestPath} — skipping`)
      continue
    }
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as Manifest
    const downloaded = manifest.entries.filter((e) => e.status === 'downloaded')
    const subset = opts.limit !== null ? downloaded.slice(0, opts.limit) : downloaded
    log(
      `[drift] ${collection}: ${downloaded.length} downloaded entries (auditing ${subset.length})`
    )
    const collectionFindings = await mapPool(subset, opts.concurrency, async (entry) => {
      const finding = await classifyEntry(collection, entry, opts.fetcher, opts.timeoutMs)
      if (finding.classification !== 'ok') {
        log(`  ${finding.classification.padEnd(15)} ${finding.refId}`)
      }
      return finding
    })
    findings.push(...collectionFindings)
  }

  // Cross-entry pass — needs every collection's findings gathered first, so
  // it runs once here rather than per-collection above. See
  // dedupeBlockedByHash's docstring: this reclassifies 'drift'/'size-
  // mismatch' findings that share an observed hash with another finding as
  // 'blocked' — evidence a shared response was served, not a coincidence.
  const dedupedFindings = dedupeBlockedByHash(findings)
  const reclassified = dedupedFindings.filter(
    (f, i) => f.classification !== findings[i].classification
  )
  if (reclassified.length > 0) {
    log(
      `[drift] ${reclassified.length} finding(s) reclassified drift/size-mismatch -> blocked ` +
        `(shared observed hash with another entry): ${reclassified.map((f) => f.refId).join(', ')}`
    )
  }

  // --stealth-retry: a bounded second pass over blocked/fetch-error findings
  // only. Runs AFTER dedupeBlockedByHash (so cross-entry-confirmed blocks
  // aren't wastefully re-fetched) and BEFORE the classification tally, so
  // reclassified findings count under their real, recovered bucket.
  let finalFindings = dedupedFindings
  if (opts.stealthRetry) {
    const stealthFetch = opts.stealthFetch ?? defaultStealthFetch
    const retryLimit = opts.stealthRetryLimit ?? 50
    const candidates = dedupedFindings
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => f.classification === 'blocked' || f.classification === 'fetch-error')
      .slice(0, retryLimit)
    log(
      `[drift] --stealth-retry: ${candidates.length} of ` +
        `${dedupedFindings.filter((f) => f.classification === 'blocked' || f.classification === 'fetch-error').length} ` +
        `blocked/fetch-error finding(s) selected (limit ${retryLimit})`
    )
    // Bounded concurrency (same mapPool pattern as the main fetch pass) —
    // each retry may drive a real headless browser (curl_cffi -> playwright-
    // stealth -> crawl4ai), so a plain sequential loop over up to
    // stealthRetryLimit candidates could take hours. A low concurrency (not
    // the main pass's 4) keeps this from overwhelming the machine with
    // several simultaneous Chromium instances.
    const updates = new Map<number, DriftFinding>()
    await mapPool(candidates, opts.stealthConcurrency ?? 3, async ({ f, i }) => {
      const rechecked = stealthRecheck(f, stealthFetch)
      updates.set(i, rechecked)
      log(
        `  stealth-retry  ${rechecked.stealthOutcome?.padEnd(15)} ${rechecked.refId} (was ${f.classification} -> ${rechecked.classification})`
      )
    })
    finalFindings = dedupedFindings.map((f, i) => updates.get(i) ?? f)
  }

  const classifications: Record<DriftClassification, number> = {
    ok: 0,
    drift: 0,
    'fetch-error': 0,
    'size-mismatch': 0,
    'no-stored-hash': 0,
    blocked: 0,
  }
  for (const f of finalFindings) classifications[f.classification]++

  const report: DriftReport = {
    generatedAt: new Date().toISOString(),
    totalEntries: finalFindings.length,
    fetched: classifications.ok + classifications.drift + classifications['size-mismatch'],
    classifications,
    findings: finalFindings,
  }

  if (!opts.dryRun) {
    fs.mkdirSync(path.dirname(opts.outPath), { recursive: true })
    fs.writeFileSync(opts.outPath, JSON.stringify(report, null, 2) + '\n', 'utf-8')
    log(`[drift] Wrote report → ${opts.outPath}`)
  }

  log(
    `[drift] Summary: ${classifications.ok} ok, ${classifications.drift} drift, ` +
      `${classifications['size-mismatch']} size-mismatch, ` +
      `${classifications.blocked} blocked (bot-gate/consent page, not real drift), ` +
      `${classifications['fetch-error']} fetch-error, ` +
      `${classifications['no-stored-hash']} no-stored-hash`
  )
  if (opts.stealthRetry) {
    const outcomes = {
      'recovered-ok': 0,
      'recovered-drift': 0,
      'still-blocked': 0,
      'still-failing': 0,
    }
    for (const f of finalFindings) {
      if (f.stealthOutcome) outcomes[f.stealthOutcome]++
    }
    log(
      `[drift] Stealth-retry outcomes: ${outcomes['recovered-ok']} recovered-ok, ` +
        `${outcomes['recovered-drift']} recovered-drift (real content change confirmed), ` +
        `${outcomes['still-blocked']} still-blocked (confirmed, not just naive-fetch failure), ` +
        `${outcomes['still-failing']} still-failing (stealth tier itself couldn't reach it)`
    )
  }
  return report
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  const opts = parseCli(process.argv)
  await run({
    publicDir: path.resolve(process.cwd(), 'public'),
    outPath: path.resolve(process.cwd(), 'public/data/reference-cache-drift.json'),
    collections: opts.collections,
    concurrency: opts.concurrency,
    timeoutMs: opts.timeoutMs,
    limit: opts.limit,
    dryRun: opts.dryRun,
    fetcher: realFetch,
    stealthRetry: opts.stealthRetry,
    stealthRetryLimit: opts.stealthRetryLimit,
    stealthConcurrency: opts.stealthConcurrency,
  })
}

if (
  typeof process !== 'undefined' &&
  process.argv[1] &&
  process.argv[1].endsWith('audit-reference-cache-drift.ts')
) {
  main().catch((err) => {
    console.error('[drift] Unexpected error:', err)
    process.exit(2)
  })
}
