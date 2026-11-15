import { describe, expect, it } from 'vitest'
import { relatedLeadersFor } from './relatedLeaders'
import { libraryData } from '@/data/libraryData'
import { libraryEnrichments } from '@/data/libraryEnrichmentData'

describe('relatedLeadersFor', () => {
  it('matches annotated / accented / honorific contributor names to Community profiles', () => {
    // Every enrichment contributor that names a Community profile resolves;
    // regression: accented names (Gilles Zémor) and annotated ones
    // ("Chris Peikert (author)") used to miss after the duplicate merge.
    // SDitH-Round2-Spec names "Philippe Gaborit" only via enrichment; the kept
    // profile is "Prof. Dr. Philippe Gaborit", which the old exact-ish matcher missed.
    const sdith = libraryData.find((d) => d.referenceId === 'SDitH-Round2-Spec')
    expect(sdith).toBeTruthy()
    const names = relatedLeadersFor(sdith!).map((l) => l.name)
    expect(names.some((n) => n.includes('Gaborit'))).toBe(true)
  })

  it('matches every person named in one comma-joined contributor item', () => {
    // Contributor lists are semicolon-separated, so one item can name several
    // authors ("Meltem Sönmez Turan, Elaine Barker, John Kelsey, …") or a person
    // and their title ("Paul van Brouwershaven, Chair of the PKI Consortium …").
    const sp90b = libraryData.find((d) => d.referenceId === 'NIST-SP-800-90B')
    expect(sp90b).toBeTruthy()
    const ids = relatedLeadersFor(sp90b!).map((l) => l.id)
    expect(ids).toEqual(
      expect.arrayContaining(['meltem-sonmez-turan', 'elaine-barker', 'john-kelsey'])
    )
    const pkic = libraryData.find((d) => d.referenceId === 'PKI-Consortium-PQC-2025')
    expect(pkic).toBeTruthy()
    expect(relatedLeadersFor(pkic!).map((l) => l.id)).toEqual(
      expect.arrayContaining(['paul-van-brouwershaven', 'chris-bailey'])
    )
  })

  it('never returns a deprecated (merged) profile', () => {
    for (const item of libraryData.slice(0, 400)) {
      if (!libraryEnrichments[item.referenceId]) continue
      for (const l of relatedLeadersFor(item)) expect(l.leaderId).toBeTruthy()
    }
  })
})
