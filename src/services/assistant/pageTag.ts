// SPDX-License-Identifier: AGPL-3.0-only
import type { KnowledgeRecord } from '@/services/knowledge/knowledgeTypes'

/** What the page tag needs from the knowledge reader. */
export interface PageLookup {
  get(tag: string): KnowledgeRecord | undefined
  recordAt(address: string): KnowledgeRecord | undefined
}

/**
 * The knowledge tag of the page the learner is on. `page` is a tag (`LM-008`, `LM-008/s:intro`, `CMP:CNSA-2`) or the page's Hub
 * address (`/learn/tls-basics`, `/learn/tls-basics?section=intro`, `/compliance`). An address is read by the records that own it,
 * never by a name: the full address first, then the lesson with its section, then the path alone. Null when the page is not a
 * record of the model (the home page, a page the model does not list) or the tag is unknown.
 */
export function pageTagFor(page: string | null | undefined, reader: PageLookup): string | null {
  const text = (page ?? '').trim()
  if (!text) return null
  if (!text.startsWith('/')) return reader.get(text)?.id ?? null
  const [pathAndQuery] = text.split('#')
  const [rawPath, query = ''] = pathAndQuery.split('?')
  const path = rawPath.length > 1 ? rawPath.replace(/\/+$/, '') : rawPath
  const section = new URLSearchParams(query).get('section')
  const tries = [
    query ? `${path}?${query}` : path,
    section ? `${path}?section=${section}` : '',
    path,
  ]
  for (const address of tries) {
    const record = address ? reader.recordAt(address) : undefined
    if (record) return record.id
  }
  return null
}
