// SPDX-License-Identifier: AGPL-3.0-only
/**
 * The NIST entropy source validation (ESV) records in the shipped snapshot carry only what
 * the NIST certificate page states: a certificate number that matches its NIST address, the
 * status "Validated" (NIST publishes no lifecycle status for entropy certificates), no PQC or
 * module fields, no hardware/software verdict, and no vendor contact details.
 */
import fs from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

interface Rec {
  id: string
  type: string
  source: string
  status: string
  date: string
  link: string
  pqcCoverage: unknown
  productName: string
  productCategory: string
  vendor: string
  lab?: string
  esvFirstValidated?: string
  esvDetailsFetchedAt?: string
  esvListObservedAt?: string
  esvValidationHistory?: Array<{ date: string; lab: string }>
  esvEntropyClaims?: Array<Record<string, unknown>>
  additionalDocuments?: Array<{ name: string; url: string }>
  entropyCertificates?: string[]
  entropyCertificatesSource?: {
    policyUrl: string
    policySha256?: string
    table: string
    page: number
  }
  [k: string]: unknown
}

const records: Rec[] = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'public/data/compliance-data.json'), 'utf-8')
)
const esv = records.filter((r) => r.type === 'ESV')

const ALLOWED = new Set([
  'id',
  'source',
  'type',
  'status',
  'date',
  'link',
  'pqcCoverage',
  'productName',
  'productCategory',
  'vendor',
  'lab',
  'esvStandard',
  'esvVersion',
  'esvDescription',
  'esvNoiseSourceClassification',
  'esvReuseStatus',
  'esvEntropyClaims',
  'esvFirstValidated',
  'esvValidationHistory',
  'esvDetailsFetchedAt',
  'esvListObservedAt',
  'additionalDocuments',
])
const CLAIM_KEYS = new Set([
  'bitsOfEntropyPerOutput',
  'outputSizeBits',
  'entropyPerSample',
  'sampleSize',
  'statedAs',
  'operatingEnvironments',
  'conditioningComponents',
])
const NIST_ESV =
  'https://csrc.nist.gov/projects/cryptographic-module-validation-program/entropy-validations/certificate/'

