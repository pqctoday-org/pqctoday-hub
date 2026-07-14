---
generated: 2026-07-13
collection: csc_003
documents_processed: 2
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit
---

## Arqit QuantumCloud

- **Category**: Key Management Systems (KMS)
- **Product Name**: Arqit QuantumCloud
- **Product Brief**: Quantum-safe encryption software service enhanced by confidential computing for secure key management and data protection.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Delivers quantum-safe protection enhanced by confidential computing. Uses quantum-resistant crypto key delivery and quantum-safe symmetric encryption between enclaves. Compatible with NSA CSfC Components and meets NSA CSfC Symmetric Key Management Requirements Annexe 1.2. and RFC 8784.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Symmetric encryption (quantum-safe), Symmetric Key Agreement
- **Key Management Model**: Symmetric Key Agreement Platform using a lightweight software agent; keys generated locally inside Intel TDX Trusted Domains (enclaves); ephemeral key model; virtual HSM architecture.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software-based symmetric key platform running inside Intel TDX confidential VMs (Trusted Domains); virtual HSM.
- **Infrastructure Layer**: Cloud, Network, Security Stack
- **License Type**: Commercial
- **License**: Commercial (implied by "encryption software service" and Nasdaq listing; specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: 2025-04-28
- **FIPS Validated**: Not stated
- **Primary Platforms**: Intel Trust Domain Extensions (Intel TDX), Cloud, White-box hardware (for Telcos), On-prem environments
- **Target Industries**: Telcos, Enterprise, Defence, Finance, Public services, National infrastructure
- **Regulatory Status**: ISO 27001 Standard certified; Compatible with NSA CSfC Components; Meets NSA CSfC Symmetric Key Management Requirements Annexe 1.2. and RFC 8784
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://arqit.uk/resources/data-sovereignty-with-confidential-computing-and-networking
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Lightweight software agent that runs on the smallest of end point devices.
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Standards compliant manner which does not oblige customers to make a disruptive rip and replace of their technology.
- **Financial & Business Impact**: Reducing the cost and complexity of additional hardware; cutting costs compared to physical HSMs.
- **Organizational Readiness**: Unknown

---

## Cosmian KMS

- **Category**: Key Management Systems (KMS)
- **Product Name**: Cosmian KMS (also referred to as Eviden VM KMS)
- **Product Brief**: A Key Management System supporting KMIP, REST Crypto API, multi-HSM, and PQC X.509 certificates.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-DSA-44/65/87 and all SLH-DSA variants for X.509 subject/issuer keys. Supports ML-KEM-512/768/1024 for CA-issued X.509 certs. Implements ReKeyKeyPair for ML-KEM, ML-DSA, and SLH-DSA. Includes PQC chain validation tests and self-signed CLI tests.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, EC, Ed25519, X25519, AES-GCM, RSA-OAEP, RS256/384/512, PS256/384/512, ES256/384/512, HS256/384/512, ML-DSA-44/65/87, SLH-DSA, ML-KEM-512/768/1024, Ed448, secp256k1, ChaCha20, AES-XTS
- **Key Management Model**: HSM-backed (multi-HSM support with prefix-based routing), KMIP 1.4/2.1 compliant, supports KEK wrapping, key lifecycle management (Create, Activate, ReKey, Destroy), and attribute-based access control.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (supports multiple HSM instances), SaaS/On-prem (implied by "Cosmian VM" / "Eviden VM" and local deployment references), Agentless (REST API and KMIP client library optional)
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Unknown (GPL dependency removed, replaced with MIT/Apache-2.0 middleware; specific project license not explicitly stated in text)
- **Latest Version**: 5.23.0
- **Release Date**: 2026-05-25
- **FIPS Validated**: No (PQC features explicitly marked as "non-FIPS"; mentions NIST FIPS 180-4/202 KAT vectors but no validation status)
- **Primary Platforms**: Linux (implied by Rust/Cargo context), Oracle 23ai Free (via PKCS#11 provider), Web UI
- **Target Industries**: Enterprise (implied by KMS/HSM focus)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RS256/384/512, PS256/384/512, ES256/384/512, ML-DSA-44/65/87, SLH-DSA, Ed25519, Ed448
- **Authoritative Source URL**: cosmian-kms-bdfb8728.html (Source reference)
- **Implementation Attack Surface**: Fixed KEK wrapping bypass (COSMIAN-2026-016), KEK plaintext leak via UsageLimits (COSMIAN-2026-015), attribute-mutation authorization bypass, HSM key permissions hardening, ReKey/Activate privilege escalation fixes.
- **Cryptographic Discovery & Inventory**: Not stated
- **Testing & Validation Methods**: 24 Known-Answer Test (KAT) vectors (NIST FIPS 180-4/202, SP 800-38A/D, RFCs), 39 dynamic vectors, 31 Certify integration tests, 26 PQC chain validation tests, 15 PQC self-signed CLI tests, KMIP regression vectors, JOSE integration tests, Playwright E2E suite.
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: SBOM license generation automated; GPL dependencies removed; dependency chain managed via cargo deny.
- **Deployment & Migration Complexity**: Supports ReKeyKeyPair for migration; VAST Data integration docs describe workflow; breaking changes noted in release notes (e.g., enum changes, permission hardening).
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---
