---
generated: 2026-03-13
collection: library
documents_processed: 13
enrichment_method: ollama-qwen3.5:27b
---

## ETSI-GR-QSC-001

- **Reference ID**: ETSI-GR-QSC-001
- **Title**: Quantum-Safe Algorithmic Framework
- **Authors**: ETSI ISG QSC
- **Publication Date**: 2016-07-01
- **Last Updated**: 2016-07-01
- **Document Status**: Published
- **Main Topic**: ETSI GR QSC 001 provides a framework for assessing quantum-safe cryptographic primitives including lattice-based, multivariate, and code-based schemes for key establishment and authentication.
- **PQC Algorithms Covered**: Peikert; Zhang et al; Ghosh-Kate; NTRUEncrypt; HIMMO; Fiat-Shamir signatures; Lyubashevsky; Güneysu-Lyubashevsky-Pöppelmann; BLISS; Hash-and-sign signatures; NTRU-MLS; Aguilar et al; Ducas-Lyubashevsky-Prest; Simple Matrix; HFE; ZHFE; Polly Cracker Revisited; Sakumoto-Shirai-Hiwatari; Quartz; Gui; UOV; Rainbow; McEliece; Niederreiter
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI
- **Leaders Contributions Mentioned**: Peikert; Zhang et al; Ghosh-Kate; Lyubashevsky; Güneysu-Lyubashevsky-Pöppelmann; Aguilar et al; Ducas-Lyubashevsky-Prest; Sakumoto-Shirai-Hiwatari
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document establishes an assessment framework covering security, efficiency, and implementation issues for PQC primitives; Lattice-based, multivariate, and code-based families are identified as primary candidates for key establishment and authentication; Specific schemes such as NTRUEncrypt, Rainbow, and McEliece are listed under their respective primitive families; Security considerations include classical security, quantum security, provable security, forward security, and active security.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess; Algorithms; pqc-101

---

## ETSI-GR-QSC-003

- **Reference ID**: ETSI-GR-QSC-003
- **Title**: Quantum-Safe Cryptography; Case Studies and Deployment Scenarios
- **Authors**: ETSI ISG QSC
- **Publication Date**: 2017-03-01
- **Last Updated**: 2017-03-01
- **Document Status**: Published
- **Main Topic**: Examination of real-world deployment scenarios and migration challenges for quantum-safe cryptography across network security, IoT, satellite communications, and authentication use cases.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI; Regions: France (via address)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, S/MIME, Kerberos, ZigBee, DTLS
- **Infrastructure Layers**: Key Distribution Centres, PKI (implied via certificates), Offline services
- **Standardization Bodies**: ETSI, IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Developers must consider changes to accommodate quantum-safe cryptography in public-key primitives; IoT and satellite use cases have distinct constraints compared to traditional internet services; Hybrid schemes are a viable option for upgrading TLS; Large key sizes present handling challenges in protocol stacks; Authentication requirements vary significantly between online and offline scenarios.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid scheme, Drop-in replacement, Re-engineering
- **Performance & Size Considerations**: Handling large key sizes mentioned as a challenge; No concrete byte values provided.
- **Target Audience**: Developer, Security Architect, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: tls-basics, email-signing, iot-ot-pqc, hybrid-crypto, crypto-agility

---

## ETSI-GR-QSC-004

- **Reference ID**: ETSI-GR-QSC-004
- **Title**: Quantum-Safe Cryptography; Quantum-Safe Threat Assessment
- **Authors**: ETSI ISG QSC
- **Publication Date**: 2017-03-01
- **Last Updated**: 2017-03-01
- **Document Status**: Published
- **Main Topic**: A simplified threat assessment of quantum computing impacts on asymmetric and symmetric cryptography across banking, transport, IoT, and digital media sectors.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; Grover's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI Industry Specification Group Quantum-Safe Cryptography (QSC)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Transport Layer Security (TLS); Internet Protocol Security (IPSec); Internet Key Exchange (IKE); Secure/Multipurpose Internet Mail Exchange (S/MIME)
- **Infrastructure Layers**: Public Key Infrastructure (PKI); Trusted Platform Modules
- **Standardization Bodies**: ETSI; ISO/HL7; Digital Living Network Alliance; Advanced Access Content System Licensing Authority
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: Elliptic Curves; number factorization; Symmetric algorithms; RSA; ECC; ECDSA; DH; AES; DSA
- **Key Takeaways**: Asymmetric cryptography using Elliptic Curves or number factorization will be invalidated by viable quantum computers; Symmetric cryptographic schemes will face reduced security levels; Risk impact varies across different business sectors and users of quantum vulnerable cryptography; Organizations must determine response times to retain trust and security in operations.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Policy Maker; Researcher; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Assess, Algorithms, tls-basics, pki-workshop, iot-ot-pqc

