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

Transparent Data Encryption (TDE) encrypts database files on disk. Cipher and mode vary by product and configuration; AES-256 is one common option and retains a 128-bit margin against generic quantum search. Review key establishment, DEK wrapping, KMS links and TLS separately. An ML-KEM wrapping workflow is a design proposal unless the named product documents support.

**6-step migration procedure:**

1. **Inventory & Key Hierarchy Audit** — Enumerate all encrypted databases using `sys.dm_database_encryption_keys` (SQL Server) or `V$ENCRYPTED_TABLESPACES` (Oracle). Document RSA/ECC-wrapped DEK locations. Generate CBOM.

2. **PQC-Capable External KMS Setup** — Configure AWS KMS (ML-DSA signing keys, ML-KEM key specs and hybrid post-quantum TLS in the Regions where AWS KMS is available (the AWS KMS TLS page says all endpoints, including FIPS 140-3 validated ones; the Infrastructure security page excludes the China Regions and FIPS endpoints in AWS GovCloud (US)), but RSA import wrapping keys (SM2 wrapping keys in the China Regions only); Decapsulate returns the shared secret to the caller and AWS KMS has no KMIP endpoint), or a KMS that offers a KMIP endpoint for KMIP v2.1 connectivity. Object type: ML-KEM key (the Cryptographic Algorithm value ML-KEM is defined in KMIP 3.0, Committee Specification Draft 02, not in KMIP 2.1).

