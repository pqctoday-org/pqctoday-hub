// SPDX-License-Identifier: GPL-3.0-only
/**
 * timeline-publication-checks.ts — the public timeline's publication boundary
 * (timeline remediation r2, 2026-09-24; plan in pqctoday-priv/nextfeature/
 * timeline-maintenance-remediation-plan-09242026-r2.md).
 *
 *   TL-VOCAB     trusted_source_id_status ∈ {registered, proposed, ''},
 *                source_class ∈ {primary, secondary, ''}, binding_force ∈ the
 *                reviewed enum or ''. The free-text statuses this replaces
 *                ('resolved_2026-07-16', a whole sentence) rendered as
 *                "Unverified" in the UI.
 *   TL-DEADLINE  every REVIEWED active row tagged is_sim_deadline=true carries
 *                a binding_force — Assess and Report present these as
 *                regulatory facts. A tagged row that is withheld (unreviewed)
 *                is reported by TL-DEADLINE-WITHHELD (WARNING): the deadline
 *                codegen already refuses it, so the country falls back to the
 *                Q-Day anchor until the row is reviewed.
 *   TL-NEW       an active, reviewed row that is NEW or CHANGED since the
 *                previous generation (by event_id) must have a resolving
 *                trusted_source_id, a local_file and an in-scope entity_type
 *                (government | standards; user decision T2). Legacy rows are
 *                reported (TL-LEGACY, WARNING), never blanket-blocked.
 *   TL-SCOPE     no active, reviewed row is a vendor (user decision T2).
 *   TL-MANIFEST  public/timeline/manifest.json (the one evidence manifest, keyed
 *                by refId = event_id) was built from the latest CSV generation
 *                and has an entry for every active row. It used to describe an
 *                older snapshot than the one being published (r1 H2).
 *
 * Unreviewed rows (timelineReviewPolicy.json) are withheld from every public
 * surface, so TL-NEW / TL-SCOPE do not apply to them.
 */

import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { getDataDir } from './data-loader.js'
import type { CheckResult, Finding } from './types.js'

type Row = Record<string, string>

const BINDING = new Set([
  'binding',
  'mandatory_for_scope',
  'official_target',
  'recommendation',
  'draft',
  'informational',
])
const LINK_STATUS = new Set(['registered', 'proposed', ''])
const SOURCE_CLASS = new Set(['primary', 'secondary', ''])
const IN_SCOPE = new Set(['government', 'standards'])

function generations(dir: string): string[] {
  const re = /^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  return fs
    .readdirSync(dir)
    .map((f) => {
      const m = f.match(re)
      return m ? { f, key: `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}` } : null
    })
    .filter((x): x is { f: string; key: string } => x !== null)
    .sort((a, b) => b.key.localeCompare(a.key))
    .map((x) => x.f)
}

function read(dir: string, file: string): Row[] {
  const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
  return Papa.parse<Row>(raw.trim(), { header: true, skipEmptyLines: true }).data
}

function unreviewedSet(dir: string): Set<string> {
  const p = path.join(dir, 'timelineReviewPolicy.json')
  const policy = JSON.parse(fs.readFileSync(p, 'utf-8')) as { unreviewedStatuses: string[] }
  return new Set(policy.unreviewedStatuses.map((s) => s.trim().toLowerCase()))
}

function registryIds(dir: string): Set<string> {
  const f = fs
    .readdirSync(dir)
    .filter((n) => /^trusted_sources_\d{8}(?:_r\d+)?\.csv$/.test(n))
    .sort()
    .pop()
  if (!f) return new Set()
  return new Set(
    read(dir, f)
      .filter((r) => (r.status ?? '').trim().toLowerCase() !== 'deprecated')
      .map((r) => (r.source_id ?? '').trim())
      .filter(Boolean)
  )
}

const CONTENT = [
  'Title',
  'Description',
  'StartYear',
  'EndYear',
  'SourceUrl',
  'SourceDate',
  'Status',
  'entity_type',
  'mandate_type',
  'binding_force',
  'status',
]

function result(
  id: string,
  description: string,
  severity: 'ERROR' | 'WARNING',
  csv: string,
  findings: Finding[]
): CheckResult {
  return {
    id,
    category: 'structure',
    description,
    sourceA: csv,
    sourceB: null,
    severity,
    status: findings.length ? 'FAIL' : 'PASS',
    findings,
  }
}

