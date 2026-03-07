---
generated: 2026-03-06
collection: csc_002
documents_processed: 7
enrichment_method: ollama-qwen3.5:27b
---

## Thales Luna HSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Thales Luna HSM
- **Product Brief**: Dedicated crypto processor designed to protect the cryptographic key lifecycle within a hardened, tamper-resistant device.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Luna HSMs are quantum-ready with NIST-standardized post-quantum cryptography in core firmware. They protect against "Harvest-Now, Decrypt Later" attacks and allow users to stay crypto agile by adopting emerging PQC algorithms and leveraging a broad ecosystem of PQC-ready partner integrations.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions "NIST-standardized post-quantum cryptography" and "traditional and emerging technologies" but does not list specific algorithm names like ECDSA, Ed25519, or specific PQC schemes).
- **Key Management Model**: Hardware-backed; keys are stored in hardware within an intrusion-resistant, tamper-evident appliance. Keys never leave the device, and all cryptographic operations occur within the HSM.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware Security Module (HSM); available as Hybrid, On-Premises, and Cloud HSM.
- **Infrastructure Layer**: Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (Text states "FIPS-validated appliance" and lists "FIPS 140-2" and "FIPS 140-3" under compliance, but does not explicitly link a specific validation level to the Luna HSM product in the provided text).
- **Primary Platforms**: Amazon Web Services, Google Cloud, Microsoft Azure, Oracle Cloud Infrastructure; On-Premises.
- **Target Industries**: Financial Services, Government, Healthcare, Manufacturing, Retail, Telecommunications, Automotive, Critical Infrastructure, Insurance Providers, Media and Entertainment, SaaS Providers.
- **Regulatory Status**: FIPS 140-2, FIPS 140-3, PCI DSS, PCI HSM, Swift CSC Validations and Certifications, GDPR, ISO/IEC 27001:2022, NIST 800-53, FedRamp, HIPAA, GLBA, SOC 2, SOX.
- **PQC Roadmap Details**: Product is described as "quantum-ready" with PQC in core firmware; strategy involves adopting emerging PQC algorithms and leveraging partner integrations for crypto agility. No specific timeline or algorithm migration schedule provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Text mentions "digital signing services" generally but does not list specific signature schemes).
- **Authoritative Source URL**: Not stated (Source filenames provided, but no explicit URL in text).

---

## Securosys Primus HSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Securosys Primus HSM
- **Product Brief**: Hardware Security Modules (HSMs) providing encryption, key management, and Post-Quantum Cryptography capabilities.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports hybrid operations combining classical (RSA/ECC/ED) and PQC algorithms. Supported PQC algorithms include ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, and XMSS. Offers dedicated test environments (CloudHSM Sandbox) for migration strategies and research collaboration with HSLU on TLS performance.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, ED, ML-KEM, ML-DSA, SLH-DSA, HSS-LMS, XMSS
- **Key Management Model**: Hardware-backed key storage within Securosys Primus HSMs; supports secure key generation and hybrid operations for classical and PQC keys.
- **Supported Blockchains**: Not stated (Product line "Primus HSM Blockchain" mentioned, but specific networks not listed)
- **Architecture Type**: HSM-based (On-premises appliance models: CyberVault X2, Core E2, X-Series, E-Series, S-Series; Cloud-based: Securosys CloudHSM)
- **Infrastructure Layer**: Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (End-User License Agreement mentioned)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Not stated (Text mentions "Security Certifications" and "Safety & Compliance Certifications" generally, but no specific FIPS level is explicitly cited)
- **Primary Platforms**: On-premises HSMs; CloudHSM (Cloud); Integrations with AWS, Azure, Microsoft 365, HashiCorp Vault, Fortinet, Keyfactor, etc.
- **Target Industries**: Enterprise, Finance (implied by "critical data", "digital assets"), General Cybersecurity
- **Regulatory Status**: Not stated (Mentions "eIDAS and SAM" in navigation menu, but no specific regulatory status details provided in text)
- **PQC Roadmap Details**: Supports transition via hybrid operations; offers CloudHSM Sandbox for testing migration strategies; collaborating with HSLU on PQC research for TLS.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA, HSS-LMS (PQC); RSA, ECC/ED (Classical)
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no explicit base URL string)

