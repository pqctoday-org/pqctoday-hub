// SPDX-License-Identifier: GPL-3.0-only

export type DatabaseType = 'relational' | 'document' | 'cache' | 'time-series' | 'graph'
export type EncryptionLayer = 'tde' | 'column' | 'field' | 'queryable' | 'application'
export type KeyOwnership = 'provider-managed' | 'byok' | 'hyok'
export type MigrationComplexity = 'low' | 'medium' | 'high' | 'very-high'

export interface DatabaseEncryptionProfile {
  id: string
  dbName: string
  vendor: string
  dbType: DatabaseType
  encryptionLayers: EncryptionLayer[]
  tdeMechanism: string
  columnEncryption: string
  pqcSupport: 'ga' | 'planned' | 'none'
  pqcTimeline: string
  keyManagement: KeyOwnership[]
  hsmIntegration: boolean
  fipsValidated: boolean
  migrationComplexity: MigrationComplexity
  notes: string
}

export interface TDEMigrationStep {
  id: string
  step: number
  title: string
  description: string
  classicalApproach: string
  pqcApproach: string
  downtime: string
  risk: 'low' | 'medium' | 'high'
  tooling: string[]
}

export interface BYOKArchitecture {
  id: string
  pattern: string
  description: string
  kmsProvider: string
  keyType: string
  wrappingAlgorithm: string
  dataKey: string
  pqcUpgrade: string
  diagram: string[]
  pros: string[]
  cons: string[]
  pqcReadinessScore: number
}

export interface QueryableEncryptionScheme {
  id: string
  name: string
  vendor: string
  queryTypes: string[]
  pqcCompatible: boolean
  encryptionScheme: string
  limitations: string
  pqcRoadmap: string
}

export interface ComplianceRequirement {
  id: string
  framework: string
  requirement: string
  cryptoStandard: string
  deadlineNote: string
  pqcImplication: string
}

// ─── Database Profiles ────────────────────────────────────────────────────────

