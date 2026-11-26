// SPDX-License-Identifier: AGPL-3.0-only
import { questionKey } from './askedKey'
import { STARTING_SUGGESTIONS } from './copy'
import type { AnswerSuggestion } from './Suggestions'

/**
 * The suggestion ranker: which questions the drawer offers, and in what order.
 *
 * A pure function of what the learner is doing. It reads the state it is given and writes nothing: it holds no store, calls no
 * setter and imports no journey or objective code (a test reads this file's imports to keep it so). The same state always gives
 * the same questions.
 *
 * Five rules, in order. Each adds its questions; the first question of the first rule that applies is the main one.
 *   1. what the learner just read, finished or is viewing: the rows of the last answer, then a lesson finished a moment ago,
 *      then the page the learner is on
 *   2. the next step of the focused objective (with no objective in focus and several active ones: the most recently used
 *      objective first, then the others, each with its next step)
 *   3. a lesson to take first for that step, not yet finished (a prerequisite)
 *   4. an update to a lesson in the objective
 *   5. exploring the learner's role
 * The starting questions of the copy deck follow, so there is always something to ask. A question already asked is left out:
 * one asked in this conversation, and one asked earlier while the objective and the progress were as they are now. Ties inside
 * a rule go by curriculum order, then tag.
 *
 * Every question is a template over a lesson, a section, a tool, a record or a role, so it names a thing the Hub holds and the
 * answer engine can answer it (tests ask every lesson, section, tool and role of the catalog).
 */

export type SuggestionRule = 1 | 2 | 3 | 4 | 5 | 6

export interface RankedSuggestion extends AnswerSuggestion {
  /** The plain-language reason, shown under "Why this question?": it starts with what the question is based on. */
  why: string
  /** The rule that produced it; 6 is the starting questions that follow the five rules. */
  rule: SuggestionRule
  /** What it is based on, as a short phrase: "next step in your objective, TLS Basics". */
  basedOn: string
}

/** A lesson as the ranker needs it: its tag, its title and its place in the curriculum (stage, track, then id). */
export interface LessonRef {
  tag: string
  title: string
  /** Position in the curriculum; smaller comes first. */
  order: number
}

/** The thing a step of an objective points at: a lesson, or a tool. */
export interface StepRef extends LessonRef {
  kind: 'lesson' | 'tool'
}

export interface ViewingRef {
  /** The knowledge tag of what is on the page. */
  tag: string
  title: string
  kind: 'lesson' | 'section' | 'record'
  /** For a section: the title of its lesson. */
  lessonTitle?: string
}

export interface ChangedLesson extends LessonRef {
  /** "New section", "Tool updated": the plain name of the kind of change. */
  kindLabel: string
}

export interface ObjectiveRef {
  /** The learner's own title for the objective. */
  title: string
  /** The next step, when it is a lesson or a tool. */
  next: StepRef | null
  /** Lessons to take first for the next step (for a tool: its own lesson) that are not finished. */
  prerequisites: readonly LessonRef[]
  /** Lessons of the objective that changed since it was built. */
  updates: readonly ChangedLesson[]
}

/** One active objective when none is in focus. */
export interface ObjectiveChoice {
  title: string
  next: StepRef | null
  /** When the objective was last used (ms). */
  usedAt: number
}

/** What the last answer holds that a next question can build on. */
/** A link the Hub keeps from a record, and so a question about it that the engine answers directly. */
export type RecordRelation = 'made_by' | 'makes' | 'certifies' | 'publishes'

export interface LastAnswerRef {
  /**
   * The record the answer matched: the record of a direct answer, a bare name, or the closest source. `relation` is the link of
   * its kind the knowledge file holds for it (a product to its maker, a vendor to its products, a certification to what it covers,
   * a source to the documents it published); `name` is what the question calls it (a certification by its number).
   */
  matched: { tag: string; title: string; relation?: RecordRelation; name?: string } | null
  /** The first lesson in the answer's Learn resources. */
  lesson: LessonRef | null
}

export interface SuggestionState {
  /** The clock, given so the result depends only on the state. */
  now: number
  /** Questions already asked in this conversation. */
  asked: readonly string[]
  /** Keys (`questionKey`) of questions asked earlier while the objective and progress were as they are now. */
  askedKeys: readonly string[]
  /** The last answer shown, when there is one. */
  lastAnswer: LastAnswerRef | null
  /** The lesson the learner finished most recently, and when the learner recorded it. */
  finished: (LessonRef & { at: number }) | null
  viewing: ViewingRef | null
  /** The focused objective, when it is active. */
  objective: ObjectiveRef | null
  /** With no objective in focus: every active objective of the role. Used only when there are two or more. */
  choices: readonly ObjectiveChoice[]
  /** The learner's role, with the name the Hub shows for it. */
  role: { id: string; label: string } | null
}

/** A lesson counts as just finished for this long. */
export const JUST_FINISHED_MS = 30 * 60 * 1000

