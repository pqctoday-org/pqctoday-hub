// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  isThreatsDeepLink,
  matchesThreatQuery,
  resolveIndustryParam,
  threatClassParam,
  threatIdParam,
  wantsHorizonView,
} from './threatsUrlParams'
import type { ThreatItem } from '@/data/threatsData'

const p = (s: string) => new URLSearchParams(s)

describe('threatsUrlParams', () => {
  it('reads ?id=, and the legacy ?threat= alias old Endorse/Flag links carried', () => {
    expect(threatIdParam(p('id=FIN-001'))).toBe('FIN-001')
    expect(threatIdParam(p('threat=FIN-002'))).toBe('FIN-002')
    expect(threatIdParam(p('id=FIN-001&threat=FIN-002'))).toBe('FIN-001')
    expect(threatIdParam(p(''))).toBeNull()
  })

  it('resolves ?industry= case-insensitively, through the page’s merged labels, dropping unknowns', () => {
    const rows = [
      { industry: 'Finance & Banking' },
      { industry: 'Critical Infrastructure / Energy' },
    ]
    expect(resolveIndustryParam('finance & banking', rows)).toEqual(['Finance & Banking'])
    // A raw CSV label the page merges still lands on the merged label.
    expect(resolveIndustryParam('Critical Infrastructure', rows)).toEqual([
      'Critical Infrastructure / Energy',
    ])
    expect(resolveIndustryParam('Energy / Critical Infrastructure,Nope', rows)).toEqual([
      'Critical Infrastructure / Energy',
    ])
    expect(resolveIndustryParam(null, rows)).toEqual([])
  })

  it('accepts only real threat classes for ?class=', () => {
    expect(threatClassParam(p('class=hndl'))).toBe('hndl')
    expect(threatClassParam(p('class=HNFL'))).toBe('hnfl')
    expect(threatClassParam(p('class=both'))).toBe('both')
    expect(threatClassParam(p('class=bogus'))).toBeNull()
  })

  it('matches the page’s lexical search fields', () => {
    const t = {
      threatId: 'FIN-001',
      description: 'Settlement data harvest',
      industry: 'Finance & Banking',
      cryptoAtRisk: 'RSA-2048',
      pqcReplacement: 'ML-KEM-768',
    } as ThreatItem
    expect(matchesThreatQuery(t, 'settlement')).toBe(true)
    expect(matchesThreatQuery(t, 'ml-kem')).toBe(true)
    expect(matchesThreatQuery(t, 'healthcare')).toBe(false)
    expect(matchesThreatQuery(t, '  ')).toBe(true)
  })

  it('reads ?view=horizon', () => {
    expect(wantsHorizonView(p('view=horizon'))).toBe(true)
    expect(wantsHorizonView(p('view=list'))).toBe(false)
  })

  it('treats /threats with a content parameter as a deep link — nothing else', () => {
    expect(isThreatsDeepLink('/threats', '?id=FIN-001')).toBe(true)
    expect(isThreatsDeepLink('/threats/', '?threat=FIN-001')).toBe(true)
    expect(isThreatsDeepLink('/threats', '?industry=Insurance')).toBe(true)
    expect(isThreatsDeepLink('/threats', '?q=hndl')).toBe(true)
    expect(isThreatsDeepLink('/threats', '?class=hnfl')).toBe(true)
    expect(isThreatsDeepLink('/threats', '')).toBe(false)
    expect(isThreatsDeepLink('/threats', '?mode=cards')).toBe(false)
    expect(isThreatsDeepLink('/timeline', '?id=FIN-001')).toBe(false)
  })
})
