// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The research question (researcher evidence workspace, Layer 2): what the
 * researcher is checking, what kind of question it is, which sources count
 * and which do not, and how much evidence is enough. Saved as a
 * `research-question` document: `inputs` holds the question, `data` its
 * Markdown. It opens the evidence bundle.
 */
import type { ExecutiveDocument } from '@/services/storage/types'

export const RESEARCH_QUESTION_SCHEMA = 'pqctoday.research-question/1'

/** moduleId prefix of saved questions: `research-question:<created ms>`. */
export const RESEARCH_QUESTION_PREFIX = 'research-question:'

export type ResearchQuestionType =
  | 'standard-state'
  | 'security-claim'
  | 'implementation-result'
  | 'threat-forecast'
  | 'protocol-binding'
  | 'domain-impact'
  | 'patent-landscape'

export const RESEARCH_QUESTION_TYPES: { id: ResearchQuestionType; label: string; hint: string }[] =
  [
    {
      id: 'standard-state',
      label: 'Standard state',
      hint: 'Where a standard or draft stands, and what changed.',
    },
    {
      id: 'security-claim',
      label: 'Security claim',
      hint: 'Whether a stated security property holds, and on what assumptions.',
    },
    {
      id: 'implementation-result',
      label: 'Implementation result',
      hint: 'Whether an implementation reproduces known answers.',
    },
    {
      id: 'threat-forecast',
      label: 'Threat forecast',
      hint: 'How firm an estimate of quantum capability or timing is.',
    },
    {
      id: 'protocol-binding',
      label: 'Protocol binding',
      hint: 'How an algorithm is bound into a protocol (codepoints, encodings, combiners).',
    },
    {
      id: 'domain-impact',
      label: 'Domain impact',
      hint: 'What the change means for one sector or system.',
    },
    {
      id: 'patent-landscape',
      label: 'Patent landscape',
      hint: 'Who holds patents that touch the scheme, and where.',
    },
  ]

export const questionTypeLabel = (t: ResearchQuestionType) =>
  RESEARCH_QUESTION_TYPES.find((x) => x.id === t)?.label ?? t

export interface ResearchQuestion {
  schema: typeof RESEARCH_QUESTION_SCHEMA
  question: string
  type: ResearchQuestionType
  /** Which sources count (one per line). */
  inclusion: string
  /** Which sources do not count (one per line). */
  exclusion: string
  /** How much evidence is enough to answer. */
  threshold: string
}

export const emptyQuestion = (): ResearchQuestion => ({
  schema: RESEARCH_QUESTION_SCHEMA,
  question: '',
  type: 'standard-state',
  inclusion: '',
  exclusion: '',
  threshold: '',
})

const orNotStated = (s: string) => s.trim() || '_Not stated._'

export function questionMarkdown(q: ResearchQuestion): string {
  return [
    `# Research question`,
    '',
    `> ${q.question.trim() || 'Not stated.'}`,
    '',
    `- Type: ${questionTypeLabel(q.type)}`,
    '',
    '## Included sources',
    '',
    orNotStated(q.inclusion),
    '',
    '## Excluded sources',
    '',
    orNotStated(q.exclusion),
    '',
    '## Evidence threshold',
    '',
    orNotStated(q.threshold),
  ].join('\n')
}

/** What is still blank; the form names these before saving. */
export function questionGaps(q: ResearchQuestion): string[] {
  const gaps: string[] = []
  if (!q.inclusion.trim()) gaps.push('inclusion criteria')
  if (!q.exclusion.trim()) gaps.push('exclusion criteria')
  if (!q.threshold.trim()) gaps.push('evidence threshold')
  return gaps
}

const isString = (v: unknown): v is string => typeof v === 'string'

export function readQuestion(
  doc: Pick<ExecutiveDocument, 'type' | 'inputs'>
): ResearchQuestion | null {
  if (doc.type !== 'research-question') return null
  const q = doc.inputs as Partial<ResearchQuestion> | undefined
  if (!q || q.schema !== RESEARCH_QUESTION_SCHEMA || !isString(q.question)) return null
  return {
    schema: RESEARCH_QUESTION_SCHEMA,
    question: q.question,
    type: RESEARCH_QUESTION_TYPES.some((t) => t.id === q.type)
      ? (q.type as ResearchQuestionType)
      : 'standard-state',
    inclusion: isString(q.inclusion) ? q.inclusion : '',
    exclusion: isString(q.exclusion) ? q.exclusion : '',
    threshold: isString(q.threshold) ? q.threshold : '',
  }
}

const shortTitle = (q: string) => {
  const t = q.trim().replace(/\s+/g, ' ')
  return t.length > 80 ? `${t.slice(0, 77)}…` : t || 'Untitled question'
}

export function questionSaveRequest(q: ResearchQuestion, moduleId: string, edited = false) {
  return {
    type: 'research-question' as const,
    moduleId,
    title: shortTitle(q.question),
    data: questionMarkdown(q),
    inputs: q,
    ...(edited ? { revisionSummary: 'Question edited' } : {}),
  }
}

export const newQuestionModuleId = (now: Date = new Date()) =>
  `${RESEARCH_QUESTION_PREFIX}${now.getTime()}`
