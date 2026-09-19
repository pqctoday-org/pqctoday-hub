// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PersonaPageNote } from './PersonaPageNote'
import { PAGE_PERSONA_NOTES } from '@/data/pagePersonaNotes'
import { PERSONA_IDS } from '@/data/personaIds'
import { usePersonaStore } from '@/store/usePersonaStore'

const ROUTES = [
  '/',
  '/patents',
  '/leaders',
  '/explore',
  '/revisions',
  '/changelog',
  '/faq',
  '/about',
  '/editorial-independence',
  '/sponsor',
  '/terms',
]

describe('PAGE_PERSONA_NOTES — shape (Wave C, 2026-09-19)', () => {
  it('covers exactly the eleven routed reference pages (navigate is a full-screen canvas)', () => {
    expect(Object.keys(PAGE_PERSONA_NOTES).sort()).toEqual([...ROUTES].sort())
  })

  it('has one full sentence per persona per page (60–320 chars, ends with a period)', () => {
    for (const route of ROUTES) {
      for (const id of PERSONA_IDS) {
        const t = PAGE_PERSONA_NOTES[route][id].trim()
        expect(t.endsWith('.'), `${route} ${id}: no terminal period`).toBe(true)
        expect(t.length, `${route} ${id}: ${t.length} chars`).toBeGreaterThanOrEqual(60)
        expect(t.length, `${route} ${id}: ${t.length} chars`).toBeLessThanOrEqual(320)
      }
    }
  })
})

describe('PersonaPageNote', () => {
  beforeEach(() => {
    usePersonaStore.setState({ selectedPersona: null })
  })

  it('renders the active persona’s line only', () => {
    usePersonaStore.setState({ selectedPersona: 'ops' })
    render(<PersonaPageNote route="/patents" />)
    expect(screen.getByText(/What this means for you:/)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(PAGE_PERSONA_NOTES['/patents'].ops.slice(0, 30)))
    ).toBeInTheDocument()
    expect(screen.queryByText(/Licensing exposure is part of vendor risk/)).not.toBeInTheDocument()
  })

  it('lists all seven personas when none is selected', () => {
    render(<PersonaPageNote route="/terms" />)
    expect(screen.getAllByRole('term')).toHaveLength(PERSONA_IDS.length)
  })

  it('renders nothing for a route without notes', () => {
    const { container } = render(<PersonaPageNote route="/nowhere" />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('MobilePersonaPageNote (phone shell twin)', () => {
  it('renders only the active persona’s line and nothing without a persona', async () => {
    const { MobilePersonaPageNote } = await import('@/components/Mobile/MobilePersonaPageNote')
    usePersonaStore.setState({ selectedPersona: null })
    const { container, unmount } = render(<MobilePersonaPageNote route="/about" />)
    expect(container).toBeEmptyDOMElement()
    unmount()
    usePersonaStore.setState({ selectedPersona: 'developer' })
    render(<MobilePersonaPageNote route="/about" />)
    expect(
      screen.getByText(new RegExp(PAGE_PERSONA_NOTES['/about'].developer.slice(0, 30)))
    ).toBeInTheDocument()
    expect(screen.queryAllByRole('term')).toHaveLength(0)
  })
})
