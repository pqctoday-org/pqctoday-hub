// SPDX-License-Identifier: GPL-3.0-only

export interface HSMVendor {
  id: string
  name: string
  product: string
  type: 'on-prem' | 'cloud'
  pqcSupportStatus: 'production' | 'beta' | 'limited' | 'roadmap'
  fips140Level: string
  supportedPQCAlgorithms: string[]
  formFactor: 'network' | 'pcie' | 'cloud' | 'usb'
  notes: string
  firmwareVersion: string
  pkcs11Version: string
  hybridSupport: boolean
  sideChannelCountermeasures: string[]
  pqcMaturityScore: number
}

export interface PKCS11Operation {
  id: string
  step: number
  name: string
  command: string
  description: string
  detail: string
  output: string
  classicalEquivalent?: string
  vendorNotes?: { onPrem: string; cloud: string }
}

export const HSM_VENDORS: HSMVendor[] = [
  // On-prem vendors
  {
    id: 'thales-luna',
    name: 'Thales',
    product: 'Luna Network HSM 7',
    type: 'on-prem',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS/HSS'],
    formFactor: 'network',
    notes:
      'Full PQC support in firmware v7.9.2+. ML-KEM and ML-DSA integrated into core firmware (no external modules needed). CBOM via REST API. USB G7 extension supports PQC. Luna Client 10.9.2+ required for PKCS#11 PQC mechanisms.',
    firmwareVersion: '7.9.2+',
    pkcs11Version: '3.0 (PQC extensions)',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Constant-time NTT',
      'Power analysis shielding',
      'EM emanation protection',
      'Tamper-responsive enclosure',
    ],
    pqcMaturityScore: 95,
  },
  {
    id: 'entrust-nshield',
    name: 'Entrust',
    product: 'nShield 5',
    type: 'on-prem',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3 (submitted)',
    supportedPQCAlgorithms: ['ML-KEM-768/1024', 'ML-DSA-44/65/87', 'SLH-DSA', 'LMS/HSS', 'XMSS'],
    formFactor: 'network',
    notes:
      'Firmware v13.8.0 adds native ML-DSA, ML-KEM, SLH-DSA support. CAVP validated. Available via PKCS#11, CNG, and JCE interfaces. PQSDK v1.2.1+ with pre-built libraries and templates. Hardware-accelerated PQC operations.',
    firmwareVersion: '13.8.0+',
    pkcs11Version: '3.0 (PQC extensions)',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Hardware PQC acceleration',
      'Constant-time lattice operations',
      'Masking countermeasures',
      'CodeSafe secure execution',
    ],
    pqcMaturityScore: 90,
  },
  {
    id: 'utimaco',
    name: 'Utimaco',
    product: 'SecurityServer Se Gen2 (Quantum Protect)',
    type: 'on-prem',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-2 Level 4 / FIPS 140-3 pending',
    supportedPQCAlgorithms: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS', 'XMSS'],
    formFactor: 'pcie',
    notes:
      'Q-safe firmware extension enables PQC on existing hardware — no HSM replacement needed. Highest physical security (Level 4). Free PQC simulator mirrors hardware APIs for pre-procurement testing. SLH-DSA support on roadmap. CAVP validated for ML-KEM, ML-DSA, LMS.',
    firmwareVersion: '5.0+ (Q-safe)',
    pkcs11Version: '3.0',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Level 4 physical tamper protection',
      'Environmental failure protection',
      'Voltage/temperature monitoring',
      'Active tamper response',
    ],
    pqcMaturityScore: 85,
  },
  {
    id: 'marvell-ls2',
    name: 'Marvell',
    product: 'LiquidSecurity 2 (LS2)',
    type: 'on-prem',
    pqcSupportStatus: 'beta',
    fips140Level: 'FIPS 140-3 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-768', 'ML-DSA-65', 'LMS'],
    formFactor: 'pcie',
    notes:
      'High-throughput PCIe HSM with hardware PQC acceleration. PQC algorithms in beta firmware. Powers Azure Managed HSM backend. Designed for cloud infrastructure and high-volume financial transaction processing.',
    firmwareVersion: 'Beta firmware',
    pkcs11Version: '2.40',
    hybridSupport: false,
    sideChannelCountermeasures: ['Hardware crypto acceleration', 'Isolated execution environment'],
    pqcMaturityScore: 55,
  },
  {
    id: 'futurex-cryptohub',
    name: 'Futurex',
    product: 'CryptoHub HSM',
    type: 'on-prem',
    pqcSupportStatus: 'beta',
    fips140Level: 'FIPS 140-3 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-768', 'ML-DSA-65'],
    formFactor: 'network',
    notes:
      'Enterprise HSM with PQC firmware development in progress. Strong presence in payment processing (PCI HSM certified). PQC support targeting production readiness.',
    firmwareVersion: 'PQC beta',
    pkcs11Version: '2.40',
    hybridSupport: false,
    sideChannelCountermeasures: ['Tamper-responsive enclosure', 'PCI HSM physical protections'],
    pqcMaturityScore: 40,
  },
  // Cloud HSM vendors
  {
    id: 'aws-cloudhsm',
    name: 'AWS',
    product: 'CloudHSM',
    type: 'cloud',
    pqcSupportStatus: 'limited',
    fips140Level: 'FIPS 140-3 Level 3 (via AWS-LC)',
    supportedPQCAlgorithms: ['ML-DSA-65 (preview)'],
    formFactor: 'cloud',
    notes:
      'Dedicated managed HSM. ML-DSA key pair generation and signing in preview. Built on AWS-LC — first open-source FIPS 140-3 validated module with ML-KEM. Native PKCS#11 PQC mechanisms not yet in firmware. Multi-AZ redundancy.',
    firmwareVersion: 'SDK-dependent',
    pkcs11Version: '2.40 (PQC via SDK)',
    hybridSupport: false,
    sideChannelCountermeasures: ['AWS Nitro System isolation', 'Dedicated hardware per customer'],
    pqcMaturityScore: 35,
  },
  {
    id: 'azure-dhsm',
    name: 'Microsoft',
    product: 'Azure Dedicated HSM',
    type: 'cloud',
    pqcSupportStatus: 'roadmap',
    fips140Level: 'FIPS 140-2 Level 3',
    supportedPQCAlgorithms: ['Roadmap: ML-KEM, ML-DSA (via Thales firmware)'],
    formFactor: 'cloud',
    notes:
      'Powered by Thales Luna 7 hardware. PQC available when customers request firmware upgrade to v7.9+. Azure Managed HSM (powered by Marvell LS2) also on PQC roadmap. Microsoft targets CNSA 2.0 compliance by 2029.',
    firmwareVersion: 'Pending Thales firmware',
    pkcs11Version: '3.0 (after upgrade)',
    hybridSupport: false,
    sideChannelCountermeasures: [
      'Thales Luna hardware protections',
      'Azure confidential computing',
    ],
    pqcMaturityScore: 25,
  },
  {
    id: 'gcp-cloudhsm',
    name: 'Google Cloud',
    product: 'Cloud HSM',
    type: 'cloud',
    pqcSupportStatus: 'roadmap',
    fips140Level: 'FIPS 140-2 Level 3',
    supportedPQCAlgorithms: ['Planned: ML-KEM, ML-DSA (via Cloud KMS integration)'],
    formFactor: 'cloud',
    notes:
      'Hardware HSM backing for Cloud KMS keys. PQC support planned — currently PQC algorithms available in Cloud KMS software mode. HSM-backed PQC keys expected as algorithms mature. Google already uses PQC internally for infrastructure.',
    firmwareVersion: 'Planned',
    pkcs11Version: 'N/A (Cloud KMS API)',
    hybridSupport: false,
    sideChannelCountermeasures: ['Google Titan chip', 'Physical security of Google data centers'],
    pqcMaturityScore: 20,
  },
]

