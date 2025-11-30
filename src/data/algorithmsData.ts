export interface AlgorithmTransition {
  classical: string
  keySize?: string
  pqc: string
  function: 'Encryption/KEM' | 'Signature'
  deprecationDate: string
  standardizationDate: string
}

export const algorithmsData: AlgorithmTransition[] = [
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
    classical: 'ECDH (SecP)',
    keySize: '256-bit',
    pqc: 'ML-KEM-768 (NIST Level 3)',
    function: 'Encryption/KEM',
    deprecationDate: '2030',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'ECDH (SecP)',
    keySize: '384-bit',
    pqc: 'ML-KEM-1024 (NIST Level 5)',
    function: 'Encryption/KEM',
    deprecationDate: '2030+',
    standardizationDate: '2024 (FIPS 203)',
  },
  {
    classical: 'RSA',
    keySize: '2048-bit',
    pqc: 'ML-DSA-44 (NIST Level 2)',
    function: 'Signature',
    deprecationDate: '2030 (Disallowed)',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'ECDSA',
    keySize: 'P-256',
    pqc: 'ML-DSA-44 (NIST Level 2)',
    function: 'Signature',
    deprecationDate: '2030',
    standardizationDate: '2024 (FIPS 204)',
  },
  {
    classical: 'EdDSA',
    keySize: 'Ed25519',
    pqc: 'SLH-DSA (FIPS 205)',
    function: 'Signature',
    deprecationDate: '2030',
    standardizationDate: '2024 (FIPS 205)',
  },
]
