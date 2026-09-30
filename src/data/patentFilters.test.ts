// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import {
  filterByPatentLinkParams,
  inventorMatches,
  parsePatentIds,
  patentIdMatches,
} from './patentFilters'
import { filterPatents } from '@/components/Patents/usePatentResults'
import { patentsData } from './patentsData'
import type { PatentItem } from '@/types/PatentTypes'

const p = (patentNumber: string, inventors: string) => ({ patentNumber, inventors }) as PatentItem

describe('patentFilters', () => {
  it('inventorMatches compares word sets, order-independent, ignoring "et al."', () => {
    expect(inventorMatches('Smith; John et al.', 'John Smith')).toBe(true)
    expect(inventorMatches('Smith; John et al.', 'smith')).toBe(true)
    expect(inventorMatches('Smith; John et al.', 'Jane Smith')).toBe(false)
    expect(inventorMatches('Smith; John', '  ')).toBe(false)
  })

  it('patent ids match US-prefixed or bare', () => {
    const wanted = parsePatentIds(' US123 , 456,')
    expect([...wanted]).toEqual(['US123', '456'])
    expect(patentIdMatches('US123', wanted)).toBe(true)
    expect(patentIdMatches('US456', wanted)).toBe(true)
    expect(patentIdMatches('US789', wanted)).toBe(false)
  })

  it('filterByPatentLinkParams: empty values are off, both filters combine', () => {
    const data = [p('US1', 'Smith; John'), p('US2', 'Doe; Jane'), p('US3', 'Smith; Anna')]
    expect(filterByPatentLinkParams(data, '', '')).toBe(data)
    expect(filterByPatentLinkParams(data, 'Smith', '').map((x) => x.patentNumber)).toEqual([
      'US1',
      'US3',
    ])
    expect(filterByPatentLinkParams(data, 'Smith', '3').map((x) => x.patentNumber)).toEqual(['US3'])
    expect(filterByPatentLinkParams(data, '', ',')).toEqual([])
  })

  it('selects exactly what desktop filterPatents selects on the real corpus', () => {
    const withInventor = patentsData.find((x) => x.inventors.includes(';'))!
    const cases: [string, string][] = [
      [withInventor.inventors, ''],
      [
        '',
        patentsData
          .slice(0, 3)
          .map((x) => x.patentNumber.replace(/^US/, ''))
          .join(','),
      ],
      [withInventor.inventors, `${withInventor.patentNumber},${patentsData[5].patentNumber}`],
    ]
    for (const [inventor, patentIds] of cases) {
      const sp = new URLSearchParams()
      if (inventor) sp.set('inventor', inventor)
      if (patentIds) sp.set('patentIds', patentIds)
      const desktop = filterPatents(patentsData, sp)
      expect(desktop.length).toBeGreaterThan(0)
      expect(filterByPatentLinkParams(patentsData, inventor, patentIds)).toEqual(desktop)
    }
  })
})
