---
generated: 2026-04-06
collection: csc_016
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## RustCrypto ML-KEM

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: RustCrypto ML-KEM
- **Product Brief**: Pure Rust implementation of the Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM) as described in FIPS 203.
- **PQC Support**: Yes (Implements ML-KEM, formerly Kyber, a NIST-standardized post-quantum KEM)
- **PQC Capability Description**: Implements the Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM) standardized by NIST in FIPS 203. Supports three security levels: MlKem512 (128-bit), MlKem768 (192-bit), and MlKem1024 (256-bit). The implementation is a pure Rust library for key encapsulation, not yet independently audited.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM (MlKem512, MlKem768, MlKem1024)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Library
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: Apache License, Version 2.0 OR MIT license
- **Latest Version**: 0.2.3
- **Release Date**: Unknown
- **FIPS Validated**: No (Implements algorithm described in FIPS 203, but implementation is not stated as validated)
- **Primary Platforms**: aarch64-apple-darwin, aarch64-unknown-linux-gnu, i686-pc-windows-msvc, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (Product implements Key Encapsulation Mechanisms, not signature schemes)
- **Authoritative Source URL**: https://github.com/RustCrypto/KEMs

---

## RustCrypto ML-DSA

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: RustCrypto ML-DSA
- **Product Brief**: Pure Rust implementation of the Module-Lattice-Based Digital Signature Standard (ML-DSA) as described in FIPS 204.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements ML-DSA (formerly CRYSTALS-Dilithium) per FIPS 204 final. Supports parameter sets MlDsa44 (Category 2), MlDsa65 (Category 3), and MlDsa87 (Category 5). Implementation is pure Rust, supports `no_std`, but has never been independently audited.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (MlDsa44, MlDsa65, MlDsa87), DSA, ECDSA, Ed25519, Ed448, LMS, SLH-DSA, XMSS
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Library (Pure Rust implementation)
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.0.4
- **Release Date**: Not stated
- **FIPS Validated**: No (Implementation described in FIPS 204 final, but not stated as validated)
- **Primary Platforms**: i686-pc-windows-msvc, i686-unknown-linux-gnu, x86_64-apple-darwin, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (MlDsa44, MlDsa65, MlDsa87), DSA, ECDSA, Ed25519, Ed448, LMS, SLH-DSA, XMSS
- **Authoritative Source URL**: https://github.com/RustCrypto/signatures

---

## RustCrypto SLH-DSA

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: RustCrypto SLH-DSA
- **Product Brief**: Pure Rust implementation of the SLH-DSA (SPHINCS+) signature scheme based on FIPS-205.
- **PQC Support**: Yes (SLH-DSA/SPHINCS+ implemented per FIPS-205)
- **PQC Capability Description**: Implements Stateless Hash-based Digital Signature Algorithm (SLH-DSA) based on SPHINCS+, finalized in NIST FIPS-205. Supports 12 parameter sets using SHA2 and SHAKE256 hash functions. Signatures range from 7KB to 50KB. Implementation is not independently audited.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SLH-DSA (SPHINCS+), SHA2, SHAKE256, Ed25519, ECDSA, DSA, LMS, ML-DSA, XMSS
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Library (no_std compatible)
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.1.0
- **Release Date**: Unknown
- **FIPS Validated**: No (Implementation based on FIPS-205 standard, but not stated as validated)
- **Primary Platforms**: i686-pc-windows-msvc, i686-unknown-linux-gnu, x86_64-apple-darwin, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: SLH-DSA (SPHINCS+), DSA, ECDSA, Ed25519, Ed448, LMS, ML-DSA, XMSS
- **Authoritative Source URL**: https://github.com/RustCrypto/signatures

---
