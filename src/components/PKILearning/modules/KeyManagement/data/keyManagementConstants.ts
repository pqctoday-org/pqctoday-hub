export interface KeyLifecycleStage {
  id: string
  name: string
  description: string
  nistReference: string
  classicalApproach: string
  pqcImpact: string
  icon: string
}

export interface PKCS11Mechanism {
  id: string
  name: string
  type: 'classical' | 'pqc'
  mechanismCode: string
  description: string
  keySize: string
}

export interface KeySizeComparison {
  algorithm: string
  type: 'classical' | 'pqc'
  publicKeyBytes: number
  privateKeyBytes: number
  signatureOrCiphertextBytes: number
  nistLevel: string
  quantumSafe: boolean
}

export interface RotationPolicy {
  id: string
  name: string
  description: string
  rotationInterval: string
  applicableTo: string[]
  complianceFramework: string
}

export const KEY_LIFECYCLE_STAGES: KeyLifecycleStage[] = [
  {
    id: 'generation',
    name: 'Generation',
    description:
      'Cryptographic keys are created using approved random number generators (DRBG) within a secure environment, typically an HSM. Key generation must use sufficient entropy and comply with algorithm-specific parameter requirements.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.1',
    classicalApproach:
      'RSA: Generate two large primes (p, q), compute n = p*q, derive public/private exponents. ECDSA: Select random scalar k on chosen curve. Fast generation, small keys.',
    pqcImpact:
      'ML-KEM: Generate matrix A from seed, sample secret vectors. ML-DSA: Generate matrix A, secret vectors s1/s2. Generation is fast but produces significantly larger keys (1,184 bytes for ML-KEM-768 public key vs 256 bytes for RSA-2048).',
    icon: 'key-round',
  },
  {
    id: 'distribution',
    name: 'Distribution',
    description:
      'Public keys are distributed to communicating parties via certificates, key servers, or direct exchange. Private keys may be distributed to authorized backup systems. Secure channels and authentication are required.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.2',
    classicalApproach:
      'X.509 certificates carry RSA/ECDSA public keys. Certificate sizes are small (1-2 KB). Distribution via CAs, LDAP, or key servers is well-established.',
    pqcImpact:
      'PQC certificates are significantly larger: ML-DSA-65 certificates ~4.5 KB vs ~1.5 KB for ECDSA. This impacts bandwidth, handshake sizes (TLS), and storage in certificate chains. Hybrid certificates (classical + PQC) are even larger.',
    icon: 'send',
  },
  {
    id: 'storage',
    name: 'Storage',
    description:
      'Keys must be stored securely with appropriate access controls. Private keys should be protected by HSMs or encrypted key stores. Key metadata (algorithm, expiration, usage constraints) must be maintained.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.3',
    classicalApproach:
      'RSA-2048 private key: 1,192 bytes. ECDSA P-256 private key: 32 bytes. Easily fits in HSM key slots, PKCS#12 files, and key management databases.',
    pqcImpact:
      'ML-KEM-768 private key: 2,400 bytes. ML-DSA-65 private key: 4,032 bytes. HSM storage capacity may need expansion. Key databases and backup systems must handle 3-10x larger keys. PKCS#12 files grow substantially with hybrid key pairs.',
    icon: 'database',
  },
  {
    id: 'usage',
    name: 'Usage',
    description:
      'Keys are used for their designated cryptographic operations: encryption, signing, key agreement, or authentication. Usage must comply with key type restrictions and algorithm specifications.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.4',
    classicalApproach:
      'RSA keys can encrypt, sign, and wrap. ECDSA signs only. ECDH performs key agreement. Operations are fast and well-understood. One key type often serves multiple purposes.',
    pqcImpact:
      'PQC enforces stricter separation: ML-KEM is KEM-only (no direct encryption), ML-DSA is signature-only. No single PQC algorithm replaces all RSA capabilities. Organizations need separate key pairs for key establishment vs. signing.',
    icon: 'lock',
  },
  {
    id: 'rotation',
    name: 'Rotation',
    description:
      'Keys are periodically replaced to limit exposure from potential compromise. Rotation involves generating new keys, re-encrypting or re-signing with new keys, and securely transitioning from old to new keys.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.5',
    classicalApproach:
      'Automated rotation every 1-3 years for most use cases. Certificate renewal via ACME or manual CSR. Re-encryption of stored data is fast with small keys.',
    pqcImpact:
      'PQC rotation requires more bandwidth (larger keys and certificates), more HSM operations, and longer re-encryption windows. Hybrid deployments require rotating both classical and PQC key pairs. Rotation schedules may need adjustment for the larger computational overhead.',
    icon: 'refresh-cw',
  },
  {
    id: 'archival',
    name: 'Archival',
    description:
      'Expired or retired keys are preserved for verifying old signatures or decrypting archived data. Archived keys must remain accessible but protected. Retention periods depend on data sensitivity and regulatory requirements.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.6',
    classicalApproach:
      'Archive RSA/ECDSA keys in encrypted vaults or HSM partitions. Small key sizes mean minimal storage overhead. Verification of old signatures requires maintaining algorithm support.',
    pqcImpact:
      'Archival storage requirements increase 3-10x per key. Organizations transitioning to PQC must archive both classical and PQC keys during the hybrid period. Long-term archives may span decades, requiring forward-compatible storage formats.',
    icon: 'archive',
  },
  {
    id: 'destruction',
    name: 'Destruction',
    description:
      'Keys are securely destroyed when no longer needed. Destruction must be irreversible and include all copies (primary, backup, cached). HSMs provide certified zeroization. Key destruction is logged for audit compliance.',
    nistReference: 'NIST SP 800-57 Part 1, Section 5.7',
    classicalApproach:
      'HSM zeroization, secure memory wiping, and physical destruction of media. Small key sizes mean fewer storage locations to sanitize.',
    pqcImpact:
      'Larger PQC keys may exist in more memory locations and caches. Ensure all copies of lattice-based keys (which are larger) are properly zeroized. Dual-key (hybrid) destruction must cover both the classical and PQC components.',
    icon: 'trash-2',
  },
]

