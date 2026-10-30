// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MyPathView } from './MyPathView'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'

const renderMyPath = (
  personaId: 'developer' | 'architect' | 'researcher' | 'cert-engineer' | 'executive' = 'developer'
) =>
  render(
    <MemoryRouter initialEntries={['/learn']}>
      <MyPathView personaId={personaId} onOpenCatalog={() => {}} />
    </MemoryRouter>
  )

const markComplete = (ids: readonly string[]) => {
  const modules: Record<string, { status: string; completedSteps: string[] }> = {}
  for (const id of ids) modules[id] = { status: 'completed', completedSteps: [] }
  // Runtime shape only needs status + completedSteps; cast to satisfy the store type.
  useModuleStore.setState({ modules: modules as never })
}

describe('MyPathView — Essentials tier (A1)', () => {
  beforeEach(() => {
    useModuleStore.setState({ modules: {} })
    localStorage.clear()
  })

  it('offers Start to a new executive without suggesting previous progress', () => {
    renderMyPath('executive')
    expect(screen.getByRole('button', { name: /^Start: / })).toBeEnabled()
    expect(screen.getByText('Start your next module')).toBeInTheDocument()
    expect(screen.queryByText('Continue where you left off')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Resume: / })).not.toBeInTheDocument()
  })

  it('resumes a started module even before its first completed step', () => {
    useModuleStore.getState().updateModuleProgress(PERSONAS.executive.essentials[0], {
      status: 'in-progress',
      completedSteps: [],
    })
    renderMyPath('executive')
    expect(screen.getByRole('button', { name: /^Resume: / })).toBeEnabled()
    expect(screen.getByText('Continue where you left off')).toBeInTheDocument()
  })

  it('offers Start for the next unstarted module after an essential is completed', () => {
    markComplete([PERSONAS.executive.essentials[0]])
    renderMyPath('executive')
    expect(screen.getByRole('button', { name: /^Start: / })).toBeEnabled()
    expect(screen.queryByRole('button', { name: /^Resume: / })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Full track/i }))
    expect(screen.getByRole('button', { name: /^Start: / })).toBeEnabled()
  })

  it('defaults to the Essentials view with the capstone locked', () => {
    renderMyPath('developer')
    const count = PERSONAS.developer.essentials.length
    expect(
      screen.getByText(new RegExp(`Essentials — the core ${count} modules`))
    ).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Finish the ${count} Essentials`))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Locked/i })).toBeDisabled()
    // A locked capstone is not called a quiz the learner can take.
    expect(screen.queryByText(/Capstone Quiz/)).toBeNull()
    expect(screen.getByText(`Capstone (locked) — ${PERSONAS.developer.label}`)).toBeInTheDocument()
  })

  it('unlocks the capstone once every Essential is complete', () => {
    markComplete(PERSONAS.developer.essentials)
    renderMyPath('developer')
    expect(screen.getByRole('button', { name: /Take the capstone/i })).toBeEnabled()
    expect(screen.getByText(/unlocked it/i)).toBeInTheDocument()
    expect(screen.getByText(`Capstone Quiz — ${PERSONAS.developer.label}`)).toBeInTheDocument()
  })

  it('a researcher sees one capstone: the hands-on check is not also called the capstone', () => {
    renderMyPath('researcher')
    expect(screen.getByText('Check our work: reproduce a known-answer test')).toBeInTheDocument()
    expect(screen.queryByText(/Your capstone/i)).toBeNull()
    expect(screen.getByText(`Capstone (locked) — ${PERSONAS.researcher.label}`)).toBeInTheDocument()
  })

  it('a path that starts at the certificate points a reader new to PQC at PQC 101 and the Algorithms page', () => {
    renderMyPath('cert-engineer')
    const note = screen.getByTestId('new-to-pqc-note')
    expect(note).toHaveTextContent(/If ML-KEM and ML-DSA are new to you/)
    expect(within(note).getByRole('link', { name: 'PQC 101' })).toHaveAttribute(
      'href',
      '/learn/pqc-101'
    )
    expect(within(note).getByRole('link', { name: 'Algorithms page' })).toHaveAttribute(
      'href',
      '/algorithms'
    )
  })

  it('keeps the Essentials / Full track labels apart from their times', () => {
    renderMyPath('cert-engineer')
    for (const name of [/^Essentials/, /^Full track/]) {
      const tab = screen.getByRole('tab', { name })
      // The button is a flex row, so the space in the text collapses: the gap has to come from the class.
      expect(tab.className).toMatch(/(^|\s)gap-1(\s|$)/)
      expect(tab).toHaveTextContent(/^(Essentials|Full track) \d+h/)
    }
  })

  it('a certification engineer is offered the validation tests first, until a lesson is started', () => {
    renderMyPath('cert-engineer')
    const card = screen.getByTestId('first-step-card')
    expect(card).toHaveTextContent(/Run the validation tests/)
    expect(within(card).getByRole('button', { name: /Start/ })).toBeInTheDocument()
    // A fresh learning path remains available after the validation-first action.
    expect(screen.getByText('Start your next module')).toBeInTheDocument()
    // Both actions read "Start", so each carries its own target in its accessible name.
    const starts = screen.getAllByRole('button', { name: /^Start: / })
    expect(starts).toHaveLength(2)
    expect(new Set(starts.map((b) => b.getAttribute('aria-label'))).size).toBe(2)
  })

  it('the first step goes away once a lesson on the path is under way', () => {
    useModuleStore.setState({
      modules: {
        'crypto-product-certification': { status: 'in-progress', completedSteps: [] },
      } as never,
    })
    renderMyPath('cert-engineer')
    expect(screen.queryByTestId('first-step-card')).toBeNull()
  })

  it('a role without a first-step page shows no such card', () => {
    renderMyPath('developer')
    expect(screen.queryByTestId('first-step-card')).toBeNull()
  })

  it('a path that already opens with PQC 101 shows no such note', () => {
    renderMyPath('developer')
    expect(screen.queryByTestId('new-to-pqc-note')).toBeNull()
  })

  it('switches to the Full track journey via the toggle', () => {
    renderMyPath('developer')
    expect(screen.getByText(/Essentials — the core/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Full track/i }))
    expect(screen.getByLabelText(/curated learning journey/i)).toBeInTheDocument()
  })
})