/** The most questions offered: one main, three alternatives and four behind "More questions". */
export const MAX_SUGGESTIONS = 8

/** The longest title a question is built on; a longer one reads as a file name and is left out. */
export const MAX_TITLE = 70

/**
 * Sections whose title makes the engine read the question as a request for an opinion, so it answers with a note instead of
 * resources. The page then gets the question about its lesson. A test asks the engine about every section and keeps this list
 * equal to the sections that fail.
 */
export const NOT_ASKABLE: ReadonlySet<string> = new Set(['LM-027/s:internals'])

const ask = {
  // a lesson title is quoted, so a title that begins with "The" or holds a colon still reads as a title
  about: (title: string) => `What is the lesson “${title}” about?`,
  learn: (title: string) => `What will I learn in ${title}?`,
  does: (title: string) => `What does ${title} do?`,
  practise: (title: string) => `Where can I practise ${title}?`,
  tools: (title: string) => `Which tools go with ${title}?`,
  teach: (title: string) => `Which lessons teach ${title}?`,
  related: {
    made_by: (name: string) => `Who makes ${name}?`,
    makes: (name: string) => `Which products does ${name} make?`,
    certifies: (name: string) => `What does ${name} certify?`,
    publishes: (name: string) => `Which documents did ${name} publish?`,
  } satisfies Record<RecordRelation, (name: string) => string>,
  relatedWhy: {
    made_by: 'who makes it; the Hub links each product to its maker',
    makes: 'which products it makes; the Hub links each product to its maker',
    certifies: 'what it certifies; the Hub links each certification to the product it covers',
    publishes: 'which documents it published; the Hub links each document to its publisher',
  } satisfies Record<RecordRelation, string>,
  read: (title: string) => `Where can I read about ${title}?`,
  changed: (title: string) => `What changed in ${title}?`,
  whatIs: (title: string) => `What is ${title}?`,
  role: (label: string) => `Which lessons are for the ${label} role?`,
}

const byOrder = <T extends { order: number; tag: string }>(a: T, b: T): number =>
  a.order - b.order || (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0)

/** A title a question can be built on: not too long, and not itself a question. */
const askable = (title: string): boolean => title.length <= MAX_TITLE && !title.includes('?')

const nextQuestion = (step: StepRef): string =>
  step.kind === 'tool' ? ask.does(step.title) : ask.learn(step.title)

function viewingQuestion(v: ViewingRef): { question: string; basedOn: string; why: string } {
  if (v.kind === 'section' && v.lessonTitle && !NOT_ASKABLE.has(v.tag)) {
    return {
      question: ask.read(v.title),
      basedOn: `the section you are reading, ${v.title}`,
      why: `You are reading ${v.title} in ${v.lessonTitle}. This asks where the Hub explains it, so you can compare it with other sources.`,
    }
  }
  if (v.kind === 'section') {
    const lesson = v.lessonTitle ?? v.title
    return {
      question: ask.about(lesson),
      basedOn: `the lesson you are reading, ${lesson}`,
      why: `You are reading ${lesson}. This asks what the lesson covers, in the Hub's own words.`,
    }
  }
  if (v.kind === 'lesson') {
    return {
      question: ask.about(v.title),
      basedOn: `the lesson you are reading, ${v.title}`,
      why: `You are reading ${v.title}. This asks what the lesson covers, in the Hub's own words.`,
    }
  }
  return {
    question: ask.whatIs(v.title),
    basedOn: `the page you are on, ${v.title}`,
    why: `You are looking at ${v.title}. This asks what it is, from the Hub's own records.`,
  }
}

/** Rule 2 for one objective: a question about its next step. */
function nextStepSuggestion(
  step: StepRef,
  basedOn: string,
  label: string,
  why: string
): RankedSuggestion {
  return { rule: 2, question: nextQuestion(step), label, basedOn, why }
}

