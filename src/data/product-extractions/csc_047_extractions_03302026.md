---
generated: 2026-03-30
collection: csc_047
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## QuintessenceLabs qStream

- **Category**: Quantum Random Number Generator (QRNG)
- **Product Name**: QuintessenceLabs qStream
- **Product Brief**: High-speed, full entropy quantum random number generator (QRNG) available as an appliance or PCIe card.
- **PQC Support**: No
- **PQC Capability Description**: The document describes a Quantum Random Number Generator (QRNG) using quantum technology for true random number generation. It does not mention Post-Quantum Cryptography (PQC) algorithms, migration plans, or PQC-specific implementations.
- **PQC Migration Priority**: Not stated
- **Crypto Primitives**: Not stated (Document mentions support for KMIP and PKCS#11 interfaces but does not list specific cryptographic primitives like ECDSA, RSA, or PQC algorithms).
- **Key Management Model**: Supports OASIS Key Management Interoperability Protocol (KMIP) for interoperability with key management servers; integrates with QuintessenceLabs Trusted Security Foundation® (TSF®) key and policy manager.
- **Supported Blockchains**: Not stated
- **Architecture Type**: Hardware-based QRNG (Quantum Random Number Generator); available as a PCIe Gen 2 card module or Rackmount Appliance.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (©2022 QuintessenceLabs. All rights reserved.)
- **Latest Version**: Not stated (Models qStream 100 and qStream 200 are listed, but no software version numbers are provided).
- **Release Date**: Not stated (Document copyright is 2022; Document ID: 1620).
- **FIPS Validated**: No (Document states it meets NIST SP 800-90A, 90B, 90C standards for Non-Deterministic Random Bit Generators and satisfies NIST SP 800-22 and Dieharder tests, but does not claim FIPS 140-2 or 140-3 validation).
- **Primary Platforms**: PCIe Gen 2 card module; Rackmount Appliance (1RU); supports running multiple Virtual Machines (VMs); delivered with qClientTM 100.
- **Target Industries**: Not stated (Mentions uses in data protection, numerical simulations, random sampling, and gaming).
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: www.quintessencelabs.com

---

## PQShield Core

- **Category**: Cryptographic SDKs & Libraries
- **Product Name**: PQCryptoLib-Core
- **Product Brief**: Highly configurable SW PQC Library for Classical, PQC and PQ/T Hybrid on Linux, Windows and Mac.
- **PQC Support**: Yes (NIST-standardized post-quantum and PQ/T Hybrid algorithms)
- **PQC Capability Description**: Provides latest NIST-standardized post-quantum and PQ/T Hybrid algorithms in a software environment. Optimized for crypto-agility and FIPS-compliant PQ/T Hybrid solutions to protect against 'Harvest Now Decrypt Later' attacks. Supports smooth transition to quantum resistance.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated (Text mentions "Classical, PQC and PQ/T Hybrid" but does not list specific algorithm names like ECDSA, Kyber, or Dilithium)
- **Key Management Model**: Not stated (Text mentions "Secure key provisioning" and "Secure key exchange" as use cases, but no specific architecture details)
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software Library
- **Infrastructure Layer**: Application
- **License Type**: Commercial
- **License**: Proprietary (Implied by "Contact us for an evaluation" and lack of open source license mention)
- **Latest Version**: Unknown
- **Release Date**: Unknown
- **FIPS Validated**: Yes (FIPS 140-3 CMVP Certified / CAVP Compliant)
- **Primary Platforms**: Linux, Windows, Mac (requires a C compiler)
- **Target Industries**: Semiconductors and Manufacturing, Identity and Paymentech, Military and Aerospace, System Integrators, Automotive, Industrial IoT, Network & Telecommunications, Enterprise Platforms, Healthcare
- **Regulatory Status**: FIPS 140-3 CMVP Certified / CAVP Compliant; NCSC Assured Consultancy mentioned in footer links
- **PQC Roadmap Details**: Not stated (Text mentions providing "latest NIST-standardized" algorithms but no specific future timeline or roadmap)
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Text mentions "Classical, PQC and PQ/T Hybrid" generally but does not list specific signature schemes)
- **Authoritative Source URL**: Unknown (Source filename provided as PQShield_Core.html, but no full URL in text)

---

## Bouncy Castle C\# / Java

- **Category**: Cryptographic SDKs & Libraries
- **Product Name**: PostQuantumCryptographyBc172 (Concept study using Bouncy Castle)
- **Product Brief**: A concept study application demonstrating Post-Quantum Cryptography algorithms using Bouncy Castle 1.72 on Android.
- **PQC Support**: Yes (with details: CRYSTALS-KYBER, CRYSTALS-DILITHIUM, FALCON, SPHINCS+, BIKE, Classic McEliece, HQC, NTRU, FRODO, SABER, NTRULPrime, SNTRUPrime, Picnic)
- **PQC Capability Description**: This is a concept study to run PQC algorithms using Bouncy Castle 1.72. It supports Public-key Encryption/KEMs (CRYSTALS-KYBER, BIKE, Classic McEliece, HQC, NTRU, FRODO, SABER, NTRULPrime, SNTRUPrime) and Digital Signatures (CRYSTALS-DILITHIUM, FALCON, SPHINCS+, Picnic). SIKE is excluded as broken; Rainbow is noted as not available in this version. The app generates key pairs, encodes keys to byte arrays, performs KEM key exchange/encryption/decryption, and signature sign/verify flows.
- **PQC Migration Priority**: Low (Concept study/research application)
- **Crypto Primitives**: CRYSTALS-KYBER, CRYSTALS-DILITHIUM, FALCON, SPHINCS+, BIKE, Classic McEliece, HQC, NTRU, FRODO, SABER, NTRULPrime, SNTRUPrime, Picnic
- **Key Management Model**: Programmatic generation of asymmetric key pairs with parameter sets; keys encoded to byte arrays for storage and rebuilt from encoded form.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer cryptographic library implementation (Bouncy Castle)
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: Not stated
- **Latest Version**: 1.72 (Bouncy Castle version used)
- **Release Date**: 2022-11-01 (Last commit date for the repository)
- **FIPS Validated**: No
- **Primary Platforms**: Android (Java), implied desktop via Bouncy Castle Java/C# context but text focuses on AndroidManifest.xml
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated (Document describes a static concept study using existing Bouncy Castle 1.72 features)
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: CRYSTALS-DILITHIUM, FALCON, SPHINCS+, Picnic
- **Authoritative Source URL**: https://github.com/MichaelsPlayground/PostQuantumCryptographyBc172

---
