// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The patents' organising columns stay on their lists.
 *
 * `module_ids` names the Learn module(s) a patent is named in; `industries` names
 * industry-landscape industries (`; `-joined, at most three, `Cross-Industry` only
 * on its own). A value outside those lists would not match any lesson or industry
 * filter, so the check runs over the newest patents file and over what the loader
 * hands the page. Blank cells are allowed: most patents carry no tag.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { getLandscapeIndustries } from './industryLandscapeData'
import { patentsData } from './patentsData'

const CROSS = 'Cross-Industry'
const MAX_INDUSTRIES = 3

/** The newest `<prefix>_MMDDYYYY[_rN].csv` in this folder (the file the loaders read). */
function newestDated(prefix: string): string {
  const re = new RegExp(`^${prefix}_(\\d{2})(\\d{2})(\\d{4})(?:_r(\\d+))?\\.csv$`)
  const stamp = (name: string): string => {
    const m = re.exec(name)
    return m ? `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(4, '0')}` : ''
  }
  const files = fs.readdirSync(__dirname).filter((f) => stamp(f))
  return files.sort((a, b) => stamp(a).localeCompare(stamp(b))).pop() as string
}

function readCsv(file: string): Array<Record<string, string>> {
  const text = fs.readFileSync(path.join(__dirname, file), 'utf8')
  return Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true }).data
}

/** Why a `module_ids` cell is off-list, or null. Tokens are `;`-joined, no repeats. */
function moduleProblem(cell: string, lessons: Set<string>): string | null {
  const ids = cell.split(';').map((t) => t.trim())
  if (ids.some((t) => !t)) return 'empty token'
  if (new Set(ids).size !== ids.length) return 'repeated id'
  const off = ids.filter((t) => !lessons.has(t))
  return off.length ? `not a Learn module: ${off.join(', ')}` : null
}

/** Why an `industries` cell is off-list, or null. Tokens are `; `-joined (the Library's form). */
function industryProblem(cell: string, names: Set<string>): string | null {
  const items = cell.split('; ')
  if (items.some((t) => !t.trim() || t !== t.trim())) return 'bad separator'
  if (new Set(items).size !== items.length) return 'repeated industry'
  const off = items.filter((t) => !names.has(t))
  if (off.length) return `not an industry name: ${off.join(', ')}`
  if (items.includes(CROSS) && items.length > 1) return `${CROSS} stands alone`
  if (items.length > MAX_INDUSTRIES) return `more than ${MAX_INDUSTRIES} industries`
  return null
}

const lessons = new Set(
  readCsv(newestDated('learn_modules'))
    .map((r) => (r.module_id ?? '').trim())
    .filter(Boolean)
)
const industryNames = new Set(getLandscapeIndustries())
const patentRows = readCsv(newestDated('patents'))

describe('patent organising columns stay on their lists', () => {
  it('the industry list is the 24 landscape names, Cross-Industry among them', () => {
    expect(industryNames.size).toBe(24)
    expect(industryNames.has(CROSS)).toBe(true)
  })

  it('every module_ids cell names real Learn modules only', () => {
    const off = patentRows.flatMap((r) => {
      const p = (r.module_ids ?? '').trim() ? moduleProblem(r.module_ids, lessons) : null
      return p ? [`${r.patent_number}: ${p}`] : []
    })
    expect(off, `module_ids off-list:\n  ${off.join('\n  ')}`).toEqual([])
  })

  it('every industries cell names listed industries, Cross-Industry alone, at most three', () => {
    const off = patentRows.flatMap((r) => {
      const p = (r.industries ?? '').trim() ? industryProblem(r.industries, industryNames) : null
      return p ? [`${r.patent_number}: ${p}`] : []
    })
    expect(off, `industries off-list:\n  ${off.join('\n  ')}`).toEqual([])
  })

  it('the loader hands the page the same tags, as arrays', () => {
    for (const item of patentsData) {
      for (const m of item.moduleIds ?? [])
        expect(lessons.has(m), `${item.patentNumber} ${m}`).toBe(true)
      for (const i of item.industries ?? [])
        expect(industryNames.has(i), `${item.patentNumber} ${i}`).toBe(true)
      if ((item.industries ?? []).includes(CROSS)) expect(item.industries).toEqual([CROSS])
    }
  })

  it('refuses an off-list value (the check above would catch it)', () => {
    expect(industryProblem('Finance and Banking', industryNames)).toMatch(/not an industry name/)
    expect(industryProblem(`${CROSS}; Finance & Banking`, industryNames)).toMatch(/stands alone/)
    const four = [...industryNames]
      .filter((n) => n !== CROSS)
      .slice(0, 4)
      .join('; ')
    expect(industryProblem(four, industryNames)).toMatch(/more than 3/)
    expect(moduleProblem('no-such-lesson', lessons)).toMatch(/not a Learn module/)
  })
})
