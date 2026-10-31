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

2. **PQC-Capable External KMS Setup** — Configure Thales CipherTrust 2.15+, AWS KMS (ML-DSA signing keys, ML-KEM key specs and hybrid post-quantum TLS on its endpoints, but RSA-only import wrapping keys), or Azure Key Vault with KMIP v2.1 connectivity. Object type: ML-KEM key (the Cryptographic Algorithm value ML-KEM is defined in KMIP 3.0, Committee Specification Draft 02, not in KMIP 2.1).

3. **Master Key Rotation** — Generate ML-KEM-1024 key pair in HSM. Use ML-KEM.Encaps to produce a shared secret, derive a key-encryption key from it (KDF), and wrap the new 256-bit DEK with that key; store the KEM ciphertext (1,568 bytes) plus the wrapped DEK alongside the old RSA entry during transition.

4. **Online Re-Encryption** — Oracle: `ALTER TABLESPACE REKEY`. SQL Server: `ALTER DATABASE ENCRYPTION KEY REGENERATE WITH ALGORITHM = AES_256`. MongoDB: `db.adminCommand({ rotateMasterKey: 1 })`. All support online migration with zero application downtime.

5. **Integrity Verification** — DBCC CHECKDB (SQL Server) / Oracle RMAN validation. Test ML-KEM ciphertext decapsulation end-to-end.

6. **Decommission Classical Keys** — Mark RSA keys as DEACTIVATED (not deleted — needed for old backups). Enforce ML-KEM-only policy for new key wrapping.

**Key insight**: AES-256 symmetric data encryption is already quantum-safe. PQC migration scope for TDE is limited to DEK wrapping algorithm replacement.

---

## BYOK/HYOK Patterns

### Provider-Managed (30% PQC Readiness)

- Cloud provider generates and stores all key material
- No customer control over PQC migration timeline
- Key custody sits with the provider; regulated entities rely on provider controls for key-lifecycle requirements (for example DORA RTS 2024/1774 Article 7)

### BYOK — Bring Your Own Key (65% PQC Readiness)

- Customer generates key in on-prem HSM, uploads wrapped CMK to cloud KMS
- ML-KEM-1024 wrapping for import is a design target: AWS KMS creates ML-KEM keys, but its import wrapping keys are RSA only; check Azure and Google Cloud per service
- Cloud KMS briefly holds unwrapped CMK in HSM memory — residual exposure
- Satisfies most regulatory BYOK requirements

### HYOK — Hold Your Own Key (90% PQC Readiness)

- Customer key never leaves on-premises infrastructure
- Cloud database receives only encrypted DEKs
- On-prem HSM: Thales CipherTrust, Entrust DataControl, Utimaco
- ML-KEM-1024 PKCS#11 v3.2 mechanisms: `CKM_ML_KEM_KEY_PAIR_GEN`, `CKM_ML_KEM`
- Key flow: ML-KEM-1024.Encaps(ek) → KEM ciphertext (1,568 B) + shared_secret → HKDF-SHA-256 → 256-bit wrapping key → AES-256-KW(DEK)
- A design for keeping key custody with the customer; no regulation named in this module requires HYOK (DORA RTS 2024/1774 Articles 6 and 7 require a key-management policy and key-lifecycle controls)

---

## Queryable Encryption PQC Compatibility

| Scheme                      | Equality | Range   | Prefix | PQC Ready                 |
| --------------------------- | -------- | ------- | ------ | ------------------------- |
| MongoDB FLE 2.0             | ✓        | ✓       | ✓      | Planned 2026              |
| SQL Server Always Encrypted | ✓        | Enclave | ✗      | Planned 2026              |
| Oracle CSQE                 | ✓        | ✗       | ✗      | Planned                   |
| pg_tde (Percona)            | ✗        | ✗       | ✗      | Not applicable (TDE only) |

**MongoDB FLE 2.0** uses HMAC-SHA-256 tokens for equality queries (quantum-safe) and structured encryption over fully randomized ciphertext for range queries. DEK wrapping uses RSA-OAEP — ML-KEM-1024 upgrade planned in MongoDB 8.x (2026).

