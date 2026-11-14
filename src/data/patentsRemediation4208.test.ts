// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  patentsData,
  cleanPatentTitle,
  publicationKindOf,
  normalizePersonalAssignee,
  canonicalizeTags,
  computeImpactParts,
  toImpactLevel,
  latestGrantsAndPublications,
} from './patentsData'
import { filterPatents, hasPqcAlgorithm, hasTag, pqcCountingName, tagKey } from './patentFilters'
import { vendorIdForPatentHolder, holderKey } from './patentHolderVendor'
import { resolveVendorRef } from '@/components/Migrate/Workbench/workbenchCatalog'
import { sortPatents } from '@/components/Patents/usePatentResults'
import type { PatentItem } from '@/types/PatentTypes'

const base = patentsData[0]
const item = (over: Partial<PatentItem>): PatentItem => ({ ...base, ...over })

describe('titles and publication kind', () => {
  it('strips search-highlight markup from titles', () => {
    expect(cleanPatentTitle('Cryptographic system for <b>post-quantum</b>  operations')).toBe(
      'Cryptographic system for post-quantum operations'
    )
    expect(patentsData.filter((p) => /<\/?b>/i.test(p.title))).toEqual([])
  })

  it('tells a published application from a granted patent by its number', () => {
    expect(publicationKindOf('20260189535')).toBe('published_application')
    expect(publicationKindOf('US20250007699')).toBe('published_application')
    expect(publicationKindOf('12470376')).toBe('granted_patent')
    expect(publicationKindOf('9948462')).toBe('granted_patent')
    const apps = patentsData.filter((p) => p.publicationKind === 'published_application')
    expect(apps.length).toBeGreaterThan(0)
    expect(apps.every((p) => /^US20\d{9}$/.test(p.patentNumber))).toBe(true)
  })
})

describe('name merging', () => {
  it('turns "Surname; Given" holders into "Given Surname" and merges the person', () => {
    expect(normalizePersonalAssignee('Nix; John A.')).toBe('John A. Nix')
    expect(normalizePersonalAssignee('DAVIS; Steven C.,TAYLOR; Paul')).toBe(
      'Steven C. Davis, Paul Taylor'
    )
    expect(normalizePersonalAssignee('Intel Corporation')).toBe('Intel Corporation')
    const nix = new Set(
      patentsData.filter((p) => /\bNix\b/.test(p.assignee)).map((p) => p.assignee)
    )
    expect([...nix]).toEqual(['John A. Nix'])
  })

  it('merges spelling variants of a tag but keeps different schemes apart', () => {
    expect(tagKey('CRYSTALS-KYBER')).toBe(tagKey('Kyber'))
    expect(tagKey('IPSec')).toBe(tagKey('IPsec'))
    expect(tagKey('WOTS+')).not.toBe(tagKey('WOTS'))
    const merged = canonicalizeTags([
      item({ pqcAlgorithms: ['Kyber'] }),
      item({ pqcAlgorithms: ['Kyber'] }),
      item({ pqcAlgorithms: ['CRYSTALS-KYBER', 'WOTS+'] }),
      item({ pqcAlgorithms: ['WOTS'] }),
    ])
    expect(merged[2].pqcAlgorithms).toEqual(['Kyber', 'WOTS+'])
    expect(merged[3].pqcAlgorithms).toEqual(['WOTS'])
    const names = new Set(patentsData.flatMap((p) => p.pqcAlgorithms))
    expect(names.has('CRYSTALS-KYBER')).toBe(false)
    const protocols = new Set(patentsData.flatMap((p) => p.protocols))
    expect(protocols.has('IPSec') && protocols.has('IPsec')).toBe(false)
  })
})

describe('filters', () => {
  it('matches an algorithm by its filing-era or FIPS name, and tags in any spelling', () => {
    expect(hasPqcAlgorithm(['Kyber'], 'ML-KEM')).toBe(true)
    expect(hasPqcAlgorithm(['CRYSTALS-Dilithium'], 'ML-DSA')).toBe(true)
    expect(hasPqcAlgorithm(['Falcon'], 'ML-KEM')).toBe(false)
    expect(hasTag(['IPSec'], 'IPsec')).toBe(true)
    expect(pqcCountingName('CRYSTALS-Kyber')).toBe('ML-KEM')
    expect(pqcCountingName('Classic McEliece')).toBe('Classic McEliece')
  })

  it('counts the PQC chart bar exactly as its click filters', () => {
    const counted = patentsData.filter((p) =>
      p.pqcAlgorithms.map(pqcCountingName).includes('ML-KEM')
    )
    const filtered = filterPatents(patentsData, new URLSearchParams('pqc=ML-KEM'))
    expect(filtered.length).toBe(counted.length)
  })

  it('counts every standard and threat-model bar exactly as its click filters', () => {
    for (const [field, param] of [
      ['standardsReferenced', 'standard'],
      ['threatModel', 'threatModel'],
    ] as const) {
      const counts = new Map<string, number>()
      for (const p of patentsData)
        for (const v of new Set(p[field])) counts.set(v, (counts.get(v) ?? 0) + 1)
      for (const [v, n] of counts)
        expect(filterPatents(patentsData, new URLSearchParams({ [param]: v })).length, v).toBe(n)
    }
  })

  it('filters by publication kind, quantum-safe basis, threat model, standard and migration strategy', () => {
    const apps = filterPatents(
      patentsData,
      new URLSearchParams('publication=published_application')
    )
    expect(apps.length).toBeGreaterThan(0)
    expect(apps.every((p) => p.publicationKind === 'published_application')).toBe(true)
    const fhe = filterPatents(patentsData, new URLSearchParams('quantumSafeBasis=lattice_fhe'))
    expect(fhe.every((p) => p.quantumSafeBasis === 'lattice_fhe')).toBe(true)
    const p = patentsData.find((x) => x.threatModel.length && x.standardsReferenced.length)!
    expect(
      filterPatents(patentsData, new URLSearchParams({ threatModel: p.threatModel[0] })).length
    ).toBeGreaterThan(0)
    expect(
      filterPatents(patentsData, new URLSearchParams({ standard: p.standardsReferenced[0] }))
    ).toContain(p)
    expect(
      filterPatents(patentsData, new URLSearchParams({ migrationStrategy: p.migrationStrategy }))
    ).toContain(p)
  })
})

