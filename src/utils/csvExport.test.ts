// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { csvFilename, csvPreambleLine, escapeCsvField, generateCsv } from './csvExport'

describe('escapeCsvField', () => {
  it.each(['=SUM(A1:A2)', '+1', '-1+2', '@cmd', '\tx', '\rx'])(
    'prefixes an apostrophe to text starting with a formula trigger: %j',
    (value) => {
      const out = escapeCsvField(value)
      // Quoted when the text also holds a CR; the guard comes first either way.
      expect(out.replace(/^"/, '').startsWith(`'`)).toBe(true)
    }
  )

  it('leaves ordinary text and numbers alone', () => {
    expect(escapeCsvField('ML-KEM-768')).toBe('ML-KEM-768')
    expect(escapeCsvField(-5)).toBe('-5')
    expect(escapeCsvField(1184)).toBe('1184')
    expect(escapeCsvField(true)).toBe('true')
  })

  it('quotes commas, quotes and newlines per RFC 4180', () => {
    expect(escapeCsvField('a,b')).toBe('"a,b"')
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""')
    expect(escapeCsvField('a\nb')).toBe('"a\nb"')
  })

  it('guards and quotes in the same cell', () => {
    expect(escapeCsvField('=HYPERLINK("x","y")')).toBe(`"'=HYPERLINK(""x"",""y"")"`)
  })
})

describe('csvPreambleLine', () => {
  it('always writes one quoted cell with CSV (not JSON) escaping', () => {
    expect(csvPreambleLine('Scope: 3 rows')).toBe('"Scope: 3 rows"')
    expect(csvPreambleLine('search=say "hi", now')).toBe('"search=say ""hi"", now"')
    expect(csvPreambleLine('back\\slash')).toBe('"back\\slash"')
  })

  it('guards user text that starts with a formula trigger and flattens newlines', () => {
    expect(csvPreambleLine('=1+1')).toBe(`"'=1+1"`)
    expect(csvPreambleLine('line one\nline two')).toBe('"line one line two"')
  })
})

describe('generateCsv', () => {
  it('guards formula-looking cells but keeps numbers numeric', () => {
    const csv = generateCsv(
      [{ name: '=cmd|calc', size: -1 }],
      [
        { header: 'Name', accessor: (r: { name: string; size: number }) => r.name },
        { header: 'Size', accessor: (r: { name: string; size: number }) => r.size },
      ]
    )
    expect(csv.split('\n')[1]).toBe(`'=cmd|calc,-1`)
  })
})

describe('csvFilename', () => {
  it('uses the local calendar date', () => {
    expect(csvFilename('x', new Date(2026, 9, 17, 0, 30))).toBe('x-2026-10-17.csv')
  })
})
