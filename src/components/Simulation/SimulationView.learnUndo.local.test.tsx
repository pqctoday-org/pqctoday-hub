// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SimulationView } from './SimulationView'
import { useSimulationStore } from '@/store/useSimulationStore'
import { useModuleStore } from '@/store/useModuleStore'
import { useAssessmentResultStore } from '@/store/useAssessmentResultStore'
import { loadSampleOrganisation } from './sampleOrganisation'
import { evidenceId, type SimEvidenceRecord } from '@/simulation/evidence'
vi.mock('@/hooks/useIsMobileShell', () => ({ useIsMobileShell: () => false }))
const moduleId = 'crypto-agility'
const current = () => useSimulationStore.getState()
function evidence(runId = `run-${current().seed}`): SimEvidenceRecord {
  return {
    id: evidenceId(runId, 'p0', 'learn', moduleId),
    runId,
    phase: 'p0',
    resourceId: moduleId,
    kind: 'learn',
    origin: 'learner',
    status: 'comprehension-checked',
    fingerprint: 'sample',
    createdAt: 1,
  }
}
beforeEach(async () => {
  current().reset()
  useAssessmentResultStore.getState().reset()
  loadSampleOrganisation()
  useModuleStore.setState({ modules: {} })
  useSimulationStore.setState({ tourSeen: true })
  current().setOpenStepRef({
    kind: 'learn',
    moduleId,
    label: 'Sample crypto agility lesson',
    to: '/learn/crypto-agility',
  })
  await useSimulationStore.persist.rehydrate()
})
const mount = () =>
  render(
    <MemoryRouter initialEntries={['/simulation']}>
      <SimulationView />
    </MemoryRouter>
  )
describe('Simulation learning completion control', () => {
  it('removes the active run’s completion and restores the completion action', async () => {
    current().recordEvidence(evidence())
    mount()
    const undo = await screen.findByRole('button', { name: 'Remove run completion' })
    const sharedBefore = JSON.stringify(useModuleStore.getState().modules)
    fireEvent.click(undo)
    await screen.findByRole('button', { name: 'Mark complete' })
    expect(current().evidence.some((r) => r.resourceId === moduleId)).toBe(false)
    expect(JSON.stringify(useModuleStore.getState().modules)).toBe(sharedBefore)
  })
  it('shows inherited Learn completion without offering a misleading undo', async () => {
    useModuleStore.getState().updateModuleProgress(moduleId, { status: 'completed' })
    mount()
    await screen.findByText('Completed in Learn', { exact: true })
    expect(screen.queryByRole('button', { name: 'Remove run completion' })).not.toBeInTheDocument()
    expect(useModuleStore.getState().modules[moduleId].status).toBe('completed')
  })
  it('preserves inherited completion when a separate run activity is undone', async () => {
    useModuleStore.getState().updateModuleProgress(moduleId, { status: 'completed' })
    current().recordEvidence(evidence())
    mount()
    fireEvent.click(await screen.findByRole('button', { name: 'Remove run completion' }))
    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Remove run completion' })
      ).not.toBeInTheDocument()
    )
    expect(screen.getByText('Completed in Learn', { exact: true })).toBeInTheDocument()
    expect(useModuleStore.getState().modules[moduleId].status).toBe('completed')
  })
  it('does not inherit a foreign run record and still requires the existing quiz gate', async () => {
    current().recordEvidence(evidence('run-other'))
    mount()
    fireEvent.click(await screen.findByRole('button', { name: 'Mark complete' }))
    expect(current().evidence.every((r) => r.runId === 'run-other')).toBe(true)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
  })
})
