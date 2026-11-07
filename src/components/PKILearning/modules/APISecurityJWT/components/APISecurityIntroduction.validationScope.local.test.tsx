// SPDX-License-Identifier: AGPL-3.0-only
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { APISecurityIntroduction } from './APISecurityIntroduction'

describe('JWT validation teaching scope', () => {
  it('explains the validation responsibility without an unsupported breach-frequency ranking', () => {
    render(
      <MemoryRouter>
        <APISecurityIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    const paragraph = screen.getByText(/Validation mistakes are an important JWT failure class/)
    expect(paragraph.textContent).toMatch(/does not replace correct token validation/)
    expect(paragraph.textContent).not.toMatch(/most real-world|majority/i)
    const source = screen.getByRole('link', { name: /RFC 8725/ })
    expect(source.getAttribute('href')).toBe('https://www.rfc-editor.org/rfc/rfc8725.html')
    // The recommendations still concern application checks, not just algorithm selection.
    expect(screen.getAllByText(/audience/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/Check iss and aud against what you expect/)).toBeTruthy()
  })
})
