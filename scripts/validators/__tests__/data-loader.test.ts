// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Regression test for the findLatestCSV prefix-collision bug found
 * 2026-09-13 (same root cause as self-containment-checks.test.ts's DS03
 * case): a sibling family whose name extends another family's prefix as a
 * string — e.g. `compliance_xwalk_candidates_*.csv` vs the `compliance_`
 * family — must never be picked up as that family's own latest generation.
 */
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setDataDir, getDataDir, findLatestCSV } from '../data-loader.js'

const REAL_DATA_DIR = getDataDir()
let tmpDir: string | null = null

afterEach(() => {
  setDataDir(REAL_DATA_DIR)
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true })
    tmpDir = null
  }
})

function write(dir: string, name: string, content: string) {
  fs.writeFileSync(path.join(dir, name), content)
}

describe('findLatestCSV: prefix collision with a sibling family', () => {
  it('ignores a later-dated sibling file whose name extends the prefix as a string', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'find-latest-csv-collision-'))
    setDataDir(tmpDir)

    write(tmpDir, 'compliance_09122026_r1.csv', 'id,label\na,A\n')
    // Dated LATER than the real family's own file, but a genuinely
    // different, unrelated pipeline output.
    write(
      tmpDir,
      'compliance_xwalk_candidates_09132026.csv',
      'from_concept,to_concept\nNIST,FIPS 203\n'
    )

    const found = findLatestCSV('compliance_', tmpDir)
    expect(found?.path).toBe(path.join(tmpDir, 'compliance_09122026_r1.csv'))
  })

  it('still finds the genuinely latest generation within the real family', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'find-latest-csv-real-'))
    setDataDir(tmpDir)

    write(tmpDir, 'compliance_09012026.csv', 'id,label\na,A\n')
    write(tmpDir, 'compliance_09122026_r1.csv', 'id,label\na,A\nb,B\n')

    const found = findLatestCSV('compliance_', tmpDir)
    expect(found?.path).toBe(path.join(tmpDir, 'compliance_09122026_r1.csv'))
  })
})
