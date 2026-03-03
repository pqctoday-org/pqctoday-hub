---
module_id: kms-pqc
title: KMS & PQC Key Management
track: Infrastructure
difficulty: intermediate
duration: 90 min
workshop_steps: 5
---

# KMS & PQC Key Management

## Topics Covered

- PQC key management fundamentals (algorithm separation, key size explosion)
- NIST SP 800-227 KEM guidance for key wrapping
- Envelope encryption with ML-KEM vs RSA-OAEP
- Hybrid key wrapping (X25519+ML-KEM-768, P-256+ML-KEM-768, X-Wing)
- KMS provider PQC landscape (AWS KMS, Google Cloud KMS, Azure Key Vault, HashiCorp Vault, Thales CipherTrust, Fortanix DSM)
- PQC key rotation strategies and compliance deadlines (CNSA 2.0, NIST IR 8547)
- Enterprise architecture patterns for multi-cloud PQC key management
- KMIP v2.1 protocol operations and PQC key type enumerations
- Cross-provider key sync via KMIP orchestration

## Workshop

1. Key Hierarchy Designer — Interactive 3-level key tree builder
2. Envelope Encryption Demo — ML-KEM encaps → KDF → AES-KW wrap visualization
3. Hybrid Key Wrapping — X25519+ML-KEM-768 combiner with provider API mapping
4. KMS Rotation Planner — Enterprise rotation planning with provider-specific strategies
5. KMIP Protocol Explorer — KMIP vs provider API comparison, PQC key type mapping, cross-provider sync visualizer, migration readiness checklist

## Key Standards

- NIST SP 800-227 (KEM Recommendations)
- NIST SP 800-57 (Key Management)
- FIPS 203 (ML-KEM)
- FIPS 204 (ML-DSA)
- FIPS 205 (SLH-DSA)
- NIST IR 8547 (PQC Transition)
- CNSA 2.0 (NSA)
- KMIP v2.1 (OASIS Key Management Interoperability Protocol)
