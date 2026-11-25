#!/usr/bin/env tsx
// SPDX-License-Identifier: AGPL-3.0-only
/**
 * check-tool-version-bump.ts — PR CI gate
 *
 * Fails if a Playground tool changed but its version was not raised relative to
 * the merge base with origin/main.
 *
 * What counts as "a tool":
 *   - its entry in the tool registry (`workshopRegistry.tsx`), read line by line
 *     — each entry is the lines between `  {` and `  },` of the registry array,
 *     and each field starts at four-space indentation;
 *   - its row in the newest dated tools data file (`src/data/tools_*.csv`), once
 *     that file exists. The data file holds the tool's name, tracking number,
 *     version, category, level and recommended roles; the registry holds the
 *     rest.
 *
 * What counts as "modified": the tool's effective fields (registry entry plus
 * data-file row) differ between base and head. Consequences:
 *   - only the tool's OWN entry matters. Lines elsewhere in the registry file
 *     (the sandbox maps, other tools, helper code) never flag a tool, even when
 *     they mention its id;
 *   - removing a field from an entry is not a change when the data file now
 *     carries the same value (it is verified against the file, not assumed);
 *     a changed value during such a move IS a change;
 *   - comment-only lines and whitespace are not content;
 *   - a version raise in the data file counts as a raise.
 *
 * Sandbox and business tools have no bumpable version (sandbox versions are
 * generated, business tools have none) and are not checked.
 *
 * Outputs BUMPED_TOOLS_JSON to stdout (currently unconsumed — its former
 * reader, append-revision.ts, was deleted 2026-07-26).
 *
 * Usage: tsx scripts/ci/check-tool-version-bump.ts [--base=<ref>] [--head=<ref>]
 *
 * Exit codes:
 *   0 — all modified tools have version bumps (or nothing relevant changed)
 *   1 — one or more modified tools missing a version bump
 */

import { execFileSync } from 'child_process'
import Papa from 'papaparse'

const REGISTRY_PATH = 'src/components/Playground/workshopRegistry.tsx'
const DATA_DIR = 'src/data'
const TOOLS_CSV = /^tools_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/

// ── Helpers ──────────────────────────────────────────────────────────────────

function git(args: string[]): string {
  try {
    return execFileSync('git', args, {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

/** Compare semver strings. Returns true if b > a */
export function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.split('.').map((n) => parseInt(n, 10) || 0)
  const [aMaj, aMin, aPat] = parse(a)
  const [bMaj, bMin, bPat] = parse(b)
  if (bMaj !== aMaj) return bMaj > aMaj
  if (bMin !== aMin) return bMin > aMin
  return bPat > aPat
}

// ── Registry parsing (line based) ────────────────────────────────────────────

export interface ToolBlock {
  id: string
  /** Field name → its text with comments, indentation and trailing comma removed. */
  fields: Map<string, string>
}

const ARRAY_START = /^(?:export )?const (?:WORKSHOP_TOOLS|WORKSHOP_TOOL_CONTENT)\b.*=\s*\[\s*$/

/** The entries of the tool array in a registry source, one per `  {` … `  },` run. */
export function parseToolBlocks(src: string): ToolBlock[] {
  const lines = src.split('\n')
  const start = lines.findIndex((line) => ARRAY_START.test(line))
  if (start < 0) return []
  const blocks: ToolBlock[] = []
  let current: { name: string; parts: string[] }[] | null = null
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (line === ']') break
    if (current === null) {
      if (line === '  {') current = []
      continue
    }
    if (line === '  },') {
      const fields = new Map<string, string>()
      for (const field of current) {
        fields.set(field.name, normalise(field.parts.join(' ')))
      }
      const id = fields.get('id')
      if (id !== undefined) {
        const literal = literalStrings(id)
        if (literal && literal.length === 1) {
          fields.delete('id')
          blocks.push({ id: literal[0], fields })
        }
      }
      current = null
      continue
    }
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('//')) continue
    const m = /^ {4}([A-Za-z_]\w*):(.*)$/.exec(line)
    if (m) current.push({ name: m[1], parts: [m[2]] })
    else if (current.length > 0) current[current.length - 1].parts.push(trimmed)
  }
  return blocks
}

function normalise(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/,\s*$/, '')
    .replace(/,\s*([\]}])/g, ' $1')
    .trim()
}