---

## Google Cloud HSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Google Cloud HSM
- **Product Brief**: A cloud-hosted Hardware Security Module (HSM) service allowing users to host encryption keys and perform cryptographic operations in a FIPS 140-2 Level 3 certified cluster.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), quantum-resistant algorithms, or any PQC migration plans. It references standard symmetric and asymmetric encryption but provides no details on PQC implementation.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "symmetric key", "asymmetric key", "MAC signatures", and "KEMs" generically, but does not list specific algorithm names like RSA, ECDSA, or AES).
- **Key Management Model**: HSM-backed; keys are hosted in a Google-managed cluster of HSMs; supports key generation within the HSM and key import via wrapping.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cloud-hosted HSM cluster (managed by Google); accessed via Cloud KMS front-end.
- **Infrastructure Layer**: Hardware, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Google Cloud" service model; specific license text not stated)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes, FIPS 140-2 Level 3 certified cluster.
- **Primary Platforms**: Google Cloud (specifically Google Cloud projects and locations supporting Cloud HSM).
- **Target Industries**: Not stated
- **Regulatory Status**: FIPS 140-2 Level 3 certification mentioned for the HSM cluster.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Digital signatures, MAC signatures (specific algorithms not listed).
- **Authoritative Source URL**: Not stated (Source text provided as HTML content without a specific URL string).

---

## Crypto4A QxHSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: QxHSM™
- **Product Brief**: Quantum-first, FIPS-validated Hardware Security Module (HSM) built for securing digital assets against current and future threats.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Full support for NIST standard approved PQC algorithms including ML-KEM (FIPS-203), ML-DSA (FIPS-204), SLH-DSA (FIPS-205), LMS, HSS, XMSS/XMSSMT, and Classic McEliece. Future algorithms supported through quantum-safe firmware updates.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECDSA, ECDH, EdSA-25519/448, X25519, X448, ML-KEM, ML-DSA, SLH-DSA, LMS, HSS, XMSS/XMSSMT, Classic McEliece, AES (ECB, CBC, GCM), SHA-1, SHA-2, SHA-3 (including SHAKE XOF)
- **Key Management Model**: Hardware Security Module (HSM) with modular blade design; secure key generation and injection for device identities; supports on-premises, hybrid, or cloud deployment.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based hardware platform with modular 1U, 4U blade server or desktop enclosure configurations.
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary (implied by "Contact Sales" and "Transparent, all-inclusive pricing model")
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: FIPS 140-2 level 3+ validated; pending FIPS 140-3 level 3 (MIP)
- **Primary Platforms**: On-premises, hybrid, or cloud environments; Chassis configurations include QxBMC-1 Desktop, QxBMC-3 1RU, QxBMC-12 4RU.
- **Target Industries**: Enterprises and governments; Secure manufacturing; PKI; Code Signing; Multi-Cloud Key Management; DNSSEC.
- **Regulatory Status**: FIPS 140-2 level 3+ validated; pending FIPS 140-3 level 3 (MIP); AIS 20/31 DRG compliance for RNG.
- **PQC Roadmap Details**: Supports NIST standards ML-KEM, ML-DSA, SLH-DSA, LMS, HSS, XMSS/XMSSMT, and Classic McEliece; future algorithms supported via quantum-safe firmware updates.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, EdSA-25519/448, ML-DSA (FIPS-204), SLH-DSA (FIPS-205), LMS, HSS, XMSS/XMSSMT
- **Authoritative Source URL**: crypto4a.com

---

