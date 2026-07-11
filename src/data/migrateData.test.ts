import { describe, it, expect } from 'vitest'
import { deriveVerificationStatus, softwareData } from './migrateData'

describe('migrateData', () => {
  it('loads without error', () => {
    expect(softwareData.length).toBeGreaterThan(0)
  })

  it('produces expected typescript shape', () => {
    for (const item of softwareData) {
      expect(typeof item).toBe('object')
      expect(item).not.toBeNull()
    }
  })

  it('has required non-empty fields', () => {
    for (const item of softwareData) {
      expect(item.softwareName).toBeTruthy()
    }
  })

  it('has unique primary keys or combination keys', () => {
    const ids = softwareData.map((item) => item.softwareName)
    const validIds = ids.filter((id) => id)
    const uniqueIds = new Set(validIds)
    if (validIds.length > 0) {
      expect(uniqueIds.size).toBe(validIds.length)
    }
  })

  describe('deriveVerificationStatus — VALIDATED_NO_PQC honesty', () => {
    it('never presents a VALIDATED_NO_PQC row as plain Verified, even via the manual override', () => {
      expect(
        deriveVerificationStatus('Verified', 'https://example.com/proof', 'VALIDATED_NO_PQC')
      ).toBe('Verified (No PQC)')
    })

    it('sends VALIDATED_NO_PQC without an archived proof to Pending Verification', () => {
      expect(deriveVerificationStatus('Verified', '', 'VALIDATED_NO_PQC')).toBe(
        'Pending Verification'
      )
    })

    it('keeps the manual override for genuinely validated rows', () => {
      expect(deriveVerificationStatus('Verified', 'https://example.com/proof', 'VALIDATED')).toBe(
        'Verified'
      )
      expect(
        deriveVerificationStatus('Needs Verification', 'https://example.com/proof', 'CORRECTED')
      ).toBe('Verified')
    })

    it('no loaded catalog row with VALIDATED_NO_PQC carries a plain Verified status', () => {
      const noPqcRows = softwareData.filter((i) => i.validationResult === 'VALIDATED_NO_PQC')
      expect(noPqcRows.length).toBeGreaterThan(0)
      for (const item of noPqcRows) {
        expect(item.verificationStatus).not.toBe('Verified')
      }
      // The distinct status actually materializes in the loaded data
      expect(noPqcRows.some((i) => i.verificationStatus === 'Verified (No PQC)')).toBe(true)
    })
  })
})
