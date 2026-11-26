// SPDX-License-Identifier: AGPL-3.0-only
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
 *   1. what the learner just finished, or is viewing
 *   2. the next step of the focused objective
 *   3. a lesson to take first for that step, not yet finished (a prerequisite)
 *   4. an update to a lesson in the objective
 *   5. exploring the learner's role
 * The starting questions of the copy deck follow, so there is always something to ask. A question already asked is left out.
 * Ties inside a rule go by curriculum order, then tag.
 *
 * Every question is a template over a lesson, a section, a record or a role, so it names a thing the Hub holds and the answer
 * engine can answer it (a test asks every lesson and section of the catalog).
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
  /** The next step, when it is a lesson. */
  next: LessonRef | null
  /** Lessons listed to take first for the next step that are not finished. */
  prerequisites: readonly LessonRef[]
  /** Lessons of the objective that changed since it was built. */
  updates: readonly ChangedLesson[]
}

export interface SuggestionState {
  /** The clock, given so the result depends only on the state. */
  now: number
  /** Questions already asked in this conversation. */
  asked: readonly string[]
  /** The lesson the learner finished most recently, and when. */
  finished: (LessonRef & { at: number }) | null
  viewing: ViewingRef | null
  /** The focused objective, when it is active. */
  objective: ObjectiveRef | null
  /** The learner's role, with the name the Hub shows for it. */
  role: { id: string; label: string } | null
}

/** A lesson counts as just finished for this long. */
export const JUST_FINISHED_MS = 30 * 60 * 1000

/** The most questions offered: one main, three alternatives and four behind "More questions". */
export const MAX_SUGGESTIONS = 8

/**
 * Sections whose title makes the engine read the question as a request for an opinion, so it answers with a note instead of
 * resources. The page then gets the question about its lesson. A test asks the engine about every section and keeps this list
 * equal to the sections that fail.
 */
export const NOT_ASKABLE: ReadonlySet<string> = new Set(['LM-027/s:internals'])

const ask = {
  about: (title: string) => `What is ${title} about?`,
  learn: (title: string) => `What will I learn in ${title}?`,
  practise: (title: string) => `Where can I practise ${title}?`,
  read: (title: string) => `Where can I read about ${title}?`,
  changed: (title: string) => `What changed in ${title}?`,
  whatIs: (title: string) => `What is ${title}?`,
  role: (label: string) => `Which lessons are for the ${label} role?`,
}

const byOrder = <T extends { order: number; tag: string }>(a: T, b: T): number =>
  a.order - b.order || (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0)

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

/** The questions of each rule, in the order the rules come, before asked questions are removed. */
function candidates(state: SuggestionState): RankedSuggestion[] {
  const out: RankedSuggestion[] = []
  const { finished, viewing, objective, role } = state

  // 1. what the learner just finished, or is viewing
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
      out.push({
        rule: 2,
        question: ask.learn(objective.next.title),
        label: 'Next step',
        basedOn: `next step in your objective, ${objective.title}`,
        why: `${objective.next.title} is the next step of your objective "${objective.title}". This asks what the lesson covers before you start it.`,
      })
    }
    // 3. a prerequisite or blocker for that step
    for (const pre of [...objective.prerequisites].sort(byOrder)) {
      out.push({
        rule: 3,
        question: ask.about(pre.title),
        label: 'Prerequisite',
        basedOn: `a lesson to take first${objective.next ? ` for ${objective.next.title}` : ''}`,
        why: `${pre.title} is listed as a lesson to take first${objective.next ? ` for ${objective.next.title}` : ''}, and it is not finished. This asks what it covers.`,
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
  const seen = new Set<string>()
  const out: RankedSuggestion[] = []
  for (const c of candidates(state)) {
    const key = c.question.trim().toLowerCase()
    if (asked.has(key) || seen.has(key)) continue
    seen.add(key)
    out.push({ ...c, why: `Based on: ${c.basedOn}. ${c.why}` })
    if (out.length === MAX_SUGGESTIONS) break
  }
  return out
}
