// SPDX-License-Identifier: GPL-3.0-only
import { describe, expect, it } from 'vitest'
import { validateDeepLink } from '../../src/services/search/deepLinkGrammar'
import {
  algorithmDeepLink,
  complianceFrameworkDeepLink,
  leaderDeepLink,
  migrateProductDeepLink,
  migrateVendorDeepLink,
  optionalColumn,
  patentDeepLink,
  timelineEventDeepLink,
} from './corpusDeepLinks'

describe('corpus deep-link builders', () => {
  it('patents: always US-prefixed, never doubled', () => {
    expect(patentDeepLink('12676741')).toBe('/patents?patent=US12676741')
    expect(patentDeepLink(' US12676741 ')).toBe('/patents?patent=US12676741')
  })

  it('migrate products: product_id first, exact name fallback', () => {
    expect(migrateProductDeepLink('btq-bitcoin-quantum', 'BTQ Bitcoin Quantum')).toBe(
      '/migrate?product=btq-bitcoin-quantum'
    )
    expect(migrateProductDeepLink('', 'DigiCert Trust Lifecycle Manager')).toBe(
      '/migrate?product=DigiCert%20Trust%20Lifecycle%20Manager'
    )
    expect(migrateProductDeepLink('', '')).toBe('/migrate')
  })

  it('migrate vendors: roadmaps tab + VND id', () => {
    expect(migrateVendorDeepLink('VND-089')).toBe('/migrate?tab=roadmaps&vendor=VND-089')
    expect(migrateVendorDeepLink('')).toBe('/migrate?tab=roadmaps')
  })

  it('compliance frameworks: ?framework=<id>', () => {
    expect(complianceFrameworkDeepLink('FIPS-140-3')).toBe('/compliance?framework=FIPS-140-3')
    expect(complianceFrameworkDeepLink('')).toBe('/compliance')
  })

  it('timeline: event_id first, country fallback', () => {
    expect(timelineEventDeepLink('TL-0042', 'Germany')).toBe('/timeline?event=TL-0042')
    expect(timelineEventDeepLink('', 'United States')).toBe('/timeline?country=United%20States')
    expect(timelineEventDeepLink('', '')).toBe('/timeline')
  })

  it('leaders: leader_id first, name fallback', () => {
    expect(leaderDeepLink('dustin-moody-nist', 'Dustin Moody')).toBe(
      '/leaders?leader=dustin-moody-nist'
    )
    expect(leaderDeepLink('', 'Dustin Moody')).toBe('/leaders?leader=Dustin%20Moody')
  })

  it('algorithms: algorithm_id first, exact name fallback', () => {
    expect(algorithmDeepLink('ml-kem-768', 'ML-KEM-768')).toBe('/algorithms?algo=ml-kem-768')
    expect(algorithmDeepLink('', 'ML-KEM-768')).toBe('/algorithms?algo=ML-KEM-768')
  })

  it('optionalColumn reads a column only when the header has it', () => {
    expect(optionalColumn(['Name', 'leader_id'], ['Ada', ' LDR-1 '], 'leader_id')).toBe('LDR-1')
    expect(optionalColumn(['Name'], ['Ada'], 'leader_id')).toBe('')
  })

  it('every builder emits a link the deep-link grammar accepts', () => {
    const urls = [
      patentDeepLink('12676741'),
      migrateProductDeepLink('x', 'X'),
      migrateVendorDeepLink('VND-1'),
      complianceFrameworkDeepLink('CNSA-2'),
      timelineEventDeepLink('E1', ''),
      timelineEventDeepLink('', 'Japan'),
      leaderDeepLink('', 'Ada Lovelace'),
      algorithmDeepLink('', 'ML-DSA-65'),
    ]
    for (const url of urls) expect(validateDeepLink(url), url).toBeNull()
  })
})
