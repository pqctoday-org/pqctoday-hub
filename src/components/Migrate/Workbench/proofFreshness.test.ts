// SPDX-License-Identifier: GPL-3.0-only
/**
 * The freshness label is a claim about our own evidence, shown next to a claim
 * about a vendor's product. Getting it wrong in the reassuring direction —
 * calling a vendor's word "proof", or an old document "current" — is worse than
 * the silence it replaces, so both directions are pinned here.
 */
import { describe, it, expect } from 'vitest'
import { proofFreshness } from './proofFreshness'
import { softwareData } from '@/data/migrateData'
import type { SoftwareItem } from '@/types/MigrateTypes'

function product(overrides: Partial<SoftwareItem>): SoftwareItem {
  return { softwareName: 'Test', ...overrides } as SoftwareItem
}

function isoMonthsAgo(months: number): string {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

describe('proofFreshness', () => {
  it('never calls an undocumented claim "proof"', () => {
    const f = proofFreshness(product({}))
    expect(f.vendorClaimOnly).toBe(true)
    expect(f.label).toBe('Vendor claim')
    expect(f.label.toLowerCase()).not.toContain('proof')
    expect(f.detail).toMatch(/vendor’s own statement/i)
    // Tone must not read as reassurance.
    expect(f.tone).toBe('warning')
  })

  it('marks a recent dated proof as current', () => {
    const f = proofFreshness(
      product({ proofUrl: 'https://x/y', proofPublicationDate: isoMonthsAgo(3) })
    )
    expect(f.tone).toBe('success')
    expect(f.vendorClaimOnly).toBe(false)
    expect(f.ageMonths).toBe(3)
  })

  it('warns on a proof old enough to have been overtaken', () => {
    const f = proofFreshness(
      product({ proofUrl: 'https://x/y', proofPublicationDate: isoMonthsAgo(40) })
    )
    expect(f.tone).toBe('warning')
    expect(f.detail).toMatch(/re-check/i)
    expect(f.label).toMatch(/3 years ago/)
  })

  it('admits when it holds a document but not its date', () => {
    const f = proofFreshness(product({ proofUrl: 'https://x/y' }))
    expect(f.tone).toBe('muted')
    expect(f.ageMonths).toBeNull()
    expect(f.detail).toMatch(/cannot say how current/i)
  })

  it('does not treat an unparseable date as fresh', () => {
    const f = proofFreshness(product({ proofUrl: 'https://x/y', proofPublicationDate: 'soon' }))
    expect(f.tone).not.toBe('success')
    expect(f.ageMonths).toBeNull()
  })

  it('carries the stored one-line summary of what the proof shows', () => {
    const f = proofFreshness(
      product({
        proofUrl: 'https://x/y',
        proofPublicationDate: isoMonthsAgo(2),
        proofRelevantInfo: 'Release notes list ML-KEM-768 in the TLS group set.',
      })
    )
    expect(f.detail).toContain('ML-KEM-768')
  })

  it('produces a usable verdict for every product in the live catalog', () => {
    expect(softwareData.length).toBeGreaterThan(0)
    for (const p of softwareData) {
      const f = proofFreshness(p)
      expect(f.label.length).toBeGreaterThan(0)
      expect(f.detail.length).toBeGreaterThan(10)
      expect(['success', 'warning', 'muted']).toContain(f.tone)
    }
  })
})
