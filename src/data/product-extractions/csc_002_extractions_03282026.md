---
generated: 2026-03-28
collection: csc_002
documents_processed: 1
enrichment_method: ollama-qwen3.5:27b
---

## Crypto4A QxEDGE

- **Category**: HSM & Hardware Security
- **Product Name**: Crypto4A QxEDGE (specifically the Quantum-Assured Security Module or QASM™)
- **Product Brief**: A hardware security module designed with post-quantum cryptographic principles embedded into its roots of trust and internal architecture.
- **PQC Support**: Yes (with details: Hybrid approach using traditional ECC and NIST-approved HSS for RoT, FW updates, attestation, and inter-HSM communications)
- **PQC Capability Description**: Implements a hybridized approach combining traditional ECDSA P-384 and NIST-approved HSS (Hierarchical Signature System). Uses PQC for firmware signing, secure boot validation, attestation keys, backup encryption, inter-HSM communication, access authentication, and logging integrity. Leverages proprietary Classic McEliece for inter-HSM transfers where standardized options were unavailable. Designed for crypto-agility to adopt future certified PQC algorithms via FW updates.
- **PQC Migration Priority**: Critical
- **Crypto Primitives**: ECDSA P-384, HSS (Hierarchical Signature System), AES-256-GCM, Classic McEliece
- **Key Management Model**: HSM-backed with immutable Roots of Trust (RoT) provisioned during manufacturing; private keys for RoT stored offline in manufacturing HSMs; hybrid traditional and PQC keying material.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based hardware security module with field-reprogrammable hardware engines and quantum-ready firmware updates.
- **Infrastructure Layer**: Hardware
- **License Type**: Proprietary
- **License**: Proprietary (implied by "proprietary solutions" and commercial context, specific license name not stated)
- **Latest Version**: Not stated
- **Release Date**: 2026-01 (Publication date of the whitepaper; product release date not explicitly stated)
- **FIPS Validated**: FIPS 140-3 Level 3 compliant for traditional cryptography; PQC capabilities are not currently required for this validation level but are implemented via hybrid design.
- **Primary Platforms**: Not stated (Hardware appliance form factor implied)
- **Target Industries**: Digital sovereignty, critical infrastructure, government, enterprise (implied by "national importance" and "digital trust")
- **Regulatory Status**: Designed to comply with FIPS certification requirements; references NIST guidance and IETF draft standards.
- **PQC Roadmap Details**: Advocates adoption of certified/standardized quantum-safe approaches as they become available; utilizes crypto-agility and FW update capabilities to evolve from proprietary solutions (e.g., Classic McEliece) to standardized algorithms.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ECDSA P-384, HSS (Hierarchical Signature System), Classic McEliece (for key agreement/transfers)
- **Authoritative Source URL**: Not stated

---
