import { describe, it, expect, vi } from 'vitest'
import { libraryData } from './libraryData'

// Mock the CSV content
vi.mock('./library_*.csv', () => {
  return {
    './library_12092025.csv': `reference_id,document_title,download_url,initial_publication_date,last_update_date,document_status,short_description,document_type,applicable_industries,authors_or_organization,dependencies,region_scope,AlgorithmFamily,SecurityLevels,ProtocolOrToolImpact,ToolchainSupport,MigrationUrgency,change_status,manual_category
FIPS 203,Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM),,,,,,,Algorithm,,,,,,,,,,
FIPS 204,Module-Lattice-Based Digital Signature Standard (ML-DSA),,,,,,,Algorithm,,,,,,,,,,
NIST SP 800-227,Recommendations for Key-Encapsulation Mechanisms,,,,,,,Compliance/Guidance,,FIPS 203,,,,,,,,KEM
RFC 9858,LMS Algorithm Identifiers for Alternative Hash Functions,,,,,,,Algorithm,,,,,,,,,New,Digital Signature
`,
  }
})

describe('libraryData', () => {
  it('should load data', () => {
    expect(libraryData).toBeDefined()
    expect(libraryData.length).toBeGreaterThan(0)
  })

  it('should have tree structure', () => {
    // FIPS 203 is a root.
    // NIST SP 800-227 depends on FIPS 203.

    const fips203 = libraryData.find((i) => i.referenceId === 'FIPS 203')
    expect(fips203).toBeDefined()

    const sp800227 = fips203?.children?.find((c) => c.referenceId === 'NIST SP 800-227')
    expect(sp800227).toBeDefined()
    expect(sp800227?.referenceId).toBe('NIST SP 800-227')
  })

  it('should categorize items', () => {
    // FIPS 203 -> KEM (Title based)
    const fips203 = libraryData.find((i) => i.referenceId === 'FIPS 203')
    expect(fips203?.category).toBe('KEM')

    // FIPS 204 -> Digital Signature (Title based)
    const fips204 = libraryData.find((i) => i.referenceId === 'FIPS 204')
    expect(fips204?.category).toBe('Digital Signature')
  })

  it('should prioritize manual_category', () => {
    // NIST SP 800-227 has manual_category 'KEM'
    // Without it, Title "Recommendations for..." might not hit KEM or hit Guidance logic (if it existed)
    const sp800227 = libraryData.find((i) => i.referenceId === 'NIST SP 800-227')
    expect(sp800227?.category).toBe('KEM')

    // RFC 9858 has manual_category 'Digital Signature'
    // Without it, Title "LMS Algorithm Identifiers..." and Type "Algorithm"
    // (Logic: title.includes('signature') || ...) "LMS..." does not include signature
    // So it might have failed auto-detection.
    const rfc9858 = libraryData.find((i) => i.referenceId === 'RFC 9858')
    expect(rfc9858?.category).toBe('Digital Signature')
  })
})
