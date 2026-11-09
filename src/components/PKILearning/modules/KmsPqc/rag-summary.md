---
module_id: kms-pqc
title: KMS & PQC Key Management
track: Hardware Infrastructure
difficulty: intermediate
duration: 60 min
workshop_steps: 7
---

# KMS & PQC Key Management

## Topics Covered

- PQC key management fundamentals (algorithm separation, key size explosion)
- NIST SP 800-227 KEM guidance for key wrapping
- Envelope encryption with ML-KEM vs RSA-OAEP
- Hybrid key wrapping (X25519+ML-KEM-768, ECDH P-256+ML-KEM-768, ECDH P-384+ML-KEM-1024, X-Wing); these KMS key-wrap combiners differ from the TLS hybrid groups of RFC 10024
- KMS provider PQC landscape (AWS KMS, Google Cloud KMS, Azure Key Vault, HashiCorp Vault, Thales CipherTrust, Fortanix DSM)
- PQC key rotation strategies and compliance deadlines (CNSA 2.0, NIST IR 8547)
- Enterprise architecture patterns for multi-cloud PQC key management
- KMIP v3.0 (Committee Specification Draft 02; KMIP 2.1 is the OASIS Standard) protocol operations and PQC key type enumerations; Re-key vs Re-key Key Pair and the key lifecycle
- Cross-provider key sync via KMIP orchestration
- Exchanging keys with a third-party HSM or KMS: AWS KMS import is RSA wrapping only, ML-KEM Decapsulate returns the secret to the caller, Google Cloud KMS quantum-safe import uses HPKE (Preview), Azure BYOK uses CKM_RSA_AES_KEY_WRAP; no quantum-safe import path is described for AWS KMS or Azure Key Vault
- AWS KMS policy controls for PQC keys (kms:KeySpec, kms:KeyUsage on CreateKey); hybrid post-quantum TLS to KMS is a client setting, verified in CloudTrail (tlsDetails.keyExchange)
- Key release to an attested workload: Azure Key Vault Secure Key Release (Managed HSM and Premium) releases an HSM-protected, exportable key to an attested trusted execution environment when the Microsoft Azure Attestation claims satisfy a release policy set when the key is created; AWS KMS works with AWS Nitro Enclaves, and its key-policy condition keys (kms:RecipientAttestation:ImageSha384 and kms:RecipientAttestation:PCR) make KMS allow operations with a key only if the enclave provides a signed attestation document whose measurements match the policy. In both cases the key service relies on the attestation and on the hardware behind it (see the Confidential Computing module). Compare the other trust hardware in Step 6 of Architect Quantum Impact (/learn/arch-quantum-impact?tab=workshop&step=5).

## Workshop

1. Key Hierarchy Designer — Interactive 3-level key tree builder
2. Envelope Encryption Demo — ML-KEM encaps → KDF → AES-KW wrap visualization
3. Hybrid Key Wrapping — X25519+ML-KEM-768 combiner with provider API mapping
4. KMS Rotation Planner — Enterprise rotation planning with provider-specific strategies
5. KMIP Protocol Explorer — KMIP v3.0 (draft) vs provider API comparison, PQC key type mapping, cross-provider sync visualizer, migration readiness checklist
6. AWS Policy Lab — Write and check an IAM policy that allows only ML-DSA signing keys to be created (kms:KeySpec, kms:KeyUsage), with an optional ML-KEM key-establishment statement
7. Cloud KMS Key Exchange — simulate classical and HPKE key-exchange flows for AWS KMS, Google Cloud KMS and Azure Key Vault in the browser (no cloud calls)

## Key Standards

- NIST SP 800-227 (KEM Recommendations)
- NIST SP 800-57 (Key Management)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- FIPS 205 (SLH-DSA)
- NIST IR 8547 (PQC Transition, final October 2026)
- NIST SP 800-57 Part 1 Rev. 6 (Initial Public Draft): ML-KEM-aware cryptoperiods
- RFC 9180 (HPKE) and RFC 10024 (TLS hybrid groups)
- CNSA 2.0 (NSA)
- KMIP v3.0 draft and KMIP 2.1 (OASIS Key Management Interoperability Protocol)
