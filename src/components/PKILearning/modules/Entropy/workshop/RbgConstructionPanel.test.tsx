// SPDX-License-Identifier: GPL-3.0-only
//
// Review pass 2, M1: the RBG class panel called RBG1 "Non-Deterministic RBG"
// and RBGC a per-request consolidated construction, contradicting SP 800-90C
// §2.2 / Table 1, the corrected quiz ent-007 and sourceAssessment.ts.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import Papa from 'papaparse'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { RBG_TYPES, RbgConstructionPanel } from './RbgConstructionPanel'
import { SP800_90C_CLASSES } from './sourceAssessment'

/** The quiz loader picks the newest pqcquiz_MMDDYYYY[_rN].csv; do the same. */
function latestQuizRow(id: string): Record<string, string> {
  const dir = join(process.cwd(), 'src/data')
  const key = (f: string) => {
    const m = /^pqcquiz_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(f)
    return m ? Number(`${m[3]}${m[1]}${m[2]}`) * 1000 + Number(m[4] ?? 0) : -1
  }
  const file = readdirSync(dir)
    .filter((f) => key(f) >= 0)
    .sort((a, b) => key(a) - key(b))
    .at(-1)!
  const rows = Papa.parse<Record<string, string>>(readFileSync(join(dir, file), 'utf8'), {
    header: true,
    skipEmptyLines: true,
  }).data
  return rows.find((r) => r.id === id)!
}

describe('RbgConstructionPanel — SP 800-90C §2.2 / Table 1', () => {
  const text = RBG_TYPES.map((t) => `${t.name} ${t.title} ${t.description} ${t.flow}`).join(' ')

  it('covers exactly the six SP 800-90C classes the assessment uses', () => {
    expect(RBG_TYPES.flatMap((t) => [...t.classes]).sort()).toEqual([...SP800_90C_CLASSES].sort())
  })

  it('never calls RBG1 non-deterministic or an NRBG', () => {
    expect(text).not.toMatch(/non-deterministic/i)
    expect(text).not.toMatch(/\bNRBG\b/)
  })

  it('describes RBG1, RBG2, RBG3 and RBGC the way SP 800-90C and quiz ent-007 do', () => {
    const byName = (n: string) => RBG_TYPES.find((t) => t.name.startsWith(n))!.description
    expect(byName('RBG1')).toContain(
      'does not have access to a randomness source after instantiation'
    )
    expect(byName('RBG1')).toMatch(/does not support reseeding/)
    expect(byName('RBG2')).toMatch(/cannot provide full-entropy output/)
    expect(byName('RBG3')).toMatch(/full entropy/)
    expect(byName('RBGC')).toMatch(/tree of RBGs/)
    expect(byName('RBGC')).not.toMatch(/per-request/)

    const quiz = latestQuizRow('ent-007').explanation
    expect(quiz).toMatch(/RBG1 has no randomness source after instantiation/)
    expect(quiz).toMatch(/RBG2\(NP\)/)
    expect(quiz).toMatch(/RBGC is a tree of RBGs/)
    expect(quiz).not.toMatch(/non-deterministic/i)
  })

  it('renders every class when expanded', () => {
    render(<RbgConstructionPanel />)
    fireEvent.click(screen.getByRole('button', { name: /SP 800-90C RBG Construction Types/ }))
    for (const t of RBG_TYPES) expect(screen.getByText(t.name)).toBeInTheDocument()
    expect(screen.queryByText(/Non-Deterministic/)).toBeNull()
  })
})
