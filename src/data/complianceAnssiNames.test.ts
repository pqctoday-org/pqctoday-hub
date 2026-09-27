// SPDX-License-Identifier: GPL-3.0-only
/**
 * ANSSI certificates carry the product name their own certification report
 * states (2026-09-27). The ANSSI catalogue PDF had printed ANSSI-CC-2025-26's
 * text on 2025-27's row, and its table cells produced category words, cut-off
 * names and "Unknown Product" — 12 groups of ANSSI records shared one name.
 * Two certificates may share a name only where their reports say so, and that
 * is reviewed here, one pair at a time.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

interface Rec {
  id: string
  source?: string
  productName: string
}

const records: Rec[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/compliance-data.json'), 'utf-8')
)
const anssi = records.filter((r) => r.source === 'ANSSI')

// Reviewed: both reports state this exact name (the 2023 certificate
// re-certifies the 2022 product).
const SHARED_BY_THEIR_REPORTS: string[][] = [['anssi-cc-2022-36', 'anssi-cc-2023-21']]

describe('ANSSI product names', () => {
  it('2025-26 and 2025-27 are the A01 and B01 chips, as their reports state', () => {
    const name = (id: string) => anssi.find((r) => r.id === id)?.productName
    expect(name('anssi-cc-2025-26')).toBe('Cryptographic library NESLIB 6.11.3 on ST31R480 A01')
    expect(name('anssi-cc-2025-27')).toBe('Cryptographic library NESLIB 6.11.3 on ST31R480 B01')
  })

  it('no two certificates share a name unless their reports do', () => {
    const byName = new Map<string, string[]>()
    for (const r of anssi) byName.set(r.productName, [...(byName.get(r.productName) ?? []), r.id])
    const shared = [...byName.values()].filter((ids) => ids.length > 1).map((ids) => ids.sort())
    expect(shared).toEqual(SHARED_BY_THEIR_REPORTS)
  })

  it('no name is a catalogue category or a placeholder', () => {
    const bad = anssi.filter((r) =>
      /^(Cartes à puce et dispositifs similaires|Identification, authentification et contrôle d.accès)$/.test(
        r.productName
      )
    )
    expect(bad.map((r) => r.id)).toEqual([])
    // anssi-cspn-2019-03: its report is no longer published under any known name
    expect(anssi.filter((r) => /^Unknown Product$/.test(r.productName)).map((r) => r.id)).toEqual([
      'anssi-cspn-2019-03',
    ])
  })
})
