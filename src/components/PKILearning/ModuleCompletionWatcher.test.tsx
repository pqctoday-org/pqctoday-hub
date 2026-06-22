// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { ModuleCompletionWatcher } from './ModuleCompletionWatcher'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'

const MOD = 'hsm-pqc'

const seedStatus = (status: 'not-started' | 'in-progress' | 'completed') =>
  useModuleStore.setState((s) => ({
    modules: {
      ...s.modules,
      [MOD]: { status, lastVisited: 1, timeSpent: 0, completedSteps: [], quizScores: {} },
    },
  }))

const renderWatcher = () =>
  render(
    <MemoryRouter initialEntries={[`/learn/${MOD}`]}>
      <ModuleCompletionWatcher moduleId={MOD} />
    </MemoryRouter>
  )

describe('ModuleCompletionWatcher', () => {
  beforeEach(() => {
    useModuleStore.setState({ modules: {} })
    usePersonaStore.setState({ selectedPersona: null })
  })

  it('does not fire while the module is not yet completed', () => {
    seedStatus('in-progress')
    renderWatcher()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('fires the completion card when the module transitions to completed', async () => {
    seedStatus('in-progress')
    renderWatcher()
    act(() => seedStatus('completed'))
    // setOpen is deferred (setTimeout 0), so await the card to appear.
    expect(await screen.findByRole('dialog', { name: /module complete/i })).toBeInTheDocument()
  })

  it('does NOT auto-fire when mounted on an already-completed module', () => {
    seedStatus('completed')
    renderWatcher()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
