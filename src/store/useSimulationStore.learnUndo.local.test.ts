// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it } from 'vitest'
import { useSimulationStore } from './useSimulationStore'
import { useModuleStore } from './useModuleStore'
import { evidenceId, type SimEvidenceRecord } from '@/simulation/evidence'

const state = () => useSimulationStore.getState()
function record(
  phase: 'p0' | 'p1',
  resourceId: string,
  runId = `run-${state().seed}`,
  kind: 'learn' | 'reference' = 'learn'
): SimEvidenceRecord {
  return {
    id: evidenceId(runId, phase, kind, resourceId),
    runId,
    phase,
    resourceId,
    kind,
    origin: 'learner',
    status: 'comprehension-checked',
    fingerprint: 'sample',
    createdAt: 1,
  }
}
beforeEach(() => {
  state().reset()
})
describe('Undo learning activity within its Simulation run', () => {
  it('clears this module across phases without deleting other modules, record kinds or runs', () => {
    const foreign = record('p0', 'crypto-agility', 'run-other')
    const other = record('p0', 'other-module')
    const reference = record('p0', 'crypto-agility', undefined, 'reference')
    const preserved = [foreign, other, reference]
    useSimulationStore.setState({
      evidence: [record('p0', 'crypto-agility'), record('p1', 'crypto-agility'), ...preserved],
    })
    state().clearLearnEvidence('crypto-agility')
    expect(state().evidence).toEqual(preserved)
  })
  it('does not edit the learner’s shared curriculum or its unrelated progress', () => {
    const before = JSON.stringify(useModuleStore.getState().modules)
    state().recordEvidence(record('p0', 'crypto-agility'))
    state().clearLearnEvidence('crypto-agility')
    expect(JSON.stringify(useModuleStore.getState().modules)).toBe(before)
  })
  it('persists the removal and permits a later explicit activity record', async () => {
    state().recordEvidence(record('p0', 'crypto-agility'))
    state().clearLearnEvidence('crypto-agility')
    const persisted = localStorage.getItem('pqc-simulation')!
    expect(JSON.parse(persisted).state.evidence).toEqual([])
    useSimulationStore.setState({ evidence: [record('p0', 'crypto-agility')] })
    localStorage.setItem('pqc-simulation', persisted)
    await useSimulationStore.persist.rehydrate()
    expect(state().evidence).toEqual([])
    state().recordEvidence(record('p0', 'crypto-agility'))
    expect(state().evidence).toHaveLength(1)
  })
})