---

## ETSI-GR-QSC-006

- **Reference ID**: ETSI-GR-QSC-006
- **Title**: Quantum-Safe Cryptography; Limits of Quantum Computing Applicability on Symmetric Key Cryptography
- **Authors**: ETSI ISG QSC
- **Publication Date**: 2017-02-01
- **Last Updated**: 2017-02-01
- **Document Status**: Published
- **Main Topic**: Analysis of the long-term security of symmetric cryptographic primitives against quantum computing attacks up to 2050.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computer attacks on symmetric primitives; Grover's algorithm implications
- **Migration Timeline Info**: Conclusion that 256-bit symmetric ciphers and hash functions will remain secure until way after 2050; industry advised to transition from key lengths of 128 bits or less
- **Applicable Regions / Bodies**: Bodies: ETSI Industry Specification Group (QSC)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: GSM; TETRA
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; (EC) Diffie-Hellman; (EC)DSA; AES; SHA-2; SHA-3; AES-256; AES-128
- **Key Takeaways**: 256-bit symmetric ciphers and hash functions will withstand quantum attacks until way after 2050; industry must identify products relying on key lengths of 128 bits or less for transition; asymmetric primitives require immediate transition preparation while symmetric alternatives are not urgently needed for 256-bit keys; Moore's Law trends cannot be assumed to continue indefinitely for quantum computing power
- **Security Levels & Parameters**: 256-bit symmetric ciphers; 256-bit hash output lengths; 128-bit key length
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Policy Maker; Researcher
- **Implementation Prerequisites**: Identification of products relying on smaller key and hash output lengths; investigation of steps for transition to primitives with larger key lengths
- **Relevant PQC Today Features**: Threats; Algorithms; Assess; Migration-program; pqc-risk-management

---

## ETSI-TR-103-570

- **Reference ID**: ETSI-TR-103-570
- **Title**: Quantum-Safe Key Exchanges
- **Authors**: ETSI TC CYBER WG QSC
- **Publication Date**: 2017-10-01
- **Last Updated**: 2017-10-01
- **Document Status**: Published
- **Main Topic**: This technical report compares quantum-safe key exchange proposals including LWE, Ring-LWE, and SIDH-based schemes to evaluate performance and security tradeoffs for standardization.
- **PQC Algorithms Covered**: LWE, Ring-LWE, SIDH, Niederreiter
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The report evaluates LWE, Ring-LWE, and SIDH as candidate primitives for quantum-safe key exchanges; Implementation considerations include active security, invalid key attacks, and side-channel protection; Performance impacts are analyzed across 64-bit processors, 32-bit embedded processors, and microcontrollers; Parameter selection and security estimates are provided for each proposed scheme.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Performance on a 64-bit processor; Performance on a 32-bit embedded processor; Performance on 32-bit microcontrollers; Performance on a 64-bit desktop processor; Performance on a 64-bit embedded processor
- **Target Audience**: Researcher, Security Architect, Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, iot-ot-pqc, pqc-risk-management

---

## ETSI-TR-103-949

- **Reference ID**: ETSI-TR-103-949
- **Title**: Quantum-Safe Cryptography Migration; Quantum-Safe ITS/C-ITS Considerations
- **Authors**: ETSI TC CYBER WG QSC
- **Publication Date**: 2023-05-01
- **Last Updated**: 2023-05-01
- **Document Status**: Published
- **Main Topic**: Review of cryptographic security mechanisms in Intelligent Transport Systems (ITS) and Cooperative ITS regarding quantum computing vulnerability and migration recommendations.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Attack by a quantum computer; susceptibility to attack by a quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI, IEEE, ITU-T, ISO, CEN
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: IEEE 1609.2; X.509; CAM; DENM
- **Infrastructure Layers**: Trust and Privacy Management; Public-key certificate frameworks; Security Services and Architecture
- **Standardization Bodies**: ETSI, IEEE, ITU-T, ISO, CEN
- **Compliance Frameworks Referenced**: FIPS 186-4; FIPS 197; ANSI X9.62
- **Classical Algorithms Referenced**: ECDSA; AES; Digital Signature Standard (DSS)
- **Key Takeaways**: Organizations should review the state of deployment of cryptographic security mechanisms in ITS and C-ITS; Assess susceptibility of V2X communications to quantum computer attacks; Adopt Quantum Safe Cryptography to minimize exposure; Follow a three-stage migration process including inventory compilation, preparation, and execution; Manage trust and isolation approaches during the migration phase
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Migration plan preparation; Trust management during migration; Isolation approaches during migration
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Researcher, Compliance Officer
- **Implementation Prerequisites**: Inventory compilation of cryptographic assets; Preparation of a migration plan; Algorithm selection and protocol definition; Execution of migration with trust management
- **Relevant PQC Today Features**: Assess, Migrate, Threats, Algorithms, iot-ot-pqc, pki-workshop

