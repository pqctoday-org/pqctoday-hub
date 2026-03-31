---
generated: 2026-03-30
collection: csc_002
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Xiphera PQC IP Cores

- **Category**: HSM & Hardware Security
- **Product Name**: Chainguard FIPS Provider for OpenSSL (AESNI_ASM)
- **Product Brief**: Provides cryptographic services to Linux user space software components using Intel AES-NI.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography algorithms, implementations, or migration plans. It only covers classical symmetric encryption (AES-GCM).
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES-GCM, AES-GMAC
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software cryptographic provider for Linux user space
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: 3.4.0-r4
- **Release Date**: Not stated (First Validated: 2025-03-10)
- **FIPS Validated**: Yes, FIPS validated (Module ID A6694, First Validated: 3/10/2025)
- **Primary Platforms**: Amazon Linux 2023 on EC2 m7i.metal-24xl (Intel Sapphire Rapids Xeon Platinum 8488C)
- **Target Industries**: Not stated
- **Regulatory Status**: FIPS Validated (A6694)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://csrc.nist.gov

---

## Utimaco SecurityServer

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Quantum Protect (Application Package for u.trust GP HSM Se-Series)
- **Product Brief**: Post-Quantum Cryptography application package for Utimaco's u.trust General Purpose HSM supporting NIST-standardized algorithms.
- **PQC Support**: Yes (with details: Supports ML-KEM, ML-DSA, LMS, XMSS, HSS, XMSS-MT)
- **PQC Capability Description**: Quantum Protect is an application package for the u.trust GP HSM Se-Series supporting NIST-standardized PQC algorithms ML-KEM and ML-DSA, plus mature stateful hash-based signatures LMS, XMSS, HSS, and XMSS-MT. It includes a patented state management solution, implements CNSA 2.0 mandatory algorithms (LMS, XMSS, ML-KEM, ML-DSA, AES, SHA), and integrates via PKCS #11. Activation is in-field without hardware exchange. A free simulator is available.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, LMS, XMSS, HSS, XMSS-MT, AES, SHA, RSA, ECC (mentioned as legacy to be deprecated), Elliptic Curve DH, MQC, Finite Field DH, MQV
- **Key Management Model**: HSM-backed key storage and generation within u.trust GP HSM Se-Series; includes patented state management for stateful signatures.
- **Supported Blockchains**: Not stated (Blockchain Protect is listed as a separate application package)
- **Architecture Type**: HSM-based (Application Package on u.trust GP HSM Se-Series)
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Commercial product with free simulator)
- **Latest Version**: Not stated
- **Release Date**: 2025-04-02
- **FIPS Validated**: FIPS 140-2 mentioned in general compliance list; specific validation level for Quantum Protect not stated.
- **Primary Platforms**: u.trust GP HSM Se-Series (Hardware Security Module)
- **Target Industries**: Enterprise, Finance (Payment HSM context), Government (CNSA 2.0 context)
- **Regulatory Status**: CNSA 2.0 compliance mentioned; NIST standardization referenced.
- **PQC Roadmap Details**: Further PQC algorithms such as SLH-DSA are on the roadmap for future releases.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: LMS, XMSS, HSS, XMSS-MT (current); ML-DSA (current); SLH-DSA (planned)
- **Authoritative Source URL**: Not stated (Source text is from Utimaco_SecurityServer.html but no specific URL provided in text)

---