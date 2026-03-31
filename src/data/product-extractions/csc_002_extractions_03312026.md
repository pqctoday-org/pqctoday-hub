---
generated: 2026-03-31
collection: csc_002
documents_processed: 2
enrichment_method: ollama-qwen3.5:27b
---

## Eviden Trustway Proteccio NetHSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Trustway Proteccio NetHSM
- **Product Brief**: Highly certified Hardware Security Module (HSM) offering secure cryptographic operations and PQC readiness.
- **PQC Support**: Yes (with details)
- **PQC Capability Description**: The product is described as "PQC ready" and aligned with NIST recommendations to protect against "store now, decrypt later" threats. It supports specific post-quantum algorithms: ML-DSA (Signature), SLH-DSA (Signature), and ML-KEM (Key exchange). A virtual HSMaaS version is available for testing PQC live.
- **PQC Migration Priority**: High
- **Crypto Primitives**: RSA, AES, 3DES, ECDSA, MD5, SHA-1, SHA-256, SHA-384, SHA-512, ML-DSA, SLH-DSA, ML-KEM
- **Key Management Model**: Hardware Security Module (HSM) with tamper-proof design, secure key generation, and key storage within a certified cryptographic core.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (2U 19in. Rack mount appliance)
- **Infrastructure Layer**: Hardware
- **License Type**: Commercial
- **License**: Proprietary
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: No (Document mentions Common Criteria EAL4+, ANSSI QR Enhanced Qualification, NATO SECRET, eIDAS SOG-IS, but does not explicitly state FIPS 140-2 or 140-3 validation)
- **Primary Platforms**: On-premise, Virtual, Cloud (via HSMaaS), Private Cloud
- **Target Industries**: Government, Critical Infrastructure, Defense, Finance, Enterprise
- **Regulatory Status**: Common Criteria EAL4+, ANSSI QR (Enhanced Qualification), NATO SECRET, eIDAS SOG-IS
- **PQC Roadmap Details**: Aligned with NIST recommendations; supports ML-DSA, SLH-DSA, and ML-KEM; offers free access to virtual HSMaaS for testing PQC.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: RSA PSS, PKCS v1.5, ECDSA, ML-DSA, SLH-DSA
- **Authoritative Source URL**: Not stated (Source text provided as HTML content without a specific URL string)

---

## Utimaco uTrust HSM

- **Category**: Hardware Security Module (HSM) Software
- **Product Name**: Utimaco uTrust HSM (specifically Quantum Protect application package for u.trust GP HSM Se-Series)
- **Product Brief**: Application package extending u.trust GP HSM Se-Series with standardized Post Quantum Cryptography algorithms.
- **PQC Support**: Yes (with details: ML-KEM, ML-DSA, LMS, XMSS, HSS, XMSS-MT; SLH-DSA in progress)
- **PQC Capability Description**: Offers lattice-based algorithms ML-KEM (FIPS 203) and ML-DSA (FIPS 204), and stateful hash-based signature schemes LMS, HSS, XMSS, and XMSS-MT. SLH-DSA (FIPS 205) is in progress. Designed as a crypto-agile in-field firmware upgrade for u.trust GP HSM Se-Series without hardware exchange. Includes a free simulator for evaluation.
- **PQC Migration Priority**: Unknown
- **Crypto Primitives**: ML-KEM, ML-DSA, LMS, HSS, XMSS, XMSS-MT, SLH-DSA (in progress)
- **Key Management Model**: Hardware Security Module (HSM) backed; supports in-field firmware upgrade for algorithm addition.
- **Supported Blockchains**: Not stated
- **Architecture Type**: HSM-based (General Purpose HSM Se-Series with application package)
- **Infrastructure Layer**: Hardware, Security Stack
- **License Type**: Commercial
- **License**: Proprietary (Commercial)
- **Latest Version**: Not stated
- **Release Date**: Not stated
- **FIPS Validated**: Yes (ML-KEM FIPS 203, ML-DSA FIPS 204, SLH-DSA FIPS 205 in progress; General HSM mentions FIPS 140-2)
- **Primary Platforms**: u.trust General Purpose HSM Se-Series
- **Target Industries**: Finance, Enterprise, Government (implied by compliance standards like FedRAMP, DORA, NIS2)
- **Regulatory Status**: Mentions Common Criteria (CC), FIPS 140-2, ISO 9001, ISO 14001, NITES VS-NfD, FISMA, FedRAMP, FICAM, eIDAS, GDPR, DORA, NIS2, PCI DSS.
- **PQC Roadmap Details**: SLH-DSA (FIPS 205) is on the roadmap/in progress; solution designed for crypto-agile in-field upgrades.
- **Consensus Mechanism**: Not stated
- **Signature Schemes**: ML-DSA, LMS, HSS, XMSS, XMSS-MT, SLH-DSA (in progress)
- **Authoritative Source URL**: Not stated

---
