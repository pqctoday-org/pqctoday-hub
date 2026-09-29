// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  industryAnchorFromHash,
  industryAnchorSlug,
  isShortThreatQuery,
  isThreatsDeepLink,
  matchesThreatQuery,
  protocolLensSlug,
  resolveIndustryParam,
  resolveProtocolParam,
  threatClassParam,
  threatDetailTabParam,
  threatIdParam,
  threatsIndustryHref,
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

  it('links a sector only when the filter lands on a published threat', () => {
    const rows = [{ industry: 'Finance & Banking' }, { industry: 'Critical Infrastructure / OT' }]
    expect(threatsIndustryHref('Finance & Banking', rows)).toBe(
      '/threats?industry=Finance%20%26%20Banking'
    )
    // an old label still lands through the alias, and the link keeps the caller's label
    expect(threatsIndustryHref('Critical Infrastructure', rows)).toBe(
      '/threats?industry=Critical%20Infrastructure'
    )
    // every threat of the sector drafted: no link
    expect(threatsIndustryHref('Water / Wastewater', rows)).toBeNull()
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
    expect(isThreatsDeepLink('/threats', '?protocol=tls-https')).toBe(true)
    expect(isThreatsDeepLink('/threats', '')).toBe(false)
    expect(isThreatsDeepLink('/threats', '?mode=cards')).toBe(false)
    expect(isThreatsDeepLink('/timeline', '?id=FIN-001')).toBe(false)
  })
})

describe('deep-link PR 2 params', () => {
  const lens = ['TLS / HTTPS', 'S/MIME & email', 'Network auth (EAP, 802.1X)']

  it('slugs protocol-lens labels for ?protocol=', () => {
    expect(protocolLensSlug('TLS / HTTPS')).toBe('tls-https')
    expect(protocolLensSlug('S/MIME & email')).toBe('s-mime-email')
    expect(protocolLensSlug('Network auth (EAP, 802.1X)')).toBe('network-auth-eap-802-1x')
  })

  it('resolves ?protocol= by slug or label; unknown/absent → null', () => {
    expect(resolveProtocolParam('tls-https', lens)).toBe('TLS / HTTPS')
    expect(resolveProtocolParam('s/mime & email', lens)).toBe('S/MIME & email')
    expect(resolveProtocolParam('network-auth-eap-802-1x', lens)).toBe('Network auth (EAP, 802.1X)')
    expect(resolveProtocolParam('carrier-pigeon', lens)).toBeNull()
    expect(resolveProtocolParam('', lens)).toBeNull()
    expect(resolveProtocolParam(null, lens)).toBeNull()
  })

  it('reads ?threattab=, defaulting to detection', () => {
    expect(threatDetailTabParam(p('threattab=response'))).toBe('response')
    expect(threatDetailTabParam(p('threattab=Detection'))).toBe('detection')
    expect(threatDetailTabParam(p('threattab=bogus'))).toBe('detection')
    expect(threatDetailTabParam(p(''))).toBe('detection')
  })

  it('maps an #industry-<slug> hash to the anchor slug', () => {
    const rows = [{ industry: 'Finance & Banking' }, { industry: 'Critical Infrastructure / OT' }]
    expect(industryAnchorSlug('Finance & Banking')).toBe('finance-banking')
    expect(industryAnchorFromHash('#industry-finance-banking', rows)).toBe('finance-banking')
    expect(industryAnchorFromHash('#industry-critical-infrastructure-ot', rows)).toBe(
      'critical-infrastructure-ot'
    )
    // An unknown slug passes through (the scroll is then a no-op).
    expect(industryAnchorFromHash('#industry-no-such', rows)).toBe('no-such')
    expect(industryAnchorFromHash('#crqc-threat-horizon', rows)).toBeNull()
    expect(industryAnchorFromHash('', rows)).toBeNull()
    expect(industryAnchorFromHash('#industry-%E0%A4%A', rows)).toBeNull()
  })
})
