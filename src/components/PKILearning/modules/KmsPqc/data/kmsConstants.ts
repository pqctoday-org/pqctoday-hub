// SPDX-License-Identifier: AGPL-3.0-only

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
    description: 'Top-level master key stored in HSM. Wraps zone KEKs. Rotated infrequently.',
    classicalAlgorithm: 'RSA-4096 or AES-256-KW',
    pqcAlgorithm: 'ML-KEM-1024 + HKDF-SHA-256',
    hybridAlgorithm: 'RSA-4096 + ML-KEM-1024 → HKDF combiner',
    rotationInterval: '5-15 years (this module’s planning assumption, not a measurement)',
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
      'The shared secret key from ML-KEM Encaps does not require further key derivation; this demo runs HKDF-SHA-256(shared_secret, salt="kms-envelope-salt-v1", info="kms-envelope-v1") → 256-bit wrapping key to bind it to this protocol and version.',
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
    // ML-KEM secret first, as SP 800-56C approved-first ordering suggests when the ML-KEM
    // implementation is the validated one.
    combiner: 'HKDF-SHA-256(mlkem_ss || x25519_ss, info="hybrid-kek")',
    outputKeySize: 32,
    totalOverhead: '32 + 1,088 = 1,120 bytes ciphertext',
    useCase:
      "KMS key wrap, general purpose — this module's own combiner, one of the choices SP 800-227 Section 4.6 allows. The TLS group X25519MLKEM768 (RFC 10024) is a different construction: it concatenates the same two secrets, ML-KEM first, and feeds them to the TLS 1.3 key schedule, not to this HKDF call",
  },
  {
    id: 'p256-mlkem768',
    name: 'ECDH P-256 + ML-KEM-768',
    classical: 'ECDH P-256 (32-byte shared secret)',
    pqc: 'ML-KEM-768 (32-byte shared secret)',
    combiner: 'HKDF-SHA-256(ecdh_ss || mlkem_ss, info="hybrid-kek")',
    outputKeySize: 32,
    totalOverhead: '65 + 1,088 = 1,153 bytes ciphertext',
    useCase:
      'FIPS-oriented — P-256 is a FIPS-approved curve and its secret goes first, so the ECDH implementation is the one that must be validated (RFC 10024 orders SecP256r1MLKEM768 the same way for this reason)',
  },
  {
    id: 'p384-mlkem1024',
    name: 'ECDH P-384 + ML-KEM-1024',
    classical: 'ECDH P-384 (48-byte shared secret)',
    pqc: 'ML-KEM-1024 (32-byte shared secret)',
    combiner: 'HKDF-SHA-256(ecdh_ss || mlkem_ss, info="hybrid-kek")',
    outputKeySize: 32,
    totalOverhead: '97 + 1,568 = 1,665 bytes ciphertext',
    useCase:
      'High-security environments, NIST Level 5 — the pairing standardised as the TLS group SecP384r1MLKEM1024 (RFC 10024) and registered as MLKEM1024-P384 in the HPKE post-quantum draft. No standard defines an X25519 + ML-KEM-1024 pairing',
  },
  {
    id: 'xwing',
    name: 'X-Wing (X25519 + ML-KEM-768 combined)',
    classical: 'X25519 (built-in)',
    pqc: 'ML-KEM-768 (built-in)',
    combiner:
      'SHA3-256(ss_mlkem || ss_x25519 || ct_x25519 || pk_x25519 || label), label=0x5c2e2f2f5e5c',
    outputKeySize: 32,
    totalOverhead: '1,120 bytes (combined)',
    useCase: 'Google Cloud KMS — X-Wing hybrid KEM (draft-connolly-cfrg-xwing-kem-11)',
  },
]

