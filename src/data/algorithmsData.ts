export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature'
  deprecationDate: string
  standardizationDate: string
}

export const algorithmsData: AlgorithmTransition[] = [
  // --- Encryption / KEM ---
  {
    classical: 'RSA',
    keySize: '2048-bit',
    pqc: 'ML-KEM-512 (NIST Level 1)',
    function: 'Encryption/KEM',
    deprecationDate: '2030 (Disallowed)',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'RSA',
    keySize: '3072-bit',
    pqc: 'ML-KEM-768 (NIST Level 3)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'RSA',
    keySize: '4096-bit',
    pqc: 'ML-KEM-1024 (NIST Level 5)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'ECDH (P-256)',
    keySize: '256-bit',
    pqc: 'ML-KEM-512 (NIST Level 1)',
    function: 'Encryption/KEM',
    deprecationDate: '2030',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'ECDH (P-384)',
    keySize: '384-bit',
    pqc: 'ML-KEM-768 (NIST Level 3)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'ECDH (P-521)',
    keySize: '521-bit',
    pqc: 'ML-KEM-1024 (NIST Level 5)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'X25519',
    keySize: '256-bit',
    pqc: 'ML-KEM-768 (NIST Level 3)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'X448',
    keySize: '448-bit',
    pqc: 'ML-KEM-1024 (NIST Level 5)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },

  // --- Signatures ---
  {
    classical: 'RSA-PSS',
    keySize: '2048-bit',
    pqc: 'ML-DSA-44 (NIST Level 2)',
    function: 'Signature',
    deprecationDate: '2030 (Disallowed)',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'RSA-PSS',
    keySize: '3072-bit',
    pqc: 'ML-DSA-65 (NIST Level 3)',
    function: 'Signature',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'ECDSA (P-256)',
    keySize: '256-bit',
    pqc: 'ML-DSA-44 (NIST Level 2)',
    function: 'Signature',
    deprecationDate: '2030',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'ECDSA (P-384)',
    keySize: '384-bit',
    pqc: 'ML-DSA-65 (NIST Level 3)',
    function: 'Signature',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'ECDSA (P-521)',
    keySize: '521-bit',
    pqc: 'ML-DSA-87 (NIST Level 5)',
    function: 'Signature',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'Ed25519',
    keySize: '256-bit',
    pqc: 'SLH-DSA-SHA2-128s (Level 1)',
    function: 'Signature',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 205)',
  },
  {
    classical: 'Ed448',
    keySize: '456-bit',
    pqc: 'SLH-DSA-SHA2-192s (Level 3)',
    function: 'Signature',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 205)',
  },
  {
    classical: 'Any (Stateless)',
    keySize: 'N/A',
    pqc: 'SLH-DSA (All Variants)',
    function: 'Signature',
    deprecationDate: 'N/A',
    standardizationDate: '2024 (FIPS 205)',
  },
]