export const DATABASE_PROFILES: DatabaseEncryptionProfile[] = [
  {
    id: 'oracle',
    dbName: 'Oracle Database 21c/23ai',
    vendor: 'Oracle',
    dbType: 'relational',
    encryptionLayers: ['tde', 'column', 'application'],
    tdeMechanism: 'AES-256-GCM (tablespace-level), keystore in wallet or external KMS',
    columnEncryption: 'Oracle Transparent Column Encryption (TCE) — RSA-wrapped CEK',
    pqcSupport: 'planned',
    pqcTimeline: 'Oracle 23ai roadmap 2026 — ML-KEM-1024 HYOK via OCI KMS',
    keyManagement: ['provider-managed', 'byok', 'hyok'],
    hsmIntegration: true,
    fipsValidated: true,
    migrationComplexity: 'high',
    notes:
      'ALTER SYSTEM REKEY supports online re-encryption. HYOK requires Oracle Key Vault. Column-level key wrapping uses RSA-2048 — must upgrade to ML-KEM-1024 wrapper.',
  },
  {
    id: 'sqlserver',
    dbName: 'SQL Server 2022 / Azure SQL',
    vendor: 'Microsoft',
    dbType: 'relational',
    encryptionLayers: ['tde', 'column', 'queryable', 'application'],
    tdeMechanism: 'AES-256 (database encryption key wrapped by service master key)',
    columnEncryption: 'Always Encrypted with secure enclaves (VBS/SGX), RSA-OAEP CMK wrapping',
    pqcSupport: 'planned',
    pqcTimeline: 'Azure KV ML-KEM support planned 2026; on-prem TDE PQC in SQL Server vNext',
    keyManagement: ['provider-managed', 'byok', 'hyok'],
    hsmIntegration: true,
    fipsValidated: true,
    migrationComplexity: 'high',
    notes:
      'ALTER DATABASE ENCRYPTION KEY WITH ALGORITHM = AES_256 supports online rotation. Always Encrypted CMK uses RSA-2048/4096 — Azure KV ML-KEM upgrade path via key rotation.',
  },
  {
    id: 'postgresql',
    dbName: 'PostgreSQL 16 / pg_tde',
    vendor: 'PostgreSQL / Percona',
    dbType: 'relational',
    encryptionLayers: ['tde', 'field', 'application'],
    tdeMechanism: 'pg_tde extension (Percona) — AES-256-XTS at tablespace level',
    columnEncryption: 'pgcrypto extension — pgp_sym_encrypt / pgp_pub_encrypt (no native CLE)',
    pqcSupport: 'planned',
    pqcTimeline: 'Percona pg_tde ML-KEM key provider under development (2026)',
    keyManagement: ['byok', 'hyok'],
    hsmIntegration: false,
    fipsValidated: false,
    migrationComplexity: 'medium',
    notes:
      'Open-source: native TDE not in upstream PostgreSQL; pg_tde adds it. pgcrypto uses OpenPGP — no native HSM integration. KMIP provider for external KMS is planned.',
  },
  {
    id: 'mongodb',
    dbName: 'MongoDB 7.x Enterprise',
    vendor: 'MongoDB',
    dbType: 'document',
    encryptionLayers: ['tde', 'field', 'queryable', 'application'],
    tdeMechanism: 'WiredTiger encrypted storage engine — AES-256-CBC at file level',
    columnEncryption: 'Client-Side Field Level Encryption (FLE 2.0) — Queryable Encryption indexes',
    pqcSupport: 'planned',
    pqcTimeline: 'MongoDB 8.x roadmap: ML-KEM key wrapping for FLE 2.0 DEKs (2026)',
    keyManagement: ['provider-managed', 'byok'],
    hsmIntegration: true,
    fipsValidated: true,
    migrationComplexity: 'medium',
    notes:
      'FLE 2.0 supports equality and range queries on encrypted fields. DEK wrapping uses RSA-OAEP — ML-KEM upgrade planned for key management endpoint. Atlas provides BYOK via AWS/Azure/GCP KMS.',
  },
  {
    id: 'redis',
    dbName: 'Redis Enterprise 7.x',
    vendor: 'Redis Ltd.',
    dbType: 'cache',
    encryptionLayers: ['application'],
    tdeMechanism: 'No native TDE — data-at-rest requires OS/disk encryption or application-layer',
    columnEncryption: 'No column encryption — field-level via application pattern only',
    pqcSupport: 'none',
    pqcTimeline: 'No PQC roadmap announced; TLS 1.3 transport uses ECDHE (no ML-KEM yet)',
    keyManagement: ['provider-managed', 'byok'],
    hsmIntegration: false,
    fipsValidated: false,
    migrationComplexity: 'low',
    notes:
      'Redis is an in-memory store; sensitive data should be encrypted at application layer before write. TLS 1.3 protects transport. RBAC and ACL control access. No native encryption-at-rest.',
  },
  {
    id: 'mysql',
    dbName: 'MySQL 8.x / MariaDB 11.x',
    vendor: 'Oracle / MariaDB Foundation',
    dbType: 'relational',
    encryptionLayers: ['tde', 'application'],
    tdeMechanism:
      'InnoDB Tablespace Encryption — AES-256-CBC, key wrapped by master key in keyring',
    columnEncryption: 'No native CLE — AES_ENCRYPT() function (ECB mode by default, insecure)',
    pqcSupport: 'none',
    pqcTimeline: 'No PQC roadmap; keyring_hashicorp for HashiCorp Vault integration',
    keyManagement: ['provider-managed', 'byok'],
    hsmIntegration: false,
    fipsValidated: false,
    migrationComplexity: 'medium',
    notes:
      'InnoDB encryption is tablespace-level. AES_ENCRYPT() without IV is ECB mode — avoid. keyring_oci and keyring_hashicorp plugins support external KMS. MariaDB adds encryption plugin API.',
  },
  {
    id: 'cockroachdb',
    dbName: 'CockroachDB 24.x Enterprise',
    vendor: 'Cockroach Labs',
    dbType: 'relational',
    encryptionLayers: ['tde', 'application'],
    tdeMechanism: 'Enterprise Encryption at Rest — AES-128/256 store key, rotated via CLI',
    columnEncryption: 'No native CLE — application layer via SQL functions',
    pqcSupport: 'none',
    pqcTimeline: 'No PQC roadmap; KMIP v2 integration for external key management',
    keyManagement: ['byok'],
    hsmIntegration: false,
    fipsValidated: false,
    migrationComplexity: 'low',
    notes:
      'CockroachDB encrypts store keys using AES-256; rotation via cockroach debug encryption-status. KMIP v2 support for enterprise customers allows external KMS. Distributed architecture complicates key rotation.',
  },
  {
    id: 'oracle-ai',
    dbName: 'Oracle Database (projected future release)',
    vendor: 'Oracle',
    dbType: 'relational',
    encryptionLayers: ['tde', 'column', 'field', 'application'],
    tdeMechanism: 'AES-256-GCM + ML-native encryption (experimental) — vector embedding protection',
    columnEncryption: 'ML-native column encryption for AI vector data; TCE for standard columns',
    pqcSupport: 'planned',
    pqcTimeline: '2026 release — ML-KEM-1024 for AI vector DEK wrapping via Oracle Key Vault',
    keyManagement: ['provider-managed', 'byok', 'hyok'],
    hsmIntegration: true,
    fipsValidated: false,
    migrationComplexity: 'very-high',
    notes:
      'Projected future Oracle release with vector/AI workload encryption. ML-native encryption protects embedding data. PQC integration via Oracle Key Vault HYOK planned.',
  },
]

