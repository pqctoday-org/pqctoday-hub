// SPDX-License-Identifier: AGPL-3.0-only
import '@testing-library/jest-dom/vitest'
import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileLibraryView } from './MobileLibraryView'
describe('Phone Library source identity and review-process deep links', () => {
  it('shows independent RFC publication without implying IETF standard or academic review', () => {
    render(
      <MemoryRouter
        initialEntries={['/library?ref=RFC-9563-SM2-Digital-Signature-Algorithm-for-DNSSEC']}
      >
        <MobileLibraryView />
      </MemoryRouter>
    )
    const sheet = screen.getByTestId('library-detail-sheet')
    expect(within(sheet).getByTestId('library-review-process')).toHaveTextContent(
      'Independent Submission · Informational RFC'
    )
    expect(sheet).toHaveTextContent('does not have IETF community consensus')
    expect(within(sheet).queryByText('Academic peer review recorded')).not.toBeInTheDocument()
  })
  it('links the separate CMS base, structure and AES profile sources from the real RFC5083 sheet', () => {
    render(
      <MemoryRouter initialEntries={['/library?ref=RFC%205083']}>
        <MobileLibraryView />
      </MemoryRouter>
    )
    const guide = within(screen.getByTestId('library-detail-sheet')).getByRole('region', {
      name: 'CMS specification roles',
    })
    expect(within(guide).getByRole('link', { name: /RFC 5652/ })).toHaveAttribute(
      'href',
      'https://www.rfc-editor.org/rfc/rfc5652.html'
    )
    expect(within(guide).getByRole('link', { name: /RFC 5083/ })).toHaveTextContent(
      'Authenticated-Enveloped-Data Content Type'
    )
    expect(within(guide).getByRole('link', { name: /RFC 5084/ })).toHaveTextContent(
      'AES-CCM and AES-GCM'
    )
    expect(guide).toHaveTextContent('algorithm conventions for AuthEnvelopedData')
  })
})
