// SPDX-License-Identifier: GPL-3.0-only
//
// Integration tests for the Learn hub Dashboard — the persona-overwhelm plan's
// §Tests Integration five regression cases. These guard the load-bearing fixes:
//   P0-1  curious is no longer forced to selectedPersonaFilter === 'All'
//   P0-2  viewMode defaults to 'path' for every persona except researcher / null
//   P0-3  the curious "Show me everything" escape flips state correctly
//   P1-2  sort is not silently disabled when a persona is active; "Curated
//         order" badge appears in its place
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import '@testing-library/jest-dom'
import { Dashboard } from './Dashboard'
import { usePersonaStore } from '../../store/usePersonaStore'
import { useLearnStore } from '../../store/useLearnStore'
import { useModuleStore } from '../../store/useModuleStore'
import { EmbedProvider } from '../../embed/EmbedProvider'
import type { PersonaId } from '@/data/learningPersonas'

const renderDashboard = () =>
  render(
    <EmbedProvider>
      <MemoryRouter initialEntries={['/learn']}>
        <Dashboard />
      </MemoryRouter>
    </EmbedProvider>
  )

const seedPersona = (
  personaId: PersonaId | null,
  extras: Partial<Record<string, unknown>> = {}
) => {
  usePersonaStore.setState({
    selectedPersona: personaId,
    selectedRegion: 'global',
    experienceLevel: personaId === 'curious' ? 'curious' : null,
    hasSeenPersonaPicker: true,
    suppressSuggestion: true,
    niceTier: 'awareness',
    niceTierOverridden: false,
    ...extras,
  })
}

describe('Dashboard — persona-path integration', () => {
  beforeEach(() => {
    useLearnStore.getState().reset()
    useModuleStore.setState({ modules: {} })
    localStorage.clear()
  })

  it('P0-2: executive lands on path view with the curated phases above the catalog', () => {
    seedPersona('executive')
    renderDashboard()

    // Path view exposes the "Browse all" disclosure; stack-mode pages don't.
    expect(screen.getByText(/Browse all \d+ modules \(\d+ tracks\)/i)).toBeInTheDocument()
    // PersonaPathView mounts the curated section.
    expect(
      screen.getByRole('region', { name: /Your curated learning journey/i })
    ).toBeInTheDocument()
    // The 'Journey' chip in the view toggle (value 'path') is the active radio.
    expect(screen.getByRole('radio', { name: /^Journey/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('P0-1 regression: curious starts pre-filtered to its own path (NOT "All")', () => {
    seedPersona('curious')
    renderDashboard()

    // Same disclosure as the other personas — proves the curious user is no longer
    // dumped into the 55-module catalog by the old override in Dashboard.tsx:661-663.
    expect(screen.getByText(/Browse all \d+ modules/i)).toBeInTheDocument()
    // The curious-only escape button is present.
    expect(
      screen.getByRole('button', { name: /Show me everything \(advanced\)/i })
    ).toBeInTheDocument()
  })

  it('P0-2: researcher stays on stack mode — PersonaPathView is NOT rendered', () => {
    seedPersona('researcher')
    renderDashboard()

    expect(
      screen.queryByRole('region', { name: /Your curated learning journey/i })
    ).not.toBeInTheDocument()
    expect(screen.queryByText(/Browse all \d+ modules/i)).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /^Stack/i })).toHaveAttribute('aria-checked', 'true')
  })

  it('P0-3: the curious "Show me everything" escape flips to stack and clears persona filter', async () => {
    const user = userEvent.setup()
    seedPersona('curious')
    renderDashboard()

    await user.click(screen.getByRole('button', { name: /Show me everything \(advanced\)/i }))

    // After the escape: PersonaPathView gone, viewMode === 'stack', and the
    // useLearnStore.showEverything flag is set so a returning curious user
    // keeps the catalog they opted into.
    expect(
      screen.queryByRole('region', { name: /Your curated learning journey/i })
    ).not.toBeInTheDocument()
    expect(useLearnStore.getState().showEverything).toBe(true)
    expect(usePersonaStore.getState().selectedPersona).toBeNull()
  })

  it('P1-2 regression: persona-active path renders the "Curated order" badge instead of silently disabling sort', () => {
    seedPersona('developer')
    renderDashboard()

    // Per the plan: "Curated order" badge sits next to the Sort/View controls
    // when personaFilterActive AND sortBy === 'default'. The badge text is the
    // exact "Curated order" string we render.
    expect(screen.getByText(/Curated order/i)).toBeInTheDocument()
  })
})