---

## ETSI-TR-103-965

- **Reference ID**: ETSI-TR-103-965
- **Title**: Impact of Quantum Computing on Cryptographic Security Proofs
- **Authors**: ETSI TC CYBER WG QSC
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Published
- **Main Topic**: Examines how quantum computing affects the validity of existing cryptographic security proofs and analyzes whether classical reduction-based proofs remain meaningful in a post-quantum setting.
- **PQC Algorithms Covered**: Crystals-Kyber
- **Quantum Threats Addressed**: Quantum adversaries; quantum attackers
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: France; ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Sigma Protocols
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Replacing computational-hardness assumptions with quantum-hard assumptions is insufficient to make a cryptosystem quantum-safe; security proofs for certain cryptographic classes must be adapted for the post-quantum setting; practical implications of adapting security proofs include changes to transformations like Fujisaki-Okamoto and Fiat-Shamir; classical reduction-based proofs may not remain meaningful against quantum adversaries.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Cryptographic experts; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, Threats, Assess, pqc-101

---

## ETSI-TR-103-966

- **Reference ID**: ETSI-TR-103-966
- **Title**: Deployment Considerations for Hybrid Schemes
- **Authors**: ETSI TC CYBER WG QSC
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Published
- **Main Topic**: The document provides practical guidance on deploying hybrid classical-plus-PQC schemes, addressing implementation considerations, key combiner design, protocol integration, and performance tradeoffs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: France
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, DH
- **Key Takeaways**: Hybrid schemes combine traditional and post-quantum algorithms for key establishment and digital signatures; Design considerations include security, efficiency, bandwidth, computation, latency, energy, complexity, protocol, and implementation; Deployment requires careful algorithm selection, component choice, and key management strategies; Migration and forward compatibility are critical factors in hybrid scheme adoption; Key combiner designs vary from simple concatenation to full KDF integration.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid security; Hybrid interoperability; Concatenation only; Concatenation with simple KDF; Concatenation with full KDF; Strong non-separability; Component key reuse; Component key compromise; Migration and forwards compatibility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto, crypto-agility, migration-program, pki-workshop, algorithms

---

## ETSI-TR-103-967

- **Reference ID**: ETSI-TR-103-967
- **Title**: Impact of Quantum Computing on Symmetric Cryptography
- **Authors**: ETSI TC CYBER WG QSC
- **Publication Date**: 2025-01-01
- **Last Updated**: 2025-01-01
- **Document Status**: Published
- **Main Topic**: Updated analysis of the impact of quantum computing on symmetric cryptography including block ciphers, stream ciphers, hash functions, and MACs.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Grover's algorithm; Quantum collision finding; BHT algorithm; CNS algorithm; Simon's algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: AES; SHA-2; SHA-3
- **Key Takeaways**: Grover's algorithm impacts symmetric algorithms by reducing effective security strength; Logical and physical costs for AES key recovery are analyzed using surface code assumptions; Quantum collision finding algorithms like BHT and CNS pose threats to hash functions; Simon's algorithm is discussed as another quantum threat vector; The document provides an overview of quantum error correction requirements for these attacks.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Researcher, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Algorithms, Assess

---

## ETSI-TR-104-016

- **Reference ID**: ETSI-TR-104-016
- **Title**: A Repeatable Framework for Quantum-Safe Migrations
- **Authors**: ETSI TC CYBER WG QSC
- **Publication Date**: 2024-10-01
- **Last Updated**: 2024-10-01
- **Document Status**: Published
- **Main Topic**: A structured, repeatable framework for organizations to plan and execute quantum-safe cryptographic migrations through discovery, assessment, planning, execution, and validation phases.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum computer capable of breaking RSA-2048 within 24 hours
- **Migration Timeline Info**: Migration can take a decade or longer to complete; likelihood of quantum threat emergence is high within the next ten years
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Information security systems and infrastructures; enterprise architecture
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA-2048
- **Key Takeaways**: Enterprises should begin quantum-safe migration planning immediately due to high likelihood of threat emergence within ten years; Migration requires a whole-of-enterprise commitment and can take a decade or longer; Organizations must follow an 11-step framework covering identification, inventory, dependency analysis, and risk assessment; Cross-department analysis is critical for resolving migration conflicts and dependencies
- **Security Levels & Parameters**: RSA-2048
- **Hybrid & Transition Approaches**: Backwards compatible migration; Parallel system installed over three migration intervals
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Compliance Officer, Researcher
- **Implementation Prerequisites**: Whole-of-enterprise commitment; allocation of budgets and internal resources; identification of enterprise architecture; generation of asset inventories
- **Relevant PQC Today Features**: migration-program, pqc-risk-management, Assess, Migrate, Threats

