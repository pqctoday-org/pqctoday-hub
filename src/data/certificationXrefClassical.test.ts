// SPDX-License-Identifier: GPL-3.0-only
/**
 * Classical-only certificates (user ruling 7a, 2026-09-27).
 *
 * The certification cross-reference links products to classical-only
 * certificates too: a FIPS 140-3 module that covers no post-quantum algorithm
 * is still a real certificate, so it counts wherever the question is "does this
 * product hold any certificate", and must NEVER count wherever the question is
 * post-quantum progress. These tests pin that split and make every new reader
 * of the cross-reference declare which question it answers.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { certificationXrefs, isClassicalOnlyCert } from './certificationXrefData'
import { isPqcCertificate } from '../components/Compliance/products/productsModel'
import { buildProductStageTimeline } from '../components/Compliance/fipsStageProgressModel'
import type { SoftwareItem } from '../types/MigrateTypes'
import type { CertificationXref } from '../types/MigrateTypes'

describe('isClassicalOnlyCert', () => {
  it('trusts the matcher flag first', () => {
    expect(isClassicalOnlyCert('no_pqc_cert_classical_only', 'ML-KEM')).toBe(true)
    expect(isClassicalOnlyCert('pqc_cert_present', 'No PQC Mechanisms Detected')).toBe(false)
  })
  it('falls back to the scrape phrase for rows written before the flag', () => {
    expect(isClassicalOnlyCert('', 'No PQC Mechanisms Detected')).toBe(true)
    expect(isClassicalOnlyCert(undefined, 'ML-DSA, ML-KEM')).toBe(false)
  })
})

describe('a classical-only certificate never counts as PQC', () => {
  it('holds for every live cross-reference row', () => {
    const classical = certificationXrefs.filter((c) => c.classicalOnly)
    expect(classical.length).toBeGreaterThan(0)
    for (const c of classical) expect(isPqcCertificate(c), `${c.productId} ${c.certId}`).toBe(false)
  })
  it('holds for a synthetic classical row whatever its algorithm text says', () => {
    const c = {
      productId: 'p',
      softwareName: 'P',
      certType: 'FIPS 140-3',
      certId: '1',
      certVendor: 'V',
      certProduct: 'M',
      pqcAlgorithms: 'No PQC Mechanisms Detected',
      certificationLevel: '',
      status: 'Active',
      certDate: '',
      certLink: '',
      classicalOnly: true,
    } satisfies CertificationXref
    expect(isPqcCertificate(c)).toBe(false)
  })
})

describe('the Windows 11 Common Criteria certificate is never linked to an Azure service', () => {
  // Token overlap reads "Azure Stack HCI" in its name as Azure's (plan §3.5);
  // the matcher pins the exclusion, this pins the published result.
  const win11 = 'cc-microsoft-windows-11--versions-24h2-and-23h2'
  it.each(['azure-key-vault', 'azure-managed-hsm', 'azure-devops', 'azure-aks', 'microsoft-azure'])(
    '%s',
    (pid) => {
      expect(
        certificationXrefs.filter((c) => c.productId === pid && c.certId.startsWith(win11))
      ).toEqual([])
    }
  )
})

/**
 * Every module that reads the cross-reference, and which question it answers.
 * A new reader fails this test until it is added here — and adding it means
 * deciding whether it counts PQC progress (then it must go through
 * isPqcCertificate / isConfirmedPqcAlgorithm) or any certificate at all.
 */
const READERS: Record<string, 'pqc-progress' | 'any-certificate' | 'display'> = {
  'src/components/Compliance/PqcCertificationTrendChart.tsx': 'display',
  'src/components/Compliance/fipsStageProgressModel.ts': 'pqc-progress',
  'src/components/Compliance/products/ProductsTab.tsx': 'display',
  'src/components/Compliance/products/productsModel.ts': 'pqc-progress',
  'src/components/Migrate/Workbench/ProductDetail.tsx': 'display',
  'src/components/Migrate/Workbench/ReplaceTab.tsx': 'any-certificate',
  'src/components/Migrate/cbomExport.ts': 'display',
  'src/components/Mobile/screens/MobileMigrateView.tsx': 'display',
  'src/components/PKILearning/common/ModuleMigrateTab.tsx': 'display',
  'src/data/forceClusterGraph.ts': 'any-certificate',
  'src/data/trustScore/trustScoreData.ts': 'any-certificate',
  'src/utils/dataFingerprint.ts': 'any-certificate',
}

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) walk(p, out)
    else if (/\.(ts|tsx)$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(p)
  }
  return out
}

describe('every reader of the cross-reference is declared', () => {
  const root = process.cwd()
  const readers = walk(path.join(root, 'src'))
    .filter((f) => fs.readFileSync(f, 'utf8').includes('certificationXrefData'))
    .map((f) => path.relative(root, f).split(path.sep).join('/'))
    .filter((f) => f !== 'src/data/certificationXrefData.ts')
    .sort()

  it('no undeclared reader', () => {
    expect(readers.filter((f) => !(f in READERS))).toEqual([])
  })
  it('every pqc-progress reader filters with a PQC predicate', () => {
    for (const [f, kind] of Object.entries(READERS)) {
      if (kind !== 'pqc-progress' || !readers.includes(f)) continue
      const src = fs.readFileSync(path.join(root, f), 'utf8')
      expect(/isPqcCertificate|isConfirmedPqcAlgorithm|classicalOnly/.test(src), f).toBe(true)
    }
  })
})

describe('the FIPS stage chart never counts a classical-only certificate', () => {
  it('a product whose only linked certificate is classical stays at "none"', () => {
    const product = {
      productId: 'p',
      softwareName: 'P',
      pqcCertified: 'yes',
      pqcSupport: 'Yes (ML-KEM)',
    } as unknown as SoftwareItem
    const cert: CertificationXref = {
      productId: 'p',
      softwareName: 'P',
      certType: 'FIPS 140-3',
      certId: '1',
      certVendor: 'V',
      certProduct: 'M',
      pqcAlgorithms: 'ML-KEM', // even if the text were to say PQC …
      certificationLevel: '',
      status: 'Active',
      certDate: '2025-01-01',
      certLink: '',
      classicalOnly: true, // … the flag wins
    }
    const t = buildProductStageTimeline(
      [product],
      new Map([['p', [cert]]]),
      [],
      new Date('2026-09-27')
    )
    const last = t.points[t.points.length - 1]
    expect(last.certified).toBe(0)
  })
})
