// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { PREFIX_CTA_MAP, librarySpecHref } from './algorithmCtaMap'
import { findLibraryItemByRef } from './libraryData'

describe('algorithmCtaMap spec references', () => {
  // specRef is a bare library reference_id, not a route. It used to be a
  // `/library?highlight=…` URL — a param the library page does not read, so the
  // link silently landed on the unfiltered catalog.
  it('every specRef is a bare reference_id, not a URL', () => {
    for (const [prefix, ctas] of PREFIX_CTA_MAP) {
      if (!ctas.specRef) continue
      expect(ctas.specRef.startsWith('/'), `specRef for "${prefix}" looks like a route`).toBe(false)
      expect(ctas.specRef.includes('?'), `specRef for "${prefix}" carries query params`).toBe(false)
    }
  })

  it('every specRef resolves to a real library document', () => {
    for (const [prefix, ctas] of PREFIX_CTA_MAP) {
      if (!ctas.specRef) continue
      expect(
        findLibraryItemByRef(ctas.specRef),
        `dead spec reference "${ctas.specRef}" for algorithm prefix "${prefix}"`
      ).toBeTruthy()
    }
  })

  it('librarySpecHref builds a resolvable /library?ref= fallback', () => {
    for (const [, ctas] of PREFIX_CTA_MAP) {
      if (!ctas.specRef) continue
      const href = librarySpecHref(ctas.specRef)
      expect(href.startsWith('/library?ref=')).toBe(true)
      const ref = new URLSearchParams(href.split('?')[1]).get('ref')
      expect(ref).toBe(ctas.specRef)
    }
  })
})
