// ── Code Signing Algorithm Comparison ───────────────────────────────────────
export interface CodeSigningAlgorithm {
  name: string
  sigBytes: number
  keyBytes: number
  type: 'classical' | 'pqc'
  broken: boolean
}

export const CODE_SIGNING_ALGORITHMS: {
  classical: CodeSigningAlgorithm[]
  pqc: CodeSigningAlgorithm[]
} = {
  classical: [
    { name: 'RSA-2048', sigBytes: 256, keyBytes: 256, type: 'classical', broken: true },
    { name: 'RSA-4096', sigBytes: 512, keyBytes: 512, type: 'classical', broken: true },
    { name: 'ECDSA P-256', sigBytes: 64, keyBytes: 32, type: 'classical', broken: true },
    { name: 'Ed25519', sigBytes: 64, keyBytes: 32, type: 'classical', broken: true },
    { name: 'Ed448', sigBytes: 114, keyBytes: 57, type: 'classical', broken: true },
  ],
  pqc: [
    { name: 'ML-DSA-44', sigBytes: 2420, keyBytes: 1312, type: 'pqc', broken: false },
    { name: 'ML-DSA-65', sigBytes: 3309, keyBytes: 1952, type: 'pqc', broken: false },
    { name: 'ML-DSA-87', sigBytes: 4627, keyBytes: 2592, type: 'pqc', broken: false },
    { name: 'SLH-DSA-SHA2-128s', sigBytes: 7856, keyBytes: 32, type: 'pqc', broken: false },
  ],
}

// ── Package Manager PQC Status ─────────────────────────────────────────────
export interface PackageManager {
  name: string
  sigAlg: string
  pqcStatus: string
  adopted: boolean
}

export const PACKAGE_MANAGERS: PackageManager[] = [
  {
    name: 'RPM (Red Hat)',
    sigAlg: 'RSA/SHA-256',
    pqcStatus: 'ML-DSA-87+Ed448 hybrid (RHEL 10)',
    adopted: true,
  },
  {
    name: 'APK (Alpine)',
    sigAlg: 'RSA-2048',
    pqcStatus: 'No PQC roadmap',
    adopted: false,
  },
  {
    name: 'dpkg (Debian)',
    sigAlg: 'RSA/SHA-256',
    pqcStatus: 'ML-DSA planned (Debian 14)',
    adopted: false,
  },
  {
    name: 'npm',
    sigAlg: 'ECDSA P-256 (Sigstore)',
    pqcStatus: 'Via Sigstore PQC',
    adopted: false,
  },
  {
    name: 'PyPI',
    sigAlg: 'ECDSA P-256 (Sigstore)',
    pqcStatus: 'Via Sigstore PQC',
    adopted: false,
  },
  {
    name: 'Maven Central',
    sigAlg: 'RSA/SHA-256',
    pqcStatus: 'No PQC roadmap',
    adopted: false,
  },
]

// ── Sigstore Keyless Signing Flow ──────────────────────────────────────────
export interface SigstoreStep {
  step: number
  title: string
  description: string
  icon: string
}

export const SIGSTORE_STEPS: SigstoreStep[] = [
  {
    step: 1,
    title: 'Identity Verification',
    description: 'Developer authenticates via OIDC (GitHub, Google, Microsoft)',
    icon: 'User',
  },
  {
    step: 2,
    title: 'Ephemeral Key Generation',
    description: 'Short-lived ML-DSA-65 keypair created (valid ~20 minutes)',
    icon: 'Key',
  },
  {
    step: 3,
    title: 'Certificate Issuance',
    description: 'Fulcio CA issues X.509 cert binding identity to ephemeral public key',
    icon: 'FileCheck',
  },
  {
    step: 4,
    title: 'Artifact Signing',
    description: 'Artifact hash signed with ephemeral private key',
    icon: 'PenLine',
  },
  {
    step: 5,
    title: 'Transparency Log',
    description: 'Signature + cert recorded in Rekor transparency log (immutable append-only)',
    icon: 'Database',
  },
  {
    step: 6,
    title: 'Key Destruction',
    description: 'Ephemeral private key destroyed — no long-term key management needed',
    icon: 'Trash2',
  },
  {
    step: 7,
    title: 'Verification',
    description:
      'Verifier checks Rekor log entry, cert chain, and signature — no keys to distribute',
    icon: 'CheckCircle',
  },
]

