---
generated: 2026-04-19
collection: library
documents_processed: 1
enrichment_method: manual+agent
---

## NIST-SP-800-133r3-ipd

- **Reference ID**: NIST-SP-800-133r3-ipd
- **Title**: SP 800-133 Rev. 3 (IPD): Recommendation for Cryptographic Key Generation
- **Authors**: Quynh Dang; Dustin Moody; Andrew Regenscheid; Hamilton Silberg (NIST)
- **Publication Date**: 2026-04-17
- **Last Updated**: 2026-04-17
- **Document Status**: Initial Public Draft
- **Main Topic**: Guidance for generating cryptographic keys for use with approved algorithms. Rev. 3 integrates PQC key generation (ML-KEM, ML-DSA), introduces KEM-based symmetric key establishment, and expands seed-expansion methods via SHAKE and DRBGs. Aligns randomness guidance with SP 800-90C.
- **PQC Algorithms Covered**: ML-KEM (FIPS 203), ML-DSA (FIPS 204); seed-based deterministic key generation using SHAKE-128/256 and SP 800-90A DRBGs
- **Quantum Threats Addressed**: Harvest-now-decrypt-later (HNDL) risk mitigated by transitioning key generation to PQC algorithms; classical asymmetric key generation (RSA, ECDH) is quantum-vulnerable
- **Migration Timeline Info**: Public comment period closes June 16, 2026; final publication expected late 2026; applicable to federal agencies under FISMA and OMB Circular A-130
- **Applicable Regions / Bodies**: United States (federal); Global (advisory); NIST, U.S. Department of Commerce
- **Leaders Contributions Mentioned**: Quynh Dang (lead author); Dustin Moody (author); Andrew Regenscheid (author); Hamilton Silberg (author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: KEM-based key establishment; seed derivation for asymmetric key pairs; DRBG-based key generation
- **Infrastructure Layers**: HSM firmware; cryptographic libraries; key management systems; PKCS#11 tokens
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: FIPS 203 (ML-KEM); FIPS 204 (ML-DSA); FIPS 186-5; SP 800-90A; SP 800-90B; SP 800-90C; SP 800-56C Rev. 2; SP 800-108 Rev. 1; FISMA 2014; OMB Circular A-130
- **Classical Algorithms Referenced**: RSA; DSA; ECDH; ECDSA; DH; symmetric AES; Triple-DES (deprecated)
- **Key Takeaways**: First NIST SP 800-133 revision to include KEM-based symmetric key generation (ML-KEM); Asymmetric PQC key pairs (ML-DSA, ML-KEM) can now be generated deterministically from a seed using SHAKE or DRBG expansion; SP 800-90C alignment tightens entropy requirements for all key generation paths; Seed management becomes a critical security primitive — loss or compromise of a root seed exposes all derived keys; Hybrid key generation (classical + PQC from shared seed) is acknowledged but scoped to transition guidance.
- **Security Levels & Parameters**: ML-KEM-512 (L1), ML-KEM-768 (L3), ML-KEM-1024 (L5); ML-DSA-44 (L1), ML-DSA-65 (L3), ML-DSA-87 (L5)
- **Hybrid & Transition Approaches**: Hybrid key generation acknowledged for transition period; classical + PQC key pairs can be derived from a common seed for interoperability during migration
- **Performance & Size Considerations**: Seed-based deterministic generation reduces HSM entropy consumption; SHAKE expansion is computationally lightweight vs. full DRBG instantiation per key
- **Target Audience**: Security Architect, Developer, Compliance Officer, HSM Vendor, Cryptographic Module Developer
- **Implementation Prerequisites**: SP 800-90A/B/C-compliant entropy source; FIPS 203/204-capable cryptographic library; secure seed storage (HSM or equivalent)
- **Relevant PQC Today Features**: entropy-randomness, hsm-pqc, kms-pqc, standards-bodies, algorithms
- **Implementation Attack Surface**: Root seed compromise exposes all derived keys; DRBG backtracking attacks if seed reused across instantiations; inadequate entropy source undermining key generation security
- **Cryptographic Discovery & Inventory**: Key generation audit trails; inventory of asymmetric key generation methods in use; identify RSA/ECDH key generation for PQC migration
- **Testing & Validation Methods**: ACVP test vectors for ML-KEM and ML-DSA key generation; CMVP validation of DRBG and entropy source; known-answer tests (KATs) for seed-expansion paths
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: Requires SP 800-90B-validated entropy source; QRNG hardware qualifies as entropy source under SP 800-90B; SP 800-90C RBG constructions provide the randomness layer
- **Constrained Device & IoT Suitability**: Seed-based deterministic generation is suitable for constrained devices; reduces per-key entropy demands; SHAKE expansion preferred over full DRBG for resource-limited environments
- **Supply Chain & Vendor Risk**: HSM and crypto library vendors must update key generation APIs to support PQC seed expansion; CMVP re-validation required for modules implementing new methods
- **Deployment & Migration Complexity**: Migration from classical key generation to PQC requires updating HSM firmware, PKCS#11 mechanisms, and key management policies; seed management infrastructure is a new operational requirement
- **Financial & Business Impact**: CMVP re-validation costs for affected cryptographic modules; HSM firmware upgrade costs; potential timeline impact if final publication delayed past late 2026
- **Organizational Readiness**: Federal agencies must plan for SP 800-133 Rev. 3 adoption as part of PQC migration programs per OMB M-23-02; commercial organizations should align with timeline for FIPS 203/204 adoption
- **Extraction Note**: Manual enrichment from IPD abstract, NIST CSRC IPD page, and agent-extracted content; Rev. 3 IPD published 2026-04-17
- **Source Document**: NIST-SP-800-133r3-ipd.pdf (512,507 bytes)
- **Extraction Timestamp**: 2026-04-19T00:00:00

---
