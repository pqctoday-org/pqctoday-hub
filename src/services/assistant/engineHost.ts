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
  type AssistantHomeLesson,
  type AssistantRecordLink,
  type AssistantIntent,
  type AssistantRow,
  type AssistantRowAction,
  type AssistantSource,
} from './contract'
import { loadKnowledgeReader } from '@/services/knowledge/knowledgeReader'
import { loadKnowledgeText } from '@/services/knowledge/knowledgeText'
import { buildEngineInput } from './buildEngine'
import patternFile from './data/answer.generated.json'
import dataFile from './data/data.generated.json'
import { Answerer } from './engine/answerer'
import { pageTagFor } from './pageTag'
import { homeLessonOf, recordLinkOf } from './recordLinks'
import type { Reading } from './engine/engine'

/**
 * Loads the knowledge files and the engine and answers on the thread it runs on: the page's own thread where Web Workers
 * are not available, otherwise the worker (`engine.worker.ts`). Its imports are static on purpose: a worker is built as one
 * file, and the page's own thread loads this whole file only when there is no worker. Nothing here runs until the first question. A failed
 * load is never remembered, and it rejects: `adapter.ts` turns that into the data-not-loaded state.
 */

interface Loaded {
  answerer: Answerer
  roles: Set<string>
  intents: Record<string, { label: string; direct: boolean }>
  /** The kind chip of a row: the engine's chip for the record's type, or the record's own kind when the engine has none. */
  chip: (tag: string, engineKind: string) => string
  /** Where a row opens: the engine's address, except a short `/go/` address, which becomes the record's own address. */
  address: (tag: string, engineLink: string) => string
  /** The knowledge tag of the page the learner is on (given as a tag or an address), or null when the page is not a record. */
  pageTag: (page: string | null | undefined) => string | null
  /** What the knowledge file says about a record beside an answer: its home lesson and the link of its kind. */
  about: (
    tag: string,
    link: string
  ) => { homeLesson: AssistantHomeLesson | null; recordLink: AssistantRecordLink | null }
}

let loading: Promise<Loaded> | null = null

const YES_NO_VALUE = /^(?:yes|no|true|false)$/i
const YES_NO_QUESTION =
  /^\s*(?:is|are|was|were|does|do|did|can|could|must|should|will|would|has|have|may)\b/i

/**
 * Last check before a value is shown as a direct answer: when in doubt, resources only. A value that was cut short is
 * never shown, and a bare yes or no answers only a question that can be answered yes or no ("What does CNSA 2.0 require?"
 * is not one), and neither is the mark that says whether a rule asks for post-quantum cryptography.
 */
export function directValueFits(
  question: string,
  value: string,
  field: string | null = null
): boolean {
  const text = value.trim()
  if (!text || text.endsWith('…')) return false
  const yesNo = YES_NO_QUESTION.test(question)
  if (YES_NO_VALUE.test(text) && !yesNo) return false
  // a record's "requires post-quantum cryptography" mark (yes, no, expected, guidance) says whether, never what
  if (field === 'requires_pqc' && !yesNo) return false
  return true
}

async function load(): Promise<Loaded> {
  const [reader, text] = await Promise.all([loadKnowledgeReader(), loadKnowledgeText()])
  const { model, catalogue, statements } = buildEngineInput(reader.core, text)
  class GuardedAnswerer extends Answerer {
    override direct(question: string, reading: Reading) {
      const found = super.direct(question, reading)
      return found && directValueFits(question, String(found.value), found.field ?? null)
        ? found
        : null
    }
  }
  const answerer = new GuardedAnswerer(dataFile, catalogue, model, patternFile, statements, {})
  const spec = dataFile as unknown as {
    roles: { roles: Record<string, unknown> }
    intents: { intents: Record<string, { label: string; direct: boolean }> }
    rows: { kind_chip: Record<string, string> }
  }
  const chip = (tag: string, engineKind: string): string => {
    const rec = reader.get(tag)
    if (!rec || rec.type in spec.rows.kind_chip) return engineKind
    return rec.kind.charAt(0).toUpperCase() + rec.kind.slice(1)
  }
  const address = (tag: string, engineLink: string): string =>
    engineLink.startsWith('/go/') ? (reader.get(tag)?.link ?? engineLink) : engineLink
  return {
    answerer,
    roles: new Set(Object.keys(spec.roles.roles)),
    intents: spec.intents.intents,
    chip,
    address,
    pageTag: (page) => pageTagFor(page, reader),
    about: (tag, link) => ({
      homeLesson: homeLessonOf(reader, tag, link),
      recordLink: recordLinkOf(reader, tag),
    }),
  }
}

/** Loads the files and builds the engine now, so the first question finds it ready. Rejects when they do not load. */
export async function warmThisThread(): Promise<void> {
  await ensureLoaded()
}

function ensureLoaded(): Promise<Loaded> {
  const promise: Promise<Loaded> = (loading ??= load())
  promise.catch(() => {
    if (loading === promise) loading = null
  })
  return promise
}

/** Forgets the loaded engine (tests, and a retry after a deliberate reset). */
export function forgetThisThread(): void {
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

function toRow(raw: Raw, loaded: Loaded): AssistantRow {
  const { chip, address } = loaded
  const action = ACTIONS.has(raw.action) ? (raw.action as AssistantRowAction) : 'Go to page'
  const group: AssistantGroupName = GROUP_SET.has(raw.group) ? raw.group : 'Data pages'
  const where = address(String(raw.tag), String(raw.link))
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
    link: where,
    goLink: assistantGoLink(String(raw.tag)),
    group,
    homeLesson: loaded.about(String(raw.tag), where).homeLesson,
  }
}

function toGroups(raw: Raw[], loaded: Loaded): AssistantGroup[] {
  return raw
    .filter((g) => GROUP_SET.has(g.name) && (g.rows.length || g.more.length))
    .map((g) => ({
      name: g.name as AssistantGroupName,
      rows: (g.rows as Raw[]).map((r) => toRow(r, loaded)),
      more: (g.more as Raw[]).map((r) => toRow(r, loaded)),
    }))
}

function related(list: Raw[] | undefined) {
  return (list ?? []).map((x) => ({
    title: String(x.title),
    tag: String(x.tag),
    goLink: assistantGoLink(String(x.tag)),
  }))
}

/** Answers one question on this thread. Rejects when the knowledge files do not load. */
export async function answerOnThisThread(
  question: string,
  ctx: AssistantContext = {}
): Promise<AssistantAnswer> {
  const loaded = await ensureLoaded()
  const persona: PersonaId | null =
    ctx.persona && loaded.roles.has(ctx.persona) ? ctx.persona : null
  const raw = loaded.answerer.ask(question, persona, null, loaded.pageTag(ctx.page)) as Raw
  const intent = raw.intent as AssistantIntent
  const base = {
    question,
    intent,
    intentLabel: loaded.intents[intent]?.label ?? '',
    persona,
    answerText: String(raw.answerText),
    note: String(raw.note),
    groups: toGroups(raw.groups ?? [], loaded),
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
          recordLink: loaded.about(String(c.tag), String(c.link ?? '')).recordLink,
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
          recordLink: loaded.about(String(s.tag), '').recordLink,
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
