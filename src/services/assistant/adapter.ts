// SPDX-License-Identifier: AGPL-3.0-only
import type { PersonaId } from '@/data/personaIds'
import {
  ASSISTANT_GROUPS,
  ASSISTANT_NOT_HELD_NOTE,
  ASSISTANT_NOT_HELD_TEXT,
  assistantGoLink,
  type AssistantAnswer,
  type AssistantContext,
  type AssistantGroup,
  type AssistantGroupName,
  type AssistantIntent,
  type AssistantRow,
  type AssistantRowAction,
  type AssistantSource,
} from './contract'
import type { Answerer } from './engine/answerer'
import type { Reading } from './engine/engine'

/**
 * The Hub adapter: one typed async function, `answer(question, context)`.
 *
 * The first call loads the two knowledge files and the engine (nothing is fetched or parsed before that, and nothing here
 * is part of the main bundle: the engine, its data files and the file builder are dynamic imports). A failed load is
 * never remembered: the call resolves to the data-not-loaded state and the next call tries again.
 */

/** The fixed words of the failure notice (handoff 11.1). A test keeps them equal to the notes the engine reads. */
export const ASSISTANT_DATA_NOT_LOADED_MESSAGE = 'The Hub could not load the data for this answer.'
export const ASSISTANT_DATA_NOT_LOADED_KEPT =
  'Your question is kept in the box below. Nothing was lost. Try again, or keep browsing the Hub.'

interface Loaded {
  answerer: Answerer
  roles: Set<string>
  intents: Record<string, { label: string; direct: boolean }>
  /** The kind chip of a row: the engine's chip for the record's type, or the record's own kind when the engine has none. */
  chip: (tag: string, engineKind: string) => string
}

let loading: Promise<Loaded> | null = null

const YES_NO_VALUE = /^(?:yes|no|true|false)$/i
const YES_NO_QUESTION =
  /^\s*(?:is|are|was|were|does|do|did|can|could|must|should|will|would|has|have|may)\b/i

/**
 * Last check before a value is shown as a direct answer: when in doubt, resources only. A value that was cut short is
 * never shown, and a bare yes or no answers only a question that can be answered yes or no ("What does CNSA 2.0 require?"
 * is not one).
 */
export function directValueFits(question: string, value: string): boolean {
  const text = value.trim()
  if (!text || text.endsWith('…')) return false
  if (YES_NO_VALUE.test(text) && !YES_NO_QUESTION.test(question)) return false
  return true
}

async function load(): Promise<Loaded> {
  const [{ loadKnowledgeReader }, { loadKnowledgeText }] = await Promise.all([
    import('@/services/knowledge/knowledgeReader'),
    import('@/services/knowledge/knowledgeText'),
  ])
  const [reader, text, engine, build, data, patterns] = await Promise.all([
    loadKnowledgeReader(),
    loadKnowledgeText(),
    import('./engine/answerer'),
    import('./buildEngine'),
    import('./data/data.generated.json'),
    import('./data/answer.generated.json'),
  ])
  const { model, catalogue } = build.buildEngineInput(reader.core, text)
  class GuardedAnswerer extends engine.Answerer {
    override direct(question: string, reading: Reading) {
      const found = super.direct(question, reading)
      return found && directValueFits(question, String(found.value)) ? found : null
    }
  }
  // The Hub holds no successor passages to check against (no statements), so a "what replaced it" question never gets a
  // direct answer here: it gets the closest resources.
  const answerer = new GuardedAnswerer(data.default, catalogue, model, patterns.default, {}, {})
  const spec = data.default as unknown as {
    roles: { roles: Record<string, unknown> }
    intents: { intents: Record<string, { label: string; direct: boolean }> }
    rows: { kind_chip: Record<string, string> }
  }
  const chip = (tag: string, engineKind: string): string => {
    const rec = reader.get(tag)
    if (!rec || rec.type in spec.rows.kind_chip) return engineKind
    return rec.kind.charAt(0).toUpperCase() + rec.kind.slice(1)
  }
  return {
    answerer,
    roles: new Set(Object.keys(spec.roles.roles)),
    intents: spec.intents.intents,
    chip,
  }
}

/** Starts loading the knowledge files and the engine now (call when the drawer first opens). Never rejects. */
export function warmAssistant(): Promise<boolean> {
  return ensureLoaded().then(
    () => true,
    () => false
  )
}

function ensureLoaded(): Promise<Loaded> {
  const promise: Promise<Loaded> = (loading ??= load())
  promise.catch(() => {
    if (loading === promise) loading = null
  })
  return promise
}

/** Forgets the loaded engine (tests, and a retry after a deliberate reset). */
export function forgetAssistant(): void {
  loading = null
}

type Raw = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any -- the engine's own untyped result

const ACTIONS = new Set<string>([
  'Read here',
  'Try it here',
  'Go to module',
  'Go to section',
  'Open workshop step',
  'Go to page',
  'Open reference',
  'Open path',
])
const GROUP_SET = new Set<string>(ASSISTANT_GROUPS)
/** Strict-reader reasons that mean "the Hub does not hold this fact" (as opposed to "several records match"). */
const NOT_HELD_REASON =
  /no such value|holds no value|links nothing|no successor recorded|successor recorded but no supporting/

