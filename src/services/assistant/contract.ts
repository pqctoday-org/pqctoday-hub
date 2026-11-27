// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The Assistant's answer contract (UX handoff section 9 and 14; design note section 5).
 *
 * The answer engine returns data and the drawer draws it with fixed blocks. Nothing here is generated wording: every
 * sentence is either the Hub's own text or one of the fixed notes of the copy deck, and the engine never writes a
 * sentence of its own. This file holds types and two pure helpers only, so the drawer can import it without loading
 * the engine, the knowledge files or any data.
 *
 * A stored answer keeps its row TAGS, not their text (handoff 9.9): `AssistantRow.tag` is the stable key, and the text
 * is read again from the knowledge files when it is shown. Every answer carries its own groups (handoff 5.4), so an
 * earlier answer never loses its list when a new question is asked.
 */
import type { PersonaId } from '@/data/personaIds'

/** The four groups of resources, in the names the learner sees. */
export const ASSISTANT_GROUPS = ['Learn', 'References', 'Tools', 'Data pages'] as const
export type AssistantGroupName = (typeof ASSISTANT_GROUPS)[number]

/** Up to this many rows of a group show at once; the rest sit behind "Show n more records". */
export const ASSISTANT_ROWS_PER_GROUP = 3

/** What the question was read as (handoff 9.3): the 17 intents, plus a bare name and a broad request. */
export type AssistantIntent =
  | 'name'
  | 'concept'
  | 'fact'
  | 'list'
  | 'compare'
  | 'currency'
  | 'dates'
  | 'rules'
  | 'risk'
  | 'learning'
  | 'business_tool'
  | 'technical_tool'
  | 'planning'
  | 'products'
  | 'source_document'
  | 'people'
  | 'site'
  | 'not_fact'
  | 'broad'

/** What the learner is doing, as far as the Assistant may use it. Every field is optional; none is required to ask. */
export interface AssistantContext {
  /** The learner's role: orders the groups when the question has no order of its own (handoff 9.3). */
  persona?: PersonaId | null
  /** An industry the learner works in (one of the Hub's fixed industry names). Accepted now; not yet used to order rows. */
  industry?: string | null
  /** A region group or place (for example `EU`, `US`). Accepted now; not yet used to order rows. */
  region?: string | null
  /**
   * The page the learner is on: its knowledge tag (a lesson, a section, a record), or its Hub address, which the engine host reads
   * as a tag. The engine uses it only to move the resources of that page, and those linked to it, earlier in their group.
   * It never adds or removes a resource and never changes the kind of answer.
   */
  page?: string | null
}

/** The lesson a record belongs to in the Learn tree (its home lesson), read from the knowledge file. */
export interface AssistantHomeLesson {
  tag: string
  title: string
  /** The Hub address of the lesson. */
  link: string
}

/** The link of its kind a record holds, so a question about it can be offered (see `recordLinkOf`). */
export interface AssistantRecordLink {
  relation: 'made_by' | 'makes' | 'certifies' | 'publishes'
  /** What a question calls the record, when that is not its title (a certification by its number). */
  name?: string
}

/** One action label per row (handoff 9.7). */
export type AssistantRowAction =
  | 'Read here'
  | 'Try it here'
  | 'Go to module'
  | 'Go to section'
  | 'Open workshop step'
  | 'Go to page'
  | 'Open reference'
  | 'Open path'

/**
 * One resource (handoff 9.7, row anatomy). The same row is drawn on desktop and phone.
 * Fields that may be empty are `null`, never absent, so a row always has the same shape.
 */
