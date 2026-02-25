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

// ── Secure Boot Chain Stages ─────────────────────────────────────────────
export interface BootChainStage {
  stage: number
  title: string
  description: string
  icon: string
  component: string
  verifies: string
}

export const BOOT_CHAIN_STAGES: BootChainStage[] = [
  {
    stage: 1,
    title: 'Platform Root of Trust',
    description:
      'Immutable ROM code or hardware root key (TPM / secure element). Anchors the entire chain — if this is compromised, nothing downstream can be trusted.',
    icon: 'Cpu',
    component: 'Boot ROM / OTP Fuses',
    verifies: 'First-stage bootloader signature',
  },
  {
    stage: 2,
    title: 'Bootloader Verification',
    description:
      'UEFI Secure Boot verifies the bootloader signature against keys stored in firmware. Only signed bootloaders are allowed to execute.',
    icon: 'Shield',
    component: 'UEFI / BIOS Firmware',
    verifies: 'OS kernel and driver signatures',
  },
  {
    stage: 3,
    title: 'OS Kernel & Driver Loading',
    description:
      'Kernel signature verified before execution. Signed drivers loaded into protected memory. Measured boot extends TPM Platform Configuration Registers (PCRs).',
    icon: 'HardDrive',
    component: 'OS Boot Manager',
    verifies: 'Runtime firmware and application signatures',
  },
  {
    stage: 4,
    title: 'Runtime Firmware Verification',
    description:
      'Device firmware (NIC, GPU, BMC, storage controllers) verified before execution. OTA firmware updates require re-verification against the trust chain.',
    icon: 'CircuitBoard',
    component: 'Firmware Update Service',
    verifies: 'Firmware image hash + signature',
  },
]

// ── Firmware Signing Algorithm Comparison ─────────────────────────────────
export type FirmwareSigningAlgorithmId = 'lms' | 'xmss' | 'ml-dsa'

export interface FirmwareSigningAlgorithm {
  id: FirmwareSigningAlgorithmId
  name: string
  fullName: string
  standard: string
  signatureSize: number
  publicKeySize: number
  stateful: boolean
  stateRequirement: string
  cnsa2Status: string
  bestFor: string
  signingSpeed: string
  verificationSpeed: string
}

export const FIRMWARE_SIGNING_ALGORITHMS: FirmwareSigningAlgorithm[] = [
  {
    id: 'lms',
    name: 'LMS / HSS',
    fullName: 'Leighton-Micali Signature / Hierarchical Signature System',
    standard: 'RFC 8554, NIST SP 800-208',
    signatureSize: 2512,
    publicKeySize: 56,
    stateful: true,
    stateRequirement:
      'Monotonic counter in TPM or secure element. Must never be cloned, rolled back, or reset.',
    cnsa2Status: 'Required for NSS firmware/software by 2025 (prefer) / 2030 (mandate)',
    bestFor: 'Firmware signing, secure boot (controlled environments with HSM)',
    signingSpeed: '~0.5 ms',
    verificationSpeed: '~0.1 ms',
  },
  {
    id: 'xmss',
    name: 'XMSS',
    fullName: 'eXtended Merkle Signature Scheme',
    standard: 'RFC 8391, NIST SP 800-208',
    signatureSize: 2500,
    publicKeySize: 68,
    stateful: true,
    stateRequirement:
      'Monotonic counter with forward secrecy. HSM recommended for state persistence.',
    cnsa2Status: 'Accepted alternative to LMS under SP 800-208',
    bestFor: 'Firmware signing where forward secrecy is valued (BSI preference)',
    signingSpeed: '~2 ms',
    verificationSpeed: '~0.3 ms',
  },
  {
    id: 'ml-dsa',
    name: 'ML-DSA-65',
    fullName: 'Module-Lattice Digital Signature Algorithm (Level 3)',
    standard: 'FIPS 204',
    signatureSize: 3309,
    publicKeySize: 1952,
    stateful: false,
    stateRequirement: 'None — fully stateless. No counter, no state management overhead.',
    cnsa2Status: 'Not mandated by CNSA 2.0 for firmware (general-purpose PQC)',
    bestFor: 'General code signing, environments where state management is impractical',
    signingSpeed: '~0.3 ms',
    verificationSpeed: '~0.2 ms',
  },
]

// ── Simulated Firmware Image ─────────────────────────────────────────────
export interface FirmwareImage {
  name: string
  version: string
  target: string
  sizeKB: number
  components: string[]
}

export const MOCK_FIRMWARE_IMAGE: FirmwareImage = {
  name: 'bmc-firmware',
  version: '4.2.1',
  target: 'Baseboard Management Controller (BMC)',
  sizeKB: 16384,
  components: ['bootloader.bin', 'kernel.img', 'device-tree.dtb', 'rootfs.squashfs'],
}
