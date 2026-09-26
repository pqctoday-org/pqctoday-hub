// SPDX-License-Identifier: GPL-3.0-only
/**
 * generate-coverage-matrix — join the per-engine capability inventory to the
 * registered test evidence (plan WS-C C-1..C-6, J-7) and run the coverage-diff
 * gate (C-5).
 *
 *   npx tsx scripts/generate-coverage-matrix.ts           # (re)write every output
 *   npx tsx scripts/generate-coverage-matrix.ts --check   # gate: exit 1 on any error or stale output
 *   npx tsx scripts/generate-coverage-matrix.ts --print-baseline-waivers
 *        # print a waiver file covering today's untested cells (for human review)
 *
 * Input overrides (used by the sabotage proof, never by the gate itself):
 *   --inventory <path>  --capability-map <path>  --waivers <path>  --open-gaps <path>
 *   --run-results <dir>
 *
 * Outputs (deterministic — no timestamps):
 *   src/data/validation/coverage-matrix.generated.json   canonical, read by tests
 *   public/data/validation/coverage-matrix.json          same bytes, fetched by the public page
 *   public/data/validation/coverage-matrix.md            human-readable summary
 *   public/data/validation/coverage-matrix.html          standalone static page (no scripts)
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildCoverageMatrix,
  compactMatrix,
  ENGINES,
  serializeMatrixFile,
  type CapabilityMap,
  type CaseParams,
  type InventoryFile,
  type ManifestCaseInfo,
  type MatrixInputs,
  type OpenGapFile,
  type RunResult,
  type RunResultSource,
  type Waiver,
  type WaiverFile,
} from '../src/data/validation/coverageModel'
import { renderCoverageHtml, renderCoverageMarkdown } from '../src/data/validation/coverageExport'
import { TEST_REGISTRY } from '../src/data/validation/testRegistry'
import { VALIDATION_DISCLAIMER } from '../src/data/validationDisclaimer'
import {
  effectiveCase,
  type ValidationCaseManifest,
} from '../src/data/validation/validationCaseManifest'

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')

export const MATRIX_REL = 'src/data/validation/coverage-matrix.generated.json'
export const PUBLIC_DIR_REL = 'public/data/validation'
const DEFAULTS = {
  inventory: 'src/data/validation/mechanism-inventory.generated.json',
  capabilityMap: 'src/data/validation/capability-map.json',
  manifest: 'src/data/validation/vector-manifest.json',
  waivers: 'src/data/validation/coverage-waivers.json',
  openGaps: 'src/data/validation/open-gaps.json',
  runResults: 'src/data/validation/run-results',
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex')

export function manifestCaseIndex(manifest: ValidationCaseManifest): Map<string, ManifestCaseInfo> {
  const out = new Map<string, ManifestCaseInfo>()
  for (const f of manifest.files) {
    for (const c of f.cases) {
      const eff = effectiveCase(f, c)
      out.set(c.caseId, {
        evidenceClass: eff.evidenceClass,
        status: eff.status,
        expectation: c.expectation,
        parameters: c.parameters as CaseParams,
        testType: c.testType,
      })
    }
  }
  return out
}

/** Shape of a committed run-results file (src/data/validation/run-results/*.json). */
export interface RunResultsFile {
  schema: 'pqctoday.run-results/v1'
  runner: string
  artifactKind: RunResult['artifactKind']
  host: string
  environment: Record<string, string>
  hubCommit: string
  recordedAt: string
  results: RunResult[]
}

function readRunResults(dirRel: string): { results: RunResult[]; sources: RunResultSource[] } {
  const dir = path.resolve(ROOT, dirRel)
  const results: RunResult[] = []
  const sources: RunResultSource[] = []
  if (!fs.existsSync(dir)) return { results, sources }
  for (const f of fs.readdirSync(dir).sort()) {
    if (!f.endsWith('.json')) continue
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as RunResultsFile
    if (data.schema !== 'pqctoday.run-results/v1')
      throw new Error(`${f}: unknown run-results schema`)
    results.push(...data.results)
    sources.push({
      file: path.relative(ROOT, path.join(dir, f)),
      runner: data.runner,
      artifactKind: data.artifactKind,
      host: data.host,
      environment: data.environment,
      hubCommit: data.hubCommit,
      recordedAt: data.recordedAt,
      results: data.results.length,
    })
  }
  return { results, sources }
}

