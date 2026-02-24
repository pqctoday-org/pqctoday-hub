// Shared algorithm definitions for Workshop Step 3 (KeyGenWorkshop) and Step 4 (SignatureDemo).
// Keeping them in one place ensures the same labels, values, and groupings appear in both steps.

export const CLASSICAL_SIG_ALGOS = [
  {
    value: 'Ed25519',
    label: 'Ed25519',
    cmd: 'openssl genpkey -algorithm ED25519 -out private.key',
  },
  {
    value: 'EC-P256',
    label: 'ECDSA P-256',
    cmd: 'openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.key',
  },
] as const

export const PQC_SIG_ALGOS = [
  {
    value: 'ML-DSA-44',
    label: 'ML-DSA-44 (FIPS 204)',
    cmd: 'openssl genpkey -algorithm ML-DSA-44 -out private.key',
  },
  {
    value: 'ML-DSA-65',
    label: 'ML-DSA-65 (FIPS 204)',
    cmd: 'openssl genpkey -algorithm ML-DSA-65 -out private.key',
  },
  {
    value: 'ML-DSA-87',
    label: 'ML-DSA-87 (FIPS 204)',
    cmd: 'openssl genpkey -algorithm ML-DSA-87 -out private.key',
  },
  {
    value: 'SLH-DSA-SHA2-128s',
    label: 'SLH-DSA-SHA2-128s (FIPS 205)',
    cmd: 'openssl genpkey -algorithm SLH-DSA-SHA2-128s -out private.key',
  },
] as const
