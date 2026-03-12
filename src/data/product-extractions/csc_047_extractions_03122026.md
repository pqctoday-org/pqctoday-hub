---
generated: 2026-03-12
collection: csc_047
documents_processed: 1
enrichment_method: ollama-qwen3.5:27b
---

## Qrypt BLAST SDK

- **Category**: Quantum Random Number Generator (QRNG)
- **Product Name**: Qrypt BLAST SDK
- **Product Brief**: SDK enabling quantum-secure key generation at multiple endpoints without transmission using Doubly-Affine Extractors.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The product enables "quantum-secure key generation" and claims to "exceed Federal NIST Mandates" by eliminating key transmission alongside PQC algorithm transition. It utilizes "Doubly-Affine Extractors" for information-theoretic security, allowing identical keys to be generated locally at endpoints without distribution. It is designed to protect data against future quantum computers breaking RSA and PQC encryption.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: Doubly-Affine Extractors, TLS (mentioned in attack scenarios), One-Time Pad (OTP)
- **Key Management Model**: Architecture based on generating identical keys at multiple endpoints without transmission; uses "Doubly-Affine Extractors" to locally extract keys from returned random numbers; relies on a network of semi-trusted servers for outsourcing storage of long keys.
- **Supported Blockchains**: Not applicable
- **Architecture Type**: Doubly-Affine Extractor-based key generation with outsourced storage via semi-trusted servers
- **Infrastructure Layer**: Application, Cloud
- **License Type**: Commercial
- **License**: Proprietary (Access token required; contact to obtain)
- **Latest Version**: Unknown
- **Release Date**: 2024-10-15 (Whitepaper date mentioned)
- **FIPS Validated**: No mention of FIPS validation status
- **Primary Platforms**: Client library SDKs, cloud-based REST services, command line clients; NVIDIA Quantum Secure Gateway mentioned as related documentation
- **Target Industries**: Enterprise, Federal/Government, Multicloud/Hybrid Cloud environments
- **Regulatory Status**: Mentions exceeding "Federal NIST Mandates"
- **PQC Roadmap Details**: Product is positioned to help complete the transition to PQC algorithms while eliminating key transmission; no specific algorithm migration timeline provided.
- **Consensus Mechanism**: Not applicable
- **Signature Schemes**: Not stated (Focus is on key generation and encryption, not digital signatures)
- **Authoritative Source URL**: Unknown (Document text contains navigation links but no explicit base URL string)

---
