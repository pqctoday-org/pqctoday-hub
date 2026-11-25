// SPDX-License-Identifier: AGPL-3.0-only
/**
 * gen-tools — derive the typed tool records from the newest dated tools CSV
 * (src/data/tools_*.csv, latest date wins) and write
 *
 *   - src/data/generated/tools.generated.ts   (typed records)
 *   - public/embed/manifest.json  (the `resources.playgroundTools` and
 *     `resources.businessTools` lists only)
 *
 * Every organising field of a tool (name and number, category, order, level,
 * recommended roles, lesson link, NICE mapping and statements, CSWP.39 placement, framework
 * phase, version) lives once in the CSV. Lists are `;`-separated. Ids, levels,
 * categories, phases, zones, roles and NICE ids are typed as the existing
 * TypeScript unions, so a bad value fails `tsc`. Content (descriptions, intro,
 * icons, keywords, requirements, outputs, components) stays in the registries.
 * A Playground tool that belongs to a lesson reads its NICE tier, competency areas and work roles from that
 * lesson's row in the lessons file (they are not repeated in its own row); sandbox scenarios keep their own.
 *
 *   node scripts/ci/gen-tools.mjs           # (re)generate
 *   node scripts/ci/gen-tools.mjs --check   # exit 1 if stale (CI gate)
 */
