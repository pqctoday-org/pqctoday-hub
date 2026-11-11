---
generated: 2026-11-11
collection: library
documents_processed: 1
enrichment_method: manual-extraction, human-reviewed corrections to existing entries; every field not listed in a section below is unchanged from the generation the entry was carried forward from
---

## arXiv-2508-01694

- **Reference ID**: arXiv-2508-01694
- **Title**: Performance and Storage Analysis of CRYSTALS-Kyber as a Post-Quantum Replacement for RSA and ECC
- **Authors**: Cornell University
- **Publication Date**: 2025-08-30
- **Last Updated**: 2025-08-30
- **Document Status**: Preprint
- **Main Topic**: Empirical performance and storage analysis of CRYSTALS-Kyber as a post-quantum replacement for RSA and ECC.
- **PQC Algorithms Covered**: CRYSTALS-Kyber
- **Quantum Threats Addressed**: Shor's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Nicolas Rodriguez Alvarez; Fernando Rodriguez Merino
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC; SHA-1; SHA-2; AES
- **Key Takeaways**: The paper reports Kyber implementation experiments on commodity processors with built-in acceleration features. Its results must be interpreted for the tested implementations and platforms, not as a universal speed or size ranking. Companion public-key storage check using final ML-KEM-768 and RSA-3072 with exponent 65537: DER SubjectPublicKeyInfo sizes are 1,206 and 422 bytes respectively. Thus this concrete ML-KEM public-key encoding is larger, not smaller. These selected algorithms are not equivalent security targets, and storage size does not establish computation time.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Pure PQC KEM Support**: No
- **Pure PQC KEM Evidence**: None detected
- **Hybrid PQC KEM Support**: No
- **Hybrid PQC KEM Evidence**: None detected
- **Pure PQC Signature Support**: No
- **Pure PQC Signature Evidence**: None detected
- **Hybrid PQC Signature Support**: No
- **Hybrid PQC Signature Evidence**: None detected
- **PQC Heatmap Protocols Covered**: None applicable
- **PQC Heatmap Protocols Evidence**: None detected
- **Lifecycle State**: Draft
- **Performance & Size Considerations**: Measured with OpenSSL 3.6.3 generated sample keys: RSA-3072 modulus alone is 384 bytes, its complete PKCS#1 public key is 398 DER bytes, and its SubjectPublicKeyInfo is 422 DER bytes. ML-KEM-768 has 1,184 raw public-key bytes and a 1,206-byte DER SubjectPublicKeyInfo. All public-key files pass import checks. Compare like containers; a modulus is not a complete RSA public key. This companion measurement uses final ML-KEM, while the cited paper discusses Kyber implementations; no private-key, ciphertext or performance conclusion follows from these public-key byte counts.
- **Target Audience**: Researcher; Security Architect
- **Implementation Prerequisites**: For reproducing the paper, identify the exact implementation, processor and enabled acceleration features used in its experiments. AES-NI and ASIMD refer to different platform capabilities, not a requirement to possess both. The companion storage example uses the existing OpenSSL 3.6.3 RSA-3072 and ML-KEM-768 key generators and DER public-key exports; no specialized hardware accelerator is required for that example.
- **Relevant PQC Today Features**: Algorithms; Threats; Migrate
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Performance testing; empirical benchmarks
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: If migration follows the SHA-1 to SHA-2 pattern, prolonged periods of vulnerability during migration
- **Financial & Business Impact**: If migration follows the SHA-1 to SHA-2 pattern: substantial security and economic consequences from prolonged vulnerability
- **Organizational Readiness**: None detected
- **Math Family**: Lattice
- **PQC Round**: Standardised
- **Extraction Note**: carry-forward (DS05p2): record not iterated this run; preserved from prior enrichment

---
