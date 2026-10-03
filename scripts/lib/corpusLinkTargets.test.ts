// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  caseInsensitiveCheck,
  findUnresolvedLinks,
  libraryRefCheck,
  separatorInsensitiveKey,
  summarizeUnresolved,
  type LinkResolverTable,
} from './corpusLinkTargets'

const table: LinkResolverTable = {
  '*': { spec: libraryRefCheck(['FIPS 203']) },
  '/library': { ref: libraryRefCheck(['FIPS 203', 'RFC 9629']) },
  '/patents': { patent: (v) => v === 'US12676741' },
  '/migrate': { productIds: (v) => v === 'softhsm2' || v === 'aws-lc' },
  '/algorithms': { highlight: (v) => ['ML-KEM-768', 'RSA-2048'].includes(v) },
}
const chunk = (deepLink: string, id = 'c1') => ({ id, source: 'test', deepLink })

describe('findUnresolvedLinks', () => {
  it('passes links whose item exists, and ignores routes and params it has no check for', () => {
    expect(
      findUnresolvedLinks(
        [
          chunk('/library?ref=FIPS%20203'),
          chunk('/patents?patent=US12676741&tab=explore'),
          chunk('/threats?id=ANY'),
          chunk('/learn/pqc-101'),
          chunk('https://example.org/?ref=x'),
          { id: 'c2', source: 'test' },
        ],
        table
      )
    ).toEqual([])
  })

  it('reports a link whose item the page does not have', () => {
    const misses = findUnresolvedLinks([chunk('/patents?patent=US20260189410')], table)
    expect(misses).toEqual([
      {
        id: 'c1',
        source: 'test',
        url: '/patents?patent=US20260189410',
        param: 'patent',
        value: 'US20260189410',
      },
    ])
  })

  it('checks every entry of a list param', () => {
    const misses = findUnresolvedLinks(
      [chunk('/migrate?productIds=softhsm2,retired-thing,aws-lc')],
      table
    )
    expect(misses.map((m) => m.value)).toEqual(['retired-thing'])
    expect(
      findUnresolvedLinks([chunk('/algorithms?highlight=ML-KEM-768,RSA-2048')], table)
    ).toEqual([])
  })

  it('applies the any-route checks (?spec=) and treats an empty value as a miss', () => {
    expect(findUnresolvedLinks([chunk('/timeline?spec=NOPE')], table)).toHaveLength(1)
    expect(findUnresolvedLinks([chunk('/library?ref=')], table)).toHaveLength(1)
  })

  it('ignores a trailing slash and a #fragment', () => {
    expect(findUnresolvedLinks([chunk('/library/?ref=RFC%209629#x')], table)).toEqual([])
  })
})

describe('libraryRefCheck', () => {
  it('accepts separator and case variants only when exactly one document matches', () => {
    const check = libraryRefCheck(['FIPS 203', 'SP 800-208', 'X-1', 'X 1'])
    expect(check('FIPS-203')).toBe(true)
    expect(check('fips_203')).toBe(true)
    expect(check('SP-800-208')).toBe(true)
    expect(check('X 1')).toBe(true) // exact wins
    expect(check('x1')).toBe(false) // ambiguous: two documents share the key
    expect(check('FIPS 204')).toBe(false)
  })

  it('keys the same way the Library page does', () => {
    expect(separatorInsensitiveKey('NIST SP 800-208')).toBe('nistsp800208')
  })
})

describe('helpers', () => {
  it('caseInsensitiveCheck matches ids and names in any case', () => {
    const check = caseInsensitiveCheck(['softhsm2'], ['SoftHSM2', ' AWS-LC '])
    expect(check('SOFTHSM2')).toBe(true)
    expect(check('aws-lc')).toBe(true)
    expect(check('BoringSSL')).toBe(false)
  })

  it('summarizeUnresolved groups by source and param, largest first', () => {
    const misses = findUnresolvedLinks(
      [
        chunk('/patents?patent=US1', 'a'),
        chunk('/patents?patent=US2', 'b'),
        chunk('/library?ref=Z', 'c'),
      ],
      table
    )
    expect(summarizeUnresolved(misses)).toEqual(['2 × test ?patent=', '1 × test ?ref='])
  })
})
