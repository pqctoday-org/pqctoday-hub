// SPDX-License-Identifier: AGPL-3.0-only
/**
 * A glossary term's home lesson is stored in one place.
 *
 * A term whose link (`relatedModule`) leads to a Learn lesson already names its lesson there. A term
 * whose link leads to another page (Library, Algorithms, Migrate, ...) may carry its lesson in the
 * separate `module_ids` field instead. The two never overlap, and every `module_ids` value is a lesson
 * the Hub has. The field is not shown on the page, so the link a visitor follows never changes.
 */
import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import algorithms from './glossary/algorithms.json'
import protocols from './glossary/protocols.json'
import standards from './glossary/standards.json'
import concepts from './glossary/concepts.json'
import organizations from './glossary/organizations.json'
import pkcs11 from './glossary/pkcs11.json'

interface RawTerm {
  id: string
  term: string
  relatedModule?: string
  module_ids?: unknown
}

const terms = [
  ...algorithms,
  ...protocols,
  ...standards,
  ...concepts,
  ...organizations,
  ...pkcs11,
] as RawTerm[]

/** The newest `learn_modules_MMDDYYYY[_rN].csv` in this folder (the file the lessons list is read from). */
function newestLearnModules(): string {
  const re = /^learn_modules_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/
  const stamp = (name: string): string => {
    const m = re.exec(name)
    return m ? `${m[3]}${m[1]}${m[2]}${(m[4] ?? '0').padStart(4, '0')}` : ''
  }
  const files = fs.readdirSync(__dirname).filter((f) => stamp(f))
  return files.sort((a, b) => stamp(a).localeCompare(stamp(b))).pop() as string
}

const lessons = new Set(
  Papa.parse<Record<string, string>>(
    fs.readFileSync(path.join(__dirname, newestLearnModules()), 'utf8'),
    { header: true, skipEmptyLines: true }
  )
    .data.filter((r) => (r.status ?? 'active').trim().toLowerCase() !== 'deprecated')
    .map((r) => (r.module_id ?? '').trim())
    .filter(Boolean)
)

const isLessonLink = (link: string | undefined): boolean => (link ?? '').startsWith('/learn/')

/** Why a `module_ids` value is off-list, or null. Ids are `;`-joined, no spaces, no repeats. */
function moduleProblem(value: unknown, active: Set<string>): string | null {
  if (typeof value !== 'string') return 'not a string'
  const ids = value.split(';')
  if (ids.some((t) => !t || t !== t.trim())) return 'empty or padded token'
  if (new Set(ids).size !== ids.length) return 'repeated id'
  const off = ids.filter((t) => !active.has(t))
  return off.length ? `not an active lesson: ${off.join(', ')}` : null
}

describe('glossary home lesson is stored in one place', () => {
  it('finds the lessons list', () => {
    expect(lessons.size).toBeGreaterThan(50)
    expect(lessons.has('pqc-101')).toBe(true)
  })

  it('no term has both a lesson in relatedModule and a module_ids value', () => {
    const both = terms
      .filter((t) => t.module_ids !== undefined && isLessonLink(t.relatedModule))
      .map(
        (t) => `${t.id}: relatedModule ${t.relatedModule} and module_ids ${String(t.module_ids)}`
      )
    expect(both, `a lesson named twice:\n  ${both.join('\n  ')}`).toEqual([])
  })

  it('every module_ids value is an existing active lesson', () => {
    const off = terms.flatMap((t) => {
      if (t.module_ids === undefined) return []
      const p = moduleProblem(t.module_ids, lessons)
      return p ? [`${t.id}: ${p}`] : []
    })
    expect(off, `module_ids off-list:\n  ${off.join('\n  ')}`).toEqual([])
  })

  it('refuses an off-list value (the checks above would catch it)', () => {
    expect(moduleProblem('no-such-lesson', lessons)).toMatch(/not an active lesson/)
    expect(moduleProblem('pqc-101;pqc-101', lessons)).toMatch(/repeated/)
    expect(moduleProblem('pqc-101; pqc-101', lessons)).toMatch(/padded/)
    expect(moduleProblem(['pqc-101'], lessons)).toMatch(/not a string/)
    expect(moduleProblem('pqc-101', lessons)).toBeNull()
    expect(isLessonLink('/learn/pqc-101')).toBe(true)
    expect(isLessonLink('/library?ref=FIPS 203')).toBe(false)
  })
})
