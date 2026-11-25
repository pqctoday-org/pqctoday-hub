// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The resume line of the module page: "Opened where you left off: “{section}”." It points at the
 * first required section the learner has not checked, once at least one is checked. It is read from
 * the Hub's own reading progress; the journey keeps no second record of where a learner was.
 */
import { LEARN_SECTIONS } from '@/components/PKILearning/moduleData'
import { requiredLearnSectionIdsFor } from '@/components/PKILearning/manifest/learnPathScope'

export interface ResumePoint {
  sectionId: string
  label: string
  /** Sections checked so far, and how many count. */
  read: number
  total: number
}

export function resumePoint(
  moduleId: string,
  progress: { learnSectionChecks?: Record<string, boolean>; activeLearnPath?: string } | undefined
): ResumePoint | null {
  const checks = progress?.learnSectionChecks
  if (!checks) return null
  const required = new Set(requiredLearnSectionIdsFor(moduleId, progress?.activeLearnPath))
  const sections = (LEARN_SECTIONS[moduleId] ?? []).filter((s) => required.has(s.id)) // eslint-disable-line security/detect-object-injection
  const read = sections.filter((s) => checks[s.id]).length
  if (read === 0 || read === sections.length) return null
  const next = sections.find((s) => !checks[s.id])
  return next ? { sectionId: next.id, label: next.label, read, total: sections.length } : null
}

/** The sentence under "Why this?". */
export function whyThisLine(p: ResumePoint): string {
  return `You have read ${p.read} of ${p.total} sections of this module. “${p.label}” is the next one you have not read.`
}