function toRow(raw: Raw, chip: Loaded['chip']): AssistantRow {
  const action = ACTIONS.has(raw.action) ? (raw.action as AssistantRowAction) : 'Go to page'
  const group: AssistantGroupName = GROUP_SET.has(raw.group) ? raw.group : 'Data pages'
  return {
    kind: chip(String(raw.tag), String(raw.kind)),
    tag: String(raw.tag),
    title: String(raw.title),
    source: raw.source ?? null,
    status: raw.status ?? null,
    dims: raw.dims ?? null,
    extract: String(raw.extract ?? ''),
    paidReferenceOnly: raw.paidReferenceOnly === true,
    action,
    link: String(raw.link),
    goLink: assistantGoLink(String(raw.tag)),
    group,
  }
}

function toGroups(raw: Raw[], chip: Loaded['chip']): AssistantGroup[] {
  return raw
    .filter((g) => GROUP_SET.has(g.name) && (g.rows.length || g.more.length))
    .map((g) => ({
      name: g.name as AssistantGroupName,
      rows: (g.rows as Raw[]).map((r) => toRow(r, chip)),
      more: (g.more as Raw[]).map((r) => toRow(r, chip)),
    }))
}

function related(list: Raw[] | undefined) {
  return (list ?? []).map((x) => ({
    title: String(x.title),
    tag: String(x.tag),
    goLink: assistantGoLink(String(x.tag)),
  }))
}

/** A question the engine answers by itself needs the knowledge files; a failure to load is a state, not an exception. */
export async function answer(
  question: string,
  ctx: AssistantContext = {}
): Promise<AssistantAnswer> {
  let loaded: Loaded
  try {
    loaded = await ensureLoaded()
  } catch {
    return {
      state: 'data-not-loaded',
      question,
      message: ASSISTANT_DATA_NOT_LOADED_MESSAGE,
      kept: ASSISTANT_DATA_NOT_LOADED_KEPT,
    }
  }
  const persona: PersonaId | null =
    ctx.persona && loaded.roles.has(ctx.persona) ? ctx.persona : null
  const raw = loaded.answerer.ask(question, persona) as Raw
  const intent = raw.intent as AssistantIntent
  const base = {
    question,
    intent,
    intentLabel: loaded.intents[intent]?.label ?? '',
    persona,
    answerText: String(raw.answerText),
    note: String(raw.note),
    groups: toGroups(raw.groups ?? [], loaded.chip),
  }

  if (intent === 'name') {
    if (raw.choices) {
      return {
        ...base,
        state: 'choices',
        choices: (raw.choices as Raw[]).map((c) => ({
          kind: loaded.chip(String(c.tag), String(c.kind)),
          title: String(c.title),
          tag: String(c.tag),
          goLink: assistantGoLink(String(c.tag)),
        })),
      }
    }
    if (raw.nameCard) {
      const c = raw.nameCard as Raw
      return {
        ...base,
        state: 'name',
        nameCard: {
          kind: loaded.chip(String(c.tag), String(c.kind)),
          title: String(c.title),
          tag: String(c.tag),
          link: String(c.link ?? ''),
          goLink: assistantGoLink(String(c.tag)),
          extract: String(c.extract ?? ''),
          taughtIn: related(c.taughtIn),
          tryIn: related(c.tryIn),
        },
      }
    }
  }

  const source = (s: Raw | null): AssistantSource | null =>
    s
      ? {
          label: s.label === 'Answer drawn from' ? 'Answer drawn from' : 'Closest source',
          kind: loaded.chip(String(s.tag), String(s.kind)),
          title: String(s.title),
          tag: String(s.tag),
          goLink: assistantGoLink(String(s.tag)),
        }
      : null

  if (raw.direct && raw.source) {
    const d = raw.direct as Raw
    const ev = d.evidence as Raw
    return {
      ...base,
      state: 'direct',
      direct: {
        value: String(d.value),
        field: d.field ?? null,
        tag: String(d.tag),
        goLink: assistantGoLink(String(d.tag)),
        evidence: {
          kind: String(ev.kind),
          title: String(ev.title),
          tag: String(ev.tag),
          revision: String(ev.revision),
          line: String(d.evidence_line),
        },
      },
      source: source(raw.source) as AssistantSource,
    }
  }
  if (intent === 'broad' && base.groups.length) return { ...base, state: 'broad' }
  if (intent === 'not_fact' && base.groups.length) return { ...base, state: 'not-a-fact' }
  if (!base.groups.length) {
    return {
      state: 'not-held',
      question,
      intent,
      persona,
      answerText: ASSISTANT_NOT_HELD_TEXT,
      note: ASSISTANT_NOT_HELD_NOTE,
      groups: [],
    }
  }
  const strict = loaded.answerer.answerRaw(question)
  const notHeld =
    loaded.intents[intent]?.direct === true &&
    strict.kind === 'unanswered' &&
    NOT_HELD_REASON.test(String(strict.reason ?? ''))
  return { ...base, state: 'resources', source: source(raw.source), notHeld }
}
