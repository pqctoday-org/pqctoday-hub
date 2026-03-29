---
generated: 2026-03-26
collection: csc_011
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---


## Telegram

- **Category**: Secure Messaging and Communication
- **Product Name**: Telegram
- **Product Brief**: Cloud-based mobile and desktop messaging app with a focus on security and speed using MTProto.
- **PQC Support**: No
- **PQC Capability Description**: The document explicitly states reliance on "classical crypto algorithms" (AES, SHA-256, RSA, DH). There is no mention of Post-Quantum Cryptography (PQC) algorithms, hybrid modes, or migration plans.
- **PQC Migration Priority**: Low
- **Crypto Primitives**: AES-256, SHA-256, SHA-1 (limited use), RSA, Diffie-Hellman (DH), IGE mode
- **Key Management Model**: Client-generated authorization keys stored on device; server-side public RSA key built into client; session-specific keys derived from auth_key and message content.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Custom protocol (MTProto) with client-server encryption and end-to-end encryption layers
- **Infrastructure Layer**: Application, Network
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: MTProto 2.0
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Mobile (iPhone/iPad, Android), Desktop (PC/Mac/Linux), Web-browser
- **Target Industries**: Consumer Messaging
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: RSA (for server authentication during DH exchange); No specific digital signature scheme listed for message signing, relies on MAC-like verification via SHA-256 of auth_key fragment and plaintext.
- **Authoritative Source URL**: Not stated

---

## WhatsApp

- **Category**: Secure Messaging and Communication
- **Product Name**: WhatsApp
- **Product Brief**: A messaging and calling platform with built-in security layers, spam detection, and privacy controls.
- **PQC Support**: No
- **PQC Capability Description**: The document does not mention Post-Quantum Cryptography (PQC), specific PQC algorithms, or any migration plans related to quantum resistance. It only mentions general "world-class security" and "layers of protection."
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: Not stated
- **Key Management Model**: Not stated
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Not stated
- **Infrastructure Layer**: Application
- **License Type**: Proprietary
- **License**: Not stated
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No
- **Primary Platforms**: Android, iPhone, Mac/PC, WhatsApp Web
- **Target Industries**: Not stated
- **Regulatory Status**: Not stated
- **PQC Roadmap Details**: Not stated
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated
- **Authoritative Source URL**: Not stated

---