export interface AssistantRow {
  /** The kind chip: "Glossary term", "Library document", "Module", "Compliance framework". Always present. */
  kind: string
  /** The canonical tag (`LIB:FIPS 203`, `GL:ml-kem`, `LM-008`, `LM-008/s:intro`, `TOOL:tls-simulator`, `PAGE:library`). */
  tag: string
  /** The Hub's own title for the record. */
  title: string
  /** The plain origin, without the word "Source:": "Hub glossary", "NIST standard". Records only; `null` for a lesson or page. */
  source: string | null
  /** The record's own status where the Hub keeps one ("Final Standard"); only active records are ever offered. */
  status: string | null
  /** The dimension line: "Stage: Practitioner", or "Industries: Finance & Insurance · Place: EU". NICE labels never appear. */
  dims: string | null
  /** The Hub's own words, a short extract. Empty for a record that has none. For a paid standard it is never a quote. */
  extract: string
  /** True for a paid standard: the row says the Hub links to it and the drawer shows no quote. */
  paidReferenceOnly: boolean
  /** The one action of the row. */
  action: AssistantRowAction
  /** The Hub address the action opens (a page, with the record selected where the page supports it). */
  link: string
  /** The short address `/go/<tag>`: what "Copy link" copies, and the only address that is ever saved or shared. */
  goLink: string
  /** The group the row belongs to. */
  group: AssistantGroupName
  /** The lesson the record belongs to, when it has one that is not itself or a part of it. Absent in an answer saved before this. */
  homeLesson?: AssistantHomeLesson | null
}

/** A group of rows: up to three shown, the rest behind one control. Empty groups are never returned. */
export interface AssistantGroup {
  name: AssistantGroupName
  rows: AssistantRow[]
  /** The rows after the first three, best first (the drawer joins them across groups under "Show n more records"). */
  more: AssistantRow[]
  /**
   * Set when this group is not the first and its first row is not a strong match for the question:
   * its rows are listed after the rows of the other groups.
   */
  late?: true
}

/** The evidence of a direct answer (handoff 9.4): which record, which data file revision. */
export interface AssistantEvidence {
  kind: string
  title: string
  tag: string
  /** "Verified 2026-09-08, library_11242026_r6" for a library document, "Data file compliance_11182026_r3" for others. */
  revision: string
  /** The full line as the copy deck words it: "Evidence: <kind>: <title> (<tag>). <revision>. Checked against the record." */
  line: string
}

/**
 * The direct answer (handoff 9.4). Present only when the intent allows one, exactly one record matches the thing the
 * question names, and that record holds the value and has evidence. A direct answer is never shown alone.
 */
export interface AssistantDirect {
  /** The value copied from the record, exactly as the record holds it. */
  value: string
  /** The record field the value came from, when it came from a field. */
  field: string | null
  /** The tag of the record the value was read from. */
  tag: string
  goLink: string
  evidence: AssistantEvidence
}

/** The source line under the answer (handoff 9.5). Hidden for a name, a broad question and a not-a-fact question. */
export interface AssistantSource {
  /** "Answer drawn from" (a direct answer) or "Closest source" (no direct answer). */
  label: 'Answer drawn from' | 'Closest source'
  kind: string
  title: string
  tag: string
  goLink: string
  /** The link of its kind the record holds, so a question about it can follow the answer. */
  recordLink?: AssistantRecordLink | null
}

/** A link to a lesson or tool beside a name card ("Taught in ...", "Try it in ..."). */
export interface AssistantRelatedLink {
  title: string
  tag: string
  goLink: string
}

/** The card for a bare name (handoff 6.16): exactly one record matches the whole question. */
export interface AssistantNameCard {
  kind: string
  title: string
  tag: string
  link: string
  goLink: string
  extract: string
  taughtIn: AssistantRelatedLink[]
  tryIn: AssistantRelatedLink[]
  /** The link of its kind the record holds, so a question about it can follow the answer. */
  recordLink?: AssistantRecordLink | null
}

/** One named choice when several records share a name (the "ambiguous follow-up" exception). */
export interface AssistantChoice {
  kind: string
  title: string
  tag: string
  goLink: string
}

