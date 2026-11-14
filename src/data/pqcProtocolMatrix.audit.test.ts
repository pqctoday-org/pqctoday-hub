// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Known-answer tests for the matrix audit's document-placement, product-link
 * and prose-scan rules (scripts/audit-matrix-refs.ts), plus one run of the whole
 * audit against the real matrix and the newest product catalog.
 */
import { describe, it, expect } from 'vitest'
import {
  audit,
  auditDocPlacement,
  auditProductRefs,
  auditProseHygiene,
  licenceClass,
  loadProductCatalog,
  type CatalogProduct,
} from '../../scripts/audit-matrix-refs'
import type { DimensionStatus, ProtocolMatrixRow } from './pqcProtocolMatrix'

const dim = (overrides: Partial<DimensionStatus> = {}): DimensionStatus => ({
  value: 'na',
  ...overrides,
})

function row(overrides: Partial<ProtocolMatrixRow> = {}): ProtocolMatrixRow {
  return {
    id: 'test-row',
    name: 'Test',
    description: '',
    latestRelease: [],
    latestDraft: [],
    dimensions: { pureKem: dim(), hybridKem: dim(), pureSig: dim(), hybridSig: dim() },
    ossLibraries: [],
    commercialLibraries: [],
    playgrounds: [],
    ...overrides,
  }
}

const doc = (id: string) => ({ id, title: id, url: 'https://example.org', date: '2026-01' })

const catalog = new Map<string, CatalogProduct>([
  ['open-lib', { licenseType: 'Open Source', status: 'active', deprecatedReason: '' }],
  ['paid-lib', { licenseType: 'Commercial', status: 'active', deprecatedReason: '' }],
  ['dual-lib', { licenseType: 'Open Source / Commercial', status: 'active', deprecatedReason: '' }],
  ['blank-lib', { licenseType: '', status: 'active', deprecatedReason: '' }],
  [
    'old-lib',
    {
      licenseType: 'Commercial',
      status: 'deprecated',
      deprecatedReason: 'duplicate of new-lib',
    },
  ],
])

describe('licenceClass', () => {
  it.each([
    ['Open Source', 'open'],
    ['Open Source (MIT)', 'open'],
    ['Free/Open Source', 'open'],
    ['Public Domain', 'open'],
    ['Commercial', 'commercial'],
    ['Proprietary (hardware)', 'commercial'],
    ['Freemium', 'commercial'],
    ['Open Source / Commercial', 'mixed'],
    ['Mixed/Dual', 'mixed'],
    ['Dual (Open Source / Commercial)', 'mixed'],
    ['', 'unknown'],
    ['Industry Standard', 'unknown'],
  ])('reads "%s" as %s', (text, expected) => {
    expect(licenceClass(text)).toBe(expected)
  })
})

describe('auditDocPlacement', () => {
  it('flags a published RFC listed under latestDraft', () => {
    const f = auditDocPlacement(
      row({ latestDraft: [doc('RFC-9954-Hybrid-Key-Exchange-in-TLS-1-3')] })
    )
    expect(f).toHaveLength(1)
    expect(f[0]).toMatchObject({ rowId: 'test-row', severity: 'error' })
    expect(f[0].detail).toMatch(/move it to latestRelease/)
  })

  it.each(['RFC-9954', 'RFC 9954', 'rfc9954'])(
    'flags the RFC spelled "%s" under latestDraft',
    (id) => {
      expect(auditDocPlacement(row({ latestDraft: [doc(id)] }))).toHaveLength(1)
    }
  )

  it('flags an Internet-Draft listed under latestRelease', () => {
    const f = auditDocPlacement(row({ latestRelease: [doc('draft-ietf-tls-mlkem-11')] }))
    expect(f).toHaveLength(1)
    expect(f[0].detail).toMatch(/move it to latestDraft/)
  })

  it('accepts RFCs under latestRelease, drafts under latestDraft, and non-IETF ids anywhere', () => {
    expect(
      auditDocPlacement(
        row({
          latestRelease: [
            doc('RFC-9846'),
            doc('TCG-TPM-2.0-Library-v1.85-Errata'),
            doc('CTAP-2.1'),
          ],
          latestDraft: [doc('draft-ietf-tls-mlkem-11'), doc('KMIP-v3.0-CSD02')],
        })
      )
    ).toEqual([])
  })
})

describe('auditProductRefs', () => {
  const lib = (productId: string) => ({ productId, name: productId })

  it('flags a productId that is not in the catalog', () => {
    const f = auditProductRefs(row({ commercialLibraries: [lib('cloudflare-1-1-1-1')] }), catalog)
    expect(f).toHaveLength(1)
    expect(f[0].detail).toMatch(/not in the product catalog/)
  })

  it('flags a retired catalog row and names why', () => {
    const f = auditProductRefs(row({ ossLibraries: [lib('old-lib')] }), catalog)
    expect(f).toHaveLength(1)
    expect(f[0].detail).toMatch(/deprecated.*duplicate of new-lib/)
  })

  it('flags an open-source product listed as commercial, and the reverse', () => {
    const a = auditProductRefs(row({ commercialLibraries: [lib('open-lib')] }), catalog)
    expect(a).toHaveLength(1)
    expect(a[0].detail).toMatch(/move it to ossLibraries/)
    const b = auditProductRefs(row({ ossLibraries: [lib('paid-lib')] }), catalog)
    expect(b).toHaveLength(1)
    expect(b[0].detail).toMatch(/move it to commercialLibraries/)
  })

  it('accepts a dual-licensed or unlabelled product in either list, and matching buckets', () => {
    expect(
      auditProductRefs(
        row({
          ossLibraries: [lib('open-lib'), lib('dual-lib'), lib('blank-lib')],
          commercialLibraries: [lib('paid-lib'), lib('dual-lib'), lib('blank-lib')],
        }),
        catalog
      )
    ).toEqual([])
  })
})

describe('auditProseHygiene — fields added to the scan', () => {
  it('flags a document id in the description that no ref on the row backs', () => {
    const f = auditProseHygiene(row({ description: 'IKEv2 carries the work — RFC 8784 PPKs.' }))
    expect(f.map((x) => x.field)).toEqual(['description'])
    expect(f[0].ref).toBe('RFC 8784')
  })

  it('flags recommendedReason and implementationAvailability text the same way', () => {
    const f = auditProseHygiene(
      row({
        recommendedReason: 'Specified in RFC 10024.',
        implementationAvailability: [
          { provider: 'Acme', what: 'implements draft-ietf-tls-mlkem', referenceUrl: 'https://a' },
        ],
      })
    )
    expect(f.map((x) => x.field).sort()).toEqual([
      'implementationAvailability[Acme].what',
      'recommendedReason',
    ])
  })

  it('accepts a description whose ids are backed by a list on the same row', () => {
    expect(
      auditProseHygiene(
        row({
          description: 'Deprecated by RFC 9395.',
          latestRelease: [doc('RFC-9395')],
        })
      )
    ).toEqual([])
  })
})

describe('the real matrix against the real catalog', () => {
  it('loads the newest catalog with active rows', () => {
    const real = loadProductCatalog()
    expect(real.size).toBeGreaterThan(500)
    expect(real.get('keycloak')).toMatchObject({ licenseType: 'Open Source', status: 'active' })
    expect(real.get('akamai-pqc-edge')?.status).toBe('deprecated')
  })

  it('has no audit findings', () => {
    expect(audit()).toEqual([])
  })
})