/** The questions of each rule, in the order the rules come, before asked questions are removed. */
function candidates(state: SuggestionState): RankedSuggestion[] {
  const out: RankedSuggestion[] = []
  const { finished, viewing, objective, role, lastAnswer } = state

  // 1. what the learner just read (the last answer), finished, or is viewing
  const rel = lastAnswer?.matched
  if (rel?.relation && askable(rel.name ?? rel.title)) {
    const name = rel.name ?? rel.title
    out.push({
      rule: 1,
      question: ask.related[rel.relation](name),
      label: 'From this answer',
      basedOn: `the answer you just read, ${rel.title}`,
      why: `Your last answer was about ${rel.title}. This asks ${ask.relatedWhy[rel.relation]}.`,
    })
  }
  if (lastAnswer?.matched && askable(lastAnswer.matched.title)) {
    const m = lastAnswer.matched
    out.push({
      rule: 1,
      question: ask.teach(m.title),
      label: 'From this answer',
      basedOn: `the answer you just read, ${m.title}`,
      why: `Your last answer was about ${m.title}. This asks which lessons teach it, so you can go on from the answer to something to study.`,
    })
  }
  if (lastAnswer?.lesson && askable(lastAnswer.lesson.title)) {
    const l = lastAnswer.lesson
    out.push({
      rule: 1,
      question: ask.tools(l.title),
      label: 'From this answer',
      basedOn: `a lesson in the answer you just read, ${l.title}`,
      why: `Your last answer pointed to the lesson ${l.title}. This asks which tools go with it, so you can try what it teaches.`,
    })
  }
  if (finished && finished.at <= state.now && state.now - finished.at <= JUST_FINISHED_MS) {
    out.push({
      rule: 1,
      question: ask.practise(finished.title),
      label: 'Recap',
      basedOn: `you finished ${finished.title}`,
      why: `You finished ${finished.title} a moment ago. This asks where to practise it, so what you read turns into something you do.`,
    })
  }
  if (viewing) {
    const v = viewingQuestion(viewing)
    out.push({ rule: 1, question: v.question, label: 'This page', basedOn: v.basedOn, why: v.why })
  }

  if (objective) {
    // 2. the next step of the focused objective
    if (objective.next) {
      out.push(
        nextStepSuggestion(
          objective.next,
          `next step in your objective, ${objective.title}`,
          'Next step',
          objective.next.kind === 'tool'
            ? `${objective.next.title} is the next step of your objective "${objective.title}". This asks what the tool does before you open it.`
            : `${objective.next.title} is the next step of your objective "${objective.title}". This asks what the lesson covers before you start it.`
        )
      )
    }
    // 3. a prerequisite or blocker for that step
    for (const pre of [...objective.prerequisites].sort(byOrder)) {
      const of = objective.next
      out.push({
        rule: 3,
        question: ask.about(pre.title),
        label: 'Prerequisite',
        basedOn: of
          ? of.kind === 'tool'
            ? `the lesson ${of.title} belongs to`
            : `a lesson to take first for ${of.title}`
          : 'a lesson to take first',
        why: `${pre.title} is listed as a lesson to take first${of ? ` for ${of.title}` : ''}, and it is not finished. This asks what it covers.`,
      })
    }
    // 4. an update that touches the objective
    for (const up of [...objective.updates].sort(byOrder)) {
      out.push({
        rule: 4,
        question: ask.changed(up.title),
        label: 'Update',
        basedOn: `an update to a lesson in your objective, ${up.title}`,
        why: `${up.title} changed since you made your objective "${objective.title}" (${up.kindLabel.toLowerCase()}). This asks what changed.`,
      })
    }
  } else if (state.choices.length >= 2) {
    // 2, with no objective in focus: resume the one used most recently, and name the others (most recent first, then by title)
    const sorted = [...state.choices].sort(
      (a, b) => b.usedAt - a.usedAt || (a.title < b.title ? -1 : a.title > b.title ? 1 : 0)
    )
    sorted.forEach((c, i) => {
      if (!c.next) return
      out.push(
        nextStepSuggestion(
          c.next,
          i === 0
            ? `your most recently used objective, ${c.title}`
            : `another objective of yours, ${c.title}`,
          i === 0 ? 'Resume' : 'Other objective',
          i === 0
            ? `You have more than one objective and none is in focus. "${c.title}" is the one you used most recently, and ${c.next.title} is its next step. This asks about it so you can pick it up again.`
            : `"${c.title}" is another of your objectives, and ${c.next.title} is its next step. This asks about it so you can pick that one up instead.`
        )
      )
    })
  }

  // 5. role exploration
  if (role) {
    out.push({
      rule: 5,
      question: ask.role(role.label),
      label: 'Your role',
      basedOn: `your role, ${role.label}`,
      why: `You chose the ${role.label} role. This asks which lessons the Hub lists for it, in order.`,
    })
  }

  // the starting questions of the copy deck, so the list is never empty
  for (const s of STARTING_SUGGESTIONS) {
    out.push({
      rule: 6,
      question: s.question,
      label: s.label,
      basedOn: 'a starting question',
      why: 'A good first question when nothing else is known about what you are doing.',
    })
  }
  return out
}

/** The ranked questions for a state: the main one first, then the alternatives, at most `MAX_SUGGESTIONS`. */
export function rankSuggestions(state: SuggestionState): RankedSuggestion[] {
  const asked = new Set(state.asked.map((q) => q.trim().toLowerCase()))
  const askedKeys = new Set(state.askedKeys)
  const seen = new Set<string>()
  const out: RankedSuggestion[] = []
  for (const c of candidates(state)) {
    const key = c.question.trim().toLowerCase()
    if (asked.has(key) || askedKeys.has(questionKey(c.question)) || seen.has(key)) continue
    seen.add(key)
    out.push({ ...c, why: `Based on: ${c.basedOn}. ${c.why}` })
    if (out.length === MAX_SUGGESTIONS) break
  }
  return out
}