// ─── TDE Migration Steps ──────────────────────────────────────────────────────

export const TDE_MIGRATION_STEPS: TDEMigrationStep[] = [
  {
    id: 'inventory',
    step: 1,
    title: 'Inventory & Key Hierarchy Audit',
    description:
      'Enumerate all encrypted databases, map current key hierarchy (master key → DEK chain), and identify all RSA/ECC-wrapped DEKs that require PQC migration.',
    classicalApproach:
      'Query sys.dm_database_encryption_keys (SQL Server) or V$ENCRYPTED_TABLESPACES (Oracle) to list encrypted objects. Document RSA-2048/4096 master key locations.',
    pqcApproach:
      'Extend inventory to include algorithm metadata — annotate each DEK with wrapping algorithm, key size, and HYOK/BYOK classification. Generate CBOM (Cryptographic Bill of Materials).',
    downtime: 'None',
    risk: 'low',
    tooling: [
      'Oracle Key Vault',
      'SQL Server DMVs',
      'AWS Key Management Service',
      'NMAP crypto scanner',
    ],
  },
  {
    id: 'kms-setup',
    step: 2,
    title: 'PQC-Capable External KMS Setup',
    description:
      'Configure a PQC-capable KMS (Thales CipherTrust, AWS KMS preview, or Azure Key Vault) to generate ML-KEM-1024 key wrapping keys. Establish KMIP v2 connectivity from the database server.',
    classicalApproach:
      'External KMS with RSA-2048/4096 TLS-wrapped KMIP connection. Key wrapping via RSA-OAEP or AES-WRAP.',
    pqcApproach:
      'Thales CipherTrust (roadmap version) with ML-KEM-1024 key wrapping algorithm. AWS KMS with ML-KEM preview. KMIP 2.1 object type CryptographicAlgorithm = ML-KEM.',
    downtime: 'None',
    risk: 'medium',
    tooling: [
      'Thales CipherTrust (roadmap)',
      'AWS KMS (PQC preview)',
      'HashiCorp Vault 1.17+',
      'KMIP 2.1 client',
    ],
  },
  {
    id: 'master-key-rotation',
    step: 3,
    title: 'Master Key Rotation to ML-KEM-Wrapped DEK',
    description:
      'Generate new master keys using ML-KEM-1024 in the external KMS. Re-wrap existing DEKs using the new PQC master key. Old RSA-wrapped DEK entries remain until re-encryption completes.',
    classicalApproach:
      'ALTER MASTER KEY REGENERATE / Oracle okvutil rekey — RSA-2048 TDE master key wrapped in external KMS using RSA-OAEP.',
    pqcApproach:
      'Generate ML-KEM-1024 key pair in Thales HSM. Use ML-KEM.Encaps to wrap new 256-bit DEK. Store KEM ciphertext (1,568 bytes) + wrapped DEK alongside old RSA entry during transition.',
    downtime: '< 1 min (key metadata update only)',
    risk: 'medium',
    tooling: [
      'Oracle Key Vault CLI',
      'SQL Server EKM provider',
      'Thales CipherTrust REST API',
      'OpenSSL 3.4+',
    ],
  },
  {
    id: 'online-reencryption',
    step: 4,
    title: 'Online Re-Encryption (Live Migration)',
    description:
      'Re-encrypt database files/tablespaces using the new ML-KEM-wrapped DEK hierarchy. Uses database-native online migration capability to avoid downtime.',
    classicalApproach:
      'Oracle: ALTER TABLESPACE REKEY / SQL Server: ALTER DATABASE ENCRYPTION KEY REGENERATE WITH ALGORITHM = AES_256. Runs in background, no application downtime.',
    pqcApproach:
      'Same online migration commands — the algorithm change is at the DEK wrapping layer, not the AES-256 data encryption layer. AES-256 symmetric encryption of data files is already quantum-safe.',
    downtime: 'None (online)',
    risk: 'high',
    tooling: [
      'Oracle ALTER TABLESPACE REKEY',
      'SQL Server ALTER DATABASE ENCRYPTION KEY',
      'pg_tde REKEY command',
      'MongoDB keyRotation',
    ],
  },
  {
    id: 'integrity-verify',
    step: 5,
    title: 'Integrity Verification & Decrypt Test',
    description:
      'Validate that all re-encrypted tablespaces/collections can be decrypted using the new ML-KEM-wrapped DEKs. Run checksum validation on critical tables. Perform decrypt-test on sample rows.',
    classicalApproach:
      'DBCC CHECKDB (SQL Server) / Oracle RMAN validation. Verify DEK decryption by querying sample encrypted columns.',
    pqcApproach:
      'Same integrity checks plus: verify that the ML-KEM ciphertext stored in KMS metadata decapsulates correctly to yield the same DEK. Test HYOK path end-to-end: DB → KMS → HSM → decapsulate.',
    downtime: 'None',
    risk: 'low',
    tooling: ['DBCC CHECKDB', 'Oracle RMAN', 'pg_tde verify', 'Custom decrypt test scripts'],
  },
  {
    id: 'decommission',
    step: 6,
    title: 'Decommission Classical Keys',
    description:
      'After all tablespaces/collections confirm PQC-wrapped DEKs are active, revoke and archive the old RSA-wrapped master keys. Update KMS policy to reject new RSA key wrapping requests.',
    classicalApproach:
      'DROP MASTER KEY / Oracle key archive. Retain 90-day archive window per audit requirements. KMS policy updated to disallow RSA key creation.',
    pqcApproach:
      'Mark RSA keys as DEACTIVATED in KMS (not deleted — needed for decrypting old backups). Set key state = COMPROMISED after 1-year retention window. Enforce ML-KEM-only policy for new key wrapping.',
    downtime: 'None',
    risk: 'low',
    tooling: [
      'Oracle Key Vault state management',
      'AWS KMS key state API',
      'Thales CipherTrust lifecycle',
      'Audit log archival',
    ],
  },
]

