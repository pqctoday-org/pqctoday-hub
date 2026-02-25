// ── JOSE Algorithm Data ─────────────────────────────────────────────────────

export interface JOSEAlgorithm {
  name: string
  jose: string
  type: 'classical' | 'pqc'
  category: 'signing' | 'keyAgreement'
  keyBytes: number
  sigBytes?: number
  ctBytes?: number
  broken: boolean
  nistLevel?: number
}

export const JOSE_SIGNING_ALGORITHMS: JOSEAlgorithm[] = [
  {
    name: 'RS256',
    jose: 'RS256',
    type: 'classical',
    category: 'signing',
    keyBytes: 256,
    sigBytes: 256,
    broken: true,
  },
  {
    name: 'ES256',
    jose: 'ES256',
    type: 'classical',
    category: 'signing',
    keyBytes: 32,
    sigBytes: 64,
    broken: true,
  },
  {
    name: 'EdDSA (Ed25519)',
    jose: 'EdDSA',
    type: 'classical',
    category: 'signing',
    keyBytes: 32,
    sigBytes: 64,
    broken: true,
  },
  {
    name: 'ML-DSA-44',
    jose: 'ML-DSA-44',
    type: 'pqc',
    category: 'signing',
    keyBytes: 1312,
    sigBytes: 2420,
    broken: false,
    nistLevel: 2,
  },
  {
    name: 'ML-DSA-65',
    jose: 'ML-DSA-65',
    type: 'pqc',
    category: 'signing',
    keyBytes: 1952,
    sigBytes: 3309,
    broken: false,
    nistLevel: 3,
  },
  {
    name: 'ML-DSA-87',
    jose: 'ML-DSA-87',
    type: 'pqc',
    category: 'signing',
    keyBytes: 2592,
    sigBytes: 4627,
    broken: false,
    nistLevel: 5,
  },
  {
    name: 'SLH-DSA-SHA2-128s',
    jose: 'SLH-DSA-SHA2-128s',
    type: 'pqc',
    category: 'signing',
    keyBytes: 32,
    sigBytes: 7856,
    broken: false,
    nistLevel: 1,
  },
]

export const JOSE_KEY_AGREEMENT_ALGORITHMS: JOSEAlgorithm[] = [
  {
    name: 'ECDH-ES (P-256)',
    jose: 'ECDH-ES',
    type: 'classical',
    category: 'keyAgreement',
    keyBytes: 65,
    ctBytes: 0,
    broken: true,
  },
  {
    name: 'ML-KEM-768',
    jose: 'ML-KEM-768',
    type: 'pqc',
    category: 'keyAgreement',
    keyBytes: 1184,
    ctBytes: 1088,
    broken: false,
    nistLevel: 3,
  },
  {
    name: 'ML-KEM-1024',
    jose: 'ML-KEM-1024',
    type: 'pqc',
    category: 'keyAgreement',
    keyBytes: 1568,
    ctBytes: 1568,
    broken: false,
    nistLevel: 5,
  },
]

// ── Sample JWT Payload ──────────────────────────────────────────────────────

export const SAMPLE_JWT_PAYLOAD: Record<string, unknown> = {
  sub: '1234567890',
  name: 'Alice Engineer',
  iat: 1735689600,
  exp: 1735776000,
  iss: 'https://auth.example.com',
  aud: 'https://api.example.com',
  roles: ['developer', 'admin'],
}

// ── Sample JWTs ─────────────────────────────────────────────────────────────

export const SAMPLE_JWTS: Record<string, string> = {
  ES256:
    'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIEVuZ2luZWVyIiwiaWF0IjoxNzM1Njg5NjAwLCJleHAiOjE3MzU3NzYwMDAsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwicm9sZXMiOlsiZGV2ZWxvcGVyIiwiYWRtaW4iXX0.MEUCIQDKZokqnCjrRtw0tni8BHPtBrGJ3WEZVaRAwJk8tJbOzAIgK2DZ8f3sCGPBHH-5qUY-NfQaJ7x',
  'ML-DSA-65':
    'eyJhbGciOiJNTC1EU0EtNjUiLCJ0eXAiOiJKV1QifQ.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsaWNlIEVuZ2luZWVyIiwiaWF0IjoxNzM1Njg5NjAwLCJleHAiOjE3MzU3NzYwMDAsImlzcyI6Imh0dHBzOi8vYXV0aC5leGFtcGxlLmNvbSIsImF1ZCI6Imh0dHBzOi8vYXBpLmV4YW1wbGUuY29tIiwicm9sZXMiOlsiZGV2ZWxvcGVyIiwiYWRtaW4iXX0.' +
    'A'.repeat(4412),
}

