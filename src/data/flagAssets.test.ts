// SPDX-License-Identifier: GPL-3.0-only
/**
 * Every flag the site asks for must exist under public/flags/.
 *
 * CountryFlag renders `/flags/<code>.svg` and silently falls back to the text
 * code on a 404, so a missing file never fails a build or a test — it just
 * shows "SA" where a flag should be. That is how 19 timeline flags went
 * missing from 4.88.0 until 2026-09-27 with nothing noticing. This test is the
 * guard: it reads the codes from the same sources the UI uses.
 */
import { describe, expect, it } from 'vitest'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { DATA_FILENAMES } from './generated/dataFilenames.generated'
import { FLAG_CODE_MAP } from '../components/Leaders/leadersConstants'

const ROOT = path.resolve(__dirname, '../..')
const FLAGS_DIR = path.join(ROOT, 'public', 'flags')
const hasFlag = (code: string) =>
  fs.existsSync(path.join(FLAGS_DIR, `${code.trim().toLowerCase()}.svg`))

describe('flag assets', () => {
  it('every FlagCode in the live timeline CSV has a public/flags/<code>.svg', () => {
    const file = DATA_FILENAMES.timeline
    expect(file, 'no timeline CSV registered in dataFilenames').toBeTruthy()
    const csv = fs.readFileSync(path.join(ROOT, 'src', 'data', file as string), 'utf-8')
    const rows = Papa.parse<Record<string, string>>(csv, {
      header: true,
      skipEmptyLines: true,
    }).data
    const codes = [...new Set(rows.map((r) => (r.FlagCode || '').trim()).filter(Boolean))]
    expect(codes.length).toBeGreaterThan(0)
    const missing = codes.filter((c) => !hasFlag(c))
    expect(missing, `timeline flags missing from public/flags: ${missing.join(', ')}`).toEqual([])
  })

  it('every code in the leaders FLAG_CODE_MAP has a public/flags/<code>.svg', () => {
    const missing = [...new Set(Object.values(FLAG_CODE_MAP))].filter((c) => !hasFlag(c))
    expect(missing, `leader flags missing from public/flags: ${missing.join(', ')}`).toEqual([])
  })
})
