// SPDX-License-Identifier: AGPL-3.0-only
/* eslint-disable security/detect-non-literal-fs-filename */
import fs from 'node:fs'
import path from 'node:path'
import Papa from 'papaparse'
import { describe, expect, it } from 'vitest'
import { MODULE_CATALOG } from '@/components/PKILearning/moduleData'
import { DATA_FILENAMES } from './generated/dataFilenames.generated'
import {
  SECURITY_TARGET_SCOPE_EXAMPLES,
  type SecurityTargetCategory,
} from '@/components/PKILearning/modules/CcEuccCertification/data/securityTargetScopeExamples'

interface ProductCatalogRow {
  product_id: string
  software_name: string
  category_id: string
  category_name: string
  pqc_support: string
  pqc_certified: string
  has_certification: string
  pqc_status_canonical: string
  pqc_capability_description: string
  fips_validated: string
  learning_modules: string
  verification_status: string
  evidence_flags: string
  correction_notes: string
  status: string
}

interface CertificationXrefRow {
  software_name: string
  product_id: string
  cert_type: string
  cert_id: string
  cert_vendor: string
  cert_product: string
  pqc_algorithms: string
  certification_level: string
  status: string
  cert_link: string
}

const repoRoot = path.resolve(__dirname, '../..')
const productCsvPath = path.resolve(repoRoot, 'src/data', DATA_FILENAMES.migrate ?? '')
const certXrefCsvPath = path.resolve(repoRoot, 'src/data', DATA_FILENAMES.certificationXref ?? '')

function loadCsv<T>(filePath: string): T[] {
  const raw = fs.readFileSync(filePath, 'utf-8')
  const parsed = Papa.parse<T>(raw, { header: true, skipEmptyLines: true })
  return parsed.data
}

