// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The rules the drawer enforces on whatever an engine hands it, so that a faulty answer can never
 * show more than the contract allows. The drawer reads only the fields of the contract: anything
 * else on an answer object (a private field, a code) is never drawn.
 */
import {
  ASSISTANT_NOT_HELD_NOTE,
  ASSISTANT_NOT_HELD_TEXT,
  ASSISTANT_ROWS_PER_GROUP,
  type AssistantAnswer,
  type AssistantChoice,
  type AssistantDirect,
  type AssistantGroup,
  type AssistantNameCard,
  type AssistantRow,
  type AssistantSource,
} from '@/services/assistant/contract'
import { COPY } from './copy'

/** An answer the drawer can draw: everything except the failure state, which has its own notice. */
export type RenderableAnswer = Exclude<AssistantAnswer, { state: 'data-not-loaded' }>

/** A module's own text, shown in a box after a built sentence about that module (not in the contract yet). */
export interface PassageBox {
  heading: string
  text: string
}

export interface PreparedAnswer {
  state: RenderableAnswer['state']
  question: string
  answerText: string
  note: string
  passage: PassageBox | null
  direct: AssistantDirect | null
  source: AssistantSource | null
  nameCard: AssistantNameCard | null
  choices: AssistantChoice[]
  groups: AssistantGroup[]
  /** Rows beyond three per group, plus each group's own `more`. */
  hiddenCount: number
  /** True when the Hub holds nothing: no groups, no card, no direct answer. */
  held: boolean
  /** True when a direct answer lacked evidence and the drawer drew "resources only" instead. */
  downgraded: boolean
}

const filled = (s: string | null | undefined): s is string =>
  typeof s === 'string' && s.trim().length > 0

/** A direct answer needs a value and complete evidence. Otherwise it is not one. */
export function validDirect(direct: AssistantDirect | undefined): AssistantDirect | null {
  if (!direct || !filled(direct.value)) return null
  const e = direct.evidence
  if (!e || ![e.kind, e.title, e.tag, e.revision].every(filled)) return null
  return direct
}

function normaliseGroups(groups: readonly AssistantGroup[] | undefined): AssistantGroup[] {
  return (groups ?? [])
    .map((g) => {
      const all: AssistantRow[] = [...(g.rows ?? []), ...(g.more ?? [])]
      return {
        name: g.name,
        rows: all.slice(0, ASSISTANT_ROWS_PER_GROUP),
        more: all.slice(ASSISTANT_ROWS_PER_GROUP),
      }
    })
    .filter((g) => g.rows.length > 0)
}

export function prepareAnswer(answer: RenderableAnswer): PreparedAnswer {
  const groups = normaliseGroups(answer.groups)
  const hiddenCount = groups.reduce((n, g) => n + g.more.length, 0)
  const passage =
    (answer as { passage?: PassageBox }).passage &&
    filled((answer as { passage?: PassageBox }).passage?.text)
      ? ((answer as { passage?: PassageBox }).passage as PassageBox)
      : null
  const common = {
    state: answer.state,
    question: answer.question,
    passage,
    groups,
    hiddenCount,
  }

  if (answer.state === 'not-held') {
    return {
      ...common,
      answerText: filled(answer.answerText) ? answer.answerText : ASSISTANT_NOT_HELD_TEXT,
      note: filled(answer.note) ? answer.note : ASSISTANT_NOT_HELD_NOTE,
      direct: null,
      source: null,
      nameCard: null,
      choices: [],
      groups: [],
      hiddenCount: 0,
      held: true,
      downgraded: false,
    }
  }

  let direct: AssistantDirect | null = null
  let downgraded = false
  let note = answer.note ?? ''
  let source: AssistantSource | null = null

  if (answer.state === 'direct') {
    direct = validDirect(answer.direct)
    downgraded = !direct
    if (downgraded && !note.includes(COPY.noDirect)) note = `${note} ${COPY.noDirect}`.trim()
    source = answer.source ?? null
    // Without a valid direct answer the source is only the closest one.
    if (source && !direct) source = { ...source, label: 'Closest source' }
  } else if (answer.state === 'resources') {
    source = answer.source ?? null
    if (source && source.label !== 'Closest source') source = { ...source, label: 'Closest source' }
  }

  const nameCard = answer.state === 'name' ? (answer.nameCard ?? null) : null
  const choices = answer.state === 'choices' ? (answer.choices ?? []) : []
  const held =
    groups.length === 0 && !direct && !nameCard && choices.length === 0 && answer.state !== 'name'

  return {
    ...common,
    answerText: filled(answer.answerText)
      ? answer.answerText
      : nameCard
        ? COPY.answerName
        : COPY.answerDefault,
    note,
    direct,
    source,
    nameCard,
    choices,
    held,
    downgraded,
  }
}

/** Evidence line of a direct answer: the engine's own line, built the same way when it has none. */
export function evidenceLine(d: AssistantDirect): string {
  if (filled(d.evidence.line)) return d.evidence.line
  const rev = d.evidence.revision.trim().replace(/\.$/, '')
  return `Evidence: ${d.evidence.kind}: ${d.evidence.title} (${d.evidence.tag}). ${rev}. Checked against the record.`
}

/** Source line text. */
export function sourceLineText(s: AssistantSource): string {
  return `${s.label}: ${s.kind}: ${s.title} (${s.tag})`
}

/** Every row tag in an answer, for a saved answer (tags only, never the rows' text). */
export function rowTagsOf(answer: RenderableAnswer): string[] {
  const tags = new Set<string>()
  for (const g of answer.groups ?? []) for (const r of [...g.rows, ...g.more]) tags.add(r.tag)
  if (answer.state === 'name' && answer.nameCard) tags.add(answer.nameCard.tag)
  if (answer.state === 'choices') for (const c of answer.choices ?? []) tags.add(c.tag)
  return [...tags]
}

export function resourceCount(answer: RenderableAnswer): number {
  return rowTagsOf(answer).length
}

/** The tag of the answer's source, for a saved answer. */
export function sourceTagOf(answer: RenderableAnswer): string | undefined {
  if (answer.state === 'direct' || answer.state === 'resources') return answer.source?.tag
  return undefined
}

/** A name card as a row, so the one row action and the record viewer can take it. */
export function nameCardAsRow(card: AssistantNameCard): AssistantRow {
  return {
    kind: card.kind,
    tag: card.tag,
    title: card.title,
    source: null,
    status: null,
    dims: null,
    extract: card.extract,
    paidReferenceOnly: false,
    action: 'Go to page',
    link: card.link,
    goLink: card.goLink,
    group: 'Data pages',
  }
}

/** A named choice as a row. */
export function choiceAsRow(choice: AssistantChoice): AssistantRow {
  return {
    kind: choice.kind,
    tag: choice.tag,
    title: choice.title,
    source: null,
    status: null,
    dims: null,
    extract: '',
    paidReferenceOnly: false,
    action: 'Go to page',
    link: choice.goLink,
    goLink: choice.goLink,
    group: 'Data pages',
  }
}
