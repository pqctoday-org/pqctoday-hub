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

## PROACT-2025-SCA-Lattice-PQC

- **Reference ID**: PROACT-2025-SCA-Lattice-PQC
- **Title**: Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)
- **Authors**: PROACT School; Radboud University
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Analysis of side-channel and fault-injection attacks on software implementations of ML-KEM and ML-DSA lattice-based algorithms.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Elena Dubrova; Michele Mosca
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, DSA, AES, SHA-256, Diffie-Hellman, HMAC, SHA3-256, SHA3-512, SHAKE-256
- **Key Takeaways**: Unmasked implementations of ML-KEM and ML-DSA are vulnerable to single-trace key recovery; Masked and shuffled countermeasures can be targeted by fault-injection attacks; Both ML-KEM and ML-DSA rely on the hardness of the Learning With Errors (LWE) problem; Lattice-based cryptography is resistant to quantum computers solving integer factorization or discrete logarithm problems.
- **Security Levels & Parameters**: q = 2^13 - 2^9 + 1; ring dimension n; module rank k
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Inputs and outputs to all API functions of ML-KEM are byte arrays
- **Target Audience**: Researcher, Security Architect, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Threats, Leaders, pqc-101
- **Source Document**: PROACT-2025-SCA-Lattice-PQC.pdf (5,615,698 bytes, 5,199 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:13:35

---

## NIST-PQC-Seminar-FaultInjection-Lattice

- **Reference ID**: NIST-PQC-Seminar-FaultInjection-Lattice
- **Title**: Practical Fault Injection Attacks on Lattice-based NIST PQC Standards - Kyber and Dilithium
- **Authors**: NIST
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Practical fault injection attacks targeting Kyber and Dilithium implementations on ARM Cortex-M4 using clock, voltage, laser, and electromagnetic methods.
- **PQC Algorithms Covered**: Kyber; Dilithium
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Fault injection attacks can exploit polynomial multiplication and decryption routines in lattice-based standards; Clock, voltage, laser, and electromagnetic glitching are practical attack vectors on ARM Cortex-M4; Implementations of Kyber and Dilithium require specific countermeasures against physical fault injection.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: ARM Cortex-M4 hardware context
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Source Document**: NIST-PQC-Seminar-FaultInjection-Lattice.html (77,787 bytes, 3,081 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:15:04

---

## USENIX-2024-HQC-Division-Timing

- **Reference ID**: USENIX-2024-HQC-Division-Timing
- **Title**: Divide and Surrender: Exploiting Variable Division Instruction Timing in HQC Key Recovery Attacks
- **Authors**: Schroeder et al.; USENIX Security
- **Publication Date**: 2024-08-01
- **Last Updated**: 2024-08-01
- **Document Status**: Published
- **Main Topic**: The paper demonstrates a timing side-channel attack named Divide and Surrender that exploits variable-time division instructions in HQC implementations to recover secret keys.
- **PQC Algorithms Covered**: HQC, KyberSlash
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Robin Leander Schröder; Stefan Gast; Qian Guo
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Compilers may emit variable-time division instructions when modulo operations are used in loops, creating timing side-channels; A DIV-SMT approach enables precise measurement of small division timing variations on processors supporting Simultaneous Multithreading; An attacker can build a Plaintext-Checking oracle with above 90% accuracy using only 100 side-channel traces; The Zero Tester method allows recovery of HQC secret keys in under 2 minutes on an AMD Zen2 machine; Exploitation requires co-location of the attacker on the same physical core as the victim.
- **Security Levels & Parameters**: HQC-128
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 100 side-channel traces required for oracle construction; under 2 minutes attack completion time on AMD Zen2 machine; 8-fold decrease in idealized oracle queries compared to previous approaches
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: Processors supporting Simultaneous Multithreading (SMT); co-location of attacker and victim on the same physical core
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Source Document**: USENIX-2024-HQC-Division-Timing.html (45,841 bytes, 3,938 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:15:52

---

## IACR-2024-1828-McEliece-SCA-Fault

- **Reference ID**: IACR-2024-1828-McEliece-SCA-Fault
- **Title**: Classic McEliece Hardware Implementation with Enhanced Side-Channel and Fault Resistance
- **Authors**: IACR ePrint
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Preprint
- **Main Topic**: First hardware implementation of Classic McEliece with countermeasures against Side-Channel Attacks and Fault Injection Attacks targeting additive FFT and Gaussian elimination.
- **PQC Algorithms Covered**: Classic McEliece
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Peizhou Gan; Prasanna Ravi; Kamal Raj; Anubhab Baksi; Anupam Chattopadhyay
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Classic McEliece requires protection for additive FFT and Gaussian elimination operations; Hardened FPGA/ASIC designs can mitigate SCA and FIA with no leakage in 100,000 traces; Implementation incurs a modest area overhead of 4x to 7x depending on countermeasure type
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Area overhead between 4x to 7x; No leakage with 100,000 traces
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: FPGA or ASIC hardware platform; Countermeasures for additive FFT and Gaussian elimination
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Source Document**: IACR-2024-1828-McEliece-SCA-Fault.html (17,436 bytes, 2,762 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:16:58

---

## FrodoKEM-SCA-Countermeasures-2024

- **Reference ID**: FrodoKEM-SCA-Countermeasures-2024
- **Title**: Countermeasures against Side-Channel Attacks in FrodoKEM: An Implementation Study
- **Authors**: Research Square (preprint)
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Preprint
- **Main Topic**: Implementation study proposing isochronous sampling, masking, and fault-injection countermeasures to protect FrodoKEM against side-channel attacks.
- **PQC Algorithms Covered**: FrodoKEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: German Federal Office for Information Security; Dutch National Communications Security Agency
- **Leaders Contributions Mentioned**: Aoyang Zhou; Haiying Gao; Mingdeng Wang; Bin Hu
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology; ISO/IEC JTC 1/SC 27/WG 2
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Isochronous operations during sampling and ciphertext comparison eliminate timing sensitivity; Masking techniques in public key computation obscure critical data to resist power analysis; Sampling calibration mechanisms detect and circumvent fault attacks; SCA-resistant implementation increases computational overhead by less than 0.8% under same parameter sets; Security resilience is validated through Test Vector Leakage Assessment (TVLA)
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Computational overhead increase less than 0.8%
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Source Document**: FrodoKEM-SCA-Countermeasures-2024.html (67,111 bytes, 3,756 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:17:58

---

## IACR-2022-952-FrodoKEM-Rowhammer

- **Reference ID**: IACR-2022-952-FrodoKEM-Rowhammer
- **Title**: When Frodo Flips: End-to-End Key Recovery on FrodoKEM via Rowhammer
- **Authors**: IACR ePrint
- **Publication Date**: 2022-07-01
- **Last Updated**: 2022-07-01
- **Document Status**: Published
- **Main Topic**: Demonstrates end-to-end private key recovery on FrodoKEM via Rowhammer-induced DRAM bit flips during key generation to enable decryption-failure attacks.
- **PQC Algorithms Covered**: FrodoKEM; Kyber; Saber
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Michael Fahr Jr.; Hunter Kippen; Andrew Kwong; Thinh Dang; Jacob Lichtinger; Dana Dachman-Soled; Daniel Genkin; Alexander Nelson; Ray Perlner; Arkady Yerukhimovich; Daniel Apon
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE
- **Key Takeaways**: Rowhammer attacks can poison FrodoKEM key generation to produce high-error public keys; Decryption failure attacks require approximately 200,000 core-hours of supercomputing resources; Successful poisoning requires extreme engineering due to the 8-millisecond KeyGen window; Countermeasures are discussed to protect implementations against similar hardware-based attacks
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: FrodoKEM KeyGen runs on the order of 8 milliseconds; Attack requires approximately 200,000 core-hours; Prior Rowhammer attacks required up to 8 hours of persistent access
- **Target Audience**: Researcher; Security Architect; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Leaders; Assess
- **Source Document**: IACR-2022-952-FrodoKEM-Rowhammer.html (20,044 bytes, 4,099 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:18:58

---

## ArXiv-2025-SLH-DSA-Rowhammer

- **Reference ID**: ArXiv-2025-SLH-DSA-Rowhammer
- **Title**: SLasH-DSA: Breaking SLH-DSA Using an Extensible End-to-End Rowhammer Framework
- **Authors**: arXiv
- **Publication Date**: 2025-09-01
- **Last Updated**: 2025-09-01
- **Document Status**: Preprint
- **Main Topic**: The document presents a software-only universal forgery attack on SLH-DSA using Rowhammer-induced bit flips to corrupt internal states and forge signatures without private key knowledge.
- **PQC Algorithms Covered**: SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jeremy Boy; Antoon Purnal; Anna Pätschke; Luca Wilke; Thomas Eisenbarth
- **PQC Products Mentioned**: Swage; OpenSSL 3.5.1
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE-128f; SHA2-128s; SHAKE-192f
- **Key Takeaways**: Rowhammer attacks can achieve universal signature forgery on SLH-DSA using software-only methods on commodity hardware; The attack requires one hour of hammering for deterministic parameter sets and eight hours for randomized sets; Post-processing time ranges from minutes to an hour depending on the parameter set; Theoretical soundness of PQC schemes does not guarantee immunity against real-world fault injection attacks; Implementation hardening or hardware defenses are necessary to mitigate Rowhammer threats.
- **Security Levels & Parameters**: SHAKE-128f; SHA2-128s; SHAKE-192f
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: One hour hammering time for deterministic parameter sets; Eight hours hammering time for randomized parameter sets; Post-processing ranging from minutes to an hour
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: OpenSSL 3.5.1; Commodity desktop and server hardware
- **Relevant PQC Today Features**: Algorithms; Threats; Assess; stateful-signatures; entropy-randomness
- **Source Document**: ArXiv-2025-SLH-DSA-Rowhammer.html (47,823 bytes, 5,637 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:20:06

---

## EmergentMind-Nonce-Reuse-Crypto

- **Reference ID**: EmergentMind-Nonce-Reuse-Crypto
- **Title**: Nonce Reuse in Cryptography
- **Authors**: EmergentMind
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Overview of nonce reuse vulnerabilities in cryptographic protocols caused by weak PRNGs and misconfigurations, enabling key recovery and forgery attacks across classical schemes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Golinelli et al.; Buchanan et al.; Gilchrist et al.; Euchner et al.; Ostertág; Nag et al.; Babu et al.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ECDSA; DSA; CSP (Content Security Policy); HTTP; LPWAN; PERIDOT
- **Infrastructure Layers**: Web caches; CDNs; Reverse proxies
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA; DSA; ChaCha; Freestyle
- **Key Takeaways**: Weak PRNGs and caching errors are primary root causes of nonce reuse enabling key recovery; 26.3% of CSP-using sites exhibit nonce reuse, predominantly cross-session; Mitigation requires cryptographically secure PRNGs, strict one-time usage enforcement, and proper Cache-Control headers; Linear types in programming languages can enforce single-use nonces at compile time; Deterministic nonce generation (RFC 6979) avoids RNG-based bugs in signatures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 20.1% of domains deploy CSP; 22.6% of CSP-using sites use nonce-based policies; 26.3% of these sites exhibit nonce reuse; 93.8% of cases are cross-session reuse
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Cryptographically Secure PRNGs (e.g., crypto.randomBytes); Strict rotation discipline for single-use nonces; Compile-time enforcement via linear types (e.g., Rust); Cache-Control headers set to no-store, no-cache, must-revalidate; Deterministic nonce generation (RFC 6979)
- **Relevant PQC Today Features**: entropy-randomness; code-signing; api-security-jwt; iot-ot-pqc
- **Source Document**: EmergentMind-Nonce-Reuse-Crypto.html (231,925 bytes, 13,620 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:21:29

---

## Invicti-OWASP-CryptoFailures-2025

- **Reference ID**: Invicti-OWASP-CryptoFailures-2025
- **Title**: Cryptographic Failures: 2025 OWASP Top 10 Risk
- **Authors**: Invicti Security
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Analysis of cryptographic failures in the 2025 OWASP Top 10, focusing on misconfigurations, weak key management, and insecure protocol usage rather than algorithmic weaknesses.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Zbigniew Banach
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.2, HTTPS, SSL, HSTS
- **Infrastructure Layers**: Key Management, Secure key management systems
- **Standardization Bodies**: OWASP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-256, RSA, SHA-256, MD5, SHA-1, bcrypt, scrypt, Argon2, RC4
- **Key Takeaways**: Stick to well-established secure algorithms like AES-256 and avoid custom or deprecated ones; Implement secure password hashing with modern algorithms like bcrypt, scrypt, or Argon2 with proper salting; Use HTTPS with TLS 1.2 or higher and ensure hardened SSL/TLS configurations including HSTS headers; Never hardcode encryption keys and use secure key management systems with periodic rotation; Employ automated security scanning (DAST) and penetration testing to identify cryptographic weaknesses.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, CISO, Compliance Officer
- **Implementation Prerequisites**: Use of pre-vetted cryptographic libraries; Adequate training for development teams; Suitable review processes; Automated security scanning tools (DAST); Penetration testing capabilities
- **Relevant PQC Today Features**: tls-basics, entropy-randomness, api-security-jwt, code-signing, pqc-risk-management
- **Source Document**: Invicti-OWASP-CryptoFailures-2025.html (128,975 bytes, 11,582 extracted chars)
- **Extraction Timestamp**: 2026-04-14T22:23:17

---

## BSI TR-02102

- **Reference ID**: BSI TR-02102
- **Title**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **Authors**: BSI
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
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
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: No source text available
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: BSI_TR-02102.pdf (56,314 bytes, no text extracted)
- **Extraction Timestamp**: 2026-04-14T22:59:46

---

## arXiv-2603-01091-HNDL-Rekeying

- **Reference ID**: arXiv-2603-01091-HNDL-Rekeying
- **Title**: Quantifying Harvest-Now-Decrypt-Later Threats: An Empirical Analysis of Rekeying Defences
- **Authors**: perlab-uc3m; Universidad Carlos III de Madrid
- **Publication Date**: 2025-03-03
- **Last Updated**: 2025-03-03
- **Document Status**: Preprint
- **Main Topic**: Empirical analysis of harvest-now-decrypt-later attack economics across TLS 1.2, TLS 1.3, QUIC, and SSH to quantify adversarial storage costs and evaluate rekeying defenses.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest-now decrypt-later; Cryptographically Relevant Quantum Computer; Shor's algorithm
- **Migration Timeline Info**: NIST finalized first three PQC standards in August 2024; Microsoft targets full ecosystem transition by 2033; Q-Day estimated in 2030–2040 window with 50% probability of breaking RSA-2048 within 15 years
- **Applicable Regions / Bodies**: United States; Europe; Bodies: NIST, NSA, ANSSI, BSI, NLNCSA, ETSI, IETF
- **Leaders Contributions Mentioned**: Javier Blanco-Romero; Florina Almenares Mendoza; Carlos García Rubio; Celeste Campo; Daniel Díaz Sánchez; Mosca; Piani; Kagai; Cremers; Dowling; Danezis; Wittneben
- **PQC Products Mentioned**: hndl-dev simulator
- **Protocols Covered**: TLS 1.2; TLS 1.3; QUIC; SSH; iMessage PQ3 protocol
- **Infrastructure Layers**: Backbone fiber taps; Internet Service Provider cooperation; Data-center presence; Cloud archive pricing; Load Balancers
- **Standardization Bodies**: NIST; IETF; ETSI
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: RSA; ECC; DH; DHE; ECDHE; AES; chacha20-poly1305
- **Key Takeaways**: Retaining intercepted traffic is economically trivial, shifting defense focus to increasing decryption costs; Aggressive rekeying and larger key exchange parameters multiply quantum computations required by adversaries; Encrypted Client Hello forces indiscriminate bulk collection to inflate adversary storage archives; TLS 1.3 and QUIC lack in-band ephemeral rekeying, creating a critical protocol gap for defense-in-depth
- **Security Levels & Parameters**: RSA-2048; Level 3 messaging security (Apple PQ3); NIST L1-L5 not explicitly detailed beyond standard names
- **Hybrid & Transition Approaches**: Hybrid key exchange; Hybrid post-quantum Transport Layer Security
- **Performance & Size Considerations**: Petabyte-scale archival costs collapsed by roughly 95% since 2010; 68 exabytes of global data traffic in 2024; Negligible bandwidth overhead for SSH rekeying
- **Target Audience**: Security Architect; Researcher; Policy Maker; CISO
- **Implementation Prerequisites**: Open-source simulation pipeline hndl-dev; Encrypted Client Hello support; SSH RekeyLimit configuration; Larger key exchange parameters
- **Relevant PQC Today Features**: Threats, Migrate, Assess, tls-basics, vpn-ssh-pqc, pqc-risk-management, hybrid-crypto, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Open-source simulation pipeline; Formal verification of hybrid protocol transitions; Computational proof in multi-stage key exchange model
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Migration time can exceed a decade for complex infrastructures; Backward compatibility issues with TLS 1.2 RSA key transport; Phased rollout via hybrid key exchange in production
- **Source Document**: arXiv-2603-01091-HNDL-Rekeying.html (318,007 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:00:13

---

## NIST-SP-800-38D

- **Reference ID**: NIST-SP-800-38D
- **Title**: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC
- **Authors**: NIST
- **Publication Date**: 2007-11-01
- **Last Updated**: 2007-11-01
- **Document Status**: Final
- **Main Topic**: NIST Special Publication 800-38D specifies the Galois/Counter Mode (GCM) and GMAC as modes of operation for authenticated encryption using symmetric key block ciphers.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget; Communications Security Establishment of the Government of Canada
- **Leaders Contributions Mentioned**: Morris Dworkin (Author); David McGrew (Co-inventor of GCM); Elaine Barker, John Kelsey, Allen Roginsky, Donna Dodson, Tim Polk, Bill Burr (Reviewers/Contributors)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cryptographic Module Validation Program; Key Establishment
- **Standardization Bodies**: National Institute of Standards and Technology; Communications Security Establishment of the Government of Canada
- **Compliance Frameworks Referenced**: Federal Information Security Management Act (FISMA); OMB Circular A-130; FIPS Pub. 197; Cryptographic Module Validation Program (CMVP)
- **Classical Algorithms Referenced**: Advanced Encryption Standard (AES); Galois/Counter Mode (GCM); GMAC; Counter mode
- **Key Takeaways**: GCM provides authenticated encryption with associated data using a 128-bit block cipher; Nonce uniqueness per key is mandatory to prevent keystream recovery and tag forgery; GCM supports online processing where data lengths are not required in advance; Implementations must adhere to uniqueness requirements on initialization vectors to ensure security assurance; Conformance testing is conducted under the Cryptographic Module Validation Program framework
- **Security Levels & Parameters**: 128-bit block size; 96-bit (12-byte) nonce; 16-byte authentication tag; up to about 64 gigabytes per invocation for confidential data
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Block size of 128 bits; Nonce length of 96 bits (12 bytes); Authentication tag length of 16 bytes; Confidential data limit of about 64 gigabytes per invocation
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: Approved symmetric key block cipher with 128-bit block size; Unique initialization strings per key; Conformance to Cryptographic Module Validation Program requirements
- **Relevant PQC Today Features**: Algorithms, Compliance, tls-basics, entropy-randomness, code-signing
- **Implementation Attack Surface**: Nonce reuse; Breach of uniqueness requirement on IVs
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Conformance testing; Cryptographic Module Validation Program (CMVP)
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: RBG-based Construction for IV generation
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Source Document**: NIST-SP-800-38D.pdf (271,960 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:02:31

---

## IETF RFC 5649

- **Reference ID**: IETF RFC 5649
- **Title**: Advanced Encryption Standard (AES) Key Wrap with Padding Algorithm
- **Authors**: IETF
- **Publication Date**: 2009-08-01
- **Last Updated**: 2009-08-01
- **Document Status**: Proposed Standard
- **Main Topic**: RFC 5649 specifies a padding convention for the AES Key Wrap algorithm to allow wrapping keys of arbitrary lengths.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: R. Housley; M. Dworkin
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: BCP 78; PKCS#11 v3.2
- **Classical Algorithms Referenced**: AES; RSA; HMAC
- **Key Takeaways**: The padding scheme eliminates the requirement that wrapped key length be a multiple of 64 bits; The Alternative Initial Value includes a fixed constant and plaintext length to ensure integrity; Implementations must protect the KEK as its compromise discloses all wrapped keys; System designers should not use these algorithms to encrypt anything other than cryptographic keying material.
- **Security Levels & Parameters**: AES KEK sizes of 128, 192, or 256 bits; Input key data bounded at 2^32 octets; Wrapping a 32-byte DEK produces 48 bytes.
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Input key data as short as one octet results in output of two 64-bit blocks; Maximum input size bounded at 2^32 octets; Wrapping a 32-byte DEK produces 48 bytes.
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: AES codebook implementation; Support for ASN.1 algorithm identifiers; Protection of the key-encryption key (KEK).
- **Relevant PQC Today Features**: None detected
- **Implementation Attack Surface**: Compromise of the KEK may result in disclosure of all wrapped keys; Integrity checking failures if AIV verification checks fail.
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Algorithm Identifiers for ASN.1 protocols; Padded Key Wrap Examples provided for validation.
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Source Document**: IETF_RFC_5649.html (36,217 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:04:35

---

## RFC 5869

- **Reference ID**: RFC 5869
- **Title**: HMAC-based Extract-and-Expand Key Derivation Function (HKDF)
- **Authors**: IETF; H. Krawczyk; P. Eronen
- **Publication Date**: 2010-05-01
- **Last Updated**: 2010-05-01
- **Document Status**: Informational
- **Main Topic**: Specification of a simple HMAC-based Extract-and-Expand Key Derivation Function (HKDF) for deriving cryptographically strong secret keys from input keying material.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: H. Krawczyk; P. Eronen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2; PANA; EAP-AKA; TLS; IKEv1
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF); IETF Trust; Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: HMAC; Diffie-Hellman; RSA
- **Key Takeaways**: HKDF follows an extract-then-expand paradigm to concentrate dispersed entropy into a pseudorandom key before expansion; The use of salt significantly strengthens HKDF by ensuring independence between different uses of the hash function; The 'info' input is critical for binding derived keys to specific contexts to prevent cross-protocol key reuse; The extract step should not be skipped when input keying material is a Diffie-Hellman value as it is not uniformly random; Applications may skip the extract step only if the input keying material is already a cryptographically strong pseudorandom string.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Output length L must be <= 255\*HashLen; PRK length equals HashLen octets
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: A cryptographic hash function; optional salt value; input keying material (IKM); context information string
- **Relevant PQC Today Features**: entropy-randomness; tls-basics; crypto-agility; pqc-101
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: physical random number generator (RNG); entropy collected from system events; user's keystrokes; renewable pools of entropy
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Source Document**: RFC_5869.html (40,266 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:06:34

---

## OASIS-SAML-2-0-Core

- **Reference ID**: OASIS-SAML-2-0-Core
- **Title**: Security Assertion Markup Language (SAML) Version 2.0 Core Specification
- **Authors**: OASIS Security Services TC
- **Publication Date**: 2005-03-15
- **Last Updated**: 2005-03-15
- **Document Status**: OASIS Standard
- **Main Topic**: This specification defines the syntax and semantics for XML-encoded assertions about authentication, attributes, and authorization, and for the protocols that convey this information.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Scott Cantor; John Kemp; Rob Philpott; Eve Maler; Conor P. Cahill; John Hughes; Hal Lockhart; Michael Beach; Rebekah Metz; Rick Randall; Thomas Wisniewski; Irving Reid; Paula Austel; Maryann Hondo; Michael McIntosh; Tony Nadalin; Nick Ragouzis; RL 'Bob' Morgan; Peter C Davis; Jeff Hodges; Frederick Hirsch; Paul Madsen; Steve Anderson; Prateek Mishra; John Linn; Jahan Moreh; Anne Anderson; Ron Monzillo; Greg Whitehead
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SAML V2.0; Assertion Query and Request Protocol; Authentication Request Protocol; Artifact Resolution Protocol; Name Identifier Management Protocol; Single Logout Protocol
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: OASIS Open; Security Services Technical Committee
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines XML-based syntax for authentication and authorization assertions; It establishes protocols for conveying identity federation information; It specifies schema organization and namespaces for SAML V2.0; It outlines processing rules for various SAML requests and responses
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: digital-id, protocols, migration-program, pqc-risk-management, compliance-strategy
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Source Document**: OASIS-SAML-2-0-Core.pdf (630,324 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:08:28

---

## FIPS-198-1

- **Reference ID**: FIPS-198-1
- **Title**: The Keyed-Hash Message Authentication Code (HMAC)
- **Authors**: NIST
- **Publication Date**: 2008-07-07
- **Last Updated**: 2008-07-07
- **Document Status**: Final
- **Main Topic**: FIPS 198-1 specifies HMAC as a mechanism for message authentication using cryptographic hash functions and a shared secret key.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Planning Note (06/23/2025): A Federal Register Notice solicits feedback by July 23, 2025, on NIST's plans to withdraw this FIPS and moving its content to a new NIST Special Publication, SP 800-224.
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: FIPS 198-1; Federal Information Processing Standards (FIPS); Federal Information Security Modernization Act
- **Classical Algorithms Referenced**: HMAC-SHA-256; SHA-2; SHA-3
- **Key Takeaways**: HMAC remains secure post-quantum assuming ≥256-bit output when based on SHA-2 or SHA-3; FIPS 198-1 is planned for withdrawal with content moving to SP 800-224; Feedback on the proposed withdrawal is solicited by July 23, 2025; HMAC can be used with any iterative Approved cryptographic hash function in combination with a shared secret key.
- **Security Levels & Parameters**: ≥256-bit output
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Researcher
- **Implementation Prerequisites**: Iterative Approved cryptographic hash function; shared secret key
- **Relevant PQC Today Features**: Algorithms, Compliance, Migrate, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: FIPS 198-1 withdrawal planned; content moving to SP 800-224
- **Source Document**: FIPS-198-1.html (41,923 bytes, 3,859 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:10:15

---

## NIST-SP-800-132

- **Reference ID**: NIST-SP-800-132
- **Title**: Recommendation for Password-Based Key Derivation
- **Authors**: NIST
- **Publication Date**: 2010-12-01
- **Last Updated**: 2010-12-01
- **Document Status**: Final
- **Main Topic**: NIST SP 800-132 specifies techniques for deriving master keys from passwords or passphrases to protect stored electronic data or data protection keys.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Meltem Sönmez Turan (NIST); Elaine Barker (NIST); William Burr (NIST); Lily Chen (NIST)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management; Storage Applications
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: PBKDF2; SHA-256
- **Key Takeaways**: Use PBKDF2 for password-based key derivation in IAM systems and credential vaults; Ensure iteration count is at least 10,000 when using PBKDF2-SHA-256 for quantum safety; Derive keys with a length of at least 256 bits; NIST plans to revise this publication in the future.
- **Security Levels & Parameters**: Iteration count ≥10,000; Key length ≥256 bits
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: PBKDF2-SHA-256 with sufficient iterations (≥10,000); Key length ≥256 bits
- **Relevant PQC Today Features**: Algorithms; Compliance; Assess; data-asset-sensitivity; entropy-randomness
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Source Document**: NIST-SP-800-132.html (41,023 bytes, 3,312 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:11:37

---

## PROACT-2025-SCA-Lattice-PQC

- **Reference ID**: PROACT-2025-SCA-Lattice-PQC
- **Title**: Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)
- **Authors**: PROACT School; Radboud University
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Analysis of side-channel and fault-injection attacks on software implementations of ML-KEM and ML-DSA lattice-based algorithms.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, CRYSTALS-Kyber, CRYSTALS-Dilithium
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Elena Dubrova; Michele Mosca
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, DSA, AES, SHA-256, Diffie-Hellman, HMAC, SHA3-256, SHA3-512, SHAKE-256
- **Key Takeaways**: Unmasked implementations of ML-KEM and ML-DSA are vulnerable to single-trace key recovery; Masked and shuffled countermeasures can be targeted by fault-injection attacks; Both ML-KEM and ML-DSA rely on the hardness of the Learning With Errors (LWE) problem; Lattice-based cryptography is resistant to quantum computers solving integer factorization or discrete logarithm problems.
- **Security Levels & Parameters**: q = 2^13 - 2^9 + 1; ring dimension n; module rank k
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Inputs and outputs to all API functions of ML-KEM are byte arrays
- **Target Audience**: Researcher, Security Architect, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Threats, Leaders, pqc-101
- **Implementation Attack Surface**: side-channel attacks, fault-injection attacks, single-trace key recovery, unmasked implementations, masked countermeasures, shuffled countermeasures
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: PROACT-2025-SCA-Lattice-PQC.pdf (5,615,698 bytes, 5,199 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:12:52

---

## NIST-PQC-Seminar-FaultInjection-Lattice

- **Reference ID**: NIST-PQC-Seminar-FaultInjection-Lattice
- **Title**: Practical Fault Injection Attacks on Lattice-based NIST PQC Standards - Kyber and Dilithium
- **Authors**: NIST
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Practical fault injection attacks targeting Kyber and Dilithium implementations on ARM Cortex-M4 using clock, voltage, laser, and electromagnetic methods.
- **PQC Algorithms Covered**: Kyber; Dilithium
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Fault injection attacks can exploit polynomial multiplication and decryption routines in lattice-based standards; Clock, voltage, laser, and electromagnetic glitching are practical attack vectors on ARM Cortex-M4; Implementations of Kyber and Dilithium require specific countermeasures against physical fault injection.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: ARM Cortex-M4 hardware context
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Implementation Attack Surface**: fault injection (clock glitch, voltage glitch, laser, electromagnetic)
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: ARM Cortex-M4
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST-PQC-Seminar-FaultInjection-Lattice.html (77,787 bytes, 3,081 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:13:31

---

## USENIX-2024-HQC-Division-Timing

- **Reference ID**: USENIX-2024-HQC-Division-Timing
- **Title**: Divide and Surrender: Exploiting Variable Division Instruction Timing in HQC Key Recovery Attacks
- **Authors**: Schroeder et al.; USENIX Security
- **Publication Date**: 2024-08-01
- **Last Updated**: 2024-08-01
- **Document Status**: Published
- **Main Topic**: The paper demonstrates a timing side-channel attack named Divide and Surrender that exploits variable-time division instructions in HQC implementations to recover secret keys.
- **PQC Algorithms Covered**: HQC, KyberSlash
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Robin Leander Schröder; Stefan Gast; Qian Guo
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Compilers may emit variable-time division instructions when modulo operations are used in loops, creating timing side-channels; A DIV-SMT approach enables precise measurement of small division timing variations on processors supporting Simultaneous Multithreading; An attacker can build a Plaintext-Checking oracle with above 90% accuracy using only 100 side-channel traces; The Zero Tester method allows recovery of HQC secret keys in under 2 minutes on an AMD Zen2 machine; Exploitation requires co-location of the attacker on the same physical core as the victim.
- **Security Levels & Parameters**: HQC-128
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 100 side-channel traces required for oracle construction; under 2 minutes attack completion time on AMD Zen2 machine; 8-fold decrease in idealized oracle queries compared to previous approaches
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: Processors supporting Simultaneous Multithreading (SMT); co-location of attacker and victim on the same physical core
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Implementation Attack Surface**: timing side-channel; variable division instruction timing; Divide and Surrender (DaS) vulnerabilities; DIV-SMT approach; Plaintext-Checking oracle
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: USENIX-2024-HQC-Division-Timing.html (45,841 bytes, 3,938 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:13:55

---

## IACR-2024-1828-McEliece-SCA-Fault

- **Reference ID**: IACR-2024-1828-McEliece-SCA-Fault
- **Title**: Classic McEliece Hardware Implementation with Enhanced Side-Channel and Fault Resistance
- **Authors**: IACR ePrint
- **Publication Date**: 2024-11-01
- **Last Updated**: 2024-11-01
- **Document Status**: Preprint
- **Main Topic**: First hardware implementation of Classic McEliece with countermeasures against Side-Channel Attacks and Fault Injection Attacks targeting additive FFT and Gaussian elimination.
- **PQC Algorithms Covered**: Classic McEliece
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Peizhou Gan; Prasanna Ravi; Kamal Raj; Anubhab Baksi; Anupam Chattopadhyay
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Classic McEliece requires protection for additive FFT and Gaussian elimination operations; Hardened FPGA/ASIC designs can mitigate SCA and FIA with no leakage in 100,000 traces; Implementation incurs a modest area overhead of 4x to 7x depending on countermeasure type
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Area overhead between 4x to 7x; No leakage with 100,000 traces
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: FPGA or ASIC hardware platform; Countermeasures for additive FFT and Gaussian elimination
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Implementation Attack Surface**: Side-Channel Attacks (SCA), Fault Injection Attacks (FIA) targeting additive Fast Fourier Transform (FFT) and Gaussian elimination
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: SCA evaluation with 100000 traces, ASIC benchmark
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: FPGA/ASIC hardware design, area overhead of between 4× to 7×
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: IACR-2024-1828-McEliece-SCA-Fault.html (17,436 bytes, 2,762 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:14:23

---

## FrodoKEM-SCA-Countermeasures-2024

- **Reference ID**: FrodoKEM-SCA-Countermeasures-2024
- **Title**: Countermeasures against Side-Channel Attacks in FrodoKEM: An Implementation Study
- **Authors**: Research Square (preprint)
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Preprint
- **Main Topic**: Implementation study proposing isochronous sampling, masking, and fault-injection countermeasures to protect FrodoKEM against side-channel attacks.
- **PQC Algorithms Covered**: FrodoKEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: German Federal Office for Information Security; Dutch National Communications Security Agency
- **Leaders Contributions Mentioned**: Aoyang Zhou; Haiying Gao; Mingdeng Wang; Bin Hu
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology; ISO/IEC JTC 1/SC 27/WG 2
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Isochronous operations during sampling and ciphertext comparison eliminate timing sensitivity; Masking techniques in public key computation obscure critical data to resist power analysis; Sampling calibration mechanisms detect and circumvent fault attacks; SCA-resistant implementation increases computational overhead by less than 0.8% under same parameter sets; Security resilience is validated through Test Vector Leakage Assessment (TVLA)
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Computational overhead increase less than 0.8%
- **Target Audience**: Developer; Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Assess
- **Implementation Attack Surface**: side-channel (timing attacks, power analysis attacks), fault injection (fault attacks)
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Test Vector Leakage Assessment (TVLA)
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: FrodoKEM-SCA-Countermeasures-2024.html (67,111 bytes, 3,756 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:14:53

---

## IACR-2022-952-FrodoKEM-Rowhammer

- **Reference ID**: IACR-2022-952-FrodoKEM-Rowhammer
- **Title**: When Frodo Flips: End-to-End Key Recovery on FrodoKEM via Rowhammer
- **Authors**: IACR ePrint
- **Publication Date**: 2022-07-01
- **Last Updated**: 2022-07-01
- **Document Status**: Published
- **Main Topic**: Demonstrates end-to-end private key recovery on FrodoKEM via Rowhammer-induced DRAM bit flips during key generation to enable decryption-failure attacks.
- **PQC Algorithms Covered**: FrodoKEM; Kyber; Saber
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Michael Fahr Jr.; Hunter Kippen; Andrew Kwong; Thinh Dang; Jacob Lichtinger; Dana Dachman-Soled; Daniel Genkin; Alexander Nelson; Ray Perlner; Arkady Yerukhimovich; Daniel Apon
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE
- **Key Takeaways**: Rowhammer attacks can poison FrodoKEM key generation to produce high-error public keys; Decryption failure attacks require approximately 200,000 core-hours of supercomputing resources; Successful poisoning requires extreme engineering due to the 8-millisecond KeyGen window; Countermeasures are discussed to protect implementations against similar hardware-based attacks
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: FrodoKEM KeyGen runs on the order of 8 milliseconds; Attack requires approximately 200,000 core-hours; Prior Rowhammer attacks required up to 8 hours of persistent access
- **Target Audience**: Researcher; Security Architect; Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Leaders; Assess
- **Implementation Attack Surface**: Rowhammer; fault injection (DRAM bit flips); memory massaging algorithms ("Feng Shui"); performance degradation attack on SHAKE
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: IACR-2022-952-FrodoKEM-Rowhammer.html (20,044 bytes, 4,099 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:15:20

---

## ArXiv-2025-SLH-DSA-Rowhammer

- **Reference ID**: ArXiv-2025-SLH-DSA-Rowhammer
- **Title**: SLasH-DSA: Breaking SLH-DSA Using an Extensible End-to-End Rowhammer Framework
- **Authors**: arXiv
- **Publication Date**: 2025-09-01
- **Last Updated**: 2025-09-01
- **Document Status**: Preprint
- **Main Topic**: The document presents a software-only universal forgery attack on SLH-DSA using Rowhammer-induced bit flips to corrupt internal states and forge signatures without private key knowledge.
- **PQC Algorithms Covered**: SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jeremy Boy; Antoon Purnal; Anna Pätschke; Luca Wilke; Thomas Eisenbarth
- **PQC Products Mentioned**: Swage; OpenSSL 3.5.1
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE-128f; SHA2-128s; SHAKE-192f
- **Key Takeaways**: Rowhammer attacks can achieve universal signature forgery on SLH-DSA using software-only methods on commodity hardware; The attack requires one hour of hammering for deterministic parameter sets and eight hours for randomized sets; Post-processing time ranges from minutes to an hour depending on the parameter set; Theoretical soundness of PQC schemes does not guarantee immunity against real-world fault injection attacks; Implementation hardening or hardware defenses are necessary to mitigate Rowhammer threats.
- **Security Levels & Parameters**: SHAKE-128f; SHA2-128s; SHAKE-192f
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: One hour hammering time for deterministic parameter sets; Eight hours hammering time for randomized parameter sets; Post-processing ranging from minutes to an hour
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: OpenSSL 3.5.1; Commodity desktop and server hardware
- **Relevant PQC Today Features**: Algorithms; Threats; Assess; stateful-signatures; entropy-randomness
- **Implementation Attack Surface**: fault injection (Rowhammer)
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: ArXiv-2025-SLH-DSA-Rowhammer.html (47,823 bytes, 5,637 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:15:50

---

## EmergentMind-Nonce-Reuse-Crypto

- **Reference ID**: EmergentMind-Nonce-Reuse-Crypto
- **Title**: Nonce Reuse in Cryptography
- **Authors**: EmergentMind
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Overview of nonce reuse vulnerabilities in cryptographic protocols caused by weak PRNGs and misconfigurations, enabling key recovery and forgery attacks across classical schemes.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Golinelli et al.; Buchanan et al.; Gilchrist et al.; Euchner et al.; Ostertág; Nag et al.; Babu et al.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ECDSA; DSA; CSP (Content Security Policy); HTTP; LPWAN; PERIDOT
- **Infrastructure Layers**: Web caches; CDNs; Reverse proxies
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: ECDSA; DSA; ChaCha; Freestyle
- **Key Takeaways**: Weak PRNGs and caching errors are primary root causes of nonce reuse enabling key recovery; 26.3% of CSP-using sites exhibit nonce reuse, predominantly cross-session; Mitigation requires cryptographically secure PRNGs, strict one-time usage enforcement, and proper Cache-Control headers; Linear types in programming languages can enforce single-use nonces at compile time; Deterministic nonce generation (RFC 6979) avoids RNG-based bugs in signatures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 20.1% of domains deploy CSP; 22.6% of CSP-using sites use nonce-based policies; 26.3% of these sites exhibit nonce reuse; 93.8% of cases are cross-session reuse
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Cryptographically Secure PRNGs (e.g., crypto.randomBytes); Strict rotation discipline for single-use nonces; Compile-time enforcement via linear types (e.g., Rust); Cache-Control headers set to no-store, no-cache, must-revalidate; Deterministic nonce generation (RFC 6979)
- **Relevant PQC Today Features**: entropy-randomness; code-signing; api-security-jwt; iot-ot-pqc
- **Implementation Attack Surface**: nonce reuse, weak PRNGs, caching errors, protocol misconfigurations, server-side bugs, hard-coded nonce templates, single-instance factories, malicious deterministic nonce generation processes, affine relations between nonces, linear relations between nonces, application-layer mistakes, programming discipline failures, side-channel resistance requirements
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: repeated crawling, delta analysis, cache-busting probes, response header inspection, compile-time enforcement, formal definitions of nonce reuse, mathematical and statistical modeling of collision probability
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: cryptographically secure PRNGs, unpredictable RNGs, low-entropy pseudorandom sources, periodic entropy reseeding, crypto.randomBytes
- **Constrained Device & IoT Suitability**: resource-constrained networks, LPWAN, PERIDOT codes, minimal resource overhead, low-resource protocol designs
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Cache-Control headers (no-store, no-cache, must-revalidate), strict rotation discipline, single-use nonce enforcement, linear types, restricted abstract data types, Rust/ownership-based models, deterministic message-dependent nonce generation (RFC 6979), Freestyle randomized ciphers
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: EmergentMind-Nonce-Reuse-Crypto.html (231,925 bytes, 13,620 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:16:20

---

## Invicti-OWASP-CryptoFailures-2025

- **Reference ID**: Invicti-OWASP-CryptoFailures-2025
- **Title**: Cryptographic Failures: 2025 OWASP Top 10 Risk
- **Authors**: Invicti Security
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Analysis of cryptographic failures in the 2025 OWASP Top 10, focusing on misconfigurations, weak key management, and insecure protocol usage rather than algorithmic weaknesses.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Zbigniew Banach
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.2, HTTPS, SSL, HSTS
- **Infrastructure Layers**: Key Management, Secure key management systems
- **Standardization Bodies**: OWASP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES-256, RSA, SHA-256, MD5, SHA-1, bcrypt, scrypt, Argon2, RC4
- **Key Takeaways**: Stick to well-established secure algorithms like AES-256 and avoid custom or deprecated ones; Implement secure password hashing with modern algorithms like bcrypt, scrypt, or Argon2 with proper salting; Use HTTPS with TLS 1.2 or higher and ensure hardened SSL/TLS configurations including HSTS headers; Never hardcode encryption keys and use secure key management systems with periodic rotation; Employ automated security scanning (DAST) and penetration testing to identify cryptographic weaknesses.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, CISO, Compliance Officer
- **Implementation Prerequisites**: Use of pre-vetted cryptographic libraries; Adequate training for development teams; Suitable review processes; Automated security scanning tools (DAST); Penetration testing capabilities
- **Relevant PQC Today Features**: tls-basics, entropy-randomness, api-security-jwt, code-signing, pqc-risk-management
- **Implementation Attack Surface**: nonce reuse, weak entropy sources, insecure key storage, improper initialization vectors, hardcoded cryptographic keys, missing or ineffective HSTS headers, misconfigured TLS settings, plaintext data storage
- **Cryptographic Discovery & Inventory**: deprecated cipher detection (MD5, SHA-1, SSL, RC4), certificate inventory (valid and up to date certificates), algorithm enumeration (AES-256, RSA, SHA-256, bcrypt, scrypt, Argon2)
- **Testing & Validation Methods**: dynamic application security testing (DAST), penetration testing, automated security scanning, real-world attack simulation, vulnerability scanning
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: cryptographically secure pseudorandom number generators, sufficient randomness, entropy sources
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: open source (SCA), vulnerable dependencies, SBOM & License Risk, third-party library trust (pre-vetted cryptographic libraries)
- **Deployment & Migration Complexity**: key rotation, secure transport and communication (HTTPS with TLS 1.2 or higher), hardening SSL/TLS configurations, replacing deprecated algorithms
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: Invicti-OWASP-CryptoFailures-2025.html (128,975 bytes, 11,582 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:17:31

---

## KpqC-Competition-Results

- **Reference ID**: KpqC-Competition-Results
- **Title**: Korean Post-Quantum Cryptography Competition Final Results
- **Authors**: KISA; Ministry of Science and ICT; NIS Korea
- **Publication Date**: 2025-01-31
- **Last Updated**: 2025-01-31
- **Document Status**: Final Results
- **Main Topic**: Announcement of eight algorithms advancing to Round 2 of the KpqC Competition following evaluation of Round 1 submissions in South Korea.
- **PQC Algorithms Covered**: AIMer, NTRU+, HAETAE, PALOMA, MQ-Sign, REDOG, NCC-Sign, SMAUG+TiGER, Layered ROLLO-I, Enhanced pqsigRM, FIBS, GCKSign, Peregrine, SOLMAE
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Years mentioned: 2022, 2023
- **Applicable Regions / Bodies**: Regions: South Korea; Bodies: KpqC team, 양자내성암호연구단
- **Leaders Contributions Mentioned**: Jieun Ryu, Yongbhin Kim, Seungtai Yoon, Ju-Sung Kang, Yongjin Yeom, Chanki Kim, Young-Sik Kim, Jonghyun Kim, Jong Hwan Park, Dong-Chan Kim, Chang-Yeol Jeon, Yeonghyo Kim, Minji Kim, Jon-Lark Kim, Jihoon Hong, Terry Shue Chien Lau, YounJae Lim, Chik How Tan, Theo Fanuela Prabowo, Byung-Sun Won, Jung Hee Cheon, Hyeongmin Choe, Dongyeon Hong, Jeongdae Hong, Hyoeun Seong, Junbum Shin, MinJune Yi, Seunghwan Park, Chi-Gon Jung, Aesun Park, Joongeun Choi, Honggoo Kang, Seongkwang Kim, Jincheol Ha, Mincheol Son, Byeonghak Lee, Dukjae Moon, Joohee Lee, Sangyub Lee, Jihoon Kwon, Jihoon Cho, Hyojin Yoon, Jooyoung Lee, Jong-Seon No, Jinkyu Cho, Yongwoo Lee, Zahyun Koo, Suhri Kim, Youngdo Lee, Kisoon Yoon, Kwangsu Lee, Dong-Guk Han, Hwajeong Seo, Joo Woo, Julien Devevey, Tim Güneysu, Markus Krausz, Georg Land, Damien Stehlé, Kyung-Ah Shim, Jeongsu Kim, Youngjoo An, Eun-Young Seo, Joon-Woo Lee, Kwangjo Kim, Mehdi Tibouchi, Alexandre Wallet, Thomas Espitau, Akira Takahashi, Yang Yu, Sylvain Guilley
- **PQC Products Mentioned**: pqcrypto
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Email
- **Standardization Bodies**: KpqC (Korean Post-Quantum Cryptography)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: KpqC Competition Round 1 concluded with eight algorithms advancing to Round 2; Public scrutiny and analysis contributed to better outcomes in the competition; The selected candidates include both digital signature and PKE/KEM algorithms; Implementation packages and IPCC documents are available for all submissions; The competition aims to mature the PQC field in South Korea
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Leaders, Timeline
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: public scrutiny and analysis; official comments on candidate algorithms via kpqc-bulletin Google group
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: KpqC-Competition-Results.html (24,069 bytes, 3,448 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:18:28

---

## NIST-FIPS140-3-IG-PQC

- **Reference ID**: NIST-FIPS140-3-IG-PQC
- **Title**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **Authors**: NIST CMVP
- **Publication Date**: 2025-09-02
- **Last Updated**: 2025-09-02
- **Document Status**: Published Update
- **Main Topic**: Updated FIPS 140-3 Implementation Guidance adding self-test requirements for FIPS 203/204/205 PQC algorithms and new guidance for Key Encapsulation Mechanisms.
- **PQC Algorithms Covered**: HSS, SP 800-208 (LMS/XMSS)
- **Quantum Threats Addressed**: None detected (implementation guidance document, not threat-focused)
- **Migration Timeline Info**: Years mentioned: 2020, 2024, 2025; Keywords: sunset, required by
- **Applicable Regions / Bodies**: United States; Canada; National Institute of Standards and Technology; Canadian Centre for Cyber Security
- **Leaders Contributions Mentioned**: None detected in preview
- **PQC Products Mentioned**: None detected in preview
- **Protocols Covered**: TLS 1.2
- **Infrastructure Layers**: Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program; Key Encapsulation Mechanisms
- **Standardization Bodies**: National Institute of Standards and Technology; Canadian Centre for Cyber Security; ISO/IEC
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS 203; FIPS 204; FIPS 205; FIPS 186-5; SP 800-140; SP 800-38D; SP 800-38E; SP 800-38G; SP 800-186; SP 800-107; SP 800-208; SP 800-90B; SP 800-90A; SP 800-108; SP 800-132; SP 800-56CREV2; SP 800-133; SP 800-67REV2; SP 800-63B; ISO/IEC 24759:2017(E)
- **Classical Algorithms Referenced**: RSA; Triple-DES; HMAC; AES; XTS-AES; Elliptic Curves; FFC Safe-Prime Groups
- **Key Takeaways**: Guidance includes new self-test requirements for FIPS 203/204/205 algorithms; New guidance provided for Key Encapsulation Mechanisms; Document clarifies testing requirements for cryptographic modules under FIPS 140-3; Updates cover transition from FIPS 186-4 to FIPS 186-5; Guidance addresses entropy estimation and compliance with SP 800-90B
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Transition from FIPS 186-4 to FIPS 186-5; Transition of the TLS 1.2 KDF to support the Extended Master Secret
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Developer; Researcher
- **Implementation Prerequisites**: FIPS 140-3 conformance; NVLAP accredited Cryptographic and Security Testing Laboratories; Approved Security Functions per SP 800-140 series
- **Relevant PQC Today Features**: Compliance, Algorithms, Migrate, Assess, entropy-randomness
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Cryptographic Module Validation Program (CMVP), National Voluntary Laboratory Accreditation Program (NVLAP), Cryptographic and Security Testing (CST) Laboratories, FIPS 140-3 Derived Test Requirements (DTR), ISO/IEC 24759:2017(E), Cryptographic Algorithm Validation Program (CAVP), self-test requirements, pre-operational integrity technique self-test, cryptographic algorithm self-test, conditional manual entry self-test, periodic self-testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: NIST SP 800-90B, entropy estimation, min-entropy (implied by SP 800-90B context), randomness extraction (implied by post-processing in key generation), DRBG seeding (SP 800-90A DRBGs), critical security parameters for SP 800-90A DRBGs
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: CVE management, vendor affirmation (SP 800-208 HSS, SP 800-133), third-party library trust (implied by binding/embedding cryptographic modules and sub-chip cryptographic subsystems)
- **Deployment & Migration Complexity**: transition from FIPS 186-4 to FIPS 186-5, transition of TLS 1.2 KDF to support extended master secret, complete image replacement versus software/firmware loading
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST-FIPS140-3-IG-PQC.pdf (2,469,516 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:18:59

---

## 3GPP-PQC-Study-2025

- **Reference ID**: 3GPP-PQC-Study-2025
- **Title**: Study on Preparing for Transition to Post Quantum Cryptography in 3GPP
- **Authors**: 3GPP SA3
- **Publication Date**: 2025-05-01
- **Last Updated**: 2025-05-01
- **Document Status**: Study Item Approved
- **Main Topic**: Study on integrating standalone or hybrid PQC algorithms into existing 5G security protocols referencing TR 33.841.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA, hybrid key exchange
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: Years mentioned: 2020, 2021, 2022
- **Applicable Regions / Bodies**: Bodies: 3GPP
- **Leaders Contributions Mentioned**: 3GPP SA3 working group contributors
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKEv2
- **Infrastructure Layers**: Telecommunications, Mobile Networks, IoT/OT
- **Standardization Bodies**: 3GPP
- **Compliance Frameworks Referenced**: 3GPP TS 33.501
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Study covers integration of standalone or hybrid PQC algorithms into 5G; Focus includes TLS, IPSec, and IKEv2 protocols; References TR 33.841 for PQC study details
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQC
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security, hybrid-crypto, tls-basics, vpn-ssh-pqc
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: 3GPP-PQC-Study-2025.html (32,792 bytes, 774 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:20:16

---

## liboqs-v0.15.0

- **Reference ID**: liboqs-v0.15.0
- **Title**: Open Quantum Safe liboqs Library v0.15.0
- **Authors**: Open Quantum Safe; Linux Foundation PQCA
- **Publication Date**: 2025-11-14
- **Last Updated**: 2025-11-14
- **Document Status**: Released
- **Main Topic**: Open Quantum Safe liboqs is an open source C library providing implementations of quantum-safe key encapsulation and digital signature algorithms with a common API.
- **PQC Algorithms Covered**: BIKE, Classic McEliece, CROSS, Falcon, FrodoKEM, HQC, Kyber, LMS, MAYO, ML-DSA, ML-KEM, NTRU, NTRU-Prime, SLH-DSA, SNOVA, UOV, XMSS
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2020, 2021, 2022, 2023, 2024, 2025
- **Applicable Regions / Bodies**: Regions: United States, Bodies: NIST
- **Leaders Contributions Mentioned**: Open Quantum Safe project team
- **PQC Products Mentioned**: liboqs, PQClean
- **Protocols Covered**: TLS, SSH, X.509, CMS, S/MIME
- **Infrastructure Layers**: Cryptographic Libraries, Development Tools
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: liboqs provides a common API to easily switch between post-quantum algorithms; implementations are derived from reference and optimized code submitted to the NIST Post-Quantum Cryptography Standardization Project; the library supports Linux, macOS, and Windows on x86_64 and ARM architectures; version 0.15.0 includes updated implementations of NIST-standardized ML-KEM, ML-DSA, and SLH-DSA
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: clang compiler; gcc compiler; Microsoft compilers; x86_64 architecture; ARM architecture; Linux operating system; macOS operating system; Windows operating system
- **Relevant PQC Today Features**: Algorithms, tls-basics, vpn-ssh-pqc, email-signing, pki-workshop
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: test harness, benchmarking routines
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: ARM architectures, x86_64 architectures
- **Supply Chain & Vendor Risk**: open source, MIT License, external components, PQClean project, NIST Post-Quantum Cryptography Standardization Project
- **Deployment & Migration Complexity**: common API, switch between algorithms, algorithm datasheets
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: liboqs-v0.15.0.html (20,453 bytes, 3,472 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:20:39

---

## FIPS 203

- **Reference ID**: FIPS 203
- **Title**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **Authors**: NIST
- **Publication Date**: 2024-08-13
- **Last Updated**: 2026-04-12
- **Document Status**: Final Standard
- **Main Topic**: This document specifies the Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM) with three parameter sets for quantum-resistant key establishment.
- **PQC Algorithms Covered**: ML-KEM, CRYSTALS-KYBER
- **Quantum Threats Addressed**: Adversaries who possess a quantum computer
- **Migration Timeline Info**: Years mentioned: 2022, 2024
- **Applicable Regions / Bodies**: United States; Federal agencies; contractors of an agency
- **Leaders Contributions Mentioned**: Gina M. Raimondo, Secretary; Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology; Kevin M. Stine, Director Information Technology Laboratory
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ML-KEM key encapsulation mechanism, symmetric-key cryptographic algorithms
- **Infrastructure Layers**: Key establishment; shared secret key generation
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); Department of Commerce
- **Compliance Frameworks Referenced**: Federal Information Processing Standards (FIPS); Federal Information Security Management Act (FISMA); SP 800-140C; SP 800-227
- **Classical Algorithms Referenced**: SHAKE128
- **Key Takeaways**: ML-KEM is the standardized algorithm for quantum-resistant key encapsulation with three parameter sets; Implementations must guard against disclosure of randomness, decapsulation keys, and shared secret keys; NIST will formally reevaluate this standard every five years; Conformance to the standard does not guarantee overall system security; The standard applies to federal agencies and is available for private adoption.
- **Security Levels & Parameters**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Sizes of keys and ciphertexts are defined in Table 3; Decapsulation failure rates are defined in Table 1; Performance decreases as security strength increases from ML-KEM-512 to ML-KEM-1024
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Conformity with approved cryptographic algorithms per FIPS or SP 800-140C; adherence to export controls by Bureau of Industry and Security; awareness of patent license agreements for CRYSTALS-KYBER
- **Relevant PQC Today Features**: Algorithms, Compliance, Migrate, Assess, pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: NIST validation program, conformance testing, example values
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: patent license agreements, CRYSTALS-KYBER derivation
- **Deployment & Migration Complexity**: effective immediately upon final publication, five-year reevaluation schedule
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: FIPS_203.pdf (1,252,341 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:21:10

---

## FIPS 204

- **Reference ID**: FIPS 204
- **Title**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **Authors**: NIST
- **Publication Date**: 2024-08-13
- **Last Updated**: 2026-04-12
- **Document Status**: Final Standard
- **Main Topic**: This document specifies the Module-Lattice-Based Digital Signature Standard (ML-DSA) with three parameter sets for generating and verifying digital signatures secure against quantum computers.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Adversaries in possession of a large-scale quantum computer
- **Migration Timeline Info**: Years mentioned: 2024
- **Applicable Regions / Bodies**: United States; federal departments and agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo, Secretary; Laurie E. Locascio, NIST Director and Under Secretary of Commerce for Standards and Technology; Kevin M. Stine, Director Information Technology Laboratory
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: ML-DSA digital signature algorithm, signature generation and verification procedures
- **Infrastructure Layers**: PKI, Firmware
- **Standardization Bodies**: National Institute of Standards and Technology; Department of Commerce
- **Compliance Frameworks Referenced**: FIPS 204; FIPS 205; FIPS 186-5; NIST Special Publication 800-208; SP 800-140C; Federal Information Security Management Act (FISMA)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-DSA is approved for protecting sensitive unclassified information in federal systems; Implementations must employ cryptographic algorithms approved for Federal Government-sensitive information; Digital signature key pairs shall not be used for other purposes; The standard will be reviewed every five years to assess its adequacy; Conformance to the standard does not ensure that a particular implementation is secure.
- **Security Levels & Parameters**: ML-DSA parameter sets 44, 65, 87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Sizes of keys and signatures defined in Table 2; No floating-point arithmetic permitted
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Use of approved cryptographic algorithms per FIPS or NIST recommendations; Maintenance of private key secrecy; Validation program conformance testing
- **Relevant PQC Today Features**: Algorithms, Compliance, Migrate, digital-id, code-signing
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: NIST validation program, conformance testing, example values
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: Randomness Generation
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: FIPS 204, FIPS 205, FIPS 186-5, NIST Special Publication 800-208
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: FIPS_204.pdf (3,291,746 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:22:09

---

## FIPS 205

- **Reference ID**: FIPS 205
- **Title**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **Authors**: NIST
- **Publication Date**: 2024-08-13
- **Last Updated**: 2026-04-12
- **Document Status**: Final Standard
- **Main Topic**: This document specifies the Stateless Hash-Based Digital Signature Standard (SLH-DSA) based on SPHINCS+ for federal and commercial use.
- **PQC Algorithms Covered**: SLH-DSA, SPHINCS+, WOTS+, XMSS, FORS
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum, Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2024
- **Applicable Regions / Bodies**: United States; Federal departments and agencies
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary of Commerce); Laurie E. Locascio (NIST Director); Kevin M. Stine (Director, Information Technology Laboratory)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SLH-DSA stateless hash-based digital signature scheme, SPHINCS+ signature generation and verification
- **Infrastructure Layers**: Firmware
- **Standardization Bodies**: National Institute of Standards and Technology (NIST), Department of Commerce
- **Compliance Frameworks Referenced**: FIPS 205, FIPS 204, FIPS 186-5, NIST Special Publication 800-208, SP 800-140C, Federal Information Security Management Act (FISMA)
- **Classical Algorithms Referenced**: SHAKE, SHA2
- **Key Takeaways**: SLH-DSA is a stateless hash-based signature scheme selected for standardization by NIST; The standard specifies 12 parameter sets using SHAKE and SHA2; Implementation conformance does not guarantee overall system security; Federal agencies must use this standard or FIPS 204/FIPS 186-5/SP 800-208 for public-key signature systems; Private keys must be guarded to ensure the security of the digital signature system.
- **Security Levels & Parameters**: Security Category 1, Security Categories 3 and 5, SLH-DSA Using SHAKE, SLH-DSA Using SHA2
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Larger signatures compared to stateful alternatives; No specific byte sizes provided in text
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Approved cryptographic algorithms per FIPS or NIST recommendations; Conformance to validation program procedures; Secure design and build of implementation modules
- **Relevant PQC Today Features**: Algorithms, Compliance, stateful-signatures, digital-id, code-signing
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: NIST validation program, conformance testing, example values
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: adoption available to private and commercial organizations, effective immediately upon final publication, five-year review schedule
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: FIPS_205.pdf (1,055,752 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:23:13

---

## FIPS 206

- **Reference ID**: FIPS 206
- **Title**: FFT over NTRU-Lattice-Based Digital Signature Algorithm (FN-DSA)
- **Authors**: NIST
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-12-09
- **Document Status**: Draft Standard (not yet published)
- **Main Topic**: NIST's ongoing standardization of post-quantum cryptography including the FN-DSA (FALCON) algorithm and migration guidance for organizations.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FALCON, HQC, FN-DSA
- **Quantum Threats Addressed**: Future threat of quantum computers breaking widely used cryptographic systems
- **Migration Timeline Info**: NIST will deprecate and ultimately remove quantum-vulnerable algorithms from its standards by 2035; high-risk systems transitioning much earlier
- **Applicable Regions / Bodies**: United States; NIST, National Cybersecurity Center of Excellence (NCCoE)
- **Leaders Contributions Mentioned**: Dr. Dustin Moody
- **PQC Products Mentioned**: pqcrypto
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS 203, FIPS 204, FIPS 205, NIST IR 8547
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should begin applying PQC standards now to migrate systems; NIST will remove quantum-vulnerable algorithms by 2035; FN-DSA offers significantly smaller signatures than ML-DSA; Additional digital signature schemes are being evaluated as backups to ML-DSA
- **Security Levels & Parameters**: FN-DSA parameter sets 512 and 1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: FN-DSA offers significantly smaller signatures than ML-DSA
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Researcher
- **Implementation Prerequisites**: Identify where vulnerable algorithms are used; plan to replace or update them
- **Relevant PQC Today Features**: Timeline, Threats, Migrate, Algorithms, Compliance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: tools to find and prioritize vulnerable systems; identify where vulnerable algorithms are used
- **Testing & Validation Methods**: Cryptographic Module Validation Program
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: organizations should begin migrating their systems to quantum-resistant cryptography; Cybersecurity products, services, and protocols will need updates; NIST will deprecate and ultimately remove quantum-vulnerable algorithms from its standards by 2035; high-risk systems transitioning much earlier
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: FIPS_206.html (61,302 bytes, 7,144 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:24:14

---

## FIPS 186-5

- **Reference ID**: FIPS 186-5
- **Title**: Digital Signature Standard (DSS)
- **Authors**: NIST
- **Publication Date**: 2023-02-03
- **Last Updated**: 2025-05-12
- **Document Status**: Final Standard
- **Main Topic**: FIPS 186-5 specifies the Digital Signature Standard (DSS) algorithms including RSA, ECDSA, and EdDSA while removing DSA for federal use.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum Computer
- **Migration Timeline Info**: FIPS 186-4 remains in effect for one year following publication before withdrawal; standard effective February 3, 2023.
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; Department of Commerce; federal departments and agencies.
- **Leaders Contributions Mentioned**: Gina M. Raimondo (Secretary); Laurie E. Locascio (NIST Director); Charles H. Romine (Director, Information Technology Laboratory).
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: RSA (RFC 8017), ECDSA (ANS X9.62, RFC 6979), EdDSA (RFC 8032), HashEdDSA, RSASSA-PSS, RSASSA-PKCS1-v1.5
- **Infrastructure Layers**: Public key-based signature systems; Cryptographic Module Validation Program.
- **Standardization Bodies**: National Institute of Standards and Technology; Department of Commerce.
- **Compliance Frameworks Referenced**: FIPS 186-5; FIPS 186-4; FIPS 180; FIPS 202; FIPS 140-3; Federal Information Security Management Act (FISMA).
- **Classical Algorithms Referenced**: RSA; ECDSA; EdDSA; DSA; SHA-3.
- **Key Takeaways**: DSA is removed from the Digital Signature Standard suite; RSA, ECDSA, and EdDSA are the approved algorithms for digital signatures; FIPS 186-4 remains valid for one year to facilitate transition; private keys must be kept secret to ensure signature security; standard applies to federal departments and is available for private adoption.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: One-year overlap period allowing agencies to use either FIPS 186-5 or FIPS 186-4.
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Developer, Policy Maker
- **Implementation Prerequisites**: Use of approved hash functions from FIPS 180 or FIPS 202; conformance to FIPS 140-3 for cryptographic modules; validation through Cryptographic Module Validation Program.
- **Relevant PQC Today Features**: Compliance, Migrate, Algorithms, digital-id, code-signing
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Cryptographic Module Validation Program; conformance testing; example values
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: transition to FIPS 186-5; one-year period following publication; FIPS 186-4 remains in effect for a period of one year; FIPS 186-4 will be withdrawn
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: FIPS_186-5.pdf (1,844,414 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:24:51

---

## NIST SP 800-208

- **Reference ID**: NIST SP 800-208
- **Title**: Recommendation for Stateful Hash-Based Signature Schemes
- **Authors**: NIST
- **Publication Date**: 2020-10-29
- **Last Updated**: 2020-10-29
- **Document Status**: Final
- **Main Topic**: This recommendation specifies the Leighton-Micali Signature (LMS) and eXtended Merkle Signature Scheme (XMSS) stateful hash-based signature algorithms for digital signatures.
- **PQC Algorithms Covered**: LMS, XMSS, HSS, XMSSMT, LM-OTS, WOTS+
- **Quantum Threats Addressed**: Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2020; Keywords: prohibited
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget
- **Leaders Contributions Mentioned**: David A. Cooper; Daniel C. Apon; Quynh H. Dang; Michael S. Davidson; Morris J. Dworkin; Carl A. Miller
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Digital signature schemes, FIPS 186 (supplemented), Hash-based signatures, RFC 8554 (LMS/HSS), RFC 8391 (XMSS)
- **Infrastructure Layers**: Key Management; Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA); OMB Circular A-130; Cryptographic Algorithm Validation Program (CAVP); Cryptographic Module Validation Program (CMVP)
- **Classical Algorithms Referenced**: SHA-256; SHAKE256
- **Key Takeaways**: Stateful hash-based signature schemes require strict maintenance of state to prevent key reuse; LMS and XMSS are specified with parameter sets using SHA-256 and SHAKE256; Conformance testing for implementations must follow CAVP and CMVP frameworks; The document defines requirements for one-time signature systems and Merkle tree structures.
- **Security Levels & Parameters**: SHA-256; SHA-256/192; SHAKE256/256; SHAKE256/192
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: Conformance testing within CAVP and CMVP frameworks; Proper maintenance of state for one-time signature systems; Random number generation requirements for keys and signatures
- **Relevant PQC Today Features**: Algorithms, stateful-signatures, compliance, merkle-tree-certs, entropy-randomness
- **Implementation Attack Surface**: One-Time Signature Key Reuse; Hash Collisions
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Cryptographic Algorithm Validation Program (CAVP); Cryptographic Module Validation Program (CMVP); Conformance testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: Random Number Generation for Keys and Signatures; LMS and HSS Random Number Generation Requirements; XMSS and XMSSMT Random Number Generation Requirements
- **Constrained Device & IoT Suitability**: firmware signing; External Device Operations
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: planning and transition purposes; federal agencies may wish to closely follow the development of these new publications by NIST
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST_SP_800-208.pdf (872,986 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:25:46

---

## NIST SP 800-227

- **Reference ID**: NIST SP 800-227
- **Title**: Recommendations for Key-Encapsulation Mechanisms
- **Authors**: NIST
- **Publication Date**: 2025-09-18
- **Last Updated**: 2025-09-18
- **Document Status**: Final
- **Main Topic**: This document provides recommendations for implementing and using Key-Encapsulation Mechanisms (KEMs) securely, including hybrid KEMs and FIPS 140 validation requirements.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Cryptographic attacks that make use of a large-scale, cryptanalytically relevant quantum computer
- **Migration Timeline Info**: Years mentioned: 2025; Keywords: shall use
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget
- **Leaders Contributions Mentioned**: Gorjan Alagic; Elaine Barker; Lily Chen; Dustin Moody; Angela Robinson; Hamilton Silberg; Noah Waller
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Key-encapsulation mechanisms (KEMs), Key establishment, Symmetric-key cryptographic algorithms, NIST PQC standardization suite, Composite/hybrid schemes
- **Infrastructure Layers**: Key establishment; FIPS 140 validated cryptographic modules
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: Federal Information Security Modernization Act (FISMA) of 2014; OMB Circular A-130; FIPS 140; FIPS 203; NIST Special Publication 800-56A; NIST Special Publication 800-56B
- **Classical Algorithms Referenced**: Diffie-Hellman; RSA
- **Key Takeaways**: KEMs are the preferred post-quantum key-establishment schemes for standardization and widespread deployment; Implementations of approved KEMs must satisfy requirements for FIPS 140 validated cryptographic modules; Vendors should securely combine keying material from post-quantum methods with other potentially quantum-vulnerable methods using approved key combiners; Shared secret keys established via KEMs are used with symmetric-key algorithms for encryption and authentication.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Multi-Algorithm KEMs; PQ/T Hybrids; Composite KEM; Approved Key Combiners
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Policy Maker
- **Implementation Prerequisites**: FIPS 140 validated cryptographic modules; Approved key combiners for composite schemes
- **Relevant PQC Today Features**: Algorithms; hybrid-crypto; compliance-strategy; migration-program; pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: FIPS 140 validation; conformance testing with NIST standards
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: migration from quantum-vulnerable key-establishment procedures to post-quantum KEMs; hybrid KEMs combining post-quantum methods with other methods; transition planning for federal agencies
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST_SP_800-227.pdf (902,987 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:26:44

---

## NIST IR 8547

- **Reference ID**: NIST IR 8547
- **Title**: Transition to Post-Quantum Cryptography Standards
- **Authors**: NIST
- **Publication Date**: 2024-11-12
- **Last Updated**: 2026-04-12
- **Document Status**: Initial Public Draft
- **Main Topic**: NIST's roadmap and strategy for transitioning from quantum-vulnerable cryptographic algorithms to post-quantum digital signature algorithms and key-establishment schemes.
- **PQC Algorithms Covered**: Module-Lattice-Based Key-Encapsulation Mechanism, Module-Lattice-Based Digital Signature Algorithm, Stateless Hash-Based Signature Algorithm
- **Quantum Threats Addressed**: harvest now, decrypt later; future quantum computing breaking current algorithms
- **Migration Timeline Info**: Years mentioned: 2024, 2025; Keywords: deprecat, disallow
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; federal agencies
- **Leaders Contributions Mentioned**: Dustin Moody; Ray Perlner; Andrew Regenscheid; Angela Robinson; David Cooper
- **PQC Products Mentioned**: OpenSSL, BoringSSL
- **Protocols Covered**: TLS, SSH, IPsec, CMS
- **Infrastructure Layers**: PKI; Cryptographic Hardware; Software Cryptographic Libraries; IT Applications and Services
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: FIPS203; FIPS204; FIPS205
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Transition to post-quantum cryptography is urgent due to the harvest now, decrypt later threat; The journey from algorithm standardization to full integration can take 10 to 20 years; NIST has released three PQC standards to initiate the transition phase; Organizations must plan for the deprecation and eventual removal of quantum-vulnerable algorithms
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid Key-Establishment Techniques; Hybrid Digital Signature Techniques
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Algorithms; hybrid-crypto
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: essential patent claims, third-party library trust (implied by software cryptographic libraries section), procurement risk (implied by procuring products and services)
- **Deployment & Migration Complexity**: migration phase (assess/plan/test/migrate/launch not explicitly named but transition stages described), breaking changes (deprecation and removal of quantum-vulnerable algorithms), backward compatibility (hybrid techniques), effort estimation (10 to 20 years for full integration), phased rollout (controlled legacy use)
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST_IR_8547.pdf (722,379 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:27:51

---

## NIST IR 8545

- **Reference ID**: NIST IR 8545
- **Title**: Status Report on the Fourth Round of the NIST PQC Standardization Process
- **Authors**: NIST
- **Publication Date**: 2025-03-11
- **Last Updated**: 2025-03-11
- **Document Status**: Final
- **Main Topic**: NIST selects HQC as the fourth-round post-quantum key-establishment algorithm for standardization to augment its cryptographic portfolio.
- **PQC Algorithms Covered**: BIKE, Classic McEliece, HQC, SIKE, CRYSTALS-Kyber, ML-KEM, CRYSTALS-Dilithium, ML-DSA, Falcon, FN-DSA, SPHINCS+, SLH-DSA
- **Quantum Threats Addressed**: Quantum Computer, Post-Quantum
- **Migration Timeline Info**: March 2025: Announcement of fourth-round candidate algorithm to be standardized; July 2022: Announcement of candidate algorithms advancing to the fourth round; August 2024: Final versions of FIPS 203, FIPS 204, and FIPS 205 published
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology (NIST); U.S. Department of Commerce; federal agencies
- **Leaders Contributions Mentioned**: Gorjan Alagic, Maxime Bros, Pierre Ciadoux, David Cooper, Quynh Dang, Thinh Dang, John Kelsey, Jacob Lichtinger, Yi-Kai Liu, Carl Miller, Dustin Moody, Rene Peralta, Ray Perlner, Angela Robinson, Hamilton Silberg, Daniel Smith-Tone, Noah Waller, Zuzana Bajcsy, Lily Chen, Morris Dworkin, Sara Kerman, Andrew Regenscheid
- **PQC Products Mentioned**: pqcrypto, Signal
- **Protocols Covered**: TLS 1.3, TLS, SSH, IPsec, QUIC
- **Infrastructure Layers**: None detected.
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: FIPS 186-5, SP 800-56Ar3, SP 800-56Br2, FIPS 203, FIPS 204, FIPS 205, SP 800-227
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: HQC is the only fourth-round key-establishment algorithm selected for standardization; SIKE was acknowledged as insecure by its submitters and not standardized; NIST aims to provide cryptographic diversity with code-based algorithms alongside lattice-based standards; Federal agencies may use concepts from this report before companion publications are completed; The selection process relied on public feedback and internal reviews of security, cost, and performance
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Performance data for BIKE, HQC, and Classic McEliece provided in thousands of cycles on x86_64; Key and ciphertext sizes in bytes provided for BIKE, HQC, and Classic McEliece
- **Target Audience**: Security Architect, Researcher, Policy Maker, Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline, Algorithms, Leaders, Compliance, Migrate
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST_IR_8545.pdf (588,999 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:28:51

---

## HQC Specification

- **Reference ID**: HQC Specification
- **Title**: Hamming Quasi-Cyclic (HQC) Algorithm Specification
- **Authors**: NIST/HQC Team
- **Publication Date**: 2024-02-23
- **Last Updated**: 2025-08-22
- **Document Status**: NIST Round 4 Selection
- **Main Topic**: Specification and design evolution of the Hamming Quasi-Cyclic (HQC) code-based Key Encapsulation Mechanism selected as a backup to ML-KEM.
- **PQC Algorithms Covered**: HQC, HQC-PKE, HQC-KEM, HQC-RMRS
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Selected March 2025; Draft FIPS expected 2026; Final FIPS expected 2027
- **Applicable Regions / Bodies**: Bodies: NIST
- **Leaders Contributions Mentioned**: Philippe Gaborit, Carlos Aguilar-Melchor, Nicolas Aragon, Slim Bettaieb, Loïc Bidoux, Olivier Blazy, Jean-Christophe Deneuville, Edoardo Persichetti, Gilles Zémor, Jurjen Bos, Arnaud Dion, Jérôme Lacan, Jean-Marc Robert, Pascal Véron, Paulo L. Barreto, Santosh Ghosh, Shay Gueron, Tim Güneysu, Rafael Misoczki, Jan Richter-Brokmann, Nicolas Sendrier, Jean-Pierre Tillich, Valentin Vasseur
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Fujisaki-Okamoto transformation, HHK framework
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: FIPS-203
- **Classical Algorithms Referenced**: SHA3-512, SHAKE256
- **Key Takeaways**: HQC is a code-based KEM selected as a backup to ML-KEM with final standardization expected in 2027; The scheme uses the salted SFO transform and updated keypair formats to improve security against multi-target attacks; Parameter sets were adjusted to target security levels of 128 and 192 bits rather than 256; Implementation updates include refactoring for readability and aligning with FIPS-203 design choices such as using SHA3-512.
- **Security Levels & Parameters**: Security levels 128 and 192; K and theta sizes reduced to 32 bytes; DFR lower than 2^-128
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: K and theta sizes reduced from 40 to 32 bytes; First 32 bytes of public key used for countermeasures; Performance gains in hardware implementation via variable sampling order modification
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: Source code available at https://pqc-hqc.org; Use of SHA3-512 instead of SHAKE256; Adoption of salted SFO transform
- **Relevant PQC Today Features**: Algorithms, Timeline, Leaders, Assess, pqc-101
- **Implementation Attack Surface**: timing attack countermeasures via constant-weight words sampling; multi-target attacks mitigated by including only first 32 bytes of public key; multi-ciphertext attacks countered by adding salt and ekKEM to randomness θ derivation
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Known Answer Test values provided in Section 5.3; reference implementation and optimized implementation described for performance analysis
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: uniform distribution sampling via rejection sampling (SampleFixedWeightVect$); salted SFO̸⊥ transform used for randomness derivation
- **Constrained Device & IoT Suitability**: performance gains in hardware implementation achieved by modifying order of variable sampling; concatenated Reed-Muller and Reed-Solomon codes introduced to decrease public key sizes
- **Supply Chain & Vendor Risk**: source code available at https://pqc-hqc.org; team includes submitters from SandboxAQ, Intel, Meta, Worldline, Thales, Technology Innovation Institute, and various universities
- **Deployment & Migration Complexity**: refactored document for readability with detailed figures; updated keypair format to allow easy checking if received from third party; alternative compressed format included for decapsulation key; alignment with FIPS-203 design choices including SHA3-512 usage
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: HQC_Specification.pdf (876,126 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:29:50

---

## RFC 9629

- **Reference ID**: RFC 9629
- **Title**: Using Key Encapsulation Mechanism (KEM) Algorithms in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2024-08-01
- **Last Updated**: 2024-08-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines the KEMRecipientInfo structure and conventions for using Key Encapsulation Mechanism algorithms, including ML-KEM, in the Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Post-Quantum, quantum-secure KEM algorithms, cryptographically relevant quantum computers (CRQCs)
- **Migration Timeline Info**: Years mentioned: 2023, 2024
- **Applicable Regions / Bodies**: Regions: International
- **Leaders Contributions Mentioned**: Russ Housley; John Gray; Tomofumi Okubo
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS); X.509
- **Infrastructure Layers**: PKI; Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: RFC 2119 (BCP 14), RFC 5652 (CMS), RFC 5083, RFC 5280, RFC 5869 (HKDF), RFC 5911, RFC 5912, RFC 6268
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: CMS now supports KEM algorithms for encrypting and decrypting content via the new KEMRecipientInfo structure; The KEMRecipientInfo uses a pairwise shared secret derived from KEM to generate a key-encryption key (KEK); Implementations must support both issuerAndSerialNumber and subjectKeyIdentifier alternatives for recipient identification; Security depends on the KEM algorithm being secure against adaptive chosen ciphertext attacks and matching security levels of the KDF and key-encryption algorithm; The document updates RFC 5652 to include conventions for quantum-secure KEM algorithms.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: kekLength INTEGER (1..65535)
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Implement KEM Encapsulate function for originators; Implement KEM KeyGen and Decapsulate functions for recipients; Support both issuerAndSerialNumber and subjectKeyIdentifier alternatives for recipient processing; Confirm kekLength value is consistent with the key-encryption algorithm.
- **Relevant PQC Today Features**: Algorithms; pki-workshop; crypto-agility; tls-basics; email-signing
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Updates RFC 5652; defines KEMRecipientInfo structure for CMS enveloped-data and authenticated-enveloped-data content types; requires implementations to support both issuerAndSerialNumber and subjectKeyIdentifier alternatives for recipient processing; specifies version number handling to ensure maximum interoperability; mandates support for KEM Encapsulate, KeyGen, and Decapsulate functions.
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9629.html (87,310 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:31:17

---

## RFC 9708

- **Reference ID**: RFC 9708
- **Title**: Use of the HSS/LMS Hash-Based Signature Algorithm in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Standards Track
- **Main Topic**: This document specifies conventions for using the HSS/LMS hash-based signature algorithm with the Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: HSS, LMS, LM-OTS
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers (CRQCs)
- **Migration Timeline Info**: Years mentioned: 2025
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Russ Housley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMS, X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, IESG, IANA
- **Compliance Frameworks Referenced**: BCP 78, Revised BSD License
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA, EdDSA, SHA-256, SHAKE256
- **Key Takeaways**: HSS/LMS signatures are post-quantum secure as they rely on hash functions rather than factoring or discrete logarithms; The algorithm supports fixed signing operations dependent on tree size with small public keys but large signature sizes; Plans exist to include HSS/LMS public keys in X.509 certificates; Parameter sets currently defined use SHA-256 and SHAKE256 hash functions; This document obsoletes RFC 8708 to update ASN.1 definitions and expand supported tree sizes.
- **Security Levels & Parameters**: h=5, h=10, h=15, h=20, h=25; m=32; w=1, w=2, w=4, w=8; SHA-256; SHAKE256
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Small public keys; Low computational cost; Large signatures; Private key size varies based on computation vs memory trade-off
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: ASN.1 Basic Encoding Rules (BER); ASN.1 Distinguished Encoding Rules (DER); SHA-256 or SHAKE256 hash function support
- **Relevant PQC Today Features**: stateful-signatures, merkle-tree-certs, email-signing, pki-workshop, algorithms
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: generation of C, an n-byte random value
- **Constrained Device & IoT Suitability**: small public keys, low computational cost, signatures are quite large, private key can be very small when signer performs additional computation at signing time, private key can consume additional memory for faster signing time
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: obsoletes RFC 8708, changes since RFC 8708 include updated ASN.1 module definition and expanded tree sizes, protection of software updates to enable deployment of software implementing new cryptosystems
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9708.html (86,418 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:32:17

---

## RFC 9794

- **Reference ID**: RFC 9794
- **Title**: Terminology for Post-Quantum Traditional Hybrid Schemes
- **Authors**: IETF PQUIP
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Informational
- **Main Topic**: Defines terminology for post-quantum traditional hybrid schemes including composite KEMs and signatures to ensure consistency across protocols and standards.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: Shor's Algorithm; Cryptographically Relevant Quantum Computer (CRQC); Harvest Now Decrypt Later
- **Migration Timeline Info**: Years mentioned: 2025
- **Applicable Regions / Bodies**: United Kingdom; UK National Cyber Security Centre; Naval Postgraduate School
- **Leaders Contributions Mentioned**: F. Driscoll; M. Parsons; B. Hale
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); National Institute of Standards and Technology (NIST); European Telecommunications Standards Institute (ETSI)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; Elliptic Curve Diffie-Hellman (ECDH)
- **Key Takeaways**: Hybrid schemes combine post-quantum and traditional algorithms to mitigate risks during transition; Terminology consistency is required across protocols, standards, and organizations; Data encrypted today with vulnerable algorithms can be stored for future decryption by a CRQC; The term hybrid is overloaded in cryptography but established for PQ/T combinations in the PQC community
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Post-Quantum Traditional (PQ/T) hybrid scheme; multi-algorithm scheme; composite KEMs; hybrid key establishment; hybrid key exchanges
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms; Threats; Hybrid-crypto; Crypto-agility; Tls-basics
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: ease of migration from an ecosystem where only traditional algorithms are implemented and used to one that only uses post-quantum algorithms; transition from traditional to post-quantum algorithms
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9794.html (98,080 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:33:21

---

## RFC 9802

- **Reference ID**: RFC 9802
- **Title**: Use of HSS and XMSS Hash-Based Signature Algorithms in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Proposed Standard
- **Main Topic**: Defines OIDs and certificate structures for stateful hash-based signatures (HSS, XMSS, XMSS MT) in X.509 PKI.
- **PQC Algorithms Covered**: HSS, XMSS, XMSS MT
- **Quantum Threats Addressed**: Quantum Computer
- **Migration Timeline Info**: Years mentioned: 2021, 2024, 2025
- **Applicable Regions / Bodies**: Regions: France, International, Bodies: ANSSI
- **Leaders Contributions Mentioned**: Daniel Van Geest, Kaveh Bashiri, Scott Fluhrer, Stefan-Lukas Gazdag, Stavros Kousidis
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: CNSA 2.0, SP800208
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Stateful HBS schemes are intended for applications with long lifetimes where transition is impractical; OTS key reuse must be prevented through state management strategies; Use cases include firmware signing, software signing, and CA certificates; Root CAs are more appropriate for stateful HBS than subordinate CAs due to lower signature counts; Secure private key backup and restoration mechanisms are required.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 2^60 signatures possible with larger signature size and longer signing time
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: State management strategies to prevent OTS key reuse; secure private key backup and restoration mechanisms; predictable range of signature counts below maximum capacity
- **Relevant PQC Today Features**: pki-workshop, stateful-signatures, code-signing, iot-ot-pqc, merkle-tree-certs
- **Implementation Attack Surface**: nonce reuse prevention via state management; OTS key reuse mitigation through secured signing environments
- **Cryptographic Discovery & Inventory**: algorithm enumeration via OIDs (id-alg-hss-lms-hashsig, id-alg-xmss-hashsig, id-alg-xmssmt-hashsig); certificate inventory for CA and end-entity X.509 structures
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: multi-party Internet of Things (IoT) ecosystems; firmware signing; software signing
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: stateful HBS schemes unsuitable for interactive protocols; backup and restore management required; long lifetime implementations; transition challenges once deployed
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9802.html (147,657 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:34:11

---

## RFC 9810

- **Reference ID**: RFC 9810
- **Title**: Certificate Management Protocol (CMP) Updates for KEM
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-07-01
- **Last Updated**: 2025-07-01
- **Document Status**: Standards Track
- **Main Topic**: RFC 9810 updates the Certificate Management Protocol (CMP) to support Key Encapsulation Mechanism (KEM) public keys and EnvelopedData structures while obsoleting RFC 4210 and RFC 9480.
- **PQC Algorithms Covered**: KEM
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025; Keywords: deprecat
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Hendrik Brockhaus; David von Oheimb; Mike Ounsworth; John Gray
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Certificate Management Protocol (CMP); X.509 Public Key Infrastructure; Cryptographic Message Syntax (CMS)
- **Infrastructure Layers**: PKI; Registration Authority; Certification Authority; Key Generation Authority
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: BCP 78; Revised BSD License
- **Classical Algorithms Referenced**: DH
- **Key Takeaways**: CMP version 3 is introduced to support EnvelopedData instead of EncryptedValue for better crypto agility; The protocol adds explicit support for managing certificates containing Key Encapsulation Mechanism (KEM) public keys; RFC 9810 obsoletes RFC 4210 and RFC 9480 while maintaining backward compatibility with CMP version 2 where possible; New general message types are added to request CA certificates, root CA updates, certificate request templates, and CRL updates.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Crypto agility; Backward compatibility with CMP version 2; EnvelopedData instead of EncryptedValue
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; PKI Administrator
- **Implementation Prerequisites**: Support for CMP version 3; Implementation of EnvelopedData structures; Support for KEM keys in Proof-of-Possession and message protection
- **Relevant PQC Today Features**: pki-workshop, crypto-agility, hybrid-crypto, algorithms
- **Implementation Attack Surface**: nonce reuse; entropy of random numbers; recurring usage of KEM keys for message protection; attack against DH key exchange
- **Cryptographic Discovery & Inventory**: certificate inventory; algorithm enumeration; deprecated cipher detection (EncryptedValue); crypto-agility scanning
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: entropy of random numbers; key pairs; shared secret information
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: backward compatibility with CMP version 2; breaking changes (CMP version 3); phased rollout (EnvelopedData migration); rollback procedures (implicit confirmation method)
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9810.html (583,480 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:35:16

---

## RFC 9814

- **Reference ID**: RFC 9814
- **Title**: Use of SLH-DSA in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-07-19
- **Last Updated**: 2025-07-19
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies conventions for using the SLH-DSA signature algorithm with the Cryptographic Message Syntax (CMS) signed-data content type.
- **PQC Algorithms Covered**: SLH-DSA, LMS, XMSS
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computers (CRQCs)
- **Migration Timeline Info**: Years mentioned: 2025
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Russ Housley, Scott Fluhrer, Panos Kampanakis, Bas Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS), X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: FIPS 205, FIPS 180, FIPS 202, BCP 78, BCP 14
- **Classical Algorithms Referenced**: RSA, DSA, ECDSA, EdDSA, SHA2, SHAKE
- **Key Takeaways**: SLH-DSA is a stateless hash-based signature algorithm that avoids the fragility of stateful schemes like LMS and XMSS; The document defines twelve specific object identifiers for SLH-DSA based on security levels and hash functions; SLH-DSA supports three security levels providing 128, 192, and 256 bits of security; Implementation requires using pure mode with an empty context string for CMS signed-data content type.
- **Security Levels & Parameters**: 128 bits of security, 192 bits of security, 256 bits of security, id-slh-dsa-sha2-128s, id-slh-dsa-sha2-128f, id-slh-dsa-sha2-192s, id-slh-dsa-sha2-192f, id-slh-dsa-sha2-256s, id-slh-dsa-sha2-256f, id-slh-dsa-shake-128s, id-slh-dsa-shake-128f, id-slh-dsa-shake-192s, id-slh-dsa-shake-192f, id-slh-dsa-shake-256s, id-slh-dsa-shake-256f
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Context string maximum length 255 bytes; SLH-DSA-PublicKey sizes 32, 48, or 64 bytes; SLH-DSA-PrivateKey sizes 64, 96, or 128 bytes; Supports signing up to 2^64 messages
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: ASN.1 Basic Encoding Rules (BER) and Distinguished Encoding Rules (DER); Use of pure mode with empty context string; AlgorithmIdentifier parameters field must be absent
- **Relevant PQC Today Features**: Algorithms, stateful-signatures, pki-workshop, email-signing, digital-id
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: performance may be significantly improved by signing and verifying DER(SignedAttributes) when the content is large; SLH-DSA is much less fragile than stateful hash-based signature algorithms without the need for state kept by the signer
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9814.html (85,334 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:36:21

---

## RFC 9858

- **Reference ID**: RFC 9858
- **Title**: Additional Parameter Sets for HSS/LMS Hash-Based Signatures
- **Authors**: IETF CFRG
- **Publication Date**: 2025-04-01
- **Last Updated**: 2025-04-01
- **Document Status**: Standards Track
- **Main Topic**: This document defines additional parameter sets using SHA-256/192, SHAKE256/256, and SHAKE256/192 hash functions for HSS/LMS to reduce signature sizes.
- **PQC Algorithms Covered**: LMS, HSS, LM-OTS
- **Quantum Threats Addressed**: Grover's Algorithm, Quantum Computer
- **Migration Timeline Info**: Years mentioned: 2025
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Scott Fluhrer; Quynh Dang
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Research Task Force (IRTF); Crypto Forum Research Group
- **Compliance Frameworks Referenced**: FIPS 180; FIPS 202; NIST SP 800-208
- **Classical Algorithms Referenced**: SHA-256; SHAKE256
- **Key Takeaways**: New parameter sets reduce signature sizes by 35-40% compared to original RFC 8554 sets; 192-bit hash outputs reduce security margin but remain sufficient for most uses; Selection between SHA-2 and SHAKE depends on existing implementation availability or platform performance; The document is informational and not suitable for immediate deployment as an Internet Standard.
- **Security Levels & Parameters**: 192-bit output; 256-bit output; SHA-256/192; SHAKE256/256; SHAKE256/192
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Signature size reduction of 35-40%; C randomizer shrinks from 32 bytes to 24 bytes for 192-bit sets; Signatures tend to be 1-4 kilobytes
- **Target Audience**: Researcher; Security Architect; Developer
- **Implementation Prerequisites**: Standard SHA-256 hash implementation without modification; Existing SHAKE implementation
- **Relevant PQC Today Features**: stateful-signatures; algorithms; merkle-tree-certs; entropy-randomness
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Test Cases; Test Vector
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: C randomizer; I identifier
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Backward compatibility with RFC 8554; Signature size reduction of 35-40%; Parameter set selection based on existing SHA-256 or SHAKE implementations
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9858.html (117,242 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:37:23

---

## RFC 9882

- **Reference ID**: RFC 9882
- **Title**: Use of ML-DSA in CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2025-10-29
- **Last Updated**: 2025-10-29
- **Document Status**: Proposed Standard
- **Main Topic**: This document specifies the conventions and algorithm identifiers for using the ML-DSA signature algorithm within the Cryptographic Message Syntax (CMS).
- **PQC Algorithms Covered**: ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: Years mentioned: 2020, 2021, 2024, 2025
- **Applicable Regions / Bodies**: United States; UK National Cyber Security Centre; Internet Engineering Task Force (IETF); US National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: B. Salter, A. Raine, D. Van Geest
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Cryptographic Message Syntax (CMS), X.509
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, RFC 5652, RFC 9881, RFC 9814, RFC 8032, RFC 8419, RFC 5911, X.680, RFC 5280, RFC 2119, RFC 8174, FIPS 180, RFC 5754, RFC 8702
- **Classical Algorithms Referenced**: SHA-256, SHA-384, SHA-512, SHA3-256, SHA3-384, SHA3-512, SHAKE128, SHAKE256
- **Key Takeaways**: ML-DSA usage in CMS is specified for three security levels: ML-DSA-44, ML-DSA-65, and ML-DSA-87; Only the pure mode of ML-DSA is specified for CMS, excluding the pre-hash variant HashML-DSA; SHA-512 MUST be supported for interoperability with legacy implementations while SHAKE256 SHOULD be supported as it is used internally by ML-DSA; The context string input for ML-DSA must be set to an empty string when used in this specification; Signature security strength is constrained by the lower of the digest algorithm strength or the ML-DSA parameter set strength.
- **Security Levels & Parameters**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-DSA offers smaller signatures and significantly faster runtimes than SLH-DSA; SHAKE256 produces 512 bits of output when used as a message digest algorithm in the CMS
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: Support for SHA-512 digest algorithm; Support for SHAKE256 digest algorithm; Adherence to pure mode signature generation; Omission of parameters field in AlgorithmIdentifier
- **Relevant PQC Today Features**: Algorithms, email-signing, pki-workshop, stateful-signatures, entropy-randomness
- **Implementation Attack Surface**: side-channel attacks, fault attacks, inadequate pseudo-random number generators, faulty random number generators
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: high-quality random numbers, fresh random data, precomputed random data, pseudo-random number generators
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: legacy CMS implementations, interoperable option for migration, backward compatibility not specified, pure mode versus pre-hash mode conventions
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9882.html (120,979 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:38:32

---

## draft-ietf-tls-hybrid-design-16

- **Reference ID**: draft-ietf-tls-hybrid-design-16
- **Title**: Hybrid key exchange in TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2020-08-01
- **Last Updated**: 2025-09-07
- **Document Status**: Internet-Draft (Expired 2026-03-11)
- **Main Topic**: Framework for implementing hybrid key exchange combining traditional and post-quantum algorithms in TLS 1.3 using a concatenation-based approach.
- **PQC Algorithms Covered**: ML-KEM, Kyber
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (HNDL), Quantum Computer, Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025, 2026; Keywords: deprecat
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Douglas Stebila; Scott Fluhrer; Shay Gueron; Joseph A. Salowey; Paul Wouters; Tim Chown; Rifaat Shekh-Yusef; Paul Kyzivat
- **PQC Products Mentioned**: Open Quantum Safe (OQS) implementations, Google CECPQ2 project, OQS-OpenSSL variants, OQS Provider for OpenSSL 3
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Email
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: secp256r1, x25519, finite-field Diffie-Hellman, RSA, ECP256R1
- **Key Takeaways**: Hybrid key exchange combines multiple algorithms to maintain security if one component is broken; The design uses a concatenation-based approach negotiated within existing TLS 1.3 mechanisms; Traditional algorithms may be retained due to regulatory constraints like FIPS compliance; Post-quantum algorithms are considered next-generation and less studied than traditional methods; Variable-length secret keys are forbidden in this construction
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid key exchange, concatenation-based approach, composite schemes
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher, Policy Maker
- **Implementation Prerequisites**: TLS 1.3 support; fixed-length KEM public keys and ciphertexts; protection against key reuse for KEMs
- **Relevant PQC Today Features**: hybrid-crypto, tls-basics, crypto-agility, Algorithms, Compliance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: transition to post-quantum cryptography; retaining traditional algorithms due to regulatory constraints such as NIST FIPS compliance; mitigating risks from cryptanalytic breakthroughs independent of quantum computers; using hybrid schemes to provide security if one component algorithm is defeated
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-tls-hybrid-design-16.html (106,575 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:39:29

---

## draft-ietf-tls-ecdhe-mlkem-04

- **Reference ID**: draft-ietf-tls-ecdhe-mlkem-04
- **Title**: Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-03-01
- **Last Updated**: 2026-02-08
- **Document Status**: Internet-Draft (Standards Track)
- **Main Topic**: Specification of three hybrid key agreement mechanisms combining ML-KEM with ECDHE for TLS 1.3.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: cryptanalytic attacks from quantum computers
- **Migration Timeline Info**: Years mentioned: 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Kris Kwiatkowski; Panos Kampanakis; Bas Westerbaan; Douglas Stebila; Joseph A. Salowey (Document shepherd); Paul Wouters (Responsible AD)
- **PQC Products Mentioned**: PQShield, AWS, Cloudflare, University of Waterloo implementations
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Email
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: X25519; secp256r1; secp384r1; ECDH; ECDHE
- **Key Takeaways**: Three hybrid groups (X25519MLKEM768, SecP256r1MLKEM768, SecP384r1MLKEM1024) are defined for TLS 1.3; Hybrid approach provides security against classical and quantum adversaries while maintaining compatibility; FIPS-approved implementations are possible using secp256r1 or secp384r1 groups; Client and server shares involve concatenation of ML-KEM encapsulation keys/ciphertexts with ECDH ephemeral shares; Strict validation checks including encapsulation key checks and ciphertext length matching are mandatory.
- **Security Levels & Parameters**: ML-KEM-768; ML-KEM-1024; X25519MLKEM768; SecP256r1MLKEM768; SecP384r1MLKEM1024
- **Hybrid & Transition Approaches**: hybrid key exchange; simultaneous use of multiple key exchange algorithms; combining traditional and next-generation algorithms
- **Performance & Size Considerations**: X25519MLKEM768 client share 1216 bytes; SecP256r1MLKEM768 client share 1249 bytes; SecP384r1MLKEM1024 client share 1665 bytes; X25519MLKEM768 server share 1120 bytes; SecP256r1MLKEM768 server share 1153 bytes; SecP384r1MLKEM1024 server share 1665 bytes; X25519MLKEM768 shared secret 64 bytes; SecP256r1MLKEM768 shared secret 64 bytes; SecP384r1MLKEM1024 shared secret 80 bytes
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: TLS 1.3 support; implementation of ML-KEM per NIST-FIPS-203; implementation of ECDH per RFC8446 and NIST-SP-800-56A; encapsulation key check per Section 7.2 of NIST-FIPS-203
- **Relevant PQC Today Features**: tls-basics; hybrid-crypto; algorithms; compliance-strategy; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: maintaining compatibility with existing infrastructure and protocols; hybrid key exchange providing security against classical and quantum adversaries; FIPS-approved implementation options for specific groups; obsoleted supported groups requiring updates; phased rollout via TLS 1.3 group negotiation
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-tls-ecdhe-mlkem-04.html (72,988 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:40:29

---

## draft-ietf-tls-mlkem-07

- **Reference ID**: draft-ietf-tls-mlkem-07
- **Title**: ML-KEM Post-Quantum Key Agreement for TLS 1.3
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-05-01
- **Last Updated**: 2026-02-12
- **Document Status**: Internet-Draft (Revised I-D Needed)
- **Main Topic**: Defines ML-KEM-512, ML-KEM-768, and ML-KEM-1024 as NamedGroups for pure post-quantum key agreement in TLS 1.3 without hybrid construction.
- **PQC Algorithms Covered**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Document expires 16 August 2026
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Deirdre Connolly
- **PQC Products Mentioned**: SandboxAQ (author affiliation)
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: IETF; NIST
- **Compliance Frameworks Referenced**: FIPS 203; BCP 78; BCP 79; BCP 14
- **Classical Algorithms Referenced**: ECDH
- **Key Takeaways**: Defines standalone ML-KEM key establishment for TLS 1.3 without hybrid construction; ML-KEM satisfies IND-CCA security in the random oracle model; Implementations must perform encapsulation key checks and abort on failure; Key reuse is allowed but bounded by FIPS 203 guidelines; Randomness in ciphertext generation must not be reused
- **Security Levels & Parameters**: ML-KEM-512; ML-KEM-768; ML-KEM-1024
- **Hybrid & Transition Approaches**: Standalone key establishment; Hybrid mechanisms supported generically via other documents
- **Performance & Size Considerations**: ML-KEM-512 encapsulation keys 800 bytes; ML-KEM-512 ciphertext 768 bytes; ML-KEM-768 encapsulation keys 1184 bytes; ML-KEM-768 ciphertext 1088 bytes; ML-KEM-1024 encapsulation keys 1568 bytes; ML-KEM-1024 ciphertext 1568 bytes; Shared secrets 32 bytes for all parameter sets
- **Target Audience**: Developer; Security Architect; Researcher
- **Implementation Prerequisites**: Conformance to FIPS 203; TLS 1.3 support; IANA registration in TLS Supported Groups registry
- **Relevant PQC Today Features**: Algorithms; tls-basics; hybrid-crypto; crypto-agility
- **Implementation Attack Surface**: nonce reuse in ML-KEM ciphertext generation; key reuse bounds per FIPS203
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: encapsulation key check per Section 7.2 of FIPS203; ciphertext length validation; illegal_parameter alert on failure; internal_error alert on decapsulation failure
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: probabilistic key generation algorithm; probabilistic encapsulation algorithm
- **Constrained Device & IoT Suitability**: targeting smaller key sizes or less computation
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: standalone post-quantum key establishment without hybrid construction; regulatory frameworks requiring standalone post-quantum; replacement of EC DHE shared secret in TLS 1.3 key schedule
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-tls-mlkem-07.html (61,886 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:41:35

---

## draft-ietf-ipsecme-ikev2-mlkem

- **Reference ID**: draft-ietf-ipsecme-ikev2-mlkem
- **Title**: Post-quantum Hybrid Key Exchange with ML-KEM in IKEv2
- **Authors**: IETF IPSECME WG
- **Publication Date**: 2023-11-01
- **Last Updated**: 2025-09-29
- **Document Status**: Internet-Draft
- **Main Topic**: Specification of ML-KEM integration into IKEv2 for quantum-resistant key establishment in VPN and IPsec tunnels.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC); harvest-now-decrypt-later attack
- **Migration Timeline Info**: Years mentioned: 2024, 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Panos Kampanakis; Scott Fluhrer; Deb Cooley
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IKEv2, IPsec, UDP
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: NIST, IETF
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, RFC 2119, RFC 8174
- **Classical Algorithms Referenced**: (EC)DH, AES-128, AES-192, AES-256
- **Key Takeaways**: ML-KEM can be used alone or combined with traditional key exchanges in IKEv2; Hybrid PQ/T key exchanges prevent fragmentation issues caused by large ML-KEM parameters; ML-KEM-768 and ML-KEM-1024 may exceed network MTU requiring multiple packets; Implementations must perform input validation checks per FIPS 203 before encapsulation or decapsulation; Three new algorithm identifiers (35, 36, 37) are registered for IKEv2.
- **Security Levels & Parameters**: NIST Level 1, NIST Level 3, NIST Level 5, ML-KEM-512, ML-KEM-768, ML-KEM-1024, 32-byte shared secret
- **Hybrid & Transition Approaches**: Post-Quantum Traditional (PQ/T) Hybrid key exchange; combining traditional (EC)DH with ML-KEM
- **Performance & Size Considerations**: ML-KEM-512 payload length 808/776 bytes; ML-KEM-768 payload length 1192/1096 bytes; ML-KEM-1024 payload length 1576/1576 bytes; ML-KEM-512 data size 800/768 octets; ML-KEM-768 data size 1184/1088 octets; ML-KEM-1024 data size 1568/1568 octets
- **Target Audience**: Security Architect, Developer, Network Engineer
- **Implementation Prerequisites**: Support for FIPS 203 input validation; Path MTU discovery or reliable transport for large parameters; support for RFC 9370 Multiple Key Exchanges
- **Relevant PQC Today Features**: Algorithms, hybrid-crypto, vpn-ssh-pqc, crypto-agility, pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Post-Quantum Traditional Hybrid key exchange combining quantum-resistant and traditional algorithms; use of IKE_INTERMEDIATE or IKE_FOLLOWUP_KE messages for large ML-KEM payloads exceeding MTU; fragmentation support via RFC7383 to avoid IP fragmentation; rekeying of IKE or Child SA by stirring new shared secret into SKEYSEED and KEYMAT; negotiation of ML-KEM-512 or ML-KEM-768 in IKE_SA_INIT for quantum-resistant-only exchange
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-ipsecme-ikev2-mlkem-03.html (72,091 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:42:41

---

## draft-yang-tls-hybrid-sm2-mlkem-03

- **Reference ID**: draft-yang-tls-hybrid-sm2-mlkem-03
- **Title**: Hybrid Post-quantum Key Exchange SM2-MLKEM for TLSv1.3
- **Authors**: IETF Individual Submission
- **Publication Date**: 2024-08-01
- **Last Updated**: 2025-11-15
- **Document Status**: Internet-Draft
- **Main Topic**: Specification of a hybrid key exchange scheme combining CurveSM2 and ML-KEM768 for TLS 1.3.
- **PQC Algorithms Covered**: ML-KEM, ML-KEM768
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2021, 2024, 2025, 2026
- **Applicable Regions / Bodies**: Regions: United States, International, Bodies: NIST
- **Leaders Contributions Mentioned**: Paul Yang; Cong Peng; Jin Hu; Shine Sun
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3, TLSv1.3
- **Infrastructure Layers**: Email
- **Standardization Bodies**: IETF, ISO, NIST
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, BCP 14, RFC 2119, RFC 8174, RFC 8446, RFC 8998, ISO/IEC 14888-3:2018, GBT.32918.5-2016
- **Classical Algorithms Referenced**: ECDH, curveSM2
- **Key Takeaways**: The document defines a new NamedGroup curveSM2MLKEM768 for hybrid key exchange in TLS 1.3; Implementations must concatenate the ECDHE and ML-KEM shared secrets to form the final shared secret; The client share size is 1249 bytes while the server share size is 1153 bytes; This scheme uses curveSM2 elliptic curve parameters defined in GBT.32918.5-2016; SM2 key exchange protocols are explicitly excluded from this hybrid scheme.
- **Security Levels & Parameters**: ML-KEM768, 256-bit prime field for curveSM2, 64-byte shared secret size
- **Hybrid & Transition Approaches**: Hybrid key exchange, concatenation approach for shared secrets
- **Performance & Size Considerations**: Client share 1249 bytes; Server share 1153 bytes; Shared secret 64 bytes; curveSM2 public key 65 bytes; ML-KEM encapsulation key 1184 bytes; ML-KEM ciphertext 1088 bytes
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: TLS 1.3 support; Support for curveSM2 parameters per GBT.32918.5-2016; Support for ML-KEM768 per FIPS 203
- **Relevant PQC Today Features**: tls-basics, hybrid-crypto, algorithms
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: TLSv1.3 only; MUST NOT apply to older versions of TLS; hybrid key exchange scheme using concatenation approach for shared secret; 1249 bytes client share size; 1153 bytes server share size
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-yang-tls-hybrid-sm2-mlkem-02.html (54,241 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:43:50

---

## RFC 9881

- **Reference ID**: RFC 9881
- **Title**: Algorithm Identifiers for ML-DSA in X.509 PKI
- **Authors**: IETF LAMPS
- **Publication Date**: 2022-06-03
- **Last Updated**: 2025-10-29
- **Document Status**: Proposed Standard
- **Main Topic**: Defines X.509 OIDs and certificate structures for using ML-DSA signatures in PKIX certificates and CRLs.
- **PQC Algorithms Covered**: ML-DSA, ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: Post-Quantum (CRQC — Cryptographically Relevant Quantum Computer)
- **Migration Timeline Info**: Years mentioned: 2021, 2025; Keywords: disallow
- **Applicable Regions / Bodies**: United States; NIST
- **Leaders Contributions Mentioned**: Jake Massimo, Panos Kampanakis, Sean Turner, Bas Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, PKIX
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, RFC 5280, RFC 5912, RFC 5958, RFC 7468, RFC 2119, RFC 8174, RFC 7841
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-DSA signatures in X.509 certificates and CRLs must use specific NIST-registered OIDs with absent parameters; The pure variant of ML-DSA is specified while the pre-hash variant is excluded; Key usage extensions for ML-DSA keys must include digitalSignature, nonRepudiation, keyCertSign, or cRLSign bits; ML-DSA public keys are encoded as raw byte strings within SubjectPublicKeyInfo fields; Conforming CA and client implementations must explicitly recognize the defined OIDs for ML-DSA-44, ML-DSA-65, and ML-DSA-87.
- **Security Levels & Parameters**: NIST security categories 2, 3, and 5; ML-DSA-44; ML-DSA-65; ML-DSA-87
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-DSA-44 public key size 1312 bytes; ML-DSA-65 public key size 1952 bytes; ML-DSA-87 public key size 2592 bytes
- **Target Audience**: Security Architect, Developer, Compliance Officer
- **Implementation Prerequisites**: Support for ASN.1 encoding per RFC 5912 and RFC 5280; Recognition of NIST-registered OIDs id-ml-dsa-44, id-ml-dsa-65, id-ml-dsa-87; Adherence to FIPS 204 pure variant specifications
- **Relevant PQC Today Features**: Algorithms, pki-workshop, compliance, migration-program, digital-id
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: certificate inventory, key material audit
- **Testing & Validation Methods**: Private Key Consistency Testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: ML-DSA and Dilithium are not compatible
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: RFC_9881.html (295,700 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:45:00

---

## draft-ietf-lamps-pq-composite-kem-12

- **Reference ID**: draft-ietf-lamps-pq-composite-kem-12
- **Title**: Composite ML-KEM for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-01-08
- **Document Status**: Internet-Draft (In WG Last Call)
- **Main Topic**: This document defines composite (hybrid) Key Encapsulation Mechanisms combining ML-KEM with classical algorithms for use in X.509 and CMS applications.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Quantum attacks on traditional cryptographic key establishment algorithms; catastrophic bugs in ML-KEM implementations
- **Migration Timeline Info**: Document expires 28 September 2026; aggressive migration timelines may require deploying PQC before full hardening or certification
- **Applicable Regions / Bodies**: Regions: United States, France, International, Bodies: NIST, ANSSI
- **Leaders Contributions Mentioned**: Mike Ounsworth, John Gray, Massimiliano Pala, Jan Klaußner, Scott Fluhrer, Russ Housley (Document shepherd), Deb Cooley (Action Holder/Responsible AD)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, CMS, PKIX
- **Infrastructure Layers**: Public Key Infrastructure (PKI), Key Encapsulation Mechanism (KEM)
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, Revised BSD License
- **Classical Algorithms Referenced**: RSA-OAEP, ECDH, X25519, X448, Diffie-Hellman
- **Key Takeaways**: Composite schemes provide extra protection against breaks or catastrophic bugs in ML-KEM by requiring simultaneous compromise of all components; Hybrid deployments allow organizations to deploy PQC before modules are fully audited or certified without invalidating existing compliance; The composite KEM presents a single public key and ciphertext enabling protocol backwards compatibility for non-hybrid-aware systems; Organizations should select a small number of composite algorithms tailored to their environment rather than implementing the full list
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Composite ML-KEM scheme, PQ/T Hybrids, KEM Combiner Function, protocol backwards compatibility, hybrid with traditional algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: FIPS Certification considerations; support for X.509 and PKIX data structures; ability to extract RSAPublicKey from RSAPrivateKey or derive ECPoint from ECPrivateKey
- **Relevant PQC Today Features**: hybrid-crypto, pki-workshop, migration-program, crypto-agility, algorithms
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Test Vectors, FIPS Certification
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Protocol Backwards Compatibility, Backwards Compatibility, migration timelines, stepping stone for transition, phased rollout via recommended composite algorithms
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-lamps-pq-composite-kem-12.html (371,766 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:46:00

---

## draft-ietf-lamps-pq-composite-sigs-15

- **Reference ID**: draft-ietf-lamps-pq-composite-sigs-15
- **Title**: Composite ML-DSA for Use in X.509 PKI and CMS
- **Authors**: IETF LAMPS
- **Publication Date**: 2023-03-02
- **Last Updated**: 2026-02-24
- **Document Status**: Internet-Draft (In IETF Last Call)
- **Main Topic**: This document defines composite ML-DSA signatures combining traditional algorithms with ML-DSA for use in X.509 PKI and CMS to provide hybrid protection against quantum attacks.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Quantum computing threats to traditional cryptographic signature algorithms; breaks or catastrophic bugs in ML-DSA
- **Migration Timeline Info**: Years mentioned: 2025, 2026; Keywords: deprecat
- **Applicable Regions / Bodies**: Certain regions with regulatory guidelines; governments and cybersecurity agencies including BSI and ANSSI
- **Leaders Contributions Mentioned**: Mike Ounsworth, John Gray, Massimiliano Pala, Jan Klaußner, Scott Fluhrer (Authors); Russ Housley (Document shepherd); Deb Cooley (Action Holder/Responsible AD); Donald Eastlake (SECDIR review); Tim Evens (GENART review)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, PKIX, CMS
- **Infrastructure Layers**: Public Key Infrastructure (PKI), X.509 data structures
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 204, BCP 78, BCP 79, Revised BSD License
- **Classical Algorithms Referenced**: RSASSA-PKCS1-v1.5, RSASSA-PSS, ECDSA, Ed25519, Ed448, RSA, DSA
- **Key Takeaways**: Composite signatures combine ML-DSA with traditional algorithms to ensure security even if one component is broken; Hybrid schemes allow deployment of PQC before full certification or audit is complete; The composite approach provides protocol backwards compatibility by presenting a single atomic algorithm; Organizations should select specific composite combinations based on operational constraints rather than implementing all options; Certain jurisdictions recommend exclusive use of ML-DSA within a PQ/T hybrid framework
- **Security Levels & Parameters**: EUF-CMA level security; SUF-CMA; Non-separability; FIPS 204 parameter sets implied but not explicitly listed as specific sizes in text
- **Hybrid & Transition Approaches**: Composite signatures (PQ/T Hybrids); Protocol backwards compatibility; Stepping stone for transition from deployed cryptographic algorithms
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: Support for X.509 or PKIX data structures accepting ML-DSA; FIPS certification considerations; Interoperability with legacy algorithms
- **Relevant PQC Today Features**: hybrid-crypto, pki-workshop, compliance-strategy, migration-program, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Test Vectors; Appendix E
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Backwards Compatibility; protocol backwards compatibility; stepping stone for transition; FIPS certification considerations; phased rollout via hybrid deployment before full audit
- **Extraction Note**: v3 update: 8 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-lamps-pq-composite-sigs-14.html (757,867 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-14T23:46:56

---
