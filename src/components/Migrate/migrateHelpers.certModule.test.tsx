// SPDX-License-Identifier: AGPL-3.0-only
import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CertBadges } from './migrateHelpers'
import type { CertificationXref } from '@/types/MigrateTypes'

function cert(over: Partial<CertificationXref>): CertificationXref {
  return {
    productId: 'p1',
    softwareName: 'Test Product',
    certType: 'FIPS 140-3',
    certId: 'F1',
    certVendor: 'Vendor',
    certProduct: 'Module A',
    pqcAlgorithms: 'No PQC',
    certificationLevel: '',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/f1',
    classicalOnly: false,
    ...over,
  }
}

describe('certificate popover module name', () => {
  const longName =
    'MX240, MX480 and MX960 series and EX9204, EX9208, EX9214 Ethernet Switches, Junos OS 22.3R1'

  it('shows the module name of each certificate, clamped to two lines, with the full text in the title', () => {
    render(
      <CertBadges
        certs={[
          cert({ certId: 'F1', certProduct: longName, certDate: '2026-06-01' }),
          cert({
            certId: 'F2',
            certProduct: 'Module B',
            certDate: '2025-01-01',
            certLink: 'https://example.com/f2',
          }),
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i }))
    const menu = screen.getByRole('menu')
    const names = within(menu).getAllByTestId('cert-module-name')
    expect(names.map((n) => n.textContent)).toEqual([longName, 'Module B'])
    expect(names[0]).toHaveAttribute('title', longName)
    expect(names[0].className).toContain('line-clamp-2')
  })

  it('shows no module line for a certificate with no module name', () => {
    render(
      <CertBadges
        certs={[
          cert({ certId: 'F1', certProduct: '' }),
          cert({
            certId: 'F2',
            certProduct: '',
            certLink: 'https://example.com/f2',
            certDate: '2025-01-01',
          }),
        ]}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i }))
    expect(within(screen.getByRole('menu')).queryByTestId('cert-module-name')).toBeNull()
  })
})
