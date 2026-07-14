---
generated: 2026-07-13
collection: csc_001
documents_processed: 12
enrichment_method: mlx-mlx-community/Qwen3.6-27B-8bit
---

## NVIDIA cuPQC SDK

- **Category**: Cryptographic Libraries
- **Product Name**: NVIDIA cuPQC
- **Product Brief**: SDK of GPU-optimized cryptographic math libraries for building classical and next-generation high-performance cryptographic applications.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides GPU-accelerated implementations of NIST-standardized ML-KEM-512/768/1024 and ML-DSA-44/65/87. Production-ready libraries enable developers to build solutions for next-generation cryptographic applications. Supports emerging technologies including post-quantum cryptography and zero-knowledge proofs.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SHA-2, SHA-3, SHAKE, Poseidon 2, ML-KEM-512, ML-KEM-768, ML-KEM-1024, ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: SDK of GPU-optimized cryptographic math libraries; deployment across NVIDIA GPU architectures from edge devices to data center GPUs.
- **Infrastructure Layer**: Hardware
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: NVIDIA GPU architectures (including NVIDIA Jetson edge devices, NVIDIA RTX PRO 6000 Blackwell Server Edition, NVIDIA H100)
- **Target Industries**: Enterprise (implied by "enterprises with high-throughput security applications")
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Supports NIST-standardized ML-KEM and ML-DSA algorithms; powers a growing range of emerging cryptographic technologies.
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: nvidia-cupqc-sdk-b9c7dca7.html
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Supports NVIDIA Jetson edge devices.
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## curl PQC

- **Category**: Cryptographic Libraries
- **Product Name**: curl (with wolfSSL)
- **Product Brief**: curl enhanced with wolfSSL to support NIST-standardized post-quantum cryptography for secure communications.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements NIST-standardized ML-KEM (Kyber) for key encapsulation and ML-DSA (Dilithium) for digital signatures. Supports quantum-resistant key exchange with ML-KEM under TLS 1.3 and enables hybrid cryptography blending classical and post-quantum algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM (Kyber), ML-DSA (Dilithium)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Actively enhancing curl with robust PQC support; implements ML-KEM and ML-DSA.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (Dilithium)
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

## Bouncy Castle

- **Category**: Cryptographic Libraries
- **Product Name**: Bouncy Castle Java
- **Product Brief**: Cryptographic library providing FIPS-compliant keystores, OpenPGP support, and PQC algorithms for Java.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Bouncy Castle Java 1.84 offers PQC support for Java 17 users, enabling the use of ML-KEM and NTRU algorithms via the Java KEM API. This aligns with Oracle's backporting of the KEM API to Java 17, allowing users to port programs using the KEM API across a wider range of JVMs.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, NTRU, GOSTCTR, FrodoKEM, PKCS12-PBMAC1, PBMAC1
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Libraries
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: 1.84 (and LTS 2.73.11)
- **Release Date**: 2026-05-12
- **FIPS Validated**: Yes (FIPS-compliant keystore PKCS12-PBMAC1; implementation in conjunction with FIPS BCJSSE provider supporting PKCS12-PBMAC1 KeyStore in bctls-fips-2.0.23 and bctls-fips-2.1.23)
- **Primary Platforms**: Java 17, JVMs
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: Unknown
- **Authoritative Source URL**: bouncy castle.org/download
- **Implementation Attack Surface**: CVE-2026-5598 – Non-constant time comparisons risk private key leakage in FrodoKEM
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Software Bill of Material (BOM) files are available on Maven Central for both versions.
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## Mozilla NSS

- **Category**: Cryptographic Libraries
- **Product Name**: Network Security Services (NSS)
- **Product Brief**: Cryptographic library released by Mozilla, version 3.118, supporting various security protocols and algorithms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-KEM (via libcrux vendor code), specifically mlkem1024 and mlkem768. Supports hybrid schemes: secp384r1mlkem1024, secp256r1mlkem768, and mlkem768x25519 (default). Includes ML-DSA SGN and VFY interfaces. Adds mlk-kem-1024 tests.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: secp384r1, secp256r1, Ed25519, ML-KEM (mlkem1024, mlkem768), ML-DSA, SHA-1 (deprecated for DB password hash)
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Libraries
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: 3.118
- **Release Date**: 2025-11-18
- **FIPS Validated**: Unknown
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: ML-DSA (SGN and VFY interfaces), Ed25519 (implied by mlkem768x25519)
- **Authoritative Source URL**: https://ftp.mozilla.org/pub/mozilla.org/security/nss/releases/NSS_3_118_RTM/src/
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Includes mlk-kem-1024 tests; source consistency tests.
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Vendors latest ML-KEM code from libcrux.
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## mbedTLS

