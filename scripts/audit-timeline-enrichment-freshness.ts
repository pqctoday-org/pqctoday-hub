#!/usr/bin/env tsx
/**
 * scripts/audit-timeline-enrichment-freshness.ts
 *
 * Detects timeline rows whose on-disk evidence file is newer than the most
 * recent enrichment markdown that mentions the row's label. Catches the
 * scenario where a Wayback / Playwright / --fetch-missing pass landed a
 * fresh local file but no one re-ran `enrich-docs-ollama.py` against it,
 * leaving the RAG corpus stuck on stale enrichment for the now-updated
 * evidence.
 *
 * Heuristic (best-effort, no per-row enrichment timestamp exists):
 *   For each active timeline row:
 *     1. Resolve its evidence file path via, in order:
 *          - csv.local_file (most rows)
 *          - skip-list[csv.SourceUrl].localFile (Wayback / Playwright /
 *            manual-download cases)
 *          - manifest.entries[].resolved_local_file (fallback)
 *     2. Walk all `src/data/doc-enrichments/timeline_doc_enrichments_*.md`
 *        files, find the most recent file that contains
 *        `## {Country}:{OrgName} — {Title}`.
 *     3. If the evidence-file mtime is newer than that enrichment file's
 *        mtime, flag the row as stale.
 *     4. If no enrichment file mentions the row's label, flag as `no-enrichment`.
 *
 * Modes:
 *   (default)    human-readable report; exits 0
 *   --json       machine-readable summary on stdout; exits 0
 *   --strict     human report; exits non-zero if any stale or no-enrichment rows
 *
 * Run via:
 *   npm run audit:enrichment-freshness
 *   npm run audit:enrichment-freshness -- --json
 *   npm run audit:enrichment-freshness -- --strict
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const CSV_DIR = join(ROOT, 'src/data')
const ENRICH_DIR = join(ROOT, 'src/data/doc-enrichments')
const SKIP_LIST_PATH = join(ROOT, 'public/timeline/skip-list.json')
const MANIFEST_PATH = join(ROOT, 'public/timeline/evidence/manifest.json')

const args = process.argv.slice(2)
const JSON_MODE = args.includes('--json')
const STRICT = args.includes('--strict')

interface CsvRow {
  Country: string
  OrgName: string
  Title: string
  StartYear: string
  SourceUrl: string
  local_file: string
  status: string
}

interface SkipListEntry {
  localFile?: string
}

interface ManifestEntry {
  country: string
  org: string
  title: string
  start_year: number
  resolved_local_file: string | null
}

interface Manifest {
  entries: ManifestEntry[]
}

type Outcome = 'fresh' | 'stale' | 'no-enrichment' | 'no-evidence'

interface RowReport {
  label: string
  outcome: Outcome
  evidence_path: string | null
  evidence_mtime_iso: string | null
  enrichment_file: string | null
  enrichment_mtime_iso: string | null
  delta_seconds: number | null
}

function findLatestTimelineCsv(): string {
  const matches = readdirSync(CSV_DIR)
    .map((f) => {
      // eslint-disable-next-line security/detect-unsafe-regex
      const m = f.match(/^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/)
      if (!m) return null
      const [, month, day, year, rev] = m
      return {
        path: join(CSV_DIR, f),
        date: new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).getTime(),
        revision: rev ? parseInt(rev) : 0,
      }
    })
    .filter((x): x is { path: string; date: number; revision: number } => x !== null)
    .sort((a, b) => (a.date !== b.date ? b.date - a.date : b.revision - a.revision))
  if (matches.length === 0) throw new Error('No timeline_*.csv in src/data/')
  return matches[0].path
}

function loadSkipList(): Record<string, SkipListEntry> {
  if (!existsSync(SKIP_LIST_PATH)) return {}
  try {
    return JSON.parse(readFileSync(SKIP_LIST_PATH, 'utf-8')) as Record<string, SkipListEntry>
  } catch {
    return {}
  }
}

function loadManifest(): Manifest | null {
  if (!existsSync(MANIFEST_PATH)) return null
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8')) as Manifest
  } catch {
    return null
  }
}

interface EnrichmentLookup {
  // label → { file, mtime }
  byLabel: Map<string, { file: string; mtime: number }>
}

function loadEnrichmentLookup(): EnrichmentLookup {
  const byLabel = new Map<string, { file: string; mtime: number }>()
  if (!existsSync(ENRICH_DIR)) return { byLabel }
  const files = readdirSync(ENRICH_DIR).filter((f) =>
    /^timeline_doc_enrichments_\d{8}\.md$/.test(f)
  )
  for (const f of files) {
    const path = join(ENRICH_DIR, f)
    const mtime = statSync(path).mtimeMs
    const raw = readFileSync(path, 'utf-8')
    // Match `## <label>` lines (excluding `## ---` separators).
    const labelLines = raw.split('\n').filter((l) => l.startsWith('## ') && l.trim() !== '## ---')
    for (const line of labelLines) {
      const label = line.slice(3).trim()
      if (!label) continue
      const existing = byLabel.get(label)
      if (!existing || mtime > existing.mtime) {
        byLabel.set(label, { file: f, mtime })
      }
    }
  }
  return { byLabel }
}

function resolveEvidencePath(
  row: CsvRow,
  skipList: Record<string, SkipListEntry>,
  manifest: Manifest | null
): string | null {
  const csvLocalFile = (row.local_file || '').trim()
  if (csvLocalFile) {
    const abs = join(ROOT, csvLocalFile)
    if (existsSync(abs)) return abs
  }
  const sourceUrl = (row.SourceUrl || '').trim()
  // eslint-disable-next-line security/detect-object-injection
  const skipEntry = skipList[sourceUrl]
  if (skipEntry?.localFile) {
    const abs = join(ROOT, 'public/timeline', skipEntry.localFile)
    if (existsSync(abs)) return abs
  }
  if (manifest) {
    const m = manifest.entries.find(
      (e) =>
        e.country === row.Country &&
        e.org === row.OrgName &&
        e.title === row.Title &&
        e.start_year === Number(row.StartYear)
    )
    if (m?.resolved_local_file) {
      const abs = join(ROOT, m.resolved_local_file)
      if (existsSync(abs)) return abs
    }
  }
  return null
}

function isoOrNull(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString()
}

function main(): void {
  const csvPath = findLatestTimelineCsv()
  const csvContent = readFileSync(csvPath, 'utf-8')
  const parsed = Papa.parse<CsvRow>(csvContent.trim(), { header: true, skipEmptyLines: true })
  const activeRows = parsed.data.filter(
    (r): r is CsvRow => !!r && !!r.Country && (r.status ?? '').trim().toLowerCase() !== 'deprecated'
  )

  const skipList = loadSkipList()
  const manifest = loadManifest()
  const enrichment = loadEnrichmentLookup()

  const reports: RowReport[] = []
  for (const row of activeRows) {
    const label = `${row.Country}:${row.OrgName} — ${row.Title}`
    const evidence = resolveEvidencePath(row, skipList, manifest)
    const enrichEntry = enrichment.byLabel.get(label)

    if (!evidence) {
      reports.push({
        label,
        outcome: 'no-evidence',
        evidence_path: null,
        evidence_mtime_iso: null,
        enrichment_file: enrichEntry?.file ?? null,
        enrichment_mtime_iso: enrichEntry ? isoOrNull(enrichEntry.mtime) : null,
        delta_seconds: null,
      })
      continue
    }
    if (!enrichEntry) {
      const evMtime = statSync(evidence).mtimeMs
      reports.push({
        label,
        outcome: 'no-enrichment',
        evidence_path: evidence.replace(ROOT + '/', ''),
        evidence_mtime_iso: isoOrNull(evMtime),
        enrichment_file: null,
        enrichment_mtime_iso: null,
        delta_seconds: null,
      })
      continue
    }
    const evMtime = statSync(evidence).mtimeMs
    const delta = evMtime - enrichEntry.mtime
    reports.push({
      label,
      outcome: delta > 0 ? 'stale' : 'fresh',
      evidence_path: evidence.replace(ROOT + '/', ''),
      evidence_mtime_iso: isoOrNull(evMtime),
      enrichment_file: enrichEntry.file,
      enrichment_mtime_iso: isoOrNull(enrichEntry.mtime),
      delta_seconds: Math.round(delta / 1000),
    })
  }

  const counts: Record<Outcome, number> = {
    fresh: 0,
    stale: 0,
    'no-enrichment': 0,
    'no-evidence': 0,
  }
  for (const r of reports) counts[r.outcome] += 1

  const summary = {
    csv: csvPath.replace(ROOT + '/', ''),
    total_active_rows: activeRows.length,
    counts,
    stale_rows: reports.filter((r) => r.outcome === 'stale'),
    no_enrichment_rows: reports.filter((r) => r.outcome === 'no-enrichment'),
    no_evidence_rows: reports.filter((r) => r.outcome === 'no-evidence'),
    passed: counts.stale === 0 && counts['no-enrichment'] === 0 && counts['no-evidence'] === 0,
  }

  if (JSON_MODE) {
    process.stdout.write(JSON.stringify(summary, null, 2) + '\n')
    process.exit(STRICT && !summary.passed ? 1 : 0)
  }

  console.log('Timeline enrichment freshness audit')
  console.log('====================================')
  console.log(`Source CSV       : ${summary.csv}`)
  console.log(`Active rows      : ${summary.total_active_rows}`)
  console.log('')
  console.log('Outcome counts:')
  for (const [k, v] of Object.entries(counts)) {
    console.log(`  ${k.padEnd(15)} ${v}`)
  }
  console.log('')

  const flagged = [
    ...summary.stale_rows,
    ...summary.no_enrichment_rows,
    ...summary.no_evidence_rows,
  ]
  if (flagged.length === 0) {
    console.log('PASS — every active row has fresh enrichment.')
    process.exit(0)
  }

  console.log(`Flagged rows (first ${Math.min(20, flagged.length)} of ${flagged.length}):`)
  for (const r of flagged.slice(0, 20)) {
    console.log(`  [${r.outcome.padEnd(13)}] ${r.label}`)
    if (r.outcome === 'stale') {
      const days = Math.round((r.delta_seconds ?? 0) / 86400)
      console.log(
        `       evidence : ${r.evidence_path}  (${r.evidence_mtime_iso})\n       enrichment: ${r.enrichment_file}  (${r.enrichment_mtime_iso})\n       delta    : evidence is ${days} day(s) newer`
      )
    } else if (r.outcome === 'no-enrichment') {
      console.log(`       evidence : ${r.evidence_path}  (${r.evidence_mtime_iso})`)
      console.log(`       enrichment: <none found>`)
    } else {
      console.log(`       evidence : <not on disk>`)
      console.log(
        `       enrichment: ${r.enrichment_file ?? '<none found>'}${r.enrichment_mtime_iso ? '  (' + r.enrichment_mtime_iso + ')' : ''}`
      )
    }
  }
  console.log('')

  const verdict = STRICT ? 'FAIL' : 'WARN'
  console.log(
    `${verdict} — ${counts.stale} stale, ${counts['no-enrichment']} no-enrichment, ${counts['no-evidence']} no-evidence.`
  )
  console.log(
    `Re-enrich via: python3 scripts/enrich-docs-ollama.py --collection timeline --append --force-ids "<labels>"`
  )
  process.exit(STRICT ? 1 : 0)
}

main()