// ── JOSE Header comparison data ─────────────────────────────────────────────

export interface JOSEHeaderComparison {
  field: string
  classical: string
  pqc: string
  notes: string
}

export const JOSE_HEADER_COMPARISONS: JOSEHeaderComparison[] = [
  {
    field: 'alg',
    classical: 'ES256',
    pqc: 'ML-DSA-65',
    notes: 'Algorithm identifier changes to PQC equivalent',
  },
  {
    field: 'typ',
    classical: 'JWT',
    pqc: 'JWT',
    notes: 'Token type remains unchanged',
  },
  {
    field: 'kid',
    classical: 'ec-key-2024',
    pqc: 'ml-dsa-key-2025',
    notes: 'Key ID references the PQC key',
  },
]

// ── Quantum vulnerability data ──────────────────────────────────────────────

export interface VulnerabilityEntry {
  algorithm: string
  jose: string
  type: string
  attack: string
  broken: boolean
  notes: string
}

export const VULNERABILITY_TABLE: VulnerabilityEntry[] = [
  {
    algorithm: 'RS256 (RSA-2048)',
    jose: 'RS256',
    type: 'Signing',
    attack: "Shor's algorithm",
    broken: true,
    notes: 'RSA factoring broken in polynomial time',
  },
  {
    algorithm: 'ES256 (ECDSA P-256)',
    jose: 'ES256',
    type: 'Signing',
    attack: "Shor's algorithm",
    broken: true,
    notes: 'Elliptic curve discrete log broken',
  },
  {
    algorithm: 'EdDSA (Ed25519)',
    jose: 'EdDSA',
    type: 'Signing',
    attack: "Shor's algorithm",
    broken: true,
    notes: 'Same ECDLP vulnerability as ECDSA',
  },
  {
    algorithm: 'ECDH-ES (P-256)',
    jose: 'ECDH-ES',
    type: 'Key Agreement',
    attack: "Shor's algorithm",
    broken: true,
    notes: 'ECDH key agreement broken',
  },
  {
    algorithm: 'ML-DSA-65',
    jose: 'ML-DSA-65',
    type: 'Signing',
    attack: 'None known',
    broken: false,
    notes: 'NIST Level 3, lattice-based (FIPS 204)',
  },
  {
    algorithm: 'ML-KEM-768',
    jose: 'ML-KEM-768',
    type: 'Key Agreement',
    attack: 'None known',
    broken: false,
    notes: 'NIST Level 3, lattice-based (FIPS 203)',
  },
]

// ── OAuth 2.0 / OIDC migration data ────────────────────────────────────────

export interface OAuthMigrationItem {
  component: string
  description: string
  impact: string
  priority: 'high' | 'medium' | 'low'
}

export const OAUTH_MIGRATION_ITEMS: OAuthMigrationItem[] = [
  {
    component: 'Access Tokens (JWS)',
    description: 'Bearer tokens signed by the authorization server',
    impact:
      'ML-DSA-65 signatures increase token size from ~800 bytes to ~5 KB. May exceed default HTTP header limits.',
    priority: 'high',
  },
  {
    component: 'ID Tokens (JWS)',
    description: 'OpenID Connect identity assertions',
    impact:
      'Same size increase as access tokens. Frontend libraries must handle larger tokens in cookies/localStorage.',
    priority: 'high',
  },
  {
    component: 'DPoP Proofs (JWS)',
    description: 'Proof of possession for sender-constrained tokens (RFC 9449)',
    impact:
      'Each API request includes a DPoP proof JWT. PQC signatures add ~4 KB per request overhead.',
    priority: 'medium',
  },
  {
    component: 'JWKS Endpoints',
    description: 'JSON Web Key Sets published by the authorization server',
    impact:
      'ML-DSA public keys are ~2 KB each (vs 32 bytes for EC). JWKS payloads grow significantly with key rotation.',
    priority: 'medium',
  },
  {
    component: 'Client Authentication',
    description: 'private_key_jwt and client_secret_jwt flows',
    impact:
      'Client assertion JWTs grow with PQC. Server-side validation must support ML-DSA verification.',
    priority: 'low',
  },
  {
    component: 'Token Introspection',
    description: 'Server-side token validation (RFC 7662)',
    impact:
      'Larger tokens increase network overhead. Consider opaque tokens with introspection as an alternative.',
    priority: 'low',
  },
]
