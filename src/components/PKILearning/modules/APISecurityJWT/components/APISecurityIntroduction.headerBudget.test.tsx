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

  it('names the documented server defaults instead of calling one limit the default', () => {
    const text = t()
    expect(text).toContain('May exceed a configured HTTP header limit: defaults differ by server')
    expect(text).toContain('Apache httpd 8190 bytes per header field')
    expect(text).toContain('nginx 8 KB per header buffer')
    expect(text).toContain('Tomcat 8 KiB')
    expect(text).toContain('Node.js 16 KiB')
    expect(text).not.toContain('May exceed default HTTP header limits')
  })

  it('places the DPoP public JWK in the JOSE header', () => {
    const text = t()
    expect(text).toMatch(/Their JOSE header must contain the client.s public JWK/)
    expect(text).not.toMatch(/Their headers must contain/)
  })
})