export const PKCS11_MECHANISMS: PKCS11Mechanism[] = [
  {
    id: 'ckm-rsa-pkcs-key-pair-gen',
    name: 'CKM_RSA_PKCS_KEY_PAIR_GEN',
    type: 'classical',
    mechanismCode: '0x00000000',
    description: 'Generate RSA key pair (2048/3072/4096 bits)',
    keySize: '2048-4096 bits',
  },
  {
    id: 'ckm-ec-key-pair-gen',
    name: 'CKM_EC_KEY_PAIR_GEN',
    type: 'classical',
    mechanismCode: '0x00001040',
    description: 'Generate ECDSA key pair on P-256/P-384',
    keySize: '256-384 bits',
  },
  {
    id: 'ckm-rsa-pkcs-oaep',
    name: 'CKM_RSA_PKCS_OAEP',
    type: 'classical',
    mechanismCode: '0x00000009',
    description: 'RSA OAEP encryption/decryption for key wrapping',
    keySize: '2048-4096 bits',
  },
  {
    id: 'ckm-ecdsa',
    name: 'CKM_ECDSA',
    type: 'classical',
    mechanismCode: '0x00001041',
    description: 'ECDSA sign/verify operations',
    keySize: '256-384 bits',
  },
  {
    id: 'ckm-ml-kem-key-pair-gen',
    name: 'CKM_ML_KEM_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x00004000',
    description: 'Generate ML-KEM key pair (FIPS 203)',
    keySize: 'ML-KEM-512/768/1024',
  },
  {
    id: 'ckm-ml-kem-encapsulate',
    name: 'CKM_ML_KEM_ENCAPSULATE',
    type: 'pqc',
    mechanismCode: '0x00004001',
    description: 'ML-KEM encapsulation to produce shared secret',
    keySize: 'ML-KEM-512/768/1024',
  },
  {
    id: 'ckm-ml-kem-decapsulate',
    name: 'CKM_ML_KEM_DECAPSULATE',
    type: 'pqc',
    mechanismCode: '0x00004002',
    description: 'ML-KEM decapsulation to recover shared secret',
    keySize: 'ML-KEM-512/768/1024',
  },
  {
    id: 'ckm-ml-dsa-key-pair-gen',
    name: 'CKM_ML_DSA_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x00004010',
    description: 'Generate ML-DSA key pair (FIPS 204)',
    keySize: 'ML-DSA-44/65/87',
  },
  {
    id: 'ckm-ml-dsa-sign',
    name: 'CKM_ML_DSA',
    type: 'pqc',
    mechanismCode: '0x00004011',
    description: 'ML-DSA sign/verify operations',
    keySize: 'ML-DSA-44/65/87',
  },
  {
    id: 'ckm-slh-dsa-key-pair-gen',
    name: 'CKM_SLH_DSA_KEY_PAIR_GEN',
    type: 'pqc',
    mechanismCode: '0x00004020',
    description: 'Generate SLH-DSA key pair (FIPS 205)',
    keySize: 'SLH-DSA-128s/128f/192s/192f/256s/256f',
  },
]

