// SPDX-License-Identifier: AGPL-3.0-only
import vocabulary from './research_topics_vocabulary.json'

/**
 * researchTopics — the controlled vocabulary of research topics a Library
 * document can be tagged with (CSV column `research_topics`, semicolon-
 * separated ids, multi-label, blank allowed).
 *
 * The vocabulary itself lives in `research_topics_vocabulary.json`; its ids are
 * stable identifiers stored in the Library CSV and in readers' saved field-watch
 * selections, so never rename one in place.
 */

export interface ResearchTopic {
  /** Stable kebab-case id, as written in the CSV `research_topics` column. */
  id: string
  label: string
  /** One sentence: what the topic covers. */
  definition: string
  /** Examples of what belongs in the topic. */
  include: string[]
  /** Examples of what does not, often naming the topic to use instead: "(use <id>)". */
  exclude: string[]
}

interface ResearchTopicVocabulary {
  version: number
  topics: ResearchTopic[]
}

const VOCABULARY = vocabulary as ResearchTopicVocabulary

/** Vocabulary version from the JSON file. */
export const RESEARCH_TOPICS_VERSION: number = VOCABULARY.version

/** Every research topic, in vocabulary order. */
export const RESEARCH_TOPICS: readonly ResearchTopic[] = VOCABULARY.topics

const TOPIC_BY_ID = new Map(RESEARCH_TOPICS.map((t) => [t.id, t]))

/** True when `id` is a known research-topic id (exact, lowercase). */
export function isResearchTopicId(id: string): boolean {
  return TOPIC_BY_ID.has(id)
}

/** Reader-facing label for a topic id, or `undefined` when the id is unknown. */
export function researchTopicLabel(id: string): string | undefined {
  return TOPIC_BY_ID.get(id)?.label
}

export interface ParsedResearchTopics {
  /** Known topic ids, deduplicated, in the order they appear in the cell. */
  topics: string[]
  /** Tokens that are not vocabulary ids (after trim + lowercase); dropped from `topics`. */
  unknown: string[]
}

/**
 * Parse a `research_topics` CSV cell: split on `;`, trim, lowercase, keep only
 * known ids (deduplicated). Unknown tokens are dropped and reported in
 * `unknown` so a caller can count them. Blank or absent cells give no topics.
 */
export function parseResearchTopicsDetailed(cell: string | null | undefined): ParsedResearchTopics {
  const topics: string[] = []
  const unknown: string[] = []
  if (!cell) return { topics, unknown }
  for (const raw of cell.split(';')) {
    const token = raw.trim().toLowerCase()
    if (!token) continue
    if (TOPIC_BY_ID.has(token)) {
      if (!topics.includes(token)) topics.push(token)
    } else {
      unknown.push(token)
    }
  }
  return { topics, unknown }
}

let unknownTopicTokenCount = 0

/**
 * Parse a `research_topics` CSV cell into known topic ids (see
 * `parseResearchTopicsDetailed`). Unknown ids are dropped and added to a running
 * count, readable through `unknownResearchTopicCount()`.
 */
export function parseResearchTopics(cell: string | null | undefined): string[] {
  const { topics, unknown } = parseResearchTopicsDetailed(cell)
  unknownTopicTokenCount += unknown.length
  return topics
}

/** How many unknown topic tokens `parseResearchTopics` has dropped so far. */
export function unknownResearchTopicCount(): number {
  return unknownTopicTokenCount
}

export interface ResearchTopicCount {
  id: string
  label: string
  count: number
}

/**
 * Per-topic document counts over `items`, in vocabulary order, keeping only
 * topics at least one item carries. An empty result means nothing is tagged yet.
 */
export function researchTopicCounts(
  items: readonly { researchTopics?: readonly string[] }[]
): ResearchTopicCount[] {
  const counts = new Map<string, number>()
  for (const item of items) {
    for (const id of item.researchTopics ?? []) counts.set(id, (counts.get(id) ?? 0) + 1)
  }
  return RESEARCH_TOPICS.flatMap((t) => {
    const count = counts.get(t.id) ?? 0
    return count > 0 ? [{ id: t.id, label: t.label, count }] : []
  })
}

/** URL param for the Library's research-topic filter (`?topic=<id>`). */
export const RESEARCH_TOPIC_PARAM = 'topic'

/**
 * The topic named by `?topic=`, when it is one the Library actually has
 * documents for; otherwise 'All'. An unknown id, or any id while nothing is
 * tagged yet, filters nothing rather than emptying the list.
 */
export function resolveResearchTopicParam(
  raw: string | null,
  available: readonly ResearchTopicCount[]
): string {
  if (!raw) return 'All'
  const id = raw.trim().toLowerCase()
  return available.some((t) => t.id === id) ? id : 'All'
}

/**
 * Shown wherever topic counts would appear while no Library row carries a topic
 * yet: a row of zeros would read as "nothing happened in this topic", which the
 * data cannot say.
 */
export const RESEARCH_TOPIC_TAGS_PENDING_NOTE =
  'Topic tags are being added to the Library; counts appear as entries are tagged.'
