// SPDX-License-Identifier: GPL-3.0-only

export interface KeyHierarchyLevel {
  id: string
  name: string
  description: string
  classicalAlgorithm: string
  pqcAlgorithm: string
  hybridAlgorithm: string
  rotationInterval: string
}

export interface EnvelopeEncryptionStep {
  id: string
  step: number
  title: string
  classicalDescription: string
  pqcDescription: string
  classicalArtifact: string
  pqcArtifact: string
  classicalSize: string
  pqcSize: string
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

export interface HybridCombinerMode {
  id: string
  name: string
  classical: string
  pqc: string
  combiner: string
  outputKeySize: number
  totalOverhead: string
  useCase: string
}

export const KEY_HIERARCHY_LEVELS: KeyHierarchyLevel[] = [
  {
    id: 'root-kek',
    name: 'Root Key Encryption Key (Root KEK)',
    description:
      'Top-level master key stored in HSM. Wraps zone KEKs. Rotated infrequently (5-15 years). Must be the most secure key in the hierarchy.',
    classicalAlgorithm: 'RSA-4096 or AES-256-KW',
    pqcAlgorithm: 'ML-KEM-1024 + HKDF-SHA-256',
    hybridAlgorithm: 'RSA-4096 + ML-KEM-1024 → HKDF combiner',
    rotationInterval: '5-15 years',
  },
  {
    id: 'zone-kek',
    name: 'Zone Key Encryption Key (Zone KEK)',
    description:
      'Regional or departmental KEK derived from Root KEK. Wraps data encryption keys for a specific zone (region, business unit, or application tier). Enables key isolation.',
    classicalAlgorithm: 'RSA-3072 or AES-256-KW',
    pqcAlgorithm: 'ML-KEM-768 + HKDF-SHA-256',
    hybridAlgorithm: 'P-256 + ML-KEM-768 → HKDF combiner',
    rotationInterval: '1-3 years',
  },
  {
    id: 'dek',
    name: 'Data Encryption Key (DEK)',
    description:
      'Symmetric key that encrypts actual data (files, database records, messages). Generated per-operation or per-session. Wrapped by zone KEK for storage.',
    classicalAlgorithm: 'AES-256-GCM',
    pqcAlgorithm: 'AES-256-GCM (unchanged — symmetric keys are quantum-safe at 256-bit)',
    hybridAlgorithm: 'AES-256-GCM (no change needed)',
    rotationInterval: '90 days - 1 year',
  },
]

export const ENVELOPE_ENCRYPTION_STEPS: EnvelopeEncryptionStep[] = [
  {
    id: 'generate-kek',
    step: 1,
    title: 'Generate KEK Pair',
    classicalDescription: 'Generate RSA-2048 key pair. Public key is used by clients to wrap DEKs.',
    pqcDescription:
      'Generate ML-KEM-768 key pair. Public encapsulation key is distributed to clients.',
    classicalArtifact: 'RSA-2048 Public Key',
    pqcArtifact: 'ML-KEM-768 Encapsulation Key',
    classicalSize: '256 bytes',
    pqcSize: '1,184 bytes',
  },
  {
    id: 'encapsulate',
    step: 2,
    title: 'Encapsulate / Wrap',
    classicalDescription:
      'Client uses RSA-OAEP to directly encrypt the 32-byte DEK with the KEK public key. One step.',
    pqcDescription:
      'Client runs ML-KEM.Encaps(ek) → produces ciphertext (ct) and shared secret (ss). Two outputs from one operation.',
    classicalArtifact: 'RSA-OAEP Ciphertext (wrapped DEK)',
    pqcArtifact: 'ML-KEM Ciphertext + 32-byte Shared Secret',
    classicalSize: '256 bytes ciphertext',
    pqcSize: '1,088 bytes ciphertext + 32 bytes ss',
  },
  {
    id: 'derive-kek',
    step: 3,
    title: 'Derive Wrapping Key (PQC only)',
    classicalDescription:
      'Not needed — RSA-OAEP directly encrypts the DEK. The decrypted output IS the DEK.',
    pqcDescription:
      'Run HKDF-SHA-256(shared_secret, info="kms-envelope-v1") → 256-bit wrapping key. This extra KDF step is required because KEMs produce a random shared secret, not a direct encryption.',
    classicalArtifact: '(skipped)',
    pqcArtifact: '256-bit AES Wrapping Key',
    classicalSize: 'N/A',
    pqcSize: '32 bytes',
  },
  {
    id: 'wrap-dek',
    step: 4,
    title: 'Wrap DEK',
    classicalDescription: '(DEK is already wrapped in step 2 via RSA-OAEP)',
    pqcDescription:
      'Use AES-256-KW (RFC 3394) to wrap the 32-byte DEK with the derived wrapping key. Store the KEM ciphertext alongside the wrapped DEK.',
    classicalArtifact: 'Wrapped DEK (from step 2)',
    pqcArtifact: 'AES-KW Wrapped DEK (40 bytes)',
    classicalSize: '256 bytes total',
    pqcSize: '1,088 + 40 = 1,128 bytes total',
  },
  {
    id: 'decrypt',
    step: 5,
    title: 'Decapsulate / Unwrap',
    classicalDescription:
      'Server uses RSA-OAEP private key to decrypt the ciphertext → recovers the 32-byte DEK directly.',
    pqcDescription:
      'Server runs ML-KEM.Decaps(dk, ct) → shared secret → HKDF → wrapping key → AES-KW unwrap → DEK. Multi-step but all happens server-side.',
    classicalArtifact: 'Recovered DEK',
    pqcArtifact: 'Recovered DEK (same 32 bytes)',
    classicalSize: '32 bytes',
    pqcSize: '32 bytes',
  },
]

export const HYBRID_COMBINER_MODES: HybridCombinerMode[] = [
  {
    id: 'x25519-mlkem768',
    name: 'X25519 + ML-KEM-768',
    classical: 'X25519 (32-byte shared secret)',
    pqc: 'ML-KEM-768 (32-byte shared secret)',
    combiner: 'HKDF-SHA-256(x25519_ss || mlkem_ss, info="hybrid-kek")',
    outputKeySize: 32,
    totalOverhead: '32 + 1,088 = 1,120 bytes ciphertext',
    useCase: 'TLS 1.3, general purpose — recommended by NIST SP 800-227',
  },
  {
    id: 'p256-mlkem768',
    name: 'ECDH P-256 + ML-KEM-768',
    classical: 'ECDH P-256 (32-byte shared secret)',
    pqc: 'ML-KEM-768 (32-byte shared secret)',
    combiner: 'HKDF-SHA-256(ecdh_ss || mlkem_ss, info="hybrid-kek")',
    outputKeySize: 32,
    totalOverhead: '65 + 1,088 = 1,153 bytes ciphertext',
    useCase: 'FIPS-compliant environments (P-256 is FIPS-approved curve)',
  },
  {
    id: 'x25519-mlkem1024',
    name: 'X25519 + ML-KEM-1024',
    classical: 'X25519 (32-byte shared secret)',
    pqc: 'ML-KEM-1024 (32-byte shared secret)',
    combiner: 'HKDF-SHA-256(x25519_ss || mlkem_ss, info="hybrid-kek")',
    outputKeySize: 32,
    totalOverhead: '32 + 1,568 = 1,600 bytes ciphertext',
    useCase: 'High-security environments — NIST Level 5',
  },
  {
    id: 'xwing',
    name: 'X-Wing (X25519 + ML-KEM-768 combined)',
    classical: 'X25519 (built-in)',
    pqc: 'ML-KEM-768 (built-in)',
    combiner: 'SHA-256(xwing_label || ss_mlkem || ss_x25519 || ct_mlkem || pk_x25519)',
    outputKeySize: 32,
    totalOverhead: '1,120 bytes (combined)',
    useCase: 'Google Cloud KMS — single standardized hybrid KEM construction',
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
    publicKeyBytes: 65,
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
]

export const ROTATION_POLICIES: RotationPolicy[] = [
  {
    id: 'tls-server',
    name: 'TLS Server Certificates',
    description:
      'Server certificates for web services and APIs. Short-lived to limit compromise impact.',
    rotationInterval:
      '90 days (recommended); max 398 days until March 2026, then 200 days per CA/B Forum SC-081v3, reducing to 47 days by 2029',
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
    codeSigning: { count: 50, algorithm: 'ECDSA P-256', keySize: 65 },
    caKeys: { count: 15, algorithm: 'RSA-4096', keySize: 512 },
    dataEncryption: { count: 100, algorithm: 'AES-256-GCM', keySize: 32 },
    apiAuth: { count: 35, algorithm: 'ECDSA P-256', keySize: 65 },
  },
  targetAlgorithms: {
    tlsCerts: { algorithm: 'ML-DSA-65 + ECDSA P-256 (hybrid)', keySize: 1952 + 65 },
    codeSigning: { algorithm: 'ML-DSA-65', keySize: 1952 },
    caKeys: { algorithm: 'ML-DSA-87', keySize: 2592 },
    dataEncryption: { algorithm: 'AES-256-GCM (unchanged)', keySize: 32 },
    apiAuth: { algorithm: 'ML-DSA-44', keySize: 1312 },
  },
  complianceDeadlines: [
    {
      framework: 'CNSA 2.0 (NSA)',
      deadline: '2027',
      requirement:
        'All new National Security Systems acquisitions must be CNSA 2.0 compliant by January 1, 2027. ML-KEM-1024 and ML-DSA-87 required.',
    },
    {
      framework: 'NIST IR 8547',
      deadline: '2030 / 2035',
      requirement:
        'Deprecate 112-bit classical crypto (RSA-2048, etc.) after 2030. Disallow all classical public-key crypto (RSA, ECDSA, EdDSA, DH, ECDH) after 2035.',
    },
    {
      framework: 'ANSSI & BSI (EU)',
      deadline: 'Transition Phase',
      requirement:
        'European agencies strongly recommend Hybrid implementations (Classical + PQC) during the transition. ANSSI requires PQC for sensitive data by 2030.',
    },
    {
      framework: 'PCI DSS v4.0.1',
      deadline: '2025',
      requirement:
        'Cryptographic inventory required (Req. 12.3.3). Quantum risk assessment expected in future versions.',
    },
    {
      framework: 'DORA (EU)',
      deadline: '2025',
      requirement:
        'ICT risk management framework including cryptographic risk assessment for financial entities.',
    },
  ],
  kmsProviders: [
    {
      id: 'aws-kms',
      name: 'AWS KMS',
      rotationFeature: 'Automatic annual rotation with CreateKey API',
      pqcCapability: 'ML-DSA signing GA, ML-KEM hybrid TLS for API transit',
    },
    {
      id: 'gcp-kms',
      name: 'Google Cloud KMS',
      rotationFeature: 'Key versioning with scheduled rotation',
      pqcCapability: 'ML-KEM-768/1024 GA, X-Wing GA, ML-DSA preview',
    },
    {
      id: 'azure-kv',
      name: 'Azure Key Vault',
      rotationFeature: 'Key Vault auto-rotation with Event Grid triggers',
      pqcCapability: 'ML-KEM integration via SymCrypt, native PQC target 2029',
    },
  ],
}

// ── KMIP Protocol Explorer Data ──────────────────────────────────────────────

export interface KmipOperation {
  id: string
  name: string
  description: string
  kmipXml: string
  kmipResponse: string
  providerApis: Record<string, { code: string; language: string }>
}

export interface KmipPqcKeyType {
  kmipEnum: string
  algorithm: string
  family: 'KEM' | 'Signature'
  nistStandard: string
  publicKeyBytes: number
  secretKeyBytes: number
  artifactBytes: number
  artifactLabel: string
  securityLevel: number
  providerSupport: Record<string, string>
}

export interface KmipSyncStep {
  id: number
  action: 'create' | 'replicate' | 'activate' | 'rotate' | 'destroy'
  title: string
  description: string
  orchestrator: string
  targets: string[]
  kmipSnippet: string
  statuses: Record<string, 'success' | 'pending' | 'in-progress'>
}

export interface KmipReadinessItem {
  id: string
  category: string
  title: string
  description: string
  critical: boolean
}

export const KMIP_OPERATIONS: KmipOperation[] = [
  {
    id: 'create',
    name: 'Create',
    description:
      'Create a new PQC key pair. ML-KEM is asymmetric — KMIP 2.1 uses CreateKeyPair with separate public/private key templates. ML-DSA likewise uses CreateKeyPair.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>CreateKeyPair</Operation>
    <RequestPayload>
      <CommonTemplateAttribute>
        <Attribute>
          <AttributeName>Cryptographic Algorithm</AttributeName>
          <AttributeValue>ML-KEM-768</AttributeValue>
        </Attribute>
      </CommonTemplateAttribute>
      <PrivateKeyTemplateAttribute>
        <Attribute>
          <AttributeName>Cryptographic Usage Mask</AttributeName>
          <AttributeValue>Decrypt</AttributeValue>
        </Attribute>
        <Attribute>
          <AttributeName>Name</AttributeName>
          <AttributeValue>pqc-root-kek-001-priv</AttributeValue>
        </Attribute>
      </PrivateKeyTemplateAttribute>
      <PublicKeyTemplateAttribute>
        <Attribute>
          <AttributeName>Cryptographic Usage Mask</AttributeName>
          <AttributeValue>Encrypt</AttributeValue>
        </Attribute>
        <Attribute>
          <AttributeName>Name</AttributeName>
          <AttributeValue>pqc-root-kek-001-pub</AttributeValue>
        </Attribute>
      </PublicKeyTemplateAttribute>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <ResponseHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </ResponseHeader>
  <BatchItem>
    <Operation>CreateKeyPair</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <PrivateKeyUniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </PrivateKeyUniqueIdentifier>
      <PublicKeyUniqueIdentifier>
        b4c3d2e5-f6a7-8901-bcde-f12345678901
      </PublicKeyUniqueIdentifier>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Create ML-DSA signing key
aws kms create-key \\
  --key-spec ML_DSA_65 \\
  --key-usage SIGN_VERIFY \\
  --description "PQC root signing key"

# Response:
# { "KeyMetadata": {
#     "KeyId": "a3b2c1d4-...",
#     "KeySpec": "ML_DSA_65",
#     "KeyState": "Enabled"
# }}`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Create ML-DSA transit key
vault write transit/keys/pqc-root-kek \\
  type="ml-dsa-65"

# Response:
# Success! Data written to: transit/keys/pqc-root-kek
# Key Version: 1
# Type: ml-dsa-65`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — Create PQC key
curl -X POST https://ciphertrust/api/v1/vault/keys2 \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "name": "pqc-root-kek-001",
    "algorithm": "ML-KEM-768",
    "source": "hsm",
    "usageMask": ["encrypt", "decrypt"]
  }'

# Response: { "id": "a3b2c1d4-...",
#   "algorithm": "ML-KEM-768",
#   "state": "Pre-Active" }`,
        language: 'bash',
      },
    },
  },
  {
    id: 'get',
    name: 'Get',
    description:
      'Retrieve key metadata and attributes. KMIP Get returns the key object with all attributes including PQC-specific sizes.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>Get</Operation>
    <RequestPayload>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <BatchItem>
    <Operation>Get</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <ObjectType>SymmetricKey</ObjectType>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
      <SymmetricKey>
        <KeyBlock>
          <CryptographicAlgorithm>ML-KEM-768</CryptographicAlgorithm>
          <CryptographicLength>768</CryptographicLength>
          <KeyFormatType>Raw</KeyFormatType>
        </KeyBlock>
      </SymmetricKey>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Describe key
aws kms describe-key \\
  --key-id a3b2c1d4-...

# Response:
# { "KeyMetadata": {
#     "KeyId": "a3b2c1d4-...",
#     "KeySpec": "ML_DSA_65",
#     "KeyState": "Enabled",
#     "CreationDate": "2026-03-01T..."
# }}`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Read transit key
vault read transit/keys/pqc-root-kek

# Response:
# Key          Value
# ---          -----
# type         ml-dsa-65
# keys         map[1:1709312400]
# latest_version  1
# min_available_version  0`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — Get key metadata
curl -X GET https://ciphertrust/api/v1/vault/keys2/a3b2c1d4-... \\
  -H "Authorization: Bearer $TOKEN"

# Response: { "id": "a3b2c1d4-...",
#   "name": "pqc-root-kek-001",
#   "algorithm": "ML-KEM-768",
#   "size": 768, "state": "Active" }`,
        language: 'bash',
      },
    },
  },
  {
    id: 'activate',
    name: 'Activate',
    description:
      'Transition a key from Pre-Active to Active state. AWS auto-activates; others require explicit activation.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>Activate</Operation>
    <RequestPayload>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <BatchItem>
    <Operation>Activate</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Keys are auto-activated on creation
# No separate activation step required
# To re-enable a disabled key:
aws kms enable-key \\
  --key-id a3b2c1d4-...`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Keys are active on creation
# To re-enable after deactivation:
vault write transit/keys/pqc-root-kek/config \\
  min_decryption_version=1 \\
  deletion_allowed=false`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — Activate a pre-active key
curl -X PATCH https://ciphertrust/api/v1/vault/keys2/a3b2c1d4-... \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "state": "Active" }'

# Response: { "id": "a3b2c1d4-...",
#   "state": "Active",
#   "activationDate": "2026-03-01T..." }`,
        language: 'bash',
      },
    },
  },
  {
    id: 'wrap',
    name: 'Wrap (Encrypt DEK)',
    description:
      'Use the KEK to wrap a data encryption key. With ML-KEM, this uses encapsulation to produce a shared secret, then AES-KW to wrap the DEK.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>Get</Operation>
    <RequestPayload>
      <UniqueIdentifier>dek-to-wrap-id</UniqueIdentifier>
      <KeyWrappingSpecification>
        <WrappingMethod>Encrypt</WrappingMethod>
        <EncryptionKeyInformation>
          <UniqueIdentifier>
            a3b2c1d4-e5f6-7890-abcd-ef1234567890
          </UniqueIdentifier>
          <CryptographicParameters>
            <BlockCipherMode>NISTKeyWrap</BlockCipherMode>
          </CryptographicParameters>
        </EncryptionKeyInformation>
      </KeyWrappingSpecification>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <BatchItem>
    <Operation>Get</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <ObjectType>SymmetricKey</ObjectType>
      <UniqueIdentifier>dek-to-wrap-id</UniqueIdentifier>
      <SymmetricKey>
        <KeyBlock>
          <KeyValue>
            <!-- Wrapped (encrypted) DEK bytes -->
            <KeyMaterial>BASE64_WRAPPED_DEK...</KeyMaterial>
          </KeyValue>
          <KeyWrappingData>
            <WrappingMethod>Encrypt</WrappingMethod>
          </KeyWrappingData>
        </KeyBlock>
      </SymmetricKey>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Encrypt (wrap DEK with CMK)
aws kms encrypt \\
  --key-id a3b2c1d4-... \\
  --plaintext fileb://dek.bin \\
  --encryption-algorithm SYMMETRIC_DEFAULT

# Response:
# { "CiphertextBlob": "AQIDAHi...",
#   "KeyId": "a3b2c1d4-...",
#   "EncryptionAlgorithm": "SYMMETRIC_DEFAULT" }`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Encrypt (wrap) data
vault write transit/encrypt/pqc-root-kek \\
  plaintext=$(base64 < dek.bin)

# Response:
# Key           Value
# ---           -----
# ciphertext    vault:v1:ABCDEFxyz...
# key_version   1`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — Encrypt (wrap DEK)
curl -X POST https://ciphertrust/api/v1/vault/keys2/a3b2c1d4-.../encrypt \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{
    "plaintext": "BASE64_DEK_BYTES",
    "mode": "NISTKeyWrap"
  }'

