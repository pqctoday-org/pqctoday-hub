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
  /**
   * Scope of any FIPS 140 claim: the cryptographic module, CMVP certificate and approved
   * configuration, or an explicit "Unverified" statement. Kept apart from which algorithms
   * the product offers; a product-wide yes/no would hide that scope.
   */
  fipsScope: string
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
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
    migrationComplexity: 'high',
    notes:
      'ADMINISTER KEY MANAGEMENT SET KEY rotates the TDE master encryption key, and ALTER TABLESPACE ... ENCRYPTION ONLINE REKEY converts a tablespace online into new datafiles (Oracle Database 21c documentation). HYOK requires Oracle Key Vault. Column-level key wrapping uses RSA-2048 — must upgrade to ML-KEM-1024 wrapper (not sourced in the Library).',
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
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
    migrationComplexity: 'high',
    notes:
      'ALTER DATABASE ENCRYPTION KEY has two forms: REGENERATE WITH ALGORITHM (a new database encryption key) and ENCRYPTION BY SERVER CERTIFICATE or ASYMMETRIC KEY (a different protector for the same key). Always Encrypted CMK uses RSA-2048/4096. This module’s projection, not a Microsoft statement: an ML-KEM wrapper for the CMK via key rotation.',
  },
  {
    id: 'postgresql',
    dbName: 'PostgreSQL 16 / pg_tde',
    vendor: 'PostgreSQL / Percona',
    dbType: 'relational',
    encryptionLayers: ['tde', 'field', 'application'],
    tdeMechanism:
      'pg_tde extension (Percona) — AES-128/256-CBC for table files, AES-128/256-CTR for WAL; a principal key held in an external key provider protects the internal keys',
    columnEncryption: 'pgcrypto extension — pgp_sym_encrypt / pgp_pub_encrypt (no native CLE)',
    catalogName: 'PostgreSQL',
    pqcTimeline:
      'No Percona date is cited in this module; an ML-KEM key provider is this module’s projection.',
    keyManagement: ['byok', 'hyok'],
    hsmIntegration: false,
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
    migrationComplexity: 'medium',
    notes:
      'Open-source: native TDE not in upstream PostgreSQL; pg_tde adds it. pgcrypto uses OpenPGP — no native HSM integration. pg_tde supports a local keyring file and external key providers including KMIP, Vault and OpenBao; Percona’s FAQ says post-quantum encryption is not yet supported because it relies on OpenSSL.',
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
    fipsScope:
      'MongoDB documentation: FIPS mode exists only in MongoDB Enterprise, runs with a FIPS 140-2 certified OpenSSL library on the supported platforms, and covers MongoDB’s use of TLS/SSL, SCRAM and X.509 authentication. The module, certificate number and approved configuration are not verified here, and the documentation does not extend this to other features.',
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
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
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
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
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
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
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
    fipsScope:
      'Unverified here: confirm the cryptographic module, its CMVP certificate and the approved configuration for the release and platform you run. Algorithm availability in the product says nothing about validation scope.',
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
      'Configure a PQC-capable KMS (AWS KMS creates ML-KEM keys, but its import wrapping keys are RSA only) to generate ML-KEM-1024 key wrapping keys. Establish KMIP v2 connectivity from the database server.',
    classicalApproach:
      'External KMS with RSA-2048/4096 TLS-wrapped KMIP connection. Key wrapping via RSA-OAEP or AES-WRAP.',
    pqcApproach:
      'Thales CipherTrust Manager (its release notes list ML-KEM for the web interface API from v2.20.0 and, as a technical preview, for the SSH interface from v2.21.0; ML-KEM-1024 key wrapping is this module’s projection, not a Thales statement). AWS KMS offers ML-DSA signing keys (GA June 2025), ML-KEM key specs and hybrid post-quantum TLS (ML-KEM key exchange) on its endpoints, but its import wrapping keys are RSA only. KMIP 3.0 object type CryptographicAlgorithm = ML-KEM.',
    downtime: 'None',
    risk: 'medium',
    tooling: [
      'Thales CipherTrust Manager (ML-KEM on its web interface from v2.20.0)',
      'AWS KMS (ML-DSA signing keys and ML-KEM key specs)',
      'HashiCorp Vault 1.17+',
      'KMIP 3.0 client',
    ],
  },
  {
    id: 'master-key-rotation',
    step: 3,
    title: 'Protector Rotation: Re-wrap the DEKs Under a New Master Key',
    description:
      'Rotating the protector (master or principal key) re-wraps the existing DEKs under a new key; the encrypted data files are not rewritten. Use an ML-KEM-based protector only where your key manager and database integration actually offer one. Old wrapped entries remain until the re-wrap completes.',
    classicalApproach:
      'Oracle: ADMINISTER KEY MANAGEMENT SET KEY rotates the TDE master encryption key. SQL Server: ALTER DATABASE ENCRYPTION KEY ENCRYPTION BY SERVER CERTIFICATE or ASYMMETRIC KEY re-protects the same key under a different protector. pg_tde: pg_tde_set_key_using_database_key_provider rotates the principal key and re-encrypts the internal keys. MongoDB: KeyVault.rewrapManyDataKey() re-wraps data keys with a new customer master key without changing them.',
    pqcApproach:
      'Design target, not a documented engine command: generate an ML-KEM-1024 key pair in the HSM or key manager, use ML-KEM.Encaps to produce a shared secret, derive a key-encryption key from it (KDF), and wrap the DEK with that key; keep the KEM ciphertext (1,568 bytes) with the wrapped DEK during the transition. None of the commands above is shown here to accept an ML-KEM protector, so confirm engine and key-manager support before planning this step.',
    downtime:
      'Sample assumption: a metadata-only update; measure on a representative copy before planning a window',
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
    title: 'DEK Rotation and Bulk Rewrite (Only When the DEK Changes)',
    description:
      'Re-wrapping does not change the DEK, and moving the protector to ML-KEM does not change how the data files are encrypted. Rewrite data only if you must replace the DEK itself (for example after suspected exposure or to change the data cipher); that is a separate and heavier operation than step 3.',
    classicalApproach:
      'Oracle Database 21c: ALTER TABLESPACE ... ENCRYPTION ONLINE REKEY builds a new datafile for each datafile, so free disk space must be at least the space the tablespace uses. SQL Server: ALTER DATABASE ENCRYPTION KEY REGENERATE WITH ALGORITHM = AES_256 creates a new database encryption key. pg_tde: internal keys are fixed once a file is created, so rewriting the table (VACUUM FULL or an ALTER TABLE that rewrites it) creates a new key, at the cost of an exclusive lock on the table.',
    pqcApproach:
      'Not needed for a protector change: Shor’s algorithm does not break AES-256 data encryption. Plan a bulk rewrite only for DEK rotation, and size time, storage and locking from a representative test rather than a fixed estimate. Any commands above are shown for the engines and versions named; check your own version’s documentation.',
    downtime:
      'Depends on engine and data size (Oracle online conversion needs extra disk space; a pg_tde table rewrite locks the table). Sample assumption only: measure on a representative copy',
    risk: 'high',
    tooling: [
      'Oracle ALTER TABLESPACE ... ENCRYPTION ONLINE REKEY',
      'SQL Server ALTER DATABASE ENCRYPTION KEY',
      'pg_tde: VACUUM FULL or a rewriting ALTER TABLE',
      'Representative performance and recovery test environment',
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
    tooling: ['DBCC CHECKDB', 'Oracle RMAN', 'pg_tde_verify_key', 'Custom decrypt test scripts'],
  },
  {
    id: 'decommission',
    step: 6,
    title: 'Decommission Classical Keys',
    description:
      'After all tablespaces/collections confirm the new protector is active, deactivate the old RSA-wrapped master keys. Destroy them only after you have inventoried every backup, archive and replica that depends on them, proven that restores work without them or that those copies are re-protected, and checked legal and contractual retention. Update KMS policy to reject new RSA key wrapping requests.',
    classicalApproach:
      'Deactivate or archive the old key in the key manager (for example Oracle Key Vault key state management) and keep it available until every backup, archive and replica that needs it is accounted for. Example only, with a fictional 12-month hold: no destruction decision before that hold ends and the checks in this step pass. Retention length comes from your own policy and legal requirements, not from this module.',
    pqcApproach:
      'Mark RSA keys as DEACTIVATED in KMS (not deleted — they may be needed to decrypt old backups). Move them to Destroyed (KMIP lifecycle: Deactivated → Destroyed) only after the dependency inventory, restore tests and retention checks pass; the 12-month hold in the classical column is a fictional example, not a rule. Enforce a policy that rejects new RSA wrapping once the replacement is proven.',
    downtime: 'None',
    risk: 'low',
    tooling: [
      'Oracle Key Vault state management',
      'AWS KMS key state API',
      'Thales CipherTrust lifecycle',
      'Backup, archive and replica inventory',
      'Restore test runs',
    ],
  },
]

