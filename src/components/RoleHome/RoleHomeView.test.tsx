// SPDX-License-Identifier: GPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { RoleHomeView } from './RoleHomeView'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'

const ROLE_ORDER: PersonaId[] = [
  'executive',
  'developer',
  'architect',
  'ops',
  'researcher',
  'curious',
]

// First-win copy is literal editorial text from the approved design (not derived
// from learningPersonas.ts), so it's fine to pin verbatim here — unlike the
// module-count/minutes assertions below, which read PERSONAS live instead.
const FIRST_WIN_COPY: Record<PersonaId, string> = {
  executive: 'First win — answer the board · 11 min',
  developer: 'First win — run a real ML-KEM handshake · 5 min',
  architect: 'First win — flip a policy, watch it rekey · 15 min',
  ops: 'First win — size your HSM fleet · 10 min',
  researcher: 'No funnel — open the evidence workspace',
  curious: 'First win — see what breaks · 6 min',
}

function getCard(id: PersonaId) {
  const persona = PERSONAS[id]
  return screen.getByRole('button', { name: `${persona.label} — ${persona.subtitle}` })
}

describe('RoleHomeView', () => {
  it('renders the eyebrow, heading, and intro copy', () => {
    render(<RoleHomeView onSelectPersona={vi.fn()} onSkip={vi.fn()} />)
    expect(
      screen.getByText('Post-quantum cryptography, explained and provable')
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: "Who's asking?" })).toBeInTheDocument()
    expect(screen.getByText(/Pick the closest fit/)).toBeInTheDocument()
  })

  it.each(ROLE_ORDER)(
    'renders the %s card with its live label, subtitle, and first-win copy',
    (id) => {
      render(<RoleHomeView onSelectPersona={vi.fn()} onSkip={vi.fn()} />)
      const persona = PERSONAS[id]
      const card = getCard(id)
      expect(card).toBeInTheDocument()
      expect(card).toHaveTextContent(persona.label)
      expect(card).toHaveTextContent(persona.subtitle)
      expect(card).toHaveTextContent(FIRST_WIN_COPY[id])
    }
  )

  it.each(ROLE_ORDER)(
    "shows the %s card's track line computed live from learningPersonas.ts (not hardcoded)",
    (id) => {
      render(<RoleHomeView onSelectPersona={vi.fn()} onSkip={vi.fn()} />)
      const persona = PERSONAS[id]
      const card = getCard(id)
      // Researcher gets the full-corpus framing (no funnel); every other persona
      // gets the essentials-track summary. Numbers are pulled from the same
      // PERSONAS import the component itself reads, so this can't silently
      // drift from the real config.
      const expectedTrackLine =
        id === 'researcher'
          ? `full corpus · ${persona.estimatedMinutes} min available`
          : `then ${persona.essentials.length} modules · ${persona.essentialsMinutes} min`
      expect(card).toHaveTextContent(expectedTrackLine)
    }
  )

  it.each(ROLE_ORDER)('calls onSelectPersona with %s when its card is clicked', async (id) => {
    const user = userEvent.setup()
    const onSelectPersona = vi.fn()
    render(<RoleHomeView onSelectPersona={onSelectPersona} onSkip={vi.fn()} />)
    await user.click(getCard(id))
    expect(onSelectPersona).toHaveBeenCalledTimes(1)
    expect(onSelectPersona).toHaveBeenCalledWith(id)
  })

  it('activates a card via keyboard (Enter) as well as click', async () => {
    const user = userEvent.setup()
    const onSelectPersona = vi.fn()
    render(<RoleHomeView onSelectPersona={onSelectPersona} onSkip={vi.fn()} />)
    getCard('developer').focus()
    await user.keyboard('{Enter}')
    expect(onSelectPersona).toHaveBeenCalledWith('developer')
  })

  it('calls onSkip when "Show me everything" is clicked, without touching onSelectPersona', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    const onSelectPersona = vi.fn()
    render(<RoleHomeView onSelectPersona={onSelectPersona} onSkip={onSkip} />)
    await user.click(screen.getByRole('button', { name: 'Show me everything' }))
    expect(onSkip).toHaveBeenCalledTimes(1)
    expect(onSelectPersona).not.toHaveBeenCalled()
  })
})
