// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Canonical tags as My work and Updates read them: a lesson (`LM-008`), one of its sections
 * (`LM-008/s:handshake`) or one of its steps (`LM-008/w:simulate`). Everything the learner
 * saves is keyed by the tag, never by the route, so it survives a page moving.
 *
 * Lesson facts (title, address, current content version) come from the lessons data file;
 * nothing about a lesson is typed here.
 */
import { LEARN_MODULES, type LearnModuleRecord } from '@/data/generated/learnModules.generated'

export type AnchorKind = 'module' | 'section' | 'step'

export interface ParsedTag {
  tag: string
  /** The lesson's tag, `LM-008`. */
  moduleTag: string
  anchorKind: AnchorKind
  /** The part after the colon, when there is one. */
  partId?: string
}

const MODULE_TAG = /^LM-\d{3,4}$/

/** Parse a lesson, section or step tag. Returns undefined for any other kind of tag. */
export function parseTag(tag: string): ParsedTag | undefined {
  const slash = tag.indexOf('/')
  const moduleTag = slash === -1 ? tag : tag.slice(0, slash)
  if (!MODULE_TAG.test(moduleTag)) return undefined
  if (slash === -1) return { tag, moduleTag, anchorKind: 'module' }
  const rest = tag.slice(slash + 1)
  const colon = rest.indexOf(':')
  if (colon !== 1 || rest.length < 3) return undefined
  const kind = rest[0]
  if (kind !== 's' && kind !== 'w') return undefined
  return { tag, moduleTag, anchorKind: kind === 's' ? 'section' : 'step', partId: rest.slice(2) }
}

const BY_LM: ReadonlyMap<string, LearnModuleRecord> = new Map(
  LEARN_MODULES.flatMap((m) => (m.lmId ? [[m.lmId, m] as const] : []))
)

/** The lesson record behind a lesson tag, or behind the lesson part of a section or step tag. */
export function lessonOf(tag: string): LearnModuleRecord | undefined {
  const parsed = parseTag(tag)
  return parsed ? BY_LM.get(parsed.moduleTag) : undefined
}

/** The version a lesson page is on now. A lesson that states none is version 1, as the Hub treats it. */
export const DEFAULT_CONTENT_VERSION = 1

/** The content version a comment written now is stamped with: the lesson's current version. */
export function currentContentVersion(tag: string): number {
  return lessonOf(tag)?.contentVersion ?? DEFAULT_CONTENT_VERSION
}

/** The page address that opens the lesson, section or step of a tag. */
export function addressOf(tag: string): string {
  const parsed = parseTag(tag)
  const lesson = lessonOf(tag)
  if (!parsed || !lesson) return `/go/${encodeURIComponent(tag)}`
  const base = `/learn/${lesson.id}`
  if (parsed.anchorKind === 'section')
    return `${base}?section=${encodeURIComponent(parsed.partId ?? '')}`
  if (parsed.anchorKind === 'step')
    return `${base}?tab=workshop&step=${encodeURIComponent(parsed.partId ?? '')}`
  return base
}

/** The learner-facing place a tag sits in, e.g. "TLS Basics" or "TLS Basics › handshake". */
export function placeOf(tag: string, partLabel?: string): string {
  const lesson = lessonOf(tag)
  const parsed = parseTag(tag)
  if (!lesson || !parsed) return tag
  if (parsed.anchorKind === 'module') return lesson.title
  return `${lesson.title} › ${partLabel ?? parsed.partId ?? ''}`.trim()
}

/** All lesson tags in the catalogue (lessons that have a tracking id). */
export function allLessonTags(): string[] {
  return [...BY_LM.keys()]
}

export function lessonByTag(moduleTag: string): LearnModuleRecord | undefined {
  return BY_LM.get(moduleTag)
}
