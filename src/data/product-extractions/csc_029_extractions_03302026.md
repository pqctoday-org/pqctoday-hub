---
generated: 2026-03-30
collection: csc_029
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Cryptomathic CKMS

- **Category**: Payment Cryptography Systems
- **Product Name**: Cryptomathic CKMS (Crypto Key Management System) and CSG (Crypto Service Gateway)
- **Product Brief**: Centralized enterprise key management platform enabling cryptographic agility, HSM orchestration, and policy enforcement.
- **PQC Support**: Planned (with scope)
- **PQC Capability Description**: The product enables "cryptographic agility to prepare for post quantum cryptography" and allows for the "centralized enforcement of PQC algorithms." No specific PQC algorithms or maturity levels are stated.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, AES, 3DES, HMAC
- **Key Management Model**: Centralized platform managing HSMs; supports key import, generation, export, and renewal; integrates with Java Key Store (JCE), PKCS #11, Microsoft CAPI, and cloud BYOK formats.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: HSM-based centralized management with vendor-agnostic interfaces supporting multi-cloud and on-premises setups.
- **Infrastructure Layer**: Application, Security Stack, Cloud, Hardware
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cloud, on-premises, hybrid infrastructure; integrates with Java Key Store, PKCS #11, Microsoft CAPI, and various HSMs (Atalla, Thales).
- **Target Industries**: Trust Service Providers, FinTech, Banking, Government
- **Regulatory Status**: Supports compliance with PCI DSS, GDPR, CCPA, Privacy Act; no specific regulatory licenses or charters stated for the vendor.
- **PQC Roadmap Details**: Planned to enable cryptographic agility and centralized enforcement of PQC algorithms; no specific timeline or algorithm choices stated.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA (implied via "Support all widely used cryptographic algorithms, including RSA"); code signing workflows supported via CSG endorsed signing feature.
- **Authoritative Source URL**: Unknown

---

## Futurex Vectera Plus

- **Category**: Payment Cryptography Systems
- **Product Name**: Futurex Vectera Plus (Note: Document primarily discusses "CryptoHub HSM" and "VirtuCrypt"; "Vectera Plus" appears only in the user prompt header, not the text body)
- **Product Brief**: Converged payment and general-purpose network-attached HSM appliance with virtualization and cloud integration.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Offers full PQC support for cryptographic applications and as a root of trust in hardware. Supports ML-KEM, ML-DSA, and SLH-DSA algorithms. Implements TLS 1.3 with ed25519 and Kyber for HSM connectivity and software/firmware updates.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, SLH-DSA, ed25519, Kyber, PKCS #11
- **Key Management Model**: HSM-backed with managed key services; supports granular role-based access control and virtual HSMs within a security boundary.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: HSM-based (converged payment and general-purpose network-attached appliance)
- **Infrastructure Layer**: Hardware, Cloud, Security Stack
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown (Document mentions "CryptoHub HSM" formerly "Excrypt SSP Enterprise v.2", but no specific version number for current product)
- **Release Date**: Not stated
- **FIPS Validated**: Yes, FIPS 140-2 Level 3 certified
- **Primary Platforms**: AWS, Azure, Google Cloud; On-premises (network-attached appliance and PCIe card GSP3000)
- **Target Industries**: Payment services, Banks, Credit card processors, Financial institutions
- **Regulatory Status**: PCI PTS HSM (v3), FIPS 140-2 Level 3
- **PQC Roadmap Details**: Full PQC support currently offered for cryptographic applications and root of trust; specific future timeline not stated.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA, SLH-DSA (implied by "full PQC support" list); ed25519 mentioned in context of TLS 1.3 connectivity.
- **Authoritative Source URL**: www.abiresearch.com

---
