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

    it('does not let a csv "Verified" alone produce Verified', () => {
      for (const vr of ['FIPS_ISSUE', 'NEEDS_REVIEW', 'PENDING', 'UPDATED', '']) {
        expect(deriveVerificationStatus('Verified', 'https://example.com/proof', vr)).not.toBe(
          'Verified'
        )
      }
      expect(deriveVerificationStatus('Verified', '', 'VALIDATED')).toBe('Pending Verification')
    })

    it('keeps a withheld row withheld, VALIDATED_NO_PQC included', () => {
      for (const vr of ['VALIDATED', 'VALIDATED_NO_PQC', 'FIPS_VERIFIED', '']) {
        expect(
          deriveVerificationStatus('Unverified — needs review', 'https://example.com/proof', vr)
        ).toBe('Needs Review')
      }
    })

    it('every loaded Verified row carries a confirming validation result', () => {
      for (const item of softwareData.filter((i) => i.verificationStatus === 'Verified')) {
        expect(['VALIDATED', 'FIPS_VERIFIED', 'CORRECTED']).toContain(
          (item.validationResult || '').toUpperCase()
        )
      }
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

describe('duplicate successors (migrate remediation r2)', () => {
  it("folds a deprecated duplicate's name into the kept product's formerNames", () => {
    const kept = softwareData.find((i) => i.productId === 'mbed-tls')
    expect(kept?.formerNames).toContain('mbedTLS')
  })
})
