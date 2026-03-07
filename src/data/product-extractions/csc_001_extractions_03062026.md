---
generated: 2026-03-06
collection: csc_001
documents_processed: 24
enrichment_method: ollama-qwen3.5:27b
---

## Bouncy Castle C# .NET

- **Category**: Cryptographic Libraries
- **Product Name**: BouncyCastle.NET Cryptography Library
- **Product Brief**: A .NET implementation of cryptographic algorithms and protocols developed by the Legion of the Bouncy Castle.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Includes implementations of NIST Post-Quantum Cryptography Standardization algorithms: ML-DSA, ML-KEM, SLH-DSA, Falcon, Classic McEliece, FrodoKEM, NTRU, NTRU Prime, Picnic, Saber, and BIKE. All are considered EXPERIMENTAL and subject to change or removal.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA, ML-KEM, SLH-DSA, Falcon, Classic McEliece, FrodoKEM, NTRU, NTRU Prime, Picnic, Saber, BIKE; CMS, OpenPGP, (D)TLS, TSP, X.509
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: MIT (based on MIT X Consortium license); includes modified Bzip2 under Apache Software License, Version 2.0
- **Latest Version**: Not stated
- **Release Date**: 2026-03-01
- **FIPS Validated**: No (Source tree is not the FIPS version; FIPS version available separately)
- **Primary Platforms**: .NET, .NET Core
- **Target Industries**: Not stated
- **Regulatory Status**: Developed by a registered Australian Charity (Legion of the Bouncy Castle)
- **PQC Roadmap Details**: Algorithms are experimental and subject to change or removal; no specific timeline provided.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA, Falcon, Picnic (implied by algorithm list); others not explicitly categorized as signatures in text.
- **Authoritative Source URL**: https://github.com/bcgit/bc-csharp

---

## Bouncy Castle Java

- **Category**: Cryptographic Libraries
- **Product Name**: Bouncy Castle Crypto Package For Java
- **Product Brief**: A Java implementation of cryptographic algorithms developed by the Legion of the Bouncy Castle.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated. The document lists "post-quantum-cryptography" as a topic tag but provides no details on specific algorithms, implementation status, or maturity levels within the text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions support for OpenPGP, TLS, S/MIME, and X.509 standards but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: MIT (based on MIT X Consortium license); Apache Software License, Version 2.0 (for modified BZIP2 library in OpenPGP)
- **Latest Version**: Unknown
- **Release Date**: Not stated (Last Updated: 2026-03-04T01:18:42Z refers to repository update, not a specific software release version date).
- **FIPS Validated**: No (Document states: "this source tree is not the FIPS version of the APIs").
- **Primary Platforms**: Java (JDK 1.1 to JDK 21+), J2ME
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated (Organization is a registered Australian Charity).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/bcgit/bc-java

---

## Bouncy Castle Java LTS

- **Category**: Cryptographic Libraries
- **Product Name**: Bouncy Castle Crypto Package For Java
- **Product Brief**: A Java implementation of cryptographic algorithms developed by the Legion of the Bouncy Castle.
- **PQC Support**: Unknown
- **PQC Capability Description**: Not stated. The document lists "post-quantum-cryptography" as a topic tag but provides no details on specific algorithms, implementation status, or maturity levels within the text.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions support for OpenPGP, TLS, S/MIME, and X.509 standards but does not list specific primitives like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: MIT (based on MIT X Consortium license); Apache Software License, Version 2.0 (for BZIP2 in OpenPGP library)
- **Latest Version**: Unknown
- **Release Date**: Not stated (Last Updated: 2026-03-04T01:18:42Z refers to repository update, not a specific software release version date).
- **FIPS Validated**: No (Document states: "this source tree is not the FIPS version of the APIs").
- **Primary Platforms**: Java (JDK 1.1 to JDK 21+), J2ME
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated (Organization is a registered Australian Charity).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/bcgit/bc-java

---

## OpenSSL

- **Category**: Cryptographic Libraries
- **Product Name**: OpenSSL
- **Product Brief**: A robust, commercial-grade, full-featured Open Source Toolkit for TLS, DTLS, and QUIC protocols.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), PQC algorithms, or any related migration plans. It only describes standard cryptographic libraries and FIPS validation.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Document mentions "cryptography", "decryption", "encryption", "key parameters", "X.509 certificates", "message digests" but does not list specific algorithms like ECDSA, RSA, or Ed25519).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Not stated (Document mentions "Provider architecture" and "cryptographic module" but does not define the underlying key management architecture type).
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 3.6
- **Release Date**: Not stated (Document lists version 3.6 in documentation links but does not provide a specific release date for that version; "Last Updated" refers to the repository metadata).
- **FIPS Validated**: Yes, includes a cryptographic module validated to conform with FIPS standards.
- **Primary Platforms**: UNIX-like platforms, Android, Windows, DOS (with DJGPP), OpenVMS
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://www.openssl.org

