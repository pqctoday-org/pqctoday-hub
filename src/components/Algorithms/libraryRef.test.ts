// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { libraryData, type LibraryItem } from '@/data/libraryData'
import { PROTOCOL_MATRIX } from '@/data/pqcProtocolMatrix'
import { libraryHref, normalizeUrlKey, resolveLibraryRef, specLink } from './libraryRef'

const LIBRARY_IDS = new Set<string>()
const walk = (item: LibraryItem): void => {
  LIBRARY_IDS.add(item.referenceId)
  item.children?.forEach(walk)
}
libraryData.forEach(walk)

describe('normalizeUrlKey', () => {
  it('treats every address of one IETF draft as the same key, whatever the revision', () => {
    const key = 'draft:draft-ietf-lamps-cms-fn-dsa'
    for (const url of [
      'https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-fn-dsa/',
      'https://datatracker.ietf.org/doc/html/draft-ietf-lamps-cms-fn-dsa-00',
      'https://www.ietf.org/archive/id/draft-ietf-lamps-cms-fn-dsa-00.txt',
    ]) {
      expect(normalizeUrlKey(url), url).toBe(key)
    }
  })

  it('ignores scheme, www, query, fragment, trailing slash and .html on ordinary links', () => {
    const key = normalizeUrlKey('https://signal.org/docs/specifications/pqxdh')
    expect(key).toBe('signal.org/docs/specifications/pqxdh')
    expect(normalizeUrlKey('http://www.signal.org/docs/specifications/pqxdh/?a=1#top')).toBe(key)
    expect(normalizeUrlKey('https://signal.org/docs/specifications/pqxdh.html')).toBe(key)
  })

  it('has no key for an empty value or a bare host', () => {
    expect(normalizeUrlKey(undefined)).toBeNull()
    expect(normalizeUrlKey('')).toBeNull()
    expect(normalizeUrlKey('https://example.org/')).toBeNull()
    expect(normalizeUrlKey('not a url')).toBeNull()
  })
})

describe('resolveLibraryRef', () => {
  it.each([
    'PKCS#11 v3.2 OS',
    'Signal PQXDH',
    'UEFI 2.11',
    '3GPP TR 33.938',
    'TCG TPM 2.0 v1.85',
    'TCG PC Client PTP v1.07',
    '3GPP-TS-33.501',
    'PKCS11-v3.2-OS',
    'Signal-PQXDH-Rev3',
  ])('maps the vendor id "%s" to an entry that exists in the Library', (id) => {
    const ref = resolveLibraryRef(id)
    expect(ref, id).not.toBeNull()
    expect(LIBRARY_IDS.has(ref!), `${id} -> ${ref}`).toBe(true)
  })

  it('sends both TPM Library v1.85 citations to the Part 3 (Commands) entry, not the v1.84 errata', () => {
    // Part 3 v1.85 defines TPM2_Encapsulate / TPM2_Decapsulate; the Errata entry is a
    // different document (Errata Version 1 for v1.84, August 2026).
    expect(resolveLibraryRef('TCG-TPM-2.0-Library-v1.85-Part3-Published')).toBe(
      'TCG-TPM-2.0-Library-v1.85-Part3-Published'
    )
    expect(resolveLibraryRef('TCG TPM 2.0 v1.85')).toBe('TCG-TPM-2.0-Library-v1.85-Part3-Published')
    // The matrix's own Errata citation still reaches the Errata entry.
    expect(resolveLibraryRef('TCG-TPM-2.0-Library-v1.85-Errata')).toBe(
      'TCG-TPM-2.0-Library-v1.85-Errata'
    )
  })

  it('does not alias KMIP 3.0 to the pre-quantum KMIP 2.1 entry', () => {
    expect(resolveLibraryRef('KMIP 3.0 CSD02')).toBeNull()
    expect(
      resolveLibraryRef('KMIP 3.0 CSD02', 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/')
    ).toBeNull()
  })

  it('matches a draft the Library files under another name by its download address', () => {
    // The Library keeps this working-group draft under its pre-adoption title.
    const ref = resolveLibraryRef(
      'draft-ietf-emu-pqc-eap-tls',
      'https://datatracker.ietf.org/doc/draft-ietf-emu-pqc-eap-tls/'
    )
    expect(ref).not.toBeNull()
    expect(LIBRARY_IDS.has(ref!)).toBe(true)
    // …and without the address there is nothing to match on.
    expect(resolveLibraryRef('draft-ietf-emu-pqc-eap-tls')).toBeNull()
  })

  it('prefers the id match over the address match', () => {
    expect(resolveLibraryRef('PKCS#11 v3.2 OS', 'https://example.org/other')).toBe(
      'PKCS11-V32-OS-OASIS'
    )
  })

  it('never resolves an inherited object property name', () => {
    expect(resolveLibraryRef('constructor')).toBeNull()
    expect(resolveLibraryRef('__proto__')).toBeNull()
  })
})

describe('specLink', () => {
  it('opens the Library entry in the app when the Library holds the document', () => {
    const link = specLink(
      'PKCS#11 v3.2 OS',
      'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/pkcs11-spec-v3.2-os.pdf'
    )
    expect(link).toMatchObject({ kind: 'library', to: '/library?ref=PKCS11-V32-OS-OASIS' })
  })

  it('opens the cited external page when the Library does not hold the document', () => {
    const link = specLink('KMIP 3.0 CSD02', 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/')
    expect(link).toEqual({
      kind: 'external',
      href: 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/',
      title: 'Open external specification (KMIP 3.0 CSD02)',
    })
  })

  it('falls back to a Library search only when there is no address to open', () => {
    expect(specLink('KMIP 3.0 CSD02')).toMatchObject({
      kind: 'search',
      to: '/library?q=KMIP%203.0%20CSD02',
    })
    expect(specLink('KMIP 3.0 CSD02', 'javascript:alert(1)')).toMatchObject({ kind: 'search' })
  })

  it('keeps libraryHref a search for an unknown id, as before', () => {
    expect(libraryHref('KMIP 3.0 CSD02')).toBe('/library?q=KMIP%203.0%20CSD02')
  })
})

describe('protocol matrix citations', () => {
  const chips = PROTOCOL_MATRIX.flatMap((row) => [
    ...[...row.latestRelease, ...row.latestDraft].map((d) => ({
      where: `${row.id}.doc`,
      id: d.id,
      url: d.url,
    })),
    ...(['pureKem', 'hybridKem', 'pureSig', 'hybridSig'] as const).flatMap((dim) =>
      (row.dimensions[dim].refs ?? []).map((r) => ({
        where: `${row.id}.${dim}`,
        id: r.id,
        url: r.url,
      }))
    ),
  ])

  it('no chip leads to an empty Library search: each opens a Library entry or its own address', () => {
    const deadEnds = chips.filter((c) => specLink(c.id, c.url).kind === 'search')
    expect(deadEnds).toEqual([])
  })

  it('every chip that opens the Library opens an entry that exists', () => {
    const missing = chips.filter((c) => {
      const link = specLink(c.id, c.url)
      return (
        link.kind === 'library' && !LIBRARY_IDS.has(decodeURIComponent(link.to.split('ref=')[1]))
      )
    })
    expect(missing).toEqual([])
  })

  it('every external fallback is an https address', () => {
    for (const c of chips) {
      const link = specLink(c.id, c.url)
      if (link.kind === 'external') expect(link.href, c.where).toMatch(/^https:\/\//)
    }
  })
})
