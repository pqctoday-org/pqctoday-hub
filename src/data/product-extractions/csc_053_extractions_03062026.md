---
generated: 2026-03-06
collection: csc_053
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Delinea Secret Server

- **Category**: Secrets Management
- **Product Name**: Delinea Secret Server
- **Product Brief**: Enterprise-grade Privileged Access Management vault to identify, secure, manage, monitor, and audit privileged accounts.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions "encrypted vault" and "strong password management controls" but does not specify Post-Quantum Cryptography algorithms or support.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "Encrypted vault" and "multi-factor authentication" but does not list specific cryptographic primitives like ECDSA, RSA, etc.)
- **Key Management Model**: Not stated (Document mentions "encrypted vault", "centralized control", and "Resilient Secrets" for replication, but does not describe key hierarchy, root key protection, or escrow models).
- **Supported Blockchains**: Not stated
- **Architecture Type**: Centralized; Hybrid multi-cloud infrastructure support mentioned; Agent-based (Credential Manager mobile/browser) and API-based.
- **Infrastructure Layer**: Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Contact us for pricing" and copyright notice; specific license name not stated).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated (Document mentions "FedRAMP Solutions" in navigation but does not explicitly state FIPS 140-2/140-3 validation status for Secret Server).
- **Primary Platforms**: Hybrid multi-cloud infrastructure; Mobile (iOS/Android implied by "mobile app"); Browser (via extension); Windows/Linux/macOS not explicitly listed.
- **Target Industries**: Enterprise, Government (implied by FedRAMP and non-Government customer review), IT Admin, Workforce, Machine, AI, Developer.
- **Regulatory Status**: FedRAMP Solutions mentioned in navigation; no specific charter or registration details provided for the product itself.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit base URL string).

---

## HashiCorp Boundary

- **Category**: Secrets Management
- **Product Name**: HashiCorp Boundary
- **Product Brief**: An identity-aware proxy providing secure, just-in-time network access to hosts and critical systems.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any migration plans for PQC. It only mentions the use of KMS keys and encryption for secrets.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "KMS keys", "encryption", and "key derivation" but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: External KMS dependency; uses key derivation to avoid key sprawl; supports cloud KMS or Vault's Transit Secrets Engine.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Server-based (Controller and Workers); Agentless on end hosts; supports SaaS, on-prem, secure enclaves, and clouds.
- **Infrastructure Layer**: Security Stack, Network
- **License Type**: Open Source/Commercial (Repository license listed as NOASSERTION, but product is part of HashiCorp ecosystem).
- **License**: NOASSERTION
- **Latest Version**: 0.10 (mentioned in context of release branches)
- **Release Date**: Not stated (Last Updated: 2026-03-06T16:27:45Z refers to repository update, not product release).
- **FIPS Validated**: No
- **Primary Platforms**: Clouds, on-prem, secure enclaves; requires SQL database (PostgreSQL) and KMS.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://developer.hashicorp.com/boundary/docs

---
