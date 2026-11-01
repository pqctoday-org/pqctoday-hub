// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import type { SoftwareItem } from '@/types/MigrateTypes'
import {
  parseHybridKemSupport,
  parseHybridSigSupport,
  hybridSupportBadges,
  matchesHybridFacet,
} from './hybridSupport'

const item = (over: Partial<SoftwareItem>) => ({ productId: 'x', ...over }) as SoftwareItem

describe('parseHybridKemSupport', () => {
  it('treats a blank or missing cell as not assessed', () => {
    expect(parseHybridKemSupport(undefined)).toBeUndefined()
    expect(parseHybridKemSupport('')).toBeUndefined()
    expect(parseHybridKemSupport('   ')).toBeUndefined()
  })

  it('parses single and +-joined tokens into display order, case- and space-tolerant', () => {
    expect(parseHybridKemSupport('none')).toEqual(['none'])
    expect(parseHybridKemSupport('api+tls-default')).toEqual(['tls-default', 'api'])
    expect(parseHybridKemSupport(' TLS-OptIn + api-experimental ')).toEqual([
      'tls-optin',
      'api-experimental',
    ])
    expect(parseHybridKemSupport('api+api')).toEqual(['api'])
  })

  it('ignores unknown tokens; only unknown tokens reads as not assessed', () => {
    expect(parseHybridKemSupport('tls-default+quantum-magic')).toEqual(['tls-default'])
    expect(parseHybridKemSupport('yes')).toBeUndefined()
    expect(parseHybridKemSupport('tls-default,api')).toBeUndefined()
  })

  it('drops none when a real capability is listed with it', () => {
    expect(parseHybridKemSupport('none+api')).toEqual(['api'])
  })
})

describe('parseHybridSigSupport', () => {
  it('parses the three values and treats blank or unknown as not assessed', () => {
    expect(parseHybridSigSupport('api')).toBe('api')
    expect(parseHybridSigSupport(' API-Experimental ')).toBe('api-experimental')
    expect(parseHybridSigSupport('none')).toBe('none')
    expect(parseHybridSigSupport('')).toBeUndefined()
    expect(parseHybridSigSupport(undefined)).toBeUndefined()
    expect(parseHybridSigSupport('tls-default')).toBeUndefined()
  })
})

describe('hybridSupportBadges', () => {
  it('returns no badges for an unassessed product', () => {
    expect(hybridSupportBadges(item({}))).toEqual([])
  })

  it('labels every KEM token and the signature value', () => {
    const labels = hybridSupportBadges(
      item({ hybridKemSupport: ['tls-default', 'api-experimental'], hybridSigSupport: 'api' })
    ).map((b) => b.label)
    expect(labels).toEqual([
      'Hybrid TLS (default)',
      'Hybrid KEM API (experimental)',
      'Composite signature API',
    ])
    expect(
      hybridSupportBadges(item({ hybridKemSupport: ['tls-optin', 'api'] })).map((b) => b.label)
    ).toEqual(['Hybrid TLS (opt-in)', 'Hybrid KEM API'])
    expect(
      hybridSupportBadges(
        item({ hybridKemSupport: ['none'], hybridSigSupport: 'api-experimental' })
      ).map((b) => b.label)
    ).toEqual(['No hybrid KEM', 'Composite signature (experimental)'])
    expect(hybridSupportBadges(item({ hybridSigSupport: 'none' })).map((b) => b.label)).toEqual([
      'No composite signature',
    ])
  })

  it('shows one TLS badge when a product is hybrid by default and has opt-in groups too', () => {
    expect(
      hybridSupportBadges(item({ hybridKemSupport: ['tls-default', 'tls-optin', 'api'] })).map(
        (b) => b.label
      )
    ).toEqual(['Hybrid TLS (default)', 'Hybrid KEM API'])
  })
})

describe('matchesHybridFacet', () => {
  it('matches TLS-by-default only on tls-default', () => {
    expect(matchesHybridFacet(item({ hybridKemSupport: ['tls-default'] }), 'tls-default')).toBe(
      true
    )
    expect(matchesHybridFacet(item({ hybridKemSupport: ['tls-optin'] }), 'tls-default')).toBe(false)
  })

  it('matches the KEM API option on api or api-experimental', () => {
    expect(matchesHybridFacet(item({ hybridKemSupport: ['api'] }), 'kem-api')).toBe(true)
    expect(matchesHybridFacet(item({ hybridKemSupport: ['api-experimental'] }), 'kem-api')).toBe(
      true
    )
    expect(matchesHybridFacet(item({ hybridKemSupport: ['tls-default'] }), 'kem-api')).toBe(false)
  })

  it('matches the composite signature option on api or api-experimental', () => {
    expect(matchesHybridFacet(item({ hybridSigSupport: 'api' }), 'sig-api')).toBe(true)
    expect(matchesHybridFacet(item({ hybridSigSupport: 'api-experimental' }), 'sig-api')).toBe(true)
    expect(matchesHybridFacet(item({ hybridSigSupport: 'none' }), 'sig-api')).toBe(false)
  })

  it('never matches an unassessed product', () => {
    for (const f of ['tls-default', 'kem-api', 'sig-api'] as const) {
      expect(matchesHybridFacet(item({}), f)).toBe(false)
    }
  })
})
