export interface HSMVendor {
  id: string
  name: string
  product: string
  pqcSupportStatus: 'production' | 'beta' | 'roadmap' | 'limited'
  fips140Level: string
  supportedPQCAlgorithms: string[]
  formFactor: 'network' | 'pcie' | 'cloud' | 'usb'
  notes: string
  firmwareVersion: string
}

export interface PKCS11Operation {
  id: string
  step: number
  name: string
  command: string
  description: string
  detail: string
  output: string
}

export const HSM_VENDORS: HSMVendor[] = [
  {
    id: 'thales-luna',
    name: 'Thales',
    product: 'Luna Network HSM 7',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'SLH-DSA', 'LMS/HSS'],
    formFactor: 'network',
    notes:
      'Full PQC support in firmware 7.8.4+. Supports hybrid key generation and composite certificates. Luna Client 10.7+ required for PKCS#11 PQC mechanisms.',
    firmwareVersion: '7.8.4+',
  },
  {
    id: 'entrust-nshield',
    name: 'Entrust',
    product: 'nShield 5',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-3 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-768/1024', 'ML-DSA-44/65/87', 'LMS/HSS', 'XMSS'],
    formFactor: 'network',
    notes:
      'PQC support via CodeSafe SDK and nShield 5 firmware. Supports PQC-ready certificate enrollment. Integration with Entrust PKI for hybrid certificate issuance.',
    firmwareVersion: '13.6+',
  },
  {
    id: 'utimaco',
    name: 'Utimaco',
    product: 'SecurityServer Se Gen2',
    pqcSupportStatus: 'production',
    fips140Level: 'FIPS 140-2 Level 4 / FIPS 140-3 pending',
    supportedPQCAlgorithms: ['ML-KEM-512/768/1024', 'ML-DSA-44/65/87', 'XMSS', 'LMS'],
    formFactor: 'pcie',
    notes:
      'PQC support via Q-safe firmware extension. Highest physical security (Level 4). Supports custom PQC algorithm loading through CryptoServer SDK. Available in network and PCIe form factors.',
    firmwareVersion: '5.0+',
  },
  {
    id: 'marvell',
    name: 'Marvell',
    product: 'LiquidSecurity 2 (LS2)',
    pqcSupportStatus: 'beta',
    fips140Level: 'FIPS 140-3 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-768', 'ML-DSA-65', 'LMS'],
    formFactor: 'pcie',
    notes:
      'High-throughput PCIe HSM with hardware PQC acceleration. PQC algorithms in beta firmware. Used in cloud infrastructure and financial transaction processing.',
    firmwareVersion: 'Beta firmware',
  },
  {
    id: 'aws-cloudhsm',
    name: 'AWS',
    product: 'CloudHSM',
    pqcSupportStatus: 'limited',
    fips140Level: 'FIPS 140-2 Level 3',
    supportedPQCAlgorithms: ['ML-KEM-768 (via SDK)', 'ML-DSA-65 (via SDK)'],
    formFactor: 'cloud',
    notes:
      'PQC support through AWS Crypto Tools SDK integration. Native PKCS#11 PQC mechanisms not yet available. AWS KMS provides PQC TLS endpoints. Managed service with multi-AZ redundancy.',
    firmwareVersion: 'SDK-dependent',
  },
  {
    id: 'azure-dhsm',
    name: 'Microsoft',
    product: 'Azure Dedicated HSM',
    pqcSupportStatus: 'roadmap',
    fips140Level: 'FIPS 140-2 Level 3',
    supportedPQCAlgorithms: ['Roadmap: ML-KEM, ML-DSA'],
    formFactor: 'cloud',
    notes:
      'Based on Thales Luna hardware. PQC roadmap aligned with Thales firmware updates. Azure Key Vault Managed HSM provides a higher-level abstraction. PQC preview expected 2026.',
    firmwareVersion: 'Pending Thales firmware',
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
      'The private key never leaves the HSM. CKA_SENSITIVE=TRUE ensures the private key cannot be exported in plaintext. CKA_EXTRACTABLE=FALSE prevents any form of export. The HSM uses its internal DRBG seeded with hardware entropy.',
    output: `CKR_OK
  Public Key Handle:  0x00000042
  Private Key Handle: 0x00000043
  Algorithm:          ML-KEM-768
  Public Key Size:    1,184 bytes
  Token Object:       YES (persistent)`,
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
      'Public keys can always be exported (CKA_SENSITIVE does not apply). The 1,184-byte public key is used by peers to encapsulate shared secrets. In a TLS handshake, this would be sent in the ServerKeyExchange message.',
    output: `CKR_OK
  Attribute:    CKA_VALUE
  Length:       1,184 bytes
  Key Type:     CKK_ML_KEM
  Exportable:   YES (public key)`,
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
      'ML-KEM encapsulation produces a ciphertext and a shared secret. The shared secret is used as a KEK to wrap the actual session key. The 1,088-byte ciphertext is sent to the private key holder. This replaces RSA-OAEP key wrapping.',
    output: `CKR_OK
  Wrapped Key Length: 1,088 bytes
  Mechanism:         CKM_ML_KEM_ENCAPSULATE
  KEM Ciphertext:    1,088 bytes
  Shared Secret:     32 bytes (internal)`,
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
  },
  {
    id: 'sign',
    step: 5,
    name: 'Sign with ML-DSA',
    command: `C_Sign(
  hSession,
  data,           // Message to sign
  dataLen,        // Message length
  signature,      // Output buffer
  &signatureLen   // ML-DSA-65: 3,309 bytes
)
// After C_SignInit(hSession, &mechanism, hSignKey)
// mechanism = CKM_ML_DSA`,
    description: 'Create a digital signature using ML-DSA-65.',
    detail:
      'ML-DSA-65 produces 3,309-byte signatures (vs 64 bytes for ECDSA P-256). The signing key must have been generated with CKM_ML_DSA_KEY_PAIR_GEN. Signing is performed inside the HSM; only the signature is returned. ML-DSA is a stateless scheme, unlike LMS/XMSS.',
    output: `CKR_OK
  Signature Length: 3,309 bytes
  Algorithm:       ML-DSA-65
  NIST Level:      3
  Deterministic:   YES`,
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
