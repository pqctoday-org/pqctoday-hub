// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { filterPatents } from './usePatentResults'
import type { PatentItem } from '@/types/PatentTypes'

function patent(overrides: Partial<PatentItem>): PatentItem {
  return {
    patentNumber: 'US12345678',
    title: 'Test Patent',
    inventors: 'Kiyomura; Yutaro et al.',
    assignee: 'Acme Corp',
    summary: '',
    primaryInventiveClaim: '',
    cryptoAgilityMode: 'pqc_only',
    applicationDomain: [],
    impactLevel: 'Low',
    quantumTechnology: [],
    quantumRelevance: 'core_invention',
    protocols: [],
    classicalAlgorithms: [],
    hardwareComponents: [],
    nistRoundStatus: [],
    pqcAlgorithms: [],
    filingYear: 2025,
    issueDate: '2025-01-01',
    priorityDate: '2025-01-01',
    impactScore: 0,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(overrides as any),
  } as PatentItem
}

describe('filterPatents — inventor filter (order-independent word-set match)', () => {
  it('matches a normal-order name against the inverted USPTO field', () => {
    const patents = [patent({ inventors: 'Kiyomura; Yutaro et al.' })]
    const params = new URLSearchParams({ inventor: 'Yutaro Kiyomura' })
    expect(filterPatents(patents, params)).toHaveLength(1)
  })

  it('does not match an unrelated name', () => {
    const patents = [patent({ inventors: 'Kiyomura; Yutaro et al.' })]
    const params = new URLSearchParams({ inventor: 'Someone Else' })
    expect(filterPatents(patents, params)).toHaveLength(0)
  })

  it('strips "et al." before comparing', () => {
    const patents = [patent({ inventors: 'Bickerstaff, III; George William' })]
    const params = new URLSearchParams({ inventor: 'George William Bickerstaff' })
    expect(filterPatents(patents, params)).toHaveLength(1)
  })
})

describe('filterPatents — patentIds filter (leader-detail link, exact + reliable)', () => {
  it('matches on the bare patent_number against a US-prefixed patentNumber', () => {
    const patents = [patent({ patentNumber: 'US20250392439' })]
    const params = new URLSearchParams({ patentIds: '20250392439' })
    expect(filterPatents(patents, params)).toHaveLength(1)
  })

  it('matches multiple comma-separated ids, order-independent', () => {
    const patents = [
      patent({ patentNumber: 'US11025407' }),
      patent({ patentNumber: 'US20210273779' }),
      patent({ patentNumber: 'US99999999' }),
    ]
    const params = new URLSearchParams({ patentIds: '20210273779,11025407' })
    expect(filterPatents(patents, params).map((p) => p.patentNumber)).toEqual([
      'US11025407',
      'US20210273779',
    ])
  })

  it('does not falsely match a nickname the way a fuzzy inventor filter could', () => {
    // Regression: "Dr. Burt Kaliski Jr." (display name) vs the patent's raw
    // "Burton S. KALISKI, JR." would fail a word-set inventor match ("Burt" !=
    // "Burton") — patentIds sidesteps that entirely by using the known,
    // already-verified patent_number list instead of re-deriving from a name.
    const patents = [
      patent({ patentNumber: 'US20250392439', inventors: 'KALISKI, JR.; Burton S.' }),
    ]
    const params = new URLSearchParams({ patentIds: '20250392439' })
    expect(filterPatents(patents, params)).toHaveLength(1)
  })
})
