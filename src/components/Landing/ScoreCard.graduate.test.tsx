// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ScoreCard } from './ScoreCard'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONAS, PERSONA_IDS } from '@/data/learningPersonas'

vi.mock(
  'framer-motion',
  async () => (await import('../../test/mocks/framer-motion')).framerMotionMock
)

// Real score, marked started with the belt pinned at Orange so the "Ready to specialize?" offer shows.
vi.mock('@/hooks/useAwarenessScore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useAwarenessScore')>()
  return {
    ...actual,
    useAwarenessScore: () => {
      const real = actual.useAwarenessScore()
      return {
        ...real,
        hasStarted: true,
        belt: actual.BELT_RANKS.find((b) => b.name === 'Orange Belt')!,
      }
    },
  }
})

describe('ScoreCard — a graduating curious learner can pick every other role', () => {
  beforeEach(() => usePersonaStore.getState().setPersona('curious'))

  it.each(PERSONA_IDS.filter((p) => p !== 'curious'))('offers %s', (persona) => {
    render(
      <MemoryRouter>
        <ScoreCard />
      </MemoryRouter>
    )
    expect(screen.getByText('Ready to specialize?')).toBeInTheDocument()
    // eslint-disable-next-line security/detect-object-injection -- typed PersonaId from PERSONA_IDS
    const label = PERSONAS[persona].label
    fireEvent.click(screen.getByRole('button', { name: (name) => name.startsWith(label) }))
    expect(usePersonaStore.getState().selectedPersona).toBe(persona)
  })
})