- **Category**: Cryptographic Libraries
- **Product Name**: mbedTLS, TF-PSA-Crypto
- **Product Brief**: Cryptographic library and PSA Crypto implementation with planned Post-Quantum Cryptography support.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: ML-DSA investigation is in development for 2025 CQ4. ML-DSA prototype is planned for 2026 CQ1. Initial support for ML-DSA is planned for 2026 CQ2. Future ML-KEM support is also planned for 2026 CQ2.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: EdDSA, ECJ-PAKE, SHA3, SHA256, SHA512, PBKDF2, M-AEAD, Bignum, ECP (NIST curves), TLS cipher suites (to be removed in 4.0)
- **Key Management Model**: PSA driver - Handle Opaque Persistent Key in Secure Element
- **Supported Blockchains**: Unknown
- **Architecture Type**: Library, PSA Crypto API, Driver interface
- **Infrastructure Layer**: Libraries
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: Mbed TLS 4.0, TF-PSA-Crypto 1.0 (released); Mbed TLS 4.1, TF-PSA-Crypto 1.1 LTS (planned 2026 CQ1)
- **Release Date**: Unknown
- **FIPS Validated**: Unknown
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: 2025 CQ4: ML-DSA Investigation. 2026 CQ1: ML-DSA Prototype. 2026 CQ2: ML-DSA - Initial support, Future ML-KEM Support.
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: EdDSA (current), ML-DSA (planned)
- **Authoritative Source URL**: Unknown
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: PSA Client-Server Testing, CI Optimization, PSA Crypto 1.2 compliance testing
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Memory Optimizations (code size) planned for 2026 CQ2; Code size optimisation mentioned for driver only builds (Cipher, AEAD, ECC, hashes).
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Mbed TLS 4.x API Consolidation planned for 2026 CQ1 and CQ2; Mbed TLS 4.0 removes TLS cipher suites.
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## @noble/curves

- **Category**: Cryptographic Libraries
- **Product Name**: @noble/curves
- **Product Brief**: Audited & minimal JS implementation of elliptic curve cryptography
- **PQC Support**: No
- **PQC Capability Description**: The document describes the product as an implementation of "elliptic curve cryptography" and lists classical algorithms (secp256k1, ed25519, bls12-381, etc.). There is no mention of Post-Quantum Cryptography (PQC) algorithms, NIST PQC standards, or quantum-resistant capabilities.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: secp256k1, ed25519, p256, p384, p521, secp256r1, ed448, x25519, bls12-381, bn254, alt_bn128, bls, ecc, ecdsa, eddsa, oprf, schnorr, fft, poseidon, frost
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 2.2.0
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Node.js (>= 20.19.0), Bun, Deno
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, EdDSA, Schnorr, BLS
- **Authoritative Source URL**: https://paulmillr.com/noble/
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Includes test scripts (`test`, `test:bun`, `test:deno`, `test:node20`, `test:coverage`), benchmarking (`bench`), and checks for README, treeshaking, and JSDoc. Specific KAT vectors, ACVP conformance, or formal verification are not explicitly stated.
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Dependencies include `@noble/hashes`. DevDependencies include `@paulmillr/jsbt`, `@types/node`, `fast-check`, `prettier`, `typescript`. Provenance attestation is present (SLSA v1).
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## @noble/hashes

