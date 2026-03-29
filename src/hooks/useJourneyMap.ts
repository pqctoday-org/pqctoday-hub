// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { useMemo } from 'react'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useComplianceSelectionStore } from '@/store/useComplianceSelectionStore'
import { useMigrationWorkflowStore } from '@/store/useMigrationWorkflowStore'
import { PERSONAS } from '@/data/learningPersonas'
import { PERSONA_MILESTONES } from '@/data/personaConfig'
import { quizQuestions } from '@/data/quizDataLoader'
import {
  MODULE_CATALOG,
  MODULE_STEP_COUNTS,
  MODULE_TO_TRACK,
} from '@/components/PKILearning/moduleData'

// Pre-compute question ID → category mapping for checkpoint completion tracking
const questionCategoryMap = new Map<string, string>()
for (const q of quizQuestions) {
  questionCategoryMap.set(q.id, q.category)
}

// ── Types ────────────────────────────────────────────────────────────────────

export type JourneyItemStatus = 'locked' | 'available' | 'in-progress' | 'completed'

export interface JourneyItem {
  id: string
  label: string
  type: 'module' | 'checkpoint-quiz' | 'page-action'
  status: JourneyItemStatus
  /** Step progress for modules (done / total) */
  stepProgress?: { done: number; total: number }
  /** Navigation target */
  route: string
  /** Track name for off-path items */
  track?: string
}

export interface JourneyPhase {
  id: string
  label: string
  type: 'learning' | 'milestone'
  status: JourneyItemStatus
  items: JourneyItem[]
}

export interface JourneyMapResult {
  phases: JourneyPhase[]
  currentPhaseIndex: number
  overall: { done: number; total: number; percent: number }
  outsidePath: JourneyItem[]
  hasPersona: boolean
}

// ── Milestone status helpers ─────────────────────────────────────────────────

function getMilestoneStatus(
  route: string,
  assessmentStatus: string,
  myFrameworkCount: number,
  migrationStarted: boolean,
  artifactCount: number
): JourneyItemStatus {
  switch (route) {
    case '/assess':
      return assessmentStatus === 'complete'
        ? 'completed'
        : assessmentStatus === 'in-progress'
          ? 'in-progress'
          : 'available'
    case '/compliance':
      return myFrameworkCount > 0 ? 'completed' : 'available'
    case '/migrate':
      return migrationStarted ? 'completed' : 'available'
    case '/playground':
    case '/openssl':
      return artifactCount > 0 ? 'completed' : 'available'
    case '/algorithms':
      return 'available' // no completion signal for browsing
    default:
      return 'available'
  }
}

// ── Phase status derivation ──────────────────────────────────────────────────

