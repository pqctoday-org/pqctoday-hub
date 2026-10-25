// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-object-injection */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { RoleHomeView } from './RoleHomeView'
import { PERSONAS, type PersonaId } from '@/data/learningPersonas'
import { MANIFEST_BY_ID } from '@/components/PKILearning/manifest/registry'

const ROLE_ORDER: PersonaId[] = [
  'executive',
  'grc',
  'developer',
  'architect',
  'ops',
  'researcher',
  'cert-engineer',
  'curious',
]

// First-win copy is literal editorial text from the approved design (not derived
// from learningPersonas.ts), so it's fine to pin verbatim here — unlike the
// module-count/minutes assertions below, which read PERSONAS live instead.
const FIRST_WIN_COPY: Record<PersonaId, string> = {
  executive: 'First win — answer the board · 11 min',
  grc: 'First win — trace one obligation to its source · 10 min',
  developer: 'First win — run a real hybrid ML-KEM + X25519 key exchange · 5 min',
  architect: 'First win — flip a policy, watch it rekey · 15 min',
  ops: 'First win — size your HSM fleet · 10 min',
  researcher: 'No funnel — open the evidence workspace',
  'cert-engineer': 'First win — learn what a certificate actually covers · 95 min',
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
      // The certification engineer's first win is the whole first lesson, which is already
      // inside the essentials total, so that card says "in all" and not "then".
      const expectedTrackLine =
        id === 'researcher'
          ? `full corpus · ${persona.estimatedMinutes} min available`
          : id === 'cert-engineer'
            ? `${persona.essentials.length} modules in all · ${persona.essentialsMinutes} min, this lesson first`
            : `then ${persona.essentials.length} modules · ${persona.essentialsMinutes} min`
      expect(card).toHaveTextContent(expectedTrackLine)
    }
  )

  it("the certification engineer's typed first-win minutes equal the first essential lesson's manifest duration", () => {
    const persona = PERSONAS['cert-engineer']
    const firstEssential = persona.essentials[0]
    const manifestMinutes = Number(/(\d+)\s*min/.exec(MANIFEST_BY_ID[firstEssential].duration)?.[1])
    const typedMinutes = Number(/(\d+) min$/.exec(FIRST_WIN_COPY['cert-engineer'])?.[1])
    expect(typedMinutes).toBe(manifestMinutes)
    render(<RoleHomeView onSelectPersona={vi.fn()} onSkip={vi.fn()} />)
    expect(getCard('cert-engineer')).toHaveTextContent(`· ${manifestMinutes} min`)
  })

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

  it('activates a card via keyboard (Space) too, not just Enter', async () => {
    const user = userEvent.setup()
    const onSelectPersona = vi.fn()
    render(<RoleHomeView onSelectPersona={onSelectPersona} onSkip={vi.fn()} />)
    getCard('architect').focus()
    await user.keyboard(' ')
    expect(onSelectPersona).toHaveBeenCalledTimes(1)
    expect(onSelectPersona).toHaveBeenCalledWith('architect')
  })

  it('ignores unrelated key presses (e.g. a letter key) — no selection, no navigation', async () => {
    const user = userEvent.setup()
    const onSelectPersona = vi.fn()
    render(<RoleHomeView onSelectPersona={onSelectPersona} onSkip={vi.fn()} />)
    getCard('ops').focus()
    await user.keyboard('a')
    expect(onSelectPersona).not.toHaveBeenCalled()
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
