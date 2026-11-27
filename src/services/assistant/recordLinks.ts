// SPDX-License-Identifier: AGPL-3.0-only
import type { KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import type { AssistantHomeLesson, AssistantRecordLink } from './contract'

/**
 * Two things the knowledge file says about a record that the drawer shows beside an answer: the lesson it belongs to in the
 * Learn tree, and the link of its kind it holds (a product to its maker and so on). Read where the knowledge file is read (the
 * engine host, in the worker), and sent with the answer, so the page never reads the file itself.
 */

type Reader = Pick<KnowledgeReader, 'get' | 'recordAt' | 'linksOf'>

/**
 * The home lesson of a record (`place` in the knowledge file). None for a record with none, a lesson, a part of its own lesson
 * (a section or workshop step already sits in it), or a lesson the file does not hold.
 */
export function homeLessonOf(
  reader: Pick<KnowledgeReader, 'get' | 'recordAt'>,
  tag: string,
  link: string
): AssistantHomeLesson | null {
  const rec = reader.get(tag) ?? reader.recordAt(link)
  const place = rec?.place
  if (!rec || !place || rec.type === 'module' || rec.id === place || rec.parent === place)
    return null
  const lesson = reader.get(place)
  if (!lesson || lesson.type !== 'module') return null
  return { tag: lesson.id, title: lesson.label, link: lesson.link }
}

/**
 * The link of its kind that the knowledge file holds for a record, and the name a question calls the record by. A certification is
 * named by its scheme and number ("FIPS 140-3 #5098", the text before the colon); one the Hub does not name that way is left out.
 * A document is not offered: the engine reads about 3 in 100 Library titles as not naming the document.
 */
export function recordLinkOf(reader: Reader, tag: string): AssistantRecordLink | null {
  const rec = reader.get(tag)
  if (!rec) return null
  const { out, in: into } = reader.linksOf(tag)
  const has = (links: readonly (readonly string[])[], rel: string) =>
    links.some((l) => l[1] === rel)
  if (rec.type === 'product' && has(out, 'made_by')) return { relation: 'made_by' }
  if (rec.type === 'vendor' && has(into, 'made_by')) return { relation: 'makes' }
  if (rec.type === 'source' && has(into, 'published_by')) return { relation: 'publishes' }
  if (rec.type === 'certification' && has(out, 'certifies')) {
    const name = rec.label.split(':')[0].trim()
    return name.length <= 40 && /#[A-Za-z0-9]+$/.test(name) && !name.startsWith('Common Criteria')
      ? { relation: 'certifies', name }
      : null
  }
  return null
}
