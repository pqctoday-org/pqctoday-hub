// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { FipsStatusBadge } from './FipsStatusBadge'
import { certsByProduct } from '@/data/certificationXrefData'
import type { CertificationXref } from '@/types/MigrateTypes'

function cert(over: Partial<CertificationXref>): CertificationXref {
  return {
    productId: 'zz-fips-badge',
    softwareName: 'ZZ FIPS Badge Product',
    certType: 'FIPS 140-3',
    certId: '5266',
    certVendor: 'Vendor',
    certProduct: 'Module',
    pqcAlgorithms: 'No PQC Mechanisms Detected',
    certificationLevel: 'FIPS 140-3 L1',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/5266',
    classicalOnly: true,
    ...over,
  }
}

function withCerts(certs: CertificationXref[]) {
  certsByProduct.set('zz-fips-badge', certs)
  return render(
    <FipsStatusBadge
      fipsValidated="Yes (FIPS 140-3 Cert #5266)"
      productId="zz-fips-badge"
      softwareName="ZZ FIPS Badge Product"
    />
  )
}

afterEach(() => {
  certsByProduct.delete('zz-fips-badge')
})

describe('FipsStatusBadge certificate coverage line', () => {
  it('adds one line when an active FIPS 140-3 certificate covers an earlier release', () => {
    const { container } = withCerts([cert({ certRelationship: 'earlier_release' })])
    const title = (container.firstChild as HTMLElement).getAttribute('title') ?? ''
    expect(title).toMatch(/does not cover the catalogue release or the whole product/)
    expect(title.match(/does not cover the catalogue release/g)).toHaveLength(1)
  })

  it.each(['platform_specific', 'module_of_product'] as const)('adds the line for %s', (rel) => {
    const { container } = withCerts([cert({ certRelationship: rel })])
    expect((container.firstChild as HTMLElement).getAttribute('title')).toMatch(
      /does not cover the catalogue release/
    )
  })

  it('adds nothing for a same-release certificate', () => {
    const { container } = withCerts([cert({ certRelationship: 'same_release' })])
    expect((container.firstChild as HTMLElement).getAttribute('title')).not.toMatch(
      /does not cover the catalogue release/
    )
  })

  it('adds nothing when no relationship is recorded', () => {
    const { container } = withCerts([cert({})])
    expect((container.firstChild as HTMLElement).getAttribute('title')).not.toMatch(
      /does not cover the catalogue release/
    )
    expect(screen.getByText(/FIPS/)).toBeInTheDocument()
  })

  it('does not let a limited certificate of another scheme change the FIPS badge', () => {
    const { container } = withCerts([
      cert({ certType: 'Common Criteria', certId: 'CC-1', certRelationship: 'earlier_release' }),
    ])
    expect((container.firstChild as HTMLElement).getAttribute('title')).not.toMatch(
      /does not cover the catalogue release/
    )
  })
})
