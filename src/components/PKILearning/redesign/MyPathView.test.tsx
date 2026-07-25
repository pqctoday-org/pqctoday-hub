// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { MyPathView } from './MyPathView'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'

const renderMyPath = (personaId: 'developer' | 'architect' = 'developer') =>
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
  })

  it('unlocks the capstone once every Essential is complete', () => {
    markComplete(PERSONAS.developer.essentials)
    renderMyPath('developer')
    expect(screen.getByRole('button', { name: /Take the capstone/i })).toBeEnabled()
    expect(screen.getByText(/unlocked it/i)).toBeInTheDocument()
  })

  it('switches to the Full track journey via the toggle', () => {
    renderMyPath('developer')
    expect(screen.getByText(/Essentials — the core/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Full track/i }))
    expect(screen.getByLabelText(/curated learning journey/i)).toBeInTheDocument()
  })
})