---

## ETSI-EG-203-310

- **Reference ID**: ETSI-EG-203-310
- **Title**: Quantum Computing Impact on Security of ICT Systems; Recommendations on Business Continuity and Algorithm Selection
- **Authors**: ETSI TC CYBER
- **Publication Date**: 2016-06-01
- **Last Updated**: 2016-06-01
- **Document Status**: Published
- **Main Topic**: Recommendations on business continuity planning and algorithm selection to address the impact of quantum computing on ICT security.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm; Grover's Algorithm; invalidation of RSA and ECC asymmetric cryptography; halving of symmetric cryptographic strength
- **Migration Timeline Info**: Speculation that viable quantum computers may be built within the next 10 to 20 years
- **Applicable Regions / Bodies**: European Union; ETSI Technical Committee Cyber Security (CYBER)
- **Leaders Contributions Mentioned**: Johannes Buchmann; Jintai Ding; Seth Lloyd; Michele Mosca
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Diffie-Helman-Merkle key agreement protocol; TLS Register of cipher suites
- **Infrastructure Layers**: PKI; Certificate Authority (CA); Key Management
- **Standardization Bodies**: ETSI; ISO; IANA
- **Compliance Frameworks Referenced**: ISO 22301; Regulation (EU) N 910/2014; ISO 27000 series
- **Classical Algorithms Referenced**: RSA; ECC; AES; Diffie-Helman-Merkle
- **Key Takeaways**: Symmetric key strength is halved by quantum computing requiring larger keys for equivalent security; RSA and Elliptic Curve Cryptography offer no security against viable quantum computers; Business continuity planning must address the redistribution of asymmetric public keys and certificates; Organizations should prepare for a future where current cryptographic assumptions are invalidated within 10 to 20 years
- **Security Levels & Parameters**: AES with 128 bit keys reduced to 64 bit strength; 256 bit keys required to retain 128 bit security
- **Hybrid & Transition Approaches**: Re-assertion of CAs in a PKI; redistribution of new algorithms and keys
- **Performance & Size Considerations**: AES with 128 bit keys giving 128 bit strength reduced to 64 bit strength; implementation of 256 bit keys required to retain 128 bit security
- **Target Audience**: Security Architect; Compliance Officer; Policy Maker; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats, Algorithms, Leaders, Migrate, Assess

---

## ETSI-GR-QKD-007

- **Reference ID**: ETSI-GR-QKD-007
- **Title**: Quantum Key Distribution Vocabulary
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2018-12-01
- **Last Updated**: 2018-12-01
- **Document Status**: Published
- **Main Topic**: Establishes vocabulary and terminology for Quantum Key Distribution (QKD) standards to ensure consistency across ETSI QKD specifications.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: France; ETSI Industry Specification Group (ISG) Group Quantum Key Distribution (QKD)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: ETSI; 3GPP Organizational Partners; oneM2M Partners; GSM Association
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: QKD introduces new concepts and technologies to telecommunications requiring specific vocabulary; Many terms derive from quantum physics and classical cryptography but assume modified meanings in QKD contexts; The document defines over 100 terms to ensure consistency across ETSI QKD specifications.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Standardization Body Member, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: qkd

---

## ETSI-GS-QKD-016-V2

- **Reference ID**: ETSI-GS-QKD-016-V2
- **Title**: Common Criteria Protection Profile for QKD Modules V2.1.1
- **Authors**: ETSI ISG QKD
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Updated Common Criteria Protection Profile for Prepare-and-Measure Quantum Key Distribution modules aligned with CC:2022 Revision 1.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Eavesdropping on QKD link data; Manipulation of QKD link data
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: ETSI, BSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: Common Criteria; CC:2022 Revision 1
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Defines security objectives for Prepare-and-Measure QKD modules including user identification and access control; Specifies threats such as session hijacking, eavesdropping, and manipulation of QKD link data; Establishes requirements for secure End of Life states and audit capabilities for cryptographic TSF; Mandates operation in a secure area and diligent maintenance as assumptions for the operational environment
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Researcher
- **Implementation Prerequisites**: Operation in a secure area; Diligent maintenance; Trustworthy users
- **Relevant PQC Today Features**: qkd, compliance, threats, assess

---
