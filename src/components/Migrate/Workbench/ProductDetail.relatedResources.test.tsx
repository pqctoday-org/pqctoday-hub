// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import '@testing-library/jest-dom'
import { ProductDetail } from './ProductDetail'
import { relatedResourceByProduct, purlByProduct } from '@/data/purlXrefData'
import { certsByProduct } from '@/data/certificationXrefData'
import { buildRelatedResource } from '@/data/relatedResources'
import type { CertificationXref, PurlXref, SoftwareItem } from '@/types/MigrateTypes'

vi.mock('@/hooks/useRevisions', () => ({
  useRevisions: () => ({ revisions: [], isLoading: false, error: null }),
  byRecord: () => [],
}))

// Fixture products and rows only: the shipped files may or may not carry the new columns yet.
const ID = 'zz-related-fixture'

function product(over: Partial<SoftwareItem> = {}): SoftwareItem {
  return {
    productId: ID,
    softwareName: 'ZZ Related Fixture',
    categoryId: 'c',
    categoryName: 'Hardware Security Module',
    infrastructureLayer: 'Hardware',
    cisaCategory: '',
    pqcSupport: 'Yes',
    pqcCapabilityDescription: '',
    licenseType: '',
    license: '',
    latestVersion: '25.4R1',
    releaseDate: '',
    fipsValidated: 'Yes',
    pqcMigrationPriority: '',
    primaryPlatforms: '',
    targetIndustries: '',
    authoritativeSource: '',
    repositoryUrl: '',
    productBrief: '',
    sourceType: '',
    verificationStatus: '',
    lastVerifiedDate: '',
    migrationPhases: '',
    learningModules: '',
    ...over,
  }
}

function cert(over: Partial<CertificationXref> = {}): CertificationXref {
  return {
    productId: ID,
    softwareName: 'ZZ Related Fixture',
    certType: 'FIPS 140-3',
    certId: '5266',
    certVendor: 'Vendor',
    certProduct: 'Fixture Module',
    pqcAlgorithms: 'No PQC Mechanisms Detected',
    certificationLevel: 'FIPS 140-3 L1',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/5266',
    classicalOnly: true,
    ...over,
  }
}

function renderDetail(p: SoftwareItem) {
  return render(
    <MemoryRouter>
      <ProductDetail product={p} />
    </MemoryRouter>
  )
}

afterEach(() => {
  relatedResourceByProduct.delete(ID)
  purlByProduct.delete(ID)
  certsByProduct.delete(ID)
})

describe('ProductDetail related resources', () => {
  it('shows the related resource under a labelled list, named by its kind, and no PURL line', () => {
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://github.com/Yubico/yubihsm-shell', 'sdk')!
    )
    const notFound: PurlXref = {
      productId: ID,
      softwareName: 'ZZ Related Fixture',
      purl: '',
      purlType: '',
      purlNamespace: '',
      purlName: '',
      matchConfidence: '',
      status: 'not_found',
      registryUrl: '',
      lastVerifiedDate: '',
    }
    purlByProduct.set(ID, notFound)
    renderDetail(product())

    const list = screen.getByRole('list', { name: 'Related resources' })
    const link = within(list).getByRole('link', { name: 'SDK: Yubico/yubihsm-shell' })
    expect(link).toHaveAttribute('href', 'https://github.com/Yubico/yubihsm-shell')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(screen.queryByText(/PURL:/)).not.toBeInTheDocument()
  })

  it('names an issue tracker as one', () => {
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://github.com/FusionAuth/fusionauth-issues', 'issue_tracker')!
    )
    renderDetail(product())
    expect(
      screen.getByRole('link', { name: 'Issue tracker: FusionAuth/fusionauth-issues' })
    ).toBeInTheDocument()
  })

  it('is never labelled as a package identifier', () => {
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://github.com/ARM-software/cca-rmm-acs', 'test_suite')!
    )
    renderDetail(product())
    expect(screen.queryByText(/PURL/)).not.toBeInTheDocument()
    expect(screen.queryByText('Identifiers')).not.toBeInTheDocument()
    expect(screen.getByText('Test suite: ARM-software/cca-rmm-acs')).toBeInTheDocument()
  })

  it('does not repeat the catalogue Repository link when it is the same address', () => {
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://github.com/Yubico/yubihsm-shell', 'sdk')!
    )
    renderDetail(product({ repositoryUrl: 'https://github.com/Yubico/yubihsm-shell/' }))
    expect(screen.queryByRole('link', { name: /^Repository$/ })).not.toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /yubihsm-shell/ })).toHaveLength(1)
  })

  it('keeps the catalogue Repository link when it is a different address', () => {
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://github.com/Yubico/yubihsm-shell', 'sdk')!
    )
    renderDetail(product({ repositoryUrl: 'https://github.com/Yubico/other' }))
    expect(screen.getByRole('link', { name: 'Repository' })).toHaveAttribute(
      'href',
      'https://github.com/Yubico/other'
    )
  })

  it('renders nothing when the product has no related resource', () => {
    renderDetail(product({ repositoryUrl: 'https://github.com/Yubico/yubihsm-shell' }))
    expect(screen.queryByText('Related resources')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Related resources' })).not.toBeInTheDocument()
    // The catalogue Repository link is untouched.
    expect(screen.getByRole('link', { name: 'Repository' })).toBeInTheDocument()
  })
})

