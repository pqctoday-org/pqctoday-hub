// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MyPathView } from './MyPathView'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'

const renderMyPath = (
  personaId: 'developer' | 'architect' | 'researcher' | 'cert-engineer' = 'developer'
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
