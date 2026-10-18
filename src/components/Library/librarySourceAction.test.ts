// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { resolveLibrarySourceAction } from './librarySourceAction'

describe('resolveLibrarySourceAction', () => {
  it('opens a free official source as a document', () => {
    expect(resolveLibrarySourceAction({ downloadUrl: 'https://nist.gov/doc.pdf' })).toMatchObject({
      kind: 'official-document',
      href: 'https://nist.gov/doc.pdf',
      label: 'Open official document',
    })
  })

  it('prefers the free summary for a paid source', () => {
    expect(
      resolveLibrarySourceAction({
        accessType: 'paid',
        downloadUrl: 'https://iso.org/store/standard',
        freeSummaryUrl: 'https://iso.org/abstract/standard',
      })
    ).toMatchObject({ kind: 'free-summary', href: 'https://iso.org/abstract/standard' })
  })

  it('describes a paid publisher URL as an access page', () => {
    expect(
      resolveLibrarySourceAction({
        accessType: 'paid',
        downloadUrl: 'https://iso.org/store/standard',
      })
    ).toMatchObject({
      kind: 'publisher-access',
      label: 'Open publisher access/purchase page',
    })
  })

  it('never invents a link', () => {
    expect(resolveLibrarySourceAction({ downloadUrl: '' }).kind).toBe('unavailable')
    expect(resolveLibrarySourceAction({ downloadUrl: '' }).href).toBeUndefined()
  })
})
