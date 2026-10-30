// SPDX-License-Identifier: AGPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  classifyCnsa20,
  isCnsa20Required,
  passesCnsa20Filter,
  jurisdictionStanceForRegion,
  CNSA20_TIMELINE,
  CNSA20_DONT_DEPLOY_PRE_STANDARD,
  moduleValidationNote,
} from './cnsa20'

const a = (name: string, family = '') => ({ name, family })

describe('classifyCnsa20', () => {
  it('marks ML-KEM-1024 and ML-DSA-87 as required', () => {
    expect(classifyCnsa20(a('ML-KEM-1024')).status).toBe('required')
    expect(classifyCnsa20(a('ML-DSA-87')).status).toBe('required')
    expect(isCnsa20Required(a('ML-KEM-1024'))).toBe(true)
    expect(isCnsa20Required(a('ML-DSA-87'))).toBe(true)
  })

  it('puts lower ML-KEM / ML-DSA parameter sets below the CNSA 2.0 floor', () => {
    expect(classifyCnsa20(a('ML-KEM-512')).status).toBe('below-floor')
    expect(classifyCnsa20(a('ML-KEM-768')).status).toBe('below-floor')
    expect(classifyCnsa20(a('ML-DSA-44')).status).toBe('below-floor')
    expect(classifyCnsa20(a('ML-DSA-65')).status).toBe('below-floor')
    expect(isCnsa20Required(a('ML-KEM-768'))).toBe(false)
  })

  it('excludes SLH-DSA (not selected by CNSA 2.0)', () => {
    expect(classifyCnsa20(a('SLH-DSA-SHA2-128s')).status).toBe('excluded')
    expect(classifyCnsa20(a('SLH-DSA-SHAKE-256f')).status).toBe('excluded')
  })

  it('approves single-tree stateful hash-based sigs (LMS, XMSS)', () => {
    expect(classifyCnsa20(a('LMS-SHA256 (H20/W8)')).status).toBe('approved-limited')
    expect(classifyCnsa20(a('XMSS-SHA2_20')).status).toBe('approved-limited')
    expect(classifyCnsa20(a('LMS_SHA256_M24_H20')).status).toBe('approved-limited')
  })

  it('excludes the multi-tree variants HSS and XMSS^MT (CNSA 2.0 FAQ Ver. 2.2)', () => {
    for (const name of [
      'HSS-LMS-SHA256',
      'HSS (L2, H10/W8)',
      'LMS-HSS-SHA256',
      'XMSS^MT-SHA2_20/2_256',
      'XMSSMT-SHA2_40/4_256',
      'XMSS-MT-SHA2_20',
    ]) {
      const v = classifyCnsa20(a(name))
      expect(v.status, name).toBe('excluded')
      expect(v.label, name).toBe('Not in CNSA 2.0')
    }
  })

  it('treats other PQC families / classical / composites as not-in-suite', () => {
    expect(classifyCnsa20(a('FrodoKEM-640')).status).toBe('not-in-suite')
    expect(classifyCnsa20(a('HQC-256')).status).toBe('not-in-suite')
    expect(classifyCnsa20(a('RSA-2048')).status).toBe('not-in-suite')
    expect(classifyCnsa20(a('FN-DSA-512')).status).toBe('not-in-suite')
  })

  it('marks symmetric/hash CNSA selections as required', () => {
    expect(classifyCnsa20(a('AES-256')).status).toBe('required')
    expect(classifyCnsa20(a('SHA-384')).status).toBe('required')
  })
})

describe('passesCnsa20Filter', () => {
  it('keeps required and firmware-approved rows, drops the rest', () => {
    expect(passesCnsa20Filter(a('ML-KEM-1024'))).toBe(true)
    expect(passesCnsa20Filter(a('ML-DSA-87'))).toBe(true)
    expect(passesCnsa20Filter(a('LMS-SHA256 (H20/W8)'))).toBe(true)
    expect(passesCnsa20Filter(a('ML-KEM-768'))).toBe(false)
    expect(passesCnsa20Filter(a('SLH-DSA-SHA2-128s'))).toBe(false)
    expect(passesCnsa20Filter(a('RSA-2048'))).toBe(false)
  })

  it('works on transition pqc names with parenthetical params', () => {
    expect(passesCnsa20Filter(a('ML-KEM-1024 (NIST Level 5)'))).toBe(true)
    expect(passesCnsa20Filter(a('ML-KEM-512 (NIST Level 1)'))).toBe(false)
  })
})

describe('jurisdictionStanceForRegion', () => {
  it('returns recommend for BSI/ANSSI and prefer-pure for NIST', () => {
    expect(jurisdictionStanceForRegion('BSI/ANSSI')?.stance).toBe('recommend')
    expect(jurisdictionStanceForRegion('NIST')?.stance).toBe('prefer-pure')
    expect(jurisdictionStanceForRegion('IETF')?.stance).toBe('interim')
  })

  it('returns null for unrecorded regions (no invented labels)', () => {
    expect(jurisdictionStanceForRegion('KpqC')).toBeNull()
    expect(jurisdictionStanceForRegion('')).toBeNull()
  })
})

describe('moduleValidationNote', () => {
  it('always returns the validated-module caveat for FIPS-standardized rows', () => {
    const note = moduleValidationNote({ fipsStandard: 'FIPS 203' })
    expect(note).not.toBeNull()
    expect(note?.moduleValidated).toBe(false)
    expect(note?.caveat).toMatch(/FIPS 140-3/)
  })

  it('returns null for non-FIPS rows', () => {
    expect(moduleValidationNote({ fipsStandard: '' })).toBeNull()
    expect(moduleValidationNote({ fipsStandard: 'ISO 18033-2 Amd2' })).toBeNull()
  })
})

// CNSA 2.0 FAQ Ver. 2.2 (Oct 2026): CNSSP 15 dates set the mandate; NSA does
// not describe hybrids as an interim permission, and 2033 is not "final".
describe('CNSA 2.0 timeline and hybrid wording', () => {
  it('lists the CNSSP 15 milestones in date order', () => {
    const years = CNSA20_TIMELINE.map((m) => m.year)
    expect(years).toEqual([...years].sort())
    for (const y of ['2027-01-01', '2030-12-31', '2031-12-31', '2035']) {
      expect(years).toContain(y)
    }
  })

  it('does not call 2033 the final deadline or hybrids an interim permission', () => {
    const text = JSON.stringify(CNSA20_TIMELINE) + CNSA20_DONT_DEPLOY_PRE_STANDARD
    expect(text).not.toMatch(/final CNSA 2\.0 deadline/)
    expect(jurisdictionStanceForRegion('NIST')?.note).not.toMatch(/interim/)
    expect(jurisdictionStanceForRegion('NIST')?.note).toMatch(/specifically identified/)
  })

  it('keeps BSI (recommends hybrid) distinct from ANSSI (requires hybrid)', () => {
    const note = jurisdictionStanceForRegion('BSI/ANSSI')?.note ?? ''
    expect(note).toMatch(/BSI .*recommends PQC in hybrid form, except that hash-based signatures/)
    expect(note).toMatch(/ANSSI .*mandatory/)
  })
})
