---
generated: 2026-03-30
collection: csc_003
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## Entrust KeyControl

- **Category**: Key Management Systems (KMS)
- **Product Name**: Entrust KeyControl
- **Product Brief**: Enterprise key management and compliance platform combining lifecycle management with decentralized vault architecture.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The platform supports NIST-approved post-quantum algorithms including ML-DSA, ML-KEM, and SLH-DSA via integration with Entrust nShield HSMs. It enables the issuance of hybrid and pure PQC certificates through Entrust's PQ-ready PKI. The solution offers crypto-agility to transition from classical algorithms (RSA, ECC) to quantum-safe cryptography.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, Elliptic Curve Cryptography (ECC), ML-DSA, ML-KEM, SLH-DSA
- **Key Management Model**: Decentralized vault-based architecture with centralized policy/compliance visibility; supports HSM-backed root of trust (nShield) and optional third-party HSMs.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hybrid (On-premises, SaaS/Cloud, or Hybrid); Decentralized vaults with centralized Compliance Manager dashboard; HSM-integrated.
- **Infrastructure Layer**: Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (Compatible with FIPS 140-3 certified nShield HSMs; nShield HSMs are NIST-validated for post-quantum algorithms)
- **Primary Platforms**: On-premises, Cloud (US and European regions), AWS, Google Cloud Platform (GCP)
- **Target Industries**: Enterprise, Government (implied by NSA/NIST mandates), Critical Infrastructure, Payment Systems
- **Regulatory Status**: Supports compliance with NIST SP 800-57, PCI DSS, NSA CNSA 2.0, and data sovereignty mandates.
- **PQC Roadmap Details**: Aligns with NSA CNSA 2.0 deadlines (prefer quantum-safe by 2025, exclusive use by 2033) and NIST deprecation of classical algorithms (2030/2035). Supports hybrid and pure PQC certificate issuance.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA (PQC); RSA, ECC (Classical)
- **Authoritative Source URL**: www.entrust.com

---

## A10 Networks Thunder ADC

- **Category**: Network Security Appliances
- **Product Name**: A10 Networks Thunder ADC
- **Product Brief**: High-performance advanced load balancing solution enabling highly available, accelerated, and secure application delivery.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document mentions support for "modern ECC ciphers" but does not explicitly mention Post-Quantum Cryptography (PQC) algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: TLS/SSL, modern ECC ciphers
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Application Delivery Controller (ADC), inline encryptor (implied by SSL offload), virtual appliance, cloud-native, hardware appliance
- **Infrastructure Layer**: Network, Application, Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated
- **Primary Platforms**: Hardware, virtual, cloud, bare metal, container form factors; Kubernetes environments
- **Target Industries**: Financial Services, Healthcare, Higher Education, Telecommunications & Service Providers, Gaming, Government, Manufacturing, Retail
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: A10_Networks_Thunder_ADC.html (Source filename provided in text)

---

## Citrix ADC (NetScaler)

- **Category**: Network Security Appliances
- **Product Name**: Citrix ADC (NetScaler)
- **Product Brief**: Network security appliance providing production-ready hybrid post-quantum cryptography and application-layer security.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Production-ready, NIST-aligned hybrid post-quantum cryptography using X25519 + ML-KEM768. Provides forward-looking protection and backward compatibility. Available now for external-facing services.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, ML-KEM768
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Network Security Appliance (VPN concentrator/gateway context implied by category)
- **Infrastructure Layer**: Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2025-07-01 (Inferred from document code CON1792-202507 and copyright 2025)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Hybrid and multi-cloud environments
- **Target Industries**: Governments, Healthcare, Finance, Enterprises
- **Regulatory Status**: Listed on Department of Defense Information Network Approved Products List (DODIN APL)
- **PQC Roadmap Details**: Begin internal validation in Q2 2025; Inventory systems in Q3 2025; Start phased rollout in Q4 2025.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Document mentions hybrid PQC algorithms X25519 + ML-KEM768, but does not explicitly list signature schemes)
- **Authoritative Source URL**: Not stated

---

## Microsoft Defender for Endpoint

- **Category**: Network Security Appliances
- **Product Name**: Microsoft Defender for Endpoint
- **Product Brief**: Not stated (Document focuses on Microsoft's general PQC strategy and SymCrypt library, not specific Defender for Endpoint features).
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: PQC capabilities are previewed for Windows Insiders and Linux via SymCrypt updates. ML-KEM and ML-DSA are available through CNG. TLS hybrid key exchange is enabled in SymCrypt-OpenSSL 1.9.0. Full transition of services aims for completion by 2033, with early adoption starting by 2029.
- **PQC Migration Priority**: High
- **Crypto Primitives**: AES, RSA, ECDSA, ML-KEM, ML-DSA, FrodoKEM (research/standardization context)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack, Cloud
- **License Type**: Commercial
- **License**: Proprietary (SymCrypt is open-source, but Defender for Endpoint is commercial)
- **Latest Version**: 1.9.0 (SymCrypt-OpenSSL)
- **Release Date**: 2025-08-20 (Blog post date; specific product release dates not stated)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows, Linux, Microsoft Azure, Microsoft 365
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail
- **Regulatory Status**: Aligned with NIST, CISA, OMB, CNSA 2.0, CNSSP-15, ISO, IETF, ETSI standards.
- **PQC Roadmap Details**: Early adoption by 2029; gradual defaulting in subsequent years; full transition of services and products by 2033. Strategy includes hybrid approach (classical + PQC) as an interim step before full PQC shift.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA, ML-DSA (planned/preview), RSA (current)
- **Authoritative Source URL**: https://www.microsoft.com/security/blog/2025/08/20/quantum-safe-security-progress-towards-next-generation-cryptography/

---