---

## Google Tink

- **Category**: Cryptographic Libraries
- **Product Name**: Tink Cryptographic Library
- **Product Brief**: A multilingual, cross-platform open-source cryptographic library providing secure and easy-to-use APIs.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document lists classical primitives (AES-GCM, AES-CTR-HMAC, etc.) but contains no mention of Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES-CTR-HMAC, AES-GCM-HKDF, MAC, PRF, Hybrid Encryption, Digital Signature, JWT
- **Key Management Model**: Not stated (mentions "Choose your KMS" and key creation/rotation features)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Apache 2.0
- **Latest Version**: Unknown
- **Release Date**: 2024-06-27 (Last update of documentation)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Java, GCP Ubuntu, MacOS
- **Target Industries**: Not stated (mentions use in Google products and systems)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Digital Signature (specific algorithms not listed beyond category)
- **Authoritative Source URL**: https://developers.google.com/tink

---

## Botan

- **Category**: Cryptographic Libraries
- **Product Name**: Botan
- **Product Brief**: A cryptography library offering tools for TLSv1.3, X.509 PKI, modern AEAD ciphers, and post-quantum cryptography.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports hybrid post-quantum key exchange in TLS 1.3 using ML-KEM or FrodoKEM. Includes post-quantum signature schemes: ML-DSA (Dilithium), SLH-DSA (SPHINCS+), HSS/LMS, XMSS. Includes post-quantum key encapsulation schemes: ML-KEM (Kyber), FrodoKEM, Classic McEliece.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, DH, ECDH, X25519, X448, ECDSA, Ed25519, Ed448, ECGDSA, ECKCDSA, SM2, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), HSS/LMS, XMSS, ML-KEM (Kyber), FrodoKEM, Classic McEliece, AES, ARIA, Blowfish, Camellia, CAST-128, DES/3DES, IDEA, SEED, Serpent, SHACAL2, SM4, Threefish-512, Twofish, (X)ChaCha20, (X)Salsa20, RC4, SHA-1, SHA-2, SHA-3, RIPEMD-160, BLAKE2b/BLAKE2s, Skein-512, SM3, Whirlpool, Argon2, Scrypt, bcrypt, PBKDF2, HMAC, CMAC, Poly1305, KMAC, GMAC
- **Key Management Model**: Programmatic key management via C++, C, and Python APIs; supports PKCS#8 (implied by X.509/PKI context), PKCS#11 API wrapper, TPM v2.0 device access, Windows/macOS/Unix system certificate stores, SQL database backed certificate store.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-2-Clause (Simplified BSD)
- **Latest Version**: 3.10.0
- **Release Date**: 2025-11-06
- **FIPS Validated**: Not stated
- **Primary Platforms**: Fedora, Debian, Arch, Homebrew; C++, C, Python APIs available.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: TLS 1.3 supports hybrid post-quantum key exchange using ML-KEM or FrodoKEM; includes support for ML-DSA, SLH-DSA, HSS/LMS, XMSS, Classic McEliece.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, ECDSA, Ed25519, Ed448, ECGDSA, ECKCDSA, SM2, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), HSS/LMS, XMSS
- **Authoritative Source URL**: https://github.com/randombit/botan

---

## Go stdlib crypto/mlkem

- **Category**: Cryptographic Libraries
- **Product Name**: Go stdlib crypto/mlkem
- **Product Brief**: A standard library package implementing the quantum-resistant ML-KEM key encapsulation method as specified in NIST FIPS 203.
- **PQC Support**: Yes (ML-KEM-768 and ML-KEM-1024)
- **PQC Capability Description**: Implements ML-KEM (formerly Kyber) per NIST FIPS 203. Supports parameter sets ML-KEM-768 and ML-KEM-1024 via DecapsulationKey and EncapsulationKey types. Provides functions for key generation, encapsulation, and decapsulate operations. Includes a testing package (mlkemtest) for derandomized encapsulation.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM-768, ML-KEM-1024
- **Key Management Model**: Programmatic key generation using secure random sources or 64-byte seeds; keys returned as byte slices in "d || z" form for decapsulation keys.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (Standard Library)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-3-Clause
- **Latest Version**: go1.26.1
- **Release Date**: 2026-03-06
- **FIPS Validated**: No (Implements algorithm specified in NIST FIPS 203, but no validation status stated)
- **Primary Platforms**: Go programming language environments
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Package implements Key Encapsulation, not digital signatures)
- **Authoritative Source URL**: https://cs.opensource.google/go/go

---

## RustCrypto ml-kem

