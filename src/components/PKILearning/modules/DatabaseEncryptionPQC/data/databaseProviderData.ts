// SPDX-License-Identifier: GPL-3.0-only

export type VendorPQCStatus = 'ga' | 'preview' | 'planned' | 'none'

export interface VendorAlgorithm {
  name: string
  status: string
  since?: string
}

export interface DatabaseVendorEntry {
  id: string
  vendor: string
  product: string
  pqcStatus: VendorPQCStatus
  keyManagementIntegrations: string[]
  certifications: string[]
  pqcAlgorithms: {
    kem: VendorAlgorithm[]
    sign: VendorAlgorithm[]
  }
  releaseTimeline: string
  notes: string
  externalKmsUrl?: string
}

export const VENDOR_STATUS_LABELS: Record<VendorPQCStatus, { label: string; className: string }> = {
  ga: {
    label: 'GA',
    className: 'bg-status-success/15 text-status-success border-status-success/30',
  },
  preview: {
    label: 'Preview',
    className: 'bg-status-info/15 text-status-info border-status-info/30',
  },
  planned: {
    label: 'Planned',
    className: 'bg-status-warning/15 text-status-warning border-status-warning/30',
  },
  none: {
    label: 'No PQC',
    className: 'bg-muted text-muted-foreground border-border',
  },
}