export function checkTimelinePublication(
  latest: Row[],
  previous: Row[] | null,
  unreviewed: Set<string>,
  registry: Set<string>,
  csv: string
): CheckResult[] {
  const vocab: Finding[] = []
  const deadline: Finding[] = []
  const withheld: Finding[] = []
  const fresh: Finding[] = []
  const legacy: Finding[] = []
  const scope: Finding[] = []
  const prevById = new Map((previous ?? []).map((r) => [r.event_id, r]))

  latest.forEach((r, i) => {
    const row = i + 2
    const f = (field: string, message: string): Finding => ({
      csv,
      row,
      field,
      value: r[field] ?? '',
      message: `${r.event_id}: ${message}`,
    })
    if (!LINK_STATUS.has((r.trusted_source_id_status ?? '').trim()))
      vocab.push(f('trusted_source_id_status', 'not in {registered, proposed, blank}'))
    if (!SOURCE_CLASS.has((r.source_class ?? '').trim()))
      vocab.push(f('source_class', 'not in {primary, secondary, blank}'))
    const bf = (r.binding_force ?? '').trim()
    if (bf && !BINDING.has(bf)) vocab.push(f('binding_force', 'not a binding_force value'))

    const active = !['deprecated', 'obsolete'].includes((r.status ?? '').trim().toLowerCase())
    if (!active) return
    const isUnreviewed = unreviewed.has((r.Status ?? '').trim().toLowerCase())

    if ((r.is_sim_deadline ?? '').trim() === 'true') {
      if (isUnreviewed) withheld.push(f('Status', 'deadline row withheld until reviewed'))
      else if (!bf) deadline.push(f('binding_force', 'deadline row has no reviewed binding_force'))
    }
    if (isUnreviewed) return

    if ((r.entity_type ?? '').trim() === 'vendor')
      scope.push(f('entity_type', 'vendor actor on the public timeline'))

    const prev = prevById.get(r.event_id)
    const changed = !prev || CONTENT.some((c) => (prev[c] ?? '') !== (r[c] ?? ''))
    const problems: Array<[string, string]> = []
    const tsid = (r.trusted_source_id ?? '').trim()
    if (!tsid || !registry.has(tsid))
      problems.push(['trusted_source_id', 'no trusted_source_id resolving in the registry'])
    if (!(r.local_file ?? '').trim()) problems.push(['local_file', 'no cached evidence file'])
    if (!IN_SCOPE.has((r.entity_type ?? '').trim()))
      problems.push(['entity_type', 'entity_type is not government or standards'])
    for (const [field, msg] of problems) (changed ? fresh : legacy).push(f(field, msg))
  })

  return [
    result('TL-VOCAB', 'Timeline controlled vocabularies', 'ERROR', csv, vocab),
    result(
      'TL-DEADLINE',
      'Reviewed timeline deadline rows carry binding_force',
      'ERROR',
      csv,
      deadline
    ),
    result(
      'TL-DEADLINE-WITHHELD',
      'Timeline deadline rows withheld until reviewed',
      'WARNING',
      csv,
      withheld
    ),
    result('TL-NEW', 'New/changed public timeline rows are fully sourced', 'ERROR', csv, fresh),
    result('TL-LEGACY', 'Legacy public timeline rows missing sourcing', 'WARNING', csv, legacy),
    result('TL-SCOPE', 'No vendor rows on the public timeline', 'ERROR', csv, scope),
  ]
}

export function checkManifest(
  latest: Row[],
  csv: string,
  manifest: { csv?: string; entries?: Array<{ refId?: string }> } | null
): CheckResult {
  const findings: Finding[] = []
  const f = (field: string, value: string, message: string): Finding => ({
    csv: 'public/timeline/manifest.json',
    row: null,
    field,
    value,
    message,
  })
  if (!manifest) {
    findings.push(f('csv', '', 'public/timeline/manifest.json is missing'))
  } else {
    if ((manifest.csv ?? '') !== csv)
      findings.push(
        f('csv', manifest.csv ?? '', `manifest was built from ${manifest.csv}, not ${csv}`)
      )
    const refs = new Set((manifest.entries ?? []).map((e) => e.refId ?? ''))
    for (const r of latest) {
      const active = !['deprecated', 'obsolete'].includes((r.status ?? '').trim().toLowerCase())
      if (active && r.event_id && !refs.has(r.event_id))
        findings.push(f('refId', r.event_id, `active row ${r.event_id} has no manifest entry`))
    }
  }
  return result(
    'TL-MANIFEST',
    'Timeline evidence manifest matches the live CSV',
    'ERROR',
    csv,
    findings
  )
}

export function runTimelinePublicationChecks(): CheckResult[] {
  const dir = getDataDir()
  const gens = generations(dir)
  if (gens.length === 0) return []
  const latest = read(dir, gens[0])
  const manifestPath = path.join(dir, '..', '..', 'public', 'timeline', 'manifest.json')
  const manifest = fs.existsSync(manifestPath)
    ? (JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as {
        csv?: string
        entries?: Array<{ refId?: string }>
      })
    : null
  return [
    ...checkTimelinePublication(
      latest,
      gens[1] ? read(dir, gens[1]) : null,
      unreviewedSet(dir),
      registryIds(dir),
      gens[0]
    ),
    checkManifest(latest, gens[0], manifest),
  ]
}