- **Category**: Cryptographic Libraries
- **Product Name**: RustCrypto ml-kem
- **Product Brief**: Pure Rust implementation of the Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM) standard.
- **PQC Support**: Yes (ML-KEM/FIPS 203)
- **PQC Capability Description**: Implements ML-KEM (formerly Kyber), a post-quantum secure key encapsulation mechanism standardized by NIST in FIPS 203. Supports three security levels: MlKem512 (128-bit), MlKem768 (192-bit), and MlKem1024 (256-bit). Implementation is pure Rust, version 0.2.3. Security warning states it has never been independently audited.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM (MlKem512, MlKem768, MlKem1024), SHA3 (dependency)
- **Key Management Model**: Programmatic key generation and encapsulation/decapsulation via API; creates (decapsulation key, encapsulation key) pairs. No specific PKCS#8/PKCS#12 support stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library (Pure Rust)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache License, Version 2.0 OR MIT license
- **Latest Version**: 0.2.3
- **Release Date**: Unknown
- **FIPS Validated**: No (Implements algorithm described in FIPS 203, but implementation is not stated as validated)
- **Primary Platforms**: aarch64-apple-darwin, aarch64-unknown-linux-gnu, i686-pc-windows-msvc, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements ML-KEM as standardized in FIPS 203; no future roadmap details provided.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Product is a Key Encapsulation Mechanism, not a signature scheme)
- **Authoritative Source URL**: https://github.com/RustCrypto/KEMs

---

## RustCrypto ml-dsa

- **Category**: Cryptographic Libraries
- **Product Name**: RustCrypto ml-dsa
- **Product Brief**: Pure Rust implementation of the Module-Lattice-Based Digital Signature Standard (ML-DSA) as described in FIPS 204.
- **PQC Support**: Yes (ML-DSA / CRYSTALS-Dilithium)
- **PQC Capability Description**: Implements ML-DSA (formerly CRYSTALS-Dilithium) per FIPS 204 final. Supports parameter sets MlDsa44 (Category 2), MlDsa65 (Category 3), and MlDsa87 (Category 5). Implementation is pure Rust, supports `no_std`, and includes key generation, signing, and verification. Warning: Never independently audited; use at own risk.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (MlDsa44, MlDsa65, MlDsa87), DSA, ECDSA, Ed25519, Ed448, LMS, SLH-DSA, XMSS, RFC6979
- **Key Management Model**: Programmatic key generation and signing via Rust traits (`KeyGen`, `Signer`, `Verifier`); supports PKCS#8 (via dependency `pkcs8 ^0.10`); keys encoded as byte arrays.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library (Pure Rust, no_std compatible)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.0.4
- **Release Date**: Unknown
- **FIPS Validated**: No (Implementation describes FIPS 204 but is not stated as validated; explicitly warns it has never been independently audited)
- **Primary Platforms**: i686-pc-windows-msvc, i686-unknown-linux-gnu, x86_64-apple-darwin, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu; supports bare-metal and WebAssembly.
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Current implementation follows FIPS 204 final)
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (MlDsa44, MlDsa65, MlDsa87), DSA, ECDSA, Ed25519, Ed448, LMS, SLH-DSA, XMSS
- **Authoritative Source URL**: https://github.com/RustCrypto/signatures (Repository); https://docs.rs/ml-dsa (Documentation)

---

## RustCrypto slh-dsa

- **Category**: Cryptographic Libraries
- **Product Name**: RustCrypto slh-dsa
- **Product Brief**: Pure Rust implementation of the SLH-DSA (SPHINCS+) signature scheme based on FIPS-205.
- **PQC Support**: Yes (SLH-DSA/SPHINCS+ implemented per FIPS-205)
- **PQC Capability Description**: Implements Stateless Hash-based Digital Signature Algorithm (SLH-DSA) based on SPHINCS+, finalized in NIST FIPS-205. Supports 12 parameter sets (SHA2 and SHAKE variants at L1, L3, L5 security). Signatures range from 7KB to 50KB. Implementation is not independently audited; requires Rust 1.75+.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SLH-DSA (SPHINCS+), SHA2, SHAKE256, HMAC, AES, CTR
- **Key Management Model**: Programmatic key generation and serialization via `SigningKey` and `VerifyingKey` structs; supports deterministic signatures; no specific HSM or MPC architecture stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (Pure Rust)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.1.0
- **Release Date**: Unknown
- **FIPS Validated**: No (Implementation based on FIPS-205 standard, but not stated as validated; warning notes lack of independent audit)
- **Primary Platforms**: i686-pc-windows-msvc, i686-unknown-linux-gnu, x86_64-apple-darwin, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu; supports `no_std` for bare-metal/WebAssembly.
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements finalized FIPS-205 standard; no future roadmap details provided beyond MSRV version bump policy.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: SLH-DSA (SPHINCS+) with parameter sets: Sha2_128f, Sha2_128s, Sha2_192f, Sha2_192s, Sha2_256f, Sha2_256s, Shake128f, Shake128s, Shake192f, Shake192s, Shake256f, Shake256s.
- **Authoritative Source URL**: https://github.com/RustCrypto/signatures (Repository), https://docs.rs/slh-dsa (Documentation)