describe('date sort', () => {
  it('puts records with no date last in both directions', () => {
    const rows = [
      item({ patentNumber: 'US1', issueDate: '' }),
      item({ patentNumber: 'US2', issueDate: '2001-01-01' }),
      item({ patentNumber: 'US3', issueDate: '2020-01-01' }),
    ]
    expect(sortPatents(rows, 'issueDate', 'asc').map((p) => p.patentNumber)).toEqual([
      'US2',
      'US3',
      'US1',
    ])
    expect(sortPatents(rows, 'issueDate', 'desc').map((p) => p.patentNumber)).toEqual([
      'US3',
      'US2',
      'US1',
    ])
  })
})

describe('impact score (owner decision 2026-11-14)', () => {
  const bare = {
    ...base,
    nistRoundStatus: [],
    protocols: [],
    hardwareComponents: [],
    applicationDomain: [],
    dataTypesProtected: [],
    pqcMigrationScore: null,
  }

  it('is half facts, half migration score', () => {
    expect(computeImpactParts(bare)).toEqual({ facts: 0, migration: 0 })
    const full = computeImpactParts({
      ...bare,
      nistRoundStatus: [
        { algorithm: 'ML-KEM', status: 'fips_203' },
        { algorithm: 'ML-DSA', status: 'fips_204' },
        { algorithm: 'SLH-DSA', status: 'fips_205' },
      ],
      protocols: ['TLS'],
      hardwareComponents: ['HSM'],
      applicationDomain: ['a', 'b', 'c', 'd', 'e', 'f'],
      dataTypesProtected: ['PHI', 'financial', 'PII', 'keys'],
      pqcMigrationScore: 10,
    })
    expect(full).toEqual({ facts: 50, migration: 50 })
    expect(
      computeImpactParts({
        ...bare,
        nistRoundStatus: [{ algorithm: 'ML-KEM', status: 'fips_203' }],
        pqcMigrationScore: 8,
      })
    ).toEqual({ facts: 12, migration: 40 })
    // Unscored: the facts half counts twice, so a missing score is neutral.
    expect(computeImpactParts({ ...bare, protocols: ['TLS'] })).toEqual({ facts: 8, migration: 8 })
  })

  it('keeps the thresholds and lets post-quantum-only patents reach High', () => {
    expect([toImpactLevel(65), toImpactLevel(64), toImpactLevel(35), toImpactLevel(34)]).toEqual([
      'High',
      'Medium',
      'Medium',
      'Low',
    ])
    for (const p of patentsData) {
      expect(p.impactScore).toBe(p.impactFacts + p.impactMigration)
      expect(p.impactLevel).toBe(toImpactLevel(p.impactScore))
    }
    expect(
      patentsData.some((p) => p.cryptoAgilityMode === 'pqc_only' && p.impactLevel === 'High')
    ).toBe(true)
  })
})

describe('latest grants and publications', () => {
  it('lists the 90 days before the newest date, newest first', () => {
    const rows = [
      item({ patentNumber: 'US1', issueDate: '2026-11-01' }),
      item({ patentNumber: 'US2', issueDate: '2026-08-04' }),
      item({ patentNumber: 'US3', issueDate: '2026-08-02' }),
      item({ patentNumber: 'US4', issueDate: '' }),
    ]
    expect(latestGrantsAndPublications(rows).map((p) => p.patentNumber)).toEqual(['US1', 'US2'])
    expect(latestGrantsAndPublications([])).toEqual([])
  })
})

describe('patent holder → Migrate vendor', () => {
  it('links holders that are catalogue vendors and no one else', () => {
    expect(holderKey('Cisco Technology, Inc.')).toBe('cisco')
    expect(vendorIdForPatentHolder('NXP B.V.')).toBe('VND-028')
    expect(vendorIdForPatentHolder('PQShield Ltd')).toBe('VND-030')
    expect(vendorIdForPatentHolder('International Business Machines Corporation')).toBe('VND-019')
    expect(vendorIdForPatentHolder('Intel Corporation')).toBe('VND-022')
    expect(vendorIdForPatentHolder('Wells Fargo Bank, N.A.')).toBeNull()
    expect(vendorIdForPatentHolder('John A. Nix')).toBeNull()
  })

  it('every holder link opens a vendor /migrate knows', () => {
    const holders = new Set(patentsData.map((p) => p.assignee).filter(Boolean))
    for (const h of holders) {
      const id = vendorIdForPatentHolder(h)
      if (id) expect(resolveVendorRef(id), h).toBe(id)
    }
  })
})
