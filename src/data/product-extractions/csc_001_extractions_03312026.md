---
generated: 2026-03-31
collection: csc_001
documents_processed: 41
enrichment_method: ollama-qwen3.5:27b
---

## DigiCert TrustCore SDK

- **Category**: Cryptographic Libraries
- **Product Name**: DigiCert TrustCore SDK
- **Product Brief**: Developer tools and cryptographic agility solutions to support post-quantum cryptography migration.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document states industry leaders are using PQC in production and DigiCert supports the journey with developer tools, but does not explicitly state that TrustCore SDK currently implements specific PQC algorithms. It mentions NIST standards ML-KEM, ML-DSA, and SLH-DSA as the target for migration.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECC (mentioned as current vulnerable algorithms to be replaced); ML-KEM, ML-DSA, SLH-DSA (mentioned as NIST standards for future adoption).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise, Government, Finance, Healthcare, Critical Infrastructure
- **Regulatory Status**: Not stated (Document mentions regulatory requirements like CNSA 2.0, CRA, DORA that the product helps address, but does not list specific licenses or charters for the product itself).
- **PQC Roadmap Details**: Mentions NIST finalized standards in 2024 (ML-KEM, ML-DSA, SLH-DSA); CNSA 2.0 mandates adoption by 2030; Gartner predicts current algorithms ineffective by 2029; migration window estimated at 3-4 years once CRQC arrives.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Current: RSA, ECC (implied as legacy); Planned/Target: ML-DSA, SLH-DSA.
- **Authoritative Source URL**: Not stated

---
## CryptoNext Quantum-Safe Library