export interface LoadOptions {
  inventory?: string
  capabilityMap?: string
  waivers?: string
  openGaps?: string
  runResults?: string
}

export function loadInputs(opts: LoadOptions = {}): MatrixInputs {
  const p = { ...DEFAULTS, ...Object.fromEntries(Object.entries(opts).filter(([, v]) => v)) }
  const inventoryText = fs.readFileSync(path.resolve(ROOT, p.inventory), 'utf8')
  const capText = fs.readFileSync(path.resolve(ROOT, p.capabilityMap), 'utf8')
  const manifestText = fs.readFileSync(path.resolve(ROOT, p.manifest), 'utf8')
  const waiversText = fs.readFileSync(path.resolve(ROOT, p.waivers), 'utf8')
  const gapsText = fs.readFileSync(path.resolve(ROOT, p.openGaps), 'utf8')
  const manifest = JSON.parse(manifestText) as ValidationCaseManifest
  const rel = (abs: string) => path.relative(ROOT, path.resolve(ROOT, abs))
  const run = readRunResults(p.runResults)
  return {
    inventory: JSON.parse(inventoryText) as InventoryFile,
    capabilityMap: JSON.parse(capText) as CapabilityMap,
    registry: TEST_REGISTRY,
    manifestCases: manifestCaseIndex(manifest),
    waivers: JSON.parse(waiversText) as WaiverFile,
    openGaps: JSON.parse(gapsText) as OpenGapFile,
    runResults: run.results,
    runResultSources: run.sources,
    inputIds: {
      [rel(p.inventory)]: sha256(inventoryText),
      [rel(p.capabilityMap)]: sha256(capText),
      [rel(p.manifest)]: sha256(manifestText),
      [rel(p.waivers)]: sha256(waiversText),
      [rel(p.openGaps)]: sha256(gapsText),
      'src/data/validation/testRegistry.ts': sha256(
        JSON.stringify(TEST_REGISTRY.map((t) => [t.id, t.engines, t.cases]))
      ),
    },
  }
}

/**
 * Insert the §2.2 disclaimer as a top-level `$disclaimer` key, immediately
 * after the generated-file `$comment`. A string edit rather than a model field:
 * `CoverageMatrixFile` is `CoverageMatrix` minus its row arrays, so a new field
 * there would ripple through the whole coverage model for a constant that is
 * not data.
 */
export function withMatrixDisclaimer(json: string): string {
  if (json.includes(VALIDATION_DISCLAIMER)) return json
  const marker = '\n  "schema":'
  const i = json.indexOf(marker)
  if (i < 0) throw new Error('coverage matrix JSON has no "schema" key to anchor $disclaimer to')
  return (
    json.slice(0, i) +
    `\n  "$disclaimer": ${JSON.stringify(VALIDATION_DISCLAIMER)},` +
    json.slice(i)
  )
}

/** Outputs are written in a stable, diff-friendly form and listed in .prettierignore. */
export function renderOutputs(inputs: MatrixInputs) {
  const { matrix, gate } = buildCoverageMatrix(inputs)
  // The machine-readable export carries the §2.2 disclaimer too. Until
  // 2026-09-26 only the .md and .html did — release-evidence check #4 iterated
  // ['md','html'] — so the one export a consumer is most likely to ingest
  // programmatically carried no disclaimer of any kind. Injected as a top-level
  // `$disclaimer` next to `$comment` so the row/case serialization (and its
  // byte-for-byte --check contract) is untouched.
  const json = withMatrixDisclaimer(serializeMatrixFile(compactMatrix(matrix)))
  const md = renderCoverageMarkdown(matrix)
  const html = renderCoverageHtml(matrix) + '\n'
  const files: Record<string, string> = {
    [MATRIX_REL]: json,
    [`${PUBLIC_DIR_REL}/coverage-matrix.json`]: json,
    [`${PUBLIC_DIR_REL}/coverage-matrix.md`]: md,
    [`${PUBLIC_DIR_REL}/coverage-matrix.html`]: html,
  }
  return { matrix, gate, files }
}

