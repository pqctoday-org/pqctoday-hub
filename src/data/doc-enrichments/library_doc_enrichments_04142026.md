---
generated: 2026-04-14
collection: library
documents_processed: 3
enrichment_method: ollama-qwen3.5:27b
---

## NIST-SP-800-230-ipd

- **Reference ID**: NIST-SP-800-230-ipd
- **Title**: Additional SLH-DSA Parameter Sets for Limited-Signature Use Cases (Initial Public Draft)
- **Authors**: NIST
- **Publication Date**: 2026-04-13
- **Last Updated**: 2026-04-13
- **Document Status**: Initial Public Draft
- **Main Topic**: NIST SP 800-230 extends FIPS 205 with six new SLH-DSA parameter sets optimized for limited-signature use cases like firmware and software signing.
- **PQC Algorithms Covered**: SLH-DSA, SPHINCS+
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Public Comments Period: April 13, 2026 – June 12, 2026
- **Applicable Regions / Bodies**: Regions: United States; Bodies: National Institute of Standards and Technology, U.S. Department of Commerce, Office of Management and Budget
- **Leaders Contributions Mentioned**: Quynh Dang (Author); Dustin Moody (Author); John Kelsey (provided insights)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: FIPS 205, Federal Information Security Modernization Act (FISMA) of 2014, OMB Circular A-130
- **Classical Algorithms Referenced**: SHA2, SHAKE
- **Key Takeaways**: Six new SLH-DSA parameter sets are defined for security levels 1, 3, and 5 with a strict limit of 2^24 signatures per key; These variants offer reduced signature sizes and faster verification compared to standard FIPS 205 sets; The parameter sets are not approved for general-purpose use due to the operational signature limit; Users must evaluate signing frequency to ensure the 2^24 limit is never exceeded during a key's lifetime.
- **Security Levels & Parameters**: Security levels 1, 3, and 5; 2^24 signatures per signing key limit; SHA2 and SHAKE hash functions
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signatures are roughly half the size of FIPS 205 variants; Fast verification times; Strict limit of 2^24 signatures per signing key
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: Thorough evaluation to ensure signature limit is never exceeded; Assessment of number of signing devices and frequency of signature generation
- **Relevant PQC Today Features**: Algorithms, code-signing, stateful-signatures, compliance-strategy, migration-program
- **Source Document**: NIST-SP-800-230-ipd.pdf (282,069 bytes, 11,711 extracted chars)
- **Extraction Timestamp**: 2026-04-14T08:22:43

---

## ANSSI-PG-083-v3-2026

