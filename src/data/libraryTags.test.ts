// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Library's industry and place tags stay on their lists.
 *
 * `applicable_industries` carries only the industry landscape's own industry
 * names, and `region_scope` carries only place codes the Library knows how to
 * label (an ISO country code, or a region group such as PQC-REGION-EU). A value
 * outside those lists would show up as its own filter entry and match nothing
 * else, so a new spelling has to be a deliberate change here, not a typo in the
 * data. Active rows only: retired rows keep the words they were retired with.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { DATA_FILENAMES } from './generated/dataFilenames.generated'
import { getLandscapeIndustries } from './industryLandscapeData'
import { GEO_OVERLAY_LABELS, REGION_LABELS } from '@/components/Library/redesign/libraryRegions'
import pqcVocabOverlay from './pqc-vocab-overlay.json'

interface Row {
  reference_id?: string
  applicable_industries?: string
  region_scope?: string
  status?: string
}

function readRows<T>(file: string | null | undefined, what: string): T[] {
  if (!file) throw new Error(`DATA_FILENAMES.${what} is null; run generate:data-filenames`)
  const csv = fs.readFileSync(path.join(__dirname, file), 'utf8')
  return Papa.parse<T>(csv, { header: true, skipEmptyLines: true }).data
}

const activeRows = readRows<Row>(DATA_FILENAMES.library, 'library').filter(
  (r) => (r.status ?? 'active').trim().toLowerCase() === 'active'
)

/** The newest jurisdictions_MMDDYYYY[_rN].csv (the registry the site loads). */
function newestJurisdictionsFile(): string {
  const stamp = (name: string): string => {
    const m = /^jurisdictions_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(name)
    return m ? `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(4, '0')}` : ''
  }
  const files = fs.readdirSync(__dirname).filter((f) => stamp(f))
  return files.sort((a, b) => stamp(a).localeCompare(stamp(b))).pop() as string
}

function tokens(cell: string | undefined): string[] {
  return (cell ?? '')
    .split(';')
    .map((t) => t.trim())
    .filter(Boolean)
}

describe('library tags stay on their lists', () => {
  it('every applicable_industries token is an industry landscape industry name', () => {
    const industries = new Set(getLandscapeIndustries())
    expect(industries.size).toBe(24)
    const off = activeRows.flatMap((r) =>
      tokens(r.applicable_industries)
        .filter((t) => !industries.has(t))
        .map((t) => `${r.reference_id}: ${t}`)
    )
    expect(off, `off-list industries:\n  ${off.join('\n  ')}`).toEqual([])
  })

  it('every region_scope token is a known place code or region group', () => {
    const off = activeRows.flatMap((r) =>
      tokens(r.region_scope)
        .filter((t) => !REGION_LABELS.has(t) && !GEO_OVERLAY_LABELS.has(t))
        .map((t) => `${r.reference_id}: ${t}`)
    )
    expect(off, `unknown places:\n  ${off.join('\n  ')}`).toEqual([])
  })

  it('names each place once: no group tokens that stand for member countries', () => {
    // Five Eyes, G7 and NATO were written out as their member countries.
    const groups = new Set(['G7', 'NATO', 'PQC-REGION-FIVEEYES'])
    const used = activeRows.flatMap((r) =>
      tokens(r.region_scope)
        .filter((t) => groups.has(t))
        .map((t) => `${r.reference_id}: ${t}`)
    )
    expect(used, `group tokens:\n  ${used.join('\n  ')}`).toEqual([])
  })
})

describe('region groups agree with the jurisdiction registry', () => {
  const registry = readRows<{ code?: string; region?: string; status?: string }>(
    newestJurisdictionsFile(),
    'jurisdictions'
  ).filter((j) => (j.status ?? 'active').trim() === 'active' && j.code !== 'EU')
  const membersOf = (...regions: string[]) =>
    registry.filter((j) => regions.includes(j.region ?? '')).map((j) => j.code)
  const groupMembers = (code: string) =>
    (pqcVocabOverlay.geography as Array<{ code: string; maps_to: string | string[] | null }>).find(
      (g) => g.code === code
    )?.maps_to

  it.each([
    ['PQC-REGION-EUROPE', ['eu', 'europe-noneu']],
    ['PQC-REGION-AMERICAS', ['americas']],
    ['PQC-REGION-APAC', ['apac']],
    ['PQC-REGION-MEA', ['mena', 'africa']],
  ])('%s lists exactly the registry countries of its regions', (code, regions) => {
    const expected = membersOf(...regions)
    expect([...(groupMembers(code) as string[])].sort()).toEqual([...expected].sort())
  })
})
