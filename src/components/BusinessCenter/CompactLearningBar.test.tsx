// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { CompactLearningBar } from './CompactLearningBar'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_IDS } from '@/data/personaIds'
import type { ModuleProgressInfo } from './hooks/useBusinessMetrics'
import '@testing-library/jest-dom'

const modules: ModuleProgressInfo[] = [
  {
    id: 'exec-quantum-impact',
    title: 'Quantum Impact',
    status: 'not-started',
    completedSteps: 0,
    totalSteps: 3,
  },
  {
    id: 'pqc-business-case',
    title: 'Business Case',
    status: 'not-started',
    completedSteps: 0,
    totalSteps: 3,
  },
]

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
})

function renderBar(defaultCollapsed = false) {
  return render(
    <MemoryRouter>
      <CompactLearningBar modules={modules} defaultCollapsed={defaultCollapsed} />
    </MemoryRouter>
  )
}

function LocationProbe() {
  const location = useLocation()
  return <div data-testid="location">{location.pathname}</div>
}

describe('CompactLearningBar for another path (GRC)', () => {
  it('shows the path title it is given, not the Executive path', () => {
    usePersonaStore.getState().setPersona('grc')
    render(
      <MemoryRouter>
        <CompactLearningBar modules={modules} pathTitle="GRC Learning Path" />
      </MemoryRouter>
    )
    expect(screen.getByText('GRC Learning Path')).toBeInTheDocument()
    expect(screen.queryByText(/Executive Learning Path/)).not.toBeInTheDocument()
  })

  it('sends a finished reader to the path it is given, not the Executive path', () => {
    const done = modules.map((m) => ({ ...m, status: 'completed' as const, completedSteps: 3 }))
    render(
      <MemoryRouter initialEntries={['/business']}>
        <CompactLearningBar
          modules={done}
          pathTitle="GRC Learning Path"
          fallbackTo="/learn/pqc-grc"
        />
        <Routes>
          <Route path="*" element={<LocationProbe />} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: /Review/ }))
    expect(screen.getByTestId('location')).toHaveTextContent('/learn/pqc-grc')
  })
})

describe('CompactLearningBar names whose path it shows', () => {
  it('with no role picked, shows the Executive path unqualified', () => {
    renderBar()
    expect(screen.getByText('Executive Learning Path')).toBeInTheDocument()
    expect(screen.queryByText(/optional context/)).not.toBeInTheDocument()
  })

  it('for the Executive role, shows the Executive path unqualified', () => {
    usePersonaStore.getState().setPersona('executive')
    renderBar()
    expect(screen.getByText('Executive Learning Path')).toBeInTheDocument()
    expect(screen.queryByText(/optional context/)).not.toBeInTheDocument()
  })

  it.each(PERSONA_IDS.filter((id) => id !== 'executive'))(
    'for the %s role, labels the Executive path as optional context, not as its own path',
    (persona) => {
      usePersonaStore.getState().setPersona(persona)
      renderBar()
      expect(
        screen.getByText('Executive Learning Path (optional context for your role)')
      ).toBeInTheDocument()
      expect(screen.queryByText('Executive Learning Path')).not.toBeInTheDocument()
    }
  )

  it('keeps the label in the collapsed header too', () => {
    usePersonaStore.getState().setPersona('developer')
    renderBar(true)
    expect(
      screen.getByText('Executive Learning Path (optional context for your role)')
    ).toBeInTheDocument()
  })
})