---

## pqcrypto

- **Category**: Cryptographic Libraries
- **Product Name**: pqcrypto
- **Product Brief**: Rust bindings to C implementations of NIST post-quantum cryptographic algorithms based on PQClean.
- **PQC Support**: Yes (bindings to NIST competition algorithms via PQClean)
- **PQC Capability Description**: Provides Rust bindings to C implementations of cryptographic algorithms from the NIST competition, generated from the PQClean project. Supports variants controlled by `implementations.yaml`. Maturity is indicated by repository activity and documentation on docs.rs.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (specific algorithm names like Kyber or Dilithium are not explicitly listed in the text)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2026-02-27
- **FIPS Validated**: No
- **Primary Platforms**: Rust (Language)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/rustpq/pqcrypto

---

## liboqs-rust (oqs crate)

- **Category**: Cryptographic Libraries
- **Product Name**: liboqs-rust (oqs crate)
- **Product Brief**: Rust bindings for the Open Quantum Safe C library providing quantum-resistant cryptographic algorithms.
- **PQC Support**: Yes (Supports KEMs and Signature schemes including NIST standardization candidates)
- **PQC Capability Description**: Provides Rust wrappers for liboqs, a C library for quantum-resistant cryptography. Supports KEMs (BIKE, Classic McEliece, FrodoKEM, HQC, Kyber, ML-KEM, NTRU Prime) and Signatures (Cross, Dilithium, Falcon, Mayo, ML-DSA, SPHINCS+, UOV). Designed for prototyping; recommends hybrid cryptography alongside traditional algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BIKE, Classic McEliece, FrodoKEM, HQC, Kyber, ML-KEM, NTRU Prime, Cross, Dilithium, Falcon, Mayo, ML-DSA, SPHINCS+, UOV, RSA (mentioned as traditional), Elliptic curves (mentioned as traditional)
- **Key Management Model**: Programmatic key generation and signing via Rust API; supports `OQS_RAND` for random number generation; no specific HSM or MPC architecture stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (Rust bindings to C library)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0, MIT (Dual-licensed)
- **Latest Version**: 0.10.1 (for `oqs` crate); 0.9.0+liboqs-0.9.0 (versioning scheme mentioned)
- **Release Date**: 2026-03-01 (Last Updated timestamp in document)
- **FIPS Validated**: No
- **Primary Platforms**: Rust environments; supports `no_std` and system-provided or vendored builds
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Recommends relying on NIST Post-Quantum Cryptography standardization project outcomes; suggests hybrid cryptography deployment prior to final standardization.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Cross, Dilithium, Falcon, Mayo, ML-DSA, SPHINCS+, UOV
- **Authoritative Source URL**: https://github.com/open-quantum-safe/liboqs-rust

---

## mlkem-native

- **Category**: Cryptographic Libraries
- **Product Name**: mlkem-native
- **Product Brief**: Secure, fast, and portable C90 implementation of ML-KEM / FIPS 203.
- **PQC Support**: Yes (ML-KEM / FIPS 203)
- **PQC Capability Description**: Implementation of ML-KEM (FIPS 203) with support for security levels 512, 768, and 1024. Includes formal verification (CBMC, HOL-Light) for memory safety, type safety, and constant-time execution on AArch64 and x86_64. Supports native backends for Arm, Intel/AMD, and RISC-V. Used as a default implementation in libOQS, AWS-LC, and rustls.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (FIPS 203), FIPS-202 (SHA-3)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library (C90 with Assembly backends)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0, ISC, MIT (Multiple licenses listed in badges; NOASSERTION in metadata)
- **Latest Version**: Not stated (Repository last updated 2026-03-04; no specific version tag for mlkem-native itself mentioned)
- **Release Date**: 2026-03-04
- **FIPS Validated**: No (Implements FIPS 203 standard, but validation status not stated)
- **Primary Platforms**: Arm (64-bit Neon, 32-bit Helium/MVE), Intel/AMD (64-bit AVX2), RISC-V (64-bit RVV); Ubuntu mentioned for quickstart.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports all ML-KEM security levels (512, 768, 1024) via compile-time configuration; experimental support for Armv8.1-M backend.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Product implements Key Encapsulation Mechanisms only)
- **Authoritative Source URL**: https://github.com/pq-code-package/mlkem-native

