export interface LMSParameterSet {
  id: string
  name: string
  treeHeight: number
  winternitzParam: number
  signatureSize: number
  publicKeySize: number
  privateKeySize: number
  maxSignatures: number
  securityLevel: string
  hashFunction: string
  variant?: 'single-tree' | 'multi-tree'
}

export interface XMSSParameterSet {
  id: string
  name: string
  treeHeight: number
  signatureSize: number
  publicKeySize: number
  privateKeySize: number
  maxSignatures: number
  securityLevel: string
  hashFunction: string
  variant: 'single-tree' | 'multi-tree'
}

export interface UseCaseRecommendation {
  id: string
  useCase: string
  description: string
  recommendedScheme: 'LMS' | 'XMSS' | 'HSS' | 'XMSS^MT'
  recommendedParams: string
  rationale: string
  maxSignaturesNeeded: string
  stateStorageRequirement: string
}

export interface TreeNode {
  level: number
  index: number
  label: string
  isLeaf: boolean
  isHighlighted: boolean
  isAuthPath: boolean
}

export const LMS_PARAMETER_SETS: LMSParameterSet[] = [
  {
    id: 'lms-h5-w1',
    name: 'LMS_SHA256_M32_H5 / W1',
    treeHeight: 5,
    winternitzParam: 1,
    signatureSize: 8688,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h5-w2',
    name: 'LMS_SHA256_M32_H5 / W2',
    treeHeight: 5,
    winternitzParam: 2,
    signatureSize: 4464,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h5-w4',
    name: 'LMS_SHA256_M32_H5 / W4',
    treeHeight: 5,
    winternitzParam: 4,
    signatureSize: 2352,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h5-w8',
    name: 'LMS_SHA256_M32_H5 / W8',
    treeHeight: 5,
    winternitzParam: 8,
    signatureSize: 1296,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h10-w2',
    name: 'LMS_SHA256_M32_H10 / W2',
    treeHeight: 10,
    winternitzParam: 2,
    signatureSize: 4624,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h10-w4',
    name: 'LMS_SHA256_M32_H10 / W4',
    treeHeight: 10,
    winternitzParam: 4,
    signatureSize: 2512,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h10-w8',
    name: 'LMS_SHA256_M32_H10 / W8',
    treeHeight: 10,
    winternitzParam: 8,
    signatureSize: 1456,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h15-w2',
    name: 'LMS_SHA256_M32_H15 / W2',
    treeHeight: 15,
    winternitzParam: 2,
    signatureSize: 4784,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32768,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h15-w4',
    name: 'LMS_SHA256_M32_H15 / W4',
    treeHeight: 15,
    winternitzParam: 4,
    signatureSize: 2672,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 32768,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h20-w2',
    name: 'LMS_SHA256_M32_H20 / W2',
    treeHeight: 20,
    winternitzParam: 2,
    signatureSize: 4944,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h20-w4',
    name: 'LMS_SHA256_M32_H20 / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 2832,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h25-w1',
    name: 'LMS_SHA256_M32_H25 / W1',
    treeHeight: 25,
    winternitzParam: 1,
    signatureSize: 9328,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h25-w2',
    name: 'LMS_SHA256_M32_H25 / W2',
    treeHeight: 25,
    winternitzParam: 2,
    signatureSize: 5104,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'lms-h25-w4',
    name: 'LMS_SHA256_M32_H25 / W4',
    treeHeight: 25,
    winternitzParam: 4,
    signatureSize: 2992,
    publicKeySize: 56,
    privateKeySize: 64,
    maxSignatures: 33554432,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
  },
  {
    id: 'hss-l2-h20-w4',
    name: 'HSS-L2 (H10x2) / W4',
    treeHeight: 20,
    winternitzParam: 4,
    signatureSize: 5084,
    publicKeySize: 60,
    privateKeySize: 128,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
  {
    id: 'hss-l2-h20-w8',
    name: 'HSS-L2 (H10x2) / W8',
    treeHeight: 20,
    winternitzParam: 8,
    signatureSize: 2972,
    publicKeySize: 60,
    privateKeySize: 128,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
]

export const XMSS_PARAMETER_SETS: XMSSParameterSet[] = [
  {
    id: 'xmss-sha2-10',
    name: 'XMSS-SHA2_10_256',
    treeHeight: 10,
    signatureSize: 2500,
    publicKeySize: 68,
    privateKeySize: 1373,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-sha2-16',
    name: 'XMSS-SHA2_16_256',
    treeHeight: 16,
    signatureSize: 2692,
    publicKeySize: 68,
    privateKeySize: 2093,
    maxSignatures: 65536,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-sha2-20',
    name: 'XMSS-SHA2_20_256',
    treeHeight: 20,
    signatureSize: 2820,
    publicKeySize: 68,
    privateKeySize: 2573,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake-10',
    name: 'XMSS-SHAKE_10_256',
    treeHeight: 10,
    signatureSize: 2500,
    publicKeySize: 68,
    privateKeySize: 1373,
    maxSignatures: 1024,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHAKE-128',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake-16',
    name: 'XMSS-SHAKE_16_256',
    treeHeight: 16,
    signatureSize: 2692,
    publicKeySize: 68,
    privateKeySize: 2093,
    maxSignatures: 65536,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHAKE-128',
    variant: 'single-tree',
  },
  {
    id: 'xmss-shake-20',
    name: 'XMSS-SHAKE_20_256',
    treeHeight: 20,
    signatureSize: 2820,
    publicKeySize: 68,
    privateKeySize: 2573,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHAKE-128',
    variant: 'single-tree',
  },
  {
    id: 'xmssmt-sha2-20-2',
    name: 'XMSS^MT-SHA2_20/2_256',
    treeHeight: 20,
    signatureSize: 4963,
    publicKeySize: 68,
    privateKeySize: 5998,
    maxSignatures: 1048576,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
  {
    id: 'xmssmt-sha2-40-4',
    name: 'XMSS^MT-SHA2_40/4_256',
    treeHeight: 40,
    signatureSize: 9893,
    publicKeySize: 68,
    privateKeySize: 12718,
    maxSignatures: 1099511627776,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
  {
    id: 'xmssmt-sha2-60-6',
    name: 'XMSS^MT-SHA2_60/6_256',
    treeHeight: 60,
    signatureSize: 14824,
    publicKeySize: 68,
    privateKeySize: 19438,
    maxSignatures: 1152921504606846976,
    securityLevel: 'NIST Level 1',
    hashFunction: 'SHA-256',
    variant: 'multi-tree',
  },
]

export const USE_CASE_RECOMMENDATIONS: UseCaseRecommendation[] = [
  {
    id: 'firmware-signing',
    useCase: 'Firmware Signing',
    description: 'Signing firmware images for embedded devices, IoT, and automotive ECUs.',
    recommendedScheme: 'LMS',
    recommendedParams: 'LMS H20/W4 or HSS (2-level, H10/W4)',
    rationale:
      'Firmware updates are infrequent. LMS simplicity suits resource-constrained devices. HSS extends capacity via hierarchy.',
    maxSignaturesNeeded: '~10,000 over device lifetime',
    stateStorageRequirement: 'Secure non-volatile storage (TPM, secure element)',
  },
  {
    id: 'code-signing',
    useCase: 'Code Signing',
    description: 'Signing software releases, packages, and build artifacts.',
    recommendedScheme: 'XMSS',
    recommendedParams: 'XMSS-SHA2_20_256 or XMSS^MT-SHA2_20/2_256',
    rationale:
      'Higher signing volume than firmware. XMSS multi-tree variant provides larger key space. Better state recovery mechanisms.',
    maxSignaturesNeeded: '~100,000 over key lifetime',
    stateStorageRequirement: 'HSM or secure key management system with atomic state updates',
  },
  {
    id: 'secure-boot',
    useCase: 'Secure Boot',
    description: 'Verifying boot chain integrity from ROM to OS kernel.',
    recommendedScheme: 'LMS',
    recommendedParams: 'LMS H10/W8 (small signatures)',
    rationale:
      'Verification speed is critical. Large W parameter (W=8) trades signing speed for compact signatures. Very few signatures needed.',
    maxSignaturesNeeded: '~100 (rarely re-signed)',
    stateStorageRequirement: 'OTP fuses or write-protected flash',
  },
  {
    id: 'document-signing',
    useCase: 'Document Signing',
    description: 'Long-lived digital signatures on legal, financial, or regulatory documents.',
    recommendedScheme: 'XMSS^MT',
    recommendedParams: 'XMSS^MT-SHA2_40/4_256',
    rationale:
      'Multi-tree structure provides massive signing capacity. Long-term security from hash-based assumptions. Suitable for PKI-integrated workflows.',
    maxSignaturesNeeded: '~1,000,000+ over organizational lifetime',
    stateStorageRequirement: 'Enterprise HSM with transactional state management',
  },
  {
    id: 'timestamping',
    useCase: 'Timestamping Authority',
    description: 'RFC 3161 timestamping services for non-repudiation.',
    recommendedScheme: 'XMSS^MT',
    recommendedParams: 'XMSS^MT-SHA2_60/6_256',
    rationale:
      'Highest signing volume requirement. 60-level tree provides effectively unlimited signatures. State management is paramount.',
    maxSignaturesNeeded: '~10,000,000+ per year',
    stateStorageRequirement:
      'Clustered HSMs with replicated, atomic state updates and audit logging',
  },
]

export const WORKSHOP_DISPLAY_PARAMS = {
  lms: [
    'lms-h5-w8',
    'lms-h10-w4',
    'lms-h15-w2',
    'lms-h20-w4',
    'hss-l2-h20-w4',
    'hss-l2-h20-w8',
  ] as const,
  xmss: ['xmss-sha2-10', 'xmss-sha2-16', 'xmss-sha2-20'] as const,
}

export function formatSignatureCount(count: number): string {
  if (count >= 1_000_000_000_000) {
    return `${(count / 1_000_000_000_000).toFixed(0)}T`
  }
  if (count >= 1_000_000_000) {
    return `${(count / 1_000_000_000).toFixed(0)}B`
  }
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1)}M`
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(0)}K`
  }
  return count.toString()
}

export function formatBytes(bytes: number): string {
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`
  }
  return `${bytes} B`
}
