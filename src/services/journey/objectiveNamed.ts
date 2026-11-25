// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The things a goal NAMES, read from the knowledge model: the words and phrases of the goal are looked up in the
 * reader's name table (longest phrase first, the reader's own name rule, whole phrases only: no fuzzy matching), and
 * each record found that names a subject (a glossary term, an algorithm family, a protocol, a library document or
 * standard, a compliance rule) brings the lessons its "taught in" links point to. A section or step link counts for
 * its lesson; the section is kept so the preview can say where.
 *
 * `resolveNamed` needs a loaded reader; `linkEvidence` turns the result into a per-lesson score and is pure.
 * Nothing here is fetched: the caller owns the reader (see `NewObjectiveFlow`).
 */
import { normName, type KnowledgeReader } from '@/services/knowledge/knowledgeReader'
import { BROAD, STOP, stem } from './goalWords'
import { lessonByTag } from './lessons'

/** Record kinds that name a subject a learner can ask about. Lessons, quizzes, products, people and the like do not. */
export const SUBJECT_KINDS: ReadonlySet<string> = new Set([
  'glossary term',
  'algorithm family',
  'protocol',
  'library document',
  'compliance rule',
])

/** How a name reaches a record. Former ids and navigation nodes are ids, not words a learner writes. */
const NAME_HOW: ReadonlySet<string> = new Set([
  'label',
  'key',
  'acronym',
  'alias',
  'variant',
  'registry',
])

/** The longest phrase of a goal tried as one name, in words ("hybrid key exchange" is three). */
const MAX_PHRASE_WORDS = 6

export interface TeachingLesson {
  /** The lesson tag (LM-xxx). */
  lmId: string
  /** The section or step tag (LM-xxx/s:..., LM-xxx/w:...) the link points at, when it points below the lesson. */
  section?: string
  sectionLabel?: string
  /** How the link is known: "declared" by the data, or by a "title" match. */
  basis: string
}

export interface NamedRecord {
  id: string
  kind: string
  label: string
  /** The words of the goal (in the reader's name form) that named it. */
  phrase: string
  /** The lessons that teach it, one entry per lesson, in tag order. */
  lessons: TeachingLesson[]
}

export interface LessonReason {
  record: string
  recordLabel: string
  kind: string
  section?: string
  sectionLabel?: string
  /** Score points this link adds to the lesson (see `linkEvidence`). */
  strength: number
}

const isFiller = (w: string) =>
  STOP.has(w) || STOP.has(stem(w)) || BROAD.has(w) || BROAD.has(stem(w))

/** Lower is better: a declared link outranks a title match when one lesson is linked twice. */
const BASIS_RANK = new Map([
  ['declared', 0],
  ['title', 1],
])
const basisRank = (b: string) => BASIS_RANK.get(b) ?? 2

function teachingLessons(
  reader: KnowledgeReader,
  id: string,
  hasLesson: (lmId: string) => boolean
): TeachingLesson[] {
  const best = new Map<string, TeachingLesson>()
  for (const l of reader.linksOf(id).out) {
    if (l[1] !== 'taught_in') continue
    const lmId = l[2].split('/')[0]
    if (!hasLesson(lmId)) continue
    const section = l[2] === lmId ? undefined : l[2]
    const cand: TeachingLesson = {
      lmId,
      basis: l[3],
      ...(section ? { section, sectionLabel: reader.get(section)?.label } : {}),
    }
    const have = best.get(lmId)
    if (
      !have ||
      basisRank(cand.basis) < basisRank(have.basis) ||
      (basisRank(cand.basis) === basisRank(have.basis) &&
        (cand.section ?? '') < (have.section ?? ''))
    ) {
      best.set(lmId, cand)
    }
  }
  return [...best.values()].sort((a, b) => (a.lmId < b.lmId ? -1 : a.lmId > b.lmId ? 1 : 0))
}

/**
 * The records a goal names. Phrases are tried longest first at every position; a phrase that names records with
 * teaching lessons claims its words, so a shorter phrase inside it ("tls" in "tls 1 3") is not read again. A phrase
 * made only of stop words and subject words ("post quantum cryptography", "pqc") names nothing.
 */
