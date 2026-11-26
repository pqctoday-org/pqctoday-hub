// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { LearnRedesignView } from './LearnRedesignView'
import { usePersonaStore } from '@/store/usePersonaStore'
import { PERSONA_IDS, pathModuleCount } from '@/data/learningPersonas'
import { MODULE_TRACKS } from '../moduleData'

const mockUseIsMobileShell = vi.hoisted(() => vi.fn(() => false))
vi.mock('@/hooks/useIsMobileShell', () => ({
  useIsMobileShell: mockUseIsMobileShell,
}))

afterEach(() => {
  mockUseIsMobileShell.mockReturnValue(false)
  usePersonaStore.getState().setPersona(null)
})

function renderLearn(path = '/learn') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <LearnRedesignView />
    </MemoryRouter>
  )
}

describe('LearnRedesignView — mobile UX layer wiring', () => {
  it('flag off: renders the desktop redesign — its Your journey / All modules / Recommended order / Guided routing row', () => {
    mockUseIsMobileShell.mockReturnValue(false)
    renderLearn()
    for (const name of ['Your journey', 'All modules', 'Recommended order', 'Guided routing']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
  })

  it('flag on: renders MobileLearnScreen instead — Your journey, All modules, Recommended order and Guided tabs', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLearn()
    expect(screen.getByRole('tab', { name: 'Your journey' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'All modules' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Recommended order' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Guided' })).toBeInTheDocument()
    // The desktop mode row (pressed buttons) is not on the phone.
    expect(screen.queryByRole('button', { name: 'All modules' })).not.toBeInTheDocument()
  })

  // The chat assistant sends readers to /learn?mode=browse&track=<name>. On a phone these links
  // used to land on My Path and ignore the track.
  it('flag on: the assistant’s /learn?mode=browse&track=Protocols link lists only the Protocols modules', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLearn('/learn?mode=browse&track=Protocols')
    expect(screen.getByRole('tab', { name: 'All modules' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    const protocols = MODULE_TRACKS.find((t) => t.track === 'Protocols')!.modules
    const links = within(screen.getByTestId('mobile-browse-list')).getAllByRole('link')
    expect(links.map((a) => a.getAttribute('href'))).toEqual(protocols.map((m) => `/learn/${m.id}`))
  })

  it('flag on: /learn?mode=guided opens the guided choices', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    renderLearn('/learn?mode=guided')
    expect(screen.getByTestId('mobile-guided-choices')).toBeInTheDocument()
  })

  it('flag on: real persona data flows through to the mobile My Path body', () => {
    mockUseIsMobileShell.mockReturnValue(true)
    usePersonaStore.getState().setPersona('executive')
    renderLearn('/learn?mode=mypath')
    expect(screen.getByText(/My path · Executive \/ Business Leader/)).toBeInTheDocument()
  })
})

describe('LearnRedesignView — the open quiz and the module count', () => {
  it('labels the always-open quiz a practice quiz, not the capstone', () => {
    usePersonaStore.getState().setPersona('researcher')
    renderLearn('/learn?mode=mypath')
    expect(screen.getByRole('button', { name: 'Practice quiz' })).toBeInTheDocument()
  })

  it.each(PERSONA_IDS)(
    '%s: Recommended order states the shared module count (quiz excluded)',
    (p) => {
      usePersonaStore.getState().setPersona(p)
      renderLearn('/learn?mode=mypath')
      expect(
        screen.getAllByText(new RegExp(`· ${pathModuleCount(p)} modules ·`)).length
      ).toBeGreaterThan(0)
    }
  )
})