# Response: { "ciphertext": "BASE64_WRAPPED..." }`,
        language: 'bash',
      },
    },
  },
  {
    id: 'rotate',
    name: 'Rotate',
    description:
      'Generate a new version of the key. Existing wrapped data can still be decrypted with the old version; new wraps use the latest version.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>ReKey</Operation>
    <RequestPayload>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <BatchItem>
    <Operation>ReKey</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <UniqueIdentifier>
        b4c3d2e5-f6a7-8901-bcde-f12345678901
      </UniqueIdentifier>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Automatic rotation (annual)
aws kms enable-key-rotation \\
  --key-id a3b2c1d4-...

# Or manual: create new key + update alias
aws kms create-key --key-spec ML_DSA_65
aws kms update-alias \\
  --alias-name alias/pqc-root \\
  --target-key-id NEW_KEY_ID`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Rotate transit key
vault write -f transit/keys/pqc-root-kek/rotate

# Response:
# Success! Data written to: transit/keys/pqc-root-kek/rotate
# New version: 2
# Old versions still available for decrypt`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — Rotate key version
curl -X POST https://ciphertrust/api/v1/vault/keys2/a3b2c1d4-.../rekey \\
  -H "Authorization: Bearer $TOKEN" \\
  -d '{ "source": "hsm" }'

# Response: { "id": "b4c3d2e5-...",
#   "version": 2, "algorithm": "ML-KEM-768",
#   "state": "Active" }`,
        language: 'bash',
      },
    },
  },
  {
    id: 'destroy',
    name: 'Destroy',
    description:
      'Schedule key destruction. Most providers enforce a waiting period (7-30 days) to prevent accidental data loss.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>2</Major><Minor>1</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>Destroy</Operation>
    <RequestPayload>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <BatchItem>
    <Operation>Destroy</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Schedule key deletion (7-30 day wait)
aws kms schedule-key-deletion \\
  --key-id a3b2c1d4-... \\
  --pending-window-in-days 7

# Response:
# { "KeyId": "a3b2c1d4-...",
#   "KeyState": "PendingDeletion",
#   "DeletionDate": "2026-03-08T..." }`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Enable deletion then destroy
vault write transit/keys/pqc-root-kek/config \\
  deletion_allowed=true

vault delete transit/keys/pqc-root-kek

# Response:
# Success! Data deleted at: transit/keys/pqc-root-kek`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — Destroy key
# First deactivate:
curl -X PATCH https://ciphertrust/api/v1/vault/keys2/a3b2c1d4-... \\
  -d '{ "state": "Deactivated" }'

# Then destroy:
curl -X DELETE https://ciphertrust/api/v1/vault/keys2/a3b2c1d4-... \\
  -H "Authorization: Bearer $TOKEN"`,
        language: 'bash',
      },
    },
  },
]

export const KMIP_PQC_KEY_TYPES: KmipPqcKeyType[] = [
  {
    kmipEnum: 'ML-KEM-512',
    algorithm: 'ML-KEM',
    family: 'KEM',
    nistStandard: 'FIPS 203',
    publicKeyBytes: 800,
    secretKeyBytes: 1632,
    artifactBytes: 768,
    artifactLabel: 'Ciphertext',
    securityLevel: 1,
    providerSupport: {
      'aws-kms': 'Hybrid TLS only',
      'gcp-kms': 'N/A',
      'hashicorp-vault': 'N/A',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Available',
    },
  },
  {
    kmipEnum: 'ML-KEM-768',
    algorithm: 'ML-KEM',
    family: 'KEM',
    nistStandard: 'FIPS 203',
    publicKeyBytes: 1184,
    secretKeyBytes: 2400,
    artifactBytes: 1088,
    artifactLabel: 'Ciphertext',
    securityLevel: 3,
    providerSupport: {
      'aws-kms': 'Hybrid TLS (GA)',
      'gcp-kms': 'Preview',
      'hashicorp-vault': 'N/A',
      'thales-ciphertrust': 'TLS Preview',
      'fortanix-dsm': 'Available',
    },
  },
  {
    kmipEnum: 'ML-KEM-1024',
    algorithm: 'ML-KEM',
    family: 'KEM',
    nistStandard: 'FIPS 203',
    publicKeyBytes: 1568,
    secretKeyBytes: 3168,
    artifactBytes: 1568,
    artifactLabel: 'Ciphertext',
    securityLevel: 5,
    providerSupport: {
      'aws-kms': 'Hybrid TLS only',
      'gcp-kms': 'Preview',
      'hashicorp-vault': 'N/A',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Available',
    },
  },
  {
    kmipEnum: 'ML-DSA-44',
    algorithm: 'ML-DSA',
    family: 'Signature',
    nistStandard: 'FIPS 204',
    publicKeyBytes: 1312,
    secretKeyBytes: 2560,
    artifactBytes: 2420,
    artifactLabel: 'Signature',
    securityLevel: 2,
    providerSupport: {
      'aws-kms': 'GA',
      'gcp-kms': 'Preview',
      'hashicorp-vault': 'Experimental',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Planned',
    },
  },
  {
    kmipEnum: 'ML-DSA-65',
    algorithm: 'ML-DSA',
    family: 'Signature',
    nistStandard: 'FIPS 204',
    publicKeyBytes: 1952,
    secretKeyBytes: 4032,
    artifactBytes: 3309,
    artifactLabel: 'Signature',
    securityLevel: 3,
    providerSupport: {
      'aws-kms': 'GA',
      'gcp-kms': 'Preview',
      'hashicorp-vault': 'Experimental',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Planned',
    },
  },
  {
    kmipEnum: 'ML-DSA-87',
    algorithm: 'ML-DSA',
    family: 'Signature',
    nistStandard: 'FIPS 204',
    publicKeyBytes: 2592,
    secretKeyBytes: 4896,
    artifactBytes: 4627,
    artifactLabel: 'Signature',
    securityLevel: 5,
    providerSupport: {
      'aws-kms': 'GA',
      'gcp-kms': 'N/A',
      'hashicorp-vault': 'Experimental',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Planned',
    },
  },
  {
    kmipEnum: 'SLH-DSA-SHA2-128s',
    algorithm: 'SLH-DSA',
    family: 'Signature',
    nistStandard: 'FIPS 205',
    publicKeyBytes: 32,
    secretKeyBytes: 64,
    artifactBytes: 7856,
    artifactLabel: 'Signature',
    securityLevel: 1,
    providerSupport: {
      'aws-kms': 'N/A',
      'gcp-kms': 'Preview',
      'hashicorp-vault': 'Experimental',
      'thales-ciphertrust': 'N/A',
      'fortanix-dsm': 'Planned',
    },
  },
  {
    kmipEnum: 'SLH-DSA-SHA2-192s',
    algorithm: 'SLH-DSA',
    family: 'Signature',
    nistStandard: 'FIPS 205',
    publicKeyBytes: 48,
    secretKeyBytes: 96,
    artifactBytes: 16224,
    artifactLabel: 'Signature',
    securityLevel: 3,
    providerSupport: {
      'aws-kms': 'N/A',
      'gcp-kms': 'Preview',
      'hashicorp-vault': 'Experimental',
      'thales-ciphertrust': 'N/A',
      'fortanix-dsm': 'Planned',
    },
  },
  {
    kmipEnum: 'SLH-DSA-SHA2-256s',
    algorithm: 'SLH-DSA',
    family: 'Signature',
    nistStandard: 'FIPS 205',
    publicKeyBytes: 64,
    secretKeyBytes: 128,
    artifactBytes: 29792,
    artifactLabel: 'Signature',
    securityLevel: 5,
    providerSupport: {
      'aws-kms': 'N/A',
      'gcp-kms': 'N/A',
      'hashicorp-vault': 'Experimental',
      'thales-ciphertrust': 'N/A',
      'fortanix-dsm': 'Planned',
    },
  },
]

export const KMIP_SYNC_SCENARIO: KmipSyncStep[] = [
  {
    id: 1,
    action: 'create',
    title: 'Create ML-KEM-768 KEK',
    description:
      'KMIP orchestrator creates a new ML-KEM-768 key in the primary HSM, then registers the key ID across all connected backends.',
    orchestrator: 'Thales CipherTrust',
    targets: ['Primary HSM', 'AWS KMS', 'Google Cloud KMS'],
    kmipSnippet:
      '<Operation>CreateKeyPair</Operation>\n<CryptographicAlgorithm>ML-KEM-768</CryptographicAlgorithm>',
    statuses: { 'Primary HSM': 'success', 'AWS KMS': 'pending', 'Google Cloud KMS': 'pending' },
  },
  {
    id: 2,
    action: 'replicate',
    title: 'Replicate to Cloud KMS',
    description:
      'The orchestrator exports the wrapped key material from the primary HSM and imports it into each cloud KMS backend using provider-specific BYOK APIs.',
    orchestrator: 'Thales CipherTrust',
    targets: ['Primary HSM', 'AWS KMS', 'Google Cloud KMS'],
    kmipSnippet:
      '<Operation>Get</Operation>\n<KeyWrappingSpecification>...</KeyWrappingSpecification>',
    statuses: {
      'Primary HSM': 'success',
      'AWS KMS': 'in-progress',
      'Google Cloud KMS': 'in-progress',
    },
  },
  {
    id: 3,
    action: 'activate',
    title: 'Activate Across All Providers',
    description:
      'Orchestrator sends KMIP Activate to all backends simultaneously. Cloud providers that auto-activate acknowledge the state change.',
    orchestrator: 'Thales CipherTrust',
    targets: ['Primary HSM', 'AWS KMS', 'Google Cloud KMS'],
    kmipSnippet:
      '<Operation>Activate</Operation>\n<UniqueIdentifier>a3b2c1d4-...</UniqueIdentifier>',
    statuses: { 'Primary HSM': 'success', 'AWS KMS': 'success', 'Google Cloud KMS': 'success' },
  },
  {
    id: 4,
    action: 'rotate',
    title: 'Coordinated Key Rotation',
    description:
      'Orchestrator generates a new key version in the primary HSM, then propagates the rotation to all cloud backends while maintaining access to previous versions for decryption.',
    orchestrator: 'Thales CipherTrust',
    targets: ['Primary HSM', 'AWS KMS', 'Google Cloud KMS'],
    kmipSnippet: '<Operation>ReKey</Operation>\n<UniqueIdentifier>a3b2c1d4-...</UniqueIdentifier>',
    statuses: {
      'Primary HSM': 'success',
      'AWS KMS': 'in-progress',
      'Google Cloud KMS': 'in-progress',
    },
  },
  {
    id: 5,
    action: 'destroy',
    title: 'Coordinated Destruction',
    description:
      "After all data is re-encrypted with the new key version, the orchestrator schedules destruction of the old version across all providers, respecting each provider's minimum waiting period.",
    orchestrator: 'Thales CipherTrust',
    targets: ['Primary HSM', 'AWS KMS', 'Google Cloud KMS'],
    kmipSnippet:
      '<Operation>Destroy</Operation>\n<UniqueIdentifier>a3b2c1d4-...</UniqueIdentifier>',
    statuses: { 'Primary HSM': 'success', 'AWS KMS': 'success', 'Google Cloud KMS': 'success' },
  },
]

export const KMIP_READINESS_CHECKLIST: KmipReadinessItem[] = [
  {
    id: 'server-version',
    category: 'Infrastructure',
    title: 'KMIP Server v2.1+',
    description:
      'Verify your KMIP server supports protocol version 2.1 or later, which includes PQC CryptographicAlgorithm enums for ML-KEM and ML-DSA.',
    critical: true,
  },
  {
    id: 'client-library',
    category: 'Infrastructure',
    title: 'KMIP Client Library PQC Support',
    description:
      'Ensure your KMIP client library (PyKMIP, Bouncy Castle KMIP, etc.) handles the new PQC key type enumerations and larger key material payloads.',
    critical: true,
  },
  {
    id: 'provider-endpoints',
    category: 'Connectivity',
    title: 'Provider KMIP Endpoint Compatibility',
    description:
      'Test KMIP connectivity to each backend: on-prem HSMs (Luna, nShield) typically expose KMIP natively; cloud KMS may require a KMIP proxy like CipherTrust or Vault.',
    critical: true,
  },
  {
    id: 'key-type-mapping',
    category: 'Configuration',
    title: 'PQC Key Type Mapping Verification',
    description:
      "Create test keys for each PQC algorithm (ML-KEM-768, ML-DSA-65) via KMIP and verify they appear correctly in each provider's native console.",
    critical: true,
  },
  {
    id: 'rotation-propagation',
    category: 'Operations',
    title: 'Cross-Provider Rotation Test',
    description:
      'Trigger a KMIP ReKey operation and verify the new key version propagates to all connected backends within acceptable latency.',
    critical: false,
  },
  {
    id: 'buffer-sizing',
    category: 'Configuration',
    title: 'Buffer Size Configuration',
    description:
      'PQC key material is 4-20x larger than classical. Verify KMIP message buffers, TLS record sizes, and database column widths accommodate ML-KEM-1024 (3,168 B secret key).',
    critical: false,
  },
  {
    id: 'audit-logging',
    category: 'Compliance',
    title: 'KMIP Operation Audit Trail',
    description:
      'Confirm all KMIP operations (Create, Activate, Wrap, Rotate, Destroy) are logged with timestamps, operator IDs, and key identifiers for compliance auditing.',
    critical: false,
  },
  {
    id: 'failover-testing',
    category: 'Operations',
    title: 'KMIP Failover / HA Testing',
    description:
      'Test KMIP orchestrator failover: if the primary KMIP server goes down, verify that the secondary takes over key operations without data loss or state corruption.',
    critical: false,
  },
]
