// SPDX-License-Identifier: AGPL-3.0-only
import { getCatalogStatus, type CatalogAvailability } from '@/data/catalogStatus'

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
  /** Catalog softwareName — PQC support is derived from the central catalog via
   *  getProfilePqcSupport(), not stored here. Other fields are teaching detail. */
  catalogName: string
  pqcTimeline: string
  keyManagement: KeyOwnership[]
  hsmIntegration: boolean
  fipsValidated: boolean
  migrationComplexity: MigrationComplexity
  notes: string
}

export type DatabasePqcSupport = 'ga' | 'planned' | 'none'

const AVAIL_TO_DB: Record<CatalogAvailability, DatabasePqcSupport> = {
  available: 'ga',
  partial: 'planned',
  roadmap: 'planned',
  none: 'none',
  unverified: 'planned',
}

/**
 * Derive a database profile's PQC support from the CENTRAL CATALOG (single source
 * of truth) by its catalogName. Falls back to 'planned' if not in the catalog.
 */
export function getProfilePqcSupport(profile: DatabaseEncryptionProfile): DatabasePqcSupport {
  const status = getCatalogStatus(profile.catalogName)
  return status ? AVAIL_TO_DB[status.availability] : 'planned'
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
    catalogName: 'Oracle Key Vault',
    pqcTimeline:
      'No Oracle date is cited in this module; Oracle AI Database 26ai supports ML-KEM and an ML-KEM and ECDHE hybrid for key-exchange secrets for TLS sessions (Oracle).',
    keyManagement: ['provider-managed', 'byok', 'hyok'],
    hsmIntegration: true,
    fipsValidated: true,
    migrationComplexity: 'high',
    notes:
      'ALTER SYSTEM REKEY supports online re-encryption. HYOK requires Oracle Key Vault. Column-level key wrapping uses RSA-2048 — must upgrade to ML-KEM-1024 wrapper (not sourced in the Library).',
  },
  {
    id: 'sqlserver',
    dbName: 'SQL Server 2022 / Azure SQL',
    vendor: 'Microsoft',
    dbType: 'relational',
    encryptionLayers: ['tde', 'column', 'queryable', 'application'],
    tdeMechanism: 'AES-256 (database encryption key wrapped by service master key)',
    columnEncryption: 'Always Encrypted with secure enclaves (VBS/SGX), RSA-OAEP CMK wrapping',
    catalogName: 'SQL Server TDE/Always Encrypted',
    pqcTimeline: 'No Microsoft date is cited in this module.',
    keyManagement: ['provider-managed', 'byok', 'hyok'],
    hsmIntegration: true,
    fipsValidated: true,
    migrationComplexity: 'high',
    notes:
      'ALTER DATABASE ENCRYPTION KEY WITH ALGORITHM = AES_256 supports online rotation. Always Encrypted CMK uses RSA-2048/4096. This module’s projection, not a Microsoft statement: an ML-KEM wrapper for the CMK via key rotation.',
  },
  {
    id: 'postgresql',
    dbName: 'PostgreSQL 16 / pg_tde',
    vendor: 'PostgreSQL / Percona',
    dbType: 'relational',
    encryptionLayers: ['tde', 'field', 'application'],
    tdeMechanism: 'pg_tde extension (Percona) — AES-256-XTS at tablespace level',
    columnEncryption: 'pgcrypto extension — pgp_sym_encrypt / pgp_pub_encrypt (no native CLE)',
    catalogName: 'PostgreSQL',
    pqcTimeline:
      'No Percona date is cited in this module; an ML-KEM key provider is this module’s projection.',
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
    catalogName: 'MongoDB Queryable Encryption',
    pqcTimeline:
      'No MongoDB date is cited in this module; ML-KEM wrapping of FLE 2.0 DEKs is this module’s projection.',
    keyManagement: ['provider-managed', 'byok'],
    hsmIntegration: true,
    fipsValidated: true,
    migrationComplexity: 'medium',
    notes:
      'FLE 2.0 supports equality and range queries on encrypted fields. DEK wrapping uses RSA-OAEP; ML-KEM wrapping for the key management endpoint is this module’s projection. Atlas provides BYOK via AWS/Azure/GCP KMS.',
  },
  {
    id: 'redis',
    dbName: 'Redis Enterprise 7.x',
    vendor: 'Redis Ltd.',
    dbType: 'cache',
    encryptionLayers: ['application'],
    tdeMechanism: 'No native TDE — data-at-rest requires OS/disk encryption or application-layer',
    columnEncryption: 'No column encryption — field-level via application pattern only',
    catalogName: 'Redis',
    pqcTimeline: 'No Redis PQC date is cited in this module.',
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
    catalogName: 'MySQL Enterprise Encryption',
    pqcTimeline:
      'No MySQL PQC date is cited in this module; keyring_hashicorp provides HashiCorp Vault integration.',
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
    catalogName: 'CockroachDB Encryption',
    pqcTimeline:
      'No CockroachDB PQC date is cited in this module; KMIP v2 integration is available for external key management.',
    keyManagement: ['byok'],
    hsmIntegration: false,
    fipsValidated: false,
    migrationComplexity: 'low',
    notes:
      'CockroachDB encrypts store keys using AES-256; rotation via cockroach debug encryption-status. KMIP v2 support for enterprise customers allows external KMS. Distributed architecture complicates key rotation.',
  },
  {
    id: 'oracle-ai',
    dbName: 'Oracle AI Database 26ai',
    vendor: 'Oracle',
    dbType: 'relational',
    encryptionLayers: ['tde', 'column', 'field', 'application'],
    tdeMechanism: 'In this module’s reading: AES-256-GCM TDE plus protection of vector embeddings',
    columnEncryption:
      'In this module’s reading: column encryption for AI vector data, TCE for standard columns',
    catalogName: 'Oracle AI Database 26ai',
    pqcTimeline:
      'Oracle AI Database 26ai supports ML-KEM and an ML-KEM and ECDHE hybrid for key-exchange secrets for TLS sessions (Oracle); ML-KEM-1024 wrapping of AI vector DEKs through Oracle Key Vault is this module’s projection, not an Oracle statement.',
    keyManagement: ['provider-managed', 'byok', 'hyok'],
    hsmIntegration: true,
    fipsValidated: false,
    migrationComplexity: 'very-high',
    notes:
      'In this module’s reading, vector/AI workload data is encrypted like other workloads and belongs in the key-wrapping migration. This module’s projection, not an Oracle statement: ML-KEM-1024 wrapping of vector DEKs through Oracle Key Vault HYOK.',
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
      'Configure a PQC-capable KMS (for example Thales CipherTrust; AWS KMS creates ML-KEM keys, but its import wrapping keys are RSA only) to generate ML-KEM-1024 key wrapping keys. Establish KMIP v2 connectivity from the database server.',
    classicalApproach:
      'External KMS with RSA-2048/4096 TLS-wrapped KMIP connection. Key wrapping via RSA-OAEP or AES-WRAP.',
    pqcApproach:
      'Thales CipherTrust (roadmap version) (not sourced in the Library) with ML-KEM-1024 key wrapping algorithm. AWS KMS offers ML-DSA signing keys (GA June 2025), ML-KEM key specs and hybrid post-quantum TLS (ML-KEM key exchange) on its endpoints, but its import wrapping keys are RSA only. KMIP 3.0 object type CryptographicAlgorithm = ML-KEM.',
    downtime: 'None',
    risk: 'medium',
    tooling: [
      'Thales CipherTrust (roadmap) (not sourced in the Library)',
      'AWS KMS (ML-DSA signing keys and ML-KEM key specs)',
      'HashiCorp Vault 1.17+',
      'KMIP 3.0 client',
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
      'Generate ML-KEM-1024 key pair in Thales HSM. Use ML-KEM.Encaps to produce a shared secret, derive a key-encryption key from it (KDF), and wrap the new 256-bit DEK with that key; store the KEM ciphertext (1,568 bytes) plus the wrapped DEK alongside old RSA entry during transition.',
    downtime: '< 1 min (key metadata update only)',
    risk: 'medium',
    tooling: [
      'Oracle Key Vault CLI',
      'SQL Server EKM provider',
      'Thales CipherTrust REST API',
      'OpenSSL 3.5+',
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
      'Mark RSA keys as DEACTIVATED in KMS (not deleted — needed for decrypting old backups). Destroy the keys (KMIP Destroy: Deactivated → Destroyed) after the 1-year retention window. Enforce ML-KEM-only policy for new key wrapping.',
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
      'Key custody sits with the provider, so the entity relies on provider controls for key-lifecycle requirements such as DORA RTS 2024/1774 Article 7',
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
      'Design target (AWS KMS import wrapping keys are RSA only): download an ML-KEM-1024 public wrapping key from the Cloud KMS, generate the new CMK on-prem, run ML-KEM.Encaps to derive a shared secret and ciphertext, wrap the CMK with the shared secret (AES-KWP), and upload the ciphertext and wrapped CMK.',
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
      'Keeps key custody inside the customer’s own key-lifecycle controls (cf. DORA RTS 2024/1774 Article 7)',
      'ML-KEM-1024 is the key-establishment algorithm CNSA 2.0 specifies',
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
      'Queryable Encryption with deterministic indexes + random encryption for non-indexed fields. Uses HMAC-SHA-256 for equality tokens, AES-CBC for data encryption (not sourced in the Library).',
    limitations:
      'No text search on FLE 2.0 fields. Aggregate pipelines limited on encrypted fields. Index size overhead ~2-3x. No support for multi-collection transactions on encrypted fields.',
    pqcRoadmap:
      'This module’s projection, not a MongoDB statement: ML-KEM-1024 for DEK wrapping in the key management endpoint. Equality tokens use HMAC-SHA-256, which is symmetric. A range query encryption scheme that is compatible with PQC is an open question.',
  },
  {
    id: 'sqlserver-ae',
    name: 'SQL Server Always Encrypted',
    vendor: 'Microsoft',
    queryTypes: ['equality', 'range'],
    pqcCompatible: false,
    encryptionScheme:
      'Column Master Key (CMK) wraps Column Encryption Key (CEK) using RSA-OAEP. With secure enclaves (VBS/SGX): deterministic encryption allows equality queries; randomized encryption allows range queries inside enclave (not sourced in the Library).',
    limitations:
      'Without enclaves: equality queries only, no joins on encrypted columns. With enclaves: range queries supported but SGX deprecation concerns. CMK rotation requires re-encryption of all CEKs.',
    pqcRoadmap:
      'No Microsoft roadmap is cited in this module. In this module’s reading, enclave-based range queries are unaffected because they use symmetric crypto; the PQC change is in CMK wrapping.',
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
      'This module’s projection, not an Oracle statement: ML-KEM-based key wrapping for client key material via Oracle Key Vault. The HMAC-SHA-256 token scheme is symmetric. No release date is cited.',
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
      'This module’s projection, not a Percona statement: a KMIP 3.0 key provider with ML-KEM support via Thales or AWS. In this module’s reading, the TDE layer is unchanged by it. No date is cited.',
  },
]

// ─── Compliance Requirements ──────────────────────────────────────────────────

export const COMPLIANCE_REQUIREMENTS: ComplianceRequirement[] = [
  {
    id: 'gdpr-32',
    framework: 'GDPR Art. 32',
    requirement:
      'Appropriate technical measures including encryption for personal data at rest and in transit.',
    cryptoStandard: 'Article 32 names no algorithm.',
    deadlineNote:
      'Ongoing — GDPR Article 32(1) lists “the state of the art” among the factors for appropriate measures; it names no algorithm and no date.',
    pqcImplication:
      'GDPR Article 32(1) names the state of the art among the factors and prescribes no algorithm or date. This module advises protecting personal data retained beyond 2030 with PQC DEK wrapping; HYOK is one design for keeping key custody with the controller.',
  },
  {
    id: 'hipaa-312',
    framework: 'HIPAA § 164.312(a)(2)(iv)',
    requirement: 'Addressable safeguard: encryption and decryption of ePHI at rest and in transit.',
    cryptoStandard:
      'Use AES (NIST SP 800-111); AES-256 is common for new deployments and long confidentiality horizons.',
    deadlineNote:
      'HHS has not issued PQC-specific HIPAA guidance; NSM-10 applies to federal healthcare systems.',
    pqcImplication:
      'ePHI (Protected Health Information) retained for 50+ years (lifespan records) is at highest HNDL risk. Healthcare organizations should prioritize ML-KEM-1024 DEK wrapping for long-retention databases.',
  },
  {
    id: 'dora-9',
    framework: 'DORA Art. 9 (ICT Risk)',
    requirement:
      'Financial entities must have a policy on encryption and cryptographic controls, including cryptographic key management (RTS 2024/1774 Articles 6 and 7).',
    cryptoStandard:
      'The RTS names no algorithm; its Article 6 requires the policy to include provisions for updating or changing, where necessary, the cryptographic technology on the basis of developments in cryptanalysis.',
    deadlineNote: 'DORA applies from 17 January 2025.',
    pqcImplication:
      'The RTS does not name HYOK. This module advises a PQC-capable HSM for financial databases holding customer PII and transaction records, as its own recommendation.',
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
      'National Security Systems must transition to CNSA 2.0 algorithms: ML-KEM-1024 for key establishment.',
    cryptoStandard:
      'ML-KEM-1024 (FIPS 203) and ML-DSA-87 (FIPS 204), with LMS/XMSS for software and firmware signing; SLH-DSA is not part of CNSA and is not approved for any use in NSS.',
    deadlineNote:
      'New NSS acquisitions: CNSA 2.0 required from 1 Jan 2027 (CNSSP 15). Fielded equipment transitions: by 31 Dec 2030. CNSA 2.0 mandated for use in NSS by 31 Dec 2031. NSM-8 issued Jan 2022.',
    pqcImplication:
      'NSS databases (DoD, IC) must use CNSA 2.0 algorithms, with ML-KEM-1024 for key establishment, on the dates above (NSA CNSA 2.0 FAQ, CNSSP 15).',
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