export const DATABASE_VENDORS: DatabaseVendorEntry[] = [
  {
    id: 'oracle',
    vendor: 'Oracle',
    product: 'Oracle Database 23ai + Oracle Key Vault 21.x',
    pqcStatus: 'planned',
    keyManagementIntegrations: [
      'Oracle Key Vault (HYOK)',
      'OCI Vault (BYOK)',
      'Thales CipherTrust (KMIP)',
      'AWS CloudHSM',
    ],
    certifications: ['FIPS 140-3 Level 2 (Oracle DBMS)'],
    pqcAlgorithms: {
      kem: [
        { name: 'ML-KEM-1024', status: 'Planned 2026 (OKV 22.0)', since: '2026' },
        { name: 'X25519+ML-KEM-768 (Hybrid)', status: 'Under evaluation' },
      ],
      sign: [{ name: 'ML-DSA-65', status: 'Planned 2026 (code signing only)' }],
    },
    releaseTimeline:
      'Oracle 23ai (2024): AI vector encryption. Oracle Key Vault 22.0 (planned 2026): ML-KEM-1024 HYOK support. future Oracle release: full PQC TDE integration (roadmap).',
    notes:
      'Oracle TDE uses AES-256 for data files; DEK wrapping uses RSA-2048 or RSA-4096. Migration to ML-KEM-1024 requires Oracle Key Vault upgrade. ALTER TABLESPACE REKEY supports online migration with zero downtime.',
    externalKmsUrl: 'https://docs.oracle.com/en/database/oracle/oracle-database/23/asoag/',
  },
  {
    id: 'sqlserver',
    vendor: 'Microsoft',
    product: 'SQL Server 2022 / Azure SQL Managed Instance',
    pqcStatus: 'planned',
    keyManagementIntegrations: [
      'Azure Key Vault (BYOK/HYOK)',
      'Azure Managed HSM (FIPS 140-3 L3)',
      'SQL Server EKM (PKCS#11)',
      'Thales Luna HSM via EKM',
    ],
    certifications: [
      'FIPS 140-2 Level 1 (SQL Server TDE)',
      'Azure FIPS 140-3 Level 3 (Managed HSM)',
      'Common Criteria EAL2+',
    ],
    pqcAlgorithms: {
      kem: [
        { name: 'ML-KEM-768', status: 'Planned (Azure KV, 2026)', since: '2026' },
        { name: 'ML-KEM-1024', status: 'Planned (Azure Managed HSM, 2026)' },
      ],
      sign: [
        { name: 'ML-DSA-44', status: 'Planned (Azure KV, 2026)' },
        { name: 'ML-DSA-65', status: 'Under evaluation' },
      ],
    },
    releaseTimeline:
      'SQL Server 2022: TDE with AES-256, Always Encrypted with secure enclaves. Azure Key Vault ML-KEM: planned H2 2026. SQL Server vNext: on-prem PQC EKM provider support.',
    notes:
      'Always Encrypted CMK uses RSA-OAEP wrapping (RSA-2048/4096). Azure Key Vault upgrade to ML-KEM will provide transparent CMK rotation. On-prem SQL Server requires EKM provider DLL update. ALTER DATABASE ENCRYPTION KEY supports online rotation.',
    externalKmsUrl:
      'https://learn.microsoft.com/en-us/sql/relational-databases/security/encryption/always-encrypted-database-engine',
  },
  {
    id: 'postgresql',
    vendor: 'PostgreSQL / Percona',
    product: 'PostgreSQL 16 + pg_tde (Percona)',
    pqcStatus: 'planned',
    keyManagementIntegrations: [
      'Thales CipherTrust (KMIP 2.0)',
      'HashiCorp Vault (KV secrets)',
      'AWS KMS (via pg_tde key provider)',
      'Custom key provider API',
    ],
    certifications: [],
    pqcAlgorithms: {
      kem: [{ name: 'ML-KEM-1024 (via KMIP provider)', status: 'Planned (pg_tde 2.0, 2026)' }],
      sign: [],
    },
    releaseTimeline:
      'PostgreSQL 16 (2023): no native TDE. pg_tde 1.x (2024): AES-256-XTS TDE via Percona. pg_tde 2.0 (planned 2026): KMIP 2.1 with ML-KEM key provider. Native PostgreSQL TDE: under discussion for PG18/19.',
    notes:
      'pgcrypto extension provides function-level encryption (pgp_sym_encrypt) but not TDE. pg_tde is Percona-maintained. No HSM direct integration in open-source stack — requires KMIP gateway. TDE key hierarchy: master key (KMIP) → tablespace key (AES-256-XTS).',
    externalKmsUrl: 'https://docs.percona.com/percona-server-for-postgresql/16/tde.html',
  },
  {
    id: 'mongodb',
    vendor: 'MongoDB',
    product: 'MongoDB 7.x Enterprise + Atlas',
    pqcStatus: 'planned',
    keyManagementIntegrations: [
      'AWS KMS (BYOK via Atlas)',
      'Azure Key Vault (BYOK via Atlas)',
      'Google Cloud KMS (BYOK via Atlas)',
      'KMIP 2.0 (on-prem)',
      'HashiCorp Vault (KMIP)',
    ],
    certifications: ['FIPS 140-2 Level 1 (MongoDB FIPS mode)', 'SOC 2 Type II (Atlas)'],
    pqcAlgorithms: {
      kem: [
        {
          name: 'ML-KEM-1024 (FLE 2.0 DEK wrapping)',
          status: 'Planned (MongoDB 8.x, 2026)',
          since: '2026',
        },
      ],
      sign: [],
    },
    releaseTimeline:
      'MongoDB 6.x FLE 2.0 (2022): equality/range queries on encrypted fields. MongoDB 7.x: range query GA. MongoDB 8.x (planned 2026): ML-KEM DEK wrapping for FLE 2.0 key management endpoint.',
    notes:
      'FLE 2.0 DEK wrapping uses RSA-OAEP (RSA-2048). Atlas BYOK uses cloud KMS for master key. On-prem: KMIP 2.0 connects to Thales/HashiCorp. MongoDB WiredTiger encryption uses AES-256-CBC at file level — already quantum-safe for symmetric layer.',
    externalKmsUrl: 'https://www.mongodb.com/docs/manual/core/queryable-encryption/',
  },
  {
    id: 'mysql',
    vendor: 'Oracle / MariaDB Foundation',
    product: 'MySQL 8.x / MariaDB 11.x',
    pqcStatus: 'none',
    keyManagementIntegrations: [
      'keyring_oci (Oracle Cloud)',
      'keyring_hashicorp (HashiCorp Vault)',
      'keyring_okv (Oracle Key Vault)',
      'keyring_aws (AWS KMS — community plugin)',
    ],
    certifications: [],
    pqcAlgorithms: {
      kem: [],
      sign: [],
    },
    releaseTimeline:
      'MySQL 8.0 (2018): InnoDB encryption. MySQL 8.4 LTS (2024): keyring component improvements. No PQC roadmap announced. MariaDB 11.x: encryption plugin API, no PQC.',
    notes:
      'InnoDB master key is AES-256 stored in keyring. AES_ENCRYPT() SQL function defaults to ECB mode (insecure — no IV). No direct HSM integration; keyring_hashicorp bridges to Vault. MariaDB adds SUPER privilege requirement for keyring operations.',
    externalKmsUrl: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-data-encryption.html',
  },
]
