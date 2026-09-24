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

  it('resolves ?industry= case-insensitively, through old labels and slugs, dropping unknowns', () => {
    const rows = [
      { industry: 'Finance & Banking' },
      { industry: 'Critical Infrastructure / OT' },
      { industry: 'Aerospace / Aviation / Space' },
      { industry: 'Cross-Industry' },
    ]
    expect(resolveIndustryParam('finance & banking', rows)).toEqual(['Finance & Banking'])
    // Old labels the page renamed (ruling R3) still land on the new label.
    for (const old of [
      'Critical Infrastructure',
      'Energy / Critical Infrastructure',
      'Critical Infrastructure / Energy',
    ]) {
      expect(resolveIndustryParam(old, rows)).toEqual(['Critical Infrastructure / OT'])
    }
    expect(resolveIndustryParam('Aerospace / Aviation', rows)).toEqual([
      'Aerospace / Aviation / Space',
    ])
    expect(resolveIndustryParam('Hardware Security Modules', rows)).toEqual(['Cross-Industry'])
    expect(resolveIndustryParam('Energy / Critical Infrastructure,Nope', rows)).toEqual([
      'Critical Infrastructure / OT',
    ])
    expect(resolveIndustryParam(null, rows)).toEqual([])
  })

  it('resolves new and old label slugs in ?industry=', () => {
    const rows = [
      { industry: 'Critical Infrastructure / OT' },
      { industry: 'Aerospace / Aviation / Space' },
    ]
    expect(resolveIndustryParam('critical-infrastructure-ot', rows)).toEqual([
      'Critical Infrastructure / OT',
    ])
    expect(resolveIndustryParam('energy-critical-infrastructure', rows)).toEqual([
      'Critical Infrastructure / OT',
    ])
    expect(resolveIndustryParam('aerospace-aviation-space,aerospace-aviation', rows)).toEqual([
      'Aerospace / Aviation / Space',
    ])
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
