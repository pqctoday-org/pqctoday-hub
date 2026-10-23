import { describe, it, expect } from 'vitest'
import { loadLatestCSV } from './csvUtils'
import {
  getHsmFacts,
  hsmCapabilityFacts,
  hsmFactsByProduct,
  hsmVocabularyViolations,
  parseHsmCapabilityRow,
} from './hsmCapabilityXrefData'

const rawFiles = import.meta.glob('./migrate_hsm_capability_xref_*.csv', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const row = {
  product_id: 'entrust-nshield',
  software_name: 'Entrust nShield',
  algorithm: 'ML-DSA',
  available: 'yes',
  pkcs11_mechanism: 'standard',
  mechanism_name: 'CKM_ML_DSA',
  cavp_cert: 'A7285',
  approved_mode: 'yes',
  cmvp_cert_lists_it: 'no',
  cmvp_cert: '1234',
  verified_on: '2026-10-22',
  source_url: 'https://example.invalid/doc',
  note: '',
  verification_status: 'Pending Verification',
  status: 'active',
}

describe('parseHsmCapabilityRow', () => {
  it('maps a complete row to camelCase fields', () => {
    expect(parseHsmCapabilityRow(row)).toEqual({
      productId: 'entrust-nshield',
      softwareName: 'Entrust nShield',
      algorithm: 'ML-DSA',
      available: 'yes',
      pkcs11Mechanism: 'standard',
      mechanismName: 'CKM_ML_DSA',
      cavpCert: 'A7285',
      approvedMode: 'yes',
      cmvpCertListsIt: 'no',
      cmvpCert: '1234',
      verifiedOn: '2026-10-22',
      sourceUrl: 'https://example.invalid/doc',
      note: '',
      verificationStatus: 'Pending Verification',
    })
  })

  it('turns a value outside the vocabulary into unknown instead of passing it through', () => {
    const fact = parseHsmCapabilityRow({
      ...row,
      available: 'GA soon',
      pkcs11_mechanism: 'proprietary',
      approved_mode: 'maybe',
      cmvp_cert_lists_it: '',
    })
    expect(fact?.available).toBe('unknown')
    expect(fact?.pkcs11Mechanism).toBe('unknown')
    expect(fact?.approvedMode).toBe('unknown')
    expect(fact?.cmvpCertListsIt).toBe('unknown')
  })

  it('keeps "no ML-KEM command documented" distinct from unknown', () => {
    const fact = parseHsmCapabilityRow({
      ...row,
      algorithm: 'ML-KEM',
      available: 'no',
      pkcs11_mechanism: 'none',
    })
    expect(fact?.available).toBe('no')
    expect(fact?.pkcs11Mechanism).toBe('none')
  })

  it('reads a blank CAVP certificate as unknown, never as none', () => {
    expect(parseHsmCapabilityRow({ ...row, cavp_cert: '' })?.cavpCert).toBe('unknown')
    expect(parseHsmCapabilityRow({ ...row, cavp_cert: 'none' })?.cavpCert).toBe('none')
  })

  it('defaults an empty verification status to Pending Verification', () => {
    expect(parseHsmCapabilityRow({ ...row, verification_status: '' })?.verificationStatus).toBe(
      'Pending Verification'
    )
  })

  it('drops deprecated rows, rows without a product, and algorithms outside the five families', () => {
    expect(parseHsmCapabilityRow({ ...row, status: 'deprecated' })).toBeNull()
    expect(parseHsmCapabilityRow({ ...row, product_id: '' })).toBeNull()
    expect(parseHsmCapabilityRow({ ...row, algorithm: 'RSA' })).toBeNull()
  })
})

describe('loaded HSM capability facts', () => {
  it('every fact names its source and the day it was read', () => {
    for (const f of hsmCapabilityFacts) {
      expect(f.sourceUrl).toMatch(/^https?:\/\//)
      expect(f.verifiedOn).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it('has one fact per product and algorithm', () => {
    const keys = hsmCapabilityFacts.map((f) => `${f.productId}|${f.algorithm}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('looks facts up by product and by algorithm, and returns [] for an unknown product', () => {
    expect(getHsmFacts('no-such-product')).toEqual([])
    for (const [productId, list] of hsmFactsByProduct) {
      expect(getHsmFacts(productId)).toEqual(list)
      for (const f of list) expect(getHsmFacts(productId, f.algorithm)).toContain(f)
    }
  })
})

describe('raw HSM capability data', () => {
  const rows = loadLatestCSV<Record<string, string>, Record<string, string>>(
    rawFiles,
    /xref_(\d{2})(\d{2})(\d{4})(?:_r(\d+))?\.csv$/,
    (r) => r
  ).data

  it('only uses the closed vocabulary, so a typo is caught instead of downgraded to unknown', () => {
    const problems = rows
      .map((r) => ({ id: `${r.product_id}|${r.algorithm}`, bad: hsmVocabularyViolations(r) }))
      .filter((r) => r.bad.length > 0)
    expect(problems).toEqual([])
  })

  it('flags an out-of-vocabulary value', () => {
    expect(hsmVocabularyViolations({ ...row, available: 'soon' })).toEqual(['available'])
    expect(hsmVocabularyViolations({ ...row, algorithm: 'RSA' })).toEqual(['algorithm'])
    expect(hsmVocabularyViolations(row)).toEqual([])
  })

  it('every row is Pending Verification or Verified, never blank', () => {
    for (const r of rows)
      expect(['Pending Verification', 'Verified']).toContain(r.verification_status)
  })
})
