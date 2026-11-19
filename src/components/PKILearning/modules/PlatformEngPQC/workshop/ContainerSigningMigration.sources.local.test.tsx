// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ContainerSigningMigration } from './ContainerSigningMigration'
import { SIGNING_TOOLS } from '../data/signingToolsData'
import { content } from '../content'

describe('current signing-tool source and standards claims', () => {
  it('describes RFC 10073 as a standard and keeps implementation support separate', () => {
    const notation = SIGNING_TOOLS.find((tool) => tool.id === 'notation')!
    expect(notation.limitations.join(' ')).toMatch(/RFC 10073 now standardizes/i)
    expect(notation.pqcNotes).toMatch(/does not establish CLI, plugin, CA, or verifier support/i)
    expect(notation.signatureFormat).toMatch(/JWS or COSE/i)
    expect(notation.sources?.map((source) => source.url)).toContain(
      'https://www.rfc-editor.org/rfc/rfc10073.html'
    )
  })

  it('does not treat GnuPG RFC 9980 encryption support as signature support', () => {
    const gpg = SIGNING_TOOLS.find((tool) => tool.id === 'gpg')!
    expect(gpg.pqcNotes).toMatch(/ML-KEM hybrid encryption/i)
    expect(gpg.pqcNotes).toMatch(/do not document RFC 9980 signature creation or verification/i)
    expect(gpg.sources?.map((source) => source.label)).toContain(
      'GnuPG 2.5.24 release announcement'
    )
  })

  it('declares the current OpenPGP and X.509 composite standards for the module', () => {
    expect(content.standards.map((standard) => standard.id)).toContain('RFC 9980')
    expect(content.standards.map((standard) => standard.id)).toContain(
      'RFC-10073-Composite-ML-DSA-for-Use-in-X-509-Public-Key-Infra'
    )
  })

  it('renders primary-source links in the signing tool details', () => {
    render(
      <MemoryRouter>
        <ContainerSigningMigration />
      </MemoryRouter>
    )
    expect(screen.getByRole('link', { name: 'Cosign releases' })).toHaveAttribute(
      'href',
      'https://github.com/sigstore/cosign/releases'
    )
    fireEvent.click(screen.getByRole('button', { name: /Notation/ }))
    expect(screen.getByRole('link', { name: 'RFC 10073' })).toBeVisible()
    expect(screen.getByRole('link', { name: 'AWS Signer Notation plugin' })).toHaveAttribute(
      'href',
      'https://github.com/aws/aws-signer-notation-plugin'
    )
  })
})
