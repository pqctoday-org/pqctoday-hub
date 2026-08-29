// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VendorConcentrationRiskPanel } from './VendorConcentrationRiskPanel'

// Two vendors, three GA products — Acme supplies 2 of 3 (67%, over the 40%
// severity threshold), HQ'd in different countries (50% concentration). One
// GA product has no FIPS validation (33% cert gap, over the 30% threshold).
//
// vi.mock factories are hoisted above the whole file, so every field below
// is a plain literal rather than built via a shared helper referencing an
// outer const (referencing one throws "Cannot access before initialization").
// Only the SoftwareItem/Vendor fields this panel actually reads are filled
// in with real values; the rest are present only so the mock object shape
// satisfies the real interfaces structurally.
vi.mock('@/data/migrateData', () => ({
  softwareData: [
    {
      productId: 'p1',
      softwareName: 'Acme TLS',
      categoryId: 'c',
      categoryName: '',
      infrastructureLayer: '',
      cisaCategory: '',
      pqcSupport: '',
      pqcStatusCanonical: 'available',
      pqcCapabilityDescription: '',
      licenseType: '',
      license: '',
      latestVersion: '',
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
      vendorId: 'v-acme',
    },
    {
      productId: 'p2',
      softwareName: 'Acme VPN',
      categoryId: 'c',
      categoryName: '',
      infrastructureLayer: '',
      cisaCategory: '',
      pqcSupport: '',
      pqcStatusCanonical: 'available',
      pqcCapabilityDescription: '',
      licenseType: '',
      license: '',
      latestVersion: '',
      releaseDate: '',
      fipsValidated: 'No',
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
      vendorId: 'v-acme',
    },
    {
      productId: 'p3',
      softwareName: 'Other HSM',
      categoryId: 'c',
      categoryName: '',
      infrastructureLayer: '',
      cisaCategory: '',
      pqcSupport: '',
      pqcStatusCanonical: 'available',
      pqcCapabilityDescription: '',
      licenseType: '',
      license: '',
      latestVersion: '',
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
      vendorId: 'v-other',
    },
  ],
  vendorMap: new Map([
    [
      'v-acme',
      {
        vendorId: 'v-acme',
        vendorName: 'Acme Crypto',
        vendorDisplayName: 'Acme Crypto',
        website: '',
        vendorType: '',
        entityCategory: 'Commercial Vendor',
        hqCountry: 'United States',
        pqcCommitment: 'Active',
        lastVerifiedDate: '',
        productCount: 2,
      },
    ],
    [
      'v-other',
      {
        vendorId: 'v-other',
        vendorName: 'Other Corp',
        vendorDisplayName: 'Other Corp',
        website: '',
        vendorType: '',
        entityCategory: 'Commercial Vendor',
        hqCountry: 'Germany',
        pqcCommitment: 'Active',
        lastVerifiedDate: '',
        productCount: 1,
      },
    ],
  ]),
}))

vi.mock('@/data/migrationAssets', () => ({
  REPLACE_ASSETS: [
    { id: 'tls', label: 'TLS key exchange' },
    { id: 'vpn', label: 'IKEv2 VPN' },
  ],
}))

vi.mock('./workbenchCatalog', () => ({
  // Single-source domain: 'tls' has exactly one GA product; 'vpn' has none.
  productsForDomain: (id: string) =>
    id === 'tls'
      ? [
          {
            productId: 'p1',
            pqcStatusCanonical: 'available',
            pqcSupport: '',
          },
        ]
      : [],
}))

describe('VendorConcentrationRiskPanel', () => {
  it('renders all four risk categories', () => {
    render(<VendorConcentrationRiskPanel />)
    expect(screen.getByText('Single-source domains')).toBeInTheDocument()
    expect(screen.getByText('Vendor concentration')).toBeInTheDocument()
    expect(screen.getByText('Certification gap')).toBeInTheDocument()
    expect(screen.getByText('Geographic concentration')).toBeInTheDocument()
  })

  it('flags the single-source domain by name', () => {
    render(<VendorConcentrationRiskPanel />)
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByText(/TLS key exchange/)).toBeInTheDocument()
  })

  it('computes vendor concentration from real GA product counts', () => {
    render(<VendorConcentrationRiskPanel />)
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(
      screen.getByText(/Acme Crypto supplies 2 of the 3 GA-ready catalog products/)
    ).toBeInTheDocument()
  })

  it('computes the certification gap from missing FIPS validation', () => {
    render(<VendorConcentrationRiskPanel />)
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('computes geographic concentration from vendor HQ country', () => {
    render(<VendorConcentrationRiskPanel />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})
