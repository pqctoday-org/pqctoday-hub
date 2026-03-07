# Database Encryption & PQC — RAG Summary

## Module Overview

**ID**: `database-encryption-pqc`
**Track**: Infrastructure
**Level**: Intermediate
**Duration**: 75 min
**Workshop Steps**: 5

This module covers quantum-safe migration for database encryption layers, TDE key management, BYOK/HYOK architecture, queryable encryption compatibility, and regulatory compliance for enterprise database fleets.

---

## TDE Migration Steps

Transparent Data Encryption (TDE) protects database files on disk using AES-256. The data encryption layer is already quantum-safe — only the DEK wrapping algorithm (RSA-OAEP) requires migration to ML-KEM-1024.

**6-step migration procedure:**

1. **Inventory & Key Hierarchy Audit** — Enumerate all encrypted databases using `sys.dm_database_encryption_keys` (SQL Server) or `V$ENCRYPTED_TABLESPACES` (Oracle). Document RSA/ECC-wrapped DEK locations. Generate CBOM.

2. **PQC-Capable External KMS Setup** — Configure Thales CipherTrust 2.15+, AWS KMS (ML-KEM preview), or Azure Key Vault with KMIP v2.1 connectivity. Object type: `CryptographicAlgorithm = ML-KEM`.

3. **Master Key Rotation** — Generate ML-KEM-1024 key pair in HSM. Use ML-KEM.Encaps to wrap 256-bit DEK. Store KEM ciphertext (1,568 bytes) + wrapped DEK alongside old RSA entry during transition.

4. **Online Re-Encryption** — Oracle: `ALTER TABLESPACE REKEY`. SQL Server: `ALTER DATABASE ENCRYPTION KEY REGENERATE WITH ALGORITHM = AES_256`. MongoDB: `db.adminCommand({ rotateMasterKey: 1 })`. All support online migration with zero application downtime.

5. **Integrity Verification** — DBCC CHECKDB (SQL Server) / Oracle RMAN validation. Test ML-KEM ciphertext decapsulation end-to-end.

6. **Decommission Classical Keys** — Mark RSA keys as DEACTIVATED (not deleted — needed for old backups). Enforce ML-KEM-only policy for new key wrapping.

**Key insight**: AES-256 symmetric data encryption is already quantum-safe. PQC migration scope for TDE is limited to DEK wrapping algorithm replacement.

---

## BYOK/HYOK Patterns

### Provider-Managed (30% PQC Readiness)

- Cloud provider generates and stores all key material
- No customer control over PQC migration timeline
- Not compliant with DORA, ENISA, or NSM-8 for regulated workloads

### BYOK — Bring Your Own Key (65% PQC Readiness)

- Customer generates key in on-prem HSM, uploads wrapped CMK to cloud KMS
- ML-KEM-1024 wrapping for import: AWS KMS and Azure Key Vault planned 2026
- Cloud KMS briefly holds unwrapped CMK in HSM memory — residual exposure
- Satisfies most regulatory BYOK requirements

### HYOK — Hold Your Own Key (90% PQC Readiness)

- Customer key never leaves on-premises infrastructure
- Cloud database receives only encrypted DEKs
- On-prem HSM: Thales CipherTrust, Entrust DataControl, Utimaco
- ML-KEM-1024 PKCS#11 v3.2 mechanisms: `CKM_ML_KEM_KEY_PAIR_GEN`, `CKM_ML_KEM`
- Key flow: ML-KEM-1024.Encaps(ek) → KEM ciphertext (1,568 B) + shared_secret → HKDF-SHA-256 → 256-bit wrapping key → AES-256-KW(DEK)
- Required for: NSM-8 classified systems, DORA Art. 9 financial entities, ENISA HYOK guidelines

---

## Queryable Encryption PQC Compatibility

| Scheme                      | Equality | Range   | Prefix | PQC Ready                 |
| --------------------------- | -------- | ------- | ------ | ------------------------- |
| MongoDB FLE 2.0             | ✓        | ✓       | ✓      | Planned 2026              |
| SQL Server Always Encrypted | ✓        | Enclave | ✗      | Planned 2026              |
| Oracle CSQE                 | ✓        | ✗       | ✗      | Planned                   |
| pg_tde (Percona)            | ✗        | ✗       | ✗      | Not applicable (TDE only) |

