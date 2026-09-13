// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Regression test for the DS03 prefix-collision bug found 2026-09-13:
 * `compliance_xwalk_candidates_*.csv` (a deliberately separate, non-`id`-keyed
 * pipeline output — see merge-xwalk-candidates.ts) was being scooped into the
 * `compliance_` (compliance-landscape) family's self-containment comparison
 * because latestGenerations() matched on a bare `startsWith(prefix)`.
 */
import { describe, it, expect, afterEach } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { setDataDir, getDataDir } from '../data-loader.js'
import { runSelfContainmentChecks } from '../self-containment-checks.js'

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

const COMPLIANCE_HEADER = 'id,label,status\n'

describe('self-containment-checks: compliance_ family vs sibling-prefix collisions', () => {
  it('does not compare a sibling compliance_xwalk_candidates_ file against the real compliance_ family', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds03-collision-'))
    setDataDir(tmpDir)

    // Real compliance-landscape family: two generations, self-contained.
    write(tmpDir, 'compliance_09012026.csv', COMPLIANCE_HEADER + 'a,A,active\nb,B,active\n')
    write(tmpDir, 'compliance_09022026.csv', COMPLIANCE_HEADER + 'a,A,active\nb,B,active\n')

    // A sibling family that happens to extend the same string prefix, dated
    // LATER than the real family's latest generation — exactly the shape
    // that fooled a bare startsWith() into treating it as compliance_'s own
    // newest snapshot.
    write(
      tmpDir,
      'compliance_xwalk_candidates_09132026.csv',
      'from_concept,to_concept,review_status\nNIST,FIPS 203,candidate\n'
    )

    const [ds03] = runSelfContainmentChecks()
    expect(ds03.id).toBe('DS03')
    expect(ds03.status).toBe('PASS')
    expect(ds03.findings).toHaveLength(0)
  })

  it('still catches a genuine dropped row within the real compliance_ family', () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ds03-real-drop-'))
    setDataDir(tmpDir)

    write(tmpDir, 'compliance_09012026.csv', COMPLIANCE_HEADER + 'a,A,active\nb,B,active\n')
    // "b" silently missing from the next generation — a real DS03 defect.
    write(tmpDir, 'compliance_09022026.csv', COMPLIANCE_HEADER + 'a,A,active\n')

    const [ds03] = runSelfContainmentChecks()
    expect(ds03.status).toBe('FAIL')
    expect(ds03.findings).toHaveLength(1)
    expect(ds03.findings[0].value).toBe('b')
  })
})
