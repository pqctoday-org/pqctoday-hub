/**
 * check-data-regressions.ts — CI guardrail against SILENT data loss.
 *
 * Two failure classes have bitten this repo before, both invisible to a normal
 * diff review because the data files are huge and machine-regenerated:
 *
 *   1. A full-dataset regeneration drops records wholesale
 *      (e.g. compliance-data.json shrinks because a pipeline run produced
 *      fewer certs than the prior run).
 *
 *   2. A vendor-roadmap re-enrichment blanks a field that was previously
 *      populated (e.g. main's re-enrichment erased Citrix's PQC algorithms —
 *      non-empty -> empty — with zero signal).
 *
 *   3. A re-read blanks a column across the rows a page shows: the
 *      2026-09-18 patents re-read (patents_09182026.csv) wrote `[]` into
 *      claim_dependencies for 607 of the 729 rows the Patents page shows —
 *      its reader had no claims text to read — and the page's Claim
 *      Structure section vanished. The commit's own validation checked
 *      that what was written was TRUE, not that what was there survived.
 *      Checked for seven sources (patents, library, timeline, threats,
 *      compliance, migrate-catalog, industry-landscape) — see EMPTIED_SOURCES.
 *
 * This check diffs HEAD against the base branch (origin/main on a PR) and
 * BLOCKS on any class. Intentional drops are opt-in via the allowlist at
 * scripts/ci/data-regression-allowlist.json:
 *
 *   {
 *     "complianceRecordDropOk": false,
 *     "vendorAlgoEmptyOk": ["VND-999"],  // vendor ids allowed to go empty
 *     "patentsEmptiedOk": {              // one dated waiver per column
 *       "quantum_notes": { "expectedEmptied": 54, "reason": "...", "until": "2026-10-01" }
 *     },
 *     "emptiedOk": {                     // same shape, per other source id
 *       "library": { "<column>": { "expectedEmptied": 0, "reason": "...", "until": "..." } }
 *     }
 *   }
 *
 * No network. Deterministic. Skips gracefully (exit 0 + warning) if the base
 * ref can't be resolved (e.g. a shallow checkout), so it never false-reds.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'

const ROOT = process.cwd()
const COMPLIANCE = 'public/data/compliance-data.json'
const ENRICH_DIR = 'src/data/doc-enrichments'
const ALLOWLIST = 'scripts/ci/data-regression-allowlist.json'

const baseRef = process.env.GITHUB_BASE_REF
  ? `origin/${process.env.GITHUB_BASE_REF}`
  : 'origin/main'

function showFromBase(path: string): string | null {
  try {
    return execSync(`git show ${baseRef}:${path}`, {
      encoding: 'utf8',
      maxBuffer: 256 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'ignore'],
    })
  } catch {
    return null
  }
}

function lsBase(dir: string): string[] {
  try {
    return execSync(`git ls-tree --name-only ${baseRef}:${dir}`, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean)
  } catch {
    return []
  }
}

/**
 * `complianceRecordDropOk` accepts a boolean OR a dated, exact-count waiver.
 *
 * The boolean is a kill switch: once true, every future drop passes silently,
 * including an accidental one. The object form is a waiver for ONE known
 * change — it passes only when the drop count matches `expectedDrop` exactly
 * and `until` has not passed, so a different drop of a different size still
 * fails, and the waiver expires instead of becoming permanent.
 */
type DropWaiver = { expectedDrop: number; reason: string; until: string }
type EmptiedWaiver = { expectedEmptied: number; reason: string; until: string }
type Allowlist = {
  complianceRecordDropOk?: boolean | DropWaiver
  vendorAlgoEmptyOk?: string[]
  // one dated waiver per column with the exact expected count (Check 3)
  patentsEmptiedOk?: Record<string, EmptiedWaiver>
  // same shape, keyed by source id (library, timeline, threats, compliance,
  // migrate-catalog, industry-landscape)
  emptiedOk?: Record<string, Record<string, EmptiedWaiver>>
}
const allow: Allowlist = existsSync(join(ROOT, ALLOWLIST))
  ? JSON.parse(readFileSync(join(ROOT, ALLOWLIST), 'utf8'))
  : {}
