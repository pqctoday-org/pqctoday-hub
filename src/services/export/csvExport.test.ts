// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { rowsToCsv } from './csvExport'

describe('rowsToCsv (RFC-4180)', () => {
  it('joins plain cells with commas and CRLF rows', () => {
    expect(rowsToCsv([
      ['Framework', 'Deadline', 'Status'],
      ['CNSA 2.0', '2033', 'On track'],
    ])).toBe('Framework,Deadline,Status\r\nCNSA 2.0,2033,On track')
  })

  it('quotes cells containing a comma, quote, or newline', () => {
    expect(rowsToCsv([['a,b', 'c"d', 'e\nf']])).toBe('"a,b","c""d","e\nf"')
  })

  it('coerces numbers and renders null/undefined as empty', () => {
    expect(rowsToCsv([[1, 2.5, null as unknown as string, undefined as unknown as string]])).toBe(
      '1,2.5,,'
    )
  })

  it('returns an empty string for no rows', () => {
    expect(rowsToCsv([])).toBe('')
  })
})