- **Category**: Cryptographic Libraries
- **Product Name**: CryptoNext Quantum-Safe Library
- **Product Brief**: A NIST-validated post-quantum cryptographic library developed in C, C++, and Assembly with wrappers for Go, Rust, Python, and Java.
- **PQC Support**: Yes (NIST-validated ML-KEM, ML-DSA, SLH-DSA; supports FrodoKEM, Falcon, XMSS)
- **PQC Capability Description**: First EU library NIST-validated for ML-KEM, ML-DSA, and SLH-DSA. Supports key exchange (ML-KEM, FrodoKEM) and signatures (ML-DSA, SLH-DSA, Falcon, XMSS). Features crypto-agile API, side-channel attack resistance, and versions for Standard, Embedded, and Side-Channel Attack Resistant environments.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, Falcon, XMSS
- **Key Management Model**: Not stated (Random number generator provided as a parameter; no specific key management architecture described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library (C, C++, Assembly with language wrappers)
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (Validated by NIST CAVP for ML-DSA, SLH-DSA, and ML-KEM; references FIPS 203, FIPS 204, FIPS 205)
- **Primary Platforms**: General-purpose or embedded platforms; supports C, C++, Assembly, Go, Rust, Python, Java
- **Target Industries**: Banking, Finance, Defense, Energy, Aerospace, Public Sector
- **Regulatory Status**: NIST CAVP validated for ML-DSA, SLH-DSA, and ML-KEM
- **PQC Roadmap Details**: Supports integration of new standardized algorithms upon official release; references 2035 deadline for traditional cryptography in public sector.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA, SLH-DSA, Falcon, XMSS
- **Authoritative Source URL**: Unknown

---
## 01 Quantum IronCAP

- **Category**: Cryptographic Libraries
- **Product Name**: IronCAP ™ Toolkits
- **Product Brief**: Post-quantum cryptography toolkits enabling vendors to secure vertical applications against classical and quantum attacks.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Combines NIST-approved PQC algorithms with patent-protected quantum-safe technology. Supports email/file encryption, digital signatures, blockchain security, remote access/VPN, password management, credit card security, cloud storage, and website security. Designed for seamless integration via OpenSSL, PKCS#11, and OpenPGP standards.
- **PQC Migration Priority**: High
- **Crypto Primitives**: NIST-approved PQC algorithms (specific names not stated), patent-protected quantum-safe technology (specific names not stated)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable (supports blockchain vendors generally, specific networks not listed)
- **Architecture Type**: Software toolkit compliant with OpenSSL, PKCS#11, and OpenPGP standards
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No
- **Primary Platforms**: Not stated (supports vertical applications, IoT devices, cloud storage)
- **Target Industries**: Blockchain, IoT, Data Storage, Remote Access, Email Security, Financial Transactions, Cloud Storage, Website Security
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Uses NIST-approved PQC algorithms combined with proprietary technology; no specific timeline or algorithm names provided.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Digital signing using NIST-approved PQC algorithms and patent-protected quantum-safe technology (specific schemes not stated)
- **Authoritative Source URL**: Unknown

---

## Bouncy Castle C# .NET

- **Category**: Cryptographic Libraries
- **Product Name**: Bouncy Castle C# .NET
- **Product Brief**: A .NET implementation of cryptographic algorithms and protocols including NIST PQC standards.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST PQC Standardization algorithms: ML-DSA, ML-KEM, SLH-DSA, Falcon, Classic McEliece, FrodoKEM, NTRU, NTRU Prime, Picnic, Saber, and BIKE. Also supports Ascon (lightweight) and Argon2. All PQC implementations are marked as EXPERIMENTAL and subject to change or removal.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, SLH-DSA, Falcon, Classic McEliece, FrodoKEM, NTRU, NTRU Prime, Picnic, Saber, BIKE, Ascon, Argon2, CMS, OpenPGP, (D)TLS, TSP, X.509
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: MIT (based on MIT X Consortium license); Apache Software License 2.0 for Bzip2 component; Commercial support contracts available via Keyfactor.
- **Latest Version**: 2.5.0
- **Release Date**: 2024-12-04
- **FIPS Validated**: No (Source tree is not the FIPS version; separate FIPS version exists at bouncycastle.org/fips-csharp)
- **Primary Platforms**: .NET, .NET Core, C#
- **Target Industries**: Not stated
- **Regulatory Status**: Developed by Legion of the Bouncy Castle, a registered Australian Charity.
- **PQC Roadmap Details**: Includes support for newly standardized NIST PQC algorithms (ML-KEM, ML-DSA, SLH-DSA) and experimental implementations of other candidates; marked as subject to change or removal.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, SLH-DSA, Falcon, Classic McEliece, NTRU, NTRU Prime, Picnic, BIKE (Experimental); Ascon (Encryption/Authentication)
- **Authoritative Source URL**: https://github.com/bcgit/bc-csharp

---

## Bouncy Castle Java

- **Category**: Cryptographic Libraries
- **Product Name**: Bouncy Castle Java Distribution
- **Product Brief**: A Java implementation of cryptographic algorithms developed by the Legion of the Bouncy Castle.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The repository topics explicitly include "post-quantum-cryptography". Documentation references interoperability with NIST PQC standards including ML-DSA (Dilithium), ML-KEM (Kyber), and SLH-DSA (SPHINCS+). It supports certificate validation for these algorithms and TLS hybrid key exchange.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECDSA, OpenPGP, S/MIME, CMS, OCSP, ML-DSA, ML-KEM, SLH-DSA, X25519MLKEM768
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library (JCA/JCE Provider)
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: MIT X Consortium license; Apache Software License 2.0 (for BZIP2 component); Commercial support available via Keyfactor.
- **Latest Version**: Not stated
- **Release Date**: 2026-03-04
- **FIPS Validated**: No (Source tree is explicitly not the FIPS version; contact required for FIPS APIs)
- **Primary Platforms**: Java (JDK 1.1 to JDK 21+), J2ME, Multi-release jars
- **Target Industries**: Not stated
- **Regulatory Status**: Developed by a registered Australian Charity (Legion of the Bouncy Castle)
- **PQC Roadmap Details**: Supports NIST-selected PQC finalists (CRYSTALS-Kyber/ML-KEM, CRYSTALS-Dilithium/ML-DSA, SPHINCS+/SLH-DSA). Mentions adoption calls for TLS ML-KEM key exchange and CMS messages.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (Dilithium), SLH-DSA (SPHINCS+), FALCON (mentioned in survey context), RSA, ECDSA, OpenPGP
- **Authoritative Source URL**: https://github.com/bcgit/bc-java

---

## Bouncy Castle Java LTS

- **Category**: Cryptographic Libraries
- **Product Name**: Bouncy Castle Java Distribution
- **Product Brief**: A Java implementation of cryptographic algorithms developed by the Legion of the Bouncy Castle.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The repository topics include "post-quantum-cryptography". Documentation provides examples for generating ML-DSA signatures using `MLDSAParameterSpec`. It references NIST PQC finalists including LMS, XMSS, ML-KEM, ML-DSA, SLH-DSA, FN-DSA, and HQC.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA, OpenPGP, S/MIME, TLS, DTLS, X.509, CMS, TSP, PKCS#12, OCSP, CRMF, CMP, RSA (mentioned in context of comparison), EC (mentioned in context of comparison)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library / JCA/JCE Provider
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: MIT (based on MIT X Consortium license); Apache Software License 2.0 (for BZIP2 in OpenPGP library)
- **Latest Version**: Not stated
- **Release Date**: 2026-03-04
- **FIPS Validated**: No (Source tree is explicitly not the FIPS version; users must contact directly for FIPS version)
- **Primary Platforms**: Java (JDK 8, 11, 17, 21), J2ME
- **Target Industries**: Not stated
- **Regulatory Status**: Developed by a registered Australian Charity (Legion of the Bouncy Castle)
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, LMS, XMSS, SLH-DSA, FN-DSA (referenced in documentation context)
- **Authoritative Source URL**: https://github.com/bcgit/bc-java

---

## OpenSSL

- **Category**: Cryptographic Libraries
- **Product Name**: OpenSSL
- **Product Brief**: A robust, commercial-grade, full-featured Open Source Toolkit for TLS, DTLS, QUIC protocols and general-purpose cryptography.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: OpenSSL 3.5 adds support for PQC algorithms ML-KEM, ML-DSA, and SLH-DSA. The document references FIPS standards 203 (ML-KEM), 204 (ML-DSA), and 205 (SLH-DSA). It supports hybrid certificates and TLS key exchange using ML-KEM.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDSA, Ed25519, RSA, AES, SHA, OCB, PBMAC1, CMS, PKCS#12, PKCS7, ML-KEM, ML-DSA, SLH-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library / Toolkit
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Apache-2.0
- **Latest Version**: 3.6.1
- **Release Date**: 2026-01-27
- **FIPS Validated**: Yes (Includes a cryptographic module validated to conform with FIPS standards; supports enable-fips-jitter option)
- **Primary Platforms**: UNIX-like, Android, Windows, DOS (DJGPP), OpenVMS
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: OpenSSL 3.5 (released April 8, 2025) includes ML-KEM, ML-DSA, and SLH-DSA. OpenSSL 3.6 is planned for October 2025. Supports hybrid certificates and TLS key exchange adoption calls.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA, Ed25519, RSA, ML-DSA, SLH-DSA
- **Authoritative Source URL**: https://www.openssl.org

---

## Google Tink

- **Category**: Cryptographic Libraries
- **Product Name**: Tink Cryptographic Library
- **Product Brief**: A multilingual, cross-platform open-source cryptographic library providing secure and easy-to-use APIs.
- **PQC Support**: No
- **PQC Capability Description**: Not stated. The document lists classical primitives (AES-GCM, AES-CTR-HMAC, etc.) but contains no mention of Post-Quantum Cryptography algorithms or migration plans.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: AEAD, Stream AEAD, Deterministic AEAD, MAC, PRF, Hybrid Encryption, Digital Signature, JWT, AES-CTR-HMAC, AES-GCM-HKDF
- **Key Management Model**: Not stated (mentions "Choose your KMS" and key creation/rotation features)
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: Apache 2.0
- **Latest Version**: Unknown
- **Release Date**: 2024-06-27 (Last updated date for documentation)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Java, GCP Ubuntu, MacOS
- **Target Industries**: Not stated (mentions deployment in hundreds of Google products and systems)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Digital Signature (specific algorithms not listed beyond category)
- **Authoritative Source URL**: https://developers.google.com/tink

---

## Botan

- **Category**: Cryptographic Libraries
- **Product Name**: Botan
- **Product Brief**: A cryptography library offering tools for TLSv1.3, X.509 PKI, and post-quantum cryptography under a BSD license.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports production-ready PQC schemes including ML-KEM (Kyber), FrodoKEM, Classic McEliece for key encapsulation; ML-DSA (Dilithium), SLH-DSA (SPHINCS+), HSS/LMS, XMSS for signatures. TLS 1.3 supports hybrid post-quantum key exchange using ML-KEM or FrodoKEM.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, DH, ECDH, X25519, X448, ECDSA, Ed25519, Ed448, ECGDSA, ECKCDSA, SM2, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), HSS/LMS, XMSS, ML-KEM (Kyber), FrodoKEM, Classic McEliece, AES, ARIA, Blowfish, Camellia, CAST-128, DES/3DES, IDEA, SEED, Serpent, SHACAL2, SM4, Threefish-512, Twofish, (X)ChaCha20, (X)Salsa20, RC4, SHA-1, SHA-2, SHA-3, RIPEMD-160, BLAKE2b/BLAKE2s, Skein-512, SM3, Whirlpool, Argon2, Scrypt, bcrypt, PBKDF2, HMAC, CMAC, Poly1305, KMAC, GMAC.
- **Key Management Model**: Programmatic key management via C++, C, and Python APIs; supports PKCS#8/PKCS#12 (implied by X.509/PKI support), PKCS #11 API wrapper, TPM v2.0 device access, Windows/macOS/Unix system certificate stores, SQL database backed certificate store.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-2-Clause (Simplified BSD)
- **Latest Version**: 3.10.0
- **Release Date**: 2025-11-06
- **FIPS Validated**: No
- **Primary Platforms**: Fedora, Debian, Arch, Homebrew; C++, C, Python APIs available.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports NIST-selected PQC finalists (ML-KEM/Kyber, ML-DSA/Dilithium, SLH-DSA/SPHINCS+) and additional schemes (FrodoKEM, Classic McEliece, HSS/LMS, XMSS); TLS 1.3 hybrid mode implemented.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, ECDSA, Ed25519, Ed448, ECGDSA, ECKCDSA, SM2, ML-DSA (Dilithium), SLH-DSA (SPHINCS+), HSS/LMS, XMSS.
- **Authoritative Source URL**: https://github.com/randombit/botan

---

## SafeLogic CryptoComply

- **Category**: Cryptographic Libraries
- **Product Name**: CryptoComply PQ TLS
- **Product Brief**: Drop-in, commercial-grade, quantum-resistant TLS solution leveraging CAVP-certified ML-KEM.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides a drop-in replacement for OpenSSL 3.x based TLS 1.3. Features Pure PQ mode using NIST standard ML-KEM (FIPS 203), Hybrid mode combining classical and PQC, and Legacy mode. Implementation is CAVP-certified and claims to be 20% faster than PKI.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, P256, P384, P521, X25519, RSA (mentioned as vulnerable context), Elliptic Curve Cryptography
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software-based TLS implementation
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (FIPS 140-3 validated algorithms; CAVP-certified ML-KEM implementation)
- **Primary Platforms**: Go, Java, Mobile, .NET (Core); Multiple platforms mentioned generally.
- **Target Industries**: Communications, Cybersecurity, Financial Services, Healthcare, Public Sector, Technology, Government, Military
- **Regulatory Status**: FIPS 140-3, CAVP certified, CNSA 2.0, CMMC 2.0, Common Criteria, FedRAMP, GovRAMP
- **PQC Roadmap Details**: Supports NIST standard ML-KEM (FIPS 203); offers Pure PQ, Hybrid, and Legacy modes for migration.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document focuses on Key Encapsulation Mechanisms like ML-KEM and ECDH curves P256/P384/P521/X25519 for TLS handshakes; specific signature algorithms are not listed).
- **Authoritative Source URL**: www.safelogic.com

