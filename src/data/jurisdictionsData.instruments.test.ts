// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { JURISDICTION_BY_CODE } from './jurisdictionsData'

describe('governing-instrument metadata for DE and FR', () => {
  const de = JURISDICTION_BY_CODE.DE
  const fr = JURISDICTION_BY_CODE.FR

  it('describes BSI TR-02102-1 as a recommendation, not binding on federal systems', () => {
    expect(de.force).toBe('guidance')
    expect(de.appliesTo).toContain('a recommendation')
    expect(de.appliesTo).toContain('other BSI documents are binding for certain applications')
    expect(de.appliesTo).not.toMatch(/binding for German federal systems/)
  })

  it('cites the ANSSI PQC FAQ as the French instrument, with the "to date" qualifier in the note', () => {
    expect(fr.force).toBe('guidance')
    expect(fr.instrumentUrl).toBe('https://cyber.gouv.fr/cryptographie-post-quantique-faq')
    expect(fr.note).toContain('has, to date, no regulatory force by itself')
    expect(fr.note).toContain('hybrid is mandatory inside the regulated scope')
  })
})
