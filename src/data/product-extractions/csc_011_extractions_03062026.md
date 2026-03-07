---
generated: 2026-03-06
collection: csc_011
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## Apple PQ3 / CoreCrypto

- **Category**: Secure Messaging and Communication
- **Product Name**: iMessage with PQ3
- **Product Brief**: End-to-end encrypted messaging protocol with Level 3 post-quantum security and self-healing rekeying.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements PQ3 protocol using Kyber (ML-KEM) for key encapsulation combined with Elliptic Curve cryptography in a hybrid design. Provides quantum security for initial key establishment and ongoing message exchange via periodic rekeying. Formally verified against classical and quantum adversaries.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: Kyber (ML-KEM), Elliptic Curve Diffie-Hellman (ECDH), Elliptic Curve cryptography (ECC), Digital Signatures, Double Ratchet
- **Key Management Model**: Hybrid design combining classical ECC and post-quantum Kyber; keys generated locally on device and protected by Secure Enclave; periodic in-band rekeying.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid (Classical + Post-Quantum)
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: iOS 17.4, iPadOS 17.4, macOS 14.4, watchOS 10.4 (Developer Preview/Beta/Public Release)
- **Release Date**: 2024-02-21
- **FIPS Validated**: Not stated
- **Primary Platforms**: iOS, iPadOS, macOS, watchOS
- **Target Industries**: Consumer Messaging
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Rolling out with iOS 17.4 and related OS versions; planned to fully replace existing protocol within all supported conversations in 2024.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Digital Signatures (Classical), Elliptic Curve signatures
- **Authoritative Source URL**: Not stated

---

## Signal

- **Category**: Secure Messaging and Communication
- **Product Name**: Signal Protocol / libsignal
- **Product Brief**: Platform-agnostic cryptographic library implementing the Signal protocol, Double Ratchet, and PQC key agreement primitives.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Implements PQXDH (Post-Quantum Extended Diffie-Hellman) and ML-KEM Braid protocols for post-quantum forward secrecy. PQXDH currently relies on discrete log hardness for mutual authentication while providing PQC key agreement. ML-KEM Braid uses ML-KEM for sparse continuous key agreement.
- **PQC Migration Priority**: High
- **Crypto Primitives**: X25519, X448, EdDSA (XEdDSA), VXEdDSA, AES-GCM, ML-KEM, Double Ratchet, Zero-knowledge proofs (zkgroup)
- **Key Management Model**: Programmatic key management via libsignal libraries; supports remote attestation for SGX enclaves and server-side HSMs; uses PIN-based Secure Value Recovery.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Software library with optional HSM/SGX attestation support
- **Infrastructure Layer**: Application
- **License Type**: Open Source
- **License**: AGPL-3.0 (GNU AGPLv3)
- **Latest Version**: 0.86.6
- **Release Date**: 2026-03-06
- **FIPS Validated**: No
- **Primary Platforms**: Android, iOS, Windows, macOS, Linux (via Java, Swift, TypeScript bindings over Rust)
- **Target Industries**: Secure Messaging and Communication
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: PQXDH and ML-KEM Braid are documented specifications; PQXDH revision relies on discrete log for authentication while providing PQC forward secrecy.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: XEdDSA (XEd25519, XEd448), VXEdDSA
- **Authoritative Source URL**: https://github.com/signalapp/libsignal

---

## Wire

- **Category**: Secure Messaging and Communication
- **Product Name**: Wire
- **Product Brief**: Secure messaging platform with end-to-end encryption using Proteus and MLS protocols.
- **PQC Support**: No
- **PQC Capability Description**: The document mentions "ciphersuite agility" in the context of MLS to allow future algorithm negotiation, but explicitly states current use of the Proteus Protocol (DoubleRatchet) and does not list any specific Post-Quantum Cryptography algorithms or implementations.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: Proteus Protocol, DoubleRatchet Protocol, Messaging Layer Security (MLS)
- **Key Management Model**: Uses pre-keys for secure conversation initiation; supports multi-device access; details on key formats (PKCS#8/PKCS#12) or specific management architecture are not stated.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer secure messaging with edge computing and zero knowledge architecture.
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: AGPL-3.0, GPL-3.0 (varies by repository)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Desktop, Mobile (Android, iOS), Web, Cloud, On-premises, Hybrid
- **Target Industries**: Enterprise, Government, Law Enforcement, SMB, Public Services, Critical Infrastructure
- **Regulatory Status**: NIS2 compliant, GDPR compliant, VS-NfD approved
- **PQC Roadmap Details**: Not stated (mentions ciphersuite agility for future adaptability but no specific PQC timeline or algorithms)
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: https://wire.com

---

## Element (Matrix Protocol)

- **Category**: Secure Messaging and Communication
- **Product Name**: Element
- **Product Brief**: Sovereign, interoperable, and secure real-time communication solutions built on the Matrix open standard.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention any Post-Quantum Cryptography (PQC) algorithms, implementations, or migration plans. It discusses classical cryptographic primitives (X25519, Ed25519) and security audits of the vodozemac library but contains no reference to PQC standards like CRYSTALS-Kyber or Dilithium.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: X25519, Ed25519, Olm (3DH), Megolm, ECIES
- **Key Management Model**: Authenticated key distribution using long-term identity keys and pre-keys signed by device keys; supports legacy pickle format for encryption.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Application-layer cryptographic protocol implementation (Olm/Megolm)
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: AGPLv3 (majority of software), with additional enterprise features available on a subscription basis.
- **Latest Version**: Unknown
- **Release Date**: 2026-03-06 (Date of latest blog post mentioned)
- **FIPS Validated**: No
- **Primary Platforms**: Web, Desktop (Windows, MacOS, Linux), Mobile (iOS, Android)
- **Target Industries**: Public sector, workplace environments, large organisations
- **Regulatory Status**: Compliance with the Cyber Resilience Act (CRA) mentioned.
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Ed25519 (used for device identity signatures and pre-key authentication)
- **Authoritative Source URL**: https://www.element.io

---