---

## SAP Cryptographic Library

- **Category**: Cryptographic Libraries
- **Product Name**: SAP Cryptographic Library
- **Product Brief**: Enables applications like SAP S/4 HANA to support security protocols such as TLS, SNC, SSF, and X.509 with quantum-safe cryptography.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Version 8.6 enables a quantum-safe TLS 1.3 handshake using a hybrid ECDHE-MLKEM key agreement based on X25519MLKEM768. ML-KEM is a quantum-safe key encapsulation algorithm standardized as FIPS-203, preventing session key determination by quantum computers.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDHE, X25519, MLKEM (ML-KEM), Elliptic Curve Cryptography
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (ECDHE-MLKEM)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: 8.6 (specifically CommonCryptoLib 8.6.2 mentioned in release notes)
- **Release Date**: 2025-12-12
- **FIPS Validated**: Yes, FIPS 140-3 certified (Certificate #5093) for the FIPS crypto kernel module.
- **Primary Platforms**: SAP NetWeaver Application Server for ABAP, SAP HANA, SAP S/4 HANA
- **Target Industries**: US public sector agencies, healthcare, financial industries, Enterprise
- **Regulatory Status**: FIPS 140-3 certified (Certificate #5093)
- **PQC Roadmap Details**: Version 8.6 implements hybrid ECDHE-MLKEM (X25519MLKEM768) for TLS 1.3 handshakes; ML-KEM standardized as FIPS-203.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions key agreement algorithms ECDHE and MLKEM, but does not explicitly list signature schemes like ECDSA or Ed25519)
- **Authoritative Source URL**: Not stated

---

## PQShield PQSDK

- **Category**: Cryptographic Libraries
- **Product Name**: PQShield PQSDK
- **Product Brief**: Software development kit integrating post-quantum and classical cryptographic primitives with OpenSSL and mbedTLS.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Provides implementations of PQC key agreement and digital signature algorithms via PQCryptoLib integrated into OpenSSL (v3.2.0+) and mbedTLS (v3.2.1). Supports hybrid modes (classical plus PQC). Enables post-quantum TLS 1.3 and X.509 PKI support. Algorithms include Falcon, ML-KEM, and ML-DSA.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Falcon 512/1024, FIPS-203 ML-KEM 512/768/1024, FIPS-204 ML-DSA 2/3/5 (OpenSSL); Falcon 512/1024, FIPS-204 ML-DSA 44/65/87, FIPS-203 ML-KEM 512/768/1024 (mbedTLS); All existing classical cryptography via OpenSSL.
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library integration (OpenSSL/mbedTLS)
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: R24.3.1
- **Release Date**: 2024-07-12
- **FIPS Validated**: No (References FIPS-203 and FIPS-204 standards for algorithms, but no validation status mentioned)
- **Primary Platforms**: Linux (x86_64 and ARM64), macOS, MS Windows
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Enables experimentation and prototyping before full deployment; supports migration use cases including TLS, PKI, VPN, web servers, user authentication, software signing, and Zero Trust.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Falcon 512/1024, FIPS-204 ML-DSA 2/3/5 (OpenSSL), FIPS-204 ML-DSA 44/65/87 (mbedTLS)
- **Authoritative Source URL**: Not stated

---

## Go stdlib crypto/mlkem

- **Category**: Cryptographic Libraries
- **Product Name**: Go stdlib crypto/mlkem
- **Product Brief**: A standard library package implementing the quantum-resistant ML-KEM key encapsulation method as specified in NIST FIPS 203.
- **PQC Support**: Yes (ML-KEM-768 and ML-KEM-1024)
- **PQC Capability Description**: Implements ML-KEM (formerly Kyber) per NIST FIPS 203. Supports parameter sets ML-KEM-768 and ML-KEM-1024 via DecapsulationKey and EncapsulationKey types. Provides functions for key generation, encapsulation, and decapsulate operations. Includes a testing package (mlkemtest) for derandomized encapsulation.
- **PQC Migration Priority**: Not stated
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
- **PQC Capability Description**: Implements ML-KEM (formerly Kyber), a post-quantum secure key encapsulation mechanism standardized by NIST in FIPS 203. Supports three security levels: MlKem512 (128-bit), MlKem768 (192-bit), and MlKem1024 (256-bit). Implementation is pure Rust but has never been independently audited.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM (MlKem512, MlKem768, MlKem1024), SHA3
- **Key Management Model**: Programmatic key generation and encapsulation/decapsulation via API; supports decapsulation key and encapsulation key pairs.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library (Pure Rust)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.2.3
- **Release Date**: Unknown
- **FIPS Validated**: No (Implements algorithm described in FIPS 203, but implementation is not stated as validated)
- **Primary Platforms**: aarch64-apple-darwin, aarch64-unknown-linux-gnu, i686-pc-windows-msvc, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements ML-KEM as standardized by NIST in FIPS 203; no future roadmap details provided.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Product is a KEM, not a signature scheme)
- **Authoritative Source URL**: https://github.com/RustCrypto/KEMs

---

## RustCrypto ml-dsa

- **Category**: Cryptographic Libraries
- **Product Name**: RustCrypto ml-dsa
- **Product Brief**: Pure Rust implementation of the Module-Lattice-Based Digital Signature Standard (ML-DSA) as described in FIPS 204.
- **PQC Support**: Yes (ML-DSA / CRYSTALS-Dilithium)
- **PQC Capability Description**: Implements ML-DSA (formerly CRYSTALS-Dilithium) per FIPS 204 final. Supports parameter sets MlDsa44 (Category 2), MlDsa65 (Category 3), and MlDsa87 (Category 5). Implementation is pure Rust, no_std compatible, and has not been independently audited.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-DSA (MlDsa44, MlDsa65, MlDsa87), DSA, ECDSA, Ed25519, Ed448, LMS, SLH-DSA, XMSS
- **Key Management Model**: Programmatic key generation and signing via Rust traits (KeyGen, Signer, Verifier); supports PKCS#8 format; keys encoded as byte arrays.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software cryptographic library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.0.4
- **Release Date**: Unknown
- **FIPS Validated**: No (Implementation describes FIPS 204 but is not stated as validated)
- **Primary Platforms**: i686-pc-windows-msvc, i686-unknown-linux-gnu, x86_64-apple-darwin, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu; supports no_std (bare-metal/WebAssembly)
- **Target Industries**: Unknown
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (MlDsa44, MlDsa65, MlDsa87), DSA, ECDSA, Ed25519, Ed448, LMS, SLH-DSA, XMSS
- **Authoritative Source URL**: https://github.com/RustCrypto/signatures

---

## RustCrypto slh-dsa

- **Category**: Cryptographic Libraries
- **Product Name**: RustCrypto slh-dsa
- **Product Brief**: Pure Rust implementation of the SLH-DSA (SPHINCS+) signature scheme based on FIPS-205.
- **PQC Support**: Yes (SLH-DSA/SPHINCS+ implemented per FIPS-205)
- **PQC Capability Description**: Implements Stateless Hash-based Digital Signature Algorithm (SLH-DSA) based on SPHINCS+, finalized in NIST FIPS-205. Supports 12 parameter sets (SHA2 and SHAKE variants at L1, L3, L5 security). Signatures range from 7KB to 50KB. Implementation is not independently audited; requires Rust 1.75+.
- **PQC Migration Priority**: High
- **Crypto Primitives**: SLH-DSA (SPHINCS+), SHA2, SHAKE256, Ed25519, Ed448, ECDSA, DSA, LMS, ML-DSA, XMSS
- **Key Management Model**: Programmatic key generation and serialization via `SigningKey` and `VerifyingKey` structs; supports deterministic signatures; no HSM or MPC mentioned.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (Pure Rust)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0 OR MIT
- **Latest Version**: 0.1.0
- **Release Date**: Unknown
- **FIPS Validated**: No (Implementation based on FIPS-205 standard, but not stated as validated; warning notes lack of independent audit)
- **Primary Platforms**: i686-pc-windows-msvc, i686-unknown-linux-gnu, x86_64-apple-darwin, x86_64-pc-windows-msvc, x86_64-unknown-linux-gnu; supports `no_std` for bare-metal/WebAssembly.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implements finalized NIST FIPS-205 standard; no future roadmap details provided beyond MSRV changes.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: SLH-DSA (SPHINCS+), DSA, ECDSA, Ed25519, Ed448, LMS, ML-DSA, XMSS
- **Authoritative Source URL**: https://github.com/RustCrypto/signatures

