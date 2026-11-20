// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FAQPage } from './FAQPage'
import { FAQ_DATA } from './faqData'
import { PERSONA_IDS } from '@/data/learningPersonas'
import { usePersonaStore } from '@/store/usePersonaStore'

function renderPage() {
  return render(
    <MemoryRouter>
      <FAQPage />
    </MemoryRouter>
  )
}

beforeEach(() => usePersonaStore.getState().setPersona(null))

describe('FAQPage persona highlight ("float, don\'t filter")', () => {
  it('shows no "For you" badge when no persona is selected', () => {
    renderPage()
    expect(screen.queryByText('For you')).not.toBeInTheDocument()
  })

  it('floats and highlights the developer question in Role-Specific Guidance, without hiding others', () => {
    usePersonaStore.getState().setPersona('developer')
    renderPage()

    const section = document.getElementById('roles')
    expect(section).toBeTruthy()
    const withinSection = within(section as HTMLElement)

    // Exactly one badge in this persona-tagged category.
    expect(withinSection.getAllByText('For you')).toHaveLength(1)

    // The developer question is still present and is the first item rendered.
    const questionButtons = withinSection.getAllByRole('button')
    expect(questionButtons[0]).toHaveTextContent('What PQC libraries should developers use?')

    // Nothing was hidden — all ten Role-Specific Guidance questions remain.
    const rolesCat = FAQ_DATA.find((c) => c.id === 'roles')!
    expect(questionButtons.length).toBe(rolesCat.items.length)
    expect(rolesCat.items.length).toBe(10)
  })

  it('gives every one of the 8 personas exactly one highlighted Role-Specific Guidance question', () => {
    for (const persona of PERSONA_IDS) {
      usePersonaStore.getState().setPersona(persona)
      const { unmount } = renderPage()
      const section = document.getElementById('roles') as HTMLElement
      expect(within(section).getAllByText('For you'), persona).toHaveLength(1)
      unmount()
    }
  })
})
