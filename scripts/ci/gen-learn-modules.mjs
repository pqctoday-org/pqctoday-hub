// SPDX-License-Identifier: AGPL-3.0-only
/**
 * gen-learn-modules — derive the typed Learn-lesson records from the newest
 * dated lessons CSV (src/data/learn_modules_*.csv, latest date wins) and write
 *
 *   - src/data/generated/learnModules.generated.ts   (typed records)
 *   - src/data/generated/niceStatementText.generated.ts  (the official wording of the
 *     NICE statements the lessons teach or practise; loaded on demand, never in the main bundle)
 *   - public/embed/manifest.json  (the `resources.modules` list only)
 *
 * Every organising field of a lesson (title, description, minutes, level,
 * track, order, stage, framework phase, NICE mapping, playground tool,
 * taxonomy, content version, route-meta overrides, short labels) lives once in
 * the CSV. Lists are `;`-separated. Track, level, phase and NICE ids are typed
 * as the existing TypeScript unions, so a bad value fails `tsc`.
 *
 *   node scripts/ci/gen-learn-modules.mjs           # (re)generate
 *   node scripts/ci/gen-learn-modules.mjs --check   # exit 1 if stale (CI gate)
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import prettier from 'prettier'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const DATA = join(ROOT, 'src', 'data')
const OUT = join(DATA, 'generated', 'learnModules.generated.ts')
const NICE_OUT = join(DATA, 'generated', 'niceStatementText.generated.ts')
const NICE_COMPONENTS = join(ROOT, 'pqc-references', 'NICE-Framework-Components-v2.2.0.json')
const EMBED = join(ROOT, 'public', 'embed', 'manifest.json')

const COLUMNS = [
  'module_id',
  'lm_id',
  'title',
  'description',
  'duration_min',
  'difficulty',
  'track',
  'track_order',
  'stage',
  'stage_name',
  'take_first',
  'framework_phase',
  'nice_tier',
  'nice_order',
  'nice_competency_areas',
  'nice_official_areas_extra',
  'nice_work_roles',
  'is_common_ground',
  'playground_tool',
  'taxonomy_algorithms',
  'taxonomy_standards',
  'content_version',
  'work_in_progress',
  'seo_title',
  'seo_description',
  'seo_name',
  'quiz_label',
  'short_label',
  'nice_statements_taught',
  'nice_statements_practised',
  'nice_statements_mentioned',
  'nice_read',
]

// Latest dated lessons CSV (learn_modules_MMDDYYYY[_rN].csv).
function latestCsv() {
  const re = /^learn_modules_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  let best = null
  for (const file of readdirSync(DATA)) {
    const m = file.match(re)
    if (!m) continue
    const key = `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}`
    if (!best || key > best.key) best = { key, file }
  }
  if (!best) throw new Error('no learn_modules_*.csv found')
  return best.file
}

const list = (value) =>
  value
    ? value
        .split(';')
        .map((item) => item.trim())
        .filter(Boolean)
    : []
const text = (value) => (value === '' ? undefined : value)
const int = (value) => (value === '' ? undefined : Number(value))
const bool = (value) => (value === '' ? undefined : value === 'true')
const STATEMENT_ID = /^[KST]\d{4}$/
const statements = (row, column) => {
  const ids = list(row[column])
  for (const id of ids) {
    if (!STATEMENT_ID.test(id)) throw new Error(`${row.module_id}: bad ${column} id "${id}"`)
  }
  if (new Set(ids).size !== ids.length)
    throw new Error(`${row.module_id}: repeated id in ${column}`)
  return ids
}
const yesNo = (row, column) => {
  if (row[column] !== 'yes' && row[column] !== 'no') {
    throw new Error(`${row.module_id}: ${column} must be yes or no, got "${row[column]}"`)
  }
  return row[column] === 'yes'
}

function load() {
  const file = latestCsv()
  const parsed = Papa.parse(readFileSync(join(DATA, file), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  })
  if ((parsed.meta.fields ?? []).join(',') !== COLUMNS.join(',')) {
    throw new Error(`unexpected ${file} headers`)
  }
  const seen = new Set()
  const rows = parsed.data.map((row) => {
    if (!row.module_id || seen.has(row.module_id)) {
      throw new Error(`duplicate or blank module_id: ${row.module_id}`)
    }
    seen.add(row.module_id)
    const durationMin = Number(row.duration_min)
    if (!Number.isInteger(durationMin) || durationMin <= 0) {
      throw new Error(`${row.module_id}: bad duration_min "${row.duration_min}"`)
    }
    const niceStatementsTaught = statements(row, 'nice_statements_taught')
    const niceStatementsPractised = statements(row, 'nice_statements_practised')
    const niceStatementsMentioned = statements(row, 'nice_statements_mentioned')
    const niceRead = yesNo(row, 'nice_read')
    const everyId = [
      ...niceStatementsTaught,
      ...niceStatementsPractised,
      ...niceStatementsMentioned,
    ]
    if (new Set(everyId).size !== everyId.length) {
      throw new Error(
        `${row.module_id}: a NICE statement is listed under more than one of taught, practised, mentioned`
      )
    }
    if (!niceRead && everyId.length > 0) {
      throw new Error(`${row.module_id}: nice_read is no but statements are listed`)
    }
    return {
      id: row.module_id,
      lmId: text(row.lm_id),
      title: row.title,
      description: row.description,
      durationMin,
      difficulty: text(row.difficulty),
      track: text(row.track),
      trackOrder: int(row.track_order),
      stage: int(row.stage),
      stageName: text(row.stage_name),
      takeFirst: list(row.take_first),
      frameworkPhase: list(row.framework_phase),
      niceTier: text(row.nice_tier),
      niceOrder: int(row.nice_order),
      niceCompetencyAreas: list(row.nice_competency_areas),
      niceOfficialAreasExtra: list(row.nice_official_areas_extra),
      niceWorkRoles: list(row.nice_work_roles),
      isCommonGround: bool(row.is_common_ground),
      playgroundTool: text(row.playground_tool),
      taxonomyAlgorithms: list(row.taxonomy_algorithms),
      taxonomyStandards: list(row.taxonomy_standards),
      contentVersion: int(row.content_version),
      workInProgress: bool(row.work_in_progress),
      seoTitle: text(row.seo_title),
      seoDescription: text(row.seo_description),
      seoName: text(row.seo_name),
      quizLabel: text(row.quiz_label),
      shortLabel: text(row.short_label),
      niceStatementsTaught,
      niceStatementsPractised,
      niceStatementsMentioned,
      niceRead,
    }
  })
  return { file, rows }
}

function generate({ file, rows }) {
  const tracks = [...new Set(rows.map((r) => r.track).filter(Boolean))]
    .map((t) => JSON.stringify(t))
    .join(' | ')
  return `// SPDX-License-Identifier: AGPL-3.0-only
// GENERATED by scripts/ci/gen-learn-modules.mjs from ${file} — DO NOT EDIT BY HAND.
import type { PhaseId } from '@/data/frameworkPhases'
import type {
  NiceCompetencyAreaId,
  NiceProficiencyTier,
  NiceWorkRoleId,
  NfComId,
} from '@/data/niceFramework'

export type LearnTrack = ${tracks}
export type LearnDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface LearnModuleRecord {
  id: string
  lmId?: string
  title: string
  description: string
  durationMin: number
  difficulty?: LearnDifficulty
  track?: LearnTrack
  trackOrder?: number
  stage?: number
  stageName?: string
  takeFirst: readonly string[]
  frameworkPhase: readonly PhaseId[]
  niceTier?: NiceProficiencyTier
  /** position in the NICE mapping lists (readers see modules in this order) */
  niceOrder?: number
  niceCompetencyAreas: readonly NiceCompetencyAreaId[]
  niceOfficialAreasExtra: readonly NfComId[]
  niceWorkRoles: readonly NiceWorkRoleId[]
  isCommonGround?: boolean
  playgroundTool?: string
  taxonomyAlgorithms: readonly string[]
  taxonomyStandards: readonly string[]
  contentVersion?: number
  workInProgress?: boolean
  /** Route title where it differs from \`title\`. */
  seoTitle?: string
  /** Route description where it differs from \`description\`. */
  seoDescription?: string
  /** Structured-data name where it differs from \`title\`. */
  seoName?: string
  /** Quiz category label where it differs from \`title\`. */
  quizLabel?: string
  /** Short label for related-page chips where it differs from \`title\`. */
  shortLabel?: string
  /** NICE Framework v2.2.0 statement ids the lesson teaches (K, S or T) */
  niceStatementsTaught: readonly string[]
  /** Statement ids a reader practises in the lesson's Workshop */
  niceStatementsPractised: readonly string[]
  /** Statement ids the lesson only mentions in passing; not shown to readers */
  niceStatementsMentioned: readonly string[]
  /** Whether the lesson text has been read against NICE; false means no coverage claim at all */
  niceRead: boolean
}