---

## pqcrypto

- **Category**: Cryptographic Libraries
- **Product Name**: pqcrypto
- **Product Brief**: Rust bindings to C implementations of NIST post-quantum cryptographic algorithms based on PQClean.
- **PQC Support**: Yes (bindings to NIST competition algorithms via PQClean)
- **PQC Capability Description**: Provides Rust bindings for C implementations of cryptographic algorithms from the NIST competition, generated from the PQClean project. Supports variants controlled by `implementations.yaml`. Maturity is defined as a library of bindings rather than a standalone protocol implementation.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (specific algorithm names like Kyber or Dilithium are not explicitly listed in the text, only referenced as "NIST competition" algorithms)
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
- **Product Brief**: Rust bindings for the Open Quantum Safe liboqs C library providing quantum-resistant cryptographic algorithms.
- **PQC Support**: Yes (Supports KEMs and Signature schemes including NIST standardization candidates)
- **PQC Capability Description**: Provides Rust wrappers for liboqs, a C library for quantum-resistant cryptography. Supports KEMs (BIKE, Classic McEliece, FrodoKEM, HQC, Kyber, ML-KEM, NTRU Prime) and Signatures (Cross, Dilithium, Falcon, Mayo, ML-DSA, SPHINCS+, UOV). Designed for prototyping; recommends hybrid cryptography with traditional algorithms.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: BIKE, Classic McEliece, FrodoKEM, HQC, Kyber, ML-KEM, NTRU Prime, Cross, Dilithium, Falcon, Mayo, ML-DSA, SPHINCS+, UOV, RSA (mentioned as traditional), Elliptic curves (mentioned as traditional)
- **Key Management Model**: Programmatic key generation and management via Rust API; supports `serde` serialization; no specific HSM or MPC architecture stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Apache-2.0, MIT
- **Latest Version**: 0.10.1 (for `oqs` crate)
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Rust environments; supports `no_std`; compatible with platforms where liboqs builds (CPU feature detection supported or disabled via `non_portable`).
- **Target Industries**: Not stated
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
- **Latest Version**: Not stated (Repository last updated 2026-03-04; dependent versions like libOQS 0.13.0 and AWS-LC v1.50.0 mentioned)
- **Release Date**: 2026-03-04
- **FIPS Validated**: No (Implements FIPS 203 standard, but no validation status stated)
- **Primary Platforms**: Arm (64-bit Neon), Intel/AMD (64-bit AVX2), RISC-V (64-bit RVV), Armv8.1-M (experimental Helium/MVE); Ubuntu mentioned for quickstart.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports all ML-KEM security levels via compile-time parameters; experimental support for 32-bit Armv8.1-M backend.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Product implements Key Encapsulation Mechanisms, not signatures)
- **Authoritative Source URL**: https://github.com/pq-code-package/mlkem-native

---

## leancrypto

- **Category**: Cryptographic Libraries
- **Product Name**: leancrypto
- **Product Brief**: A cryptographic library exclusively containing PQC-resistant algorithms with minimal dependencies and support for multiple environments.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The library exclusively contains PQC-resistant algorithms. It implements NIST-approved schemes: ML-DSA/Dilithium, ML-KEM/Kyber, SLH-DSA/Sphincs+, and BIKE. Accelerated implementations exist for x86_64, ARMv7/ARMv8, and RISCV64. Algorithms are tested with NIST ACVP and hold official CAVP certificates.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Ascon, SHA2, SHA-3, Curve 25519, Curve 448, ML-DSA (Dilithium), ML-KEM (Kyber), SLH-DSA (Sphincs+), BIKE, AES, ChaCha20, KMAC
- **Key Management Model**: Programmatic key management via library API; supports PKCS#8 generator and parser; stack-only or heap allocation supported.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software cryptographic library (User space, Linux kernel module, EFI)
- **Infrastructure Layer**: Application
- **License Type**: Unknown
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2025-11-17
- **FIPS Validated**: Yes (Official CAVP certificates received for algorithms tested with NIST ACVP; references FIPS 203, FIPS 204, FIPS 205)
- **Primary Platforms**: Linux user space, Linux kernel space, BSD user space, Apple OSes user space, Windows user space, EFI environment
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Library exclusively contains PQC-resistant algorithms; supports NIST-approved post-quantum asymmetric algorithms (ML-DSA, ML-KEM, SLH-DSA) with composite algorithms and accelerations.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA (Dilithium), SLH-DSA (Sphincs+), Ascon-Hash256, SHA-3 derivatives, KMAC256
- **Authoritative Source URL**: Not stated

---

## Cosmian covercrypt

- **Category**: Cryptographic Libraries
- **Product Name**: Cosmian/cover_crypt
- **Product Brief**: Implementation of the CoverCrypt attribute-based encryption algorithm in Rust.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Post-quantum secure with a 128-bit security level. Supports hybridization using INDCPA-KYBER (INDCPA version of NIST standard Kyber). Data encrypted using AES-GCM with a 256-bit key. Includes formal proof of security in the CoverCrypt paper.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Curve25519, INDCPA-KYBER, AES-GCM
- **Key Management Model**: Central authority manages master keys and user secret keys based on attribute policies; supports key generation, update, and refresh via API.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Attribute-based encryption with hybrid post-quantum encapsulation
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Unknown
- **Release Date**: 2026-02-13
- **FIPS Validated**: No
- **Primary Platforms**: Rust (Cargo)
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports hybridization using INDCPA-KYBER; formal proof of security provided in CoverCrypt paper.
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
- **Primary Platforms**: ARM Cortex-M4 microcontrollers; Development boards: Nucleo-L4R5ZI, STM32F4 Discovery, Nucleo-L476RG, CW308T-STM32F3, MPS2(+) FPGA.
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Includes schemes from NIST Round 4 and additional signatures Round 1; integrates PQClean implementations.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Post-quantum signature schemes (specific algorithms not listed by name in text).
- **Authoritative Source URL**: https://github.com/mupq/pqm4

---

## HQC Algorithm

