// SPDX-License-Identifier: AGPL-3.0-only

/**
 * The shape of `public/data/knowledge-text.json`, as far as the Hub reads it: for each record tag, the record's own text
 * (`full`: the lead sentence or definition, then one "Label: value" line per field). The file is large, so it is fetched
 * only when something needs the text (the Assistant's first answer), never on page load.
 */
export interface KnowledgeTextEntry {
  full: string
  url?: string
  /** Other text a record keeps: lesson summaries, topics, release notes, manual text, document passages. */
  summary?: string
  topic?: string
  curious?: string
  analysis?: string
  release_notes?: string
  manual?: string
  passages?: string[]
  /** A lesson's own text: [file name, text] pairs. */
  lesson?: [string, string][]
  quiz?: { question: string; options: Record<string, string>; explanation?: string }
  qa?: { id: string; question: string; answer: string }[]
  [k: string]: unknown
}

export interface KnowledgeTextFile {
  schema: string
  defaults?: Record<string, unknown>
  entries: Record<string, KnowledgeTextEntry>
}

let textPromise: Promise<KnowledgeTextFile> | null = null

/** The text file, fetched once and shared. A failed fetch is forgotten, so a retry fetches again. */
export function loadKnowledgeText(url = '/data/knowledge-text.json'): Promise<KnowledgeTextFile> {
  const promise: Promise<KnowledgeTextFile> = (textPromise ??= fetch(url).then(async (res) => {
    if (!res.ok) throw new Error(`knowledge text: ${res.status}`)
    return (await res.json()) as KnowledgeTextFile
  }))
  promise.catch(() => {
    if (textPromise === promise) textPromise = null
  })
  return promise
}
