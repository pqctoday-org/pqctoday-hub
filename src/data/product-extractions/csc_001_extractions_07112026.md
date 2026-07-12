---
generated: 2026-07-11
collection: csc_001
documents_processed: 5
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit
---

## 01 Quantum IronCAP

- **Category**: Cryptographic Libraries
- **Product Name**: IronCAP ™ Toolkits
- **Product Brief**: NIST-approved PQC toolkits allowing vendors to transform products for safety against classical and quantum cyber attacks.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Uses NIST-approved post-quantum cryptography (PQC) algorithms combined with patent-protected quantum-safe technology. Designed for vertical solutions including digital identity, email security, remote access, cloud storage, IoT, blockchain, and financial transactions.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Unknown
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Libraries
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Unknown
- **Target Industries**: Blockchain, IoT, Data Storage, Remote Access, Email Security, Cloud Storage, Financial Transactions, Digital Identity
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: Unknown
- **Authoritative Source URL**: 01-quantum-ironcap-a3fc880e.html
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Supports IoT devices and smart cards on credit cards or smartphones.
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Designed for seamless integration; compliant with OpenSSL, PKCS#11, and OpenPGP (RFC4880) industry standards.
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---
## citadel_pqcrypto

- **Category**: Cryptographic Libraries
- **Product Name**: citadel_pqcrypto
- **Product Brief**: Post-quantum cryptographic library for secure communication resistant to classical and quantum attacks.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides comprehensive implementation of post-quantum cryptographic primitives and protocols. Supports NIST Round 3 algorithms for key exchange, hybrid classical/post-quantum encryption, AEAD, anti-replay protection, and zero-knowledge proofs. Includes dependencies on kyber-pke, pqcrypto-falcon-wasi, and oqs.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES-GCM, Ascon, ChaCha20-Poly1305, Kyber (via kyber-pke), Falcon (via pqcrypto-falcon-wasi), SHA3
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: MIT OR Apache-2.0
- **Latest Version**: 0.13.0
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: x86_64-unknown-linux-gnu
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: Falcon (via pqcrypto-falcon-wasi)
- **Authoritative Source URL**: Unknown
- **Implementation Attack Surface**: No unsafe code allowed (enforced by forbid(unsafe_code)); cryptographic operations are constant-time where possible; sensitive data wrapped in Zeroizing for secure cleanup.
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## noble-post-quantum

- **Category**: Cryptographic Libraries
- **Product Name**: noble-post-quantum
- **Product Brief**: A cryptographic library implementing post-quantum algorithms including ML-KEM, ML-DSA, SLH-DSA, and Falcon signatures.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements ML-KEM (Kyber), ML-DSA (Dilithium), SLH-DSA (SPHINCS+), and Falcon signatures. Includes hybrid KEMs (XWing, KitchenSink, QSF) combining PQC with classical curves (X25519, P-256, P-384). Self-audit completed in Mar 2026 with no major findings.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, ML-DSA, SLH-DSA, Falcon, X25519, P-256, P-384
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: 0.6.1
- **Release Date**: 2026-04-12
- **FIPS Validated**: No
- **Primary Platforms**: Node.js (v20.19+), Browsers (ESM-only)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Prepare for future FN-DSA / FIPS-206.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA, Falcon
- **Authoritative Source URL**: https://github.com/paulmillr/noble-post-quantum
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Self-audit completed in Mar 2026 with no major findings.
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Breaking changes in v0.5.0 (ESM-only, argument order changes, .js extension required). Backward compatibility for old paths available until v0.6.
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---
## .NET 10 PQC

- **Category**: Cryptographic Libraries
- **Product Name**: .NET 10
- **Product Brief**: The most productive, modern, secure, intelligent, and performant release of .NET with Post-Quantum Cryptography support.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: .NET 10 adds support for 4 PQC algorithms: ML-KEM (Key Encapsulation, NIST FIPS 203), ML-DSA (Signature, NIST FIPS 204), SLH-DSA (Signature, NIST FIPS 205), and Composite ML-DSA (Signature, IETF Draft). These replace RSA and EC-DSA signatures and RSA/EC-DH key agreement.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, EC-DSA, EC-Diffie-Hellman, ML-KEM, ML-DSA, SLH-DSA, Composite ML-DSA
- **Key Management Model**: Programmatic key management via new classes (e.g., MLDsa) supporting import/export of PKCS#8, Encrypted PKCS#8, SubjectPublicKeyInfo, and PEM formats.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer cryptographic library
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: .NET 10
- **Release Date**: 2025-11-18
- **FIPS Validated**: No
- **Primary Platforms**: .NET (Cross-platform implied by "works no matter what OS you’re on")
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Focus on 4 PQC algorithms in .NET 10: ML-KEM, ML-DSA, SLH-DSA, and Composite ML-DSA, aligned with NIST FIPS 203/204/205 and IETF drafts.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, EC-DSA, ML-DSA, SLH-DSA, Composite ML-DSA
- **Authoritative Source URL**: net-10-pqc-a3688bff.html
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Breaking changes in API design (new classes extending object instead of AsymmetricAlgorithm); not a drop-in replacement for RSA/EC-DH.
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## Java 24 PQC Runtime

- **Category**: Cryptographic Libraries
- **Product Name**: Java 24 (Oracle JDK 24)
- **Product Brief**: The latest version of the Java programming language and development platform, delivering improvements to productivity, performance, stability, and security.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Java 24 includes new post-quantum crypto capabilities. Specifically, it provides an implementation of the quantum-resistant Module-Lattice-Based Key-Encapsulation Mechanism (JEP 496) and a Key Derivation Function API (JEP 478) to help developers prepare for emerging quantum computing environments and improve confidentiality and communication integrity.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Module-Lattice-Based Key-Encapsulation Mechanism
- **Key Management Model**: Unknown
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Java 24
- **Release Date**: 2025-03-18
- **FIPS Validated**: Unknown
- **Primary Platforms**: Unknown
- **Target Industries**: Enterprise
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: New features in support of post-quantum crypto will be highlighted at the JavaOne 2025 conference.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Unknown
- **Authoritative Source URL**: Unknown
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---