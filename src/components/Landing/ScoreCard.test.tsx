// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ScoreCard } from './ScoreCard'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_IDS, pathModuleCount } from '@/data/learningPersonas'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

function renderCard() {
  return render(
    <MemoryRouter>
      <ScoreCard />
    </MemoryRouter>
  )
}

describe('ScoreCard', () => {
  beforeEach(() => usePersonaStore.getState().setPersona(null))

  it('for a researcher, the learning path is optional and collapsed by default', () => {
    usePersonaStore.getState().setPersona('researcher')
    renderCard()
    const toggle = screen.getByRole('button', {
      name: `Optional learning path (${pathModuleCount('researcher')} modules)`,
    })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Earn your first belt')).toBeNull()
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Earn your first belt')).toBeInTheDocument()
  })

  it.each(PERSONA_IDS.filter((p) => p !== 'researcher'))(
    'for %s, shows the card open with the shared module count (quiz excluded)',
    (persona) => {
      usePersonaStore.getState().setPersona(persona)
      renderCard()
      expect(screen.getByText('Earn your first belt')).toBeInTheDocument()
      expect(
        screen.getByText(new RegExp(`\\(${pathModuleCount(persona)} modules\\)`))
      ).toBeInTheDocument()
    }
  )
})