// ── RPM Package Signing Simulation Data ────────────────────────────────────
export interface RPMPackage {
  name: string
  version: string
  release: string
  arch: string
  files: string[]
  sizeKB: number
}

export const MOCK_RPM_PACKAGE: RPMPackage = {
  name: 'openssl-libs',
  version: '3.6.0',
  release: '1.el10',
  arch: 'x86_64',
  files: [
    '/usr/lib64/libssl.so.3',
    '/usr/lib64/libcrypto.so.3',
    '/usr/lib64/ossl-modules/legacy.so',
    '/usr/lib64/ossl-modules/fips.so',
  ],
  sizeKB: 4820,
}

export interface SigningMode {
  id: string
  label: string
  algorithm: string
  sigSize: number
  verifyTime: string
  compatible: string
}

export const SIGNING_MODES: SigningMode[] = [
  {
    id: 'classical',
    label: 'Classical (RSA-4096)',
    algorithm: 'RSA-4096 / SHA-256',
    sigSize: 512,
    verifyTime: '~0.3 ms',
    compatible: 'All RPM versions',
  },
  {
    id: 'pqc',
    label: 'PQC (ML-DSA-87)',
    algorithm: 'ML-DSA-87',
    sigSize: 4627,
    verifyTime: '~0.8 ms',
    compatible: 'RHEL 10+ / Fedora 42+',
  },
  {
    id: 'hybrid',
    label: 'Hybrid (ML-DSA-87 + Ed448)',
    algorithm: 'ML-DSA-87 + Ed448 composite',
    sigSize: 4741,
    verifyTime: '~1.1 ms',
    compatible: 'RHEL 10+ (fallback to Ed448)',
  },
]

// ── Certificate Chain Template ─────────────────────────────────────────────
export interface CertTemplate {
  level: 'Root CA' | 'Intermediate CA' | 'Code Signing'
  subject: string
  issuer: string
  algorithm: string
  keySize: number
  sigSize: number
  eku: string
  ekuOid: string
  validity: string
  serialPrefix: string
}

export const CERT_CHAIN_TEMPLATE: CertTemplate[] = [
  {
    level: 'Root CA',
    subject: 'CN=PQC Root CA, O=Example Corp, C=US',
    issuer: 'CN=PQC Root CA, O=Example Corp, C=US',
    algorithm: 'ML-DSA-87',
    keySize: 2592,
    sigSize: 4627,
    eku: 'N/A (Root CA)',
    ekuOid: '',
    validity: '20 years',
    serialPrefix: '01',
  },
  {
    level: 'Intermediate CA',
    subject: 'CN=PQC Code Signing CA, O=Example Corp, C=US',
    issuer: 'CN=PQC Root CA, O=Example Corp, C=US',
    algorithm: 'ML-DSA-65',
    keySize: 1952,
    sigSize: 3309,
    eku: 'N/A (Intermediate CA)',
    ekuOid: '',
    validity: '10 years',
    serialPrefix: '02',
  },
  {
    level: 'Code Signing',
    subject: 'CN=Build Service, O=Example Corp, C=US',
    issuer: 'CN=PQC Code Signing CA, O=Example Corp, C=US',
    algorithm: 'ML-DSA-44',
    keySize: 1312,
    sigSize: 2420,
    eku: 'Code Signing',
    ekuOid: '1.3.6.1.5.5.7.3.3',
    validity: '1 year',
    serialPrefix: '03',
  },
]