- **Category**: Cryptographic Libraries
- **Product Name**: PQClean
- **Product Brief**: Clean, portable, tested implementations of post-quantum cryptography schemes in C.
- **PQC Support**: Yes (Kyber, HQC, Classic McEliece, Dilithium, Falcon, SPHINCS+)
- **PQC Capability Description**: Provides standalone C implementations of NIST PQC finalists and alternate candidates including Kyber, HQC, Classic McEliece, Dilithium, Falcon, and SPHINCS+. Not an integrated library; intended for integration into other libraries or protocols. Deprecation notice: planned to archive as read-only in July 2026.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Kyber, HQC, Classic McEliece, Dilithium, Falcon, SPHINCS+, SHA-2, SHA-3 (FIPS202), AES, cSHAKE
- **Key Management Model**: Not stated (Source code only; no key management architecture described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (C implementations)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Mixed (CC0 for repository code, individual licenses per implementation in subdirectories, MIT/Public Domain for common files)
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

## Microsoft SymCrypt

- **Category**: Cryptographic Libraries
- **Product Name**: Microsoft SymCrypt
- **Product Brief**: Core cryptographic function library used by Windows providing symmetric and asymmetric algorithm implementations.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports verified PQC algorithms including ML-KEM and ML-DSA via CNG and Certificate functions. Available to Windows Insiders and Linux customers. TLS 1.3 hybrid key exchange enabled in SymCrypt-OpenSSL version 1.9.0. Roadmap aims for early adoption by 2029 and full transition by 2033.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: AES, RSA, ECDSA, ML-KEM, ML-DSA
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Open Source
- **License**: MIT
- **Latest Version**: 1.9.0 (SymCrypt-OpenSSL), 101.0.0+ (SymCrypt versioning scheme)
- **Release Date**: 2026-03-05
- **FIPS Validated**: Support FIPS 140 certification of products using SymCrypt; uses Jitterentropy for FIPS-certifiable entropy in Linux modules.
- **Primary Platforms**: Windows, Microsoft Azure, Microsoft 365, Linux
- **Target Industries**: Enterprise, Government (aligned with US CNSA 2.0 and global government timelines)
- **Regulatory Status**: Aligned with NIST, CISA, OMB, NSA guidance, CNSA 2.0, CNSSP-15, ISO standards.
- **PQC Roadmap Details**: Early adoption by 2029; gradual default in subsequent years; full transition of services and products by 2033. Uses hybrid approach (classical + PQC) as interim step before direct shift to full PQC.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA, ML-DSA (Module-Lattice Digital Signature Algorithm)
- **Authoritative Source URL**: https://github.com/microsoft/SymCrypt

---

## AWS-LC

- **Category**: Cryptographic Libraries
- **Product Name**: AWS-LC
- **Product Brief**: A general-purpose cryptographic library maintained by AWS based on BoringSSL and OpenSSL.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-KEM (FIPS 203) for TLS 1.3 hybrid key exchange (SecP256r1MLKEM768, X25519MLKEM768) and PQ-SFTP (mlkem768nistp256-sha256, mlkem1024nistp384-sha384, mlkem768x25519-sha256). AWS-LC-FIPS-3.0 released November 2024. ML-DSA implementation noted as having complications in cloud KMS.
- **PQC Migration Priority**: High
- **Crypto Primitives**: SecP256r1, X25519, ML-KEM (MLKEM768, MLKEM1024), SHA-256, SHA-384, RSA, P-256, P-384, P-521, Ed25519
- **Key Management Model**: AWS Key Management Service (KMS), CloudHSM, Server-Side Encryption, Client-Side Encryption
- **Supported Blockchains**: Not stated
- **Architecture Type**: Cryptographic Library (Software)
- **Infrastructure Layer**: Application, Security Stack, Cloud
- **License Type**: Open Source/Commercial
- **License**: NOASSERTION
- **Latest Version**: AWS-LC-FIPS-3.0
- **Release Date**: 2024-11-01
- **FIPS Validated**: Yes (AWS-LC-FIPS-3.0, FIPS 203 IPD, CMVP Pending)
- **Primary Platforms**: Linux (x86, x86-64, aarch64, ppc, ppc64, ppc64le), Windows (x86-64, aarch64), macOS (x86-64, aarch64), Android (aarch64, arm32), iOS (aarch64), WebAssembly (Emscripten)
- **Target Industries**: Enterprise, Cloud Services, Government (CNSA 2.0 compliance mentioned)
- **Regulatory Status**: FIPS 203 IPD, CNSA 2.0 timeline alignment
- **PQC Roadmap Details**: Timeline includes NIST SP800-208 and Draft IR 8547; FIPS 203/204/205 adoption by 2030-2035; AWS-LC-FIPS-3.0 released Nov 2024; ML-KEM TLS policies Jan 2025; CNSA 2.0 algorithms (LMS/XMSS, ML-KEM-1024, ML-DSA-87) for new acquisitions by 2029/2030.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Ed25519, ECDSA (P-256, P-384, P-521), ML-DSA (planned/complications noted)
- **Authoritative Source URL**: https://github.com/aws/aws-lc

---

## Nvidia cuPQC

- **Category**: Cryptographic Libraries
- **Product Name**: Nvidia cuPQC
- **Product Brief**: SDK of GPU-optimized cryptographic math libraries for building classical and next-generation high-performance applications.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Production-ready library (cuPQC-PK) implementing NIST-standardized ML-KEM-512/768/1024 and ML-DSA-44/65/87. Optimized for GPU with link-time optimization, supporting low-latency single operations and high-throughput batch processing for TLS handshakes, VPN tunneling, code signing, and certificate authorities.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: ML-KEM (ML-KEM-512, ML-KEM-768, ML-KEM-1024), ML-DSA (ML-DSA-44, ML-DSA-65, ML-DSA-87), SHA-2, SHA-3, SHAKE, Poseidon 2
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: GPU-accelerated software library (CUDA kernels)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: NVIDIA GPU architectures (NVIDIA Jetson, data center GPUs including RTX PRO 6000 Blackwell Server Edition, H100)
- **Target Industries**: Enterprise (implied by "enterprises with high-throughput security applications")
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Supports NIST-standardized ML-KEM and ML-DSA; described as "production-ready" for next-generation cryptographic applications.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Authoritative Source URL**: Not stated

---

## SandboxAQ Sandwich

- **Category**: Cryptographic Libraries
- **Product Name**: Sandwich
- **Product Brief**: Open source meta-library of cryptographic algorithms enabling agile cryptography implementation.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Includes libOQS library providing access to new post-quantum cryptography (PQC) algorithms from NIST. Enables developers to embed PQC directly into applications and swap algorithms without rewriting code. Supports hybrid mode via "sandwich" of protocols.
- **PQC Migration Priority**: High
- **Crypto Primitives**: Not stated (mentions support for cryptographic libraries OpenSSL, BoringSSL, libOQS but does not list specific primitives like ECDSA or Ed25519)
- **Key Management Model**: Not stated (mentions future planned features may include key management services (KMS), but current model is not described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Meta-library/Framework
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: 2023-08-08
- **FIPS Validated**: No
- **Primary Platforms**: MacOS, Linux; Languages: C/C++, Rust, Python, Go
- **Target Industries**: Government (U.S. Air Force, DISA, HHS), Enterprise, Telecommunications, Banking
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Future iterations planned to enable multi-layered stacked sandwiches and access to fundamental primitives or functionalities like authentication, VPNs, or KMS. Supports algorithms soon to be standardized by NIST.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (mentions support for PQC algorithms from NIST via libOQS but does not list specific signature schemes)
- **Authoritative Source URL**: https://www.sandboxaq.com/solutions/sandwich

---

## Cloudflare CIRCL

- **Category**: Cryptographic Libraries
- **Product Name**: CIRCL (Cloudflare Interoperable, Reusable Cryptographic Library)
- **Product Brief**: A collection of cryptographic primitives written in Go for experimental deployment of Post-Quantum and Elliptic Curve Cryptography.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports ML-KEM (modes 512, 768, 1024), X-Wing, Kyber KEM, FrodoKEM, CSIDH, Dilithium (modes 2, 3, 5), ML-DSA (modes 44, 65, 87), and SLH-DSA. SIDH/SIKE is marked as insecure and deprecated. Status is experimental; caution recommended for production use.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: X25519, X448, Curve4Q, Ed25519, Ed448, BLS, P-256, P-384, P-521, Ristretto, BLS12-381, HPKE, VOPRF, RSA Blind Signatures, CPABE, OT, Threshold RSA, Prio3, ML-KEM, X-Wing, Kyber KEM, FrodoKEM, CSIDH, Dilithium, ML-DSA, SLH-DSA, Schnorr, DLEQ, SHAKE128, SHAKE256, BLAKE2X, KangarooTwelve, Ascon v1.2
- **Key Management Model**: Not stated (Library provides primitives; specific key management architecture not described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cryptographic Library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: BSD-3-Clause License
- **Latest Version**: v1.6.3
- **Release Date**: 2026-01 (Accessed date in citation; specific release date not stated)
- **FIPS Validated**: No (References FIPS standards for algorithms but does not claim validation status)
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
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports NIST-approved PQC algorithms ML-KEM (for key exchange) and ML-DSA (for digital signatures). Feature complete in version 3.112; FIPS 140-3 compliant code is open-sourced. The module has achieved CAVP certification and entered the Modules in Process (MIP) list, with full FIPS validation anticipated Q2 2027.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ML-KEM, ML-DSA
- **Key Management Model**: Supports PKCS #5, PKCS #7, PKCS #11, and PKCS #12 standards; programmatic key management via libraries.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software cryptographic library
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Mozilla Public License v2 (MPLv2)
- **Latest Version**: 3.121 (Branch/Beta), 3.112 (FIPS PQC context)
- **Release Date**: 2026-03-05
- **FIPS Validated**: Modules in Process (MIP) with CAVP certification; full FIPS 140-3 validation anticipated Q2 2027.
- **Primary Platforms**: Cross-platform (Linux, macOS, Windows), specifically Rocky Linux from CIQ for PQC module.
- **Target Industries**: Enterprise, Government, Regulated industries
- **Regulatory Status**: CAVP certified, Modules in Process (MIP) list; advancing toward FIPS 140-3 validation.
- **PQC Roadmap Details**: ML-KEM and ML-DSA implemented; full FIPS 140-3 validation anticipated Q2 2027. NSA CNSA 2.0 timeline noted with milestones beginning 2027 and full migration by 2035.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, ML-DSA (Module-Lattice-Based Digital Signature Algorithm)
- **Authoritative Source URL**: https://www.qubip.eu (Project context), Mozilla NSS documentation (implied via source text)

---

## .NET System.Security.Cryptography

- **Category**: Cryptographic Libraries
- **Product Name**: .NET System.Security.Cryptography
- **Product Brief**: Cryptographic library in .NET 10 adding support for Post-Quantum Cryptography algorithms.
- **PQC Support**: Yes (ML-KEM, ML-DSA, SLH-DSA, Composite ML-DSA)
- **PQC Capability Description**: .NET 10 introduces four PQC algorithms: ML-KEM (Key Encapsulation, NIST FIPS 203), ML-DSA (Signature, NIST FIPS 204), SLH-DSA (Signature, NIST FIPS 205), and Composite ML-DSA (Signature, IETF Draft). These replace RSA/EC-DSA for signatures and RSA Key Transport/EC-DH for key agreement. New classes (MLKem, MLDsa, SlhDsa, CompositeMLDsa) extend object directly, avoiding AsymmetricAlgorithm limitations.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM, ML-DSA, SLH-DSA, Composite ML-DSA, RSA, EC-DSA, EC-Diffie-Hellman, AES, SHA-2, SHA-3
- **Key Management Model**: Programmatic key generation and import/export via static methods; supports PKCS#8 (ImportPkcs8PrivateKey, ExportPkcs8PrivateKey), SubjectPublicKeyInfo, PEM formats, and encrypted variants.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library
- **Infrastructure Layer**: Application
- **License Type**: Proprietary/Open Source (Not explicitly stated in text)
- **License**: Unknown
- **Latest Version**: .NET 10
- **Release Date**: 2025-11-18
- **FIPS Validated**: No (References NIST FIPS 203, 204, 205 standards for algorithms, but does not state the library itself is FIPS validated)
- **Primary Platforms**: Windows, macOS, Linux (implied by "works no matter what OS you're on" and .NET context)
- **Target Industries**: Enterprise, Developer
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Implemented in .NET 10 immediately following NIST standardization of FIPS 203, 204, and 205. Includes IETF Draft Composite ML-DSA.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA, SLH-DSA, Composite ML-DSA, RSA, EC-DSA
- **Authoritative Source URL**: https://devblogs.microsoft.com/dotnet/post-quantum-cryptography-in-net/ (Inferred from context "Microsoft Dev Blogs" and title)

---

## PyCryptodome

- **Category**: Cryptographic Libraries
- **Product Name**: PyCryptodome
- **Product Brief**: A self-contained Python package of low-level cryptographic primitives.
- **PQC Support**: No
- **PQC Capability Description**: The document lists support for classical algorithms including NIST P-curves, Ed25519, Ed448, Curve25519, Curve448, RSA, DSA, and various hash functions (SHA-3, BLAKE2). No Post-Quantum Cryptography (PQC) algorithms or schemes are mentioned.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: AES, GCM, CCM, EAX, SIV, OCB, KW, KWP, HPKE, NIST P-curves, Ed25519, Ed448, Curve25519, Curve448, SHA-3 (SHAKE128, SHAKE256, cSHAKE128, cSHAKE256, KMAC128, KMAC256, TupleHash128, TupleHash256), KangarooTwelve, TurboSHAKE128, TurboSHAKE256, SHA-512/224, SHA-512/256, BLAKE2b, BLAKE2s, Salsa20, ChaCha20, XChaCha20, Poly1305, ChaCha20-Poly1305, XChaCha20-Poly1305, scrypt, bcrypt, HKDF, NIST SP 800 108r1, (EC)DSA, EdDSA, RSA, DSA
- **Key Management Model**: Password-protected PKCS#8 key containers; random numbers sourced directly from the OS.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library (pure Python with C extensions for performance-critical pieces).
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: NOASSERTION
- **Latest Version**: Not stated
- **Release Date**: 2026-03-05
- **FIPS Validated**: No (References FIPS standards for algorithm definitions but does not claim validation status).
- **Primary Platforms**: Python 2.7, Python 3.7+, PyPy; Windows, Unix (with GMP support).
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Deterministic (EC)DSA, EdDSA, RSA, DSA.
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
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA, DSA, Deterministic DSA, ElGamal, Nyberg-Rueppel (NR), Rabin-Williams (RW), LUC, LUCELG, EC-based German Digital Signature (ECGDSA), ESIGN, ECDSA, Deterministic ECDSA, ed25519.
- **Authoritative Source URL**: https://github.com/weidai11/cryptopp

---

## PQCryptoLib-Core

- **Category**: Cryptographic Libraries
- **Product Name**: PQCryptoLib-Core
- **Product Brief**: Highly configurable SW PQC Library for Classical, PQC and PQ/T Hybrid on Linux, Windows and Mac.
- **PQC Support**: Yes (NIST-standardized post-quantum and PQ/T Hybrid algorithms)
- **PQC Capability Description**: Provides latest NIST-standardized post-quantum and PQ/T Hybrid algorithms in a software environment. Optimized for crypto-agility and FIPS-compliant PQ/T Hybrid solutions to protect against 'Harvest Now Decrypt Later' attacks. Supports smooth transition to quantum resistance.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: NIST-standardized post-quantum algorithms, PQ/T Hybrid algorithms (specific algorithm names not listed)
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Software library with configurable API; leverages hardware accelerators on mainstream devices
- **Infrastructure Layer**: Application, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (implied by "Contact us for an evaluation" and commercial context)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (FIPS 140-3 CMVP Certified / CAVP Compliant)
- **Primary Platforms**: Linux, Windows, Mac (requires a C compiler)
- **Target Industries**: Semiconductors and Manufacturing, Identity and Paymentech, Military and Aerospace, System Integrators, Automotive, Industrial IoT, Network & Telecommunications, Enterprise Platforms, Healthcare
- **Regulatory Status**: FIPS 140-3 CMVP Certified / CAVP Compliant
- **PQC Roadmap Details**: Not stated (mentions providing latest NIST-standardized algorithms)
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated (specific schemes not listed, only "NIST-standardized" mentioned)
- **Authoritative Source URL**: Not stated

---

## PQMicroLib-Core

- **Category**: Cryptographic Libraries
- **Product Name**: PQMicroLib-Core
- **Product Brief**: Highly optimizable baremetal PQC library in as little as 5kb RAM with option to include DPA protection.
- **PQC Support**: Yes (ML-KEM, ML-DSA, SLH-DSA, XMSS, LMS)
- **PQC Capability Description**: CAVP-Ready version of PQShield’s CMVP-certified PQCryptoLib-Core tailored for embedded systems running bare metal or RTOS. Supports ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205), XMSS, LMS. Includes protection against DPA, template attacks, deep learning attacks, timing side-channel attacks, and buffer overflows. Optimized for low-end MCUs (as low as 5kb RAM) with SIMD support and hardware accelerator leverage.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, ML-DSA, SLH-DSA, XMSS, LMS, SHA2, SHA3, DRBG
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not stated
- **Architecture Type**: Baremetal library for embedded systems
- **Infrastructure Layer**: Hardware, Application
- **License Type**: Commercial
- **License**: Proprietary (Contact us for an evaluation)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: CAVP-Ready; based on CMVP-certified PQCryptoLib-Core supporting FIPS 203, FIPS 204, and FIPS 205 algorithms.
- **Primary Platforms**: Embedded systems running bare metal or real-time operating systems (RTOS); any platform with a C compiler.
- **Target Industries**: Semiconductors and Manufacturing, Identity and Paymentech, Military and Aerospace, System Integrators, Automotive, Industrial IoT, Network & Telecommunications, Enterprise Platforms, Healthcare.
- **Regulatory Status**: NCSC Assured Consultancy mentioned; supports PQC CNSA 2.0 algorithms.
- **PQC Roadmap Details**: Supports PQC CNSA 2.0 algorithms; migration from traditional cryptography to PQC is a listed use case.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (FIPS 204), SLH-DSA (FIPS 205), XMSS, LMS
- **Authoritative Source URL**: Not stated

---

## IBM z/OS Cryptographic Services (ICSF)

- **Category**: Cryptographic Libraries
- **Product Name**: IBM z/OS Cryptographic Services (ICSF)
- **Product Brief**: Hardware-based cryptographic services on IBM Z mainframes supporting quantum-safe algorithms.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports standardized quantum-safe algorithms including ML-DSA and ML-KEM (formerly CRYSTALS-Dilithium and CRYSTALS-Kyber). Capabilities available on IBM z17, z16, and z15. Includes key generation, encryption, digital signatures (Pure and Pre-hash modes), and hybrid key exchange via ICSF CCA and PKCS #11 services.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: ML-DSA, ML-KEM, AES 256-bit, CRYSTALS-Dilithium, CRYSTALS-Kyber
- **Key Management Model**: Hardware-backed key storage and generation using IBM Z cryptographic hardware components; supports Trusted Key Entry, IBM UKO, and IBM EKMF Workstation.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based (IBM Z mainframe cryptographic coprocessors)
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (Copyright International Business Machines Corporation 2025)
- **Latest Version**: Second Edition (December 2025)
- **Release Date**: 2025-12-22
- **FIPS Validated**: Not stated
- **Primary Platforms**: IBM z17, IBM z16, IBM z15
- **Target Industries**: Enterprise (implied by IBM Z context), Finance (implied by "Industry applications" sections)
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Migration from CRYSTALS-Dilithium and CRYSTALS-Kyber to ML-DSA and ML-KEM; includes steps for discovery, risk assessment, and adoption of quantum-safe cryptography.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA (Pure and Pre-hash), CRYSTALS-Dilithium
- **Authoritative Source URL**: Not stated

---

## QuintessenceLabs qSOC

- **Category**: Cloud Key Management
- **Product Name**: QuintessenceLabs qSOC (Trusted Security Foundation® / TSF®)
- **Product Brief**: Centralized, vendor-neutral encryption key management solution supporting PQC and quantum entropy.
- **PQC Support**: Yes (with details: Supports NIST Quantum Resistant Algorithms and NIST approved PQC algorithms via qConnect and TSF).
- **PQC Capability Description**: The Trusted Security Foundation (TSF) provides PQC crypto-agile key management supporting the latest NIST Quantum Resistant Algorithms. The qConnect Quantum Safe Key Distributor enables quantum safe key distribution using NIST approved PQC algorithms, standard industry protocols, and supports hybrid QKD/PQC key delivery. Integration with PQShield quantum resistant algorithm implementations is described for TSF KMS and qClient SDK.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, ECC, DH (mentioned as legacy targets), NIST Quantum Resistant Algorithms (specific names not listed), Symmetric encryption (256-bit keys).
- **Key Management Model**: Centralized, vendor-neutral key and policy management; supports KMIP and PKCS#11 APIs; integrates with QKD for key distribution; supports hybrid QKD/PQC delivery.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Software SDK, Virtual Machine, Network Attached Appliance, Hardware QKD)
- **Infrastructure Layer**: Application, Security Stack, Cloud, Hardware, Network
- **License Type**: Commercial
- **License**: Proprietary (©2025 QuintessenceLabs. All rights reserved.)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: No (NIST 800-90B Certified for entropy; mentions NIST algorithms are being developed into FIPS, but does not state the product itself is FIPS validated).
- **Primary Platforms**: Virtual Machine, Network Attached Appliance, On-premise, Cloud, Mobile (via qProtect), any application via SDK.
- **Target Industries**: Insurance, Public sector, Banking, Life sciences, Advanced industries, Global energy and materials, Telecom, media, and technology, Consumer electronics, Travel and logistics.
- **Regulatory Status**: Common Criteria Certified; NIST 800-90B Certified (for qStream QRNG).
- **PQC Roadmap Details**: Supports latest NIST Quantum Resistant Algorithms; integrates with PQShield implementations; designed for seamless transition to a post-quantum world; supports hybrid QKD/PQC delivery.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Document mentions support for PQC algorithms and RSA/ECC/DH context, but does not list specific signature schemes like Ed25519 or Dilithium).
- **Authoritative Source URL**: www.quintessencelabs.com

---

## Amazon Web Services (AWS)

- **Category**: Cloud Key Management
- **Product Name**: AWS Key Management Service (AWS KMS) / s2n
- **Product Brief**: Cloud-based key management service with post-quantum hybrid TLS support for API endpoints.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Supports hybrid post-quantum TLS using ML-KEM (Kyber), BIKE, and SIKE combined with classical ECDHE/FFDHE. Implemented in s2n-tls and s2n-quic. Updated to support NIST Round 3 picked KEM (Kyber) as of Jan 2023. Supports specific cipher suites like SecP256r1MLKEM768 and X25519MLKEM768.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ECDHE, FFDHE, BIKE, SIKE, ML-KEM (Kyber), RSA 2048, secp256r1, X25519, NISTP256, NISTP384
- **Key Management Model**: Cloud-based managed service with client-side and server-side encryption options; supports hybrid key exchange for TLS.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classical + PQC)
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Open Source/Commercial
- **License**: s2n is open source; AWS KMS is Commercial/Proprietary service.
- **Latest Version**: aws-crt-client 2.10.7-SNAPSHOT (Developer Preview); AWS-LC-FIPS-3.0 mentioned in timeline.
- **Release Date**: 2024-11-04 (Blog post date for PQC TLS support update)
- **FIPS Validated**: Partial (AWS-LC-FIPS-3.0 pending CMVP; FIPS 203 IPD mentioned; non-FIPS endpoints support PQC, FIPS endpoints do not).
- **Primary Platforms**: AWS Cloud, Java SDK v2, s2n-tls, s2n-quic
- **Target Industries**: Enterprise, Government (CNSA 2.0 context), General Cloud Users
- **Regulatory Status**: NIST SP800-208, CNSA 2.0, FIPS 203, FIPS 204, FIPS 205 referenced for compliance timelines.
- **PQC Roadmap Details**: Migration strategy includes inventorying use cases and prioritizing long-term confidentiality. Timeline targets 2025 for ML-KEM TLS 1.3 policies and ACM/KMS updates. CNSA 2.0 requires LMS/XMSS, ML-KEM-1024, ML-DSA-87 by 2030+.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA (2048-bit), ECDSA (implied via secp256r1 context), ML-DSA (planned per NIST timeline), LMS/XMSS (planned per CNSA 2.0).
- **Authoritative Source URL**: https://docs.aws.amazon.com/transfer/latest/userguide/post-quantum-security-policies.html (referenced for SFTP); AWS Security Blog post referenced.