const algoEmptyOk = new Set(allow.vendorAlgoEmptyOk ?? [])

const failures: string[] = []

// ── Check 1: compliance-data.json record count must not drop ───────────────
function complianceIds(raw: string): Set<string> {
  const arr = JSON.parse(raw) as Array<{ id?: string }>
  return new Set(arr.map((r) => r.id).filter((x): x is string => !!x))
}
{
  const baseRaw = showFromBase(COMPLIANCE)
  if (baseRaw === null) {
    console.warn(`⚠  could not read ${COMPLIANCE} from ${baseRef} — skipping count check`)
  } else if (existsSync(join(ROOT, COMPLIANCE))) {
    const headIds = complianceIds(readFileSync(join(ROOT, COMPLIANCE), 'utf8'))
    const baseIds = complianceIds(baseRaw)
    const dropped = [...baseIds].filter((id) => !headIds.has(id))
    const waiver = allow.complianceRecordDropOk
    let dropAllowed = waiver === true
    if (waiver && typeof waiver === 'object') {
      const today = new Date().toISOString().slice(0, 10)
      if (waiver.until < today) {
        failures.push(
          `compliance-data.json drop waiver expired on ${waiver.until} — remove it from ${ALLOWLIST} ` +
            `now that the change it covered ("${waiver.reason}") has landed`
        )
      } else if (dropped.length !== waiver.expectedDrop) {
        failures.push(
          `compliance-data.json drops ${dropped.length} record(s), but the waiver in ${ALLOWLIST} ` +
            `expects exactly ${waiver.expectedDrop} ("${waiver.reason}"). A different drop is not covered.`
        )
      } else {
        dropAllowed = true
        console.log(
          `✓ compliance-data.json: ${dropped.length} drops match the waiver ("${waiver.reason}", expires ${waiver.until})`
        )
      }
    }
    if (dropped.length > 0 && !dropAllowed) {
      failures.push(
        `compliance-data.json drops ${dropped.length} record(s) present on ${baseRef}: ` +
          dropped.slice(0, 15).join(', ') +
          (dropped.length > 15 ? ` … +${dropped.length - 15} more` : '') +
          `\n     → if intentional, add a dated waiver to ${ALLOWLIST}:` +
          `\n       "complianceRecordDropOk": { "expectedDrop": ${dropped.length}, "reason": "...", "until": "YYYY-MM-DD" }`
      )
    } else if (dropped.length === 0) {
      console.log(
        `✓ compliance-data.json: ${headIds.size} records (base ${baseIds.size}); 0 unexplained drops`
      )
    }
  }
}

