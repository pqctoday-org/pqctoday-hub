// SPDX-License-Identifier: AGPL-3.0-only
import { loadKnowledgeReader, type KnowledgeReader } from '@/services/knowledge/knowledgeReader'

/** A place that teaches a glossary term: where its "taught in" link leads, and the lesson it belongs to. */
export interface TermLesson {
  /** The lesson's title (the lesson that holds the section or workshop step, or the lesson itself). */
  lessonTitle: string
  /** The address of the link's own target: a lesson, one of its sections, or one of its workshop steps. */
  link: string
  /** The target's tag. */
  tag: string
}

/** A glossary term's tag. */
export const isGlossaryTag = (tag: string): boolean => tag.startsWith('GL:')

/**
 * Where the knowledge model says a term is taught, in the reader's own order (the order of the links in
 * the model). The first entry is the one to open; nothing here ranks or invents a link.
 */
export function termLessonsFrom(reader: KnowledgeReader, tag: string): TermLesson[] {
  const out: TermLesson[] = []
  for (const link of reader.linksOf(tag).out) {
    if (link[1] !== 'taught_in') continue
    const target = reader.get(link[2])
    if (!target) continue
    const lesson =
      target.type === 'module'
        ? target
        : reader.parentChain(target.id).find((r) => r.type === 'module')
    out.push({ lessonTitle: (lesson ?? target).label, link: target.link, tag: target.id })
  }
  return out
}

/** The same, read from the knowledge model the Assistant already uses. A model that does not load gives none. */
export async function termLessonsFor(tag: string): Promise<TermLesson[]> {
  if (!isGlossaryTag(tag)) return []
  try {
    return termLessonsFrom(await loadKnowledgeReader(), tag)
  } catch {
    return []
  }
}
