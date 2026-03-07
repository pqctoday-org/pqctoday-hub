---
generated: 2026-03-06
collection: csc_005
documents_processed: 8
enrichment_method: ollama-qwen3.5:27b
---

## Google ALTS

- **Category**: TLS/SSL Implementation Software
- **Product Name**: Google ALTS (Application Layer Transport Security)
- **Product Brief**: Application-layer transport security protocol used by Google Cloud for authenticated, integrity-protected, and encrypted service-to-service communication.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any plans for PQC migration. It describes the use of standard cryptographic primitives for authentication and encryption within Google's infrastructure.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: TLS, BoringSSL, ALTS, PSP security protocol, IPsec, QUIC, forward-secure key negotiation (specific algorithms like ECDSA or RSA are not explicitly listed in the text).
- **Key Management Model**: Service-based identities with credentials issued to services; session keys established via a control channel protected by ALTS and rotated periodically.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer transport security using service-based identities and session keys.
- **Infrastructure Layer**: Application, Network, Cloud
- **License Type**: Proprietary (Google-maintained)
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: BoringCrypto (core of BoringSSL) is validated to FIPS 140-3 level 1; ALTS specific validation status is not stated.
- **Primary Platforms**: Google Cloud, Google Front End (GFE), Virtual Machines (VMs), GKE, Compute Engine, Cloud SQL.
- **Target Industries**: Enterprise, Cloud Service Providers (Google Cloud customers).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Text mentions "security tokens" and "credentials" but does not list specific signature algorithms).
- **Authoritative Source URL**: Not stated

---

## AWS s2n-tls

- **Category**: TLS/SSL Implementation Software
- **Product Name**: s2n-tls
- **Product Brief**: A C99 implementation of the TLS/SSL protocols designed to be simple, small, fast, and with security as a priority.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or PQC migration plans. It lists support for AES, ChaCha20, 3DES, RC4, DHE, and ECDHE only.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES (128-bit, 256-bit), CBC, GCM, ChaCha20, 3DES, RC4, DHE, ECDHE
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: TLS/SSL Library Implementation
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: Not stated
- **Primary Platforms**: Ubuntu (18, 22, 24), Amazon Linux 2 (AL2), Amazon Linux 2023 (AL2023), NixOS, OpenBSD 7.4, FreeBSD, OSX, Fedora Core 34-36; Architectures: x86_64, i686, aarch64
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document lists encryption and key exchange algorithms but does not explicitly list signature schemes like ECDSA or RSA)
- **Authoritative Source URL**: https://github.com/aws/s2n-tls

---

## BoringSSL

- **Category**: TLS/SSL Implementation Software
- **Product Name**: BoringSSL
- **Product Brief**: A fork of OpenSSL designed to meet Google's needs, used in Chrome/Chromium and Android.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The document lists headers for `mldsa.h` (ML-DSA) and `mlkem.h` (ML-KEM-768), indicating support for these Post-Quantum Cryptography algorithms. No specific maturity level or production status is explicitly stated beyond the presence of these headers.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES, ChaCha20, CMAC, Curve25519, DES, Diffie-Hellman (DH), DSA, ECDSA, HKDF, HMAC, MD5, ML-DSA, ML-KEM-768, RC4, RSA, SHA-1, SHA-2, SipHash
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: 0.20260211.0
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Chrome/Chromium, Android (not part of NDK)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: DSA, ECDSA, RSA, ML-DSA
- **Authoritative Source URL**: Not stated

---

## GnuTLS

- **Category**: TLS/SSL Implementation Software
- **Product Name**: GnuTLS
- **Product Brief**: A secure communications library implementing SSL, TLS, and DTLS protocols with a simple C language API.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It only states the library implements SSL, TLS, and DTLS.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: GNU General Public License v3.0 or later
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: C language (API)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.gnutls.org

---

## LibreSSL

- **Category**: TLS/SSL Implementation Software
- **Product Name**: LibreSSL
- **Product Brief**: A fork of OpenSSL 1.0.1g developed by OpenBSD to modernize codebase and improve security.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans. It states the project does not add new features, ciphers, or APIs without a solid reason.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Document mentions "ciphers" generally but lists no specific algorithms like ECDSA, RSA, or AES).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION (as stated in the repository metadata)
- **Latest Version**: Not stated
- **Release Date**: 2026-03-04 (Last Updated timestamp)
- **FIPS Validated**: No
- **Primary Platforms**: Linux, FreeBSD, NetBSD, HP-UX, Solaris, Mac OS X, AIX, Emscripten, Microsoft Windows, Wine, MinGW-w64, Cygwin, Visual Studio
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/libressl/portable

