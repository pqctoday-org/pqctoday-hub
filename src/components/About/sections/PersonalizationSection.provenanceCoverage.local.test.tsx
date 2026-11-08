// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { PersonalizationSection } from './PersonalizationSection'

describe('recorded provenance coverage in the personalization explanation', () => {
  it('allows missing metadata and fallible calculated conclusions without inventing review', () => {
    render(
      <MemoryRouter>
        <PersonalizationSection />
      </MemoryRouter>
    )
    const prose = screen.getByText(/Where recorded, source links and provenance metadata/)
    expect(prose).toHaveTextContent('Coverage varies by dataset')
    expect(prose).toHaveTextContent(
      'missing source or review metadata does not establish that a claim was checked'
    )
    expect(prose).toHaveTextContent(
      'does not establish that the premises, calculation or interpretation are correct'
    )
    expect(prose).not.toHaveTextContent(/Every record|cannot quietly disagree/)
    expect(screen.getByRole('link', { name: /Editorial independence/ })).toHaveAttribute(
      'href',
      '/editorial-independence'
    )
    expect(screen.getByRole('heading', { name: 'How this hub adapts to you' })).toBeInTheDocument()
  })
})
