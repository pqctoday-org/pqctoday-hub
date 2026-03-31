---
generated: 2026-03-30
collection: csc_011
documents_processed: 1
enrichment_method: ollama-qwen3.5:27b
---

## Tuta Mail

- **Category**: Secure Messaging and Communication
- **Product Name**: Tuta Mail
- **Product Brief**: End-to-end encrypted email provider featuring TutaCrypt, a hybrid post-quantum encryption protocol.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: Tuta Mail uses TutaCrypt, a hybrid protocol combining CRYSTALS-Kyber (ML-KEM) for key encapsulation and X25519 (ECDH) for key exchange. Enabled by default for new accounts; rolling out to existing users. Protects against "Harvest Now, Decrypt Later" attacks.
- **PQC Migration Priority**: High
- **Crypto Primitives**: CRYSTALS-Kyber (Kyber-1024), X25519, AES-256, HMAC-SHA-256, Argon2, HKDF-SHA-256, RSA-2048 (legacy)
- **Key Management Model**: Hybrid protocol with server-side encrypted private keys derived from user passwords using Argon2; generates two key pairs per user (X25519 and Kyber-1024).
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Hybrid cryptographic protocol (PQC + Classical)
- **Infrastructure Layer**: Application
- **License Type**: Open Source/Commercial
- **License**: Not stated (Text mentions "open source project" and GitHub repository but does not specify the license name)
- **Latest Version**: Not stated
- **Release Date**: 2024-03-11
- **FIPS Validated**: No
- **Primary Platforms**: Tuta apps (specific OS versions not listed), Web
- **Target Industries**: General consumer, Secure communication
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Rolling out to existing users via key rotation; planning formal verification with University of Wuppertal; long-term aim to implement full PQMail protocol for Perfect Forward Secrecy and Future Secrecy; added key verification in August 2025.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Text mentions CRYSTALS-Dilithium as ML-DSA chosen by NIST but does not explicitly state Tuta Mail currently implements it for signatures, only Kyber for KEM and X25519 for ECDH)
- **Authoritative Source URL**: Not stated (Text references "our website" and "GitHub repository" but provides no specific URLs)

---