- **Category**: Cryptographic Libraries
- **Product Name**: @noble/hashes
- **Product Brief**: Audited & minimal 0-dependency JS implementation of SHA, RIPEMD, BLAKE, HMAC, HKDF, PBKDF & Scrypt
- **PQC Support**: No
- **PQC Capability Description**: Not stated
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SHA, RIPEMD, BLAKE, HMAC, HKDF, PBKDF, Scrypt, Argon2, Keccak
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Libraries
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 2.2.0
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Node.js (>= 20.19.0), Bun, Deno
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: Unknown
- **Authoritative Source URL**: https://paulmillr.com/noble/
- **Implementation Attack Surface**: Unknown
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: ACVP conformance testing (test:acvp), benchmarking, treeshaking checks, JSDoc checks
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: Unknown
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: 0-dependency, SLSA provenance attestations available
- **Deployment & Migration Complexity**: Unknown
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## OpenSSL 3.5.0

- **Category**: Cryptographic Libraries
- **Product Name**: OpenSSL
- **Product Brief**: A toolkit providing cryptographic functions and TLS/SSL protocol support, including new PQC algorithm support in version 3.5.0.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: OpenSSL 3.5.0 adds support for PQC algorithms ML-KEM, ML-DSA, and SLH-DSA. The default TLS supported groups list has been changed to include and prefer hybrid PQC KEM groups. Default TLS keyshares offer X25519MLKEM768 and X25519.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA, EC, ECX, DH, SM2, X25519, ML-KEM, ML-DSA, SLH-DSA, X25519MLKEM768, des-ede3-cbc, aes-256-cbc, PBMAC1, OCB
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Crypto
- **License Type**: Unknown
- **License**: Unknown
- **Latest Version**: 3.5.6
- **Release Date**: 2026-04-07
- **FIPS Validated**: FIPS 140-3 PCT on DH key generation added; FIPS provider performs PCT on key import for RSA, EC, and ECX; option to use JITTER seed source.
- **Primary Platforms**: Unknown
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: ML-DSA, SLH-DSA
- **Authoritative Source URL**: https://github.com/openssl/openssl/issues/27282
- **Implementation Attack Surface**: Timing side-channel in SM2 algorithm on 64 bit ARM (CVE-2025-9231); Heap buffer overflow in hexadecimal conversion (CVE-2026-31789); Stack buffer overflow in CMS AuthEnvelopedData parsing (CVE-2025-15467); Out-of-bounds read & write in RFC 3211 KEK Unwrap (CVE-2025-9230); Out-of-bounds read in HTTP client no_proxy handling (CVE-2025-9232); Heap out-of-bounds write in BIO_f_linebuffer (CVE-2025-68160); Out of bounds write in PKCS12_get_friendlyname() UTF-8 conversion (CVE-2025-69419).
- **Cryptographic Discovery & Inventory**: Unknown
- **Testing & Validation Methods**: Unknown
- **QKD Protocols & Quantum Networking**: Unknown
- **QRNG & Entropy Sources**: JITTER seed source support in FIPS provider.
- **Constrained Device & IoT Suitability**: Unknown
- **Supply Chain & Vendor Risk**: Unknown
- **Deployment & Migration Complexity**: Default encryption cipher changed from des-ede3-cbc to aes-256-cbc; default TLS groups changed to prefer hybrid PQC KEM; some practically unused groups removed; BIO_meth_get_*() functions deprecated.
- **Financial & Business Impact**: Unknown
- **Organizational Readiness**: Unknown

---

## libcrux

- **Category**: Cryptographic Libraries
- **Product Name**: libcrux-ml-kem
- **Product Brief**: Libcrux ML-KEM & Kyber implementations
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements ML-KEM and Kyber algorithms. Supports variants mlkem512, mlkem768, and mlkem1024. Includes features for 'kyber' and 'pqcp'.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, Kyber (mlkem512, mlkem768, mlkem1024)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 0.0.9
- **Release Date**: 2026-05-13
- **FIPS Validated**: No
- **Primary Platforms**: Rust (Edition 2021)
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/cryspen/libcrux
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

## Trail of Bits ml-dsa

- **Category**: Cryptographic Libraries
- **Product Name**: trailofbits / ml-dsa
- **Product Brief**: A Go implementation of the FIPS 204 Module-Lattice Digital Signature Algorithm (ML-DSA).
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements FIPS 204 (ML-DSA) in Go. Supports specific variants: mldsa44, mldsa65, and mldsa87. Provides programmatic key generation, signing, and verification.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (mldsa44, mldsa65, mldsa87)
- **Key Management Model**: Programmatic key generation and management via Go API (GenerateKeyPair, Sign, Verify).
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-3-Clause license
- **Latest Version**: v0.1.0
- **Release Date**: 2025-08-18
- **FIPS Validated**: No (Implements FIPS 204 standard, but validation status not stated)
- **Primary Platforms**: Go
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (mldsa44, mldsa65, mldsa87)
- **Authoritative Source URL**: https://github.com/trailofbits/ml-dsa
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