---

## Microsoft Azure

- **Category**: Cloud Key Management
- **Product Name**: Microsoft Azure (specifically Azure Key Vault and SymCrypt library context)
- **Product Brief**: Cloud platform offering quantum-safe security capabilities via SymCrypt library updates and Azure Key Vault services.
- **PQC Support**: Partial (with scope)
- **PQC Capability Description**: PQC algorithms (ML-KEM, ML-DSA) are available through CNG and Certificate functions for Windows Insiders and Linux. TLS 1.3 hybrid key exchange is enabled in SymCrypt-OpenSSL v1.9.0. Full transition of services planned by 2033, with early adoption starting 2029.
- **PQC Migration Priority**: High
- **Crypto Primitives**: AES, RSA, ECDSA, ML-KEM, ML-DSA, FrodoKEM (research/standardization context)
- **Key Management Model**: Not stated (mentions key and secret management services but no specific architectural model like MPC or HSM details in text)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Commercial/Open Source
- **License**: Not stated (SymCrypt and Adams Bridge Accelerator mentioned as open-source; Azure services are commercial)
- **Latest Version**: 1.9.0 (SymCrypt-OpenSSL)
- **Release Date**: 2025-08-20 (Blog post date; specific software release dates not stated)
- **FIPS Validated**: Not stated
- **Primary Platforms**: Windows, Linux, Microsoft Azure, Microsoft 365
- **Target Industries**: Enterprise, Government, Financial services, Healthcare, Manufacturing, Retail
- **Regulatory Status**: Aligned with NIST, CISA, OMB, CNSA 2.0, CNSSP-15, ISO standards
- **PQC Roadmap Details**: Early adoption by 2029; default in subsequent years; full transition of services and products by 2033. Uses hybrid approach (classical + PQC) as interim step before full PQC shift.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ECDSA, ML-DSA (planned/preview), RSA (current)
- **Authoritative Source URL**: https://www.microsoft.com/security/blog (inferred from context "Microsoft Security Blog" and text source)

