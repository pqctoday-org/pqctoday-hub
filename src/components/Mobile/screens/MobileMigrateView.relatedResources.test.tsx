// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { MobileMigrateView } from './MobileMigrateView'
import { softwareData } from '@/data/migrateData'
import { certsByProduct } from '@/data/certificationXrefData'
import { relatedResourceByProduct } from '@/data/purlXrefData'
import { buildRelatedResource } from '@/data/relatedResources'
import type { CertificationXref, SoftwareItem } from '@/types/MigrateTypes'

// A real catalogue product with fixture rows put in the two lookups for this file only:
// the shipped files may or may not carry the new columns yet. Fixture names are
// used for every certificate so nothing here depends on shipped certificate data.
let product: SoftwareItem
let savedCerts: CertificationXref[] | undefined
let savedRelated: ReturnType<typeof relatedResourceByProduct.get>

beforeAll(() => {
  product = softwareData.find((p) => !!p.productId && !!p.softwareName)!
})

function cert(over: Partial<CertificationXref>): CertificationXref {
  return {
    productId: product.productId,
    softwareName: product.softwareName,
    certType: 'FIPS 140-3',
    certId: 'ZZ-5266',
    certVendor: 'Vendor',
    certProduct: 'Fixture Module',
    pqcAlgorithms: 'No PQC Mechanisms Detected',
    certificationLevel: 'FIPS 140-3 L1',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/zz-5266',
    classicalOnly: true,
    ...over,
  }
}

function setFixture(opts: { certs?: CertificationXref[]; related?: [string, string] }) {
  savedCerts = certsByProduct.get(product.productId)
  savedRelated = relatedResourceByProduct.get(product.productId)
  certsByProduct.set(product.productId, opts.certs ?? [])
  if (opts.related) {
    relatedResourceByProduct.set(
      product.productId,
      buildRelatedResource(opts.related[0], opts.related[1])!
    )
  } else {
    relatedResourceByProduct.delete(product.productId)
  }
}

afterEach(() => {
  if (savedCerts) certsByProduct.set(product.productId, savedCerts)
  else certsByProduct.delete(product.productId)
  if (savedRelated) relatedResourceByProduct.set(product.productId, savedRelated)
  else relatedResourceByProduct.delete(product.productId)
})

function openSheet(): HTMLElement {
  render(
    <MemoryRouter
      initialEntries={[`/migrate?tab=plan&open=${encodeURIComponent(product.productId)}`]}
    >
      <MobileMigrateView />
    </MemoryRouter>
  )
  return screen.getByTestId('migrate-product-detail-sheet')
}

describe('phone product sheet: related resources', () => {
  it('shows a Related resources section with a 44 px link named by its kind', () => {
    setFixture({ related: ['https://github.com/MicrochipTech/cryptoauthlib', 'sdk'] })
    const sheet = openSheet()
    const section = within(sheet).getByRole('region', { name: 'Related resources' })
    const link = within(section).getByRole('link', { name: 'SDK: MicrochipTech/cryptoauthlib' })
    expect(link).toHaveAttribute('href', 'https://github.com/MicrochipTech/cryptoauthlib')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
    expect(link.className).toContain('min-h-11')
    // Long names wrap rather than push the sheet sideways at 390 px.
    expect(link.querySelector('span.break-words')).not.toBeNull()
  })

  it('comes after PQC capabilities', () => {
    setFixture({ related: ['https://github.com/Yubico/yubihsm-shell', 'sdk'] })
    const sheet = openSheet()
    const text = sheet.textContent ?? ''
    expect(text.indexOf('PQC capabilities')).toBeGreaterThan(-1)
    expect(text.indexOf('Related resources')).toBeGreaterThan(text.indexOf('PQC capabilities'))
  })

  it('names an issue tracker as one', () => {
    setFixture({
      related: ['https://github.com/FusionAuth/fusionauth-issues', 'issue_tracker'],
    })
    const sheet = openSheet()
    expect(
      within(sheet).getByRole('link', { name: 'Issue tracker: FusionAuth/fusionauth-issues' })
    ).toBeInTheDocument()
  })

  it('renders nothing when the product has no related resource', () => {
    setFixture({})
    const sheet = openSheet()
    expect(within(sheet).queryByText('Related resources')).toBeNull()
    expect(within(sheet).queryByRole('region', { name: 'Related resources' })).toBeNull()
  })
})

describe('phone product sheet: certificate coverage', () => {
  const JUNOS =
    'MX240, MX480 and MX960 series and EX9204, EX9208, EX9214 Ethernet Switches, Junos OS 22.3R1'

  it('shows what each certificate covers as visible text, with the earlier-release sentence', () => {
    setFixture({
      certs: [cert({ certCovers: JUNOS, certRelationship: 'earlier_release' })],
    })
    const sheet = openSheet()
    expect(within(sheet).getByText(`Covers: ${JUNOS}`)).toBeInTheDocument()
    const sentence = within(sheet).getByText(
      /Covers an earlier release than the catalogue's latest/
    )
    expect(sentence.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    if (product.latestVersion) expect(sentence).toHaveTextContent(`(${product.latestVersion})`)
  })

  it('a blank relationship adds no sentence', () => {
    setFixture({ certs: [cert({ certCovers: JUNOS })] })
    const sheet = openSheet()
    expect(within(sheet).getByText(`Covers: ${JUNOS}`)).toBeInTheDocument()
    expect(within(sheet).queryByText(/earlier release/i)).toBeNull()
    expect(within(sheet).queryByText(/Matches the catalogue release/)).toBeNull()
  })

  it('renders nothing extra when neither column is filled', () => {
    setFixture({ certs: [cert({})] })
    const sheet = openSheet()
    expect(within(sheet).getByText('Certifications')).toBeInTheDocument()
    expect(within(sheet).queryByText(/^Covers:/)).toBeNull()
    expect(
      within(sheet).queryByText(
        /Matches the catalogue release|earlier release|named hardware platforms/
      )
    ).toBeNull()
  })
})
