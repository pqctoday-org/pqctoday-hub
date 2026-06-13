// SPDX-License-Identifier: GPL-3.0-only
// Flow discovery + persona matching live in `services/workshopFlowLoader`
// (runtime JSON manifest under public/workshop/). This module keeps the pure
// step-list helpers shared by the panel, the video player, and the hooks.
import type { PersonaId } from '@/data/learningPersonas'
import type { ExperienceLevel } from '@/store/usePersonaStore'
import type { WorkshopFlow, WorkshopRegion, WorkshopStep } from '@/types/Workshop'

/**
 * Flatten a flow into an ordered step list for the active region. Order:
 *   intro → prereq → common chapters (in array order) → region chapter → action/close
 * The region chapter (if defined) is inserted just before the 'action' chapter.
 *
 * Optionally filters steps via their `when:` clause against the active persona
 * context (industry + region). Steps without `when:` always pass.
 */
export function flattenFlow(
  flow: WorkshopFlow,
  region: WorkshopRegion,
  industry?: string,
  role?: PersonaId,
  proficiency?: ExperienceLevel
): WorkshopStep[] {
  const steps: WorkshopStep[] = []
  steps.push(...flow.intro.steps)
  steps.push(...flow.prerequisites.steps)
  for (const chapter of flow.common) {
    if (chapter.id === 'action') {
      const regionChapter = flow.regions?.[region]
      if (regionChapter) steps.push(...regionChapter.steps)
    }
    steps.push(...chapter.steps)
  }
  steps.push(...flow.close.steps)
  return steps.filter((s) => stepMatchesContext(s, region, industry, role, proficiency))
}

/**
 * Evaluate a step's optional `when:` visibility filter against the active
 * persona context. Exported so the agenda view can preview exactly the steps
 * `flattenFlow` would include.
 */
export function stepMatchesContext(
  step: WorkshopStep,
  region: WorkshopRegion,
  industry?: string,
  role?: PersonaId,
  proficiency?: ExperienceLevel
): boolean {
  const w = step.when
  if (!w) return true
  if (w.industries && industry !== undefined && !w.industries.includes(industry)) return false
  if (w.regions && !w.regions.includes(region)) return false
  if (w.roles && role !== undefined && !w.roles.includes(role)) return false
  if (w.proficiencies && proficiency !== undefined && !w.proficiencies.includes(proficiency))
    return false
  return true
}

export function findStepIndex(steps: WorkshopStep[], stepId: string): number {
  return steps.findIndex((s) => s.id === stepId)
}

export function getNextStep(
  steps: WorkshopStep[],
  currentStepId: string | null
): WorkshopStep | null {
  if (!currentStepId) return steps[0] ?? null
  const idx = findStepIndex(steps, currentStepId)
  return idx >= 0 && idx < steps.length - 1 ? steps[idx + 1] : null
}

export function getPrevStep(
  steps: WorkshopStep[],
  currentStepId: string | null
): WorkshopStep | null {
  if (!currentStepId) return null
  const idx = findStepIndex(steps, currentStepId)
  return idx > 0 ? steps[idx - 1] : null
}