import { readFileSync, readdirSync, writeFileSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import Papa from 'papaparse'
import prettier from 'prettier'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const NICE_COMPONENTS = join(ROOT, 'pqc-references', 'NICE-Framework-Components-v2.2.0.json')
const DATA = join(ROOT, 'src', 'data')
const OUT = join(DATA, 'generated', 'tools.generated.ts')
const EMBED = join(ROOT, 'public', 'embed', 'manifest.json')

const COLUMNS = [
  'tool_id',
  'kind',
  'pt_id',
  'version',
  'name',
  'category',
  'order',
  'level',
  'module',
  'sandbox_track',
  'recommended_personas',
  'audience',
  'nice_tier',
  'nice_competency_areas',
  'nice_work_roles',
  'nice_statements_taught',
  'nice_statements_practised',
  'framework_phase',
  'cswp39_zone',
  'cswp39_zone_sub_element',
  'cswp39_section_ref',
  'cswp39_sub_section',
  'work_in_progress',
]

const KINDS = ['playground', 'sandbox', 'business']
const SEMVER = /^\d+\.\d+\.\d+$/
const SANDBOX_PREFIX = 'sbx-'

// Latest dated CSV of one family (<prefix>_MMDDYYYY[_rN].csv).
function latestCsv(prefix = 'tools') {
  const re = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  let best = null
  for (const file of readdirSync(DATA)) {
    const m = file.match(re)
    if (!m) continue
    const key = `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}`
    if (!best || key > best.key) best = { key, file }
  }
  if (!best) throw new Error(`no ${prefix}_*.csv found`)
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
const bool = (value) => (value === '' ? undefined : value === 'true')
const STATEMENT_ID = /^[KST]\d{4}$/
// The statements a tool teaches or practises: `;`-separated NICE ids, each in the vendored v2.2.0
// components, none repeated, none listed in both columns (the lessons file's rules).
const officialStatements = new Set(
  JSON.parse(readFileSync(NICE_COMPONENTS, 'utf8')).elements.map((e) => e.element_identifier)
)
function statements(row, column) {
  const ids = list(row[column])
  for (const id of ids) {
    if (!STATEMENT_ID.test(id)) fail(row, `bad ${column} id "${id}"`)
    if (!officialStatements.has(id)) fail(row, `${column} id ${id} is not in the NICE components`)
  }
  if (new Set(ids).size !== ids.length) fail(row, `repeated id in ${column}`)
  return ids
}

// A Playground tool that belongs to a lesson takes its NICE tier, competency areas and work roles from
// that lesson's row (one copy, in the lessons file). Sandbox scenarios keep their own: they have no lesson
// of their own to read them from (their columns follow their track, in the order a reader sees them).
function lessonRows() {
  const parsed = Papa.parse(readFileSync(join(DATA, latestCsv('learn_modules')), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  })
  return new Map(parsed.data.map((lesson) => [lesson.module_id, lesson]))
}

function fail(row, message) {
  throw new Error(`${row.tool_id || '(blank tool_id)'}: ${message}`)
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
  const lessons = lessonRows()
  const rows = parsed.data.map((row) => {
    if (!row.tool_id || seen.has(row.tool_id)) fail(row, 'duplicate or blank tool_id')
    seen.add(row.tool_id)
    if (!KINDS.includes(row.kind)) fail(row, `bad kind "${row.kind}"`)
    const order = Number(row.order)
    if (!Number.isInteger(order) || order <= 0) fail(row, `bad order "${row.order}"`)
    if (!row.name) fail(row, 'blank name')
    if (!row.category) fail(row, 'blank category')
    const isBusiness = row.kind === 'business'
    const isSandbox = row.kind === 'sandbox'
    if (isSandbox !== row.tool_id.startsWith(SANDBOX_PREFIX)) {
      fail(row, `tool_id and kind disagree about the "${SANDBOX_PREFIX}" prefix`)
    }
    if (isBusiness) {
      for (const column of ['pt_id', 'version', 'level', 'sandbox_track']) {
        if (row[column]) fail(row, `a business tool has no ${column}`)
      }
      if (row.recommended_personas) fail(row, 'a business tool has no recommended_personas')
      for (const column of ['framework_phase', 'cswp39_zone', 'cswp39_section_ref']) {
        if (!row[column]) fail(row, `a business tool needs ${column}`)
      }
    } else {
      if (!row.pt_id) fail(row, 'blank pt_id')
      if (!row.level) fail(row, 'blank level')
      if (row.audience) fail(row, 'only a business tool has an audience')
      for (const column of [
        'framework_phase',
        'cswp39_zone',
        'cswp39_zone_sub_element',
        'cswp39_section_ref',
        'cswp39_sub_section',
      ]) {
        if (row[column]) fail(row, `only a business tool has ${column}`)
      }
      if (isSandbox) {
        if (row.version) fail(row, 'a sandbox tool version is generated, not stored')
        if (!row.sandbox_track) fail(row, 'a sandbox tool needs sandbox_track')
      } else {
        if (!SEMVER.test(row.version)) fail(row, `bad version "${row.version}"`)
        if (row.sandbox_track) fail(row, 'only a sandbox tool has sandbox_track')
        if (row.work_in_progress) fail(row, 'only a sandbox tool has work_in_progress')
      }
      if (list(row.recommended_personas).length === 0) fail(row, 'blank recommended_personas')
    }
    const lesson = row.kind === 'playground' && row.module ? lessons.get(row.module) : undefined
    if (row.kind === 'playground' && row.module && !lesson) {
      fail(row, `module "${row.module}" is not a lesson of the lessons file`)
    }
    if (lesson && (row.nice_tier || row.nice_competency_areas || row.nice_work_roles)) {
      fail(
        row,
        'a tool with a lesson reads its NICE tier, areas and roles from the lesson: leave its own cells blank'
      )
    }
    // where the tool's NICE tier, areas and roles come from: its lesson, else its own row
    const nice = lesson ?? row
    const niceStatementsTaught = statements(row, 'nice_statements_taught')
    const niceStatementsPractised = statements(row, 'nice_statements_practised')
    if (niceStatementsTaught.some((id) => niceStatementsPractised.includes(id))) {
      fail(row, 'a NICE statement is listed as both taught and practised')
    }
    return {
      toolId: row.tool_id,
      kind: row.kind,
      ...(row.pt_id ? { ptId: row.pt_id } : {}),
      ...(row.version ? { version: row.version } : {}),
      name: row.name,
      category: row.category,
      order,
      ...(row.level ? { level: row.level } : {}),
      ...(text(row.module) ? { module: row.module } : {}),
      ...(text(row.sandbox_track) ? { sandboxTrack: row.sandbox_track } : {}),
      ...(niceStatementsTaught.length > 0 ? { niceStatementsTaught } : {}),
      ...(niceStatementsPractised.length > 0 ? { niceStatementsPractised } : {}),
      ...(isBusiness ? {} : { recommendedPersonas: list(row.recommended_personas) }),
      ...(text(row.audience) ? { audience: row.audience } : {}),
      ...(isBusiness
        ? {}
        : {
            ...(text(nice.nice_tier) ? { niceTier: nice.nice_tier } : {}),
            niceCompetencyAreas: list(nice.nice_competency_areas),
            niceWorkRoles: list(nice.nice_work_roles),
          }),
      ...(text(row.framework_phase) ? { frameworkPhase: row.framework_phase } : {}),
      ...(text(row.cswp39_zone) ? { cswp39Zone: row.cswp39_zone } : {}),
      ...(text(row.cswp39_zone_sub_element)
        ? { cswp39ZoneSubElement: row.cswp39_zone_sub_element }
        : {}),
      ...(text(row.cswp39_section_ref) ? { cswp39SectionRef: row.cswp39_section_ref } : {}),
      ...(text(row.cswp39_sub_section) ? { cswp39SubSection: row.cswp39_sub_section } : {}),
      ...(bool(row.work_in_progress) !== undefined
        ? { workInProgress: bool(row.work_in_progress) }
        : {}),
    }
  })

  // `order` is one run across Playground and sandbox tools, and its own run for
  // business tools. Gaps and repeats would silently reorder the pages.
  for (const [label, kinds] of [
    ['playground and sandbox', ['playground', 'sandbox']],
    ['business', ['business']],
  ]) {
    const orders = rows
      .filter((r) => kinds.includes(r.kind))
      .map((r) => r.order)
      .sort((a, b) => a - b)
    orders.forEach((value, index) => {
      if (value !== index + 1) {
        throw new Error(
          `${label} tools: order must run 1..${orders.length} without gaps or repeats`
        )
      }
    })
  }
  const byOrder = (a, b) => a.order - b.order
  return {
    file,
    playground: rows.filter((r) => r.kind === 'playground').sort(byOrder),
    sandbox: rows.filter((r) => r.kind === 'sandbox').sort(byOrder),
    business: rows.filter((r) => r.kind === 'business').sort(byOrder),
  }
}

function generate({ file, playground, sandbox, business }) {
  return `// SPDX-License-Identifier: AGPL-3.0-only
// GENERATED by scripts/ci/gen-tools.mjs from ${file} — DO NOT EDIT BY HAND.
import type { PersonaId } from '@/data/personaIds'
import type { PhaseId } from '@/data/frameworkPhases'
import type { ZoneId } from '@/data/cswp39ZoneData'
import type { NiceCompetencyAreaId, NiceProficiencyTier, NiceWorkRoleId } from '@/data/niceFramework'
import type { SandboxTrackId } from '@/data/sandboxScenarios'
import type { ToolDifficulty, WorkshopCategory } from '@/components/Playground/workshopRegistry'
import type {
  BusinessToolAudience,
  BusinessToolCategory,
} from '@/components/BusinessCenter/businessToolsRegistry'

interface ToolRecordBase {
  /** The Hub's id (sandbox tools carry the \`sbx-\` prefix). */
  toolId: string
  name: string
  /** The lesson this tool belongs to, where it has one (its home lesson). */
  module?: string
  /** NICE statements the tool teaches, and the ones it has a learner practise. Absent until filled. */
  niceStatementsTaught?: readonly string[]
  niceStatementsPractised?: readonly string[]
  /** Position on the page: one run across Playground and sandbox tools, its own run for business tools. */
  order: number
}

interface NiceFields {
  niceTier?: NiceProficiencyTier
  niceCompetencyAreas: readonly NiceCompetencyAreaId[]
  niceWorkRoles: readonly NiceWorkRoleId[]
}

export interface PlaygroundToolRecord extends ToolRecordBase, NiceFields {
  kind: 'playground'
  /** Tracking id, stable across renames. */
  ptId: string
  /** Semantic version of the tool. */
  version: string
  category: WorkshopCategory
  level: ToolDifficulty
  recommendedPersonas: readonly PersonaId[]
}

export interface SandboxToolRecord extends ToolRecordBase, NiceFields {
  kind: 'sandbox'
  ptId: string
  category: WorkshopCategory
  level: ToolDifficulty
  sandboxTrack: SandboxTrackId
  recommendedPersonas: readonly PersonaId[]
  workInProgress?: boolean
}

export interface BusinessToolRecord extends ToolRecordBase {
  kind: 'business'
  category: BusinessToolCategory
  /** Intended reader; absent means the default business audience. */
  audience?: BusinessToolAudience
  frameworkPhase: PhaseId
  cswp39Zone: ZoneId
  cswp39ZoneSubElement?: string
  cswp39SectionRef: string
  cswp39SubSection?: string
}

export type ToolRecord = PlaygroundToolRecord | SandboxToolRecord | BusinessToolRecord

export const PLAYGROUND_TOOL_RECORDS: readonly PlaygroundToolRecord[] = ${JSON.stringify(playground, null, 2)} satisfies readonly PlaygroundToolRecord[]

export const SANDBOX_TOOL_RECORDS: readonly SandboxToolRecord[] = ${JSON.stringify(sandbox, null, 2)} satisfies readonly SandboxToolRecord[]

export const BUSINESS_TOOL_RECORDS: readonly BusinessToolRecord[] = ${JSON.stringify(business, null, 2)} satisfies readonly BusinessToolRecord[]

export const TOOL_RECORDS: readonly ToolRecord[] = [
  ...[...PLAYGROUND_TOOL_RECORDS, ...SANDBOX_TOOL_RECORDS].sort((a, b) => a.order - b.order),
  ...BUSINESS_TOOL_RECORDS,
]

export const TOOL_RECORD_BY_ID: Readonly<Record<string, ToolRecord>> = Object.fromEntries(
  TOOL_RECORDS.map((row) => [row.toolId, row])
)
`
}

// Replace one list of the embed manifest, keeping the rest of the file byte for byte.
function replaceList(current, key, nextKey, entries) {
  const start = current.indexOf(`"${key}": [`)
  const end = current.indexOf(`"${nextKey}"`)
  if (start < 0 || end < start) throw new Error(`embed manifest: ${key} block not found`)
  const block = JSON.stringify(entries, null, 2)
    .split('\n')
    .map((line, i) => (i === 0 ? line : `    ${line}`))
    .join('\n')
  return `${current.slice(0, start)}"${key}": ${block},\n    ${current.slice(end)}`
}

function embed({ playground, business }) {
  let current = readFileSync(EMBED, 'utf8')
  current = replaceList(
    current,
    'playgroundTools',
    'businessTools',
    playground.map(({ toolId, name, category, level }) => ({
      id: toolId,
      name,
      category,
      difficulty: level,
    }))
  )
  return replaceList(
    current,
    'businessTools',
    'personas',
    business.map(({ toolId, name, category }) => ({ id: toolId, name, category }))
  )
}

const derived = load()
const next = await prettier.format(generate(derived), {
  ...(await prettier.resolveConfig(OUT)),
  filepath: OUT,
})
const nextEmbed = embed(derived)

if (process.argv.includes('--check')) {
  const stale = [
    [OUT, next],
    [EMBED, nextEmbed],
  ].some(([file, want]) => {
    try {
      return readFileSync(file, 'utf8') !== want
    } catch {
      return true
    }
  })
  if (stale) {
    console.error('tool generated files are stale — run `npm run gen:tools`')
    process.exit(1)
  }
  console.log('✓ tool generated files up to date')
} else {
  writeFileSync(OUT, next)
  writeFileSync(EMBED, nextEmbed)
  console.log(`wrote ${OUT} and ${EMBED} from ${derived.file}`)
}
