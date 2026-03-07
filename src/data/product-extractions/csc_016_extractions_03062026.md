---
generated: 2026-03-06
collection: csc_016
documents_processed: 8
enrichment_method: ollama-qwen3.5:27b
---

## liboqs

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: liboqs
- **Product Brief**: C library for prototyping and experimenting with quantum-resistant cryptography.
- **PQC Support**: Yes (Supports KEMs, signature schemes, and stateful signatures including NIST standards ML-KEM and ML-DSA)
- **PQC Capability Description**: Open source C library providing implementations of quantum-safe KEMs (BIKE, Classic McEliece, FrodoKEM, HQC, Kyber, ML-KEM, NTRU, NTRU-Prime) and signature schemes (CROSS, Falcon, MAYO, ML-DSA, SLH-DSA, SNOVA, UOV). Includes stateful signatures (LMS, XMSS). Implements NIST standards ML-KEM (FIPS 203) and ML-DSA (FIPS 204). Status is for research and prototyping; not recommended for production or sensitive data.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BIKE, Classic McEliece, FrodoKEM, HQC, Kyber, ML-KEM, NTRU, NTRU-Prime, CROSS, Falcon, MAYO, ML-DSA, SLH-DSA, SNOVA, UOV, LMS, XMSS
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software Library (C)
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Not stated
- **Release Date**: 2026-03-06
- **FIPS Validated**: No (Implements algorithms selected for FIPS 203 and FIPS 204 standards, but library itself is not stated as validated)
- **Primary Platforms**: Linux, Mac, Windows, Cross compilation
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Tracks NIST PQC standardization; retains ML-KEM and ML-DSA names; Falcon tracking Round 3 submissions; supports experimental algorithms via OQS_ALGS_ENABLED.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: CROSS, Falcon, MAYO, ML-DSA, SLH-DSA, SNOVA, UOV, LMS, XMSS
- **Authoritative Source URL**: https://github.com/open-quantum-safe/liboqs

---

## oqs-provider

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: oqs-provider
- **Product Brief**: OpenSSL 3 provider containing post-quantum algorithms enabling quantum-safe cryptography in standard distributions.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Fully enables QSC for KEM key establishment in TLS 1.3 and hybrid KEM schemes. Supports QSC signatures including CMS and CMP via EVP interface. Implements ML-KEM, BIKE, FrodoKEM, ML-DSA, Falcon, MAYO, CROSS, UOV, SNOVA, and SLH-DSA. Key persistence via X.509 and PKCS#12. TLS 1.3 signature support available from OpenSSL 3.2.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (mlkem512, mlkem768, mlkem1024), BIKE, FrodoKEM (efrodo, frodo variants), ML-DSA (mldsa44, mldsa65, mldsa87), Falcon, MAYO, CROSS, UOV, SNOVA, SLH-DSA, X25519, SecP256r1, SecP384r1, RSA
- **Key Management Model**: Programmatic key management via OpenSSL 3.0 provider interface; supports encode/decode mechanism, X.509 data structures, and PKCS#12 for bundling private keys with certificates.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (OpenSSL Provider)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 0.9.0 (mentioned in context of OpenSSL 3.5.0 compatibility)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Linux, Windows, MacOS
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports hybrid algorithms combining classic and quantum-safe methods. Disables native liboqs ML-KEM/ML-DSA when OpenSSL >= 3.5.0 is detected to use native implementations. Future resolution of limitations discussed in GitHub discussions.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (mldsa44, mldsa65, mldsa87), Falcon (falcon512, falcon1024, padded variants), MAYO (mayo1-5), CROSS (rsdp/g variants), UOV (Is, Ip, III, V variants), SNOVA (snova variants), SLH-DSA (sha2/shake variants)
- **Authoritative Source URL**: https://github.com/open-quantum-safe/oqs-provider

---

## PQClean

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: PQClean
- **Product Brief**: Clean, portable, tested implementations of post-quantum cryptography schemes in C.
- **PQC Support**: Yes (Kyber, HQC, Classic McEliece, Dilithium, Falcon, SPHINCS+)
- **PQC Capability Description**: Provides standalone C implementations of NIST PQC finalists and alternate candidates including Kyber, HQC, Classic McEliece, Dilithium, Falcon, and SPHINCS+. Not an integrated library; intended for integration into other projects. Deprecation notice: planned to archive as read-only in July 2026.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Kyber, HQC, Classic McEliece, Dilithium, Falcon, SPHINCS+, SHA-2, SHA-3 (FIPS202), AES, cSHAKE
- **Key Management Model**: Not stated (Provides algorithm implementations; does not define a key management architecture)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (C implementations)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Mixed (CC0 for repository code, specific licenses per implementation in subdirectories, MIT/Public Domain for common files)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-04
- **FIPS Validated**: No
- **Primary Platforms**: Linux, MacOS, Windows
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Planned to archive as read-only in July 2026; recommends PQ Code Package for maintained implementations.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Dilithium, Falcon, SPHINCS+
- **Authoritative Source URL**: https://github.com/PQClean/PQClean

---

## CRYSTALS Reference Implementations

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: CRYSTALS Reference Implementations
- **Product Brief**: Public C reference implementations for Kyber and Dilithium post-quantum cryptographic algorithms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides reference implementations for the Kyber (KEM) and Dilithium (Signature) schemes, which are lattice-based post-quantum cryptographic algorithms. Includes security estimation scripts. The repository also contains a fork of liboqs, a C library for quantum-resistant algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Kyber, Dilithium
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-10-08 (Last updated for dilithium repository)
- **FIPS Validated**: No
- **Primary Platforms**: C language environment; Python used for security estimation scripts.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Dilithium
- **Authoritative Source URL**: https://github.com/pq-crystals