function derivePhaseStatus(items: JourneyItem[]): JourneyItemStatus {
  if (items.length === 0) return 'locked'
  const allCompleted = items.every((i) => i.status === 'completed')
  if (allCompleted) return 'completed'
  const anyStarted = items.some((i) => i.status === 'in-progress' || i.status === 'completed')
  if (anyStarted) return 'in-progress'
  return 'available'
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useJourneyMap(): JourneyMapResult {
  const selectedPersona = usePersonaStore((s) => s.selectedPersona)
  const modules = useModuleStore((s) => s.modules)
  const artifacts = useModuleStore((s) => s.artifacts)
  const quizMastery = useModuleStore((s) => s.quizMastery)
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  const myFrameworkCount = useComplianceSelectionStore((s) => s.myFrameworks.length)
  const migrationStarted = useMigrationWorkflowStore((s) => s.startedAt !== null)

  return useMemo(() => {
    if (!selectedPersona) {
      return {
        phases: [],
        currentPhaseIndex: -1,
        overall: { done: 0, total: 0, percent: 0 },
        outsidePath: [],
        hasPersona: false,
      }
    }

    const persona = PERSONAS[selectedPersona]
    const pathItems = persona.pathItems
    const recommendedIds = new Set(persona.recommendedPath)
    const milestones = PERSONA_MILESTONES[selectedPersona] ?? []

    // Build milestone lookup: checkpointId → milestones to insert after it
    const milestonesByPhase = new Map<string, typeof milestones>()
    for (const m of milestones) {
      const existing = milestonesByPhase.get(m.afterPhase) ?? []
      existing.push(m)
      milestonesByPhase.set(m.afterPhase, existing)
    }

    const artifactCount =
      artifacts.keys.length +
      artifacts.certificates.length +
      artifacts.csrs.length +
      (artifacts.executiveDocuments?.length ?? 0)

    // Build set of quiz categories the user has answered correctly
    const correctIds = quizMastery?.correctQuestionIds ?? []
    const answeredCategories = new Set<string>()
    for (const qId of correctIds) {
      const cat = questionCategoryMap.get(qId)
      if (cat) answeredCategories.add(cat)
    }

    // ── Build learning phases from pathItems ────────────────────────────────
    const phases: JourneyPhase[] = []
    let currentItems: JourneyItem[] = []

    for (const item of pathItems) {
      if (item.type === 'module') {
        const moduleId = item.moduleId
        const mod = modules[moduleId]
        const catalog = MODULE_CATALOG[moduleId]
        const totalSteps = MODULE_STEP_COUNTS[moduleId] ?? 0
        const doneSteps = mod ? Math.min(mod.completedSteps.length, totalSteps) : 0

        let status: JourneyItemStatus
        if (mod?.status === 'completed') {
          status = 'completed'
        } else if (mod?.status === 'in-progress' || doneSteps > 0) {
          status = 'in-progress'
        } else {
          status = 'available'
        }

        // Special handling for quiz module
        const route = moduleId === 'quiz' ? '/learn/quiz' : `/learn/${moduleId}`

        currentItems.push({
          id: moduleId,
          label: catalog?.title ?? moduleId,
          type: 'module',
          status,
          stepProgress: totalSteps > 0 ? { done: doneSteps, total: totalSteps } : undefined,
          route,
        })
      } else if (item.type === 'checkpoint') {
        // Checkpoint creates a quiz item at the end of the current phase,
        // then closes the phase. Mark as completed if user has answered
        // questions in at least one of the checkpoint's categories.
        const hasAnsweredCheckpoint = item.categories.some((cat) => answeredCategories.has(cat))
        const checkpointItem: JourneyItem = {
          id: item.id,
          label: `Quiz: ${item.label}`,
          type: 'checkpoint-quiz',
          status: hasAnsweredCheckpoint ? 'completed' : 'available',
          route: `/learn/quiz?categories=${item.categories.join(',')}`,
        }
        currentItems.push(checkpointItem)

        // Close the learning phase
        const phaseStatus = derivePhaseStatus(currentItems)
        phases.push({
          id: item.id,
          label: item.label,
          type: 'learning',
          status: phaseStatus,
          items: currentItems,
        })

        // Insert any milestones after this checkpoint
        const milestonesAfter = milestonesByPhase.get(item.id)
        if (milestonesAfter) {
          for (const ms of milestonesAfter) {
            const msStatus = getMilestoneStatus(
              ms.route,
              assessmentStatus,
              myFrameworkCount,
              migrationStarted,
              artifactCount
            )
            const msId = `milestone-${ms.route}-${ms.label.toLowerCase().replace(/\s+/g, '-')}`
            phases.push({
              id: msId,
              label: ms.label,
              type: 'milestone',
              status: msStatus,
              items: [
                {
                  id: msId,
                  label: ms.label,
                  type: 'page-action',
                  status: msStatus,
                  route: ms.route,
                },
              ],
            })
          }
        }

        currentItems = []
      }
    }

    // Handle any trailing modules after the last checkpoint (e.g., final quiz)
    if (currentItems.length > 0) {
      const status = derivePhaseStatus(currentItems)
      phases.push({
        id: `phase-final`,
        label: 'Final Review',
        type: 'learning',
        status,
        items: currentItems,
      })
    }

    // ── Current phase index ────────────────────────────────────────────────
    let currentPhaseIdx = phases.findIndex(
      (p) => p.status === 'in-progress' || p.status === 'available'
    )
    if (currentPhaseIdx === -1) currentPhaseIdx = phases.length - 1

    // ── Overall progress ───────────────────────────────────────────────────
    let totalItems = 0
    let doneItems = 0
    for (const phase of phases) {
      for (const item of phase.items) {
        totalItems++
        if (item.status === 'completed') doneItems++
      }
    }
    const percent = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0

    // ── Outside-path modules ───────────────────────────────────────────────
    const outsidePath: JourneyItem[] = []
    for (const [moduleId, mod] of Object.entries(modules)) {
      if (mod.status === 'not-started') continue
      if (recommendedIds.has(moduleId)) continue
      if (moduleId === 'quiz' || moduleId === 'assess') continue

      const catalog = MODULE_CATALOG[moduleId]
      if (!catalog) continue

      const totalSteps = MODULE_STEP_COUNTS[moduleId] ?? 0
      const doneSteps = Math.min(mod.completedSteps.length, totalSteps)

      outsidePath.push({
        id: moduleId,
        label: catalog.title,
        type: 'module',
        status: mod.status === 'completed' ? 'completed' : 'in-progress',
        stepProgress: totalSteps > 0 ? { done: doneSteps, total: totalSteps } : undefined,
        route: `/learn/${moduleId}`,
        track: MODULE_TO_TRACK[moduleId],
      })
    }

    return {
      phases,
      currentPhaseIndex: currentPhaseIdx,
      overall: { done: doneItems, total: totalItems, percent },
      outsidePath,
      hasPersona: true,
    }
  }, [selectedPersona, modules, artifacts, quizMastery, assessmentStatus, myFrameworkCount, migrationStarted])
}
