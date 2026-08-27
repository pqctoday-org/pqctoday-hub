// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

  it('Browse all and Guided routing state plainly that they are not built for mobile yet', () => {
    renderScreen()
    fireEvent.click(screen.getByRole('tab', { name: 'Browse all' }))
    expect(screen.getByText("Browse all isn't built for mobile yet")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: /Guided routing/ }))
    expect(screen.getByText("Guided routing isn't built for mobile yet")).toBeInTheDocument()
  })

  it('honors a real ?mode= deep link, mirroring desktop’s convention', () => {
    renderScreen('/learn?mode=browse')
    expect(screen.getByRole('tab', { name: 'Browse all', selected: true })).toBeInTheDocument()
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

  it('does not render the workshop entry on Browse all or Guided routing', () => {
    usePersonaStore.getState().setPersona('executive')
    renderScreen()
    fireEvent.click(screen.getByRole('tab', { name: 'Browse all' }))
    expect(screen.queryByTestId('workshop-entry-marker')).not.toBeInTheDocument()
  })
})