**MongoDB FLE 2.0** uses HMAC-SHA-256 tokens for equality queries (quantum-safe) and order-preserving encryption for range queries. DEK wrapping uses RSA-OAEP — ML-KEM-1024 upgrade planned in MongoDB 8.x (2026).

**SQL Server Always Encrypted** with secure enclaves (VBS/SGX) supports range queries inside the enclave. CMK wrapping uses RSA-OAEP (RSA-2048/4096). Azure Key Vault ML-KEM support planned 2026.

**PQC challenge**: Range-query encryption (OPE, range-revealing encryption) is not yet standardized for PQC. Equality tokens (HMAC-SHA-256) are already quantum-safe. Expect formal NIST standards for PQC-compatible queryable encryption by 2028.

---

## Compliance Requirements

### GDPR Art. 32

- "State of the art" technical measures for personal data
- ENISA recommendations will require PQC for long-lived personal data by 2026
- HYOK architecture strongly preferred for GDPR compliance
- Databases retaining PII beyond 2030 should prioritize ML-KEM DEK wrapping

### HIPAA § 164.312(a)(2)(iv)

- Encryption of ePHI at rest; records retained 50+ years (highest HNDL risk)
- Healthcare databases are highest-priority migration target
- HHS has not yet issued PQC-specific guidance; NSM-10 applies to federal systems

### DORA Art. 9 (Digital Operational Resilience Act)

- Applies from January 2025 to EU financial entities
- "State of the art" cryptographic controls required
- EBA/ESMA/EIOPA guidelines expected 2026 will specify PQC timelines
- HYOK with PQC-capable HSM needed for compliance

### PCI DSS v4 Req. 3.5

- Strong cryptography for PAN at rest; key management processes
- PCI SSC monitoring ANSI X9.146 quantum-safe framework (expected 2026)
- DUKPT upgrade needed for card infrastructure (10-15 year lifecycle HSMs)

### NSM-8 / CNSA 2.0

- ML-KEM-1024 exclusively for US federal/NSS key establishment
- New capabilities: PQC by 2027
- All legacy systems: ML-KEM-only by 2033
- HYOK with FIPS 140-3 Level 3+ HSM mandatory for classified databases
- RSA/ECC key wrapping prohibited after 2033

---

## Vendor Timelines

| Vendor               | Product                   | PQC Status | Timeline                                 |
| -------------------- | ------------------------- | ---------- | ---------------------------------------- |
| Oracle               | Database 23ai + Key Vault | Planned    | 2026 (OKV 22.0, ML-KEM-1024 HYOK)        |
| Microsoft            | SQL Server / Azure SQL    | Planned    | 2026 (Azure KV ML-KEM-768/1024)          |
| PostgreSQL / Percona | pg_tde                    | Planned    | 2026 (pg_tde 2.0, KMIP 2.1)              |
| MongoDB              | Enterprise 7.x / Atlas    | Planned    | 2026 (MongoDB 8.x, FLE 2.0 DEK wrapping) |
| MySQL / MariaDB      | 8.x / 11.x                | None       | No roadmap announced                     |
| Cockroach Labs       | CockroachDB 23.x          | None       | KMIP v2 integration only                 |

---

## Key Technical Facts

- **AES-256 is quantum-safe**: Grover's algorithm reduces effective bits from 256 to 128 — still above the 112-bit security minimum. No data file re-encryption needed.
- **DEK wrapping is the PQC target**: RSA-OAEP and ECDH used to wrap DEKs must be replaced with ML-KEM-1024.
- **ML-KEM-1024 key sizes**: Public key: 1,568 bytes (vs 256 bytes RSA-2048). Ciphertext: 1,568 bytes. ~6× metadata overhead per DEK — negligible for multi-TB databases.
- **Online migration**: Oracle (`ALTER TABLESPACE REKEY`) and SQL Server (`ALTER DATABASE ENCRYPTION KEY REGENERATE`) support zero-downtime TDE re-keying.
- **HNDL risk**: Database backups captured today with RSA-wrapped DEKs may be decryptable after a CRQC arrives. Priority: databases with long data retention (healthcare, financial records, classified).
- **KMIP 2.1**: Key Management Interoperability Protocol version 2.1 supports `CryptographicAlgorithm = ML-KEM`. Thales CipherTrust 2.15+ and HashiCorp Vault 1.17+ support PQC key types.