export const HSM_PKCS11_OPERATIONS: PKCS11Operation[] = [
  {
    id: 'generate-keypair',
    step: 1,
    name: 'Generate PQC Key Pair',
    command: `C_GenerateKeyPair(
  hSession,
  &mechanism,        // CKM_ML_KEM_KEY_PAIR_GEN
  publicTemplate,    // CKA_TOKEN, CKA_ENCRYPT, CKA_WRAP
  privateTemplate,   // CKA_PRIVATE, CKA_SENSITIVE, CKA_DECRYPT
  &hPublicKey,
  &hPrivateKey
)`,
    description: 'Generate an ML-KEM-768 key pair inside the HSM boundary.',
    detail:
      'The private key never leaves the HSM. CKA_SENSITIVE=TRUE ensures the private key cannot be exported in plaintext. CKA_EXTRACTABLE=FALSE prevents any form of export. The HSM uses its internal DRBG seeded with hardware entropy. PKCS#11 v3.2 defines CKK_ML_KEM as the key type.',
    output: `CKR_OK
  Public Key Handle:  0x00000042
  Private Key Handle: 0x00000043
  Algorithm:          ML-KEM-768
  Public Key Size:    1,184 bytes
  Token Object:       YES (persistent)`,
    classicalEquivalent: 'CKM_RSA_PKCS_KEY_PAIR_GEN → RSA-2048 (256-byte public key)',
    vendorNotes: {
      onPrem:
        'Thales Luna v7.9.2+, Entrust nShield v13.8.0+, Utimaco Q-safe: native firmware support',
      cloud: 'AWS CloudHSM: via SDK only. Azure/GCP: not yet available in hardware',
    },
  },
  {
    id: 'export-public',
    step: 2,
    name: 'Export Public Key',
    command: `C_GetAttributeValue(
  hSession,
  hPublicKey,        // Handle from step 1
  publicKeyTemplate, // CKA_VALUE
  1                  // Attribute count
)`,
    description: 'Extract the ML-KEM-768 public key for distribution.',
    detail:
      'Public keys can always be exported (CKA_SENSITIVE does not apply). The 1,184-byte public key is used by peers to encapsulate shared secrets. In TLS 1.3, this would be sent in the key_share extension. Buffer must accommodate the larger PQC key size — applications using fixed 256-byte buffers will fail.',
    output: `CKR_OK
  Attribute:    CKA_VALUE
  Length:       1,184 bytes
  Key Type:     CKK_ML_KEM
  Exportable:   YES (public key)`,
    classicalEquivalent: 'Same API call — but RSA-2048 public key is only 256 bytes',
    vendorNotes: {
      onPrem: 'All vendors: standard PKCS#11 call, no vendor-specific extensions needed',
      cloud: 'Cloud HSMs may return via vendor SDK wrapper rather than raw PKCS#11',
    },
  },
  {
    id: 'wrap-key',
    step: 3,
    name: 'Wrap Session Key (Encapsulate)',
    command: `C_WrapKey(
  hSession,
  &mechanism,     // CKM_ML_KEM_ENCAPSULATE
  hPublicKey,     // Wrapping key (ML-KEM public)
  hSessionKey,    // Key to wrap (AES-256 session key)
  wrappedKey,     // Output: ciphertext (1,088 bytes)
  &wrappedKeyLen
)`,
    description: 'Use ML-KEM encapsulation to wrap an AES-256 session key.',
    detail:
      'Unlike RSA-OAEP which directly wraps the key, ML-KEM is a two-step process: encapsulation produces a ciphertext and a 32-byte shared secret, then the shared secret is used as a KEK to wrap the session key. PKCS#11 C_WrapKey abstracts both steps. The 1,088-byte ciphertext is sent to the private key holder.',
    output: `CKR_OK
  Wrapped Key Length: 1,088 bytes
  Mechanism:         CKM_ML_KEM_ENCAPSULATE
  KEM Ciphertext:    1,088 bytes
  Shared Secret:     32 bytes (internal)`,
    classicalEquivalent: 'CKM_RSA_PKCS_OAEP → 256-byte ciphertext (direct encryption)',
    vendorNotes: {
      onPrem: 'Thales/Entrust: native CKM_ML_KEM_ENCAPSULATE. Utimaco: via Q-safe extension',
      cloud: 'No cloud HSM supports native PKCS#11 KEM encapsulation yet',
    },
  },
  {
    id: 'unwrap-key',
    step: 4,
    name: 'Unwrap Session Key (Decapsulate)',
    command: `C_UnwrapKey(
  hSession,
  &mechanism,      // CKM_ML_KEM_DECAPSULATE
  hPrivateKey,     // Unwrapping key (ML-KEM private)
  wrappedKey,      // Input: ciphertext from step 3
  wrappedKeyLen,
  sessionTemplate, // CKA_CLASS=SECRET_KEY, CKA_KEY_TYPE=AES
  4,
  &hRecoveredKey
)`,
    description: 'Decapsulate to recover the AES-256 session key.',
    detail:
      'The private key performs ML-KEM decapsulation inside the HSM boundary. The shared secret is derived, then used to unwrap the session key. The private key handle references a non-extractable object, so the decapsulation operation happens entirely within the HSM.',
    output: `CKR_OK
  Recovered Key Handle: 0x00000044
  Key Type:            CKK_AES
  Key Size:            256 bits
  CKA_SENSITIVE:       TRUE`,
    classicalEquivalent: 'CKM_RSA_PKCS_OAEP decrypt → recovers plaintext DEK directly',
    vendorNotes: {
      onPrem: 'All three on-prem vendors support native decapsulation in firmware',
      cloud: 'AWS CloudHSM: SDK-based. Azure/GCP: not yet available',
    },
  },
  {
    id: 'sign',
    step: 5,
    name: 'Sign with ML-DSA',
    command: `C_Sign(
  hSession,
  data,           // Message to sign
  dataLen,        // Message length
  signature,      // Output buffer (must be >= 3,309 bytes)
  &signatureLen   // ML-DSA-65: 3,309 bytes
)
// After C_SignInit(hSession, &mechanism, hSignKey)
// mechanism = CKM_ML_DSA`,
    description: 'Create a digital signature using ML-DSA-65.',
    detail:
      'ML-DSA-65 produces 3,309-byte signatures (vs 64 bytes for ECDSA P-256). The signing key must have been generated with CKM_ML_DSA_KEY_PAIR_GEN. Signing is performed inside the HSM; only the signature is returned. ML-DSA is a stateless scheme, unlike LMS/XMSS which require the HSM to track per-signature state.',
    output: `CKR_OK
  Signature Length: 3,309 bytes
  Algorithm:       ML-DSA-65
  NIST Level:      3
  Hedged Signing:  YES (rnd ≠ 0, per FIPS 204 §3.5.2)
  Note:            Hedged mode recommended for side-channel protection`,
    classicalEquivalent: 'CKM_ECDSA with P-256 → 64-byte signature (51x smaller)',
    vendorNotes: {
      onPrem: 'All vendors: native ML-DSA with hedged signing. Entrust also supports SLH-DSA',
      cloud: 'AWS CloudHSM: ML-DSA preview. Azure/GCP: not yet available',
    },
  },
  {
    id: 'verify',
    step: 6,
    name: 'Verify ML-DSA Signature',
    command: `C_Verify(
  hSession,
  data,           // Original message
  dataLen,
  signature,      // Signature from step 5
  signatureLen    // 3,309 bytes
)
// After C_VerifyInit(hSession, &mechanism, hVerifyKey)
// mechanism = CKM_ML_DSA`,
    description: 'Verify the ML-DSA-65 signature against the original data.',
    detail:
      'Verification can be performed with the public key outside the HSM, but using the HSM ensures the operation uses validated, certified code. Verification is faster than signing for ML-DSA. The operation returns CKR_OK for valid signatures or CKR_SIGNATURE_INVALID.',
    output: `CKR_OK
  Verification:    VALID
  Algorithm:       ML-DSA-65
  Public Key Size: 1,952 bytes
  Signature Valid: TRUE`,
    classicalEquivalent: 'CKM_ECDSA verify — same API, 64-byte signature input',
    vendorNotes: {
      onPrem: 'All vendors: native verification. Public key can also verify outside HSM',
      cloud: 'Verification is typically done in software for performance',
    },
  },
  {
    id: 'hybrid-keygen',
    step: 7,
    name: 'Generate Hybrid Key Pair',
    command: `// Step 7a: Generate classical keypair
C_GenerateKeyPair(hSession,
  &ecMechanism,     // CKM_EC_KEY_PAIR_GEN (P-256)
  ecPubTemplate, ecPrivTemplate,
  &hEcPub, &hEcPriv)

// Step 7b: Generate PQC keypair
C_GenerateKeyPair(hSession,
  &mlkemMechanism,  // CKM_ML_KEM_KEY_PAIR_GEN
  mlkemPubTemplate, mlkemPrivTemplate,
  &hMlkemPub, &hMlkemPriv)

// Link via CKA_ID attribute (same ID for both pairs)`,
    description: 'Generate a linked classical + PQC key pair for hybrid operations.',
    detail:
      'Hybrid keys require two key pairs with the same CKA_ID attribute to link them logically. Applications perform both classical and PQC operations and combine the results. PKCS#11 v3.2 does not yet define a single composite key type — vendors use linked pairs. The Composite ML-DSA draft (FIPS 206) may standardize this.',
    output: `CKR_OK
  EC Public Key:     0x00000050 (65 bytes, P-256)
  EC Private Key:    0x00000051
  ML-KEM Public Key: 0x00000052 (1,184 bytes)
  ML-KEM Private Key: 0x00000053
  Linked by CKA_ID:  "hybrid-pair-001"`,
    classicalEquivalent: 'N/A — hybrid keys are unique to the PQC transition period',
    vendorNotes: {
      onPrem: 'Thales Luna: native composite cert enrollment. Entrust: PQSDK hybrid support',
      cloud: 'No cloud HSM supports linked hybrid key pairs yet',
    },
  },
  {
    id: 'stateful-state',
    step: 8,
    name: 'Stateful Signature State Check (LMS)',
    command: `// Query remaining one-time signatures
C_GetAttributeValue(
  hSession,
  hLmsKey,           // LMS signing key handle
  stateTemplate,     // CKA_LMS_REMAINING_SIGNATURES
  1
)

// CRITICAL: State must persist to NVRAM after every sign`,
    description: 'Check remaining one-time signatures for an LMS/HSS stateful key.',
    detail:
      'LMS/HSS and XMSS are stateful hash-based schemes: each leaf can only sign ONCE. The HSM must atomically update NVRAM state after every signing operation. Power failure during state update can brick the key. HSMs are the ONLY safe place for stateful signatures — CNSA 2.0 requires LMS/HSS for firmware/software signing. CKA_LMS_REMAINING_SIGNATURES is a vendor-specific attribute (not yet in PKCS#11 v3.2).',
    output: `CKR_OK
  Key Type:              CKK_LMS
  Tree Height:           H=20 (1,048,576 total signatures)
  Signatures Used:       12,847
  Remaining:             1,035,729
  State Storage:         NVRAM (atomic write)
  WARNING:               State loss = key compromise`,
    classicalEquivalent: 'N/A — classical signatures are stateless (unlimited per key)',
    vendorNotes: {
      onPrem: 'Thales Luna: LMS/HSS with NVRAM state. Entrust: LMS + XMSS. Utimaco: LMS + XMSS',
      cloud:
        'No cloud HSM supports stateful signatures — state management too risky for shared infrastructure',
    },
  },
]

export const STATUS_LABELS: Record<
  HSMVendor['pqcSupportStatus'],
  { label: string; className: string }
> = {
  production: {
    label: 'PRODUCTION',
    className: 'bg-success/10 text-success border-success/20',
  },
  beta: {
    label: 'BETA',
    className: 'bg-warning/10 text-warning border-warning/20',
  },
  roadmap: {
    label: 'ROADMAP',
    className: 'bg-muted/50 text-muted-foreground border-border',
  },
  limited: {
    label: 'LIMITED',
    className: 'bg-primary/10 text-primary border-primary/20',
  },
}
