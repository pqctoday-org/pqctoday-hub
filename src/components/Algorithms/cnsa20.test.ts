// SPDX-License-Identifier: GPL-3.0-only
import { describe, it, expect } from 'vitest'
import {
  classifyCnsa20,
  isCnsa20Required,
  passesCnsa20Filter,
  jurisdictionStanceForRegion,
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

  it('approves stateful hash-based sigs for firmware only', () => {
    expect(classifyCnsa20(a('LMS-SHA256 (H20/W8)')).status).toBe('approved-limited')
    expect(classifyCnsa20(a('XMSS-SHA2_20')).status).toBe('approved-limited')
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
  it('returns require for BSI/ANSSI and prefer-pure for NIST', () => {
    expect(jurisdictionStanceForRegion('BSI/ANSSI')?.stance).toBe('require')
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