describe('ProductDetail certificate coverage', () => {
  const JUNOS =
    'MX240, MX480 and MX960 series and EX9204, EX9208, EX9214 Ethernet Switches, Junos OS 22.3R1'

  it('shows what the certificate covers beside its number, and the earlier-release sentence', () => {
    certsByProduct.set(ID, [cert({ certCovers: JUNOS, certRelationship: 'earlier_release' })])
    renderDetail(product())

    const list = screen.getByRole('list', { name: 'What each certificate covers' })
    const row = within(list).getByRole('listitem')
    expect(row).toHaveTextContent(`FIPS 140-3 #5266: ${JUNOS}`)
    expect(row).toHaveTextContent("Covers an earlier release than the catalogue's latest (25.4R1)")
  })

  it('marks a limited certificate with an icon and text, not colour alone', () => {
    certsByProduct.set(ID, [cert({ certCovers: JUNOS, certRelationship: 'earlier_release' })])
    renderDetail(product())
    const sentence = screen.getByTestId('cert-coverage-sentence')
    expect(sentence.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(sentence).toHaveTextContent(/Covers an earlier release/)
  })

  it.each([
    ['platform_specific', 'Covers named hardware platforms only'],
    ['module_of_product', 'Covers a validated module the product uses, not the whole product'],
    ['same_release', 'Matches the catalogue release'],
  ] as const)('says "%s" in plain words', (relationship, sentence) => {
    certsByProduct.set(ID, [cert({ certCovers: 'Some module', certRelationship: relationship })])
    renderDetail(product())
    expect(screen.getByTestId('cert-coverage-sentence')).toHaveTextContent(sentence)
  })

  it('a blank relationship adds no sentence and never says "same release"', () => {
    certsByProduct.set(ID, [cert({ certCovers: JUNOS })])
    renderDetail(product())
    expect(screen.getByRole('listitem')).toHaveTextContent(JUNOS)
    expect(screen.queryByTestId('cert-coverage-sentence')).not.toBeInTheDocument()
    expect(screen.queryByText(/Matches the catalogue release/)).not.toBeInTheDocument()
  })

  it('a relationship with no covers text still shows its sentence under the certificate number', () => {
    certsByProduct.set(ID, [cert({ certRelationship: 'module_of_product' })])
    renderDetail(product())
    expect(screen.getByRole('listitem')).toHaveTextContent('FIPS 140-3 #5266')
    expect(screen.getByTestId('cert-coverage-sentence')).toBeInTheDocument()
  })

  it('renders nothing extra when neither column is filled', () => {
    certsByProduct.set(ID, [cert({})])
    renderDetail(product())
    expect(screen.getByText('Certifications')).toBeInTheDocument()
    expect(screen.queryByTestId('cert-coverage')).not.toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'What each certificate covers' })).toBeNull()
  })

  it('lists one line per certificate that says something, in badge order', () => {
    certsByProduct.set(ID, [
      cert({ certType: 'Common Criteria', certId: 'CC-9', certCovers: 'CC target' }),
      cert({ certId: '5266', certCovers: JUNOS, certRelationship: 'earlier_release' }),
      cert({ certId: '5400' }),
    ])
    renderDetail(product())
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)
    expect(rows[0]).toHaveTextContent('FIPS 140-3 #5266')
    expect(rows[1]).toHaveTextContent('Common Criteria #CC-9: CC target')
  })
})
