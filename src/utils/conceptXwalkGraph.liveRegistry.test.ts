// SPDX-License-Identifier: AGPL-3.0-only
//
// The shipped registry, checked for the false identities that token-substring
// matching used to create: the standards body `NIST` standing in for every NIST
// publication, and the umbrella `Common Criteria` standing in for each national
// certification scheme. Each of those is a relationship between two different
// things, not one thing seen twice.
import { describe, expect, it } from 'vitest'
import { conceptByCanonicalId, conceptRegistry } from '@/data/conceptRegistry'
import { equivalentCanonicals } from './conceptXwalkGraph'

function kebab(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function centerRow(conceptId: string) {
  const row = conceptByCanonicalId.get(conceptId)
  expect(row, `registry row ${conceptId} should exist`).toBeDefined()
  return row!
}

describe('equivalentCanonicals on the shipped registry', () => {
  it('the NIST body is not the same concept as any individual NIST publication', () => {
    const nist = centerRow('guidance:nist')
    const equivalents = equivalentCanonicals(nist)
    for (const publication of [
      'framework:nist-cswp-39',
      'framework:nist-ir-8477',
      'framework:nist-csf-2-0',
      'guidance:nist-sp800-208',
      'guidance:nist-ir-8547',
      'standard:nist-acvp',
    ]) {
      centerRow(publication) // the example must still exist, or this test proves nothing
      expect(equivalents, `${publication} must not be folded into the NIST body`).not.toContain(
        publication
      )
      expect(
        equivalentCanonicals(centerRow(publication)),
        `${publication} must not be folded into the NIST body`
      ).not.toContain('guidance:nist')
    }
  })

  it('Common Criteria is not the same concept as any national certification scheme', () => {
    const umbrella = centerRow('guidance:common-criteria')
    const schemes = conceptRegistry.filter((r) => {
      const id = kebab(r.sourceRowId)
      return id.includes('common-criteria') && id !== 'common-criteria'
    })
    // Several national schemes are registered; if this drops to zero the test is vacuous.
    expect(schemes.length).toBeGreaterThanOrEqual(5)
    const equivalents = equivalentCanonicals(umbrella)
    for (const scheme of schemes) {
      if (scheme.conceptId === umbrella.conceptId) continue
      expect(
        equivalents,
        `${scheme.conceptId} must not be folded into Common Criteria`
      ).not.toContain(scheme.conceptId)
      expect(
        equivalentCanonicals(scheme),
        `${scheme.conceptId} must not be folded into Common Criteria`
      ).not.toContain(umbrella.conceptId)
    }
  })

  it('a base text, a similarly named scheme and a milestone are not folded into their neighbours', () => {
    expect(equivalentCanonicals(centerRow('standard:ieee-1363'))).not.toContain(
      'standard:ieee-1363a'
    )
    expect(equivalentCanonicals(centerRow('standard:uov-round2-spec'))).not.toContain(
      'standard:qr-uov-round2-spec'
    )
    expect(equivalentCanonicals(centerRow('standard:rfc-9881'))).not.toContain(
      'timeline:rfc-9881-ml-dsa-in-x-509'
    )
  })

  it('the curated links still hold: same identifier in two stores, and the declared ISO/IEC 19790 alias', () => {
    expect(equivalentCanonicals(centerRow('guidance:fips-203'))).toContain('standard:fips-203')
    expect(equivalentCanonicals(centerRow('guidance:nist-ir-8547'))).toContain(
      'standard:nist-ir-8547'
    )
    expect(equivalentCanonicals(centerRow('guidance:iso-19790'))).toContain(
      'standard:iso-iec-19790'
    )
  })

  it('no row has an equivalent whose identifier merely extends its own', () => {
    // A longer identifier that contains this one as a token is a different
    // (related) thing unless the registry declares an alias for the pair.
    for (const row of conceptRegistry) {
      if (!row.sourceRowId) continue
      const own = kebab(row.sourceRowId)
      if (own.length < 4) continue
      for (const id of equivalentCanonicals(row)) {
        const other = conceptByCanonicalId.get(id)!
        const declared =
          row.aliases.includes(`${other.sourceTable}:${other.sourceRowId}`) ||
          other.aliases.includes(`${row.sourceTable}:${row.sourceRowId}`)
        if (declared) continue
        expect(
          kebab(other.sourceRowId),
          `${row.conceptId} should not be equivalent to ${id} without a declared alias`
        ).toBe(own)
      }
    }
  })
})