---

## Cosmian covercrypt

- **Category**: Cryptographic Libraries
- **Product Name**: Cosmian/cover_crypt
- **Product Brief**: Implementation of the CoverCrypt attribute-based encryption algorithm in Rust.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Post-quantum secure with a 128-bit security level. Supports hybridization using INDCPA-KYBER (INDCPA version of NIST standard Kyber). Data encrypted with AES-GCM 256-bit. Uses Curve25519 for classic coordinates and INDCPA-Kyber for hybridized coordinates.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Curve25519, Ristretto, INDCPA-KYBER, AES-GCM
- **Key Management Model**: Central authority manages master keys and user secret keys based on attribute policies; supports key generation, update, and refresh via API.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Attribute-based encryption with hybrid symmetric/asymmetric encapsulation
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown
- **Release Date**: 2026-02-13
- **FIPS Validated**: No
- **Primary Platforms**: Rust (Cargo)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements hybridization using INDCPA-KYBER; formal proof of security provided in CoverCrypt paper.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document describes encryption and key encapsulation, not digital signatures)
- **Authoritative Source URL**: https://github.com/Cosmian/cover_crypt

---

## pqm4

- **Category**: Cryptographic Libraries
- **Product Name**: pqm4
- **Product Brief**: Post-quantum crypto library and benchmarking framework for ARM Cortex-M4 microcontrollers.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Library contains implementations of post-quantum key-encapsulation mechanisms and signature schemes targeting ARM Cortex-M4. Includes schemes standardized by NIST (FIPS 203, 204, 205), selected for standardization, part of NIST Round 4, additional signatures Round 1, and KpqC Round 2. Integrates clean implementations from PQClean.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Post-quantum key-encapsulation mechanisms, post-quantum signature schemes, SHA-2, SHA-3, AES (symmetric primitives). Specific algorithm names not listed in text.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library for embedded microcontrollers
- **Infrastructure Layer**: Application, Hardware
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2026-03-04
- **FIPS Validated**: No (Text mentions schemes standardized by NIST in FIPS 203, 204, 205, but does not state the library itself is FIPS validated)
- **Primary Platforms**: ARM Cortex-M4 microcontrollers; Development boards: Nucleo-L4R5ZI, STM32F4 Discovery, Nucleo-L476RG, CW308T-STM32F3, MPS2(+) FPGA prototyping board.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Includes schemes from NIST Round 4 and additional signatures Round 1; integrates PQClean implementations.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Post-quantum signature schemes (specific names not listed in text).
- **Authoritative Source URL**: https://github.com/mupq/pqm4

---

## HQC Algorithm

