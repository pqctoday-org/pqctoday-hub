// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { computePatentKpis } from './usePatentKpis'
import type { PatentItem } from '@/types/PatentTypes'

// Minimal stand-ins — computePatentKpis only reads these fields.
const p = (over: Partial<PatentItem>): PatentItem =>
  ({
    impactLevel: 'Low',
    quantumRelevance: 'none',
    nistRoundStatus: [],
    assignee: '',
    ...over,
  }) as PatentItem

describe('computePatentKpis', () => {
  it('counts high impact, core-invention quantum, FIPS mapping and the top assignee', () => {
    const patents = [
      p({ impactLevel: 'High', assignee: 'IBM', quantumRelevance: 'core_invention' }),
      p({
        impactLevel: 'High',
        assignee: 'IBM',
        nistRoundStatus: [{ status: 'fips_203' }] as PatentItem['nistRoundStatus'],
      }),
      p({ impactLevel: 'Low', assignee: 'Google' }),
      p({ impactLevel: 'Medium', assignee: 'IBM' }),
    ]
    const k = computePatentKpis(patents)
    expect(k.inScope).toBe(4)
    expect(k.highImpact.count).toBe(2)
    expect(k.highImpact.pct).toBe(50)
    expect(k.coreQuantum).toBe(1)
    expect(k.fipsMapped).toBe(1)
    expect(k.topAssignee).toEqual({ name: 'IBM', count: 3 })
  })

  it('is safe on an empty corpus', () => {
    const k = computePatentKpis([])
    expect(k.inScope).toBe(0)
    expect(k.highImpact.pct).toBe(0)
    expect(k.topAssignee).toBeNull()
  })
})
