// SPDX-License-Identifier: GPL-3.0-only
/**
 * Library citation export: BibTeX and CSL-JSON for a set of Library records
 * (the bookmarked set or the current filter). Pure functions; the Library
 * page hands the text to the shared download helper.
 *
 * Every entry carries the record's stable id (as the citation key), its URL,
 * its status and lifecycle label, and the date the record was last checked
 * against the document ("last verified") — so a citation can be traced back
 * to the exact Library record it came from.
 */
import type { LibraryItem } from '@/data/libraryData'
import { EDUCATION_NOTICE } from '@/data/educationNotice'

/** The Library fields a citation uses. */
export type CitableItem = Pick<
  LibraryItem,
  | 'referenceId'
  | 'documentTitle'
  | 'downloadUrl'
  | 'initialPublicationDate'
  | 'authorsOrOrganization'
  | 'documentType'
  | 'documentStatus'
  | 'lifecycleLabel'
> &
  Partial<Pick<LibraryItem, 'lastVerified' | 'accessType' | 'lastUpdateDate'>>

// ── Shared pieces ────────────────────────────────────────────────────────────

/**
 * A citation key from the Library's reference id: ASCII letters, digits and
 * `-_:.` only (BibTeX keys may not hold spaces, commas, braces, quotes, `#`,
 * `%`, `~`, `=` or backslashes). Collisions get `-2`, `-3`, … in input order.
 */
export function citationKeys(ids: string[]): string[] {
  const seen = new Map<string, number>()
  return ids.map((id) => {
    const base =
      id
        .normalize('NFKD')
        .replace(/[^\x20-\x7e]/g, '')
        .replace(/[^A-Za-z0-9_:.-]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'ref'
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  })
}

/** "YYYY", "YYYY-MM" or "YYYY-MM-DD" → numeric date parts; anything else → null. */
export function dateParts(raw: string | undefined): number[] | null {
  const parts = (raw ?? '').trim().split('-')
  if (parts.length > 3) return null
  const widths = [4, 2, 2]
  if (!parts.every((p, i) => p.length === widths[i] && /^\d+$/.test(p))) return null
  return parts.map(Number)
}

/** Corporate or personal names from the semicolon-separated Library field. */
function names(field: string): string[] {
  return field
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean)
}

const IETF_TYPES = new Set(['RFC', 'Internet-Draft'])
/** Document types whose single named organisation is the publisher. */
const ORG_PUBLISHED_TYPES = new Set([
  'Standard',
  'Government Guidance',
  'Regulation',
  'Compliance Framework',
])

/** The publisher, where it is obvious from the record; otherwise undefined. */
export function publisherOf(item: CitableItem): string | undefined {
  if (IETF_TYPES.has(item.documentType)) return 'Internet Engineering Task Force (IETF)'
  const orgs = names(item.authorsOrOrganization)
  if (ORG_PUBLISHED_TYPES.has(item.documentType) && orgs.length === 1) return orgs[0]
  return undefined
}

/** RFC number from the title or id ("RFC 9763", "rfc9763"), when there is one. */
function rfcNumber(item: CitableItem): string | undefined {
  if (item.documentType !== 'RFC') return undefined
  const m = /\bRFC[\s-]?(\d{3,5})\b/i.exec(`${item.documentTitle} ${item.referenceId}`)
  return m?.[1]
}

/** The note: status, lifecycle label, last-verified date and paid-access warning. */
export function citationNote(item: CitableItem): string {
  const parts = [
    `PQC Today Library record ${item.referenceId}`,
    item.documentStatus ? `status: ${item.documentStatus}` : '',
    `lifecycle: ${item.lifecycleLabel}`,
    item.lastVerified
      ? `last verified ${item.lastVerified}`
      : 'not re-verified against the document since it was added',
    item.accessType === 'paid' ? 'paid standard: the URL is the purchase page' : '',
  ]
  return parts.filter(Boolean).join('; ')
}

// ── BibTeX ───────────────────────────────────────────────────────────────────

/**
 * Escape text for a brace-delimited BibTeX field. Backslash first, then the
 * TeX specials, so no escape is escaped twice. Whitespace runs collapse to one
 * space (a blank line inside a field would end the paragraph in TeX).
 */
export function escapeBibtex(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[\\{}&%$#_~^]/g, (c) => {
      switch (c) {
        case '\\':
          return '\\textbackslash{}'
        case '~':
          return '\\textasciitilde{}'
        case '^':
          return '\\textasciicircum{}'
        default:
          return `\\${c}`
      }
    })
}

