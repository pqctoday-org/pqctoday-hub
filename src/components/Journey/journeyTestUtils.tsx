// SPDX-License-Identifier: AGPL-3.0-only
import { render } from '@testing-library/react'
import { MemoryRouter, useLocation } from 'react-router'
import type { ReactElement } from 'react'
import { useJourneyStore } from '@/store/useJourneyStore'
import { useModuleStore } from '@/store/useModuleStore'
import { usePersonaStore } from '@/store/usePersonaStore'
import { buildPreview } from '@/services/journey/objectiveBuilder'
import type { PersonaId } from '@/data/personaIds'

export function Where() {
  const { pathname, search } = useLocation()
  return <div data-testid="where">{pathname + search}</div>
}

export function renderAt(ui: ReactElement, path = '/learn') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      {ui}
      <Where />
    </MemoryRouter>
  )
}

export function resetJourneyWorld() {
  localStorage.clear()
  useJourneyStore.setState({
    objectives: {},
    order: [],
    focus: {},
    completions: {},
    roleSwitch: null,
  })
  useModuleStore.setState({ modules: {} })
  usePersonaStore.setState({ selectedPersona: null, experienceLevel: null, selectedIndustry: null })
}

export const TLS_GOAL = 'Review our TLS migration design'

/** Saves an objective for a role from a real preview and returns its id. */
export function saveObjective(goal: string, persona: PersonaId | null = 'architect') {
  const preview = buildPreview({ goal, persona, existing: [], isDone: () => false })
  return useJourneyStore.getState().createObjective(preview).id
}

/** Saves the TLS objective for a role and returns its id. */
export function saveTlsObjective(persona: PersonaId | null = 'architect') {
  return saveObjective(TLS_GOAL, persona)
}
