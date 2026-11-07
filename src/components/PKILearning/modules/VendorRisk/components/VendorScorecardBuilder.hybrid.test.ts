// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  DIMENSIONS,
  buildScorecardMarkdown,
  computeVendorScorecards,
  scoreDimension,
} from './VendorScorecardBuilder'
import { hybridSupportLevel } from '@/data/hybridSupport'
import type { SoftwareItem } from '@/types/MigrateTypes'

const hybrid = DIMENSIONS.find((d) => d.id === 'hybrid-mode')!

const item = (productId: string, extra: Partial<SoftwareItem> = {}): SoftwareItem =>
  ({ productId, vendorName: 'Acme', vendorId: 'Acme', ...extra }) as unknown as SoftwareItem

// Free text that says hybrid is NOT offered: the old keyword rule matched it.
const NO_HYBRID_TEXT = {
  pqcSupport: 'Yes (ML-KEM, ML-DSA)',
  pqcCapabilityDescription: 'Hybrid mode is not offered; pure ML-KEM key exchange only.',
}

const defaultWeight = (id: string) => DIMENSIONS.find((d) => d.id === id)?.weight ?? 0
const noSliders = { useSlider: {}, sliderScores: {} }

describe('Hybrid Mode Support reads only the structured catalogue fields', () => {
  it('does not score hybrid from free text, even text that says hybrid is not offered', () => {
    const p = item('p1', NO_HYBRID_TEXT)
    expect(hybridSupportLevel(p)).toBe('not-assessed')
    expect(hybrid.autoDetect?.(p)).toBe(false)
    expect(hybrid.catalogueLevel?.(p)).toBe('not-assessed')
  })

  it('does not score hybrid from a support column that mentions hybrid', () => {
    const p = item('p1', { pqcSupport: 'Yes (hybrid X25519MLKEM768)' })
    expect(hybridSupportLevel(p)).toBe('not-assessed')
    expect(hybrid.autoDetect?.(p)).toBe(false)
  })

  it('reads a structured yes as supported', () => {
    expect(hybridSupportLevel(item('a', { hybridKemSupport: ['tls-default'] }))).toBe('yes')
    expect(hybridSupportLevel(item('b', { hybridKemSupport: ['tls-optin'] }))).toBe('yes')
    expect(hybridSupportLevel(item('c', { hybridKemSupport: ['api'] }))).toBe('yes')
    expect(hybridSupportLevel(item('d', { hybridSigSupport: 'api' }))).toBe('yes')
    expect(
      hybridSupportLevel(
        item('e', { hybridKemSupport: ['api-experimental'], hybridSigSupport: 'api' })
      )
    ).toBe('yes')
  })

  it('reads experimental-only support as partial, not yes', () => {
    expect(hybridSupportLevel(item('a', { hybridKemSupport: ['api-experimental'] }))).toBe(
      'partial'
    )
    expect(hybridSupportLevel(item('b', { hybridSigSupport: 'api-experimental' }))).toBe('partial')
    expect(
      hybridSupportLevel(
        item('c', { hybridKemSupport: ['none'], hybridSigSupport: 'api-experimental' })
      )
    ).toBe('partial')
  })

  it('reads a structured entry that lists no hybrid support as no, not as not assessed', () => {
    expect(
      hybridSupportLevel(item('a', { hybridKemSupport: ['none'], hybridSigSupport: 'none' }))
    ).toBe('no')
  })

  it('scores a ticked structured yes in full and a ticked experimental one at half', () => {
    const yes = item('y', { hybridKemSupport: ['tls-default'] })
    const exp = item('e', { hybridKemSupport: ['api-experimental'] })
    expect(scoreDimension(hybrid, [yes], new Set(['y']))).toBe(100)
    expect(scoreDimension(hybrid, [exp], new Set(['e']))).toBe(50)
    expect(scoreDimension(hybrid, [yes, exp], new Set(['y', 'e']))).toBe(75)
  })

  it('leaves unassessed products out of the score instead of counting them as 0', () => {
    const yes = item('y', { hybridKemSupport: ['api'] })
    const noEntry = item('n', NO_HYBRID_TEXT)
    // 1 of 1 assessed product; the unassessed one is neither a hit nor a miss.
    expect(scoreDimension(hybrid, [yes, noEntry], new Set(['y']))).toBe(100)
    // Ticking an unassessed product cannot raise the score either.
    expect(scoreDimension(hybrid, [yes, noEntry], new Set(['y', 'n']))).toBe(100)
  })

  it('has no score when no product has a structured entry', () => {
    const group = [item('a', NO_HYBRID_TEXT), item('b')]
    expect(scoreDimension(hybrid, group, new Set(['a', 'b']))).toBeNull()
    expect(scoreDimension(hybrid, [], undefined)).toBeNull()
  })
})

