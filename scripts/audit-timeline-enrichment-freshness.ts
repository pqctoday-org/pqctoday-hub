#!/usr/bin/env tsx
/**
 * scripts/audit-timeline-enrichment-freshness.ts
 *
 * Detects active timeline rows whose enrichment no longer describes the
 * evidence document the row cites.
 *
 * Evidence lives in the PRIVATE cache, `pqctoday-priv/local-evidence-cache/`
 * (relocated 2026-07-12), resolved as `../pqctoday-priv/local-evidence-cache`
 * from the hub root — the same constant `audit-timeline-evidence.ts` uses —
 * or `$PQC_EVIDENCE_ROOT`. Until 2026-09-24 this script resolved `local_file`
 * against the HUB root, so every row read `no-evidence` and the audit still
 * exited 0.
 *
 * For each active row:
 *   1. Evidence path = `local_file`, else the row's entry in
 *      `public/timeline/manifest.json` (keyed by refId = event_id), else the
 *      skip-list's `localFile` — each resolved under the evidence cache.
 *   2. Enrichment = the newest `src/data/doc-enrichments/timeline_doc_enrichments_*.md`
 *      section headed `## {Country}:{OrgName} — {Title}`.
 *   3. If that section records `- **Evidence SHA-256**: <hex>`, the row is
 *      stale when the file on disk has a different digest (method `digest`).
 *      Sections written before enrich-docs.py recorded the digest fall back to
 *      comparing file mtimes (method `mtime`) — a weak signal: recaching or a
 *      checkout changes mtimes without changing content.
 *
 * Outcomes: fresh | stale | no-enrichment | no-evidence | not-local
 *   `not-local` = the evidence cache is absent (a clean CI checkout). Nothing
 *   can be said about the bytes there; it is reported, never counted as a pass
 *   or a failure.
 *
 * Modes:
 *   (default)  report only; exits 0. This is how `gate:data` runs it in CI,
 *              where the private cache does not exist.
 *   --json     machine-readable summary on stdout; same exit rule.
 *   --strict   exits 1 on any stale / no-enrichment / no-evidence row, AND when
 *              the evidence cache is missing (a strict check that cannot see
 *              the evidence must not pass). The private maintenance loop
 *              (check_run.py) runs this mode.
 */

import { createHash } from 'crypto'
import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import { TIMELINE_LABEL_ALIASES } from '../src/data/timelineLabelAliases.generated'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

export interface CsvRow {
  Country: string
  OrgName: string
  Title: string
  SourceUrl: string
  local_file: string
  status: string
  event_id: string
}

interface SkipListEntry {
  localFile?: string
}

interface ManifestEntry {
  refId?: string
  file?: string
  sha256?: string
}

export type Outcome = 'fresh' | 'stale' | 'no-enrichment' | 'no-evidence' | 'not-local'
export type Method = 'digest' | 'mtime' | null

export interface EnrichmentEntry {
  file: string
  mtime: number
  sha256: string | null
}

export interface RowReport {
  event_id: string
  label: string
  outcome: Outcome
  method: Method
  evidence_path: string | null
  enrichment_file: string | null
  detail: string | null
}

export interface AuditPaths {
  root: string
  evidenceRoot: string
}

export function defaultPaths(): AuditPaths {
  return {
    root: ROOT,
    evidenceRoot:
      process.env.PQC_EVIDENCE_ROOT || join(ROOT, '..', 'pqctoday-priv', 'local-evidence-cache'),
  }
}

export function findLatestTimelineCsv(csvDir: string): string {
  const matches = readdirSync(csvDir)
    .map((f) => {
      // eslint-disable-next-line security/detect-unsafe-regex
      const m = f.match(/^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      const [, month, day, year, rev] = m
      return {
        path: join(csvDir, f),
        date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime(),
        revision: rev ? parseInt(rev) : 0,
      }
    })
    .filter((x): x is { path: string; date: number; revision: number } => x !== null)
    .sort((a, b) => (a.date !== b.date ? b.date - a.date : b.revision - a.revision))
  if (matches.length === 0) throw new Error(`No timeline_*.csv in ${csvDir}`)
  return matches[0].path
}

function readJson<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T
  } catch {
    return fallback
  }
}

