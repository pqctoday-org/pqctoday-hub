// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  isShortThreatQuery,
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
      { industry: 'Hardware Security Modules' },
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
    // HSM is its own sector — its label and slug land on it, not on Cross-Industry.
    expect(resolveIndustryParam('Hardware Security Modules', rows)).toEqual([
      'Hardware Security Modules',
    ])
    expect(resolveIndustryParam('hardware-security-modules', rows)).toEqual([
      'Hardware Security Modules',
    ])
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

  it('matches short queries (≤4 chars) at word starts only — "PCI" no longer finds "EPCIS" (UX-16)', () => {
    const base = {
      industry: 'Healthcare / Pharmaceutical',
      criticality: 'High' as const,
      cryptoAtRisk: '',
      pqcReplacement: '',
      mainSource: '',
      sourceUrl: '',
      relatedModules: [],
    }
    const epcis: ThreatItem = {
      ...base,
      threatId: 'HLTH-005',
      description: 'Drug supply-chain traceability via EPCIS event signatures.',
    }
    const pci: ThreatItem = {
      ...base,
      industry: 'Payment Card Industry',
      threatId: 'PCI-002',
      description: 'PCI DSS cardholder-data encryption.',
    }
    expect(matchesThreatQuery(epcis, 'PCI')).toBe(false)
    expect(matchesThreatQuery(pci, 'PCI')).toBe(true)
    expect(matchesThreatQuery(pci, 'pci-0')).toBe(true) // word start, hyphen inside the query
    // Word-start, not whole-word: an acronym still finds its plural.
    expect(matchesThreatQuery({ ...pci, description: 'HSMs at issuers' }, 'HSM')).toBe(true)
    // Longer queries keep plain substring matching.
    expect(matchesThreatQuery(epcis, 'epcis')).toBe(true)
    expect(matchesThreatQuery(epcis, 'raceab')).toBe(true)
    expect(isShortThreatQuery('PCI')).toBe(true)
    expect(isShortThreatQuery('EPCIS')).toBe(false)
    expect(isShortThreatQuery('  ')).toBe(false)
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