// ── Check 1b: certificate scheme attribution must not regress ──────────────
// ADDED 2026-07-31 (remediation WP-3.1). The issuing certification scheme was
// carried for every Common Criteria record since the scraper was written, but
// only inside the `vendor` display string as "Manufacturer (Scheme: XX)" —
// real data in a place nothing could query. It now has its own `scheme` /
// `schemeCountry` fields.
//
// The specific regression this guards: a future scraper change (or a partial
// re-scrape) silently reverting to the concatenated form, or dropping the
// field. Both would look like a successful run — the record COUNT would be
// unchanged, so Check 1 above would pass — while quietly removing per-country
// certification attribution again. Counting non-empty `scheme` catches it;
// asserting no vendor string carries the suffix catches the revert directly.
function schemeStats(raw: string): { withScheme: number; suffixed: number } {
  const arr = JSON.parse(raw) as Array<{ scheme?: string; vendor?: string }>
  return {
    withScheme: arr.filter((r) => (r.scheme ?? '').trim() !== '').length,
    suffixed: arr.filter((r) => /\(Scheme:/.test(r.vendor ?? '')).length,
  }
}
{
  const baseRaw = showFromBase(COMPLIANCE)
  if (baseRaw !== null && existsSync(join(ROOT, COMPLIANCE))) {
    const head = schemeStats(readFileSync(join(ROOT, COMPLIANCE), 'utf8'))
    const base = schemeStats(baseRaw)
    // A waiver covering a record DROP also covers the fall in scheme-carrying
    // records, because removing duplicate records removes their scheme copies
    // too. But it must NOT excuse a certificate losing its scheme.
    //
    // The honest test is PER SOURCE, not global: de-duplicating a scheme-rich
    // source (Common Criteria) lowers the global share by arithmetic alone,
    // while genuine attribution loss shows up as a source whose own share of
    // scheme-carrying records fell. CC was 1768/1768 before this migration and
    // is 889/889 after — 100% either way — so nothing lost its attribution.
    const shareBySource = (raw: string): Map<string, number> => {
      const arr = JSON.parse(raw) as Array<{ scheme?: string; source?: string }>
      const total = new Map<string, number>()
      const withScheme = new Map<string, number>()
      for (const r of arr) {
        const src = r.source ?? 'unknown'
        total.set(src, (total.get(src) ?? 0) + 1)
        if ((r.scheme ?? '').trim() !== '') withScheme.set(src, (withScheme.get(src) ?? 0) + 1)
      }
      const out = new Map<string, number>()
      for (const [src, n] of total) out.set(src, (withScheme.get(src) ?? 0) / n)
      return out
    }
    const dropWaived =
      allow.complianceRecordDropOk === true ||
      (allow.complianceRecordDropOk &&
        typeof allow.complianceRecordDropOk === 'object' &&
        allow.complianceRecordDropOk.until >= new Date().toISOString().slice(0, 10))
    const headShare = shareBySource(readFileSync(join(ROOT, COMPLIANCE), 'utf8'))
    const baseShare = shareBySource(baseRaw)
    const regressed = [...baseShare.entries()]
      .filter(([src, share]) => (headShare.get(src) ?? 0) + 1e-9 < share)
      .map(([src, share]) => `${src} ${share.toFixed(3)} → ${(headShare.get(src) ?? 0).toFixed(3)}`)

    if (head.withScheme < base.withScheme && !(dropWaived && regressed.length === 0)) {
      failures.push(
        `compliance-data.json: records with a queryable \`scheme\` dropped ` +
          `${base.withScheme} → ${head.withScheme}. The issuing certification ` +
          `scheme is what makes per-country certification coverage answerable; ` +
          `losing it is silent because the record count is unaffected.` +
          (regressed.length > 0
            ? ` Sources whose OWN share of scheme-carrying records fell: ${regressed.join('; ')}.`
            : '')
      )
    } else if (head.suffixed > 0) {
      failures.push(
        `compliance-data.json: ${head.suffixed} record(s) carry the issuing ` +
          `scheme inside the \`vendor\` string as "(Scheme: XX)". That form was ` +
          `retired 2026-07-31 — it hides queryable data in a display field and ` +
          `splits one manufacturer into one identity per scheme. Set ` +
          `record.scheme instead (see scripts/scrapers/cc.ts).`
      )
    } else {
      console.log(
        `✓ compliance-data.json: ${head.withScheme} records carry a queryable scheme ` +
          `(base ${base.withScheme}); 0 vendor strings carry the retired suffix`
      )
    }
  }
}

// ── Check 2: vendor roadmap algorithms must not go non-empty → empty ────────
// Mirrors src/data/vendorRoadmapEnrichmentData.ts: parse every dated md file,
// merge last-file-wins by sorted filename, key by Vendor ID.
function buildAlgoMap(read: (file: string) => string, files: string[]): Map<string, string[]> {
  const map = new Map<string, string[]>()
  for (const file of [...files].sort()) {
    const raw = read(file)
    if (!raw) continue
    const sections = raw.split(/\n(?=## VND-)/).filter((s) => s.includes('**Vendor ID**'))
    for (const sec of sections) {
      const id = sec.match(/\*\*Vendor ID\*\*:\s*(.+)$/m)?.[1]?.trim()
      if (!id) continue
      const algoRaw = sec.match(/\*\*PQC Algorithms Announced\*\*:\s*(.+)$/m)?.[1]?.trim() ?? ''
      const algos =
        !algoRaw || algoRaw === 'None detected'
          ? []
          : algoRaw
              .split(';')
              .map((s) => s.trim())
              .filter(Boolean)
      map.set(id, algos)
    }
  }
  return map
}
{
  const baseFiles = lsBase(ENRICH_DIR).filter((f) => /vendor_roadmap_enrichments_.*\.md$/.test(f))
  const headFiles = existsSync(join(ROOT, ENRICH_DIR))
    ? readdirSync(join(ROOT, ENRICH_DIR)).filter((f) =>
        /vendor_roadmap_enrichments_.*\.md$/.test(f)
      )
    : []
  if (baseFiles.length === 0) {
    console.warn(`⚠  no roadmap enrichment files on ${baseRef} — skipping algo-regression check`)
  } else {
    const baseMap = buildAlgoMap((f) => showFromBase(`${ENRICH_DIR}/${f}`) ?? '', baseFiles)
    const headMap = buildAlgoMap((f) => readFileSync(join(ROOT, ENRICH_DIR, f), 'utf8'), headFiles)
    const regressed: string[] = []
    for (const [id, baseAlgos] of baseMap) {
      const headAlgos = headMap.get(id)
      if (baseAlgos.length > 0 && headAlgos && headAlgos.length === 0 && !algoEmptyOk.has(id)) {
        regressed.push(`${id} (${baseAlgos.join(', ')} → empty)`)
      }
    }
    if (regressed.length > 0) {
      failures.push(
        `vendor roadmap: ${regressed.length} vendor(s) lost all PQC algorithms vs ${baseRef}:\n     ` +
          regressed.join('\n     ') +
          `\n     → if intentional, add the vendor id(s) to "vendorAlgoEmptyOk" in ${ALLOWLIST}`
      )
    } else {
      console.log(`✓ vendor roadmap: no vendor regressed non-empty → empty algorithms`)
    }
  }
}

// ── Check 3: a source's column must not go populated → empty across its page ─
// Compares the newest <prefix>_MMDDYYYY[_rN].csv on HEAD with the newest on the
// base ref, row by row over the rows both files show (status ≠ deprecated). A
// single row emptied is a correction; a column emptied on more than EMPTIED_MAX
// of those rows is a reader that lost its input. Empty means '', '[]' or the
// enricher's own "uncertain" fallback 'none' (enrich_patents.py returns 'none'
// or an empty list when it cannot tell), so a wipe cannot hide behind the
// fallback value.
//
// Added 2026-09-22. The 09-18 patents re-read that wrote `[]` into
// claim_dependencies for 607 of 729 rows passed every truth check because
// nothing measured coverage; library, timeline, threats, compliance, the
// migrate catalog and industry-landscape had no such guard at all, so a re-run
// of any of them that writes LESS passes on truth alone (extraction-audit-
// 09212026 §5). Same rule, one table.
const EMPTIED_DATA_DIR = 'src/data'
const EMPTIED_MAX = 0.05
type EmptiedSource = { id: string; prefix: string; idColumn: string; skip: string[] }
const EMPTIED_SOURCES: EmptiedSource[] = [
  { id: 'patents', prefix: 'patents', idColumn: 'patent_number', skip: ['title'] },
  { id: 'library', prefix: 'library', idColumn: 'reference_id', skip: ['document_title'] },
  { id: 'timeline', prefix: 'timeline', idColumn: 'event_id', skip: [] },
  { id: 'threats', prefix: 'quantum_threats_hsm_industries', idColumn: 'threat_id', skip: [] },
  { id: 'compliance', prefix: 'compliance', idColumn: 'id', skip: ['label'] },
  {
    id: 'migrate-catalog',
    prefix: 'pqc_product_catalog',
    idColumn: 'product_id',
    skip: ['software_name'],
  },
  { id: 'industry-landscape', prefix: 'industry_landscape', idColumn: 'use_case_id', skip: [] },
]
// never scored: the row's identity and the self-containment status columns
const EMPTIED_ALWAYS_SKIP = new Set(['status', 'deprecated_at', 'deprecated_reason'])

function latestDated(files: string[], prefix: string): string | null {
  const re = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const dated = files
    .map((f) => ({ f, m: f.match(re) }))
    .filter((x): x is { f: string; m: RegExpMatchArray } => x.m !== null)
    .map(({ f, m }) => ({ f, key: `${m[3]}${m[1]}${m[2]}`, r: Number(m[4] ?? 0) }))
    .sort((a, b) => (a.key === b.key ? a.r - b.r : a.key < b.key ? -1 : 1))
  return dated.length ? dated[dated.length - 1].f : null
}
function shownRows(raw: string, idColumn: string): Map<string, Record<string, string>> {
  const parsed = Papa.parse<Record<string, string>>(raw, { header: true, skipEmptyLines: true })
  const out = new Map<string, Record<string, string>>()
  for (const row of parsed.data) {
    if ((row.status ?? '').trim() === 'deprecated') continue
    const id = (row[idColumn] ?? '').trim()
    if (id) out.set(id, row)
  }
  return out
}
const isEmptyValue = (v: string | undefined): boolean => {
  const t = (v ?? '').trim()
  return t === '' || t === '[]' || t === 'none'
}
for (const src of EMPTIED_SOURCES) {
  // patents keeps its original allowlist key; every other source uses emptiedOk.<id>
  const waivers: Record<string, EmptiedWaiver> =
    src.id === 'patents' ? (allow.patentsEmptiedOk ?? {}) : (allow.emptiedOk?.[src.id] ?? {})
  const waiverKey = src.id === 'patents' ? 'patentsEmptiedOk' : `emptiedOk.${src.id}`
  const baseFile = latestDated(lsBase(EMPTIED_DATA_DIR), src.prefix)
  const headFile = existsSync(join(ROOT, EMPTIED_DATA_DIR))
    ? latestDated(readdirSync(join(ROOT, EMPTIED_DATA_DIR)), src.prefix)
    : null
  if (!baseFile || !headFile) {
    console.warn(
      `⚠  no ${src.prefix}_*.csv on ${baseRef} or HEAD — skipping ${src.id} emptied-column check`
    )
    continue
  }
  if (baseFile === headFile) {
    console.log(`✓ ${src.id}: ${headFile} unchanged vs ${baseRef}`)
    continue
  }
  const base = shownRows(showFromBase(`${EMPTIED_DATA_DIR}/${baseFile}`) ?? '', src.idColumn)
  const head = shownRows(readFileSync(join(ROOT, EMPTIED_DATA_DIR, headFile), 'utf8'), src.idColumn)
  const shared = [...base.keys()].filter((id) => head.has(id))
  const skip = new Set([...EMPTIED_ALWAYS_SKIP, src.idColumn, ...src.skip])
  const columns = Object.keys(head.values().next().value ?? {}).filter((c) => !skip.has(c))
  const today = new Date().toISOString().slice(0, 10)
  const wiped: string[] = []
  for (const col of columns) {
    let emptied = 0
    for (const id of shared) {
      if (!isEmptyValue(base.get(id)![col]) && isEmptyValue(head.get(id)![col])) emptied++
    }
    if (emptied === 0 || emptied <= Math.max(5, Math.floor(shared.length * EMPTIED_MAX))) continue
    const waiver = waivers[col]
    if (waiver && waiver.expectedEmptied === emptied && waiver.until >= today) {
      console.log(
        `✓ ${src.id}: ${col} emptied on ${emptied} rows — waived until ${waiver.until} (${waiver.reason})`
      )
      continue
    }
    wiped.push(`${col}: populated → empty on ${emptied} of ${shared.length} shown rows`)
  }
  if (wiped.length > 0) {
    failures.push(
      `${src.id}: ${headFile} vs ${baseFile} (${baseRef}) empties whole columns:\n     ` +
        wiped.join('\n     ') +
        `\n     → a re-read whose reader lost its input looks exactly like this; if intentional, add a dated` +
        ` waiver per column to "${waiverKey}" in ${ALLOWLIST} with the exact count`
    )
  } else {
    console.log(`✓ ${src.id}: ${headFile} vs ${baseFile}: no column emptied across the shown rows`)
  }
}

if (failures.length > 0) {
  console.error('\n✗ data regression guardrail FAILED:\n')
  for (const f of failures) console.error('  • ' + f + '\n')
  process.exit(1)
}
console.log('\n✓ data regression guardrail passed')