export const KEY_SIZE_COMPARISONS: KeySizeComparison[] = [
  {
    algorithm: 'RSA-2048',
    type: 'classical',
    publicKeyBytes: 256,
    privateKeyBytes: 1192,
    signatureOrCiphertextBytes: 256,
    nistLevel: 'Level 1 (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'RSA-3072',
    type: 'classical',
    publicKeyBytes: 384,
    privateKeyBytes: 1766,
    signatureOrCiphertextBytes: 384,
    nistLevel: 'Level 1 (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ECDSA P-256',
    type: 'classical',
    publicKeyBytes: 64,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 64,
    nistLevel: 'Level 1 (classical)',
    quantumSafe: false,
  },
  {
    algorithm: 'ML-KEM-512',
    type: 'pqc',
    publicKeyBytes: 800,
    privateKeyBytes: 1632,
    signatureOrCiphertextBytes: 768,
    nistLevel: 'NIST Level 1',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-KEM-768',
    type: 'pqc',
    publicKeyBytes: 1184,
    privateKeyBytes: 2400,
    signatureOrCiphertextBytes: 1088,
    nistLevel: 'NIST Level 3',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-KEM-1024',
    type: 'pqc',
    publicKeyBytes: 1568,
    privateKeyBytes: 3168,
    signatureOrCiphertextBytes: 1568,
    nistLevel: 'NIST Level 5',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-DSA-44',
    type: 'pqc',
    publicKeyBytes: 1312,
    privateKeyBytes: 2560,
    signatureOrCiphertextBytes: 2420,
    nistLevel: 'NIST Level 2',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-DSA-65',
    type: 'pqc',
    publicKeyBytes: 1952,
    privateKeyBytes: 4032,
    signatureOrCiphertextBytes: 3309,
    nistLevel: 'NIST Level 3',
    quantumSafe: true,
  },
  {
    algorithm: 'ML-DSA-87',
    type: 'pqc',
    publicKeyBytes: 2592,
    privateKeyBytes: 4896,
    signatureOrCiphertextBytes: 4627,
    nistLevel: 'NIST Level 5',
    quantumSafe: true,
  },
  {
    algorithm: 'SLH-DSA-128s',
    type: 'pqc',
    publicKeyBytes: 32,
    privateKeyBytes: 64,
    signatureOrCiphertextBytes: 7856,
    nistLevel: 'NIST Level 1',
    quantumSafe: true,
  },
]