export function resolveNamed(
  reader: KnowledgeReader,
  goal: string,
  hasLesson: (lmId: string) => boolean = (t) => lessonByTag(t) !== undefined
): NamedRecord[] {
  const words = normName(goal).split(' ').filter(Boolean)
  const claimed = new Array<boolean>(words.length).fill(false)
  const out: NamedRecord[] = []
  for (let len = Math.min(MAX_PHRASE_WORDS, words.length); len >= 1; len--) {
    for (let start = 0; start + len <= words.length; start++) {
      if (claimed.slice(start, start + len).some(Boolean)) continue
      const parts = words.slice(start, start + len)
      if (parts.every(isFiller)) continue
      const phrase = parts.join(' ')
      const seen = new Set<string>()
      const found: NamedRecord[] = []
      // `hasOwn`: a goal word such as "constructor" must not read the table's prototype.
      const entries = Object.hasOwn(reader.core.aliases, phrase) ? reader.core.aliases[phrase] : []
      for (const [id, how] of entries) {
        if (!NAME_HOW.has(how) || seen.has(id)) continue
        const record = reader.get(id)
        if (!record || !SUBJECT_KINDS.has(record.kind) || record.active === false) continue
        const lessons = teachingLessons(reader, id, hasLesson)
        if (lessons.length === 0) continue
        seen.add(id)
        found.push({ id, kind: record.kind, label: record.label, phrase, lessons })
      }
      if (found.length === 0) continue
      for (let i = start; i < start + len; i++) claimed[i] = true
      out.push(...found)
    }
  }
  return out
}

/** The most one teaching link adds to a lesson, before the basis and specificity factors (twice a clear title hit). */
export const LINK_MAX = 6
/** What all links together may add to one lesson: two named things that both point at it. */
export const LINK_CAP = 9
const BASIS_WEIGHT = new Map([
  ['declared', 1],
  ['title', 0.8],
])

/**
 * What one record's link adds to a lesson it teaches. The score falls with the number of lessons the record is
 * taught in (the data's own measure of how specific it is): LINK_MAX x 2 / (n + 1), so a term taught in one lesson
 * adds the full 6, in two lessons 4, in three lessons 3 (a match by itself), and a document cited by 20 lessons
 * adds under 0.6. A title match is worth 0.8 of a declared link, any other basis 0.6.
 */
export function linkScore(record: NamedRecord, lesson: TeachingLesson): number {
  const n = Math.max(1, record.lessons.length)
  return (LINK_MAX * (BASIS_WEIGHT.get(lesson.basis) ?? 0.6) * 2) / (n + 1)
}

/**
 * Per lesson, the link score of a goal and why. Records named by the same words (a glossary term and the protocol
 * of the same name) count once, by the strongest; different named things that teach the same lesson add up to LINK_CAP.
 */
export function linkEvidence(
  named: readonly NamedRecord[]
): Map<string, { score: number; reasons: LessonReason[] }> {
  const byPhraseLesson = new Map<string, Map<string, { score: number; reasons: LessonReason[] }>>()
  for (const r of named) {
    const perLesson = byPhraseLesson.get(r.phrase) ?? new Map()
    for (const t of r.lessons) {
      const strength = linkScore(r, t)
      const cur = perLesson.get(t.lmId) ?? { score: 0, reasons: [] }
      cur.score = Math.max(cur.score, strength)
      cur.reasons.push({
        record: r.id,
        recordLabel: r.label,
        kind: r.kind,
        ...(t.section ? { section: t.section, sectionLabel: t.sectionLabel } : {}),
        strength,
      })
      perLesson.set(t.lmId, cur)
    }
    byPhraseLesson.set(r.phrase, perLesson)
  }
  const out = new Map<string, { score: number; reasons: LessonReason[] }>()
  for (const perLesson of byPhraseLesson.values()) {
    for (const [lmId, e] of perLesson) {
      const cur = out.get(lmId) ?? { score: 0, reasons: [] }
      cur.score = Math.min(LINK_CAP, cur.score + e.score)
      cur.reasons.push(...e.reasons)
      out.set(lmId, cur)
    }
  }
  for (const e of out.values()) {
    // The strongest reasons first; the same record and section is listed once.
    const seen = new Set<string>()
    e.reasons = e.reasons
      .sort(
        (a, b) =>
          b.strength - a.strength || (a.record < b.record ? -1 : a.record > b.record ? 1 : 0)
      )
      .filter((x) => {
        const k = `${x.recordLabel}|${x.section ?? ''}`
        if (seen.has(k)) return false
        seen.add(k)
        return true
      })
  }
  return out
}
