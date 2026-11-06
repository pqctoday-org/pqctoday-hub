// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileLearnScreen } from './MobileLearnScreen'
import { usePersonaStore } from '@/store/usePersonaStore'
import { useModuleStore } from '@/store/useModuleStore'
import { PERSONAS } from '@/data/learningPersonas'

// MobileWorkshopEntry has its own dedicated, thoroughly-fixtured test suite
// (MobileWorkshopEntry.test.tsx) covering its internal idle/paused/running
// gating — mocked here to a simple marker so this file only asserts on what
// R4.5 actually changed: WHERE it renders, not its own internal logic.
vi.mock('../shell/MobileWorkshopEntry', () => ({
  MobileWorkshopEntry: () => <div data-testid="workshop-entry-marker" />,
}))

function renderScreen(initialPath = '/learn') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <MobileLearnScreen />
    </MemoryRouter>
  )
}

afterEach(() => {
  usePersonaStore.getState().setPersona(null)
  useModuleStore.setState({ modules: {} })
})

describe('MobileLearnScreen', () => {
  it('defaults to My Path mode', () => {
    renderScreen()
    expect(screen.getByRole('tab', { name: 'My Path', selected: true })).toBeInTheDocument()
  })

  it('prompts to pick a role when no persona is selected', () => {
    renderScreen()
    expect(screen.getByText('Pick a role for a guided path tuned to you.')).toBeInTheDocument()
  })

  it('shows the real My Path content once a persona is selected', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    expect(
      screen.getByText(new RegExp(`Essentials — the core ${PERSONAS.executive.essentials.length}`))
    ).toBeInTheDocument()
  })

  it('offers only the My Path tab on a phone, not Browse all or Guided routing', () => {
    renderScreen()
    expect(screen.getByRole('tab', { name: 'My Path' })).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(1)
    expect(screen.queryByRole('tab', { name: 'Browse all' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: /Guided routing/ })).not.toBeInTheDocument()
  })

  it('says the full catalogue and guided routing are on the desktop site', () => {
    renderScreen()
    expect(
      screen.getByText('The full module catalogue and guided routing are on the desktop site.')
    ).toBeInTheDocument()
    expect(screen.queryByText(/isn't built for mobile yet/)).not.toBeInTheDocument()
  })

  it.each(['browse', 'guided'])('opens My Path for a shared desktop ?mode=%s link', (mode) => {
    renderScreen(`/learn?mode=${mode}`)
    expect(screen.getByRole('tab', { name: 'My Path', selected: true })).toBeInTheDocument()
    expect(screen.getByText('Pick a role for a guided path tuned to you.')).toBeInTheDocument()
    expect(screen.getAllByRole('tab')).toHaveLength(1)
  })

  // 2026-08-24 audit R4.5: the guided workshop was reachable only from Home
  // — invisible from the education hub itself. MobileWorkshopEntry already
  // self-gates (renders nothing idle-with-no-flow/running/video); this only
  // asserts on placement, not on that internal logic (covered separately).
  it('does not render the workshop entry with no persona picked yet', () => {
    renderScreen()
    expect(screen.queryByTestId('workshop-entry-marker')).not.toBeInTheDocument()
  })

  it('renders the workshop entry on the My Path tab once a persona is picked', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    expect(screen.getByTestId('workshop-entry-marker')).toBeInTheDocument()
  })
})

describe('MobileLearnScreen: the page names itself', () => {
  // The phone header title is plain text, so this screen provides the page's one level-one heading.
  it('has exactly one h1, "Learn", with and without a role', () => {
    renderScreen()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Learn' })).toBeInTheDocument()
  })

  it('still has exactly one once a role is selected', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })
})