export const LEARN_MODULES: readonly LearnModuleRecord[] = ${JSON.stringify(rows, null, 2)} satisfies readonly LearnModuleRecord[]

export const LEARN_MODULE_BY_ID: Readonly<Record<string, LearnModuleRecord>> = Object.fromEntries(
  LEARN_MODULES.map((row) => [row.id, row])
)
`
}

// The official wording of the statements readers see (taught and practised), for the coverage panel.
function niceStatementText(rows) {
  const official = new Map(
    JSON.parse(readFileSync(NICE_COMPONENTS, 'utf8')).elements.map((e) => [
      e.element_identifier,
      e.text,
    ])
  )
  const ids = [
    ...new Set(rows.flatMap((r) => [...r.niceStatementsTaught, ...r.niceStatementsPractised])),
  ].sort()
  const entries = ids.map((id) => {
    const wording = official.get(id)
    if (!wording) throw new Error(`NICE statement ${id} is not in the vendored v2.2.0 components`)
    return [id, wording]
  })
  return `// SPDX-License-Identifier: AGPL-3.0-only
// GENERATED by scripts/ci/gen-learn-modules.mjs from the lessons data file and the vendored
// NICE Framework Components v2.2.0 — DO NOT EDIT BY HAND.
// Wording of the statements the lessons teach or practise. Loaded on demand by the lesson
// coverage panel, so it stays out of the main bundle.

