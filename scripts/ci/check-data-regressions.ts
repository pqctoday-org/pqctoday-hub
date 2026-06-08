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
 * This check diffs HEAD against the base branch (origin/main on a PR) and
 * BLOCKS on either class. Intentional drops are opt-in via the allowlist at
 * scripts/ci/data-regression-allowlist.json:
 *
 *   {
 *     "complianceRecordDropOk": false,
 *     "vendorAlgoEmptyOk": ["VND-999"]   // vendor ids allowed to go empty
 *   }
 *
 * No network. Deterministic. Skips gracefully (exit 0 + warning) if the base
 * ref can't be resolved (e.g. a shallow checkout), so it never false-reds.
 */
import { execSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

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

type Allowlist = { complianceRecordDropOk?: boolean; vendorAlgoEmptyOk?: string[] }
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
    if (dropped.length > 0 && !allow.complianceRecordDropOk) {
      failures.push(
        `compliance-data.json drops ${dropped.length} record(s) present on ${baseRef}: ` +
          dropped.slice(0, 15).join(', ') +
          (dropped.length > 15 ? ` … +${dropped.length - 15} more` : '') +
          `\n     → if intentional, set "complianceRecordDropOk": true in ${ALLOWLIST}`
      )
    } else {
      console.log(
        `✓ compliance-data.json: ${headIds.size} records (base ${baseIds.size}); 0 unexplained drops`
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

if (failures.length > 0) {
  console.error('\n✗ data regression guardrail FAILED:\n')
  for (const f of failures) console.error('  • ' + f + '\n')
  process.exit(1)
}
console.log('\n✓ data regression guardrail passed')