/** Section label → newest enrichment section (by file mtime) that carries it. */
export function loadEnrichmentLookup(enrichDir: string): Map<string, EnrichmentEntry> {
  const byLabel = new Map<string, EnrichmentEntry>()
  if (!existsSync(enrichDir)) return byLabel
  const files = readdirSync(enrichDir).filter((f) => /^timeline_doc_enrichments_.*\.md$/.test(f))
  for (const f of files) {
    const path = join(enrichDir, f)
    const mtime = statSync(path).mtimeMs
    const sections = readFileSync(path, 'utf-8').split(/\n(?=## )/)
    for (const section of sections) {
      if (!section.startsWith('## ') || section.startsWith('## ---')) continue
      const label = section
        .slice(3, section.indexOf('\n') === -1 ? undefined : section.indexOf('\n'))
        .trim()
      if (!label) continue
      const sha = section.match(/^- \*\*Evidence SHA-256\*\*: ([0-9a-f]{64})\s*$/m)
      const existing = byLabel.get(label)
      if (!existing || mtime > existing.mtime) {
        byLabel.set(label, { file: f, mtime, sha256: sha ? sha[1] : null })
      }
    }
  }
  return byLabel
}

function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

export function auditRows(
  rows: CsvRow[],
  paths: AuditPaths,
  manifestByRef: Map<string, ManifestEntry>,
  skipList: Record<string, SkipListEntry>,
  enrichment: Map<string, EnrichmentEntry>,
  aliases: Record<string, readonly string[]> = {}
): RowReport[] {
  const cachePresent = existsSync(paths.evidenceRoot)
  const reports: RowReport[] = []
  for (const row of rows) {
    const label = `${row.Country}:${row.OrgName} — ${row.Title}`
    const eventId = (row.event_id || '').trim()
    // By the current label, else by any label the same event_id carried
    // earlier (a title edit must not orphan a row's enrichment — r2 W-B).
    const enrich =
      enrichment.get(label) ??
      // eslint-disable-next-line security/detect-object-injection
      (aliases[eventId] ?? []).map((l) => enrichment.get(l)).find((e) => e !== undefined)
    const base = {
      event_id: eventId,
      label,
      enrichment_file: enrich?.file ?? null,
    }
    if (!cachePresent) {
      reports.push({
        ...base,
        outcome: 'not-local',
        method: null,
        evidence_path: null,
        detail: null,
      })
      continue
    }
    const candidates = [
      (row.local_file || '').trim(),
      (manifestByRef.get(eventId)?.file || '').trim(),
      // Skip-list captures sit in the timeline/ subdirectory of the cache.
      skipList[(row.SourceUrl || '').trim()]?.localFile
        ? `timeline/${skipList[(row.SourceUrl || '').trim()].localFile}`
        : '',
    ].filter(Boolean)
    const rel = candidates.find((c) => existsSync(join(paths.evidenceRoot, c))) ?? null
    if (!rel) {
      reports.push({
        ...base,
        outcome: 'no-evidence',
        method: null,
        evidence_path: candidates[0] ?? null,
        detail: 'not in the evidence cache',
      })
      continue
    }
    if (!enrich) {
      reports.push({
        ...base,
        outcome: 'no-enrichment',
        method: null,
        evidence_path: rel,
        detail: null,
      })
      continue
    }
    const abs = join(paths.evidenceRoot, rel)
    if (enrich.sha256) {
      const onDisk = sha256File(abs)
      const same = onDisk === enrich.sha256
      reports.push({
        ...base,
        outcome: same ? 'fresh' : 'stale',
        method: 'digest',
        evidence_path: rel,
        detail: same
          ? null
          : `enriched ${enrich.sha256.slice(0, 12)}…, on disk ${onDisk.slice(0, 12)}…`,
      })
      continue
    }
    const delta = statSync(abs).mtimeMs - enrich.mtime
    reports.push({
      ...base,
      outcome: delta > 0 ? 'stale' : 'fresh',
      method: 'mtime',
      evidence_path: rel,
      detail: delta > 0 ? `evidence file is ${Math.round(delta / 86_400_000)} day(s) newer` : null,
    })
  }
  return reports
}

export function summarize(reports: RowReport[]) {
  const counts: Record<Outcome, number> = {
    fresh: 0,
    stale: 0,
    'no-enrichment': 0,
    'no-evidence': 0,
    'not-local': 0,
  }
  const methods = { digest: 0, mtime: 0 }
  for (const r of reports) {
    counts[r.outcome] += 1
    if (r.method) methods[r.method] += 1
  }
  const failing = counts.stale + counts['no-enrichment'] + counts['no-evidence']
  return { counts, methods, failing, cacheMissing: counts['not-local'] > 0 }
}

/** Exit code: report-only mode never fails; strict fails on any failing row or a missing cache. */
export function exitCode(summary: ReturnType<typeof summarize>, strict: boolean): number {
  if (!strict) return 0
  return summary.failing > 0 || summary.cacheMissing ? 1 : 0
}

function main(): void {
  const args = process.argv.slice(2)
  const jsonMode = args.includes('--json')
  const strict = args.includes('--strict')
  const paths = defaultPaths()

  const csvPath = findLatestTimelineCsv(join(paths.root, 'src/data'))
  const parsed = Papa.parse<CsvRow>(readFileSync(csvPath, 'utf-8').trim(), {
    header: true,
    skipEmptyLines: true,
  })
  const activeRows = parsed.data.filter(
    (r): r is CsvRow => !!r && !!r.Country && (r.status ?? '').trim().toLowerCase() !== 'deprecated'
  )
  const manifest = readJson<{ entries?: ManifestEntry[] }>(
    join(paths.root, 'public/timeline/manifest.json'),
    {}
  )
  const manifestByRef = new Map<string, ManifestEntry>()
  for (const e of manifest.entries ?? []) if (e.refId) manifestByRef.set(e.refId, e)
  const skipList = readJson<Record<string, SkipListEntry>>(
    join(paths.root, 'public/timeline/skip-list.json'),
    {}
  )
  const enrichment = loadEnrichmentLookup(join(paths.root, 'src/data/doc-enrichments'))

  const reports = auditRows(
    activeRows,
    paths,
    manifestByRef,
    skipList,
    enrichment,
    TIMELINE_LABEL_ALIASES
  )
  const summary = summarize(reports)
  const code = exitCode(summary, strict)

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify(
        {
          csv: csvPath.replace(paths.root + '/', ''),
          evidence_root: paths.evidenceRoot,
          total_active_rows: activeRows.length,
          ...summary,
          passed: summary.failing === 0 && !summary.cacheMissing,
          flagged: reports.filter((r) => r.outcome !== 'fresh' && r.outcome !== 'not-local'),
        },
        null,
        2
      ) + '\n'
    )
    process.exit(code)
  }

  console.log('Timeline enrichment freshness audit')
  console.log('====================================')
  console.log(`Source CSV       : ${csvPath.replace(paths.root + '/', '')}`)
  console.log(`Evidence cache   : ${paths.evidenceRoot}${summary.cacheMissing ? '  (ABSENT)' : ''}`)
  console.log(`Active rows      : ${activeRows.length}`)
  console.log('')
  for (const [k, v] of Object.entries(summary.counts)) console.log(`  ${k.padEnd(15)} ${v}`)
  console.log(
    `  (compared by digest: ${summary.methods.digest}, by mtime: ${summary.methods.mtime})`
  )
  console.log('')

  if (summary.cacheMissing) {
    console.log(
      'The private evidence cache is not present, so evidence freshness cannot be judged here' +
        (strict ? ' — FAIL (strict mode needs the cache).' : ' (report only).')
    )
    process.exit(code)
  }
  const flagged = reports.filter((r) => r.outcome !== 'fresh')
  for (const r of flagged.slice(0, 20)) {
    console.log(`  [${r.outcome.padEnd(13)}] ${r.event_id}  ${r.label}`)
    if (r.evidence_path) console.log(`       evidence  : ${r.evidence_path}`)
    if (r.enrichment_file) console.log(`       enrichment: ${r.enrichment_file}`)
    if (r.detail) console.log(`       ${r.detail}`)
  }
  if (flagged.length > 20) console.log(`  … ${flagged.length - 20} more (use --json)`)
  console.log('')
  const verdict = summary.failing === 0 ? 'PASS' : strict ? 'FAIL' : 'WARN'
  console.log(
    `${verdict} — ${summary.counts.stale} stale, ${summary.counts['no-enrichment']} no-enrichment, ${summary.counts['no-evidence']} no-evidence.`
  )
  if (summary.failing > 0) {
    console.log(
      'Re-enrich (pqctoday-priv): python3 maintenance/update_run.py --source timeline --ids <event_id,...>'
    )
  }
  process.exit(code)
}

if (process.argv[1] && process.argv[1] === fileURLToPath(import.meta.url)) {
  main()
}