/**
 * A URL for a BibTeX `url` field: kept verbatim for the url/biblatex
 * packages, except braces, which would unbalance the field, and whitespace.
 */
export function bibtexUrl(url: string): string {
  return url.trim().replace(/\{/g, '%7B').replace(/\}/g, '%7D').replace(/\s/g, '%20')
}

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']

function bibtexEntry(item: CitableItem, key: string): string {
  const fields: Array<[string, string]> = []
  // Organisations are literal names: double braces stop BibTeX splitting them into first/last.
  const authors = names(item.authorsOrOrganization)
  if (authors.length)
    fields.push(['author', authors.map((a) => `{${escapeBibtex(a)}}`).join(' and ')])
  fields.push(['title', `{${escapeBibtex(item.documentTitle)}}`])
  const publisher = publisherOf(item)
  if (publisher) fields.push(['publisher', escapeBibtex(publisher)])
  const rfc = rfcNumber(item)
  if (rfc) {
    fields.push(['series', 'Request for Comments'])
    fields.push(['number', rfc])
  }
  const d = dateParts(item.initialPublicationDate)
  if (d) {
    fields.push(['year', String(d[0])])
    if (d[1]) fields.push(['month', MONTHS[d[1] - 1] ?? String(d[1])])
    fields.push(['date', item.initialPublicationDate.trim()])
  }
  if (item.documentType) fields.push(['type', escapeBibtex(item.documentType)])
  if (item.downloadUrl) fields.push(['url', bibtexUrl(item.downloadUrl)])
  if (item.lastVerified && dateParts(item.lastVerified))
    fields.push(['urldate', item.lastVerified.trim()])
  fields.push(['note', escapeBibtex(citationNote(item))])
  const body = fields
    .map(([k, v]) => (k === 'month' ? `  ${k} = ${v}` : `  ${k} = {${v}}`))
    .join(',\n')
  return `@misc{${key},\n${body}\n}`
}

/** A .bib file for these items, led by the site's status notice as an @comment. */
export function toBibtex(items: CitableItem[], exportedOn: string): string {
  const keys = citationKeys(items.map((i) => i.referenceId))
  const header = [
    `@comment{Exported from the PQC Today Library on ${exportedOn}: ${items.length} record${items.length === 1 ? '' : 's'}.}`,
    `@comment{Notice: ${escapeBibtex(EDUCATION_NOTICE)}}`,
  ]
  return [...header, ...items.map((item, i) => bibtexEntry(item, keys[i]))].join('\n\n') + '\n'
}

// ── CSL-JSON ─────────────────────────────────────────────────────────────────

export interface CslItem {
  id: string
  type: 'standard' | 'report' | 'article' | 'webpage'
  title: string
  author?: Array<{ literal: string }>
  publisher?: string
  number?: string
  'collection-title'?: string
  issued?: { 'date-parts': number[][] }
  accessed?: { 'date-parts': number[][] }
  URL?: string
  genre?: string
  note: string
}

function cslType(item: CitableItem): CslItem['type'] {
  if (item.documentType === 'Research Paper' || item.lifecycleLabel === 'Research Paper')
    return 'article'
  if (item.documentType === 'Article') return 'webpage'
  if (['RFC', 'Standard', 'Regulation'].includes(item.documentType)) return 'standard'
  return 'report'
}

/** CSL-JSON items (an array, as citation managers import it). An empty set is `[]`. */
export function toCslJson(items: CitableItem[]): CslItem[] {
  const keys = citationKeys(items.map((i) => i.referenceId))
  return items.map((item, i) => {
    const authors = names(item.authorsOrOrganization)
    const issued = dateParts(item.initialPublicationDate)
    const accessed = dateParts(item.lastVerified)
    const publisher = publisherOf(item)
    const rfc = rfcNumber(item)
    return {
      id: keys[i],
      type: cslType(item),
      title: item.documentTitle,
      ...(authors.length ? { author: authors.map((literal) => ({ literal })) } : {}),
      ...(publisher ? { publisher } : {}),
      ...(rfc ? { number: rfc, 'collection-title': 'Request for Comments' } : {}),
      ...(issued ? { issued: { 'date-parts': [issued] } } : {}),
      ...(accessed ? { accessed: { 'date-parts': [accessed] } } : {}),
      ...(item.downloadUrl ? { URL: item.downloadUrl } : {}),
      ...(item.documentType ? { genre: item.documentType } : {}),
      note: citationNote(item),
    }
  })
}
