// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import { EDUCATION_NOTICE } from '@/data/educationNotice'
import {
  bibtexUrl,
  citationKeys,
  dateParts,
  escapeBibtex,
  toBibtex,
  toCslJson,
  type CitableItem,
} from './citationExport'

const RFC: CitableItem = {
  referenceId: 'IETF RFC 9763',
  documentTitle: 'Related Certificates for Giving Expression to Multiple Algorithm Trust',
  downloadUrl: 'https://www.rfc-editor.org/rfc/rfc9763',
  initialPublicationDate: '2025-02-01',
  authorsOrOrganization: 'IETF',
  documentType: 'RFC',
  documentStatus: 'Published',
  lifecycleLabel: 'Released',
  lastVerified: '2026-09-08',
}

const DRAFT: CitableItem = {
  referenceId: 'draft-ietf-lamps-pq-composite-sigs-19',
  documentTitle: 'Composite ML-DSA for use in X.509 & CMS — 100% {draft} #19 $x_y~^',
  downloadUrl: 'https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/19/?a={b}',
  initialPublicationDate: '2026-09',
  authorsOrOrganization: 'M. Ounsworth; J. Gray',
  documentType: 'Internet-Draft',
  documentStatus: 'Internet-Draft',
  lifecycleLabel: 'Draft',
}

const PAID: CitableItem = {
  referenceId: 'ISO/IEC 18033-2',
  documentTitle: 'Encryption algorithms — Part 2',
  downloadUrl: 'https://www.iso.org/standard/37971.html',
  initialPublicationDate: '',
  authorsOrOrganization: 'ISO/IEC',
  documentType: 'Standard',
  documentStatus: 'Published',
  lifecycleLabel: 'Released',
  accessType: 'paid',
}

describe('escapeBibtex', () => {
  it('escapes every TeX special exactly once', () => {
    expect(escapeBibtex('a & b % c $ d # e _ f { g } h ~ i ^ j \\ k')).toBe(
      'a \\& b \\% c \\$ d \\# e \\_ f \\{ g \\} h \\textasciitilde{} i \\textasciicircum{} j \\textbackslash{} k'
    )
  })
  it('collapses whitespace so a field never holds a blank line', () => {
    expect(escapeBibtex(' a\n\n  b\t')).toBe('a b')
  })
  it('keeps braces out of URLs but leaves the rest verbatim', () => {
    expect(bibtexUrl('https://x.org/a?q={b}&c=%20')).toBe('https://x.org/a?q=%7Bb%7D&c=%20')
  })
})

describe('citationKeys / dateParts', () => {
  it('derives stable, BibTeX-safe keys from reference ids and de-duplicates', () => {
    expect(citationKeys(['IETF RFC 9763', 'ISO/IEC 18033-2', 'IETF RFC 9763', '{}'])).toEqual([
      'IETF-RFC-9763',
      'ISO-IEC-18033-2',
      'IETF-RFC-9763-2',
      'ref',
    ])
  })
  it('reads year, year-month and full dates only', () => {
    expect(dateParts('2025')).toEqual([2025])
    expect(dateParts('2025-02')).toEqual([2025, 2])
    expect(dateParts('2025-02-01')).toEqual([2025, 2, 1])
    expect(dateParts('')).toBeNull()
    expect(dateParts('Feb 2025')).toBeNull()
  })
})

describe('toBibtex', () => {
  const bib = toBibtex([RFC, DRAFT, PAID], '2026-10-16')

  it('leads with the export line and the status notice', () => {
    expect(
      bib.startsWith('@comment{Exported from the PQC Today Library on 2026-10-16: 3 records.}')
    ).toBe(true)
    expect(bib).toContain(`@comment{Notice: ${escapeBibtex(EDUCATION_NOTICE)}}`)
  })

  it('writes an RFC with key, corporate author, publisher, number, date, URL and note', () => {
    expect(bib).toContain(
      [
        '@misc{IETF-RFC-9763,',
        '  author = {{IETF}},',
        '  title = {{Related Certificates for Giving Expression to Multiple Algorithm Trust}},',
        '  publisher = {Internet Engineering Task Force (IETF)},',
        '  series = {Request for Comments},',
        '  number = {9763},',
        '  year = {2025},',
        '  month = feb,',
        '  date = {2025-02-01},',
        '  type = {RFC},',
        '  url = {https://www.rfc-editor.org/rfc/rfc9763},',
        '  urldate = {2026-09-08},',
        '  note = {PQC Today Library record IETF RFC 9763; status: Published; lifecycle: Released; last verified 2026-09-08}',
        '}',
      ].join('\n')
    )
  })

  it('escapes specials in titles and splits personal authors', () => {
    expect(bib).toContain(
      'title = {{Composite ML-DSA for use in X.509 \\& CMS — 100\\% \\{draft\\} \\#19 \\$x\\_y\\textasciitilde{}\\textasciicircum{}}}'
    )
    expect(bib).toContain('author = {{M. Ounsworth} and {J. Gray}}')
    expect(bib).toContain(
      'url = {https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/19/?a=%7Bb%7D}'
    )
    expect(bib).toContain('not re-verified against the document since it was added')
  })

  it('says a paid standard links to a purchase page', () => {
    expect(bib).toContain('paid standard: the URL is the purchase page')
    expect(bib).toContain('publisher = {ISO/IEC}')
  })

  it('keeps braces balanced in every entry', () => {
    let depth = 0
    for (const ch of bib.replace(/\\[{}]/g, '')) {
      if (ch === '{') depth++
      if (ch === '}') depth--
      expect(depth).toBeGreaterThanOrEqual(0)
    }
    expect(depth).toBe(0)
  })

  it('handles an empty set', () => {
    const empty = toBibtex([], '2026-10-16')
    expect(empty).toContain('0 records')
    expect(empty).not.toContain('@misc')
  })
})

describe('toCslJson', () => {
  it('produces CSL-JSON items with id, type, title, authors, dates, URL and note', () => {
    const [rfc, draft, paid] = toCslJson([RFC, DRAFT, PAID])
    expect(rfc).toEqual({
      id: 'IETF-RFC-9763',
      type: 'standard',
      title: RFC.documentTitle,
      author: [{ literal: 'IETF' }],
      publisher: 'Internet Engineering Task Force (IETF)',
      number: '9763',
      'collection-title': 'Request for Comments',
      issued: { 'date-parts': [[2025, 2, 1]] },
      accessed: { 'date-parts': [[2026, 9, 8]] },
      URL: RFC.downloadUrl,
      genre: 'RFC',
      note: 'PQC Today Library record IETF RFC 9763; status: Published; lifecycle: Released; last verified 2026-09-08',
    })
    expect(draft.type).toBe('report')
    expect(draft.title).toBe(DRAFT.documentTitle) // CSL-JSON is plain text: no escaping
    expect(draft.author).toEqual([{ literal: 'M. Ounsworth' }, { literal: 'J. Gray' }])
    expect(draft.issued).toEqual({ 'date-parts': [[2026, 9]] })
    expect(draft.accessed).toBeUndefined()
    expect(paid.issued).toBeUndefined()
    expect(JSON.parse(JSON.stringify([rfc, draft, paid]))).toHaveLength(3)
  })

  it('returns an empty array for an empty set', () => {
    expect(toCslJson([])).toEqual([])
  })
})