// ─── BYOK Architectures ───────────────────────────────────────────────────────

export const BYOK_ARCHITECTURES: BYOKArchitecture[] = [
  {
    id: 'provider-managed',
    pattern: 'Provider-Managed Keys',
    description:
      'The cloud provider generates, stores, and manages encryption keys entirely. Customer has no control over key material. Simplest operational model but weakest security posture.',
    kmsProvider: 'AWS KMS default / Azure KV default / Google Cloud KMS default',
    keyType: 'AES-256 symmetric (provider-generated)',
    wrappingAlgorithm: 'Provider-internal RSA-OAEP (opaque to customer)',
    dataKey: '256-bit AES-GCM DEK, generated per database/tablespace',
    pqcUpgrade:
      'Provider must upgrade internal KMS. No customer action required, but no customer control either. Timeline depends entirely on AWS/Azure/GCP.',
    diagram: [
      'Customer Application',
      '         ↓ SQL / API',
      'Database Engine (Cloud Managed)',
      '         ↓ DEK request',
      'Provider KMS (opaque)',
      '         ↓ returns plaintext DEK',
      'Data Encryption (AES-256)',
    ],
    pros: ['Zero operational overhead', 'Automatic key rotation', 'No HSM investment required'],
    cons: [
      'Provider can access plaintext keys',
      'No customer control over PQC timeline',
      'Not compliant with HYOK regulations (DORA, ENISA)',
      'Key escrow risk for regulated industries',
    ],
    pqcReadinessScore: 30,
  },
  {
    id: 'byok',
    pattern: 'BYOK (Bring Your Own Key)',
    description:
      'Customer generates the master key (typically in an on-prem HSM), then uploads the key material to the cloud KMS. Customer controls key generation and rotation schedule.',
    kmsProvider: 'AWS KMS BYOK / Azure Key Vault BYOK / GCP Cloud KMS import',
    keyType: 'Customer-generated AES-256 or RSA-4096 (imported to cloud KMS)',
    wrappingAlgorithm: 'RSA-OAEP import wrapping (customer wraps key before upload)',
    dataKey: '256-bit AES-GCM DEK, wrapped by imported CMK in cloud KMS',
    pqcUpgrade:
      'Download ML-KEM-1024 public wrapping key from Cloud KMS. Generate new CMK on-prem. Run ML-KEM.Encaps to derive a shared secret and ciphertext. Wrap the CMK with the shared secret (AES-KWP) and upload to Cloud KMS.',
    diagram: [
      'Cloud KMS (provides ML-KEM public key)',
      '         ↓ download ek',
      'Customer HSM (generates CMK)',
      '         ↓ Encaps(ek) → wrap CMK with shared secret',
      'Cloud KMS (receives ciphertext + wrapped CMK)',
      '         ↓ decapsulates and unwraps CMK',
      'Data Encryption (stores DEK wrapped by CMK)',
    ],
    pros: [
      'Customer controls key generation',
      'Can enforce PQC on own timeline',
      'Cloud cannot access plaintext CMK without customer HSM (during import)',
      'Satisfies most regulatory BYOK requirements',
    ],
    cons: [
      'Cloud KMS temporarily holds unwrapped CMK in HSM memory',
      'Key import format must support ML-KEM (provider-dependent)',
      'Requires on-prem HSM infrastructure',
      'Key escrow risk during import window',
    ],
    pqcReadinessScore: 65,
  },
  {
    id: 'hyok',
    pattern: 'HYOK (Hold Your Own Key)',
    description:
      'Customer holds the master key in on-premises infrastructure that never leaves their control. The cloud provider only ever sees encrypted DEKs. Strongest security posture for regulated industries.',
    kmsProvider: 'Thales CipherTrust / Entrust DataControl / Utimaco HSM',
    keyType: 'ML-KEM-1024 key pair in FIPS 140-3 Level 3+ on-prem HSM',
    wrappingAlgorithm: 'ML-KEM-1024 (key encapsulation) + AES-256-KW (DEK wrap)',
    dataKey: 'AES-256 DEK wrapped by ML-KEM-derived wrapping key; stored in cloud DB metadata',
    pqcUpgrade:
      'HYOK is already PQC-ready if the on-prem HSM supports ML-KEM-1024. Upgrade firmware on Thales nShield / Luna Network HSM to firmware supporting PKCS#11 v3.2 ML-KEM mechanisms.',
    diagram: [
      'On-Prem HSM (Customer)',
      '    ML-KEM-1024 Master Key',
      '         ↓ encapsulate DEK',
      'KEM Ciphertext (1,568 B)',
      '         ↓ stored in DB metadata',
      'Cloud Database Engine',
      '         ↓ DEK request (sends ciphertext)',
      'On-Prem HSM decapsulates',
      '         ↓ returns plaintext DEK',
      'Data Encryption (AES-256)',
    ],
    pros: [
      'Key never leaves customer infrastructure',
      'Full PQC control — upgrade HSM independently',
      'Satisfies DORA, ENISA, NIS2 HYOK requirements',
      'NSM-8 compliant for classified workloads',
      'Strongest posture against cloud provider compromise',
    ],
    cons: [
      'High operational complexity (on-prem HSM cluster)',
      'Latency added for every DEK unwrap operation',
      'Higher cost (FIPS 140-3 HSM hardware + maintenance)',
      'Requires 24/7 on-prem KMS availability',
    ],
    pqcReadinessScore: 90,
  },
]