---

## Google Cloud Platform (GCP)

- **Category**: Cloud Key Management
- **Product Name**: Google Cloud Platform (GCP) / Cloud KMS
- **Product Brief**: Cloud infrastructure enabling customers to secure workloads with NIST-approved PQC algorithms via libraries like BoringSSL and Tink.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implementing PQC according to NIST standards, specifically prioritizing ML-KEM for store-now-decrypt-later mitigation. Integrating Quantum-Safe Signatures in Cloud KMS. Enabling developers to use NIST-approved algorithms via BoringSSL and Tink libraries. Focus on crypto agility and key rotation.
- **PQC Migration Priority**: High
- **Crypto Primitives**: ML-KEM (mentioned as implementation target), TLS, SSH, ALTS, PKI signatures. Specific classical primitives not explicitly listed beyond general categories.
- **Key Management Model**: Cloud KMS with support for crypto agility and key rotation; uses libraries BoringSSL and Tink for algorithm switching.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Cloud-based infrastructure with application-layer libraries (BoringSSL, Tink) supporting hybrid deployments.
- **Infrastructure Layer**: Cloud, Application, Security Stack
- **License Type**: Proprietary / Open Source (mixed context: GCP is proprietary, Tink/BoringSSL are open source libraries used within it)
- **License**: Not stated
- **Latest Version**: Unknown
- **Release Date**: 2025-03-24 (Presentation date)
- **FIPS Validated**: No mention of specific FIPS validation status in text.
- **Primary Platforms**: Google Cloud Platform (GCP), Chrome, Chromium
- **Target Industries**: Enterprise, Finance (FS-ISAC mentioned), Telco (GSMA mentioned), General Cloud Users
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Phase 1: Architectural Readiness (Secure by Design, key inventory); Phase 2: Roll Out (enabling customer workloads). Prioritizing ML-KEM implementation. Moving from engineering insights to adoption strategy.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Quantum-Safe Signatures (specific algorithms not named beyond general reference to NIST standards), Digital Signing via PKI/SW/HW signatures.
- **Authoritative Source URL**: https://cloud.google.com/blog/products/identity-security/cloud-ciso-perspectives-why-we-need-to-get-ready-for-pqc

