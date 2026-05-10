---
generated: 2026-04-17
collection: library
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## TCG-TPM-V185-Part0

- **Reference ID**: TCG-TPM-V185-Part0
- **Title**: TCG TPM 2.0 Library V1.85 RC4 — Part 0: Introduction
- **Authors**: Trusted Computing Group
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Draft Specification
- **Main Topic**: Overview and change summary for the TCG TPM 2.0 Library V1.85 RC4 specification introducing PQC algorithm IDs and buffer size increases.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: David Wooten (TPM 2.0 architecture development and documentation); Jiajing Zhu (code contribution); Paul England (code contribution); Brad Litterell (Chair of TPM Working Group); Chris Fenner (Chair of TPM Working Group); Ken Goldman (Chair of TPM Working Group, editor); David Challener (Chair of TPM Working Group); David Grawrock (Chair of TPM Working Group, editor); Julian Hammersley (Chair of TPM Working Group); Graeme Proudler (Chair of TPM Working Group); Ari Singer (Chair of TPM Working Group)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Trusted Platform Module; Root of Trust for Measurement; Root of Trust for Storage; Root of Trust for Reporting
- **Standardization Bodies**: Trusted Computing Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: TPM 2.0 Library V1.85 RC4 introduces algorithm IDs TPM_ALG_MLKEM (0x00A0) and TPM_ALG_MLDSA (0x00A1); TPM_BUFFER_MAX is enlarged from 4096 to 8192 bytes to accommodate ML-DSA-87 signatures; This document is an intermediate draft for comment only and products should not be designed based on it; Microsoft contributed code written by David Wooten, Jiajing Zhu, and Paul England
- **Security Levels & Parameters**: TPM_ALG_MLKEM=0x00A0; TPM_ALG_MLDSA=0x00A1; ML-DSA-87; TPM_BUFFER_MAX 4096 bytes to 8192 bytes
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: TPM_BUFFER_MAX increased from 4096 to 8192 bytes; Accommodates ML-DSA-87 signatures
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, hsm-pqc, crypto-agility, iot-ot-pqc
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: TCG-TPM-V185-Part0-Introduction.pdf (304,175 bytes, 13,503 extracted chars)
- **Extraction Timestamp**: 2026-04-17T15:26:10

---

## TCG-TPM-V185-Part1

- **Reference ID**: TCG-TPM-V185-Part1
- **Title**: TCG TPM 2.0 Library V1.85 RC4 — Part 1: Architecture
- **Authors**: Trusted Computing Group
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Draft Specification
- **Main Topic**: Defines the TPM 2.0 architecture including the four-hierarchy model and specifies PQC key roles and impacts of ML-KEM-768 and ML-DSA-65 adoption.
- **PQC Algorithms Covered**: ML-KEM-768; ML-DSA-65
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: TPM; Key Management
- **Standardization Bodies**: Trusted Computing Group (TCG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines the four-hierarchy model for TPM 2.0 including Platform, Endorsement, Storage, and Owner; Specific handle values are assigned to hierarchies such as TPM_RH_ENDORSEMENT=0x4000000B; PQC key roles include EK, SRK, AIK, and IDevID; Adoption of ML-KEM-768 and ML-DSA-65 impacts attestation flows; The specification addresses the impact on TPM_BUFFER_MAX.
- **Security Levels & Parameters**: ML-KEM-768; ML-DSA-65
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Impact on TPM_BUFFER_MAX mentioned without specific byte values
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, hsm-pqc, digital-id, entropy-randomness, pki-workshop
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: Random Number Generator (RNG) Module
- **Constrained Device & IoT Suitability**: TPM Architecture; Size Requirements for RAM and NV Memory
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: TCG-TPM-V185-Part1-Architecture.pdf (3,303,731 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-17T15:29:02

---

## TCG-TPM-V185-Part2

- **Reference ID**: TCG-TPM-V185-Part2
- **Title**: TCG TPM 2.0 Library V1.85 RC4 — Part 2: Structures
- **Authors**: Trusted Computing Group
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Draft Specification
- **Main Topic**: Normative structure definitions for Trusted Platform Module 2.0 Library Version 1.85 RC4 including PQC algorithm assignments and key size constants.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Trusted Platform Module 2.0
- **Standardization Bodies**: Trusted Computing Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: TPM_ALG_MLKEM assigned value 0x00A0 and TPM_ALG_MLDSA assigned value 0x00A1; ML-KEM-768 public key size is 1184 bytes with ciphertext size of 1088 bytes; ML-DSA-65 public key size is 1952 bytes with signature size of 3309 bytes; TPM_BUFFER_MAX and TPM2B_MAX_BUFFER sizes are set to 8192
- **Security Levels & Parameters**: ML-KEM-768, ML-DSA-65
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-KEM-768 pk=1184B; ML-KEM-768 ct=1088B; ML-DSA-65 pk=1952B; ML-DSA-65 sig=3309B; TPM_BUFFER_MAX=8192
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, hsm-pqc, pki-workshop
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: TCG-TPM-V185-Part2-Structures.pdf (888,721 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-17T15:31:24

---

## TCG-TPM-V185-Part3

- **Reference ID**: TCG-TPM-V185-Part3
- **Title**: TCG TPM 2.0 Library V1.85 RC4 — Part 3: Commands
- **Authors**: Trusted Computing Group
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Draft Specification
- **Main Topic**: Command specification for TPM 2.0 V1.85 RC4 defining PQC key roles using ML-KEM-768 and ML-DSA-65.
- **PQC Algorithms Covered**: ML-KEM-768, ML-DSA-65
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Trusted Platform Module 2.0
- **Standardization Bodies**: Trusted Computing Group
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-OAEP
- **Key Takeaways**: TPM2_CreatePrimary supports PQC key roles using ML-KEM-768 for EK/SRK; TPM2_Quote behavior is specified with ML-DSA signatures; TPM2_EncryptDecap replaces classical RSA-OAEP for KEM-based credential activation; Algorithm identifiers are defined as TPM_ALG_MLKEM=0x00A0 and TPM_ALG_MLDSA=0x00A1
- **Security Levels & Parameters**: ML-KEM-768, ML-DSA-65, TPM_ALG_MLKEM=0x00A0, TPM_ALG_MLDSA=0x00A1
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, hsm-pqc, pki-workshop, digital-id
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: TPM2_SelfTest, TPM2_IncrementalSelfTest, TPM2_GetTestResult
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: TCG-TPM-V185-Part3-Commands.pdf (1,130,611 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-17T15:34:23

---
