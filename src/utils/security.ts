/**
 * Determines the NIST Security Level (1, 3, or 5) based on the filename.
 * Used for displaying security badges in the UI.
 *
 * Mappings:
 * Level 1 (AES-128 equivalent):
 * - ML-KEM-512, Kyber512
 * - ML-DSA-44, Dilithium2
 * - Falcon-512
 * - SLH-DSA-*-128*
 * - FrodoKEM-640
 * - HQC-128
 *
 * Level 3 (AES-192 equivalent):
 * - ML-KEM-768, Kyber768
 * - ML-DSA-65, Dilithium3
 * - SLH-DSA-*-192*
 * - FrodoKEM-976
 * - HQC-192
 *
 * Level 5 (AES-256 equivalent):
 * - ML-KEM-1024, Kyber1024
 * - ML-DSA-87, Dilithium5
 * - Falcon-1024
 * - SLH-DSA-*-256*
 * - FrodoKEM-1344
 * - HQC-256
 */
export const getSecurityLevel = (filename: string): 1 | 3 | 5 | null => {
  const lowerName = filename.toLowerCase()

  // Level 5
  if (
    lowerName.includes('1024') ||
    lowerName.includes('1344') ||
    lowerName.includes('ml-dsa-87') ||
    lowerName.includes('mldsa-87') ||
    lowerName.includes('dilithium5') ||
    lowerName.includes('hqc-256') ||
    ((lowerName.includes('slh-dsa') || lowerName.includes('slhdsa')) &&
      lowerName.includes('256')) ||
    (lowerName.includes('sphincs') && lowerName.includes('256'))
  ) {
    return 5
  }

  // Level 3
  if (
    lowerName.includes('768') ||
    lowerName.includes('976') ||
    lowerName.includes('ml-dsa-65') ||
    lowerName.includes('mldsa-65') ||
    lowerName.includes('dilithium3') ||
    lowerName.includes('hqc-192') ||
    ((lowerName.includes('slh-dsa') || lowerName.includes('slhdsa')) &&
      lowerName.includes('192')) ||
    (lowerName.includes('sphincs') && lowerName.includes('192'))
  ) {
    return 3
  }

  // Level 1
  if (
    lowerName.includes('512') ||
    lowerName.includes('640') ||
    lowerName.includes('ml-dsa-44') ||
    lowerName.includes('mldsa-44') ||
    lowerName.includes('dilithium2') ||
    lowerName.includes('hqc-128') ||
    ((lowerName.includes('slh-dsa') || lowerName.includes('slhdsa')) &&
      lowerName.includes('128')) ||
    (lowerName.includes('sphincs') && lowerName.includes('128'))
  ) {
    return 1
  }

  return null
}