// ─── Queryable Encryption Schemes ─────────────────────────────────────────────

export const QUERYABLE_ENCRYPTION_SCHEMES: QueryableEncryptionScheme[] = [
  {
    id: 'mongodb-fle2',
    name: 'MongoDB FLE 2.0',
    vendor: 'MongoDB',
    queryTypes: ['equality', 'range', 'prefix'],
    pqcCompatible: false,
    encryptionScheme:
      'Queryable Encryption with deterministic indexes + random encryption for non-indexed fields. Uses HMAC-SHA-256 for equality tokens, AES-CBC for data encryption.',
    limitations:
      'No text search on FLE 2.0 fields. Aggregate pipelines limited on encrypted fields. Index size overhead ~2-3x. No support for multi-collection transactions on encrypted fields.',
    pqcRoadmap:
      'MongoDB 8.x (2026): ML-KEM-1024 for DEK wrapping in key management endpoint. Equality token MAC upgrade to HMAC-SHA3-256. Range query encryption scheme under PQC review.',
  },
  {
    id: 'sqlserver-ae',
    name: 'SQL Server Always Encrypted',
    vendor: 'Microsoft',
    queryTypes: ['equality', 'range'],
    pqcCompatible: false,
    encryptionScheme:
      'Column Master Key (CMK) wraps Column Encryption Key (CEK) using RSA-OAEP. With secure enclaves (VBS/SGX): deterministic encryption allows equality queries; randomized encryption allows range queries inside enclave.',
    limitations:
      'Without enclaves: equality queries only, no joins on encrypted columns. With enclaves: range queries supported but SGX deprecation concerns. CMK rotation requires re-encryption of all CEKs.',
    pqcRoadmap:
      'Azure Key Vault ML-KEM support planned 2026 — CMK stored in AKV would use ML-KEM-1024 wrapping. On-prem CMK in SQL Server vNext. Enclave-based range queries unaffected (symmetric crypto).',
  },
  {
    id: 'oracle-csqe',
    name: 'Oracle Client-Side Query Encryption',
    vendor: 'Oracle',
    queryTypes: ['equality'],
    pqcCompatible: false,
    encryptionScheme:
      'Application-level encryption with deterministic AES (for equality queries) or HMAC-based tokens. Client manages encryption keys; server stores only ciphertext and HMAC tokens.',
    limitations:
      'Equality queries only (no range, regex, or aggregation on encrypted columns). No native sorting on encrypted values. Complex key management in client application layer.',
    pqcRoadmap:
      'Oracle 23ai roadmap: ML-KEM-based key wrapping for client key material via Oracle Key Vault. HMAC-SHA-256 token scheme stays unchanged (quantum-safe). No concrete release date.',
  },
  {
    id: 'pg-tde',
    name: 'pg_tde (Percona)',
    vendor: 'Percona / PostgreSQL Community',
    queryTypes: [],
    pqcCompatible: false,
    encryptionScheme:
      'TDE-only — AES-256-XTS at tablespace level. pg_tde does NOT support queryable encryption; all queries run on plaintext data after decryption by the TDE layer at storage I/O.',
    limitations:
      'No queryable encryption. Not in upstream PostgreSQL (requires Percona or custom build). No HSM integration yet. Key provider API supports custom providers (KMIP planned).',
    pqcRoadmap:
      'Percona pg_tde 2.0 (2026): KMIP 2.1 key provider with ML-KEM support via Thales/AWS. TDE layer upgrade to AES-256-XTS remains unchanged. Column-level queryable encryption not on roadmap.',
  },
]

