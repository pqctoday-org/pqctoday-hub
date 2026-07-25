// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { FAQPage } from './FAQPage'
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

    // Nothing was hidden — all eight Role-Specific Guidance questions remain.
    expect(questionButtons.length).toBe(8)
  })
})
