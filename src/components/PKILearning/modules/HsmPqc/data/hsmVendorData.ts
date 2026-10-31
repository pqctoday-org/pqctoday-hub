// SPDX-License-Identifier: AGPL-3.0-only

import { getHsmFactsForSoftware, hsmCapabilitySummary } from '@/data/hsmCapabilityXrefData'
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

export type PqcSupportStatusKey = 'production' | 'beta' | 'limited' | 'roadmap'

export interface HSMVendor {
  id: string
  name: string
  product: string
  type: 'on-prem' | 'cloud'
  /**
   * Reference to the product's `software_name` in the central catalog
   * (`pqc_product_catalog_*.csv`). The headline `pqcSupportStatus` is DERIVED
   * from the catalog via `getVendorPqcSupportStatus` — never stored here, so the
   * module cannot drift from the single source of truth. The per-algorithm
   * detail (supportedPQCAlgorithms / firmwareVersion / PKCS#11 mechanisms /
   * FIPS level) stays as module-authored teaching content the catalog omits.
   */
  catalogName: string
  fips140Level: string
  supportedPQCAlgorithms: string[]
  formFactor: 'network' | 'pcie' | 'cloud' | 'usb'
  notes: string
  firmwareVersion: string
  pkcs11Version: string
  /** Omitted when the vendor's own pages do not say. */
  hybridSupport?: boolean
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

const HSM_VENDOR_SCENARIOS: Omit<HSMVendor, 'supportedPQCAlgorithms' | 'notes'>[] = [
  // On-prem vendors
  {
    id: 'thales-luna',
    name: 'Thales',
    product: 'Luna Network HSM 7',
    type: 'on-prem',
    catalogName: 'Thales Luna HSM',
    fips140Level: 'FIPS 140-3 Level 3',
    formFactor: 'network',
    firmwareVersion: '7.9.0 or newer',
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
    catalogName: 'Entrust nShield',
    fips140Level:
      'FIPS 140-3 Level 3 (cert #5329, no PQC in its approved list; a newer nShield 5s entry is in CMVP Modules in Process)',
    formFactor: 'network',
    firmwareVersion: '13.8+ (ML-KEM: 13.8.3+)',
    pkcs11Version: 'Not stated in the release notes (PQC mechanisms are listed per release)',
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
    catalogName: 'Utimaco uTrust HSM',
    fips140Level: 'FIPS 140-2 Level 3 (cert #3925, Historical since sunset)',
    formFactor: 'pcie',
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
    catalogName: 'Marvell LiquidSecurity 2',
    fips140Level:
      'FIPS 140-3 Level 3 (CMVP #4703 and #5502, Marvell LS2 HSM Family; no PQC algorithm among the approved algorithms of either certificate, and both security policies list ML-DSA and ML-KEM only as non-compliant operations; checked 2026-10-29)',
    formFactor: 'pcie',
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
    catalogName: 'Futurex CryptoHub',
    fips140Level: 'FIPS 140-3 Level 3',
    formFactor: 'network',
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
    catalogName: 'AWS CloudHSM',
    fips140Level:
      'FIPS 140-3 Level 3 (hsm2m.medium: CMVP #4703, Marvell LS2 HSM Family; no PQC algorithm on the certificate, checked 2026-10-15)',
    formFactor: 'cloud',
    firmwareVersion: 'Provider-managed',
    pkcs11Version: '2.40 (ML-DSA via vendor-defined mechanisms)',
    hybridSupport: false,
    sideChannelCountermeasures: ['Single-tenant access to the HSM (AWS CloudHSM FAQ)'],
  },
  {
    id: 'azure-dhsm',
    name: 'Microsoft',
    product: 'Azure Dedicated HSM',
    type: 'cloud',
    catalogName: 'Azure Dedicated HSM (Thales Luna 7)',
    fips140Level: 'FIPS 140-2 Level 3 (Azure documents validated firmware 7.0.3)',
    formFactor: 'cloud',
    firmwareVersion:
      '7.0.3 documented by Azure; customer-administered upgrade to 7.9.0 or newer for ML-KEM and ML-DSA',
    pkcs11Version: 'Not stated by Azure',
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
    catalogName: 'Google Cloud HSM',
    fips140Level: 'FIPS 140-2 Level 3',
    formFactor: 'cloud',
    firmwareVersion: 'N/A',
    pkcs11Version: 'N/A (Cloud KMS API)',
    hybridSupport: false,
    sideChannelCountermeasures: [
      'Marvell LiquidSecurity HSMs (Google Cloud HSM architecture page)',
    ],
  },
  // On-prem — Crypto4A
  {
    id: 'crypto4a-qxhsm',
    name: 'Crypto4A',
    product: 'QxHSM (QASM core)',
    type: 'on-prem',
    catalogName: 'Crypto4A QxHSM',
    fips140Level: 'FIPS 140-3 Level 3 (cert #5497, lists ML-KEM, ML-DSA, SLH-DSA, LMS as approved)',
    formFactor: 'network',
    firmwareVersion: 'v4.4+ (production PQC)',
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

export const HSM_VENDORS: HSMVendor[] = HSM_VENDOR_SCENARIOS.map((vendor) => ({
  ...vendor,
  supportedPQCAlgorithms: getHsmFactsForSoftware(vendor.catalogName)
    .filter((fact) => fact.available === 'yes' || fact.available === 'preview')
    .map((fact) => (fact.available === 'preview' ? `${fact.algorithm} — preview` : fact.algorithm)),
  notes: hsmCapabilitySummary(vendor.catalogName),
}))

export const HSM_PKCS11_OPERATIONS: PKCS11Operation[] = [
  {
    id: 'generate-keypair',
    step: 1,
    name: 'Generate PQC Key Pair',
    command: `C_GenerateKeyPair(
  hSession,
  &mechanism,        // CKM_ML_KEM_KEY_PAIR_GEN
  publicTemplate,    // CKA_TOKEN, CKA_ENCAPSULATE, CKA_PARAMETER_SET (CKP_ML_KEM_768)
  privateTemplate,   // CKA_PRIVATE, CKA_SENSITIVE, CKA_DECAPSULATE
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
        'Thales Luna 7.9.0 or newer, Entrust nShield v13.8+ (ML-KEM: v13.8.3+), Utimaco Q-safe: PQC support in firmware',
      cloud:
        'AWS CloudHSM: ML-DSA only, through vendor-defined PKCS#11 mechanisms; no ML-KEM. Azure Dedicated HSM (Thales Luna 7) can take the Luna firmware upgrade for existing customers, but the service is being retired and accepts no new customers (Microsoft supports existing customers until July 31, 2028). Google Cloud HSM: no PQC at the HSM level',
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
  sessionTemplate,    // CKA_CLASS=SECRET_KEY, CKA_KEY_TYPE=CKK_GENERIC_SECRET, CKA_VALUE_LEN=32
  ulAttributeCount,
  ciphertext,         // Output: KEM ciphertext (1,088 bytes)
  &ciphertextLen,
  &hSharedSecretKey   // Output: handle to new secret key object holding the shared secret
)`,
    description:
      'Use ML-KEM encapsulation to derive a 32-byte shared secret, created as a secret key object on the token.',
    detail:
      'PKCS#11 v3.2 adds C_EncapsulateKey specifically for KEM operations. Unlike C_WrapKey (which wraps an existing key), C_EncapsulateKey derives a NEW key object from the KEM shared secret and simultaneously outputs the KEM ciphertext. The 1,088-byte ciphertext is sent to the private key holder; the derived 32-byte secret is created as a generic secret key on the token (CKA_EXTRACTABLE follows the template and defaults to CK_TRUE), which an application then uses as AES-256 key material (for example through a key-derivation step).',
    output: `CKR_OK
  Derived Key Handle: 0x00000044 (CKK_GENERIC_SECRET)
  Mechanism:          CKM_ML_KEM
  KEM Ciphertext:     1,088 bytes
  Shared Secret:      32 bytes (derived key object)`,
    classicalEquivalent: 'CKM_RSA_PKCS_OAEP → 256-byte ciphertext (direct encryption)',
    vendorNotes: {
      onPrem:
        'Thales Luna: CKM_ML_KEM through the vendor-defined CA_EncapsulateKey and CA_DecapsulateKey (the standard C_EncapsulateKey is not yet implemented; Luna ML-KEM programming guide, updated 2025-12-16). Entrust nShield: ML-KEM reached the PKCS#11 API in Security World v13.9.3 (firmware v13.8.3 or later, PostQuantum feature enabled); in v13.9.0 it was nCore-only. Utimaco: via Q-safe extension',
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
  sessionTemplate,    // CKA_CLASS=SECRET_KEY, CKA_KEY_TYPE=CKK_GENERIC_SECRET, CKA_VALUE_LEN=32, CKA_EXTRACTABLE=FALSE
  ulAttributeCount,
  ciphertext,         // Input: KEM ciphertext from step 3
  ciphertextLen,
  &hRecoveredKey      // Handle to the recovered shared-secret key
)`,
    description:
      'Decapsulate to recover the same 32-byte shared secret (usable as AES-256 key material).',
    detail:
      'PKCS#11 v3.2 C_DecapsulateKey takes the KEM ciphertext, performs ML-KEM decapsulation with the private key (its CKA_DECAPSULATE attribute must be CK_TRUE) and creates the recovered shared secret as a new key object. The spec sets CKA_EXTRACTABLE on the new key to the value in the input template, with a default of CK_TRUE if not provided, so set CKA_EXTRACTABLE to CK_FALSE in the template if the shared secret must not leave the token.',
    output: `CKR_OK
  Recovered Key Handle: 0x00000044
  Key Type:            CKK_GENERIC_SECRET (use as AES-256 key material)
  Key Size:            256 bits
  CKA_SENSITIVE:       TRUE
  CKA_EXTRACTABLE:     FALSE (as set in the template)`,
    classicalEquivalent: 'CKM_RSA_PKCS_OAEP decrypt → recovers plaintext DEK directly',
    vendorNotes: {
      onPrem:
        'All three on-prem vendors support ML-KEM decapsulation in firmware; check the API each exposes for the exact release (nShield: PKCS#11 from Security World v13.9.3)',
      cloud:
        'AWS CloudHSM: no ML-KEM, so no decapsulation. Azure Dedicated HSM (Thales Luna 7) can take the Luna firmware upgrade for existing customers, but the service is being retired and accepts no new customers (Microsoft supports existing customers until July 31, 2028). Google Cloud HSM: no PQC at the HSM level',
    },
  },
  {
    id: 'sign',
    step: 5,
    name: 'Sign with ML-DSA',
    command: `// Message-based signing, as the live HSM runs it (PKCS#11 v3.0+)
C_MessageSignInit(hSession, &mechanism, hSignKey)   // mechanism = CKM_ML_DSA
C_SignMessage(
  hSession,
  &params,        // CK_SIGN_ADDITIONAL_CONTEXT (hedge variant, context string)
  paramsLen,
  data,           // Message to sign
  dataLen,        // Message length
  signature,      // Output buffer (must be >= 3,309 bytes)
  &signatureLen   // ML-DSA-65: 3,309 bytes
)
C_MessageSignFinal(hSession)`,
    description: 'Create a digital signature using ML-DSA-65.',
    detail: 'ML-DSA-65 produces 3,309-byte signatures (vs 64 bytes for ECDSA P-256).',
    output: `CKR_OK
  Signature Length: 3,309 bytes
  Algorithm:       ML-DSA-65
  NIST Level:      3
  Hedged Signing:  YES (rnd ≠ 0, per FIPS 204 §3.4)
  Note:            Hedged mode recommended for side-channel protection`,
    classicalEquivalent: 'CKM_ECDSA with P-256 → 64-byte signature (51x smaller)',
    vendorNotes: {
      onPrem: 'All vendors: native ML-DSA with hedged signing. Entrust also supports SLH-DSA',
      cloud:
        'AWS CloudHSM: ML-DSA via vendor-defined PKCS#11 mechanisms. Azure Dedicated HSM (Thales Luna 7) can take the Luna firmware upgrade for existing customers, but the service is being retired and accepts no new customers (Microsoft supports existing customers until July 31, 2028). Google Cloud HSM: no PQC at the HSM level',
    },
  },
  {
    id: 'verify',
    step: 6,
    name: 'Verify ML-DSA Signature',
    command: `// Message-based verification, as the live HSM runs it (PKCS#11 v3.0+)
C_MessageVerifyInit(hSession, &mechanism, hVerifyKey)   // mechanism = CKM_ML_DSA
C_VerifyMessage(
  hSession,
  &params,        // CK_SIGN_ADDITIONAL_CONTEXT, same as step 5
  paramsLen,
  data,           // Original message
  dataLen,
  signature,      // Signature from step 5
  signatureLen    // 3,309 bytes
)
C_MessageVerifyFinal(hSession)`,
    description: 'Verify the ML-DSA-65 signature against the original data.',
    detail:
      'Verification can be performed with the public key outside the HSM, but using the HSM gives validated code only when the algorithm is CAVP-tested (or vendor-affirmed where an IG permits it) and the module runs in its approved mode; check the Security Policy, which lists any untested algorithm as non-approved. The operation returns CKR_OK for valid signatures or CKR_SIGNATURE_INVALID.',
    output: `CKR_OK
  Verification:    VALID
  Algorithm:       ML-DSA-65
  Public Key Size: 1,952 bytes
  Signature Valid: TRUE`,
    classicalEquivalent: 'CKM_ECDSA verify — same API, 64-byte signature input',
    vendorNotes: {
      onPrem: 'All vendors: native verification. Public key can also verify outside HSM',
      cloud:
        'Public-key verification does not need the private key, so it can run outside the HSM; check each service’s documentation for HSM-side verification',
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
  stateTemplate,     // CKA_HSS_KEYS_REMAINING
  1
)

// CRITICAL: State must persist to NVRAM after every sign`,
    description: 'Check remaining one-time signatures for an LMS/HSS stateful key.',
    detail:
      'LMS/HSS and XMSS are stateful hash-based schemes: each leaf can only sign ONCE. The HSM must atomically update NVRAM state after every signing operation. Power failure during state update can brick the key. NSA’s CNSA 2.0 FAQ says to implement signing and state management in hardware, such as an HSM, approves only LMS and XMSS for use in NSS, and does not allow the multi-tree HSS and XMSSMT; NIST SP 800-208 requires key and signature generation in hardware cryptographic modules that do not allow secret keying material to be exported. PKCS#11 v3.2 defines CKA_HSS_KEYS_REMAINING for HSS private keys.',
    output: `CKR_OK
  Key Type:              CKK_HSS
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

// ── Catalog-derived headline status ───────────────────────────────────────────
// A vendor's overall PQC maturity is the SINGLE SOURCE OF TRUTH in the central
// product catalog. Map catalog availability → this module's display vocabulary.
const AVAIL_TO_SUPPORT: Record<CatalogAvailability, PqcSupportStatusKey> = {
  available: 'production',
  partial: 'limited',
  roadmap: 'roadmap',
  none: 'roadmap',
  unverified: 'roadmap',
}

/** Headline PQC support status for a vendor, derived live from the central catalog. */
export function getVendorPqcSupportStatus(v: HSMVendor): PqcSupportStatusKey {
  const status = getCatalogStatus(v.catalogName)
  return status ? AVAIL_TO_SUPPORT[status.availability] : 'roadmap'
}

export const STATUS_LABELS: Record<PqcSupportStatusKey, { label: string; className: string }> = {
  production: {
    label: 'AVAILABLE',
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