/** Waiver file covering every advertised cell that has no registered test today. */
export function baselineWaivers(inputs: MatrixInputs, date: string): WaiverFile {
  const { matrix } = buildCoverageMatrix({
    ...inputs,
    waivers: { schema: inputs.waivers.schema, waivers: [] },
  })
  const byMech = new Map<string, Map<string, Set<string>>>()
  for (const r of matrix.rows) {
    if (!r.mechanism) continue
    for (const e of ENGINES) {
      if (r.engines[e].level !== 'untested') continue // eslint-disable-line security/detect-object-injection
      const cell = `${r.operation}|${r.parameterSet}|${r.variant}`
      const m = byMech.get(r.mechanism) ?? new Map<string, Set<string>>()
      const engines = m.get(cell) ?? new Set<string>()
      engines.add(e)
      m.set(cell, engines)
      byMech.set(r.mechanism, m)
    }
  }
  const waivers: Waiver[] = []
  for (const [mechanism, cells] of byMech) {
    // Group cells by the exact engine set so every entry is an exact cross product.
    const byEngines = new Map<string, string[]>()
    for (const [cell, engines] of cells) {
      const k = [...engines].sort().join('+')
      byEngines.set(k, [...(byEngines.get(k) ?? []), cell])
    }
    for (const [k, list] of byEngines) {
      waivers.push({
        id: `baseline-${mechanism}${byEngines.size > 1 ? `-${k}` : ''}`,
        mechanism,
        engines: k.split('+') as Waiver['engines'],
        cells: list,
        reason:
          'Advertised and without any registered test at the WS-C baseline. Recorded so that the gate fails on NEW untested capabilities; this is not an approval — it awaits review (plan J-5) and is tracked in the open-gaps register.',
        owner: 'unassigned',
        date,
        status: 'baseline-pending-review',
      })
    }
  }
  return { schema: 'pqctoday.coverage-waivers/v1', waivers }
}

function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag)
  return i >= 0 ? process.argv[i + 1] : undefined
}

async function main(): Promise<void> {
  const inputs = loadInputs({
    inventory: argValue('--inventory'),
    capabilityMap: argValue('--capability-map'),
    waivers: argValue('--waivers'),
    openGaps: argValue('--open-gaps'),
    runResults: argValue('--run-results'),
  })

  if (process.argv.includes('--print-baseline-waivers')) {
    const date = argValue('--date') ?? new Date().toISOString().slice(0, 10)
    process.stdout.write(JSON.stringify(baselineWaivers(inputs, date), null, 2) + '\n')
    return
  }

  const { matrix, gate, files } = renderOutputs(inputs)
  for (const w of gate.warnings) console.warn(`[gen:coverage-matrix] warning: ${w}`)
  const check = process.argv.includes('--check')
  if (gate.errors.length > 0) {
    for (const e of gate.errors.slice(0, 50)) console.error(`[gen:coverage-matrix] ✗ ${e}`)
    if (gate.errors.length > 50)
      console.error(`[gen:coverage-matrix] … ${gate.errors.length - 50} more`)
    console.error(`[gen:coverage-matrix] FAILED — ${gate.errors.length} error(s)`)
    process.exit(1)
  }
  if (check) {
    const stale = Object.entries(files).filter(([rel, text]) => {
      const abs = path.join(ROOT, rel)
      return !fs.existsSync(abs) || fs.readFileSync(abs, 'utf8') !== text
    })
    if (stale.length > 0) {
      for (const [rel] of stale) console.error(`[gen:coverage-matrix] ✗ ${rel} is stale`)
      console.error('[gen:coverage-matrix] run npm run gen:coverage-matrix and commit the outputs')
      process.exit(1)
    }
  } else {
    for (const [rel, text] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(ROOT, rel)), { recursive: true })
      fs.writeFileSync(path.join(ROOT, rel), text)
    }
  }
  const t = matrix.totals
  for (const e of ENGINES) {
    const et = t.byEngine[e] // eslint-disable-line security/detect-object-injection
    console.warn(
      `[gen:coverage-matrix] ${e}: ${et.advertisedCells} advertised cells (${et.unsupportedCells} unsupported) — overall covered ${et.overall.covered}, sampled ${et.overall.sampled}, untested ${et.overall.untested}`
    )
  }
  console.warn(
    `[gen:coverage-matrix] ${check ? 'OK — outputs current, gate passed' : 'wrote outputs'} (${t.rows} rows, ${matrix.cases.length} registered cases, ${t.waivers.waivedCells} waived cells of which ${t.waivers.pendingReviewCells} pending review)`
  )
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e: unknown) => {
    console.error(e instanceof Error ? (e.stack ?? e.message) : e)
    process.exit(1)
  })
}