export const NICE_STATEMENT_TEXT: Readonly<Record<string, string>> = ${JSON.stringify(Object.fromEntries(entries), null, 2)}
`
}

// Only the lesson list is generated; the rest of the file is kept byte for byte.
function embed(rows) {
  const current = readFileSync(EMBED, 'utf8')
  const start = current.indexOf('"modules": [')
  const end = current.indexOf('"playgroundTools"')
  if (start < 0 || end < start) throw new Error('embed manifest: modules block not found')
  const modules = rows.map(({ id, title, difficulty, durationMin }) => ({
    id,
    title,
    ...(difficulty ? { difficulty } : {}),
    duration: `${durationMin} min`,
  }))
  const block = JSON.stringify(modules, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')
  return `${current.slice(0, start)}"modules": ${block},\n    ${current.slice(end)}`
}

const derived = load()
const next = await prettier.format(generate(derived), {
  ...(await prettier.resolveConfig(OUT)),
  filepath: OUT,
})
const nextNice = await prettier.format(niceStatementText(derived.rows), {
  ...(await prettier.resolveConfig(NICE_OUT)),
  filepath: NICE_OUT,
})
const nextEmbed = embed(derived.rows)

if (process.argv.includes('--check')) {
  const stale = [
    [OUT, next],
    [NICE_OUT, nextNice],
    [EMBED, nextEmbed],
  ].some(([file, want]) => {
    try {
      return readFileSync(file, 'utf8') !== want
    } catch {
      return true
    }
  })
  if (stale) {
    console.error('learn module generated files are stale — run `npm run gen:learn-modules`')
    process.exit(1)
  }
  console.log('✓ learn module generated files up to date')
} else {
  writeFileSync(OUT, next)
  writeFileSync(NICE_OUT, nextNice)
  writeFileSync(EMBED, nextEmbed)
  console.log(`wrote ${OUT} and ${EMBED} from ${derived.file}`)
}
