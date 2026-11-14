// SPDX-License-Identifier: AGPL-3.0-only
/**
 * useLearnerEvidenceRecorder — files run-scoped evidence for the work a learner
 * does BY HAND while /simulation is open.
 *
 * Before this existed, only Learn steps recorded evidence in interactive play;
 * the narrated auto-run recorded everything else. So in a learner's own run:
 *  - a recurrence step ("report to the board again in a later quarter") could
 *    never complete, because `distinctRunQuarters` reads artifact evidence and
 *    none was ever filed;
 *  - the world check in `documentApplicability` never saw which scenario a
 *    learner's document was written for;
 *  - the run-end "how much of this did you do yourself" share ignored every
 *    activity, workshop, reference, catalog, lab and architecture step.
 *
 * It watches the two stores instead of every call site (there are dozens of
 * tools that save documents), and it deliberately stays out of the way of
 * work that is NOT the learner's own:
 *  - nothing is recorded while the auto-run is driving (it files its own
 *    evidence, with honest 'narrated-example' provenance);
 *  - documents filed by the auto-run are skipped by module id;
 *  - the generated phone brief is recorded, so its quarter counts, but as a
 *    worked example rather than as learner-authored work;
 *  - an update that also replaces the run's evidence or seed (import, restore,
 *    reset) is not a learner action and records nothing.
 */
import { useEffect, useRef } from 'react'
import { useModuleStore } from '@/store/useModuleStore'
import { useSimulationStore } from '@/store/useSimulationStore'
import type { ExecutiveDocument } from '@/services/storage/types'
import type { PhaseId } from '@/data/frameworkPhases'
import {
  evidenceId,
  runFingerprint,
  type EvidenceKind,
  type EvidenceOrigin,
  type EvidenceStatus,
} from '@/simulation/evidence'
import { logSimEvidenceRecorded } from '@/utils/analytics'

/** Documents the auto-run files on its own behalf — never learner work. */
const AUTORUN_MODULE_IDS = new Set(['sim-autorun'])
/** Documents the phone brief sheet generates for the learner to file. */
const GENERATED_BRIEF_MODULE_IDS = new Set(['sim-mobile-brief'])

/** Documents that are new, or whose content was saved again, in this update. */
export function changedDocuments(
  prev: readonly ExecutiveDocument[],
  next: readonly ExecutiveDocument[]
): ExecutiveDocument[] {
  if (prev === next) return []
  const byId = new Map(prev.map((d) => [d.id, d]))
  return next.filter((d) => {
    const before = byId.get(d.id)
    if (!before) return true
    // An approval-status or reviewer change is not operating the activity again.
    return before.data !== d.data || before.createdAt !== d.createdAt
  })
}

/** Items present in `next` but not in `prev`. */
export function addedItems(prev: readonly string[], next: readonly string[]): string[] {
  if (prev === next) return []
  const had = new Set(prev)
  return next.filter((x) => !had.has(x))
}

/** Edge keys that went from undecided to decided in this update. */
export function newlyDecidedEdges(
  prev: Readonly<Record<string, unknown>>,
  next: Readonly<Record<string, unknown>>
): string[] {
  if (prev === next) return []
  return Object.keys(next).filter((k) => next[k] != null && prev[k] == null)
}

interface RecordArgs {
  kind: EvidenceKind
  resourceId: string
  status: EvidenceStatus
  origin?: EvidenceOrigin
  artifactType?: ExecutiveDocument['type']
  artifactId?: string
}

/** File one record against the run's current phase, quarter and world. */
export function recordRunEvidence(args: RecordArgs): void {
  const sim = useSimulationStore.getState()
  const runId = `run-${sim.seed}`
  const runQuarter = `Q${sim.q} ${sim.year}`
  const origin = args.origin ?? 'learner'
  sim.recordEvidence({
    // Artifact records are per reporting period: a recurrence criterion needs
    // one record in each quarter the activity was operated.
    id: evidenceId(
      runId,
      sim.sel,
      args.kind,
      args.resourceId,
      args.kind === 'artifact' ? runQuarter : undefined
    ),
    runId,
    phase: sim.sel as PhaseId,
    resourceId: args.resourceId,
    kind: args.kind,
    origin,
    status: args.status,
    fingerprint: runFingerprint(sim.size, sim.country, sim.sector),
    createdAt: Date.now(),
    runQuarter,
    artifactType: args.artifactType,
    artifactId: args.artifactId,
  })
  logSimEvidenceRecorded(sim.sel, args.kind, origin)
}

export function useLearnerEvidenceRecorder(isAutoRunning: () => boolean): void {
  // Read through a ref so the subscriptions are set up once, yet always see
  // the auto-run's current state.
  const autoRef = useRef(isAutoRunning)
  useEffect(() => {
    autoRef.current = isAutoRunning
  })

  useEffect(() => {
    const unsubDocs = useModuleStore.subscribe((state, prevState) => {
      if (autoRef.current()) return
      const changed = changedDocuments(
        prevState.artifacts.executiveDocuments ?? [],
        state.artifacts.executiveDocuments ?? []
      )
      for (const d of changed) {
        if (AUTORUN_MODULE_IDS.has(d.moduleId)) continue
        const generated = GENERATED_BRIEF_MODULE_IDS.has(d.moduleId)
        recordRunEvidence({
          kind: 'artifact',
          resourceId: d.type,
          artifactType: d.type,
          artifactId: d.id,
          origin: generated ? 'narrated-example' : 'learner',
          status: generated ? 'viewed' : 'practiced',
        })
      }
    })

    const unsubSim = useSimulationStore.subscribe((state, prevState) => {
      if (autoRef.current()) return
      // Import / restore / reset replace the run wholesale — not a learner action.
      // (This also stops the records filed below from re-triggering this listener.)
      if (state.seed !== prevState.seed || state.evidence !== prevState.evidence) return
      for (const id of addedItems(prevState.visitedRefs, state.visitedRefs))
        recordRunEvidence({ kind: 'reference', resourceId: id, status: 'viewed' })
      for (const id of addedItems(prevState.visitedWorkshops, state.visitedWorkshops))
        recordRunEvidence({ kind: 'workshop', resourceId: id, status: 'practiced' })
      for (const id of addedItems(prevState.visitedScenarios, state.visitedScenarios))
        recordRunEvidence({ kind: 'scenario', resourceId: id, status: 'practiced' })
      for (const id of addedItems(prevState.catalogCompleted, state.catalogCompleted))
        recordRunEvidence({ kind: 'catalog', resourceId: id, status: 'practiced' })
      for (const key of newlyDecidedEdges(prevState.edgeDecisions, state.edgeDecisions))
        recordRunEvidence({ kind: 'architecture', resourceId: key, status: 'practiced' })
    })

    return () => {
      unsubDocs()
      unsubSim()
    }
  }, [])
}