// ─── Compliance Requirements ──────────────────────────────────────────────────

export const COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'gdpr-32',
    framework: 'GDPR Art. 32',
    requirement:
      'Appropriate technical measures including encryption for personal data at rest and in transit.',
    cryptoStandard:
      'AES-256, TLS 1.3 (currently); ENISA recommends PQC for long-lived personal data.',
    deadlineNote:
      'Ongoing — "state of the art" standard means PQC becomes required as it matures (2026+).',
    pqcImplication:
      'GDPR "state of the art" clause requires tracking ENISA recommendations. Personal data retained beyond 2030 should be protected with PQC DEK wrapping. HYOK preferred for GDPR compliance.',
  },
  {
    id: 'hipaa-312',
    framework: 'HIPAA § 164.312(a)(2)(iv)',
    requirement: 'Addressable safeguard: encryption and decryption of ePHI at rest and in transit.',
    cryptoStandard: 'AES-128 minimum (NIST SP 800-111); AES-256 recommended for new deployments.',
    deadlineNote:
      'HHS has not issued PQC-specific HIPAA guidance; NSM-10 applies to federal healthcare systems.',
    pqcImplication:
      'ePHI (Protected Health Information) retained for 50+ years (lifespan records) is at highest HNDL risk. Healthcare organizations should prioritize ML-KEM-1024 DEK wrapping for long-retention databases.',
  },
  {
    id: 'dora-9',
    framework: 'DORA Art. 9 (ICT Risk)',
    requirement:
      'Financial entities must implement state-of-the-art cryptographic controls for ICT risk management.',
    cryptoStandard:
      'ENISA recommendations apply; hybrid PQC for critical financial infrastructure.',
    deadlineNote:
      'DORA applies from Jan 2025; EBA/ESMA/EIOPA guidelines will specify PQC timelines (expected 2026).',
    pqcImplication:
      'Financial databases holding customer PII and transaction records require HYOK with PQC-capable HSM. DORA Art. 9 "state of the art" provision requires monitoring ENISA PQC migration guidance.',
  },
  {
    id: 'pcidss-3-5',
    framework: 'PCI DSS v4 Req. 3.5',
    requirement:
      'Protect primary account numbers (PAN) using strong cryptography with associated key management processes.',
    cryptoStandard:
      'AES-256 or RSA-2048+ for PAN encryption at rest; DUKPT for point-of-interaction.',
    deadlineNote:
      'PCI SSC has not mandated PQC; monitoring ANSI X9/ASC X9 quantum-safe standards (X9.146).',
    pqcImplication:
      'PAN data retained for chargebacks (13 months) has low immediate HNDL risk, but card infrastructure (HSMs, KIFs) has 10-15 year lifecycle. X9.146 quantum-safe framework (draft, expected 2026) — plan DUKPT upgrade.',
  },
  {
    id: 'nsm8-cnsa20',
    framework: 'NSM-8 / CNSA 2.0',
    requirement:
      'US federal systems and NSS must transition to CNSA 2.0 algorithms: ML-KEM-1024 for key establishment.',
    cryptoStandard:
      'ML-KEM-1024 (FIPS 203), ML-DSA-87 (FIPS 204), SLH-DSA (FIPS 205) — exclusive by 2033.',
    deadlineNote:
      'New capabilities: ML-KEM by 2027. Legacy systems: ML-KEM exclusively by 2033. NSM-8 issued Jan 2022.',
    pqcImplication:
      'Federal databases (DoD, IC, civilian agencies) must use ML-KEM-1024 for all DEK wrapping by 2033. HYOK with FIPS 140-3 Level 3+ HSM mandatory. Classical RSA/ECC key wrapping prohibited after 2033.',
  },
]

// ─── Labels ───────────────────────────────────────────────────────────────────

export const ENCRYPTION_LAYER_LABELS: Record<EncryptionLayer, string> = {
  tde: 'Transparent Data Encryption (TDE)',
  column: 'Column-Level Encryption (CLE)',
  field: 'Field-Level Encryption (FLE)',
  queryable: 'Queryable Encryption',
  application: 'Application-Layer Encryption',
}

export const COMPLEXITY_LABELS: Record<MigrationComplexity, { label: string; color: string }> = {
  low: { label: 'Low', color: 'text-status-success' },
  medium: { label: 'Medium', color: 'text-status-warning' },
  high: { label: 'High', color: 'text-status-error' },
  'very-high': { label: 'Very High', color: 'text-status-error' },
}