// ─── BYOK Architectures ───────────────────────────────────────────────────────

export const BYOK_ARCHITECTURES: BYOKArchitecture[] = [
  {
    id: 'provider-managed',
    pattern: 'Provider-Managed Keys',
    description:
      'The cloud provider generates, stores, and manages encryption keys entirely. Master-key custody: the provider. Plaintext DEK exposure: the provider’s key service and database engine handle plaintext DEKs. Access revocation: the customer cannot independently withdraw the provider’s access to the keys. Simplest operational model; the customer relies on the provider’s controls.',
    kmsProvider: 'AWS KMS default / Azure KV default / Google Cloud KMS default',
    keyType: 'AES-256 symmetric (provider-generated)',
    wrappingAlgorithm:
      'Service-specific and opaque to the customer. AWS KMS documents an AES-GCM key hierarchy and Google Cloud wraps DEKs with AES KEKs; RSA-OAEP appears in key import and transport, not as a general default envelope',
    dataKey:
      'AES-based DEK, generated per database/tablespace; algorithm and key size vary by service and configuration',
    pqcUpgrade:
      'The provider must upgrade its internal KMS. No customer action is required, but there is no customer control either; the timeline depends on AWS/Azure/GCP.',
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
      'The provider’s key service can unwrap the DEKs, and the customer holds no master key to revoke',
      'No customer control over PQC timeline',
      'Key custody sits with the provider, so the entity relies on provider controls for key-lifecycle requirements such as DORA RTS 2024/1774 Article 7',
      'Key escrow risk for regulated industries',
    ],
  },
  {
    id: 'byok',
    pattern: 'BYOK (Bring Your Own Key)',
    description:
      'Customer generates the master key (typically in an on-prem HSM), then imports the key material into the cloud KMS. Master-key custody: the customer keeps the original and the cloud KMS keeps a usable copy. Plaintext DEK exposure: the cloud KMS and database engine still handle plaintext DEKs. Access revocation: the customer can expire or delete the imported copy in the KMS (AWS KMS documents both) and reimport it later if wanted. The customer controls key generation and the rotation schedule.',
    kmsProvider: 'AWS KMS BYOK / Azure Key Vault BYOK / GCP Cloud KMS import',
    keyType: 'Customer-generated AES-256 or RSA-4096 (imported to cloud KMS)',
    wrappingAlgorithm: 'RSA-OAEP import wrapping (customer wraps key before upload)',
    dataKey: '256-bit AES-GCM DEK, wrapped by imported CMK in cloud KMS',
    pqcUpgrade:
      'Design target (AWS KMS import wrapping keys are RSA only, and AWS KMS cannot import key material into ML-KEM or ML-DSA KMS keys): download an ML-KEM-1024 public wrapping key from the Cloud KMS, generate the new CMK on-prem, run ML-KEM.Encaps to derive a shared secret and ciphertext, wrap the CMK with the shared secret (AES-KWP), and upload the ciphertext and wrapped CMK.',
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
      'Customer can expire or delete the imported key material in the cloud KMS to cut off its use',
      'Satisfies most regulatory BYOK requirements',
    ],
    cons: [
      'Cloud KMS keeps a usable copy of the imported key material until it expires or is deleted',
      'Key import format must support ML-KEM (provider-dependent)',
      'Requires on-prem HSM infrastructure',
      'The imported copy stays under the provider’s operational controls while it exists',
    ],
  },
  {
    id: 'hyok',
    pattern: 'HYOK (Hold Your Own Key)',
    description:
      'Customer holds the master key in on-premises infrastructure. Master-key custody: the customer. Plaintext DEK exposure: the cloud database engine sends the wrapped DEK to the on-premises service and receives the plaintext DEK back to encrypt and decrypt data, so the provider’s database process holds the plaintext DEK while it is unwrapped. Access revocation: the customer can stop unwrapping, which blocks new unwraps but does not protect data in use from a provider that operates the database process.',
    kmsProvider: 'Thales CipherTrust / Entrust DataControl / Utimaco HSM',
    keyType: 'ML-KEM-1024 key pair in FIPS 140-3 Level 3+ on-prem HSM',
    wrappingAlgorithm: 'ML-KEM-1024 (key encapsulation) + AES-256-KW (DEK wrap)',
    dataKey: 'AES-256 DEK wrapped by ML-KEM-derived wrapping key; stored in cloud DB metadata',
    pqcUpgrade:
      'Design target: whether HYOK can use ML-KEM depends on the on-premises HSM supporting it and on the database or KMS integration accepting a KEM-based unwrap; PKCS#11 v3.2 defines ML-KEM mechanisms, but support in each HSM and integration is vendor-specific and not verified here.',
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
      'The master key stays in customer infrastructure (the plaintext DEK does not)',
      'The customer chooses when to upgrade the on-premises HSM, if the integration accepts the new mechanism',
      'Keeps key custody inside the customer’s own key-lifecycle controls (cf. DORA RTS 2024/1774 Article 7)',
      'ML-KEM-1024 is the key-establishment algorithm CNSA 2.0 specifies',
      'Customer can withhold or revoke unwrap access, so copies of the encrypted data or backups cannot be opened without the customer’s key service',
    ],
    cons: [
      'High operational complexity (on-prem HSM cluster)',
      'Latency added for every DEK unwrap operation',
      'Higher cost (FIPS 140-3 HSM hardware + maintenance)',
      'Requires 24/7 on-prem KMS availability',
    ],
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
      'Column Master Key (CMK) wraps Column Encryption Key (CEK) using RSA-OAEP. With a secure enclave, randomized encryption supports range comparison and pattern matching inside the enclave (not sourced in the Library).',
    limitations:
      'Without an enclave: deterministic encryption allows equality comparisons, equality joins, grouping and DISTINCT, and randomized encryption allows no computation on the column. With an enclave (randomized encryption): comparison operators, BETWEEN, IN, LIKE, DISTINCT and joins, plus ORDER BY and GROUP BY in SQL Server 2022 and Azure SQL Database. SQL Server supports VBS enclaves only; Intel SGX enclaves in Azure SQL Database reach end of support on 31 October 2027. CMK rotation requires re-encryption of all CEKs.',
    pqcRoadmap:
      'No Microsoft roadmap is cited in this module. In this module’s reading, enclave-based range queries are unaffected because they use symmetric crypto; the PQC change is in CMK wrapping.',
  },
  {
    id: 'oracle-csqe',
    name: 'Oracle client-side query encryption (unverified)',
    vendor: 'Oracle',
    queryTypes: ['equality'],
    pqcCompatible: false,
    encryptionScheme:
      'Not verified against Oracle documentation: this module could not locate an Oracle product or feature with this name. Read it as a generic client-side pattern (deterministic AES or HMAC-based tokens, client-managed keys), not as a description of an Oracle feature.',
    limitations:
      'Not verified against Oracle documentation. In the generic pattern, deterministic tokens allow only equality matching, and key management sits in the client application layer.',
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
      'TDE-only — AES-CBC for table files and AES-CTR for WAL. pg_tde does NOT support queryable encryption; all queries run on plaintext data after decryption by the TDE layer at storage I/O.',
    limitations:
      'No queryable encryption. Not in upstream PostgreSQL (requires Percona or custom build). No native HSM integration; an HSM is reachable only through an external key provider such as a KMIP server. KMIP is already a supported key provider.',
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
