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
      'Full PQC support in firmware v7.9.2+. ML-KEM and ML-DSA integrated into core firmware. CBOM via REST API. USB G7 extension supports PQC. Luna Client 10.9.2+ required for PKCS#11 PQC mechanisms.',
    firmwareVersion: '7.9.2+',
    pkcs11Version: '3.0 (PQC extensions)',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Constant-time NTT',
      'Power analysis shielding',
      'EM emanation protection',
      'Tamper-responsive enclosure',
    ],
  },
  {
    id: 'entrust-nshield',
    name: 'Entrust',
    product: 'nShield 5',
    type: 'on-prem',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3 (cert #4765; PQC firmware resubmission pending)',
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
  },
  {
    id: 'utimaco',
    name: 'Utimaco',
    product: 'SecurityServer Se Gen2 (Quantum Protect)',
    type: 'on-prem',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3 (cert #3925)',
    supportedPQCAlgorithms: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS', 'XMSS'],
    formFactor: 'pcie',
    notes:
      'Q-safe firmware extension adds PQC support via software update to SecurityServer Se Gen2. FIPS 140-3 Level 3 (cert #3925, 2021). PQC simulator available for API testing. SLH-DSA support on roadmap. CAVP validated for ML-KEM, ML-DSA, LMS.',
    firmwareVersion: '5.0+ (Q-safe)',
    pkcs11Version: '3.0',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Level 4 physical tamper protection',
      'Environmental failure protection',
      'Voltage/temperature monitoring',
      'Active tamper response',
    ],
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
      'PCIe HSM with hardware PQC acceleration. PQC algorithms in beta firmware. Powers Azure Managed HSM backend. Designed for cloud infrastructure and financial transaction processing.',
    firmwareVersion: 'Beta firmware',
    pkcs11Version: '2.40',
    hybridSupport: false,
    sideChannelCountermeasures: ['Hardware crypto acceleration', 'Isolated execution environment'],
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
      'Enterprise HSM with PQC firmware development in progress. PCI HSM certified. PQC support targeting production readiness.',
    firmwareVersion: 'PQC beta',
    pkcs11Version: '2.40',
    hybridSupport: false,
    sideChannelCountermeasures: ['Tamper-responsive enclosure', 'PCI HSM physical protections'],
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
      'Dedicated managed HSM. ML-DSA key pair generation and signing in preview. Built on AWS-LC, a FIPS 140-3 validated open-source library with ML-KEM and ML-DSA support. Native PKCS#11 PQC mechanisms not yet in firmware. Multi-AZ redundancy.',
    firmwareVersion: 'SDK-dependent',
    pkcs11Version: '2.40 (PQC via SDK)',
    hybridSupport: false,
    sideChannelCountermeasures: ['AWS Nitro System isolation', 'Dedicated hardware per customer'],
  },
  {
    id: 'azure-dhsm',
    name: 'Microsoft',
    product: 'Azure Dedicated HSM',
    type: 'cloud',
    pqcSupportStatus: 'roadmap',
    fips140Level: 'FIPS 140-3 Level 3 (via Thales Luna 7 cert)',
    supportedPQCAlgorithms: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'LMS/HSS'],
    formFactor: 'cloud',
    notes:
      'Backed by Thales Luna Network HSM 7 — identical hardware and PQC capabilities once upgraded to firmware v7.9.2+. PQC algorithms and FIPS coverage are the same as Thales Luna 7. Customers request the firmware upgrade via Azure Support; Microsoft does not auto-upgrade dedicated HSMs. Azure Managed HSM (Marvell LS2 backend) has a separate PQC roadmap.',
    firmwareVersion: '7.9.2+ (customer-requested via Azure Support)',
    pkcs11Version: '3.0 (PQC extensions)',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Thales Luna hardware protections (identical to on-prem Luna 7)',
      'Azure physical data center security',
    ],
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
      'Hardware HSM backing for Cloud KMS keys. PQC support planned — currently PQC algorithms available in Cloud KMS software mode. HSM-backed PQC keys expected as algorithms mature.',
    firmwareVersion: 'Planned',
    pkcs11Version: 'N/A (Cloud KMS API)',
    hybridSupport: false,
    sideChannelCountermeasures: ['Google Titan chip', 'Physical security of Google data centers'],
  },
  // On-prem — Crypto4A
  {
    id: 'crypto4a-qxhsm',
    name: 'Crypto4A',
    product: 'QxHSM (QASM core)',
    type: 'on-prem',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3 (cert #4250, Active)',
    supportedPQCAlgorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'LMS/HSS', 'XMSS', 'Classic McEliece'],
    formFactor: 'network',
    notes:
      "World's first FIPS 140-3 Level 3 validated PQC-capable HSM (cert #4250). Modular blade design (QxBMC-1/3/12 chassis — up to 12 blades per 4RU). FPGA-based crypto-agility enables firmware updates for new algorithms without hardware replacement. Full NIST PQC suite plus Classic McEliece. Integrations: EJBCA (v9.3+), DigiCert, Keyfactor. Canadian sovereign solution (Ottawa).",
    firmwareVersion: 'v4.4+ (production PQC); v5.0 (FIPS 140-3 resubmission pending)',
    pkcs11Version: '3.0 (PQC extensions)',
    hybridSupport: true,
    sideChannelCountermeasures: [
      'Electromagnetic isolation enclosure',
      'Multi-event tamper-evidence sensors',
      'FPGA-based crypto isolation',
      'Automatic key zeroization on tamper detection',
    ],
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
    name: 'Encapsulate: Derive Session Key',
    command: `C_EncapsulateKey(
  hSession,
  &mechanism,         // CKM_ML_KEM
  hPublicKey,         // ML-KEM public key (encapsulation key)
  sessionTemplate,    // CKA_CLASS=SECRET_KEY, CKA_KEY_TYPE=AES
  ulAttributeCount,
  &hSharedSecretKey,  // Handle to new AES key derived from shared secret
  ciphertext,         // Output: KEM ciphertext (1,088 bytes)
  &ciphertextLen
)`,
    description: 'Use ML-KEM encapsulation to derive a shared AES session key.',
    detail:
      'PKCS#11 v3.2 adds C_EncapsulateKey specifically for KEM operations. Unlike C_WrapKey (which wraps an existing key), C_EncapsulateKey derives a NEW key object from the KEM shared secret and simultaneously outputs the KEM ciphertext. The 1,088-byte ciphertext is sent to the private key holder; the derived AES key stays inside the HSM.',
    output: `CKR_OK
  Derived Key Handle: 0x00000044 (AES-256)
  Mechanism:          CKM_ML_KEM
  KEM Ciphertext:     1,088 bytes
  Shared Secret:      32 bytes (derived → AES key, stays in HSM)`,
    classicalEquivalent: 'CKM_RSA_PKCS_OAEP → 256-byte ciphertext (direct encryption)',
    vendorNotes: {
      onPrem:
        'Thales/Entrust: native CKM_ML_KEM via C_EncapsulateKey. Utimaco: via Q-safe extension',
      cloud: 'No cloud HSM supports native PKCS#11 KEM encapsulation yet',
    },
  },
  {
    id: 'unwrap-key',
    step: 4,
    name: 'Decapsulate: Recover Session Key',
    command: `C_DecapsulateKey(
  hSession,
  &mechanism,         // CKM_ML_KEM
  hPrivateKey,        // ML-KEM private key (decapsulation key)
  sessionTemplate,    // CKA_CLASS=SECRET_KEY, CKA_KEY_TYPE=AES
  ulAttributeCount,
  ciphertext,         // Input: KEM ciphertext from step 3
  ciphertextLen,
  &hRecoveredKey      // Handle to recovered AES key
)`,
    description: 'Decapsulate to recover the AES-256 session key.',
    detail:
      'PKCS#11 v3.2 C_DecapsulateKey takes the KEM ciphertext, runs ML-KEM decapsulation inside the HSM boundary using the non-extractable private key, and materialises the recovered shared secret as a new key object. The decapsulation happens entirely within the HSM — the shared secret is never exposed.',
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
  Hedged Signing:  YES (rnd ≠ 0, per FIPS 204 §5.2)
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
      'Hybrid keys require two key pairs with the same CKA_ID attribute to link them logically. Applications perform both classical and PQC operations and combine the results. PKCS#11 v3.2 does not yet define a single composite key type — vendors use linked pairs. IETF composite signature drafts (draft-ounsworth-pq-composite-sigs) may standardize this.',
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
