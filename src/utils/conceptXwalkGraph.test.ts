// SPDX-License-Identifier: AGPL-3.0-only
//
// Which registry rows count as "the same concept" when the relationship graph
// folds equivalent forms together. A publisher, an umbrella scheme, a numbered
// series, a companion volume, a different scheme with a similar name and a
// timeline milestone about a document are all RELATED to the thing they sit
// next to, but none of them IS that thing. Only the same source record or an
// explicitly declared alias is.
//
// The registry is mocked with a small, hand-written set of rows so the rules
// are pinned independently of the shipped CSV (the live data is covered in
// conceptXwalkGraph.liveRegistry.test.ts).
import { describe, expect, it, vi } from 'vitest'
import type { ConceptRegistryRow } from '@/data/conceptRegistry'

const { rows } = vi.hoisted(() => {
  const make = (
    conceptId: string,
    sourceTable: string,
    sourceRowId: string,
    aliases: string[] = []
  ) => ({
    conceptId,
    displayLabel: sourceRowId,
    sourceType: conceptId.split(':')[0],
    sourceTable,
    sourceRowId,
    primaryUrl: '',
    aliases,
    status: 'active',
    deprecatedAt: '',
    deprecatedReason: '',
  })
  return {
    rows: [
      // Publisher vs individual publications.
      make('guidance:nist', 'compliance', 'NIST'),
      make('framework:nist-cswp-39', 'library', 'NIST CSWP 39'),
      make('guidance:nist-sp800-208', 'compliance', 'NIST-SP800-208'),
      make('standard:draft-openpgp-nist-bp', 'library', 'draft-ietf-openpgp-nist-bp-comp-03'),
      // Umbrella scheme vs each national scheme.
      make('guidance:common-criteria', 'compliance', 'COMMON-CRITERIA'),
      make('guidance:anssi-cc', 'compliance', 'ANSSI-COMMON-CRITERIA-CERTIFIC'),
      make('guidance:bsi-cc', 'compliance', 'BSI-COMMON-CRITERIA-CERTIFICAT'),
      make('guidance:mycc', 'compliance', 'MYCC-MALAYSIAN-COMMON-CRITERIA'),
      // Base text vs amendment, volumes of one publication, similar scheme names.
      make('standard:ieee-1363', 'library', 'IEEE 1363'),
      make('standard:ieee-1363a', 'library', 'IEEE 1363a'),
      make('guidance:nccoe-1800-38', 'compliance', 'NIST-NCCOE-SP-1800-38'),
      make('standard:nccoe-1800-38c', 'library', 'NIST-NCCOE-SP-1800-38C'),
      make('standard:uov-round2-spec', 'library', 'UOV-Round2-Spec'),
      make('standard:qr-uov-round2-spec', 'library', 'QR-UOV-Round2-Spec'),
      // A document vs the timeline milestone announcing it.
      make('standard:rfc-9881', 'library', 'RFC 9881'),
      make('timeline:rfc-9881-published', 'timeline', 'international-ietf-rfc-9881-published'),
      // Same identifier written two ways in two stores.
      make('guidance:fips-203', 'compliance', 'FIPS-203'),
      make('standard:fips-203', 'library', 'FIPS 203'),
      // Curated alias where the identifiers differ (declared on one row only).
      make('guidance:iso-19790', 'compliance', 'ISO-19790', ['library:ISO-IEC-19790']),
      make('standard:iso-iec-19790', 'library', 'ISO-IEC-19790'),
      // A row with no source binding.
      make('concept_only:free-standing', '', ''),
    ] as ConceptRegistryRow[],
  }
})

vi.mock('@/data/conceptRegistry', () => ({
  conceptRegistry: rows,
  conceptByCanonicalId: new Map(rows.map((r) => [r.conceptId, r])),
  conceptIdByStoreKey: new Map<string, string>(),
}))

import { equivalentCanonicals } from './conceptXwalkGraph'

function equivalentsOf(conceptId: string): string[] {
  const row = rows.find((r) => r.conceptId === conceptId)
  if (!row) throw new Error(`fixture row ${conceptId} missing`)
  return equivalentCanonicals(row)
}

describe('equivalentCanonicals — a similar token is not the same concept', () => {
  it('a standards body is not the same concept as the individual publications that carry its name', () => {
    const body = equivalentsOf('guidance:nist')
    expect(body).not.toContain('framework:nist-cswp-39')
    expect(body).not.toContain('guidance:nist-sp800-208')
    expect(body).not.toContain('standard:draft-openpgp-nist-bp')
    // ... and the other direction: a publication does not collapse into its publisher.
    expect(equivalentsOf('framework:nist-cswp-39')).not.toContain('guidance:nist')
    expect(equivalentsOf('standard:draft-openpgp-nist-bp')).not.toContain('guidance:nist')
  })

  it('Common Criteria is not the same concept as any national certification scheme', () => {
    const umbrella = equivalentsOf('guidance:common-criteria')
    for (const scheme of ['guidance:anssi-cc', 'guidance:bsi-cc', 'guidance:mycc']) {
      expect(umbrella, `umbrella must not absorb ${scheme}`).not.toContain(scheme)
      expect(equivalentsOf(scheme), `${scheme} must not collapse into the umbrella`).not.toContain(
        'guidance:common-criteria'
      )
    }
  })

  it('a base text is not its amendment, and a publication is not one of its volumes', () => {
    expect(equivalentsOf('standard:ieee-1363')).not.toContain('standard:ieee-1363a')
    expect(equivalentsOf('standard:ieee-1363a')).not.toContain('standard:ieee-1363')
    expect(equivalentsOf('guidance:nccoe-1800-38')).not.toContain('standard:nccoe-1800-38c')
    expect(equivalentsOf('standard:nccoe-1800-38c')).not.toContain('guidance:nccoe-1800-38')
  })

  it('a scheme is not the scheme whose name it merely extends', () => {
    expect(equivalentsOf('standard:uov-round2-spec')).not.toContain('standard:qr-uov-round2-spec')
    expect(equivalentsOf('standard:qr-uov-round2-spec')).not.toContain('standard:uov-round2-spec')
  })

  it('a document is not the timeline milestone that announces it', () => {
    expect(equivalentsOf('standard:rfc-9881')).not.toContain('timeline:rfc-9881-published')
    expect(equivalentsOf('timeline:rfc-9881-published')).not.toContain('standard:rfc-9881')
  })

  it('a row with no source binding has no equivalents', () => {
    expect(equivalentsOf('concept_only:free-standing')).toEqual([])
  })
})

describe('equivalentCanonicals — what still counts as the same concept', () => {
  it('the same identifier written differently in two stores is one concept, both ways', () => {
    expect(equivalentsOf('guidance:fips-203')).toContain('standard:fips-203')
    expect(equivalentsOf('standard:fips-203')).toContain('guidance:fips-203')
  })

  it('an explicit alias joins rows whose identifiers differ, even when declared on one side only', () => {
    expect(equivalentsOf('guidance:iso-19790')).toContain('standard:iso-iec-19790')
    expect(equivalentsOf('standard:iso-iec-19790')).toContain('guidance:iso-19790')
  })

  it('never lists the row itself', () => {
    for (const r of rows) {
      expect(equivalentCanonicals(r)).not.toContain(r.conceptId)
    }
  })
})
