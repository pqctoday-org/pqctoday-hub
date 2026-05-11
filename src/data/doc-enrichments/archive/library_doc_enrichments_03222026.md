---
generated: 2026-03-22
collection: library
documents_processed: 1
enrichment_method: ollama-qwen3.5:27b
---

## draft-ietf-pquip-pqc-hsm-constrained-03

- **Reference ID**: draft-ietf-pquip-pqc-hsm-constrained-03
- **Title**: Adapting Constrained Devices for Post-Quantum Cryptography
- **Authors**: IETF PQUIP WG
- **Publication Date**: 2025-06-15
- **Last Updated**: 2026-01-26
- **Document Status**: Internet-Draft
- **Main Topic**: Guidance on integrating Post-Quantum Cryptography into resource-constrained devices such as IoT nodes and lightweight HSMs, covering seed-based key generation, ephemeral key handling, and firmware authentication.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, HSS/LMS, HQC, FN-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United Kingdom; UK National Cyber Security Centre
- **Leaders Contributions Mentioned**: T. Reddy; D. Wing; B. Salter; K. Kwiatkowski
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IEEE Std 802.1AR
- **Infrastructure Layers**: Hardware Security Modules (HSMs), Trusted Execution Environments (TEEs), secure elements, Key Management, Firmware Authentication
- **Standardization Bodies**: IETF, NIST, ISO, IEEE
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, RFC 8554, RFC 5280, RFC 3394, BCP 78, BCP 79, ISO 19790, PKCS#11
- **Classical Algorithms Referenced**: AES, Winternitz One-Time Signature (WOTS+), Merkle tree
- **Key Takeaways**: Store seeds instead of expanded private keys to minimize persistent storage on constrained devices; Balance storage efficiency against computational overhead when choosing between seed-only or full key storage models; Use strong symmetric encryption like AES in key-wrap mode for exporting seeds and private keys; Implement hybrid signature approaches for post-quantum firmware authentication; Optimize memory footprint using lazy expansion and pre-hashing techniques for lattice-based schemes.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Signature Approaches
- **Performance & Size Considerations**: ML-DSA key generation involves polynomial operations using NTT and hashing; SLH-DSA key generation requires constructing a Merkle tree and multiple WOTS+ calls; PQC algorithms have substantially larger key sizes than classical algorithms.
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: Hardware-backed cryptographic modules; Secure storage for seeds or private keys; Support for AES in key-wrap mode; Capability to derive private keys from seeds efficiently; Mutual-authenticated TLS session capability for direct transfer.
- **Relevant PQC Today Features**: iot-ot-pqc, hsm-pqc, stateful-signatures, code-signing, algorithms

---
