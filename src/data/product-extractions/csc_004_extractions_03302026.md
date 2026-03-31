---
generated: 2026-03-30
collection: csc_004
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Venafi Trust Protection Platform

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Venafi Trust Protection Platform (now part of CyberArk Machine Identity Security)
- **Product Brief**: Machine identity security platform providing certificate lifecycle management, enterprise PKI, workload identity, code signing, and SSH security.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated in the document. No mention of Post-Quantum Cryptography algorithms, migration plans, or readiness status.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions TLS/SSL certificates and SSH security but does not list specific cryptographic algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated (Document mentions "Secrets Manager" and "Certificate Manager" but does not describe key hierarchy, HSM usage, MPC, or escrow details).
- **Supported Blockchains**: Not stated
- **Architecture Type**: SaaS and Self-Hosted (mentioned for Secrets Manager); Cloud-native and on-premises support mentioned generally.
- **Infrastructure Layer**: Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Implied by "CyberArk Software Ltd." and commercial trial/purchase options; specific license text not stated).
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud-native, on-premises, third-party applications, Kubernetes (mentioned for Certificate Manager for Kubernetes).
- **Target Industries**: Automotive, Banking, Critical Infrastructure, Financial Services, Government, Healthcare, Insurance, Manufacturing, Managed Service Providers.
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no specific product URL).

---

## Entrust PKI

- **Category**: Public Key Infrastructure (PKI) Software
- **Product Name**: Entrust PKI (including Entrust nShield HSM, Entrust Cryptographic Security Platform)
- **Product Brief**: Post-quantum ready PKI and security platform offering hybrid certificate issuance, crypto discovery, and HSM-backed key management.
- **PQC Support**: Yes (with details: Supports NIST-approved algorithms ML-DSA, ML-KEM, SLH-DSA; offers pure PQC and composite/hybrid certificates)
- **PQC Capability Description**: Entrust nShield HSMs are NIST-validated for ML-DSA, ML-KEM, and SLH-DSA with native firmware support. Entrust PKI supports issuing hybrid and pure PQC certificates (roots, intermediates, end-entity). The Cryptographic Security Platform unifies key/certificate/secrets management with crypto-agility for PQ transition.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, ML-DSA, ML-KEM, SLH-DSA
- **Key Management Model**: HSM-backed (Entrust nShield), centralized visibility via Cryptographic Security Platform, supports key generation/storage/operations in tamper-resistant hardware.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (SaaS "PKI as a Service" and On-prem/Hardware "nShield HSM"), centralized management platform
- **Infrastructure Layer**: Security Stack, Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (Entrust nShield HSMs are NIST-validated; Entrust nShield PQ SDK runs within FIPS 140-2 Level 3 physical boundary)
- **Primary Platforms**: Cloud-based offering ("PKI as a Service"), Hardware Security Modules (nShield), Enterprise environments
- **Target Industries**: Enterprise, Government, Finance (implied by "secure payments" and "governments")
- **Regulatory Status**: NIST standards compliance (CNSA 2.0 alignment mentioned); FIPS 140-2 Level 3 validation for HSM boundary
- **PQC Roadmap Details**: Supports NIST draft and approved standards; enables transition to hybrid and pure PQC architectures; aligns with NSA CNSA 2.0 deadlines (2025, 2030, 2033) and NIST deprecation timelines (2030, 2035).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (PQC); RSA, ECC (Classical)
- **Authoritative Source URL**: www.entrust.com

---