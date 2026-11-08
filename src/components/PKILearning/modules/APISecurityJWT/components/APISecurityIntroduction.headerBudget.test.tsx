// SPDX-License-Identifier: AGPL-3.0-only
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { APISecurityIntroduction } from './APISecurityIntroduction'

describe('JWT size teaching: header budget and DPoP header', () => {
  const t = () => {
    const { container } = render(
      <MemoryRouter>
        <APISecurityIntroduction onNavigateToWorkshop={vi.fn()} />
      </MemoryRouter>
    )
    return (container.textContent ?? '').replace(/\s+/g, ' ')
  }

  it('labels the 8 KB bar as an example budget, not a default limit', () => {
    const text = t()
    expect(text).toContain('Example header budget (varies by server)')
    expect(text).not.toContain('HTTP Header Limit (default)')
  })

  it('places the DPoP public JWK in the JOSE header', () => {
    const text = t()
    expect(text).toMatch(/Their JOSE header must contain the client.s public JWK/)
    expect(text).not.toMatch(/Their headers must contain/)
  })
})
