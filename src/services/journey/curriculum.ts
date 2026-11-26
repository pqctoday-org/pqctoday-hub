// SPDX-License-Identifier: AGPL-3.0-only
/**
 * What the curriculum holds now, in the form an objective records and later compares: the revision, and for each
 * lesson its content version, its sections and its tools. Everything is read from the Hub's own data (the dated
 * lessons and tools files, the lessons' section lists); nothing is typed again here.
 */
import { LEARN_MODULES_SOURCE } from '@/data/generated/learnModules.generated'
import { TOOL_RECORDS, TOOLS_SOURCE, type ToolRecord } from '@/data/generated/tools.generated'
import { LEARN_SECTIONS } from '@/components/PKILearning/moduleData'
import { lessonById, lessonByTag } from './lessons'
import type { BuiltOn, LessonSnapshot, Step } from './types'

/** The curriculum revision: the dated lessons file and the dated tools file the Hub was built from. */
export const CURRICULUM_REVISION = `${LEARN_MODULES_SOURCE} + ${TOOLS_SOURCE}`

/** The version a tool states, or null where the Hub gives none (business tools and sandbox scenarios). */
export const toolVersion = (record: ToolRecord): string | null =>
  record.kind === 'playground' ? record.version : null

/** The tools whose home lesson is this one. */
export function toolsOfLesson(moduleId: string): ToolRecord[] {
  return TOOL_RECORDS.filter((t) => t.module === moduleId)
}

/** The sections a lesson lists. */
export function sectionsOfLesson(moduleId: string): { id: string; label: string }[] {
  // eslint-disable-next-line security/detect-object-injection -- moduleId comes from the lessons data
  return LEARN_SECTIONS[moduleId] ?? []
}

/** The address of a tool's page. */
export function toolAddress(record: ToolRecord): string {
  if (record.kind === 'business') return `/business/tools/${record.toolId}`
  if (record.kind === 'playground') return `/playground/${record.toolId}`
  return '/playground'
}

/** The lessons a lesson lists to take first, as lesson tags. */
export function takeFirstTags(tag: string): string[] {
  const lesson = lessonByTag(tag)
  if (!lesson) return []
  return lesson.takeFirst.flatMap((id) => lessonById(id)?.lmId ?? [])
}

/** What a lesson holds now; null for a tag the Hub does not hold. */
export function snapshotLesson(tag: string): LessonSnapshot | null {
  const lesson = lessonByTag(tag)
  if (!lesson) return null
  return {
    version: lesson.contentVersion ?? 1,
    sections: sectionsOfLesson(lesson.id).map((s) => s.id),
    tools: Object.fromEntries(toolsOfLesson(lesson.id).map((t) => [t.toolId, toolVersion(t)])),
  }
}

/** The record of what an objective is built on, taken from the steps it has now. */
export function buildBuiltOn(
  steps: readonly Pick<Step, 'kind' | 'resourceTag'>[],
  origin: BuiltOn['origin'],
  now: number
): BuiltOn {
  const lessons: Record<string, LessonSnapshot> = {}
  const prerequisites: Record<string, string[]> = {}
  for (const s of steps) {
    if (s.kind !== 'module') continue
    const snap = snapshotLesson(s.resourceTag)
    if (!snap) continue
    // eslint-disable-next-line security/detect-object-injection -- keyed by lesson tags from the objective's own steps
    lessons[s.resourceTag] = snap
    // eslint-disable-next-line security/detect-object-injection
    prerequisites[s.resourceTag] = takeFirstTags(s.resourceTag)
  }
  return { origin, revision: CURRICULUM_REVISION, prerequisites, lessons, at: now }
}