export const ROTATION_POLICIES: RotationPolicy[] = [
  {
    id: 'tls-server',
    name: 'TLS Server Certificates',
    description:
      'Server certificates for web services and APIs. Short-lived to limit compromise impact.',
    rotationInterval: '90 days (recommended) to 1 year (maximum)',
    applicableTo: ['RSA-2048', 'ECDSA P-256', 'ML-DSA-65', 'Hybrid'],
    complianceFramework: 'CA/B Forum Baseline Requirements',
  },
  {
    id: 'code-signing',
    name: 'Code Signing Keys',
    description: 'Keys used to sign software releases, firmware updates, and container images.',
    rotationInterval: '2-3 years',
    applicableTo: ['RSA-3072', 'ECDSA P-384', 'ML-DSA-65', 'SLH-DSA-128f'],
    complianceFramework: 'NIST SP 800-57',
  },
  {
    id: 'ca-intermediate',
    name: 'Intermediate CA Keys',
    description:
      'CA keys used to issue end-entity certificates. Long-lived with strict HSM protection.',
    rotationInterval: '5-10 years',
    applicableTo: ['RSA-4096', 'ECDSA P-384', 'ML-DSA-87', 'Composite'],
    complianceFramework: 'CA/B Forum, NIST SP 800-57',
  },
  {
    id: 'root-ca',
    name: 'Root CA Keys',
    description: 'Trust anchors. Longest-lived keys with highest security requirements.',
    rotationInterval: '15-25 years',
    applicableTo: ['RSA-4096', 'ECDSA P-384', 'ML-DSA-87', 'SLH-DSA-256s'],
    complianceFramework: 'CA/B Forum, NIST SP 800-57, WebTrust',
  },
  {
    id: 'data-encryption',
    name: 'Data Encryption Keys (DEK)',
    description: 'Symmetric keys used for encrypting data at rest or in transit.',
    rotationInterval: '1-2 years',
    applicableTo: ['AES-256-GCM', 'AES-256-CBC'],
    complianceFramework: 'PCI DSS, HIPAA, NIST SP 800-57',
  },
  {
    id: 'kek',
    name: 'Key Encryption Keys (KEK)',
    description: 'Keys used to wrap/unwrap other keys. Critical for key hierarchy security.',
    rotationInterval: '2-5 years',
    applicableTo: ['RSA-3072', 'ML-KEM-768', 'AES-256-KW'],
    complianceFramework: 'NIST SP 800-57, FIPS 140-3',
  },
]

export const ENTERPRISE_SCENARIO = {
  name: 'Quantum Financial Services Corp',
  totalCertificates: 500,
  hsmCount: 10,
  hsmModel: 'Thales Luna Network HSM 7',
  currentAlgorithms: {
    tlsCerts: { count: 300, algorithm: 'RSA-2048', keySize: 256 },
    codeSigning: { count: 50, algorithm: 'ECDSA P-256', keySize: 64 },
    caKeys: { count: 15, algorithm: 'RSA-4096', keySize: 512 },
    dataEncryption: { count: 100, algorithm: 'AES-256-GCM', keySize: 32 },
    apiAuth: { count: 35, algorithm: 'ECDSA P-256', keySize: 64 },
  },
  targetAlgorithms: {
    tlsCerts: { algorithm: 'ML-DSA-65 + ECDSA P-256 (hybrid)', keySize: 1952 + 64 },
    codeSigning: { algorithm: 'ML-DSA-65', keySize: 1952 },
    caKeys: { algorithm: 'ML-DSA-87', keySize: 2592 },
    dataEncryption: { algorithm: 'AES-256-GCM (unchanged)', keySize: 32 },
    apiAuth: { algorithm: 'ML-DSA-44', keySize: 1312 },
  },
  complianceDeadlines: [
    { framework: 'CNSA 2.0 (NSA)', deadline: '2030', requirement: 'Hybrid PQC for all NSS' },
    {
      framework: 'NIST IR 8547',
      deadline: '2030',
      requirement: 'Deprecate RSA/ECDSA for digital signatures',
    },
    {
      framework: 'PCI DSS v4.0',
      deadline: '2028',
      requirement: 'Inventory quantum-vulnerable crypto',
    },
    {
      framework: 'DORA (EU)',
      deadline: '2027',
      requirement: 'Demonstrate crypto agility in ICT risk framework',
    },
  ],
}
