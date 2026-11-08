// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
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
