// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every hand-coded date in regulatoryTimelines.ts is classified, and the ones
 * that restate a timeline row match the REVIEWED row (timeline remediation r2
 * W-K). A timeline edit that changes a deadline, or withholds its row, fails here.
 */
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import * as RT from './regulatoryTimelines'
import { REGULATORY_CONSTANT_PROVENANCE as P } from './regulatoryConstantProvenance'
import { TIMELINE_COUNTRY_DEADLINE_YEAR } from './timelineFacts.generated'
import policy from './timelineReviewPolicy.json'

const DATA = path.join(process.cwd(), 'src', 'data')

function latestTimeline(): Record<string, Record<string, string>> {
  const re = /^timeline_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  const f = fs
    .readdirSync(DATA)
    .map((n) => ({ n, m: n.match(re) }))
    .filter((x): x is { n: string; m: RegExpMatchArray } => x.m !== null)
    .sort((a, b) => {
      const k = (m: RegExpMatchArray) => `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(3, '0')}`
      return k(a.m).localeCompare(k(b.m))
    })
    .pop()!.n
  const rows = Papa.parse<Record<string, string>>(fs.readFileSync(path.join(DATA, f), 'utf-8'), {
    header: true,
    skipEmptyLines: true,
  }).data
  return Object.fromEntries(rows.map((r) => [r.event_id, r]))
}

/** Every classified value, keyed like the provenance table. */
function values(): Record<string, string | number> {
  const out: Record<string, string | number> = {}
  const objects = {
    CNSA_2_0: RT.CNSA_2_0,
    NIST_DEPRECATION: RT.NIST_DEPRECATION,
    EO_14412: RT.EO_14412,
    ANSSI_TIMELINE: RT.ANSSI_TIMELINE,
    BSI_TIMELINE: RT.BSI_TIMELINE,
    CRQC_ESTIMATES: RT.CRQC_ESTIMATES,
  }
  for (const [name, obj] of Object.entries(objects))
    for (const [k, v] of Object.entries(obj))
      if (typeof v === 'number' || typeof v === 'string') out[`${name}.${k}`] = v
  for (const e of RT.SQUEEZE_2026_2030) out[`SQUEEZE_2026_2030[${e.label}]`] = e.date
  for (const e of RT.CAB_FORUM_CERT_LIFETIME) out[`CAB_FORUM_CERT_LIFETIME[${e.date}]`] = e.maxDays
  return out
}

const UNREVIEWED = new Set(policy.unreviewedStatuses.map((s) => s.toLowerCase()))

describe('regulatoryTimelines.ts provenance (timeline remediation r2 W-K)', () => {
  const vals = values()
  const rows = latestTimeline()

  it('every hand-coded date is classified', () => {
    const missing = Object.keys(vals).filter((k) => !(k in P))
    expect(missing).toEqual([])
  })

  it('timeline-linked constants match an active, reviewed row', () => {
    const problems: string[] = []
    for (const [key, prov] of Object.entries(P)) {
      if (prov.kind !== 'timeline') continue
      const row = rows[prov.eventId!]
      if (!row) {
        problems.push(`${key}: row ${prov.eventId} not found`)
        continue
      }
      if ((row.status ?? '').toLowerCase() === 'deprecated')
        problems.push(`${key}: row ${prov.eventId} is deprecated`)
      if (UNREVIEWED.has((row.Status ?? '').trim().toLowerCase()))
        problems.push(`${key}: row ${prov.eventId} is withheld (not reviewed)`)
      const cell = (row[prov.field!] ?? '').trim()
      const v = String(vals[key] ?? '')
      // A YYYY-MM ribbon date restating a year-level row is compared by year.
      const ok =
        prov.field === 'SourceDate'
          ? v.startsWith(cell) || cell.startsWith(v)
          : cell === (v.includes('-') ? v.slice(0, 4) : v)
      if (!ok) problems.push(`${key} = ${v}, but ${prov.eventId}.${prov.field} = ${cell}`)
    }
    expect(problems).toEqual([])
  })

  it('generated constants equal the reviewed per-country deadline', () => {
    for (const [key, prov] of Object.entries(P)) {
      if (prov.kind !== 'generated') continue
      expect(vals[key], key).toBe(TIMELINE_COUNTRY_DEADLINE_YEAR[prov.country!])
    }
  })

  it('derived dates are recomputed from their base', () => {
    for (const [key, prov] of Object.entries(P)) {
      if (prov.kind !== 'derived') continue
      const base = new Date(`${vals[prov.from!]}T00:00:00Z`)
      base.setUTCDate(base.getUTCDate() + prov.days!)
      expect(vals[key], key).toBe(base.toISOString().slice(0, 10))
    }
  })

  it('policy constants name their evidence; unsourced ones say so', () => {
    for (const [key, prov] of Object.entries(P)) {
      if (prov.kind === 'policy_constant') expect(prov.evidence, key).toBeTruthy()
      if (prov.kind === 'unsourced') expect(prov.note, key).toBeTruthy()
    }
  })
})