/** Fields every answer carries. */
interface AssistantAnswerBase {
  /** The question as asked. */
  question: string
  /** What it was read as. */
  intent: AssistantIntent
  /** The label the note uses for the intent ("a concept", "a fact, a date or a rule"). */
  intentLabel: string
  /** The learner's role the group order was chosen for, or null (first visit order). */
  persona: PersonaId | null
  /** One of the fixed answer texts: "Here is what the Hub holds on this." / "One Hub record matches that name." / ... */
  answerText: string
  /** The exact note of the copy deck (handoff 9.5). */
  note: string
  /** The four groups in the order this intent calls for. Empty groups are left out. */
  groups: AssistantGroup[]
}

/**
 * The learner asked for a fact and the Hub holds a direct answer for it, with evidence.
 * `groups` follow it (the resources are always shown with a direct answer).
 */
export interface AssistantDirectAnswer extends AssistantAnswerBase {
  state: 'direct'
  direct: AssistantDirect
  source: AssistantSource
}

/**
 * Resources only. Note: "... No direct answer: resources only." Used for every question that is not a bare name, a broad
 * request or a not-a-fact question and has no direct answer. `source` is the closest record, or null when there is none.
 * `notHeld` is true when the intent could have had a direct answer but the Hub does not hold the fact (the drawer may say so).
 */
export interface AssistantResourcesAnswer extends AssistantAnswerBase {
  state: 'resources'
  source: AssistantSource | null
  notHeld: boolean
}

/** A bare name that matches exactly one record: the card, then related resources. No source line. */
export interface AssistantNameAnswer extends AssistantAnswerBase {
  state: 'name'
  nameCard: AssistantNameCard
}

/** A bare name that matches several records: named choices instead of a card. No groups until one is chosen. */
export interface AssistantChoicesAnswer extends AssistantAnswerBase {
  state: 'choices'
  choices: AssistantChoice[]
}

/** A broad request ("Tell me something"): the broad note, the closest resources, no source line. */
export interface AssistantBroadAnswer extends AssistantAnswerBase {
  state: 'broad'
}

/** A prediction, an opinion or personal advice: the not-a-fact note, the closest resources, no source line. */
export interface AssistantNotFactAnswer extends AssistantAnswerBase {
  state: 'not-a-fact'
}

/**
 * The Hub holds nothing that matches: no groups at all. The drawer shows the question and the words of
 * `ASSISTANT_NOT_HELD_TEXT`. Rare, because a broad match still returns the closest resources.
 */
export interface AssistantNotHeldAnswer {
  state: 'not-held'
  question: string
  intent: AssistantIntent
  persona: PersonaId | null
  answerText: string
  note: string
  groups: []
}

/**
 * The knowledge files did not load (handoff 11.1): no answer and no resources. The drawer keeps the question in its input
 * and offers "Try again", which calls `answer()` again with the same question (a failed load is never remembered).
 */
export interface AssistantDataNotLoaded {
  state: 'data-not-loaded'
  question: string
  /** "The Hub could not load the data for this answer." */
  message: string
  /** "Your question is kept in the box below. Nothing was lost. Try again, or keep browsing the Hub." */
  kept: string
}

/** What `answer()` resolves to. It never rejects. */
export type AssistantAnswer =
  | AssistantDirectAnswer
  | AssistantResourcesAnswer
  | AssistantNameAnswer
  | AssistantChoicesAnswer
  | AssistantBroadAnswer
  | AssistantNotFactAnswer
  | AssistantNotHeldAnswer
  | AssistantDataNotLoaded

/** The fixed words of the not-held state (copy deck: plain words, says what the Hub holds, no model words). */
export const ASSISTANT_NOT_HELD_TEXT = 'The Hub does not hold an answer to this question.'
export const ASSISTANT_NOT_HELD_NOTE =
  'Try a standard, an algorithm, a date, a product or a lesson by name, or browse a page from the rail.'

/** The short address of a tag: `/go/LIB:FIPS%20203`. Colons and slashes stay readable; the rest is percent-encoded. */
export function assistantGoLink(tag: string): string {
  return '/go/' + encodeURIComponent(tag).replace(/%3A/gi, ':').replace(/%2F/gi, '/')
}
