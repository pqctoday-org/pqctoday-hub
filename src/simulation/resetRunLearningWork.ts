// SPDX-License-Identifier: AGPL-3.0-only
import { useModuleStore } from '@/store/useModuleStore'

/** Reset cannot infer ownership from a document's type or a shared Learn module. */
export function resetRunLearningWork(seed: number): void {
  const store = useModuleStore.getState()
  for (const doc of store.artifacts.executiveDocuments ?? []) {
    if (doc.moduleId === 'sim-autorun' && doc.simulationRunId === `run-${seed}`) {
      store.deleteExecutiveDocument(doc.id)
    }
  }
}