3. **Master Key Rotation** — Generate ML-KEM-1024 key pair in HSM. Use ML-KEM.Encaps to produce a shared secret, derive a key-encryption key from it (KDF; this is this module's design, since FIPS 203 says the shared secret can be used directly as a key in symmetric-key cryptography), and wrap the new 256-bit DEK with that key; store the KEM ciphertext (1,568 bytes) plus the wrapped DEK alongside the old RSA entry during transition.

4. **Data-key rewrite, only when the DEK changes** — Oracle: `ALTER TABLESPACE <name> ENCRYPTION ONLINE REKEY` changes/re-encrypts the tablespace and builds replacement datafiles (needs free space). SQL Server: `ALTER DATABASE ENCRYPTION KEY REGENERATE WITH ALGORITHM = AES_256` starts database encryption work and has operation restrictions. MongoDB Enterprise's `security.kmip.rotateMasterKey: true` rotates the KMIP master key and re-encrypts the internal keystore while leaving database keys unchanged. MongoDB Queryable Encryption/CSFLE uses the separate `KeyVault.rewrapManyDataKey()` API to re-wrap field DEKs. Do not assume zero downtime; test workload, availability and recovery for the product/version.

5. **Integrity Verification** — DBCC CHECKDB (SQL Server) / Oracle RMAN validation. Test ML-KEM ciphertext decapsulation end-to-end.

6. **Decommission Classical Keys** — Mark RSA keys as DEACTIVATED (not deleted — needed for old backups). Enforce ML-KEM-only policy for new key wrapping.

**Key insight**: Shor's algorithm does not break AES, while Grover's algorithm reduces effective key-search strength. Keep the data cipher and the asymmetric key-management path as separate migration questions; do not assume that replacing a DEK protector leaves data files, service availability or KMS integration unchanged.

---

## BYOK/HYOK Patterns

The three patterns differ in key custody and revocation, not in a measured PQC readiness score; this module gives no readiness percentage for them.

### Provider-Managed (the weakest customer control)

- Cloud provider generates and stores all key material
- No customer control over PQC migration timeline
- Key custody sits with the provider; regulated entities rely on provider controls for key-lifecycle requirements (for example DORA RTS 2024/1774 Article 7)

### BYOK — Bring Your Own Key

- In this module's reading, customer generates key in on-prem HSM, uploads wrapped CMK to cloud KMS
- ML-KEM-1024 wrapping for import is a design target: AWS KMS creates ML-KEM keys, but its import wrapping keys are RSA (SM2 in the China Regions); check Azure and Google Cloud per service
- Cloud KMS briefly holds unwrapped CMK in HSM memory — residual exposure
- Satisfies most regulatory BYOK requirements

### HYOK — Hold Your Own Key

- Customer key never leaves on-premises infrastructure
- Cloud database receives the plaintext DEK after the on-premises unwrap
- On-prem HSM: Thales CipherTrust, Entrust DataControl, Utimaco
- ML-KEM-1024 PKCS#11 v3.2 mechanisms: `CKM_ML_KEM_KEY_PAIR_GEN`, `CKM_ML_KEM`
- Key flow: ML-KEM-1024.Encaps(ek) → KEM ciphertext (1,568 B) + shared_secret → HKDF-SHA-256 → 256-bit wrapping key → AES-256-KW(DEK)
- A design for keeping key custody with the customer; no regulation named in this module requires HYOK (DORA RTS 2024/1774 Articles 6 and 7 require a key-management policy and key-lifecycle controls)

---

## Queryable Encryption PQC Compatibility

| Scheme                      | Equality | Range   | Prefix | PQC Ready                 |
| --------------------------- | -------- | ------- | ------ | ------------------------- |
| MongoDB FLE 2.0             | ✓        | ✓       | ✓      | No PQC statement cited    |
| SQL Server Always Encrypted | ✓        | Enclave | ✗      | No PQC statement cited    |
| Oracle CSQE                 | ✓        | ✗       | ✗      | No PQC statement cited    |
| pg_tde (Percona)            | ✗        | ✗       | ✗      | Not applicable (TDE only) |

**MongoDB FLE 2.0** uses HMAC-SHA-256 tokens for equality queries (quantum-safe) and structured encryption over fully randomized ciphertext for range queries (not sourced in the Library). DEK wrapping uses RSA-OAEP — ML-KEM-1024 wrapping is this module's projection, not a MongoDB statement.

**SQL Server Always Encrypted** with secure enclaves (VBS/SGX) supports range queries inside the enclave. CMK wrapping uses RSA-OAEP (RSA-2048/4096) (not sourced in the Library).

**PQC challenge**: Range-query encryption (structured encryption range schemes; MongoDB uses fully randomized ciphertext, not order-preserving encryption) is not yet standardized for PQC. Equality tokens (HMAC-SHA-256) are already quantum-safe.

---

## Compliance Requirements

### GDPR Art. 32

- GDPR Article 32(1) names "the state of the art" among the factors for appropriate technical and organisational measures; it prescribes no algorithm and no date
- HYOK keeps key custody with the controller; this module does not present it as required
- This module advises that databases retaining PII beyond 2030 prioritize ML-KEM DEK wrapping

### HIPAA § 164.312(a)(2)(iv)

- Prioritize ePHI datasets whose confidentiality requirements extend for decades; retention depends on record type and jurisdiction.
- HIPAA does not prescribe ML-KEM or a PQC migration date. The Security Rule requires risk analysis and treats encryption as an addressable implementation specification.
- Apply federal NSS requirements only where the system is in scope; do not generalize them to healthcare databases as a sector.

### DORA Art. 9 (Digital Operational Resilience Act)

- Applies from 17 January 2025 to EU financial entities
- RTS 2024/1774 Article 6: a policy on encryption and cryptographic controls, with provisions for updating or changing, where necessary, the cryptographic technology on the basis of developments in cryptanalysis; Article 7: key-lifecycle controls
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

- **AES-256 and quantum search**: Grover's algorithm reduces generic key-search strength to roughly 128 bits; the database engine's actual cipher and mode depend on product and configuration. A data-key protector change does not itself establish that the data cipher or file was changed.
- **ML-KEM parameter sets**: FIPS 203 recommends ML-KEM-768 as its default parameter set. CNSA 2.0 requires ML-KEM-1024 for applicable National Security Systems use. Check the policy and integration instead of treating one set as universal.
- **ML-KEM-1024 sizes**: Encapsulation key: 1,568 bytes; ciphertext: 1,568 bytes. If a design stores one ciphertext with each wrapped DEK, overhead scales with the key count and serialization format; this module does not present it as a supported engine feature or measured estimate.
- **Key rotation distinctions**: Oracle online tablespace rekeying creates replacement datafiles and needs free space; SQL Server DEK regeneration invokes database encryption work and has operation restrictions. MongoDB Enterprise `security.kmip.rotateMasterKey` re-encrypts its internal keystore and leaves database keys unchanged; MongoDB `KeyVault.rewrapManyDataKey` re-wraps client-side DEKs. Verify operation, workload, availability and recovery behavior for the named product/version.
- **HNDL risk**: Database backups captured today with RSA-wrapped DEKs may be decryptable after a CRQC arrives. Priority: databases with long data retention (healthcare, financial records, classified).
- **KMIP 2.1**: Key Management Interoperability Protocol version 2.1 (published Dec 2020, latest ratified OASIS standard); ML-KEM, ML-DSA and SLH-DSA Cryptographic Algorithm values are defined in KMIP 3.0 (Committee Specification Draft 02, May 2026), which is not ratified; KMIP 2.1 has none. Thales CipherTrust Manager’s release notes list ML-KEM on its web interface from v2.20.0; HashiCorp Vault's only PQC is experimental transit ML-DSA in Vault Enterprise 1.19.