## libgcrypt

- **Category**: Cryptographic Libraries
- **Product Name**: libgcrypt
- **Product Brief**: A cryptographic library providing interfaces for symmetric ciphers, hash functions, public key algorithms, and KEMs.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Dilithium (ML-DSA), Kyber (FIPS 203), Streamlined NTRU Prime (sntrup761), and Classic McEliece. Includes KEM API support for these algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ECDSA, EdDSA, RSA, AES, ChaCha20, Poly1305, GHASH, POLYVAL, SHA-1, SHA-256, SHA-512, SHA-3, Blake2, SM3, SM4, ARIA, Camellia, Serpent, Twofish, Brainpool curves, secp256k1, Dilithium, Kyber, sntrup761, Classic McEliece
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Security Stack
- **License Type**: Open Source
- **License**: Unknown
- **Latest Version**: 1.12.2
- **Release Date**: 2026-04-15
- **FIPS Validated**: No (Mentions FIPS service indicators, FIPS mode controls, and FIPS 203 compliance for Kyber, but does not state FIPS 140-2/140-3 validation status)
- **Primary Platforms**: SmartOS (Solaris), NetBSD, Windows, macOS, IBM z/OS, RISC-V, AArch64, PowerPC, x86_64, i386
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: ECDSA, EdDSA, RSA, Dilithium (ML-DSA)
- **Authoritative Source URL**: https://dev.gnupg.org/T8114
- **Implementation Attack Surface**: Mentions fixes for ECDH buffer overwrite, bounds checks in Dilithium, point validation in KEM, stack overflow in mceliece6688128f, Kyber secret-dependent branch, and improvements to constant-time operation for ECDSA and mask generation against branch optimization.
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

## libsodium

- **Category**: Cryptographic Libraries
- **Product Name**: libsodium
- **Product Brief**: A modern, portable, easy-to-use crypto library providing post-quantum KEMs, AEADs, and hash functions.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Post-quantum key encapsulation is available in version 1.0.22. Includes ML-KEM768 (NIST-standardized lattice-based KEM) via crypto_kem_mlkem768_*() functions. Includes X-Wing, a hybrid KEM combining ML-KEM768 with X25519, available via crypto_kem_*() functions. X-Wing is recommended for most applications.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM768, X25519, X-Wing, SHA-3 (SHA3-256, SHA3-512), Argon2, AES-256-GCM, AEGIS-128L, AEGIS-256, Ed25519, HKDF (SHA-256, SHA-512), SHA-256, SHA-512, SipHash (implied by libsodium context but not explicitly listed in text, sticking to explicit: Argon2, AES-256-GCM, AEGIS, Ed25519, HKDF, SHA-256, SHA-512, SHA-3, X25519, ML-KEM768, X-Wing, TurboShake, Shake)
- **Key Management Model**: Unknown
- **Supported Blockchains**: Unknown
- **Architecture Type**: Unknown
- **Infrastructure Layer**: Libraries, Security Stack
- **License Type**: Open Source
- **License**: Unknown
- **Latest Version**: 1.0.22
- **Release Date**: 2023-04-09
- **FIPS Validated**: No
- **Primary Platforms**: Windows, macOS, Linux, iOS, Android, WebAssembly, Zig, Apple Silicon, RISC-V, Solaris
- **Target Industries**: Unknown
- **Regulatory Status**: Unknown
- **PQC Roadmap Details**: Unknown
- **Consensus Mechanism**: Unknown
- **Signature Schemes**: Ed25519
- **Authoritative Source URL**: Unknown
- **Implementation Attack Surface**: Optblockers introduced to prevent side channels via conditional jumps (observed on RISC-V). Memory fences added after MAC verification in AEAD to prevent speculative access to plaintext. Memory fences added to remove gadgets for speculative loads.
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