## Thales Luna T-Series HSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Thales Luna T-Series HSM
- **Product Brief**: Hardware Security Module (Network, PCIe, Tablet) providing quantum-resistant cryptographic foundations.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Version 7.15.0 provides fully standardized implementations of ML-KEM (FIPS 203) and ML-DSA (FIPS 204). Also supports Leighton-Micali Signature (LMS) and Hierarchical Signature Scheme (HSS) for CNSA 2.0 compliance. Enables quantum-resistant firmware/software signing.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, LMS, HSS
- **Key Management Model**: Hardware-backed key storage within Luna T-Series HSMs; supports hardware redundancy for LMS trees across multiple HSMs.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (Network appliance, PCIe card, Tablet)
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: 7.15.0
- **Release Date**: 2025-09-15
- **FIPS Validated**: Not stated (Text mentions algorithms are FIPS 203/204 compliant, but does not explicitly state the HSM's FIPS 140 validation level)
- **Primary Platforms**: Luna Client supports Windows 11; Luna T-Series Network, PCIe, and Tablet HSMs.
- **Target Industries**: Federal Government, Healthcare, National Security (implied by CNSA 2.0 and U.S. Federal policy references)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Release 7.15.0 enables transition to quantum-resistant firmware/software signing per CNSA 2.0; supports LMS trees across multiple HSMs for redundancy under NIST SP800-208.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, LMS, HSS
- **Authoritative Source URL**: Not stated (Document text contains navigation links but no specific product URL)

---

## SoftHSM2

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: SoftHSM version 2
- **Product Brief**: A software implementation of a generic cryptographic device with a PKCS#11 interface, originally part of OpenDNSSEC.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, support, or migration plans. It only lists classical algorithms such as ECC, GOST, and EDDSA.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECC, GOST, EDDSA (EdDSA), RSA (implied by PKCS#11 context but not explicitly listed in config options, though Botan/OpenSSL support it; strictly from text: ECC, GOST, EDDSA)
- **Key Management Model**: Software-based key storage using a file system or SQLite database object store; keys are stored in token directories defined in the configuration file.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software implementation of a cryptographic device (SoftHSM) providing a PKCS#11 interface; not a hardware appliance.
- **Infrastructure Layer**: Security Stack, Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: SoftHSM version 2
- **Release Date**: Not stated (Last Updated: 2026-03-03)
- **FIPS Validated**: No
- **Primary Platforms**: Linux, Windows (implied by "Windows event log" and build tools like Autoconf/Automake), macOS (implied by generic Unix build tools)
- **Target Industries**: DNSSEC (OpenDNSSEC), General Cryptographic Applications
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECC, GOST, EDDSA
- **Authoritative Source URL**: https://github.com/opendnssec/SoftHSMv2

---

## Yubico YubiHSM 2

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: YubiHSM 2
- **Product Brief**: A game-changing hardware solution for protecting cryptographic keys throughout their lifecycle with secure generation, storage, and operations.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC) algorithms, support, or migration plans. It lists classical algorithms only: RSA, ECC, ECDSA (ed25519), SHA-2, and AES.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, ECC, ECDSA (ed25519), SHA-2, AES (ECB/CBC mode for non-FIPS only)
- **Key Management Model**: Hardware-backed key storage with secure on-chip generation, attestation, distribution, backup, and destruction; supports M of N wrap keys.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (Hardware Security Module)
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial / Open Source (SDK available as open source)
- **License**: Not stated (SDK described as "open source", product is commercial)
- **Latest Version**: v2.4
- **Release Date**: Unknown
- **FIPS Validated**: Yes (YubiHSM 2 FIPS variant mentioned; AES ECB/CBC mode noted as non-FIPS only)
- **Primary Platforms**: USB-A connector for standard 1.0, 2.0 and 3.0 ports; integrates with Microsoft Active Directory Certificate Services; supports PKCS#11, YubiHSM KSP, and native libraries.
- **Target Industries**: Enterprise, Cryptocurrency exchanges, IoT gateways, Certificate Authorities (CA)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA (ed25519), RSA
- **Authoritative Source URL**: Not stated

---
