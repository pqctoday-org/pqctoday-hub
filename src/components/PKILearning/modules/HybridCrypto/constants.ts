export interface HybridAlgorithmInfo {
  name: string
  type: 'classical' | 'pqc' | 'hybrid'
  category: 'kem' | 'signature'
  opensslAlgorithm: string
  publicKeyBytes: number
  privateKeyBytes: number
  ciphertextOrSigBytes: number
  nistLevel: number | null
  description: string
}

export const HYBRID_ALGORITHMS: HybridAlgorithmInfo[] = [
  // Classical KEMs
  {
    name: 'X25519',
    type: 'classical',
    category: 'kem',
    opensslAlgorithm: 'X25519',
    publicKeyBytes: 32,
    privateKeyBytes: 32,
    ciphertextOrSigBytes: 32,
    nistLevel: null,
    description: 'Curve25519 ECDH — quantum-vulnerable.',
  },
  {
    name: 'ECDH P-256',
    type: 'classical',
    category: 'kem',
    opensslAlgorithm: 'EC',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    ciphertextOrSigBytes: 65,
    nistLevel: null,
    description: 'NIST P-256 ECDH — quantum-vulnerable.',
  },
  // PQC KEMs
  {
    name: 'ML-KEM-768',
    type: 'pqc',
    category: 'kem',
    opensslAlgorithm: 'ML-KEM-768',
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    ciphertextOrSigBytes: 1088,
    nistLevel: 3,
    description: 'FIPS 203 lattice-based KEM. Recommended general-purpose.',
  },
  // Hybrid KEMs
  {
    name: 'X25519MLKEM768',
    type: 'hybrid',
    category: 'kem',
    opensslAlgorithm: 'SIMULATED',
    publicKeyBytes: 1216,
    privateKeyBytes: 2432,
    ciphertextOrSigBytes: 1120,
    nistLevel: 3,
    description: 'X25519 + ML-KEM-768 hybrid. Simulated via separate operations + HKDF.',
  },
  // Classical signatures
  {
    name: 'ECDSA P-256',
    type: 'classical',
    category: 'signature',
    opensslAlgorithm: 'EC',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    ciphertextOrSigBytes: 72,
    nistLevel: null,
    description: 'NIST P-256 ECDSA — quantum-vulnerable.',
  },
  // PQC signatures
  {
    name: 'ML-DSA-65',
    type: 'pqc',
    category: 'signature',
    opensslAlgorithm: 'ML-DSA-65',
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    ciphertextOrSigBytes: 3309,
    nistLevel: 3,
    description: 'FIPS 204 lattice-based signature. Recommended general-purpose.',
  },
]

export const KEY_GEN_COMMANDS: Record<string, string[]> = {
  X25519: ['openssl genpkey -algorithm X25519 -out x25519_key.pem'],
  EC: ['openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out ec_key.pem'],
  'ML-KEM-768': ['openssl genpkey -algorithm ML-KEM-768 -out mlkem768_key.pem'],
  X25519MLKEM768: [
    'openssl genpkey -algorithm X25519 -out x25519_key.pem',
    'openssl genpkey -algorithm ML-KEM-768 -out mlkem768_key.pem',
  ],
  'ML-DSA-65': ['openssl genpkey -algorithm ML-DSA-65 -out mldsa65_key.pem'],
}