export const KEY_SIZE_COMPARISONS: KeySizeComparison[] = [
  {
    algorithm: 'RSA-2048',
    type: 'classical',
    publicKeyBytes: 256,
    privateKeyBytes: 1192,
    signatureOrCiphertextBytes: 256,
    nistLevel: 'About 112-bit classical',
    quantumSafe: false,
  },
  {
    algorithm: 'RSA-3072',
    type: 'classical',
    publicKeyBytes: 384,
    privateKeyBytes: 1766,
    signatureOrCiphertextBytes: 384,
    nistLevel: 'About 128-bit classical',
    quantumSafe: false,
  },
  {
    // RSA-4096 is the root KEK's classical option. Private size is a typical PKCS#1 DER
    // length (it varies by a few bytes between keys). SP 800-57 Part 1 Rev. 5 Table 2 has no
    // 4096-bit row; it puts RSA-3072 at 128-bit and RSA-7680 at 192-bit.
    algorithm: 'RSA-4096',
    type: 'classical',
    publicKeyBytes: 512,
    privateKeyBytes: 2348,
    signatureOrCiphertextBytes: 512,
    nistLevel: 'Between 128-bit and 192-bit classical',
    quantumSafe: false,
  },
  {
    algorithm: 'ECDSA P-256',
    type: 'classical',
    publicKeyBytes: 65,
    privateKeyBytes: 32,
    signatureOrCiphertextBytes: 64,
    nistLevel: 'About 128-bit classical',
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
      'Server certificates for web services and APIs. A shorter validity limits how long a compromised key stays useful.',
    rotationInterval:
      'Publicly trusted TLS certificates: maximum validity 200 days from 15 March 2026, 100 days from 15 March 2027 and 47 days from 15 March 2029. Certificates from a private CA follow that CA\u2019s own policy, and renewing well inside the limit with automation is a practice, not a rule',
    applicableTo: ['RSA-2048', 'ECDSA P-256', 'ML-DSA-65', 'Hybrid'],
    complianceFramework:
      'CA/B Forum Baseline Requirements (publicly trusted TLS certificates only)',
  },
  {
    id: 'code-signing',
    name: 'Code Signing Keys',
    description: 'Keys used to sign software releases, firmware updates, and container images.',
    rotationInterval:
      'Illustrative range of 2-3 years for a private signature key. NIST SP 800-57 Part 1 Rev. 5 suggests about 1 to 3 years and calls such figures rough order-of-magnitude guidelines; the right period depends on how the key is protected, how often it signs and what a compromise would cost',
    applicableTo: ['RSA-3072', 'ECDSA P-384', 'ML-DSA-65', 'SLH-DSA-128f'],
    complianceFramework: 'NIST SP 800-57 Part 1 Rev. 5 (guidance, not a mandate)',
  },
  {
    id: 'ca-intermediate',
    name: 'Intermediate CA Keys',
    description:
      'CA keys used to issue end-entity certificates. Long-lived with strict HSM protection.',
    rotationInterval:
      'Illustrative range of 5-10 years, set by the CA\u2019s own policy, the validity of its certificate and how its key is protected. Not a figure from NIST SP 800-57',
    applicableTo: ['RSA-4096', 'ECDSA P-384', 'ML-DSA-87', 'Composite'],
    complianceFramework: 'CA policy (CP/CPS); not a fixed standard maximum',
  },
  {
    id: 'root-ca',
    name: 'Root CA Keys',
    description: 'Trust anchors. Longest-lived keys with highest security requirements.',
    rotationInterval:
      'Illustrative range of 15-25 years, set by the CA\u2019s own policy, any root program it joins and how its key is protected. Not a figure from NIST SP 800-57',
    applicableTo: ['RSA-4096', 'ECDSA P-384', 'ML-DSA-87', 'SLH-DSA-256s'],
    complianceFramework:
      'CA policy (CP/CPS) and root program requirements; not a fixed standard maximum',
  },
  {
    id: 'data-encryption',
    name: 'Data Encryption Keys (DEK)',
    description: 'Symmetric keys used for encrypting data at rest or in transit.',
    rotationInterval:
      'Illustrative range of 1-2 years of encryption use. NIST SP 800-57 Part 1 Rev. 5 Table 1 suggests under 2 years for encrypting and under that plus 3 years for decrypting, and the amount of data one key protects can set a shorter limit',
    applicableTo: ['AES-256-GCM', 'AES-256-CBC'],
    complianceFramework: 'NIST SP 800-57 Part 1 Rev. 5 (guidance, not a mandate)',
  },
  {
    id: 'kek',
    name: 'Key Encryption Keys (KEK)',
    description: 'Keys used to wrap/unwrap other keys. Critical for key hierarchy security.',
    rotationInterval:
      'Illustrative. NIST SP 800-57 Part 1 Rev. 5 Table 1 suggests under 2 years of wrapping use and under that plus 3 years of unwrapping for a symmetric key-wrapping key; for asymmetric key-transport keys, under 2 years for the private key and 1 to 2 years for the public key',
    applicableTo: ['RSA-3072', 'ML-KEM-768', 'AES-256-KW'],
    complianceFramework: 'NIST SP 800-57 Part 1 Rev. 5 (guidance, not a mandate)',
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
        'NIST IR 8547 (final, October 2026) covers both signatures and key establishment: the quantum-vulnerable schemes it lists (RSA, ECDSA, EdDSA, finite-field and elliptic-curve DH and MQV) are deprecated after 2030 and disallowed under NIST standards and guidelines after 2035. Separately, as NIST IR 8547 describes them, Executive Order 14412 and OMB Memorandum M-26-15 require the Government\u2019s most sensitive systems to adopt PQC for key establishment by 31 December 2030 and for digital signatures by 31 December 2031.',
    },
    {
      framework: 'ANSSI & BSI (EU)',
      deadline: 'Transition Phase',
      requirement:
        'European agencies strongly recommend Hybrid implementations (Classical + PQC) during the transition. ANSSI recommends hybrid post-quantum mitigation especially for products offering long-lasting protection of information beyond 2030.',
    },
    {
      framework: 'PCI DSS v4.0.1',
      deadline: '2025',
      requirement:
        'PCI DSS v4.0.1 is the only active version since v4.0 retired on 31 December 2024; the public PCI SSC pages state no PQC algorithm, parameter set or deadline.',
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
      rotationFeature:
        'Automatic rotation covers symmetric encryption KMS keys only (yearly by default, custom period allowed, plus on-demand rotation). ML-DSA and ML-KEM keys are rotated by creating a new key and moving the alias',
      pqcCapability:
        'ML-DSA signing GA; ML-KEM key specs since 26 Oct 2026 (not in the China, Middle East (UAE) and Middle East (Bahrain) Regions); hybrid TLS for API transit',
    },
    {
      id: 'gcp-kms',
      name: 'Google Cloud KMS',
      rotationFeature:
        'Key versioning with scheduled rotation; imported keys have automatic rotation disabled by default',
      pqcCapability:
        "ML-DSA and SLH-DSA signing GA (16 Jul 2026); ML-KEM-768/1024 and X-Wing offered; software protection level only (launch stage: Google's 28 Jul 2026 post announces general availability of ML-KEM key encapsulation and does not name X-Wing; Google's release notes list the KEMs, X-Wing included, as Preview from 23 Sep 2025; checked 30 Oct 2026)",
    },
    {
      id: 'azure-kv',
      name: 'Azure Key Vault',
      rotationFeature: 'Key Vault auto-rotation with Event Grid triggers',
      pqcCapability:
        'ML-KEM integration via SymCrypt; Microsoft-wide goal of early quantum-safe adoption by 2029 (no Key Vault-specific date sourced)',
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
      'Create a new PQC key pair. ML-KEM is asymmetric — KMIP 3.0 (draft) uses CreateKeyPair with separate public/private key templates. ML-DSA likewise uses CreateKeyPair.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>3</Major><Minor>0</Minor>
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
      <Major>3</Major><Minor>0</Minor>
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
        code: `# HashiCorp Vault Enterprise — Create ML-DSA transit key (signing only)
vault write transit/keys/pqc-root-sig \\
  type="ml-dsa" \\
  parameter_set="65"

# Vault transit offers no KEM key type: key encapsulation is not available here.
# Response:
# Success! Data written to: transit/keys/pqc-root-sig`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — create a key
# The CipherTrust Manager REST request shapes are not reproduced here:
# they are not in the sources this module cites. See the REST API
# reference for your CipherTrust Manager version.`,
        language: 'bash',
      },
    },
  },
  {
    id: 'get',
    name: 'Get',
    description: 'Retrieve key metadata and attributes.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>3</Major><Minor>0</Minor>
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
      <ObjectType>PrivateKey</ObjectType>
      <UniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </UniqueIdentifier>
      <PrivateKey>
        <KeyBlock>
          <CryptographicAlgorithm>ML-KEM-768</CryptographicAlgorithm>
          <CryptographicLength>768</CryptographicLength>
          <KeyFormatType>Raw</KeyFormatType>
        </KeyBlock>
      </PrivateKey>
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
vault read transit/keys/pqc-root-sig

# Response:
# Key          Value
# ---          -----
# type         ml-dsa
# keys         map[1:1709312400]
# latest_version  1
# min_available_version  0`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — read key metadata
# The CipherTrust Manager REST request shapes are not reproduced here:
# they are not in the sources this module cites. See the REST API
# reference for your CipherTrust Manager version.`,
        language: 'bash',
      },
    },
  },
  {
    id: 'activate',
    name: 'Activate',
    description:
      'Transition a key from Pre-Active to Active state. AWS KMS keys and Vault transit keys are usable once created, so those providers have no separate activation step; a KMIP server moves a Pre-Active object to Active with Activate.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>3</Major><Minor>0</Minor>
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
        code: `# HashiCorp Vault — transit keys are usable on creation
# (no separate activation step). To restrict old versions instead:
vault write transit/keys/pqc-root-sig/config \\
  min_decryption_version=1 \\
  deletion_allowed=false`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — activate a Pre-Active key
# The CipherTrust Manager REST request shapes are not reproduced here:
# they are not in the sources this module cites. See the REST API
# reference for your CipherTrust Manager version.`,
        language: 'bash',
      },
    },
  },
  {
    id: 'wrap',
    name: 'Wrap (Encrypt DEK)',
    description:
      'Use a symmetric wrapping key to wrap a data encryption key: KMIP does this with Get plus a Key Wrapping Specification (NISTKeyWrap is AES key wrap), not with a Wrap operation. An ML-KEM key is not used this way. A KEM produces a shared secret rather than encrypting a key, so the KEM flow is encapsulate, derive a wrapping key with a KDF, then AES-KW; KMIP 3.0 (draft) adds Encapsulate and Decapsulate operations for the first step.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>3</Major><Minor>0</Minor>
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
          <!-- a symmetric AES wrapping key, not the ML-KEM key from Create -->
          <UniqueIdentifier>
            c5d4e3f6-a7b8-9012-cdef-123456789012
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
        code: `# HashiCorp Vault — Encrypt (wrap) data with a symmetric transit key
# (ML-DSA keys sign only; they cannot encrypt)
vault write transit/encrypt/aes-kek \\
  plaintext=$(base64 < dek.bin)

# Response:
# Key           Value
# ---           -----
# ciphertext    vault:v1:ABCDEFxyz...
# key_version   1`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — wrap a DEK
# The CipherTrust Manager REST request shapes are not reproduced here:
# they are not in the sources this module cites. See the REST API
# reference for your CipherTrust Manager version.`,
        language: 'bash',
      },
    },
  },
  {
    id: 'rotate',
    name: 'Rotate (Re-key Key Pair)',
    description:
      'KMIP has no Rotate operation. Re-key creates a replacement for a symmetric key, and Re-key Key Pair creates a replacement key pair, which is what an ML-KEM or ML-DSA key needs. Providers expose rotation in their own ways, so existing wrapped data keeps working only while the old key or version is kept.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>3</Major><Minor>0</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <BatchItem>
    <Operation>ReKeyKeyPair</Operation>
    <RequestPayload>
      <PrivateKeyUniqueIdentifier>
        a3b2c1d4-e5f6-7890-abcd-ef1234567890
      </PrivateKeyUniqueIdentifier>
    </RequestPayload>
  </BatchItem>
</RequestMessage>`,
    kmipResponse: `<ResponseMessage>
  <BatchItem>
    <Operation>ReKeyKeyPair</Operation>
    <ResultStatus>Success</ResultStatus>
    <ResponsePayload>
      <PrivateKeyUniqueIdentifier>
        b4c3d2e5-f6a7-8901-bcde-f12345678901
      </PrivateKeyUniqueIdentifier>
      <PublicKeyUniqueIdentifier>
        c5d4e3f6-a7b8-9012-cdef-123456789012
      </PublicKeyUniqueIdentifier>
    </ResponsePayload>
  </BatchItem>
</ResponseMessage>`,
    providerApis: {
      'aws-kms': {
        code: `# AWS KMS — Automatic rotation covers symmetric encryption keys only
aws kms enable-key-rotation \\
  --key-id <symmetric-key-id>

# ML-DSA and ML-KEM keys: create a new key, then move the alias
aws kms create-key --key-spec ML_DSA_65 --key-usage SIGN_VERIFY
aws kms update-alias \\
  --alias-name alias/pqc-root \\
  --target-key-id NEW_KEY_ID`,
        language: 'bash',
      },
      'hashicorp-vault': {
        code: `# HashiCorp Vault — Rotate transit key
vault write -f transit/keys/pqc-root-sig/rotate

# Response:
# Success! Data written to: transit/keys/pqc-root-sig/rotate
# New version: 2
# Old versions still available for decrypt`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — rotate a key
# The CipherTrust Manager REST request shapes are not reproduced here:
# they are not in the sources this module cites. See the REST API
# reference for your CipherTrust Manager version.`,
        language: 'bash',
      },
    },
  },
  {
    id: 'destroy',
    name: 'Destroy',
    description:
      'Destroy key material. The KMIP Destroy operation itself defines no waiting period and applies only to Pre-Active or Deactivated objects, so an Active key is first moved to Deactivated with Revoke. AWS KMS enforces a 7-30 day waiting period; other providers define their own soft-delete or scheduled-destruction windows, and Vault transit deletes once deletion_allowed is set. Check each provider before planning a destruction.',
    kmipXml: `<RequestMessage>
  <RequestHeader>
    <ProtocolVersion>
      <Major>3</Major><Minor>0</Minor>
    </ProtocolVersion>
    <BatchCount>1</BatchCount>
  </RequestHeader>
  <!-- First Revoke the Active object (reason other than Compromised) so it is Deactivated. -->
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
vault write transit/keys/pqc-root-sig/config \\
  deletion_allowed=true

vault delete transit/keys/pqc-root-sig

# Response:
# Success! Data deleted at: transit/keys/pqc-root-sig`,
        language: 'bash',
      },
      'thales-ciphertrust': {
        code: `# Thales CipherTrust — destroy a key (deactivate first)
# The CipherTrust Manager REST request shapes are not reproduced here:
# they are not in the sources this module cites. See the REST API
# reference for your CipherTrust Manager version.`,
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
      'aws-kms': 'KMS key spec (ML_KEM_512)',
      'gcp-kms': 'N/A',
      'hashicorp-vault': 'N/A',
      'thales-ciphertrust': 'Luna HSM backend; TLS technical preview',
      'fortanix-dsm': 'Listed in DSM documentation',
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
      'aws-kms': 'KMS key spec (ML_KEM_768)',
      'gcp-kms': 'Software protection level',
      'hashicorp-vault': 'N/A',
      'thales-ciphertrust': 'Luna HSM backend; TLS technical preview',
      'fortanix-dsm': 'Listed in DSM documentation',
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
      'aws-kms': 'KMS key spec (ML_KEM_1024)',
      'gcp-kms': 'Software protection level',
      'hashicorp-vault': 'N/A',
      'thales-ciphertrust': 'Luna HSM backend; TLS technical preview',
      'fortanix-dsm': 'Listed in DSM documentation',
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
      'gcp-kms': 'GA (software)',
      'hashicorp-vault': 'Experimental (Enterprise)',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Listed in DSM documentation',
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
      'gcp-kms': 'GA (software)',
      'hashicorp-vault': 'Experimental (Enterprise)',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Listed in DSM documentation',
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
      'gcp-kms': 'GA (software)',
      'hashicorp-vault': 'Experimental (Enterprise)',
      'thales-ciphertrust': 'Via Luna HSM',
      'fortanix-dsm': 'Listed in DSM documentation',
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
      'gcp-kms': 'GA (software)',
      'hashicorp-vault': 'Experimental (Enterprise)',
      'thales-ciphertrust': 'N/A',
      'fortanix-dsm': 'Not listed',
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
      'gcp-kms': 'N/A',
      'hashicorp-vault': 'Experimental (Enterprise)',
      'thales-ciphertrust': 'N/A',
      'fortanix-dsm': 'Not listed',
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
      'hashicorp-vault': 'Experimental (Enterprise)',
      'thales-ciphertrust': 'N/A',
      'fortanix-dsm': 'Not listed',
    },
  },
]

