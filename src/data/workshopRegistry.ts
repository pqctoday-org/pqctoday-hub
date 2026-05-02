// SPDX-License-Identifier: GPL-3.0-only
import type {
  ResolvedFlowContext,
  WorkshopFlow,
  WorkshopRegion,
  WorkshopStep,
} from '@/types/Workshop'
import { executiveFinanceFlow } from './workshopFlows/executiveFinance'

export const WORKSHOP_FLOWS: WorkshopFlow[] = [executiveFinanceFlow]

/**
 * Resolve the best workshop flow for the active persona context.
 * Specificity wins: a flow that matches every dimension explicitly beats one
 * that uses '*'. Returns null if no flow matches → UI shows "planned" state.
 */
export function resolveWorkshopFlow(ctx: ResolvedFlowContext): WorkshopFlow | null {
  const candidates = WORKSHOP_FLOWS.filter((flow) => {
    const m = flow.match
    const roleOk = m.roles === '*' || m.roles.includes(ctx.role)
    const profOk = m.proficiencies === '*' || m.proficiencies.includes(ctx.proficiency)
    const indOk = m.industries === '*' || m.industries.includes(ctx.industry)
    const regOk = m.regions === '*' || m.regions.includes(ctx.region)
    return roleOk && profOk && indOk && regOk
  })
  if (candidates.length === 0) return null
  // Most specific (fewest wildcards) wins.
  return candidates.reduce((best, cur) =>
    specificityScore(cur) > specificityScore(best) ? cur : best
  )
}

function specificityScore(flow: WorkshopFlow): number {
  const m = flow.match
  return (
    (m.roles === '*' ? 0 : 1) +
    (m.proficiencies === '*' ? 0 : 1) +
    (m.industries === '*' ? 0 : 1) +
    (m.regions === '*' ? 0 : 1)
  )
}

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
  industry?: string
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
  return steps.filter((s) => stepMatchesContext(s, region, industry))
}

function stepMatchesContext(
  step: WorkshopStep,
  region: WorkshopRegion,
  industry?: string
): boolean {
  const w = step.when
  if (!w) return true
  if (w.industries && industry !== undefined && !w.industries.includes(industry)) return false
  if (w.regions && !w.regions.includes(region)) return false
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
