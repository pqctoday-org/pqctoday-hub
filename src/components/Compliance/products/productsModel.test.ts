// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  buildProductRows,
  coverageOf,
  isPqcCertificate,
  summarizeCoverage,
  summarizeProduct,
} from './productsModel'
import { certsByProduct } from '@/data/certificationXrefData'
import type { CertificationXref } from '@/types/MigrateTypes'

function cert(partial: Partial<CertificationXref>): CertificationXref {
  return {
    productId: 'p1',
    softwareName: 'Product',
    certType: 'ACVP',
    certId: 'A0001',
    certVendor: 'Vendor',
    certProduct: 'Module',
    pqcAlgorithms: '',
    certificationLevel: '',
    status: 'Active',
    certDate: '2026-01-01',
    certLink: '',
    ...partial,
  }
}

describe('isPqcCertificate', () => {
  it('counts a certificate naming PQC algorithms', () => {
    expect(isPqcCertificate(cert({ pqcAlgorithms: 'ML-KEM, ML-DSA' }))).toBe(true)
  })

  it('does not count the scrape’s explicit "none found" phrase as PQC', () => {
    // The scraper writes this for certificates it checked and found nothing in.
    // Treating a non-empty string as PQC would mark every classical module as
    // validated — the exact inversion this guards.
    expect(isPqcCertificate(cert({ pqcAlgorithms: 'No PQC Mechanisms Detected' }))).toBe(false)
  })

  it('does not count an empty field', () => {
    expect(isPqcCertificate(cert({ pqcAlgorithms: '' }))).toBe(false)
  })
})

describe('coverageOf', () => {
  it('is three-state, because one product can hold both kinds at once', () => {
    // Thales Luna and Entrust nShield carry PQC via ACVP while their FIPS 140-3
    // certificate covers classical algorithms only. A boolean would call each
    // of them either validated or unvalidated, and both readings mislead.
    expect(coverageOf(2, 0)).toBe('pqc')
    expect(coverageOf(2, 1)).toBe('mixed')
    expect(coverageOf(0, 3)).toBe('classical')
    expect(coverageOf(0, 0)).toBe('none')
  })
})

describe('summarizeProduct', () => {
  it('counts one certificate once even if it is linked twice', () => {
    // Before the 2026-08-11 id migration the same certificate could appear
    // under two ids and double-count a product's coverage.
    const row = summarizeProduct('p1', 'Product', [
      cert({ certId: 'A1', pqcAlgorithms: 'ML-KEM' }),
      cert({ certId: 'A1', pqcAlgorithms: 'ML-KEM' }),
    ])
    expect(row.certificates).toHaveLength(1)
    expect(row.pqcCount).toBe(1)
  })

  it('aggregates schemes with counts', () => {
    const row = summarizeProduct('p1', 'Product', [
      cert({ certId: 'A1', certType: 'ACVP' }),
      cert({ certId: 'A2', certType: 'ACVP' }),
      cert({ certId: 'F1', certType: 'FIPS 140-3' }),
    ])
    expect(row.schemes).toEqual([
      { scheme: 'ACVP', count: 2 },
      { scheme: 'FIPS 140-3', count: 1 },
    ])
  })

  it('sorts PQC evidence first', () => {
    const row = summarizeProduct('p1', 'Product', [
      cert({ certId: 'C1', pqcAlgorithms: 'No PQC Mechanisms Detected' }),
      cert({ certId: 'P1', pqcAlgorithms: 'ML-DSA' }),
    ])
    expect(row.certificates[0].certId).toBe('P1')
  })

  it('reports mixed coverage rather than picking a side', () => {
    const row = summarizeProduct('p1', 'Product', [
      cert({ certId: 'P1', certType: 'ACVP', pqcAlgorithms: 'ML-KEM' }),
      cert({ certId: 'F1', certType: 'FIPS 140-3', pqcAlgorithms: 'No PQC Mechanisms Detected' }),
    ])
    expect(row.coverage).toBe('mixed')
    expect(row.pqcCount).toBe(1)
    expect(row.classicalCount).toBe(1)
  })
})

describe('buildProductRows against the real catalogue', () => {
  it('produces rows from the shipped cross-reference', () => {
    const rows = buildProductRows(certsByProduct)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((r) => r.certificates.length > 0)).toBe(true)
  })

  it('never reports a product whose certificates are all duplicates of one id', () => {
    for (const row of buildProductRows(certsByProduct)) {
      const ids = row.certificates.map((c) => c.certId)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('lists each product once, though the map stores it under two keys', () => {
    // certsByProduct keys every certificate by BOTH productId and softwareName
    // so legacy rows stay findable. Iterating it naively listed "Alibaba Cloud
    // Crypto" and "Android 16" twice each on screen — caught in a browser, not
    // by the unit tests, which had only asserted uniqueness WITHIN a row.
    const rows = buildProductRows(certsByProduct)
    const names = rows.map((r) => r.softwareName)
    expect(new Set(names).size).toBe(names.length)
  })

  it('restricts to owned products when an inventory is supplied', () => {
    const all = buildProductRows(certsByProduct)
    const one = all[0]
    const owned = buildProductRows(certsByProduct, new Set([one.softwareName]))
    expect(owned.length).toBeGreaterThan(0)
    expect(owned.every((r) => r.softwareName === one.softwareName)).toBe(true)
  })

  it('finds real mixed-coverage products in the shipped data', () => {
    // If this ever returns zero, either the data lost its classical-only
    // certificates or isPqcCertificate stopped recognising the "none" phrase.
    const rows = buildProductRows(certsByProduct)
    const summary = summarizeCoverage(rows)
    expect(summary.products).toBe(rows.length)
    expect(summary.byCoverage.pqc + summary.byCoverage.mixed).toBeGreaterThan(0)
  })
})
