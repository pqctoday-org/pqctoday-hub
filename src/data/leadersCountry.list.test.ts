import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { isLeaderCountryOnList } from './leaderCountry'

/** Owner, 25 Nov 2026 ("Fix at source, then refuse"): the leaders file holds only countries from the list. */
const dir = join(process.cwd(), 'src', 'data')
const files = readdirSync(dir)
  .map((f) => ({ f, m: /^leaders_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/.exec(f) }))
  .filter((x) => x.m)
  .sort((a, b) =>
    `${a.m![3]}${a.m![1]}${a.m![2]}${String(a.m![4] ?? 0).padStart(4, '0')}`.localeCompare(
      `${b.m![3]}${b.m![1]}${b.m![2]}${String(b.m![4] ?? 0).padStart(4, '0')}`
    )
  )

function parseRows(text: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (c === '"') q = false
      else cell += c
    } else if (c === '"') q = true
    else if (c === ',') {
      row.push(cell)
      cell = ''
    } else if (c === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else if (c !== '\r') cell += c
  }
  if (cell || row.length) {
    row.push(cell)
    rows.push(row)
  }
  const head = rows[0]
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i] ?? ''])))
}

describe('the newest leaders file', () => {
  const newest = files[files.length - 1]
  const rows = parseRows(readFileSync(join(dir, newest.f), 'utf8'))

  it('has a Country column', () => {
    expect(Object.keys(rows[0])).toContain('Country')
  })

  it('holds only countries from the list on active rows (a jurisdiction name or code, ";"-joined for two)', () => {
    const off = rows
      .filter((r) => !isLeaderCountryOnList(r.Country))
      .map((r) => `${r.Name}: ${r.Country}`)
    expect(off).toEqual([])
  })
})