/** The string literals of a value made only of string literals, commas and brackets; else null. */
export function literalStrings(text: string): string[] | null {
  const tokens = /(['"])((?:\\.|(?!\1).)*)\1/g
  const values: string[] = []
  let rest = text
  for (const m of text.matchAll(tokens)) {
    values.push(m[2].replace(/\\(.)/g, '$1'))
    rest = rest.replace(m[0], '')
  }
  return /^[\s,[\]]*$/.test(rest) && values.length > 0 ? values : null
}

// ── Data file ────────────────────────────────────────────────────────────────

export type DataRow = Record<string, string>

/** Registry key → the data file column that now carries it (and whether it is a list). */
const MOVED_FIELDS: Record<string, { column: string; list: boolean }> = {
  pt_id: { column: 'pt_id', list: false },
  version: { column: 'version', list: false },
  name: { column: 'name', list: false },
  category: { column: 'category', list: false },
  difficulty: { column: 'level', list: false },
  recommendedPersonas: { column: 'recommended_personas', list: true },
}

/** Other columns of the data file: compared only when both sides have a row. */
const DATA_ONLY_COLUMNS = [
  'module',
  'nice_tier',
  'nice_competency_areas',
  'nice_work_roles',
  'work_in_progress',
]

export function parseToolRows(csv: string | undefined): Map<string, DataRow> {
  const rows = new Map<string, DataRow>()
  if (!csv) return rows
  const parsed = Papa.parse<DataRow>(csv, { header: true, skipEmptyLines: true })
  for (const row of parsed.data) {
    if (row.kind === 'playground' && row.tool_id) rows.set(row.tool_id, row)
  }
  return rows
}

const canonicalList = (values: string[]) => JSON.stringify(values)

// ── The check ────────────────────────────────────────────────────────────────

export interface Snapshot {
  /** Registry source text at that commit. */
  registry: string
  /** Newest tools data file text at that commit, when there is one. */
  csv?: string
}

interface Effective {
  fields: Map<string, string>
  data: Map<string, string>
  hasRow: boolean
  ptId: string
  version: string
}

function effectiveTools(snapshot: Snapshot): Map<string, Effective> {
  const rows = parseToolRows(snapshot.csv)
  const out = new Map<string, Effective>()
  for (const block of parseToolBlocks(snapshot.registry)) {
    const fields = new Map<string, string>()
    let ptId = ''
    let version = ''
    for (const [key, text] of block.fields) {
      const moved = MOVED_FIELDS[key] // eslint-disable-line security/detect-object-injection
      if (!moved) {
        fields.set(key, text)
        continue
      }
      const literal = literalStrings(text)
      if (key === 'pt_id' && literal) ptId = literal[0]
      if (key === 'version' && literal) version = literal[0]
      fields.set(key, literal ? canonicalList(literal) : `raw:${text}`)
    }
    const row = rows.get(block.id)
    const data = new Map<string, string>()
    if (row) {
      for (const [key, moved] of Object.entries(MOVED_FIELDS)) {
        const value = row[moved.column] ?? ''
        if (value === '') continue
        fields.set(key, canonicalList(moved.list ? value.split(';').filter(Boolean) : [value]))
        if (key === 'pt_id') ptId = value
        if (key === 'version') version = value
      }
      for (const column of DATA_ONLY_COLUMNS) {
        // eslint-disable-next-line security/detect-object-injection
        data.set(column, row[column] ?? '')
      }
    }
    // A tool's version is its own check, not part of "did it change".
    fields.delete('version')
    out.set(block.id, { fields, data, hasRow: row !== undefined, ptId, version })
  }
  return out
}

function sameMap(a: Map<string, string>, b: Map<string, string>): boolean {
  if (a.size !== b.size) return false
  for (const [key, value] of a) if (b.get(key) !== value) return false
  return true
}

export interface BumpResult {
  errors: string[]
  bumped: { tool_id: string; old_version: string; new_version: string }[]
  /** Ids of tools whose own entry or row changed. */
  modified: string[]
}

export function checkToolVersions(base: Snapshot, head: Snapshot): BumpResult {
  const baseTools = effectiveTools(base)
  const headTools = effectiveTools(head)
  const errors: string[] = []
  const bumped: BumpResult['bumped'] = []
  const modified: string[] = []

  for (const [id, headTool] of headTools) {
    const baseTool = baseTools.get(id)
    // New tool — no version bump required (first version is fine)
    if (!baseTool) continue

    const dataChanged =
      baseTool.hasRow && headTool.hasRow ? !sameMap(baseTool.data, headTool.data) : false
    const toolModified = !sameMap(baseTool.fields, headTool.fields) || dataChanged
    if (!toolModified) continue
    modified.push(id)

    if (!semverGt(baseTool.version, headTool.version)) {
      errors.push(
        `  ✗ Tool '${id}' (${headTool.ptId}) was modified but version not bumped ` +
          `(still ${headTool.version})`
      )
    } else {
      bumped.push({ tool_id: id, old_version: baseTool.version, new_version: headTool.version })
    }
  }
  return { errors, bumped, modified }
}

// ── Reading a commit ─────────────────────────────────────────────────────────

/** Name of the newest dated tools file among a list of file names. */
export function newestToolsCsv(names: string[]): string | null {
  let best: { key: string; name: string } | null = null
  for (const name of names) {
    const m = TOOLS_CSV.exec(name)
    if (!m) continue
    const key = `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}`
    if (!best || key > best.key) best = { key, name }
  }
  return best ? best.name : null
}

function snapshotAt(ref: string): Snapshot | null {
  const registry = git(['show', `${ref}:${REGISTRY_PATH}`])
  if (!registry) return null
  const names = git(['ls-tree', '--name-only', `${ref}:${DATA_DIR}`]).split('\n')
  const file = newestToolsCsv(names)
  const csv = file ? git(['show', `${ref}:${DATA_DIR}/${file}`]) : undefined
  return { registry, csv }
}

function argValue(name: string): string | undefined {
  const hit = process.argv.find((arg) => arg.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : undefined
}

function main(): number {
  const baseRef = argValue('base') ?? 'origin/main'
  const headRef = argValue('head') ?? 'HEAD'
  const changedFiles = git(['diff', '--name-only', `${baseRef}...${headRef}`])
  const relevant = changedFiles
    .split('\n')
    .some(
      (file) =>
        file === REGISTRY_PATH ||
        (file.startsWith(`${DATA_DIR}/`) && TOOLS_CSV.test(file.slice(DATA_DIR.length + 1)))
    )

  if (!relevant) {
    console.log('Tool registry and tools data file unchanged — skipping tool version bump check.')
    console.log('BUMPED_TOOLS_JSON=[]')
    return 0
  }

  // Compare against the merge base, so a change that landed on main meanwhile is not ours.
  const mergeBase = git(['merge-base', baseRef, headRef]) || baseRef
  const base = snapshotAt(mergeBase)
  const head = snapshotAt(headRef)
  if (!base || !head) {
    console.log('Could not read registry from git — skipping version bump check.')
    return 0
  }

  const result = checkToolVersions(base, head)
  console.log(`BUMPED_TOOLS_JSON=${JSON.stringify(result.bumped)}`)
  console.log(
    `Tools whose own entry or data-file row changed: ${
      result.modified.length ? result.modified.join(', ') : 'none'
    }`
  )

  if (result.errors.length > 0) {
    console.error('\nTool version bump check FAILED:')
    result.errors.forEach((e) => console.error(e))
    console.error(
      '\nRaise the version (semver) of each modified tool, in its row of the tools data file ' +
        '(or in workshopRegistry.tsx for a tool the file does not list), then run `npm run gen:tools`.\n'
    )
    return 1
  }

  console.log(`Tool version bump check passed. ${result.bumped.length} tool(s) bumped.`)
  return 0
}

if (process.argv[1] && /check-tool-version-bump\.ts$/.test(process.argv[1])) {
  process.exit(main())
}
