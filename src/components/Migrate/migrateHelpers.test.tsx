// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CertBadges } from './migrateHelpers'
import type { CertificationXref } from '@/types/MigrateTypes'

function makeCert(over: Partial<CertificationXref>): CertificationXref {
  return {
    productId: 'p1',
    softwareName: 'Test Product',
    certType: 'FIPS 140-3',
    certId: 'CERT-1',
    certVendor: 'Vendor',
    certProduct: 'Test Product',
    pqcAlgorithms: 'No PQC',
    certificationLevel: '',
    status: 'active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/cert-1',
    classicalOnly: false,
    ...over,
  }
}

describe('CertBadges', () => {
  it('renders nothing for an empty cert list', () => {
    const { container } = render(<CertBadges certs={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a single cert as a plain link, no popover affordance', () => {
    render(<CertBadges certs={[makeCert({ certId: 'F1' })]} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', 'https://example.com/cert-1')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('shows a count and opens a popover listing every cert of a type, newest first', () => {
    render(
      <CertBadges
        certs={[
          makeCert({ certId: 'F1', certDate: '2024-01-01', certLink: 'https://example.com/f1' }),
          makeCert({ certId: 'F2', certDate: '2026-06-01', certLink: 'https://example.com/f2' }),
          makeCert({ certId: 'F3', certDate: '2025-03-01', certLink: 'https://example.com/f3' }),
        ]}
      />
    )
    const trigger = screen.getByRole('button', { name: /3 FIPS 140-3 certificates/i })
    expect(trigger).toHaveTextContent('(3)')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    fireEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    const menu = screen.getByRole('menu')
    const rows = within(menu).getAllByRole('menuitem')
    expect(rows).toHaveLength(3)
    // Newest (2026-06-01) first
    expect(rows[0]).toHaveAttribute('href', 'https://example.com/f2')
    expect(rows[1]).toHaveAttribute('href', 'https://example.com/f3')
    expect(rows[2]).toHaveAttribute('href', 'https://example.com/f1')
  })

  it('closes the popover on Escape', () => {
    render(
      <CertBadges
        certs={[makeCert({ certId: 'F1' }), makeCert({ certId: 'F2', certDate: '2027-01-01' })]}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('closes the popover on outside click', () => {
    render(
      <div>
        <div data-testid="outside">outside</div>
        <CertBadges
          certs={[makeCert({ certId: 'F1' }), makeCert({ certId: 'F2', certDate: '2027-01-01' })]}
        />
      </div>
    )
    fireEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('stops click propagation so a clickable ancestor row does not also toggle', () => {
    let parentClicks = 0
    render(
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div onClick={() => (parentClicks += 1)}>
        <CertBadges certs={[makeCert({ certId: 'F1' })]} />
      </div>
    )
    fireEvent.click(screen.getByRole('link'))
    expect(parentClicks).toBe(0)
  })

  it('renders one badge per cert type independently, each with its own count', () => {
    render(
      <CertBadges
        certs={[
          makeCert({ certId: 'F1', certType: 'FIPS 140-3' }),
          makeCert({ certId: 'F2', certType: 'FIPS 140-3', certDate: '2027-01-01' }),
          makeCert({ certId: 'A1', certType: 'ACVP' }),
          makeCert({ certId: 'C1', certType: 'Common Criteria' }),
        ]}
      />
    )
    expect(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i })).toBeInTheDocument()
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(2) // CAVP + Common Criteria, single record each
    // A CAVP record is labelled CAVP and never called a certificate.
    const cavp = links.find((l) => l.textContent?.includes('CAVP'))
    expect(cavp).toBeDefined()
    expect(cavp).toHaveAttribute('title', expect.stringMatching(/prerequisite, not a certificate/))
  })
  it('counts a repeated certificate once', () => {
    render(
      <CertBadges
        certs={[
          makeCert({ certId: 'F1' }),
          makeCert({ certId: 'F1' }),
          makeCert({ certId: 'F2', certDate: '2027-01-01' }),
        ]}
      />
    )
    expect(screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i })).toHaveTextContent(
      '(2)'
    )
  })

  describe('per-certificate classical-only scope', () => {
    it('a single classical-only certificate with blank algorithms carries the same qualification as the grouped popover', () => {
      render(
        <CertBadges certs={[makeCert({ certId: 'F1', pqcAlgorithms: '', classicalOnly: true })]} />
      )
      const link = screen.getByRole('link')
      expect(link).toHaveAttribute('title', expect.stringMatching(/classical only/i))
      expect(screen.getByTestId('cert-badge-classical-only')).toHaveTextContent(/classical only/i)
    })

    it('a single certificate that covers PQC shows no classical-only qualification', () => {
      render(
        <CertBadges
          certs={[makeCert({ certId: 'F1', pqcAlgorithms: 'ML-KEM-768', classicalOnly: false })]}
        />
      )
      expect(screen.queryByTestId('cert-badge-classical-only')).not.toBeInTheDocument()
      expect(screen.getByRole('link')).toHaveAttribute(
        'title',
        expect.stringMatching(/PQC: ML-KEM-768/)
      )
      expect(screen.getByRole('link')).not.toHaveAttribute(
        'title',
        expect.stringMatching(/classical only/i)
      )
    })

    it('a mixed CAVP/CMVP product: a PQC newest certificate does not hide a classical-only one', () => {
      render(
        <CertBadges
          certs={[
            // CMVP module certificate: PQC covered, newest
            makeCert({ certId: 'F-NEW', certDate: '2027-01-01', pqcAlgorithms: 'ML-KEM-768' }),
            // CMVP module certificate: classical only, older
            makeCert({
              certId: 'F-OLD',
              certDate: '2024-01-01',
              pqcAlgorithms: '',
              classicalOnly: true,
            }),
            // CAVP algorithm validation: classical only (single record)
            makeCert({ certId: 'A-1', certType: 'ACVP', pqcAlgorithms: '', classicalOnly: true }),
          ]}
        />
      )
      // The grouped FIPS badge states how many of its certificates cover no PQC algorithm.
      const group = screen.getByRole('button', { name: /2 FIPS 140-3 certificates/i })
      expect(group).toHaveAttribute('title', expect.stringMatching(/1 of 2 cover no PQC algorithm/))
      expect(group).toHaveAttribute('title', expect.stringMatching(/newest covers PQC: ML-KEM-768/))
      // It is not labelled classical-only as a whole, because one certificate covers PQC.
      expect(within(group).queryByTestId('cert-badge-classical-only')).not.toBeInTheDocument()
      // The popover still marks the classical-only certificate individually.
      fireEvent.click(group)
      const menu = screen.getByRole('menu')
      expect(within(menu).getAllByTestId('cert-classical-only')).toHaveLength(1)
      // The lone CAVP record carries its own qualification.
      const cavp = screen.getAllByRole('link').find((l) => l.textContent?.includes('CAVP'))
      expect(cavp).toBeDefined()
      expect(
        within(cavp as HTMLElement).getByTestId('cert-badge-classical-only')
      ).toBeInTheDocument()
    })
  })
})
