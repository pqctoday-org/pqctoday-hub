// SPDX-License-Identifier: AGPL-3.0-only
import type { KnowledgeReader } from './knowledgeReader'
import type { KnowledgeRecord } from './knowledgeTypes'

/**
 * What the Hub's knowledge file says one lesson teaches or draws on, in three groups for the lesson page's
 * "Related resources" box. Pure: it reads a `KnowledgeReader` and returns plain lists, so it is tested with fixtures.
 */

export interface LessonResource {
  /** The record's tag. */
  id: string
  label: string
  /** The kind chip, worded as the Assistant words it for the same record. */
  kind: string
  /** The Hub address the record opens (its own `link`). */
  link: string
}

export interface LessonResources {
  /** Glossary terms, algorithms and protocols the lesson teaches, by label. */
  terms: LessonResource[]
  /** Library documents the lesson draws on: standards first, then guidance, frameworks, documents, algorithms. */
  documents: LessonResource[]
  /** Industry use cases the lesson covers, by label. */
  useCases: LessonResource[]
}

/** The kind chip for a record type: the same words the Assistant's rows carry (see `rows.kind_chip` in its data file). */
export const KIND_CHIP: Readonly<Record<string, string>> = {
  term: 'Glossary term',
  algorithm: 'Algorithm',
  algorithmfamily: 'Algorithm',
  protocol: 'Protocol',
  standard: 'Library document',
  document: 'Library document',
  guidance: 'Compliance framework',
  framework: 'Compliance framework',
  usecase: 'Industry use case',
}

/** Library document types in the order the box ranks them. Anything else comes after these. */
const DOCUMENT_RANK = ['standard', 'guidance', 'framework', 'document', 'algorithm']

export const TERMS_SHOWN = 12
export const DOCUMENTS_SHOWN = 5
export const USE_CASES_SHOWN = 5

const isActive = (r: KnowledgeRecord) => r.active !== false

const byLabel = (a: LessonResource, b: LessonResource) =>
  a.label.localeCompare(b.label, 'en', { sensitivity: 'base' }) || (a.id < b.id ? -1 : 1)

/** "2025", "2025-03" or "2025-03-17" as a string that sorts as time; anything else is not a usable date. */
function sortableDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const [year = '', month = '00', day = '00', ...extra] = value.trim().split('-')
  const fits = (part: string, width: number) => part.length === width && /^\d+$/.test(part)
  if (extra.length > 0 || !fits(year, 4) || !fits(month, 2) || !fits(day, 2)) return null
  return `${year}-${month}-${day}`
}

/** The later of a document's publication and update dates, when it has either. */
function documentDate(r: KnowledgeRecord): string | null {
  const dates = [r.fields?.initial_publication_date, r.fields?.last_update_date]
    .map(sortableDate)
    .filter((d): d is string => d !== null)
  return dates.length ? dates.sort().at(-1)! : null
}

function toResource(r: KnowledgeRecord): LessonResource {
  const kind = KIND_CHIP[r.type] ?? r.kind.charAt(0).toUpperCase() + r.kind.slice(1)
  return { id: r.id, label: r.label, kind, link: r.link }
}

/** The group a record belongs to in the box, or null when the box does not show it. */
function groupOf(r: KnowledgeRecord): 'terms' | 'documents' | 'useCases' | null {
  if (r.family === 'glossary' && r.type === 'term') return 'terms'
  if (r.family === 'algorithm' || r.family === 'algorithmfamily' || r.type === 'protocol')
    return 'terms'
  if (r.family === 'library') return 'documents'
  if (r.family === 'usecase') return 'useCases'
  return null
}

const lessonTags = new WeakMap<KnowledgeReader, Map<string, string>>()

/** The tag of the lesson (`LM-020`) from its tag or its address slug (`pki-workshop`). */
function lessonTag(reader: KnowledgeReader, lessonId: string): string | undefined {
  const direct = reader.get(lessonId)
  if (direct?.type === 'module') return direct.id
  let bySlug = lessonTags.get(reader)
  if (!bySlug) {
    bySlug = new Map()
    for (const r of reader.core.records) {
      if (r.family === 'module' && r.type === 'module') {
        bySlug.set(r.link.replace(/^\/learn\//, ''), r.id)
      }
    }
    lessonTags.set(reader, bySlug)
  }
  return bySlug.get(lessonId)
}

/** The lesson's tag and the tags of its parts (sections, workshop steps), at any depth. */
function lessonAndParts(reader: KnowledgeReader, tag: string): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  const walk = (t: string) => {
    if (seen.has(t)) return
    seen.add(t)
    out.push(t)
    for (const part of reader.partsOf(t)) walk(part.id)
  }
  walk(tag)
  return out
}

/**
 * Terms, documents and use cases that `taught_in` the lesson or one of its sections or steps. A record linked more
 * than once (the lesson and a section of it) appears once; retired and planned records are left out. A lesson the
 * file does not know gives three empty groups.
 */
export function lessonResources(reader: KnowledgeReader, lessonId: string): LessonResources {
  const empty: LessonResources = { terms: [], documents: [], useCases: [] }
  const tag = lessonTag(reader, lessonId)
  if (!tag) return empty

  const seen = new Set<string>()
  const terms: KnowledgeRecord[] = []
  const library: KnowledgeRecord[] = []
  const useCases: KnowledgeRecord[] = []
  for (const target of lessonAndParts(reader, tag)) {
    for (const link of reader.linksOf(target).in) {
      if (link[1] !== 'taught_in' || seen.has(link[0])) continue
      const r = reader.get(link[0])
      if (!r || !isActive(r)) continue
      const group = groupOf(r)
      if (!group) continue
      seen.add(r.id)
      if (group === 'terms') terms.push(r)
      else if (group === 'documents') library.push(r)
      else useCases.push(r)
    }
  }

  const rank = (r: KnowledgeRecord) => {
    const i = DOCUMENT_RANK.indexOf(r.type)
    return i === -1 ? DOCUMENT_RANK.length : i
  }
  const documents = [...library].sort((a, b) => {
    if (rank(a) !== rank(b)) return rank(a) - rank(b)
    const da = documentDate(a)
    const db = documentDate(b)
    if (da && db && da !== db) return da < db ? 1 : -1
    if (da && !db) return -1
    if (!da && db) return 1
    return byLabel(toResource(a), toResource(b))
  })

  return {
    terms: terms.map(toResource).sort(byLabel),
    documents: documents.map(toResource),
    useCases: useCases.map(toResource).sort(byLabel),
  }
}

export const hasLessonResources = (r: LessonResources): boolean =>
  r.terms.length + r.documents.length + r.useCases.length > 0
