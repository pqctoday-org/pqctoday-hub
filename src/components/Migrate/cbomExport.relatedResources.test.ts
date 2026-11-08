// SPDX-License-Identifier: AGPL-3.0-only
import { afterEach, describe, expect, it } from 'vitest'
import { softwareItemToCbomInput, buildCycloneDxCbom } from './cbomExport'
import { certsByProduct } from '@/data/certificationXrefData'
import { purlByProduct, relatedResourceByProduct } from '@/data/purlXrefData'
import { buildRelatedResource } from '@/data/relatedResources'
import type { CertificationXref, PurlXref, SoftwareItem } from '@/types/MigrateTypes'

// Fixture product and rows: the shipped files may or may not carry the new columns yet.
const ID = 'zz-cbom-related'

const ITEM: SoftwareItem = {
  productId: ID,
  softwareName: 'ZZ CBOM Related',
  categoryId: 'c',
  categoryName: 'Hardware Security Module',
  infrastructureLayer: 'Hardware',
  cisaCategory: '',
  pqcSupport: 'Yes (ML-KEM)',
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
}

function cert(over: Partial<CertificationXref> = {}): CertificationXref {
  return {
    productId: ID,
    softwareName: ITEM.softwareName,
    certType: 'FIPS 140-3',
    certId: '5266',
    certVendor: 'Vendor',
    certProduct: 'Module',
    pqcAlgorithms: 'ML-KEM',
    certificationLevel: 'FIPS 140-3 L1',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: 'https://example.com/5266',
    classicalOnly: false,
    ...over,
  }
}

afterEach(() => {
  relatedResourceByProduct.delete(ID)
  purlByProduct.delete(ID)
  certsByProduct.delete(ID)
})

type Ref = { type: string; url: string; comment?: string }

function exported() {
  const doc = JSON.parse(buildCycloneDxCbom([ITEM]).json) as {
    components: Array<{
      name: string
      purl?: string
      externalReferences?: Ref[]
      properties?: Array<{ name: string; value: string }>
    }>
  }
  return doc.components.find((c) => c.name === ITEM.softwareName)!
}

describe('CBOM export of a related resource', () => {
  it('writes a source repository as a vcs external reference and never as the purl', () => {
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://github.com/Intel/tdx', 'source_repository')!
    )
    const c = exported()
    expect(c.externalReferences).toEqual([
      { type: 'vcs', url: 'https://github.com/Intel/tdx', comment: 'Source repository' },
    ])
    expect(c.purl).toBeUndefined()
    expect(JSON.stringify(c.properties)).not.toContain('pkg:github')
  })

  it.each([
    ['sdk', 'other', 'SDK'],
    ['test_suite', 'other', 'Test suite'],
    ['documentation', 'documentation', 'Documentation'],
    ['issue_tracker', 'issue-tracker', 'Issue tracker'],
  ])('writes %s as %s with the comment "%s"', (kind, type, comment) => {
    relatedResourceByProduct.set(ID, buildRelatedResource('https://example.com/x', kind)!)
    expect(exported().externalReferences).toEqual([{ type, url: 'https://example.com/x', comment }])
  })

  it('keeps the real package identifier as the purl and the related resource beside it', () => {
    const matched: PurlXref = {
      productId: ID,
      softwareName: ITEM.softwareName,
      purl: 'pkg:npm/zz-cbom-related',
      purlType: 'npm',
      purlNamespace: '',
      purlName: 'zz-cbom-related',
      matchConfidence: 'exact',
      status: 'matched',
      registryUrl: 'https://www.npmjs.com/package/zz-cbom-related',
      lastVerifiedDate: '',
    }
    purlByProduct.set(ID, matched)
    relatedResourceByProduct.set(
      ID,
      buildRelatedResource('https://example.com/tests', 'test_suite')!
    )
    const c = exported()
    expect(c.purl).toBe('pkg:npm/zz-cbom-related')
    expect(c.externalReferences?.map((r) => r.url)).toEqual(['https://example.com/tests'])
  })

  it('puts the related resource before the certificate reports without dropping them', () => {
    relatedResourceByProduct.set(ID, buildRelatedResource('https://example.com/x', 'sdk')!)
    certsByProduct.set(ID, [cert()])
    const refs = exported().externalReferences!
    expect(refs.map((r) => r.type)).toEqual(['other', 'certification-report'])
  })

  it('adds no external reference without a related resource', () => {
    expect(exported().externalReferences).toBeUndefined()
  })
})

describe('CBOM export of certificate coverage', () => {
  function certificateReferences(): Array<Record<string, string>> {
    const prop = exported().properties!.find((p) => p.name === 'pqctoday:certificateReferences')!
    return JSON.parse(prop.value)
  }

  it('carries what the certificate covers and how it relates to the catalogue release', () => {
    certsByProduct.set(ID, [
      cert({ certCovers: 'MX series, Junos OS 22.3R1', certRelationship: 'earlier_release' }),
    ])
    expect(certificateReferences()).toEqual([
      {
        certType: 'FIPS 140-3',
        certId: '5266',
        certLink: 'https://example.com/5266',
        covers: 'MX series, Junos OS 22.3R1',
        relationship: 'earlier_release',
      },
    ])
  })

  it('leaves both out when the file records neither', () => {
    certsByProduct.set(ID, [cert()])
    const [ref] = certificateReferences()
    expect('covers' in ref).toBe(false)
    expect('relationship' in ref).toBe(false)
  })

  it('also carries them in the certificate record', () => {
    certsByProduct.set(ID, [
      cert({ certCovers: 'Module X', certRelationship: 'module_of_product' }),
    ])
    const prop = exported().properties!.find((p) => p.name === 'pqctoday:certificateAssociations')!
    const records = JSON.parse(prop.value).records as CertificationXref[]
    expect(records[0].certCovers).toBe('Module X')
    expect(records[0].certRelationship).toBe('module_of_product')
  })
})

describe('softwareItemToCbomInput', () => {
  it('has no externalReferences key when nothing is related', () => {
    expect('externalReferences' in softwareItemToCbomInput(ITEM)).toBe(false)
  })
})