**SQL Server Always Encrypted** with secure enclaves (VBS/SGX) supports range queries inside the enclave. CMK wrapping uses RSA-OAEP (RSA-2048/4096).

**PQC challenge**: Range-query encryption (structured encryption range schemes; MongoDB uses fully randomized ciphertext, not order-preserving encryption) is not yet standardized for PQC. Equality tokens (HMAC-SHA-256) are already quantum-safe.

---

## Compliance Requirements

### GDPR Art. 32

- GDPR Article 32(1) names "the state of the art" among the factors for appropriate technical and organisational measures; it prescribes no algorithm and no date
- HYOK keeps key custody with the controller; this module does not present it as required
- This module advises that databases retaining PII beyond 2030 prioritize ML-KEM DEK wrapping

### HIPAA § 164.312(a)(2)(iv)

- Encryption of ePHI at rest; records retained 50+ years (highest HNDL risk)
- Healthcare databases are highest-priority migration target
- HHS has not yet issued PQC-specific guidance; NSM-10 applies to federal systems

### DORA Art. 9 (Digital Operational Resilience Act)

- Applies from 17 January 2025 to EU financial entities
- RTS 2024/1774 Article 6: a policy on encryption and cryptographic controls, with provisions for updating or changing the cryptographic technology on the basis of developments in cryptanalysis; Article 7: key-lifecycle controls
- The RTS names no algorithm and does not name HYOK; a PQC-capable HSM for financial databases is this module's recommendation

### PCI DSS v4 Req. 3.5

- Strong cryptography for PAN at rest; key management processes
- PCI SSC monitoring ANSI X9.146 quantum-safe framework (expected 2026)
- DUKPT upgrade needed for card infrastructure (10-15 year lifecycle HSMs)

### NSM-8 / CNSA 2.0

- CNSA 2.0 for National Security Systems: ML-KEM-1024 for key establishment (NSA CNSA 2.0 FAQ, v2.2)
- New NSS acquisitions: CNSA 2.0 required from 1 January 2027 (CNSSP 15)
- Fielded equipment transitions: by 31 December 2030
- CNSA 2.0 algorithms mandated for use in NSS by 31 December 2031
- SLH-DSA is not part of CNSA and is not approved for any use in NSS

---

## Vendor Timelines

No vendor PQC dates for databases are cited in this module; any vendor date or roadmap shown elsewhere in it is this module's projection. Oracle states that Oracle AI Database 26ai supports ML-KEM and an ML-KEM and ECDHE based hybrid for key-exchange secrets for TLS sessions.

---

## Key Technical Facts

- **AES-256 is quantum-safe**: Grover's algorithm reduces effective bits from 256 to 128 — still above the 112-bit security minimum. No data file re-encryption needed.
- **DEK wrapping is the PQC target**: RSA-OAEP and ECDH used to wrap DEKs must be replaced with a standardized KEM: ML-KEM-768 is the FIPS 203 default; ML-KEM-1024 where a policy such as CNSA 2.0 requires it.
- **ML-KEM-1024 key sizes**: Public key: 1,568 bytes (vs 256 bytes RSA-2048). Ciphertext: 1,568 bytes. ~6× metadata overhead per DEK — negligible for multi-TB databases.
- **Online migration**: Oracle (`ALTER TABLESPACE REKEY`) and SQL Server (`ALTER DATABASE ENCRYPTION KEY REGENERATE`) support zero-downtime TDE re-keying.
- **HNDL risk**: Database backups captured today with RSA-wrapped DEKs may be decryptable after a CRQC arrives. Priority: databases with long data retention (healthcare, financial records, classified).
- **KMIP 2.1**: Key Management Interoperability Protocol version 2.1 (published Dec 2020, latest ratified OASIS standard); ML-KEM, ML-DSA and SLH-DSA Cryptographic Algorithm values are defined in KMIP 3.0 (Committee Specification Draft 02, May 2026), which is not ratified; KMIP 2.1 has none. Thales CipherTrust 2.15+ supports PQC key types; HashiCorp Vault's only PQC is experimental transit ML-DSA in Vault Enterprise 1.19.
