// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { SpecLink } from './SpecLink'

const renderLink = (docId: string, url?: string) =>
  render(
    <MemoryRouter>
      <SpecLink docId={docId} url={url} className="chip">
        {docId}
      </SpecLink>
    </MemoryRouter>
  )

describe('SpecLink', () => {
  it('links to the Library entry inside the app, without opening a new tab', () => {
    renderLink('PKCS#11 v3.2 OS', 'https://docs.oasis-open.org/pkcs11/pkcs11-spec/v3.2/os/')
    const a = screen.getByRole('link', { name: 'PKCS#11 v3.2 OS' })
    expect(a).toHaveAttribute('href', '/library?ref=PKCS11-V32-OS-OASIS')
    expect(a).not.toHaveAttribute('target')
  })

  it('opens the cited page in a new tab, with rel noopener noreferrer, when the Library lacks it', () => {
    renderLink('KMIP 3.0 CSD02', 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/')
    const a = screen.getByRole('link', { name: 'KMIP 3.0 CSD02' })
    expect(a).toHaveAttribute('href', 'https://docs.oasis-open.org/kmip/kmip-spec/v3.0/')
    expect(a).toHaveAttribute('target', '_blank')
    expect(a).toHaveAttribute('rel', 'noopener noreferrer')
    expect(a).toHaveAttribute('title', 'Open external specification (KMIP 3.0 CSD02)')
  })

  it('searches the Library only when it has no address to open', () => {
    renderLink('KMIP 3.0 CSD02')
    expect(screen.getByRole('link', { name: 'KMIP 3.0 CSD02' })).toHaveAttribute(
      'href',
      '/library?q=KMIP%203.0%20CSD02'
    )
  })
})
