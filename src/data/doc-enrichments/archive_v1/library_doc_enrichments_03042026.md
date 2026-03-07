---
generated: 2026-03-04
collection: library
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## ANSSI PQC Follow-up Paper

- **Reference ID**: ANSSI PQC Follow-up Paper
- **Title**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **Authors**: ANSSI France
- **Publication Date**: 2023-12-01
- **Last Updated**: 2023-12-01
- **Document Status**: Position Paper
- **Main Topic**: None detected
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: None detected
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: None detected
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: None detected

---

## PKCS11-V31-OASIS

- **Reference ID**: PKCS11-V31-OASIS
- **Title**: PKCS #11 Specification Version 3.1 (OASIS Standard)
- **Authors**: OASIS PKCS11 Technical Committee
- **Publication Date**: 2023-07-23
- **Last Updated**: 2023-07-23
- **Document Status**: OASIS Standard
- **Main Topic**: PKCS #11 Specification Version 3.1 defines data types, functions, and mechanisms for the Cryptoki interface, including the first inclusion of PQC algorithms LMS and HSS.
- **PQC Algorithms Covered**: LMS; HSS
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Robert Relyea (Chair); Greg Scott (Chair); Dieter Bong (Editor); Tony Cox (Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; WTLS
- **Infrastructure Layers**: Cryptographic Token Interface; HSM
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4; BCP 14; RFC2119; RFC8174
- **Classical Algorithms Referenced**: RSA; DSA; ECDSA; EdDSA; XEdDSA; Diffie-Hellman; SHA-1; SHA-224; SHA-256; SHA-384; SHA-512; SHA3; MD2; MD5; RIPE-MD 128; RIPE-MD 160; AES
- **Key Takeaways**: PKCS #11 v3.1 is the first version to support PQC algorithms LMS and HSS for code signing and firmware verification; The specification adds EdDSA mechanisms and incremental MAC operations; Implementations must adhere to OASIS IPR Policy under RF on RAND Terms Mode; Machine-readable content in plain text files prevails over prose narrative discrepancies.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: C or C++ compiler support for structure packing and pointer-related macros; Subscription to OASIS TC public comment list for feedback; Adherence to BCP 14 key word interpretation rules.
- **Relevant PQC Today Features**: stateful-signatures; code-signing; hsm-pqc; algorithms

---

## PKCS11-V32-OASIS

- **Reference ID**: PKCS11-V32-OASIS
- **Title**: PKCS #11 Specification Version 3.2 (Committee Specification Draft)
- **Authors**: OASIS PKCS11 Technical Committee
- **Publication Date**: 2025-04-16
- **Last Updated**: 2025-04-16
- **Document Status**: Committee Specification Draft
- **Main Topic**: PKCS #11 Specification Version 3.2 defines data types, functions, and mechanisms for post-quantum cryptography including ML-KEM, ML-DSA, and SLH-DSA within the Cryptoki interface.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valerie Fenwick (Chair); Robert Relyea (Chair); Dieter Bong (Editor); Greg Scott (Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, WTLS
- **Infrastructure Layers**: HSM, Key Management
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA, EdDSA, XEdDSA, Diffie-Hellman, AES, SHA-1, HMAC
- **Key Takeaways**: PKCS #11 v3.2 introduces native support for ML-KEM, ML-DSA, and SLH-DSA mechanisms; New functions C_EncapsulateKey and C_DecapsulateKey enable KEM operations; New key types CKK_ML_KEM, CKK_ML_DSA, and CKK_SLH_DSA are defined; Attributes CKA_PARAMETER_SET, CKA_ENCAPSULATE, CKA_DECAPSULATE, and CKA_SEED support PQC key management; The specification supersedes PKCS #11 Specification Version 3.1
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: C or C++ compiler; PKCS #11 header files (pkcs11.h, pkcs11f.h, pkcs11t.h)
- **Relevant PQC Today Features**: Algorithms, hsm-pqc, crypto-agility, tls-basics, pki-workshop

---