---

## rustls

- **Category**: TLS/SSL Implementation Software
- **Product Name**: rustls
- **Product Brief**: A modern TLS library written in Rust that implements TLS 1.2 and TLS 1.3 with no unsafe features by default.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: PQC support is available only via the `rustls-aws-lc-rs` provider, which includes post-quantum algorithms. The default `rustls-ring` provider does not support post-quantum algorithms. Specific PQC algorithm names are not listed in the text.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (Text mentions RSA 2048 in example filenames, but does not explicitly list supported primitives like ECDSA or Ed25519).
- **Key Management Model**: Programmatic key management via `crypto::CryptoProvider` abstraction; specific formats (PKCS#8/PKCS#12) not stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library with pluggable cryptography providers (`crypto::CryptoProvider`).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache License version 2.0, MIT license, ISC license
- **Latest Version**: 0.24 (mentioned as the version requiring explicit crypto provider selection)
- **Release Date**: Not stated (Last Updated: 2026-03-06T18:00:48Z refers to repository metadata, not a specific release date)
- **FIPS Validated**: No
- **Primary Platforms**: Platform independent; requires Rust 1.83 or later.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: A roadmap exists (ROADMAP.md), but specific PQC plans, timelines, or algorithm choices are not detailed in the provided text.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/rustls/rustls

---

## wolfSSL

- **Category**: TLS/SSL Implementation Software
- **Product Name**: wolfSSL
- **Product Brief**: A small, fast, portable implementation of TLS/SSL for embedded devices to the cloud.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports Post-Quantum TLS 1.3 groups. Release 5.8.4 includes new ML-KEM and ML-DSA APIs with seed/import PKCS8 support, along with \_new/\_delete APIs for these algorithms.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ChaCha20, Curve25519, BLAKE2b, BLAKE2s, X25519, ECDSA (P521, P256), RSA, AES, SHA family (SHA, SHA256, SHA384, SHA512), Ed25519, Ed448, DH, HMAC, CMAC, PBKDF2, HKDF, AsconAEAD, ML-KEM, ML-DSA
- **Key Management Model**: Supports hardware-accelerated AES operations via CryptoCB with key import to Secure Element/HSM for true key isolation; supports PKCS#12 and PKCS8.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software library with optional hardware acceleration (HSM/Secure Element) support via CryptoCB callbacks.
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: GPL-3.0
- **Latest Version**: 5.8.4
- **Release Date**: 2025-11-20
- **FIPS Validated**: Yes; wolfCrypt has FIPS 140-2 validation (Certificates #2425, #3389) and FIPS 140-3 validation (Certificate #4718).
- **Primary Platforms**: Embedded devices, RTOS, resource-constrained environments, standard operating environments, FreeBSD kernel module, STM32, PSoC6, ESP32, RISC-V, AArch64, X86_64.
- **Target Industries**: IoT, Embedded Systems, Enterprise, Desktop, Mobile
- **Regulatory Status**: FIPS 140-2 and FIPS 140-3 validated (wolfCrypt).
- **PQC Roadmap Details**: Implemented ML-KEM and ML-DSA APIs in version 5.8.4; supports Post-Quantum TLS 1.3 groups.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, Ed25519, Ed448, RSA, ML-DSA (newly added)
- **Authoritative Source URL**: https://github.com/wolfSSL/wolfssl

---

## Mbed TLS

- **Category**: TLS/SSL Implementation Software
- **Product Name**: Mbed TLS
- **Product Brief**: An open-source TLS/SSL implementation library with PSA Crypto integration and planned PQC support.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: ML-DSA investigation scheduled for 2025 CQ4; prototype in 2026 CQ1; initial support in 2026 CQ2. Future ML-KEM support planned. No current production PQC implementation stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: EdDSA, SHA3, PBKDF2, ECJ-PAKE, TLS 1.3, DTLS 1.2, AES (implied by Cipher/AEAD), HMAC, SHA256, SHA512, Bignum, ECP (NIST curves)
- **Key Management Model**: PSA Crypto with support for opaque persistent keys in Secure Elements; PKCS7 parser mentioned; no specific MPC or multi-sig architecture stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library with PSA driver interface and Secure Element support
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Apache License 2.0
- **Latest Version**: Mbed TLS 4.0 (released), Mbed TLS 3.6.3 (mentioned in history)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: ML-DSA investigation (2025 CQ4), prototype (2026 CQ1), initial support (2026 CQ2); Future ML-KEM support planned.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: EdDSA, ECDSA (implied by ECP/NIST curves), PKCS7; ML-DSA and ML-KEM planned.
- **Authoritative Source URL**: Not stated

---