- **Reference ID**: ANSSI-PG-083-v3-2026
- **Title**: Règles et Recommandations Concernant le Choix et le Dimensionnement des Mécanismes Cryptographiques (v3.00)
- **Authors**: ANSSI
- **Publication Date**: 2004-11-19
- **Last Updated**: 2026-03-20
- **Document Status**: Published
- **Main Topic**: ANSSI rules and recommendations for selecting and sizing cryptographic mechanisms, including the first explicit address of the quantum threat in version 3.00.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Menace quantique; attaques assistées par ordinateurs quantiques; adversaire quantique
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ANSSI, mission Etalab
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Générateur physique d'aléa; Retraitement algorithmique
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Critères Communs; Licence Ouverte v2.0
- **Classical Algorithms Referenced**: AES; factorisation; logarithme discret; Réseaux euclidiens; apprentissage avec erreurs; solution entière courte
- **Key Takeaways**: Version 3.00 is the first update to explicitly address the quantum threat; Recommendations are not normative and require adaptation to specific information systems; The document aims to remain valid for at least 15 years; Key management rules are excluded as they are covered in a separate document; Quantum key distribution (QKD) and quantum cryptography are explicitly excluded from scope.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Développeur; Administrateur; RSSI; DSI; Utilisateur
- **Implementation Prerequisites**: Validation by the system administrator and/or persons in charge of information system security prior to implementation
- **Relevant PQC Today Features**: Threats, Compliance, Algorithms, Assess, entropy-randomness
- **Source Document**: France_ANSSI_Crypto-Mechanisms-Rules-PG083-2026.pdf (1,365,473 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T08:24:40

---

## Cambridge-JBS-Quantum-Blockchain-2025

- **Reference ID**: Cambridge-JBS-Quantum-Blockchain-2025
- **Title**: Why Quantum Matters Now for Blockchain
- **Authors**: Philippa Coney; Cambridge Centre for Alternative Finance (CCAF)
- **Publication Date**: 2025-11-26
- **Last Updated**: 2026-02-04
- **Document Status**: Published
- **Main Topic**: Analysis of quantum computing threats to blockchain cryptographic foundations and the urgent need for post-quantum cryptography upgrades in digital asset ecosystems.
- **PQC Algorithms Covered**: SPHINCS+, Dilithium, Falcon
- **Quantum Threats Addressed**: Harvest Now Crack Later; Shor's Algorithm; Grover's algorithm; Advanced Persistent Threats (APTs)
- **Migration Timeline Info**: Expert consensus places cryptographically relevant quantum computer 10 to 20 years away; timeline may compress to within a decade due to recent algorithmic breakthroughs
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Wenbin Wu (Research Associate at CCAF); Philippa Coney (Author of analysis)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA; Ed25519; Sr25519; BLS12-381; RSA; P-256; P-384; secp256k1; secp256r1; SPHINCS-256
- **Key Takeaways**: Blockchain systems face immediate permanent risks from Harvest Now Crack Later attacks due to public and immutable transaction records; 24 of the top 26 blockchain protocols rely purely on quantum-vulnerable signature schemes; Transition to post-quantum cryptography requires coordinated upgrades in protocols, software, and governance before quantum computers break keys; State-sponsored actors represent the most likely early adopters of quantum capabilities to undermine financial systems; Recent algorithmic breakthroughs have reduced logical qubit requirements for breaking RSA-2048 to approximately 1,399
- **Security Levels & Parameters**: 256-bit ECC; 381-bit ECC; 3072-bit RSA; 1,700 to 25,000 logical qubits required to break ECDSA or RSA; 1,399 logical qubits for breaking RSA-2048
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 256-bit key size for ECC; 3072-bit key size for RSA; 1,121-qubit Condor processor; 133-qubit Heron chip
- **Target Audience**: CISO; Policy Maker; Security Architect; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-assets; threats; timeline; algorithms; pqc-governance
- **Source Document**: Cambridge-JBS-Quantum-Blockchain-2025.html (215,283 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T08:26:21

---

## AQ-PQC-Migration-Framework-v1.1-2026

- **Reference ID**: AQ-PQC-Migration-Framework-v1.1-2026
- **Title**: The Applied Quantum PQC Migration Framework (v1.1)
- **Authors**: Marin Ivezic; Applied Quantum
- **Publication Date**: 2025-06-01
- **Last Updated**: 2026-03-01
- **Document Status**: Published
- **Main Topic**: A comprehensive, phase-by-phase enterprise methodology for migrating cryptography to post-quantum standards before quantum computers arrive.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, LMS, XMSS, FN-DSA, HQC
- **Quantum Threats Addressed**: CRQC, HNDL, TNFL
- **Migration Timeline Info**: NIST IR 8547 deprecation and disallowance timelines; CNSA 2.0 milestones; Qby-Q Year 1 plan; landscape state as of March 2026
- **Applicable Regions / Bodies**: United States (Federal agencies); Netherlands (Dutch PQC Migration Handbook)
- **Leaders Contributions Mentioned**: Marin Ivezic (CEO, Applied Quantum; Author of framework and PostQuantum.com)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH, TLS
- **Infrastructure Layers**: PKI, Confidential Computing, CBOM architecture
- **Standardization Bodies**: NIST, NSA, ETSI, GSMA, AIVD, CWI, TNO, MITRE, Post-Quantum Cryptography Coalition, PKI Consortium
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, NIST IR 8547, CNSA 2.0, GSMA PQ.01–PQ.03 v2.0, ETSI TR 103 619, ETSI TR 104 016
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Start migration while it is a project before it becomes a crisis; Vendor governance is the primary external constraint on migration timelines; Implement a Minimum Viable CBOM model for cryptographic inventory; Use risk-driven discovery scoping to decide what to inventory first; Verify current status against primary sources due to rapid landscape evolution
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid deployment patterns, hybrid jurisdictional nuance
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISOs, security architects, cryptographic engineers, program managers, risk and compliance officers, vendor/procurement teams
- **Implementation Prerequisites**: Familiarity with quantum threat fundamentals (HNDL, TNFL, CRQC timelines, NIST PQC standards); library readiness; dependency chains
- **Relevant PQC Today Features**: migration-program, pqc-business-case, pqc-governance, vendor-risk, hybrid-crypto
- **Source Document**: AQ-PQC-Migration-Framework-Universal-v1.1-2026.pdf (1,003,461 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T08:29:58

---

## CoT-Decrypting-Future-PQC-Timelines-2026

- **Reference ID**: CoT-Decrypting-Future-PQC-Timelines-2026
- **Title**: Decrypting the Future: Global Timelines for Post-Quantum Cryptography and Why They Matter
- **Authors**: Charter of Trust – PQC Working Group
- **Publication Date**: 2026-04-13
- **Last Updated**: 2026-04-13
- **Document Status**: Published
- **Main Topic**: A strategic report comparing global PQC transition timelines across six regions and providing a practitioner playbook for migration in high-priority sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest now, decrypt later; future decryption of data captured today
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Europe; United Kingdom; Japan; Singapore; Australia
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Payment rails; settlement networks; authentication systems; military communication systems; satellites; embedded defense technologies; SCADA systems; industrial controllers; transportation signaling
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203; FIPS 204; FIPS 205
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Four priority domains for PQC resilience are financial services, government and defense, operational technology, and healthcare; adversaries may already be harvesting encrypted data for later decryption requiring immediate preparation; sectoral prioritization depends on data sensitivity, system lifecycle, and impact on national or public safety; PQC transition is a strategic transformation involving governance and supply-chain dependencies rather than just technical implementation
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto-agility; phased implementation guidance; protocol-level impacts
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker; Researcher
- **Implementation Prerequisites**: Cryptographic inventory; crypto-agility; supply-chain dependency assessment; governance framework; phased migration strategy
- **Relevant PQC Today Features**: Timeline; Threats; Compliance; Migrate; Assess; data-asset-sensitivity; iot-ot-pqc; pqc-governance; migration-program; pqc-business-case
- **Source Document**: CoT-Decrypting-Future-PQC-Global-Timelines-2026.pdf (1,216,723 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T08:31:42

---