describe('entropy source validation records in the shipped snapshot', () => {
  it('has them, with unique E-numbers', () => {
    expect(esv.length).toBeGreaterThan(300)
    expect(new Set(esv.map((r) => r.id)).size).toBe(esv.length)
    for (const r of esv) expect(r.id).toMatch(/^E\d+$/)
  })

  it('no ESV id collides with another record type', () => {
    const others = new Set(records.filter((r) => r.type !== 'ESV').map((r) => String(r.id)))
    expect(esv.filter((r) => others.has(r.id))).toEqual([])
  })

  it('links every record to its own NIST certificate page', () => {
    for (const r of esv) expect(r.link).toBe(`${NIST_ESV}${r.id.slice(1)}`)
  })

  it('uses the NIST source, the Entropy Source category and the status NIST implies', () => {
    for (const r of esv) {
      expect(r.source).toBe('NIST')
      expect(r.productCategory).toBe('Entropy Source')
      expect(r.status).toBe('Validated')
      expect(r.productName.trim()).not.toBe('')
      expect(r.vendor.trim()).not.toBe('')
      expect(r.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('carries no PQC, module or algorithm-list fields', () => {
    for (const r of esv) {
      expect(r.pqcCoverage).toBe('')
      expect(Object.keys(r).filter((k) => !ALLOWED.has(k))).toEqual([])
      for (const forbidden of ['classicalAlgorithms', 'embodiment', 'moduleType', 'cmvpStandard']) {
        expect(r).not.toHaveProperty(forbidden)
      }
    }
  })

  it('dates each record by its latest validation and keeps the history, oldest first', () => {
    for (const r of esv.filter((x) => x.esvDetailsFetchedAt)) {
      const h = r.esvValidationHistory ?? []
      expect(h.length).toBeGreaterThan(0)
      expect(h.map((x) => x.date)).toEqual([...h.map((x) => x.date)].sort())
      expect(r.date).toBe(h[h.length - 1].date)
      expect(r.lab).toBe(h[h.length - 1].lab)
      expect(r.esvFirstValidated).toBe(h[0].date)
    }
  })

  it('reads every certificate page, or says it could not', () => {
    for (const r of esv) {
      expect(Boolean(r.esvDetailsFetchedAt) !== Boolean(r.esvListObservedAt)).toBe(true)
    }
  })

  it('keeps entropy claims to the labels NIST uses, with CAVP links on NIST hosts', () => {
    for (const r of esv) {
      for (const claim of r.esvEntropyClaims ?? []) {
        expect(Object.keys(claim).filter((k) => !CLAIM_KEYS.has(k))).toEqual([])
        const comps = (claim.conditioningComponents ?? []) as Array<{ url?: string }>
        for (const c of comps) if (c.url) expect(c.url).toMatch(/^https:\/\/csrc\.nist\.gov\//)
      }
    }
  })

  it('links only the NIST-hosted Public Use Document, and copies no vendor contact details', () => {
    for (const r of esv) {
      for (const d of r.additionalDocuments ?? []) {
        expect(d.name).toBe('Public Use Document')
        expect(d.url).toMatch(/^https:\/\/csrc\.nist\.gov\/CSRC\/media\//)
      }
    }
    const text = JSON.stringify(esv)
    expect(text).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.-]+/) // e-mail addresses
    expect(text).not.toMatch(/email protected|cfemail/i)
  })

  it('never states whether a source is hardware or software (NIST does not)', () => {
    for (const r of esv) {
      expect(r).not.toHaveProperty('esvEmbodiment')
      expect(r).not.toHaveProperty('esvHardware')
      expect(['Physical', 'Non-Physical', undefined]).toContain(r.esvNoiseSourceClassification)
    }
  })

  it('includes the five certificates the Library used to carry by hand', () => {
    const byId = new Map(esv.map((r) => [r.id, r]))
    expect(byId.get('E321')?.productName).toBe('BoringCrypto Jitter Entropy')
    expect(byId.get('E335')?.productName).toBe('wolfEntropy')
    expect(byId.get('E266')?.productName).toBe('Jentropy Engine')
    expect(byId.get('E232')?.productName).toMatch(/^Fortanix DRNG RDSEED/)
    expect(byId.get('E233')?.productName).toMatch(/^Fortanix DRNG RDSEED/)
  })
})

describe('entropy certificates named by FIPS 140-3 modules in the shipped snapshot', () => {
  const linked = records.filter((r) => r.entropyCertificates !== undefined)
  const esvIds = new Set(esv.map((r) => r.id))

  it('exist, and only on FIPS 140-3 module records (never on algorithm or other records)', () => {
    expect(linked.length).toBeGreaterThan(0)
    for (const r of linked) expect(r.type).toBe('FIPS 140-3')
    expect(records.filter((r) => r.type === 'ACVP' && r.entropyCertificates !== undefined)).toEqual(
      []
    )
  })

  it('are E-numbers of ESV records in the snapshot, without repeats', () => {
    for (const r of linked) {
      expect(r.entropyCertificates!.length).toBeGreaterThan(0)
      expect(new Set(r.entropyCertificates).size).toBe(r.entropyCertificates!.length)
      for (const id of r.entropyCertificates!) {
        expect(id).toMatch(/^E\d+$/)
        expect(esvIds.has(id)).toBe(true)
      }
    }
  })

  it('say where they were read: the own NIST-hosted Security Policy of the module, table and PDF page', () => {
    for (const r of linked) {
      const src = r.entropyCertificatesSource
      expect(src).toBeDefined()
      expect(src!.policyUrl).toBe(
        `https://csrc.nist.gov/CSRC/media/projects/cryptographic-module-validation-program/documents/security-policies/140sp${r.id}.pdf`
      )
      expect(src!.table).toMatch(/^Table \d+: Entropy Certificates$/)
      expect(Number.isInteger(src!.page) && src!.page > 0).toBe(true)
      expect(src!.policySha256).toMatch(/^[0-9a-f]{64}$/)
    }
  })

  it('carry the two fields together or not at all', () => {
    for (const r of records) {
      expect(r.entropyCertificates === undefined).toBe(r.entropyCertificatesSource === undefined)
    }
  })

  it('link the Fortanix modules to the certificates the Library used to carry by hand', () => {
    const fortanix = records.find((r) => r.type === 'FIPS 140-3' && r.id === '5555')
    expect(fortanix?.entropyCertificates).toEqual(['E232', 'E233'])
  })
})
