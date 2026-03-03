// SPDX-License-Identifier: GPL-3.0-only
import { useEffect, useRef } from 'react'
import { useMigrationWorkflowStore, type WorkflowPhase } from '@/store/useMigrationWorkflowStore'
import { useAssessmentStore } from '@/store/useAssessmentStore'
import { useMigrateSelectionStore } from '@/store/useMigrateSelectionStore'

/**
 * Auto-detects phase completion based on existing app state.
 * Call this hook in the view component for each workflow phase.
 *
 * - assess: completes when assessmentStatus === 'complete'
 * - comply: completes after 10 seconds of viewing
 * - migrate: completes when myProducts has selections
 * - timeline: completes after 10 seconds of viewing
 */
export function useWorkflowPhaseTracker(phase: WorkflowPhase): void {
  const { workflowActive, currentPhase, completedPhases, completePhase } =
    useMigrationWorkflowStore()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const isActivePhase = workflowActive && currentPhase === phase && !completedPhases.includes(phase)

  // Phase: assess — watch assessment status
  const assessmentStatus = useAssessmentStore((s) => s.assessmentStatus)
  useEffect(() => {
    if (phase !== 'assess' || !isActivePhase) return
    if (assessmentStatus === 'complete') {
      completePhase('assess')
    }
  }, [phase, isActivePhase, assessmentStatus, completePhase])

  // Phase: migrate — watch myProducts
  const myProducts = useMigrateSelectionStore((s) => s.myProducts)
  useEffect(() => {
    if (phase !== 'migrate' || !isActivePhase) return
    if (myProducts.length > 0) {
      completePhase('migrate')
    }
  }, [phase, isActivePhase, myProducts.length, completePhase])

  // Phase: comply / timeline — time-based engagement
  useEffect(() => {
    if ((phase !== 'comply' && phase !== 'timeline') || !isActivePhase) return

    timerRef.current = setTimeout(() => {
      completePhase(phase)
    }, 10_000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [phase, isActivePhase, completePhase])
}