---

## CryptoNext Quantum-Safe Library

- **Category**: Cryptographic Libraries
- **Product Name**: CryptoNext Quantum-Safe Library
- **Product Brief**: A NIST-validated post-quantum cryptographic library developed in C, C++, and Assembly with wrappers for Go, Rust, Python, and Java.
- **PQC Support**: Yes (NIST-validated ML-KEM, ML-DSA, SLH-DSA; supports FrodoKEM, Falcon, XMSS)
- **PQC Capability Description**: First EU library NIST-validated for ML-KEM, ML-DSA, and SLH-DSA. Supports key exchange (ML-KEM, FrodoKEM) and signatures (ML-DSA, SLH-DSA, Falcon, XMSS). Features crypto-agile API, side-channel attack resistance, and versions for Standard, Embedded, and Side-Channel Attack Resistant environments.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ML-KEM, FrodoKEM, ML-DSA, SLH-DSA, Falcon, XMSS
- **Key Management Model**: Not stated (Random number generator provided as a parameter; no specific key management architecture described)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library (C, C++, Assembly with language wrappers)
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (Validated by NIST CAVP for ML-DSA, SLH-DSA, and ML-KEM; references FIPS 203, FIPS 204, FIPS 205)
- **Primary Platforms**: General-purpose or embedded platforms; supports C, C++, Assembly, Go, Rust, Python, Java
- **Target Industries**: Banking, Finance, Defense, Energy, Aerospace, Public Sector
- **Regulatory Status**: NIST CAVP validated for ML-DSA, SLH-DSA, and ML-KEM
- **PQC Roadmap Details**: Supports integration of new standardized algorithms upon official release; references 2035 deadline for traditional cryptography in public sector.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: ML-DSA, SLH-DSA, Falcon, XMSS
- **Authoritative Source URL**: Unknown

---

## DigiCert TrustCore SDK

- **Category**: Cryptographic Libraries
- **Product Name**: DigiCert TrustCore SDK
- **Product Brief**: Developer tools and cryptographic agility solutions to support post-quantum cryptography migration.
- **PQC Support**: Planned (with timeline)
- **PQC Capability Description**: The document states industry leaders are using PQC in production and DigiCert supports the journey with developer tools, but does not explicitly state that TrustCore SDK currently implements specific PQC algorithms. It mentions NIST standards ML-KEM, ML-DSA, and SLH-DSA as the target for migration.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: RSA, ECC (mentioned as current vulnerable algorithms to be replaced); ML-KEM, ML-DSA, SLH-DSA (mentioned as NIST standards for future adoption).
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Not stated
- **Target Industries**: Enterprise, Government, Finance, Healthcare, Critical Infrastructure
- **Regulatory Status**: Not stated (Document mentions regulatory requirements like CNSA 2.0, CRA, DORA that the product helps address, but does not list specific licenses or charters for the product itself).
- **PQC Roadmap Details**: Mentions NIST finalized standards in 2024 (ML-KEM, ML-DSA, SLH-DSA); CNSA 2.0 mandates adoption by 2030; Gartner predicts current algorithms ineffective by 2029; migration window estimated at 3-4 years once CRQC arrives.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Current: RSA, ECC (implied as legacy); Planned/Target: ML-DSA, SLH-DSA.
- **Authoritative Source URL**: Not stated

---