export const KMIP_SYNC_SCENARIO: KmipSyncStep[] = [
  {
    id: 1,
    action: 'create',
    title: 'Create ML-KEM-768 KEK',
    description:
      'KMIP orchestrator creates a new ML-KEM-768 key in the primary HSM, then registers the key ID across all connected backends. This is an illustrative flow: the cloud backends are reached through a KMIP adapter or proxy, because the provider table lists no native KMIP endpoint for AWS KMS or Google Cloud KMS.',
    orchestrator: 'Thales CipherTrust',
    targets: ['Primary HSM', 'AWS KMS', 'Google Cloud KMS'],
    kmipSnippet:
      '<Operation>CreateKeyPair</Operation>\n<CryptographicAlgorithm>ML-KEM-768</CryptographicAlgorithm>',
    statuses: { 'Primary HSM': 'success', 'AWS KMS': 'pending', 'Google Cloud KMS': 'pending' },
  },
  {
    id: 2,
    action: 'replicate',
    title: 'Provision in Cloud KMS',
    description:
      'The orchestrator exports the wrapped key material from the primary HSM and imports it into each backend that documents import of this key type. AWS documents that key material for ML-KEM KMS keys cannot be imported, so for AWS KMS the orchestrator would instead create a native ML-KEM key through the provider API. Whether Google Cloud KMS accepts an imported ML-KEM key is not established here.',
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
      'Orchestrator sends KMIP Activate to all backends simultaneously for keys that are in the Pre-Active state; Activate applies only to Pre-Active objects, so objects that are already Active are not activated again.',
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
    kmipSnippet:
      '<Operation>ReKeyKeyPair</Operation>\n<PrivateKeyUniqueIdentifier>a3b2c1d4-...</PrivateKeyUniqueIdentifier>',
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
    title: 'KMIP Server v3.0 (draft) or later',
    description:
      'KMIP 3.0 is a Committee Specification Draft (CSD 02, 7 May 2026); KMIP 2.1 is the OASIS Standard. Verify your KMIP server supports the draft 3.0 protocol version, which includes PQC CryptographicAlgorithm enums for ML-KEM and ML-DSA. A server that supports only 2.1 cannot negotiate 3.0.',
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
      'Trigger a KMIP Re-key Key Pair operation (Re-key is for symmetric keys) and verify the replacement propagates to all connected backends within acceptable latency.',
    critical: false,
  },
  {
    id: 'buffer-sizing',
    category: 'Configuration',
    title: 'Buffer Size Configuration',
    description:
      'PQC keys and ciphertexts are many times larger than ECDH or ECDSA ones. Verify KMIP message buffers, TLS record sizes, and database column widths accommodate ML-KEM-1024 (3,168 B expanded decapsulation key; 1,568 B encapsulation key and ciphertext).',
    critical: false,
  },
  {
    id: 'audit-logging',
    category: 'Compliance',
    title: 'KMIP Operation Audit Trail',
    description:
      'Confirm all KMIP operations (Create Key Pair, Activate, Get with wrapping, Re-key Key Pair, Revoke, Destroy) are logged with timestamps, operator IDs, and key identifiers for compliance auditing.',
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
