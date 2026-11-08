// SPDX-License-Identifier: AGPL-3.0-only
import { beforeEach, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { REFERENCE_ESTATES } from './assessmentScenarios'
import { LAYERS } from './infrastructureLayers'
import { useAssessmentFormStore } from '@/store/useAssessmentFormStore'
import { Step3Crypto } from '@/components/Assess/steps/Step3Crypto'
import { Step11Infrastructure } from '@/components/Assess/steps/Step11Infrastructure'
import { computeMigrationComplexity } from '@/hooks/assessment/scoring'
import type { AssessmentInput } from '@/hooks/assessmentTypes'
vi.mock('./algorithmsData', () => ({ loadAlgorithmsData: () => Promise.resolve([]) }))
beforeEach(() => {
  useAssessmentFormStore.getState().reset()
})
it.each(REFERENCE_ESTATES)(
  '$id loads editable current category and layer controls, retaining edits across persistence',
  async (estate) => {
    act(() => useAssessmentFormStore.getState().loadReferenceEstate(estate.id))
    const view = render(
      <MemoryRouter>
        <Step3Crypto hideHints />
        <Step11Infrastructure hideHints />
      </MemoryRouter>
    )
    const categories = screen.getByRole('group', { name: 'Algorithm category selection' })
    for (const id of estate.answers.currentCryptoCategories)
      expect(within(categories).getByRole('button', { name: id })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    const layers = screen.getByRole('group', { name: 'Infrastructure layer selection' })
    for (const id of estate.answers.infrastructure) {
      const layer = LAYERS.find((candidate) => candidate.id === id)!
      expect(within(layers).getByRole('button', { name: layer.label })).toHaveAttribute(
        'aria-pressed',
        'true'
      )
    }
    fireEvent.click(within(categories).getByRole('button', { name: 'Symmetric Encryption' }))
    const editedLayer = estate.answers.infrastructure[0]
    fireEvent.click(
      within(layers).getByRole('button', {
        name: LAYERS.find((layer) => layer.id === editedLayer)!.label,
      })
    )
    expect(useAssessmentFormStore.getState().currentCryptoCategories).not.toContain(
      'Symmetric Encryption'
    )
    expect(useAssessmentFormStore.getState().infrastructure).not.toContain(editedLayer)
    const persisted = localStorage.getItem('pqc-assessment-form')!
    view.unmount()
    act(() => useAssessmentFormStore.getState().reset())
    localStorage.setItem('pqc-assessment-form', persisted)
    await act(async () => {
      await useAssessmentFormStore.persist.rehydrate()
    })
    expect(useAssessmentFormStore.getState().scenarioEstateId).toBeNull()
    expect(useAssessmentFormStore.getState().currentCryptoCategories).not.toContain(
      'Symmetric Encryption'
    )
    expect(useAssessmentFormStore.getState().infrastructure).not.toContain(editedLayer)
  }
)
it('records the reference bank score effect from established layer migration without changing scoring', () => {
  const bank = REFERENCE_ESTATES.find((estate) => estate.id === 'retail-bank')!
  const current = bank.answers as AssessmentInput
  const legacy = { ...current, infrastructure: ['Cloud', 'Application', 'Database'] }
  expect(current.infrastructure).toEqual([
    'Cloud',
    'AppServers',
    'Libraries',
    'SecSoftware',
    'Database',
  ])
  expect(computeMigrationComplexity(legacy)).toBe(67)
  expect(computeMigrationComplexity(current)).toBe(74)
})
