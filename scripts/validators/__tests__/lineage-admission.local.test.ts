// SPDX-License-Identifier: GPL-3.0-only
// @vitest-environment node
/**
 * Drift guard: the hub's admissionState() must equal admit.py's. Runs only
 * where the sibling pqctoday-priv checkout exists (pre-push, dev) — CI has no
 * priv checkout, so this is a *.local.test.* suite.
 */
import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { ADMITTED_UNIFIED, REJECT_ARTEFACTS } from '../lineage-admission.js'

const ADMIT_PY = path.resolve(process.cwd(), '../pqctoday-priv/maintenance/lineage/admit.py')
const present = fs.existsSync(ADMIT_PY)

describe.skipIf(!present)('lineage-admission mirrors admit.py', () => {
  const src = present ? fs.readFileSync(ADMIT_PY, 'utf-8') : ''

  it('REJECT set is identical', () => {
    const m = src.match(/^REJECT\s*=\s*frozenset\(\{([\s\S]*?)\}\)/m)
    expect(m, 'REJECT = frozenset({...}) not found in admit.py').toBeTruthy()
    const pyRejects = [...m![1].matchAll(/"([A-Z-]+)"/g)].map((x) => x[1]).sort()
    expect([...REJECT_ARTEFACTS].sort()).toEqual(pyRejects)
  })

  it('accepted unified values are identical', () => {
    const fn = src.slice(src.indexOf('def admission_state'))
    const m = fn.match(/u not in \(([^)]*)\)/)
    expect(m, 'unified check not found in admission_state').toBeTruthy()
    const pyUnified = [...m![1].matchAll(/"([a-z]+)"/g)].map((x) => x[1]).sort()
    expect([...ADMITTED_UNIFIED].sort()).toEqual(pyUnified)
  })

  it('FORMAT-MISMATCH is still checked beside REJECT', () => {
    const fn = src.slice(src.indexOf('def admission_state'))
    expect(fn).toMatch(/a in REJECT or a == "FORMAT-MISMATCH"/)
  })
})
