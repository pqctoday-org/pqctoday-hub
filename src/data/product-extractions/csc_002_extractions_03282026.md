---
generated: 2026-03-28
collection: csc_002
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## Crypto4A QxEDGE

- **Category**: HSM & Hardware Security
- **Product Name**: Crypto4A QxEDGE (specifically the Quantum-Assured Security Module or QASM™)
- **Product Brief**: A hardware security module designed with post-quantum cryptographic principles embedded into its roots of trust and internal architecture.
- **PQC Support**: Yes (with details: Hybrid approach using traditional ECC and NIST-approved HSS for RoT, FW updates, attestation, and inter-HSM communications)
- **PQC Capability Description**: Implements a hybridized approach combining traditional ECDSA P-384 and NIST-approved HSS (Hierarchical Signature System). Uses PQC for firmware signing, secure boot validation, attestation keys, backup encryption, inter-HSM communication, access authentication, and logging integrity. Leverages proprietary Classic McEliece for inter-HSM transfers where standardized options were unavailable. Designed for crypto-agility to adopt future certified PQC algorithms via FW updates.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ECDSA P-384, HSS (Hierarchical Signature System), AES-256-GCM, Classic McEliece
- **Key Management Model**: HSM-backed with immutable Roots of Trust (RoT) provisioned during manufacturing; private keys for RoT stored offline in manufacturing HSMs; hybrid traditional and PQC keying material.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based hardware security module with field-reprogrammable hardware engines and quantum-ready firmware updates.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (implied by "proprietary solutions" and commercial context, specific license name not stated)
- **Latest Version**: Not stated
- **Release Date**: 2026-01 (Publication date of the whitepaper; product release date not explicitly stated)
- **FIPS Validated**: FIPS 140-3 Level 3 compliant for traditional cryptography; PQC capabilities are not currently required for this validation level but are implemented via hybrid design.
- **Primary Platforms**: Not stated (Hardware appliance form factor implied)
- **Target Industries**: Digital sovereignty, critical infrastructure, government, enterprise (implied by "national importance" and "digital trust")
- **Regulatory Status**: Designed to comply with FIPS certification requirements; references NIST guidance and IETF draft standards.
- **PQC Roadmap Details**: Advocates adoption of certified/standardized quantum-safe approaches as they become available; utilizes crypto-agility and FW update capabilities to evolve from proprietary solutions (e.g., Classic McEliece) to standardized algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA P-384, HSS (Hierarchical Signature System), Classic McEliece (for key agreement/transfers)
- **Authoritative Source URL**: Not stated

---

## Entrust nShield

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Entrust nShield HSM with Post-Quantum Cryptography Option Pack (PQCOP)
- **Product Brief**: Hardware Security Module integration guide for generating and using NIST-selected post-quantum cryptographic keys.
- **PQC Support**: Yes (with details: Supports LMS, ML-DSA, ML-KEM, SLH-DSA via firmware or PQC Option Pack)
- **PQC Capability Description**: The nShield PQC Option Pack enables generation and use of NIST-selected post-quantum algorithms. LMS is the default type for releases after 1.4.1. ML-DSA is supported in firmware and recommended for the main product line. The brochure states nShield HSMs are NIST-validated for ML-DSA, ML-KEM, and SLH-DSA, delivering production-ready quantum-safe cryptography in tamper-resistant hardware with native PQ support in firmware.
- **PQC Migration Priority**: High
- **Crypto Primitives**: LMS, ML-DSA, ML-KEM, SLH-DSA, ECDSA (NIST P-521), RSA, Elliptic Curve algorithms
- **Key Management Model**: HSM-backed; keys generated and stored within the nShield HSM using CodeSafe machines; protected by Operator Card Sets (OCS) and Administrator Card Sets (ACS); supports key recovery.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware Security Module (HSM); forms include nShield Connect XC and nShield 5c; utilizes CodeSafe machines running on the HSM.
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Requires license file from Entrust Support for CodeSafe features)
- **Latest Version**: PQCOP 1.4.1, Security World Software 13.9.3, nShield Firmware 13.8.4
- **Release Date**: 2026-03-16 (Document date)
- **FIPS Validated**: Yes (FIPS Level 3 mentioned in product configurations table; brochure states "NIST-validated")
- **Primary Platforms**: Linux (Ubuntu 22.04), Windows Server 2022
- **Target Industries**: Enterprise, Government (implied by NSA/NIST mandates and CNSA 2.0 references)
- **Regulatory Status**: NIST-validated for post-quantum algorithms; FIPS Level 3; aligned with NSA CNSA 2.0 requirements
- **PQC Roadmap Details**: LMS is default for PQCOP releases after 1.4.1; ML-DSA supported in firmware; timeline mentions 2025 (NSA preference), 2030 (NIST deprecation of classical), 2033 (NSA exclusive use), 2035 (NIST disallowing classical).
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: LMS, ML-DSA, SLH-DSA, ECDSA
- **Authoritative Source URL**: https://nshieldsupport.entrust.com

---

## Futurex CryptoHub

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Futurex CryptoHub
- **Product Brief**: FIPS 140-2 Level 3 validated HSM offering payment, general-purpose, and cloud services with PQC support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: First HSM to receive PCI HSM validation with PQC support. Supports ML-DSA (FIPS 204) and ML-KEM (FIPS 203). Beta firmware (June 2025) includes ML-KEM-768 and ML-DSA-65 for financial and enterprise security.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-DSA, ML-KEM
- **Key Management Model**: Hardware-backed key storage with Advanced Key Lifecycle Management, Cloud Key Management, Payment Key Management, Key Distribution, and IoT Key Injection.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (Payment HSM, General Purpose HSM, Cloud HSM)
- **Infrastructure Layer**: Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Beta firmware (June 2025)
- **Release Date**: 2025-06-01
- **FIPS Validated**: FIPS 140-2 Level 3 validated
- **Primary Platforms**: Not stated
- **Target Industries**: Finance, Enterprise, Payment
- **Regulatory Status**: PCI HSM validated (first with PQC support), PCI PTS certified
- **PQC Roadmap Details**: Beta firmware released June 2025 including ML-KEM-768 and ML-DSA-65; supports FIPS 203 and FIPS 204.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (FIPS 204)
- **Authoritative Source URL**: futurex.com

---

## Marvell LiquidSecurity 2

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Marvell LiquidSecurity 2 HSM Adapter
- **Product Brief**: Certified FIPS 140-3 Level 3 PCIe HSM adapter offering unified solutions for general purpose, payments, and compliance.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Beta firmware supports hardware-accelerated PQC including ML-KEM-768 (FIPS 203), ML-DSA-65 (FIPS 204), and LMS (SP 800-208). Firmware updates expected as NIST standards mature.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM-768, ML-DSA-65, LMS
- **Key Management Model**: Hardware key storage with multi-tenant partitioning for cloud service providers; secure key generation via hardware acceleration.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (PCIe adapter)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Beta firmware
- **Release Date**: 2026-03-01
- **FIPS Validated**: Yes, FIPS 140-3 Level 3 (Certificate #4703)
- **Primary Platforms**: Cloud infrastructure, Azure Dedicated HSM, enterprise deployment
- **Target Industries**: Financial transaction processing, hyperscale environments, cloud infrastructure
- **Regulatory Status**: PCI PTS HSM certified
- **PQC Roadmap Details**: Firmware updates expected as NIST standards mature; currently supports ML-KEM-768, ML-DSA-65, and LMS in beta.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA-65 (FIPS 204), LMS (SP 800-208)
- **Authoritative Source URL**: marvell.com

---
