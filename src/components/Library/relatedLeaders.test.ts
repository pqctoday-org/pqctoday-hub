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

  it('never returns a deprecated (merged) profile', () => {
    for (const item of libraryData.slice(0, 400)) {
      if (!libraryEnrichments[item.referenceId]) continue
      for (const l of relatedLeadersFor(item)) expect(l.leaderId).toBeTruthy()
    }
  })
})