describe('a not-assessed dimension is left out of the weighted total', () => {
  // Weigh only what the test ticks so the arithmetic is easy to follow.
  const checked = {
    'pqc-algorithm-support': new Set(['a1']),
    'sbom-cbom': new Set(['a1', 'a2']),
  }
  const unassessed = [item('a1', NO_HYBRID_TEXT), item('a2', NO_HYBRID_TEXT)]

  it('gives the same total as a scorecard where the dimension is absent', () => {
    const [withDimension] = computeVendorScorecards(unassessed, checked, defaultWeight, noSliders)
    const [withoutDimension] = computeVendorScorecards(
      unassessed,
      checked,
      (id) => (id === 'hybrid-mode' ? 0 : defaultWeight(id)),
      noSliders
    )
    expect(withDimension.dimScores['hybrid-mode']).toBeNull()
    expect(withDimension.overall).toBe(withoutDimension.overall)
    // 0.25*50 + 0.1*100 over the 0.85 weight that remains, not over 1.0.
    expect(withDimension.overall).toBe(Math.round((0.25 * 50 + 0.1 * 100) / 0.85))
  })

  it('is not the same as scoring the dimension 0 or 100', () => {
    const [row] = computeVendorScorecards(unassessed, checked, defaultWeight, noSliders)
    const asZero = Math.round((0.25 * 50 + 0.1 * 100 + 0.15 * 0) / 1)
    const asHundred = Math.round((0.25 * 50 + 0.1 * 100 + 0.15 * 100) / 1)
    expect(row.overall).not.toBe(asZero)
    expect(row.overall).not.toBe(asHundred)
  })

  it('counts the dimension once a vendor has an assessed product', () => {
    const items = [item('a1', { hybridKemSupport: ['tls-default'] }), item('a2', NO_HYBRID_TEXT)]
    const [row] = computeVendorScorecards(
      items,
      { 'hybrid-mode': new Set(['a1']) },
      defaultWeight,
      noSliders
    )
    expect(row.dimScores['hybrid-mode']).toBe(100)
    expect(row.overall).toBe(Math.round((0.15 * 100) / 1))
  })

  it('assesses each vendor on its own products', () => {
    const items = [
      item('a1', { vendorId: 'Acme', hybridKemSupport: ['api'] }),
      item('g1', { vendorId: 'Globex', ...NO_HYBRID_TEXT }),
    ]
    const rows = computeVendorScorecards(
      items,
      { 'hybrid-mode': new Set(['a1']) },
      defaultWeight,
      noSliders
    )
    expect(rows.find((r) => r.vendor === 'Acme')!.dimScores['hybrid-mode']).toBe(100)
    expect(rows.find((r) => r.vendor === 'Globex')!.dimScores['hybrid-mode']).toBeNull()
  })

  it('still lets a manual slider score the dimension', () => {
    const [row] = computeVendorScorecards(unassessed, checked, defaultWeight, {
      useSlider: { 'hybrid-mode': true },
      sliderScores: { 'hybrid-mode': 40 },
    })
    expect(row.dimScores['hybrid-mode']).toBe(40)
  })
})

describe('export says Not assessed and what it means', () => {
  const notes = { scannerNotes: '', cveNotes: '', siemNotes: '', ztNotes: '' }

  it('prints Not assessed with the weight marked as not counted, and the structured-fields note', () => {
    const md = buildScorecardMarkdown(
      63,
      2,
      [
        {
          id: 'sbom-cbom',
          label: 'SBOM/CBOM Delivery',
          score: 100,
          weightPct: 10,
          method: '2/2 products',
        },
        {
          id: 'hybrid-mode',
          label: 'Hybrid Mode Support',
          score: null,
          weightPct: 15,
          method: 'No structured catalogue entry for the selected products',
        },
      ],
      [
        {
          vendor: 'Acme',
          productCount: 2,
          dimScores: { 'sbom-cbom': 100, 'hybrid-mode': null },
          overall: 100,
        },
      ],
      notes
    )
    expect(md).toContain('| Hybrid Mode Support | Not assessed | 15% (not counted) |')
    expect(md).toContain('| Acme | 2 | 100/100 | 100 | Not assessed |')
    expect(md).toContain("scored only from the catalogue's structured hybrid fields")
    expect(md).toContain('Not assessed means the catalogue has no structured hybrid entry')
    expect(md).not.toContain('inferred from catalogue wording')
    expect(md).not.toMatch(/\| Hybrid Mode Support \| 0\/100/)
  })
})

describe('Hybrid Mode Support description', () => {
  it('says the score comes from the structured fields and what Not assessed means', () => {
    expect(hybrid.description).toMatch(
      /structured hybrid key-exchange and composite-signature fields/
    )
    expect(hybrid.description).toMatch(/not assessed/i)
    expect(hybrid.description).not.toMatch(/inferred from catalogue wording/)
  })
})