- **Category**: Cryptographic Libraries
- **Product Name**: PQClean
- **Product Brief**: Clean, portable, tested implementations of post-quantum cryptography schemes in C.
- **PQC Support**: Yes (Kyber, HQC, Classic McEliece, Dilithium, Falcon, SPHINCS+)
- **PQC Capability Description**: Provides standalone C implementations of NIST PQC finalists and alternate candidates including Kyber, HQC, Classic McEliece, Dilithium, Falcon, and SPHINCS+. Designed for integration into libraries like liboqs or protocols. Not a single integrated library; requires manual integration. Deprecation planned for July 2026.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Kyber, HQC, Classic McEliece, Dilithium, Falcon, SPHINCS+, SHA-2, SHA-3 (FIPS202), AES, cSHAKE
- **Key Management Model**: Not stated (Source code library; no key management architecture described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library (C implementations)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Mixed (CC0 for repository code, individual licenses per implementation in subdirectories, MIT/Public Domain for common files)
- **Latest Version**: Unknown
- **Release Date**: 2026-03-04
- **FIPS Validated**: No
- **Primary Platforms**: Linux, MacOS, Windows
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Planned archiving as read-only in July 2026; users directed to PQ Code Package for maintained implementations.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Dilithium, Falcon, SPHINCS+
- **Authoritative Source URL**: https://github.com/PQClean/PQClean

---

## Microsoft SymCrypt

- **Category**: Cryptographic Libraries
- **Product Name**: SymCrypt
- **Product Brief**: Core cryptographic function library currently used by Windows, supporting symmetric and asymmetric algorithms.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It focuses on symmetric operations and the addition of standard asymmetric algorithms starting in 2015.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Symmetric cryptographic operations; Asymmetric algorithms (specific names not listed); RSA32 (benchmark only); msbignum (benchmark only).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 101.0.0 (mentioned as the version where Semantic Versioning was adopted)
- **Release Date**: 2026-03-05 (Last Updated date in metadata)
- **FIPS Validated**: Support FIPS 140 certification of products using SymCrypt; uses Jitterentropy for FIPS-certifiable entropy.
- **Primary Platforms**: Windows (all CPU architectures supported by Windows); Linux modules mentioned.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://github.com/microsoft/SymCrypt

---

## AWS-LC

- **Category**: Cryptographic Libraries
- **Product Name**: AWS-LC
- **Product Brief**: A general-purpose cryptographic library maintained by the AWS Cryptography team based on BoringSSL and OpenSSL.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Details on supported post-quantum algorithms are available in a separate document at [PQREADME](https://github.com/aws/aws-lc/tree/main/crypto/fipsmodule/PQREADME.md). The text does not explicitly list specific PQC algorithms or maturity levels within the provided content.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: SHA-2 (384, 512), HMAC, AES-KW(P) (256), AES-GCM (256), RSA, P-256, P-384, P-521, X25519, Ed25519
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library (C/C++ with Assembly optimizations)
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06
- **FIPS Validated**: Yes (with limitations); FIPS mode is supported but WASM builds cannot be FIPS-validated. See [crypto/fipsmodule/FIPS.md](crypto/fipsmodule/FIPS.md) for details.
- **Primary Platforms**: Linux (x86, x86-64, aarch64, ppc, ppc64, ppc64le, arm32, loongarch64, risc-v64, s390x), Windows (x86-64, aarch64), macOS (x86-64, aarch64), Android (aarch64, arm32), iOS (aarch64), OpenBSD (x86-64), FreeBSD (x86-64), Emscripten (wasm32)
- **Target Industries**: AWS and their customers; general-purpose applications
- **Regulatory Status**: FIPS compliance mentioned; no specific regulatory charters or licenses stated.
- **PQC Roadmap Details**: Not stated (refers to external PQREADME for details)
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, Ed25519 (implied via X25519/Ed25519 support in formal verification tables); specific signature schemes not explicitly listed as a feature set.
- **Authoritative Source URL**: https://github.com/aws/aws-lc

---

## Nvidia cuPQC

- **Category**: Cryptographic Libraries
- **Product Name**: Nvidia cuPQC
- **Product Brief**: SDK of GPU-optimized cryptographic math libraries for building classical and next-generation high-performance applications.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Production-ready library (cuPQC-PK) providing GPU-accelerated implementations of NIST-standardized ML-KEM-512/768/1024 and ML-DSA-44/65/87. Designed for embedding into CUDA kernels with high throughput for key generation, encapsulation, decapsulation, signing, and verification.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: SHA-2, SHA-3, SHAKE, Poseidon 2, ML-KEM (512/768/1024), ML-DSA (44/65/87)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: GPU-accelerated software library (CUDA kernels)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: NVIDIA GPU architectures (NVIDIA Jetson, data center GPUs including RTX PRO 6000 Blackwell Server Edition, H100)
- **Target Industries**: Enterprises with high-throughput security applications
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports NIST-standardized ML-KEM and ML-DSA; supports emerging technologies including zero-knowledge proofs.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: Not stated

---

## Cloudflare CIRCL

- **Category**: Cryptographic Libraries
- **Product Name**: CIRCL (Cloudflare Interoperable Reusable Cryptographic Library)
- **Product Brief**: A collection of cryptographic primitives written in Go for experimental deployment of Post-Quantum and Elliptic Curve Cryptography.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports KEMs: ML-KEM (modes 512, 768, 1024), X-Wing, Kyber (modes 512, 768, 1024), FrodoKEM (mode 640-SHAKE), CSIDH. Supports Signatures: Dilithium (modes 2, 3, 5), ML-DSA (modes 44, 65, 87), SLH-DSA (twelve parameter sets). SIDH/SIKE is marked insecure and deprecated. Status is experimental; not recommended for production without caution.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: X25519, X448, Curve4Q, Ed25519, Ed448, BLS, P-256, P-384, P-521, Ristretto, BLS12-381, HPKE, VOPRF, RSA Blind Signatures, CPABE, OT, Threshold RSA, Prio3, ML-KEM, X-Wing, Kyber, FrodoKEM, CSIDH, Dilithium, ML-DSA, SLH-DSA, Schnorr, DLEQ, SHAKE128, SHAKE256, BLAKE2X, KangarooTwelve, Ascon v1.2
- **Key Management Model**: Not stated (Library provides primitives; specific key management architecture not described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-3-Clause License (Note: Metadata section lists "NOASSERTION", but text explicitly states "BSD-3-Clause License")
- **Latest Version**: v1.6.3
- **Release Date**: 2026-01-01 (Accessed Jan, 2026; Last Updated 2026-03-06)
- **FIPS Validated**: No (References FIPS standards for algorithm definitions but does not claim validation status)
- **Primary Platforms**: Go (Golang)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Describes current experimental support for PQ algorithms; no future timeline provided)
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Ed25519, Ed448, BLS, Dilithium, ML-DSA, SLH-DSA, RSA Blind Signatures, Threshold RSA, Schnorr
- **Authoritative Source URL**: https://github.com/cloudflare/circl

---

## NSS (Mozilla)

- **Category**: Cryptographic Libraries
- **Product Name**: Network Security Services (NSS)
- **Product Brief**: A set of libraries designed to support cross-platform development of security-enabled client and server applications.
- **PQC Support**: No
- **PQC Capability Description**: The provided text does not mention any Post-Quantum Cryptography (PQC) algorithms, schemes, or migration plans. It only lists classical standards such as SSL v3, TLS, PKCS #5, PKCS #7, PKCS #11, PKCS #12, S/MIME, and X.509 v3.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: RSA (implied by RSA_EMSAEncodePSS), SSL v3, TLS, PKCS #5, PKCS #7, PKCS #11, PKCS #12, S/MIME, X.509 v3
- **Key Management Model**: Supports PKCS #11 and PKCS #12 standards; mentions "Temp private key lifecycle" in bug reports. Specific architecture (e.g., HSM-backed) is not explicitly defined beyond standard library support.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Mozilla Public License v2 (MPLv2)
- **Latest Version**: NSS_3_121_RTM
- **Release Date**: 2026-02-19
- **FIPS Validated**: Not stated
- **Primary Platforms**: Cross-platform (OpenBSD, Solaris, macOS, Windows mentioned in context of builds and bugs)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA (implied by RSA_EMSAEncodePSS), S/MIME, X.509 v3; specific signature algorithms like ECDSA or Ed25519 are not explicitly listed in the text.
- **Authoritative Source URL**: firefox-source-docs.mozilla.org (inferred from context of "firefox-source-docs.mozilla.org" mentioned in documentation section)

---

## .NET System.Security.Cryptography

- **Category**: Cryptographic Libraries
- **Product Name**: .NET System.Security.Cryptography
- **Product Brief**: Cryptographic library in .NET 10 adding support for Post-Quantum Cryptography algorithms.
- **PQC Support**: Yes (ML-KEM, ML-DSA, SLH-DSA, Composite ML-DSA)
- **PQC Capability Description**: .NET 10 adds support for four PQC algorithms: ML-KEM (Key Encapsulation, NIST FIPS 203), ML-DSA (Signature, NIST FIPS 204), SLH-DSA (Signature, NIST FIPS 205), and Composite ML-DSA (Signature, IETF Draft). New classes (MLKem, MLDsa, SlhDsa, CompositeMLDsa) replace the legacy AsymmetricAlgorithm pattern. Supports key generation, import/export in PKCS#8, SubjectPublicKeyInfo, and PEM formats.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, DSA, EC-DSA, EC-Diffie-Hellman, ML-KEM, ML-DSA, SLH-DSA, Composite ML-DSA, AES, SHA-2, SHA-3
- **Key Management Model**: Programmatic key management via new algorithm-specific classes (e.g., MLDsa); supports import/export of keys in PKCS#8, SubjectPublicKeyInfo, and PEM formats; supports encrypted private keys.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library
- **Infrastructure Layer**: Application
- **License Type**: Proprietary (Microsoft)
- **License**: Not stated
- **Latest Version**: .NET 10
- **Release Date**: 2025-11-18
- **FIPS Validated**: No (References NIST FIPS 203, 204, 205 standards for algorithms, but does not state the library itself is FIPS validated)
- **Primary Platforms**: Windows, macOS, Linux (implied by "works no matter what OS you're on" and .NET context)
- **Target Industries**: Enterprise, Developer
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implemented in .NET 10; focuses on ML-KEM, ML-DSA, SLH-DSA, and Composite ML-DSA based on NIST FIPS 203/204/205 and IETF Drafts.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, EC-DSA, DSA, ML-DSA, SLH-DSA, Composite ML-DSA
- **Authoritative Source URL**: https://devblogs.microsoft.com/dotnet/post-quantum-cryptography-in-net/ (Inferred from context "Microsoft Dev Blogs" and title)

---

## PyCryptodome

- **Category**: Cryptographic Libraries
- **Product Name**: PyCryptodome
- **Product Brief**: A self-contained Python package of low-level cryptographic primitives.
- **PQC Support**: No
- **PQC Capability Description**: The document lists support for classical algorithms including ECDSA, EdDSA, RSA, and various hash functions (SHA-3, BLAKE2). It explicitly mentions Hybrid Public Key Encryption (HPKE) but does not state that HPKE is implemented with Post-Quantum Cryptography (PQC) algorithms. No PQC-specific algorithms (e.g., CRYSTALS-Kyber, Dilithium) are mentioned.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AES, GCM, CCM, EAX, SIV, OCB, KW, KWP, HPKE, NIST P-curves, Ed25519, Ed448, Curve25519, Curve448, SHA-3 (SHAKE128, SHAKE256, cSHAKE128, cSHAKE256, KMAC128, KMAC256, TupleHash128, TupleHash256), KangarooTwelve, TurboSHAKE128, TurboSHAKE256, SHA-512/224, SHA-512/256, BLAKE2b, BLAKE2s, Salsa20, ChaCha20, XChaCha20, Poly1305, ChaCha20-Poly1305, XChaCha20-Poly1305, scrypt, bcrypt, HKDF, NIST SP 800 108r1 Counter Mode, (EC)DSA, EdDSA, RSA, DSA, Shamir's Secret Sharing.
- **Key Management Model**: Password-protected PKCS#8 key containers; random numbers sourced directly from the OS.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (pure Python with C extensions for performance-critical pieces).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Not stated
- **Release Date**: 2026-03-05
- **FIPS Validated**: No (References FIPS standards for algorithm definitions but does not claim validation status).
- **Primary Platforms**: Python 2.7, Python 3.7 and newer, PyPy; Windows, Unix (with GMP support).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Deterministic (EC)DSA, EdDSA.
- **Authoritative Source URL**: https://github.com/Legrandin/pycryptodome

---

## Crypto++ (cryptopp)

- **Category**: Cryptographic Libraries
- **Product Name**: Crypto++
- **Product Brief**: Free C++ class library of cryptographic schemes.
- **PQC Support**: No
- **PQC Capability Description**: The document lists classical algorithms (AES, RSA, ECDSA, Ed25519, etc.) but contains no mention of Post-Quantum Cryptography (PQC) algorithms such as Kyber, Dilithium, or SPHINCS+. No PQC implementation status or maturity level is stated.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: GCM, CCM, EAX, ChaCha20Poly1305, XChaCha20Poly1305, ChaCha, Panama, Salsa20, Sosemanuk, XSalsa20, XChaCha20, AES (Rijndael), RC6, MARS, Twofish, Serpent, CAST-256, ARIA, Blowfish, Camellia, CHAM, HIGHT, IDEA, Kalyna, LEA, SEED, RC5, SHACAL-2, SIMON, Skipjack, SPECK, Simeck, SM4, Threefish, Triple-DES, TEA, XTEA, BLAKE2s, BLAKE2b, CMAC, CBC-MAC, DMAC, GMAC, HMAC, Poly1305, SipHash, Two-Track-MAC, VMAC, Keccack (F1600), LSH, SHA-1, SHA-2, SHA-3, SHAKE, SM3, Tiger, RIPEMD, WHIRLPOOL, RSA, DSA, Deterministic DSA, ElGamal, Nyberg-Rueppel, Rabin-Williams, LUC, LUCELG, ECGDSA, DLIES, ESIGN, Diffie-Hellman, Unified Diffie-Hellman, MQV, HMQV, FHMQV, LUCDIF, XTR-DH, ECDSA, Deterministic ECDSA, ed25519, ECNR, ECIES, ECDH, ECMQV, x25519.
- **Key Management Model**: Programmatic key management via C++ class library; supports PKCS#1 v2.0, OAEP, PSS, PSSR, IEEE P1363 EMSA2 and EMSA5 padding schemes; supports PBKDF1, PBKDF2 (PKCS #5), PBKDF (PKCS #12), HKDF, Scrypt for key derivation; supports Shamir's secret sharing scheme.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (C++ class library)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION (Note: Text states "free C++ class library" and refers to "License.txt for the fine print", but explicitly lists "NOASSERTION" in metadata).
- **Latest Version**: 8.9
- **Release Date**: 2023-10-01
- **FIPS Validated**: No (Text states: "The library and the DLL are no longer considered validated. You should no longer use the DLL." and references the CMVP Historical Validation List).
- **Primary Platforms**: Windows, Unix, Mac OS; Compilers: Visual Studio 2003-2022, GCC 3.3-13.1, Apple Clang 4.3-12.0, LLVM Clang 2.9-14.0, C++ Builder 2015, Intel C++ Compiler 9-16.0, Sun Studio 12u1-12.7, IBM XL C/C++ 10.0-14.0; Architectures: x86, x64, x32, ARM-32, Aarch32, Aarch64, Power8.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated (FIPS validation is historical/no longer valid).
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, DSA, Deterministic DSA, ElGamal, Nyberg-Rueppel, Rabin-Williams, LUC, LUCELG, ECDSA, Deterministic ECDSA, ed25519, ECNR, ESIGN.
- **Authoritative Source URL**: https://github.com/weidai11/cryptopp

---