---

## IBM Quantum Safe Toolkit

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: IBM Quantum Safe Toolkit
- **Product Brief**: End-to-end quantum-safe transformation technology, services, and strategy for enterprise cryptography modernization.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports CRYSTALS-Kyber for key encryption and CRYSTALS-Dilithium and FALCON for digital signatures. Includes tools for discovery (Explorer), remediation (Remediator), monitoring (Guardium Quantum Safe), and adaptive proxying. Mentions MAYO, UOV, SQISign in roadmap context.
- **PQC Migration Priority**: High
- **Crypto Primitives**: CRYSTALS-Kyber, CRYSTALS-Dilithium, FALCON, MAYO, UOV, SQISign, OpenSSL
- **Key Management Model**: Programmatic key management via IBM Cloud Key Protect and Hyper Protect Crypto Services; supports CBOM generation for asset agility.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Software libraries, Adaptive Proxy, HSM-backed via Hyper Protect)
- **Infrastructure Layer**: Application, Security Stack, Cloud, Hardware, Network
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: 2024-08-15
- **FIPS Validated**: Not stated
- **Primary Platforms**: IBM z16, IBM Cloud, Red Hat, IBM Storage, IBM Power, OpenSSL
- **Target Industries**: Telecom, Finance, Defense, Government, Critical Infrastructure, Healthcare
- **Regulatory Status**: Aligns with NIST PQC standards, CNSA 2.0, Federal agencies planning; mentions NCCoE and PQC Coalition.
- **PQC Roadmap Details**: Timeline 2022-2026+ covering NIST standardization, vendor transition, and adoption of CRYSTALS-Kyber/Dilithium/FALCON; includes MAYO, UOV, SQISign in future phases.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: CRYSTALS-Dilithium, FALCON (Current/Planned); MAYO, UOV, SQISign (Roadmap)
- **Authoritative Source URL**: Unknown

---

## hash-sigs

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: hash-sigs
- **Product Brief**: A full-featured implementation of LMS and HSS Hash Based Signature Schemes from draft-mcgrew-hash-sigs-07.
- **PQC Support**: Yes (LMS and HSS schemes)
- **PQC Capability Description**: Implementation of LMS and HSS Hash Based Signature Schemes based on draft-mcgrew-hash-sigs-07 and RFC 8554. Includes an ACVP branch designed for optional compatibility with the public ACVP server. Written in C.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: LMS, HSS
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown
- **Release Date**: 2026-01-27
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: LMS, HSS
- **Authoritative Source URL**: https://github.com/cisco/hash-sigs

---

## xmss-reference

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: xmss-reference
- **Product Brief**: Reference implementation of the XMSS eXtended Merkle Signature Scheme accompanying RFC 8391.
- **PQC Support**: Yes (XMSS: eXtended Merkle Signature Scheme)
- **PQC Capability Description**: Implements all parameter sets defined in RFC 8391 at run-time via a 32-bit OID prefix; supports compile-time parameter sets by removing `struct xmss_params`. Intended for cross-validation and experimenting, not production deployment. Stateful signature scheme requiring careful threat model consideration.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: XMSS (eXtended Merkle Signature Scheme), SHA-256, SHA-512
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: CC0-1.0
- **Latest Version**: Unknown
- **Release Date**: 2026-01-11
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (Language: C; Dependencies: OpenSSL)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: XMSS (eXtended Merkle Signature Scheme)
- **Authoritative Source URL**: https://github.com/XMSS/xmss-reference

---

## OQS-OpenSSL Provider (liboqs-provider)

- **Category**: Post-Quantum Cryptography Libraries
- **Product Name**: OQS-OpenSSL Provider (liboqs-provider)
- **Product Brief**: OpenSSL 3 provider enabling quantum-safe cryptography via KEM and signature algorithms.
- **PQC Support**: Yes (Full support for KEM key establishment in TLS 1.3, hybrid schemes, and QSC signatures including CMS/CMP).
- **PQC Capability Description**: Fully enables quantum-safe cryptography for KEM key establishment in TLS 1.3 with hybrid schemes. Supports QSC signatures via EVP interface including CMS and CMP. Key persistence via encode/decode, X.509, and PKCS#12. Supports ML-KEM, BIKE, FrodoKEM, ML-DSA, Falcon, MAYO, CROSS, UOV, SNOVA, SLH-DSA. TLS 1.3 signature functionality available from OpenSSL 3.2.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BIKE, FrodoKEM, ML-KEM, ML-DSA, Falcon, MAYO, CROSS, UOV, SNOVA, SLH-DSA, X25519, SecP256r1, X448, SecP384r1, RSA.
- **Key Management Model**: Programmatic key management via OpenSSL 3.x provider interface; supports PKCS#12 bundling of private keys with X.509 certificates and X.509 data structures.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (OpenSSL Provider)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 0.9.0 (mentioned in context of OpenSSL 3.5.0 compatibility)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Linux, Windows, MacOS
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports standard PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) natively in OpenSSL 3.5+; disables its own implementations of these when native support is detected to avoid conflicts.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (mldsa44, mldsa65, mldsa87), Falcon (falcon512, falcon1024, padded variants), MAYO (mayo1-5), CROSS (rsdp/g variants), UOV (Is, Ip, III, V variants), SNOVA (snova2454, snova37172, etc.), SLH-DSA (SHA2/SHAKE variants).
- **Authoritative Source URL**: https://github.com/open-quantum-safe/oqs-provider

---