describe('Module-Consumed Product Scope & Security Target Audit (v4.213.0)', () => {
  const products = loadCsv<ProductCatalogRow>(productCsvPath)
  const certXrefs = loadCsv<CertificationXrefRow>(certXrefCsvPath)
  const activeProducts = products.filter((p) => p.status !== 'deprecated')

  const moduleLinkedProducts = activeProducts.filter(
    (p) => (p.learning_modules ?? '').trim().length > 0
  )

  const xrefsByProductId = new Map<string, CertificationXrefRow[]>()
  for (const row of certXrefs) {
    const pid = (row.product_id ?? '').trim()
    if (!pid) continue
    const list = xrefsByProductId.get(pid) ?? []
    list.push(row)
    xrefsByProductId.set(pid, list)
  }

  it('links active product catalog rows to valid Learn module IDs in MODULE_CATALOG', () => {
    expect(moduleLinkedProducts.length).toBeGreaterThan(250)
    const catalogIds = new Set(Object.keys(MODULE_CATALOG))

    for (const product of moduleLinkedProducts) {
      const moduleIds = product.learning_modules
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
      expect(
        moduleIds.length,
        `Product ${product.product_id} has empty parsed learning_modules`
      ).toBeGreaterThan(0)
      for (const mid of moduleIds) {
        expect(
          catalogIds.has(mid),
          `Product ${product.product_id} references unknown module_id "${mid}"`
        ).toBe(true)
      }
    }
  })

  it('verifies every module-consumed product row has non-empty product name, category, PQC support status, and explicit validation/scope boundary', () => {
    for (const product of moduleLinkedProducts) {
      expect(
        product.software_name?.trim().length,
        `Missing software_name on ${product.product_id}`
      ).toBeGreaterThan(0)
      expect(
        product.category_name?.trim().length,
        `Missing category_name on ${product.product_id}`
      ).toBeGreaterThan(0)
      expect(
        (product.pqc_support?.trim() || product.pqc_status_canonical?.trim() || '').length,
        `Missing PQC support status on ${product.product_id}`
      ).toBeGreaterThan(0)
      expect(
        (
          product.fips_validated?.trim() ||
          product.pqc_certified?.trim() ||
          product.has_certification?.trim() ||
          ''
        ).length,
        `Missing validation/certification boundary on ${product.product_id}`
      ).toBeGreaterThan(0)

      // Check FIPS / PQC certification scope boundary:
      // Every product must have an explicit certification/scope boundary across
      // `fips_validated`, `pqc_certified`, `has_certification`, `evidence_flags`,
      // `correction_notes`, or `migrate_certification_xref`.
      // Specifically, if `pqc_certified === 'yes'`, it must have at least one certification
      // xref row OR an explicit scope qualifier in `fips_validated` / `correction_notes`.
      const fipsText = product.fips_validated.trim()
      const xrefs = xrefsByProductId.get(product.product_id) ?? []
      const hasScopeBoundary =
        xrefs.length > 0 ||
        product.pqc_certified === 'none' ||
        product.pqc_certified === 'cavp' ||
        Boolean(product.evidence_flags?.trim()) ||
        Boolean(product.correction_notes?.trim()) ||
        /#\d+|CMVP|CAVP|FIPS|via\b|separate|underlying|classical|Level\s+\d|module|provider|BoringCrypto|OpenSSL|wolfCrypt|No\b|Claimed/i.test(
          fipsText
        )
      expect(
        hasScopeBoundary,
        `Missing certification/scope boundary on ${product.product_id}: fips="${fipsText}", pqc_certified="${product.pqc_certified}"`
      ).toBe(true)

      if (product.pqc_certified === 'yes') {
        expect(
          xrefs.length > 0 || /#\d+|CMVP|CAVP/i.test(fipsText),
          `pqc_certified="yes" on ${product.product_id} without certification xref or CMVP/CAVP number`
        ).toBe(true)
      }
    }
  })

  it('verifies all active certification cross-references consumed by module-linked products have valid cert_type, cert_id, and authoritative URLs', () => {
    const linkedProductIds = new Set(moduleLinkedProducts.map((p) => p.product_id))
    const activeLinkedXrefs = certXrefs.filter(
      (x) => linkedProductIds.has(x.product_id) && x.status !== 'deprecated'
    )
    expect(activeLinkedXrefs.length).toBeGreaterThan(50)

    for (const xref of activeLinkedXrefs) {
      expect(
        xref.cert_type?.trim().length,
        `Missing cert_type on ${xref.product_id}`
      ).toBeGreaterThan(0)
      expect(xref.cert_id?.trim().length, `Missing cert_id on ${xref.product_id}`).toBeGreaterThan(
        0
      )
      expect(
        xref.cert_link?.trim().startsWith('http'),
        `Invalid cert_link on ${xref.product_id} (${xref.cert_id})`
      ).toBe(true)
    }
  })

  it('verifies all 12 Security Target scope examples cover smart cards, HSMs, network encryptors, and OS/TPM targets with complete fields', () => {
    expect(SECURITY_TARGET_SCOPE_EXAMPLES).toHaveLength(12)

    const seenIds = new Set<string>()
    const categoryCounts: Record<SecurityTargetCategory, number> = {
      'smart-card': 0,
      hsm: 0,
      'network-encryptor': 0,
      'os-tpm': 0,
    }

    for (const ex of SECURITY_TARGET_SCOPE_EXAMPLES) {
      expect(seenIds.has(ex.id), `Duplicate ST example id: ${ex.id}`).toBe(false)
      seenIds.add(ex.id)
      categoryCounts[ex.category] += 1

      expect(ex.product.trim().length).toBeGreaterThan(5)
      expect(ex.stVersion.trim().length).toBeGreaterThan(3)
      expect(ex.source.startsWith('https://')).toBe(true)
      expect(ex.pages.trim().length).toBeGreaterThan(0)
      expect(ex.claim.trim().length).toBeGreaterThan(15)
      expect(['supported', 'not-supported', 'not-established']).toContain(ex.verdict)
      expect(ex.supportedClaim.trim().length).toBeGreaterThan(20)
      expect(ex.contradictedClaim.trim().length).toBeGreaterThan(20)
      expect(ex.explanation.trim().length).toBeGreaterThan(20)
      expect(ex.auditorTakeaway.trim().length).toBeGreaterThan(20)
    }

    expect(categoryCounts['smart-card']).toBeGreaterThanOrEqual(2)
    expect(categoryCounts.hsm).toBeGreaterThanOrEqual(2)
    expect(categoryCounts['network-encryptor']).toBeGreaterThanOrEqual(2)
    expect(categoryCounts['os-tpm']).toBeGreaterThanOrEqual(2)
  })
})
