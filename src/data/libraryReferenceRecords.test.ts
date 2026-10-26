// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Library records that the certification and hybrid-TLS lessons cite, checked
 * against the document each one describes:
 *  - RFC 10024 (published August 2026, the published form of
 *    draft-ietf-tls-ecdhe-mlkem) is listed on the hybrid lesson; the draft stays in
 *    the Library as a historical record that names the RFC as its replacement, and
 *    is no longer listed on the lessons.
 *  - ISO/IEC 15408-1:2022 is shown as withdrawn on 19 May 2026 and replaced by
 *    ISO/IEC 15408-1:2026 (ISO catalogue: "Withdrawn (Edition 4, 2022) New version
 *    available: ISO/IEC 15408-1:2026").
 *  - NIST CSWP 37B is a Final publication with its authors and affiliations as the
 *    NIST publication page lists them.
 *  - The Entropy lesson's SSLkeys page names the Debian Project, and Knuth's book is
 *    labelled a book rather than a published standard.
 */
import { describe, it, expect } from 'vitest'
import { libraryData, getLibraryItemsForModule } from './libraryData'

const byId = (id: string) => libraryData.find((i) => i.referenceId === id)

describe('RFC 10024 and the hybrid TLS draft it replaced', () => {
  it('lists RFC 10024 on the hybrid lesson and the other lessons that cite hybrid TLS', () => {
    const rfc = byId('RFC-10024')
    expect(rfc).toBeDefined()
    expect(rfc?.moduleIds).toEqual(
      expect.arrayContaining([
        'dev-quantum-impact',
        'hybrid-crypto',
        'network-security-pqc',
        'tls-basics',
        'web-gateway-pqc',
      ])
    )
    expect(getLibraryItemsForModule('hybrid-crypto').map((i) => i.referenceId)).toContain(
      'RFC-10024'
    )
  })

  it('dates RFC 10024 to August 2026 and does not call it a draft', () => {
    const rfc = byId('RFC-10024')
    expect(rfc?.initialPublicationDate).toBe('2026-08')
    expect(rfc?.lastUpdateDate).toBe('2026-08')
    expect(rfc?.lifecycleLabel).not.toBe('Draft')
    expect(rfc?.shortDescription).not.toMatch(/pre-publication|RFC Ed Queue/i)
  })

  it('keeps the draft as a historical record that names RFC 10024, and drops it from the lessons', () => {
    const draft = byId('draft-ietf-tls-ecdhe-mlkem-05')
    expect(draft?.lifecycleLabel).toBe('Historical')
    expect(draft?.supersededByRefs).toEqual(['RFC-10024'])
    expect(draft?.documentStatus).toBe('Internet-Draft (published as RFC 10024)')
    expect(byId('RFC-10024')?.replacesRefs).toContain('draft-ietf-tls-ecdhe-mlkem-05')
    for (const moduleId of ['hybrid-crypto', 'tls-basics', 'network-security-pqc']) {
      expect(
        getLibraryItemsForModule(moduleId).map((i) => i.referenceId),
        moduleId
      ).not.toContain('draft-ietf-tls-ecdhe-mlkem-05')
    }
  })
})

describe('ISO/IEC 15408-1:2022', () => {
  const iso = byId('ISO-IEC-15408-1-2022-Evaluation-criteria-for-IT-security-Com')

  it('says it was withdrawn and names the edition that replaced it', () => {
    expect(iso?.documentStatus).toBe('Withdrawn 19 May 2026; replaced by ISO/IEC 15408-1:2026')
    expect(iso?.documentStatus).not.toMatch(/^Published/)
  })

  it('has a one-line summary, and does not point at a library record that does not exist', () => {
    expect(iso?.shortDescription).toMatch(/introduction and general model/i)
    expect(iso?.shortDescription).toMatch(/ISO\/IEC 15408-1:2026/)
    expect(iso?.supersededByRefs).toBeUndefined()
  })
})

describe('NIST CSWP 37B', () => {
  const cswp = byId('NIST-CSWP-37B-Automation-of-the-NIST-Cryptographic-Module-Va')

  it('is a Final publication, not an unreviewed intake row', () => {
    expect(cswp?.documentStatus).toBe('Final')
    expect(cswp?.lifecycleLabel).toBe('Released')
  })

  it('lists the authors with the affiliations the NIST publication page gives', () => {
    const authors = (cswp?.authorsOrOrganization ?? '').split(';').map((a) => a.trim())
    expect(authors).toEqual([
      'Chris Celi (NIST)',
      'Alexander Calis (NIST)',
      'Murugiah Souppaya (NIST)',
      'William Barker (Strativia)',
      'Karen Kent (Trusted Cyber Annex)',
      'Shawn Geddis (Katalyst)',
      'Raoul Gabiam (MITRE)',
      'Kyle Vitale (MITRE)',
      'Stephan Mueller (atsec)',
      'Yi Mao (atsec)',
      'Barry Fussell (Cisco)',
      'Andrew Karcher (Cisco)',
      'Douglas Boldt (AWS)',
    ])
  })
})

describe('Entropy lesson references', () => {
  it('names the Debian Project as the publisher of the SSLkeys page', () => {
    expect(byId('SSLkeys')?.authorsOrOrganization).toBe('Debian Project')
  })

  it('labels The Art of Computer Programming, Volume 2 a book, not a published standard', () => {
    const knuth = byId('The-Art-of-Computer-Programming-Volume-2-Seminumerical-Algor')
    expect(knuth?.documentStatus).toBe('Published book (3rd edition, 1997)')
    expect(knuth?.lifecycleLabel).toBe('Released')
  })
})
