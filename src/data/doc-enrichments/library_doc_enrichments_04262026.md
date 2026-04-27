---
enrichment_method: manual-fact-correction
model: not-applicable
date: 2026-04-26
notes: Compliance framework field corrections — adding factually verifiable cross-references missing from earlier enrichment runs.
---

## NIST-FIPS140-3-IG-PQC

- **Reference ID**: NIST-FIPS140-3-IG-PQC
- **Title**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **Authors**: NIST CMVP
- **Publication Date**: 2025-09-02
- **Last Updated**: 2025-09-02
- **Document Status**: Published Update
- **Main Topic**: Updated FIPS 140-3 Implementation Guidance adding self-test requirements for FIPS 203/204/205 PQC algorithms and new guidance for Key Encapsulation Mechanisms.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA, FN-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Canada; National Institute of Standards and Technology; Canadian Centre for Cyber Security
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.2
- **Infrastructure Layers**: Cryptographic Module Validation Program; Cryptographic Algorithm Validation Program; Key Encapsulation Mechanisms
- **Standardization Bodies**: National Institute of Standards and Technology; Canadian Centre for Cyber Security; ISO/IEC
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS 140-2; FIPS 203; FIPS 204; FIPS 205; FIPS 186-5; SP 800-140; SP 800-38D; SP 800-38E; SP 800-38G; SP 800-186; SP 800-107; SP 800-208; NIST SP 800-90B; SP 800-90A; SP 800-108; SP 800-132; SP 800-56CREV2; SP 800-133; SP 800-67REV2; SP 800-63B; ISO/IEC 24759:2017(E)
- **Classical Algorithms Referenced**: RSA; Triple-DES; HMAC; AES; XTS-AES; Elliptic Curves; FFC Safe-Prime Groups
- **Key Takeaways**: Guidance includes new self-test requirements for FIPS 203/204/205 algorithms; New guidance provided for Key Encapsulation Mechanisms; Document clarifies testing requirements for cryptographic modules under FIPS 140-3; Updates cover transition from FIPS 186-4 to FIPS 186-5; FIPS 140-3 supersedes FIPS 140-2 — modules validated under FIPS 140-2 may continue operating under transition provisions
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Transition from FIPS 186-4 to FIPS 186-5; Transition from FIPS 140-2 to FIPS 140-3; Transition of the TLS 1.2 KDF to support the Extended Master Secret
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Developer; Researcher
- **Implementation Prerequisites**: FIPS 140-3 conformance; NVLAP accredited Cryptographic and Security Testing Laboratories; Approved Security Functions per SP 800-140 series
- **Relevant PQC Today Features**: Compliance, Algorithms, Migrate, Assess, entropy-randomness

---

## RFC-9901-SD-JWT-VC

- **Reference ID**: RFC-9901-SD-JWT-VC
- **Title**: RFC 9901 — SD-JWT-based Verifiable Credentials (SD-JWT VC)
- **Authors**: IETF OAuth Working Group
- **Publication Date**: 2025-06-01
- **Last Updated**: 2025-06-01
- **Document Status**: Published RFC
- **Main Topic**: RFC 9901 defines a mechanism for selective disclosure of JSON Web Token claims using salted hashes and optional key binding to enhance privacy in credential presentation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Daniel Fett, Kristina Yasuda, Brian Campbell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: JSON Web Signature (JWS), JSON Web Token (JWT), OpenID Connect
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: RFC 9901; BCP 78
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: SD-JWT enables selective disclosure of claims by replacing cleartext data with salted digests in the signed payload; Key Binding allows holders to prove possession of a private key via a separate Key Binding JWT; The format supports both compact and JSON serialization for transporting issuer-signed data and disclosures; Privacy is enhanced through unlinkability and decoy digests to prevent guessing of non-disclosed values.
- **Target Audience**: Developer; Security Architect; Policy Maker
- **Relevant PQC Today Features**: digital-id, Compliance

---

## NERC-CIP-REQS

- **Reference ID**: NERC-CIP-REQS
- **Title**: NERC Reliability Standards — Complete Set (including CIP)
- **Authors**: NERC
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Active
- **Main Topic**: NERC Reliability Standard CIP-002-8 defines requirements for identifying and categorizing Bulk Electric System Cyber Systems based on their impact on reliable operation.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: NERC, Regional Entity, Canadian Nuclear Safety Commission, Nuclear Regulatory Commission
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NERC
- **Compliance Frameworks Referenced**: NERC CIP; NERC CIP-002; NERC CIP-003; NERC CIP-004; NERC CIP-005; NERC CIP-006; NERC CIP-007; NERC CIP-008; NERC CIP-009; NERC CIP-010; NERC CIP-011; NERC CIP-012; NERC CIP-013; NERC CIP-014; IEC 62351; IEC 62351-6; IEC 61850
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Responsible Entities must identify and categorize BES Cyber Systems as high, medium, or low impact; Categorization must be reviewed and approved by a CIP Senior Manager at least once every 15 calendar months; Evidence of compliance must be retained for three calendar years; Specific exemptions apply to systems regulated by the Canadian Nuclear Safety Commission and the Nuclear Regulatory Commission; Violation Severity Levels are determined by the percentage or count of assets not considered or incorrectly categorized.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, Operations
- **Implementation Prerequisites**: Process to consider Control Centers, Transmission stations, Generation resources, and Restoration systems; CIP Senior Manager or delegate approval; Dated electronic or physical lists of identified assets
- **Relevant PQC Today Features**: Compliance, Assess, data-asset-sensitivity, compliance-strategy, pqc-governance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Identification of BES Cyber Systems and BES Cyber Assets; Inventory of Control Centers, Transmission stations, Generation resources, and Blackstart Resources
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Governance prerequisites including CIP Senior Manager approval; Change management scope requiring review every 15 calendar months; Evidence retention for three calendar years
- **Source Document**: NERC-CIP-REQS.pdf (4,236,908 bytes, 14,960 extracted chars)
- **Extraction Timestamp**: 2026-04-26T01:12:35

---

---

## RFC-9162

- **Reference ID**: RFC-9162
- **Title**: Certificate Transparency Version 2.0
- **Authors**: IETF
- **Publication Date**: 2021-12-01
- **Last Updated**: 2021-12-01
- **Document Status**: Published
- **Main Topic**: Certificate Transparency Version 2.0
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Years mentioned: 2021
- **Applicable Regions / Bodies**: Regions: International
- **Leaders Contributions Mentioned**: B. Laurie; E. Messeri; R. Stradling
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, X.509, CMS, OCSP
- **Infrastructure Layers**: PKI; Certificate Transparency Logs
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: BCP 78; RFC 2119; RFC 8174; RFC 5280; RFC 6962; RFC 8391; RFC 8446; CA/Browser Forum Baseline Requirements; RFC 9162; RFC 6960
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Certificate Transparency logs provide append-only records of TLS certificates to detect misissuance; Clients can require signed timestamps to verify certificate inclusion in logs; The protocol introduces algorithm agility for hash and signature algorithms via IANA registries; Precertificates are now formatted as CMS objects to avoid serial number uniqueness violations; Logs must be treated as trusted third parties due to potential inconsistent views presented to different clients.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Algorithm agility for hash and signature algorithms; Support for simultaneous v1 and v2 operation
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer; Researcher
- **Implementation Prerequisites**: IANA registry lookups for hash and signature algorithms; Support for TransItem structure; Implementation of Merkle Tree hashing with domain separation
- **Relevant PQC Today Features**: tls-basics, pki-workshop, crypto-agility, merkle-tree-certs
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: certificate inventory, algorithm enumeration, deprecated cipher detection
- **Testing & Validation Methods**: conformance testing, interoperability testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: third-party library trust, open-source vs proprietary
- **Deployment & Migration Complexity**: migration phase (assess/plan/test/migrate/launch), breaking changes, backward compatibility, phased rollout
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: governance prerequisites, change management scope
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: IETF_RFC_9162.html (293,966 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-15T14:32:22

---

---

## IETF-RFC-7030-EST

- **Reference ID**: IETF-RFC-7030-EST
- **Title**: Enrollment over Secure Transport (EST)
- **Authors**: IETF
- **Publication Date**: 2013-10-01
- **Last Updated**: 2013-10-01
- **Document Status**: Published
- **Main Topic**: This document profiles the Enrollment over Secure Transport (EST) protocol for certificate management using CMC messages over TLS and HTTP.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: M. Pritikin, Ed.; P. Yee, Ed.; D. Harkins, Ed.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.1; TLS 1.2; HTTP; HTTPS; CMC; CMP; TCP
- **Infrastructure Layers**: PKI; Certificate Management; Registration Authority (RA) functions
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: RFC 7030; RFC 2986; RFC 5280; RFC 5272
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: EST profiles certificate enrollment using CMC messages over a secure transport; The protocol supports both client-generated and CA-generated key pairs; EST operates over HTTPS using HTTP headers and media types in conjunction with TLS; The service performs functions traditionally allocated to the Registration Authority role; Trust anchor distribution can be effected via the EST server but requires out-of-band verification for authenticity.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Operations
- **Implementation Prerequisites**: TLS 1.1 or 1.2 support; HTTP over TCP; CMC message handling capability; Trust anchor configuration (Explicit or Implicit)
- **Relevant PQC Today Features**: pki-workshop, tls-basics, migration-program, crypto-agility, digital-id
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
- **Source Document**: IETF-RFC-7030-EST.html (166,146 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-22T08:50:36

---

---

## NIST-SP-800-57-Pt1-R6

- **Reference ID**: NIST-SP-800-57-Pt1-R6
- **Title**: Recommendation for Key Management: Part 1 – General (Revision 6)
- **Authors**: NIST
- **Publication Date**: 2025-12-05
- **Last Updated**: 2025-12-05
- **Document Status**: Initial Public Draft
- **Main Topic**: Initial Public Draft of NIST SP 800-57 Part 1 Revision 6 providing general cryptographic key management guidelines including quantum-resistant algorithms and Ascon.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Post-Quantum
- **Migration Timeline Info**: Years mentioned: 2025, 2026
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology; U.S. Department of Commerce; Office of Management and Budget
- **Leaders Contributions Mentioned**: Elaine Barker (Author); William Barker (Author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Key agreement, key transport, key establishment, key derivation, encryption, digital signature, authentication
- **Infrastructure Layers**: Key Management
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: FISMA; OMB Circular A-130; FIPS 203; FIPS 204; FIPS 205; SP 800-232; SP 800-131A; NIST SP 800-57
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Ascon and quantum-resistant algorithms from FIPS 203, 204, and 205 are included in the guidelines; Key establishment and key storage discussions are now separated; Security categories from the PQC competition are incorporated; Time-based algorithm approval status is replaced with references to SP 800-131A; A new section discusses keying material storage and mechanisms.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, Researcher
- **Implementation Prerequisites**: FIPS 140 compliance for cryptographic modules; clear guidance and oversight for key management; controls to ensure guidance is followed
- **Relevant PQC Today Features**: Algorithms, Compliance, Migrate, Assess, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Transitioning to new algorithms and key sizes in systems; replacing time-based algorithm approval status with references to SP 800-131A; separating discussion of keys for key establishment and key storage; planning and transition purposes for federal agencies following NIST publication development
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST-SP-800-57-Pt1-R6.pdf (2,637,856 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-15T11:11:54

---

---

## NIST-SP-800-90B

- **Reference ID**: NIST-SP-800-90B
- **Title**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **Authors**: NIST
- **Publication Date**: 2018-01-29
- **Last Updated**: 2018-01-29
- **Document Status**: Published
- **Main Topic**: NIST Special Publication 800-90B specifies design principles, requirements, and validation tests for entropy sources used in Random Bit Generators.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Quantum threats to entropy source quality
- **Migration Timeline Info**: Years mentioned: 2025
- **Applicable Regions / Bodies**: Regions: United States; Bodies: NIST, NSA
- **Leaders Contributions Mentioned**: Meltem Sönmez Turan (NIST); Elaine Barker (NIST); John Kelsey (NIST); Kerry McKay (NIST); Mary Baish (NSA); Michael Boyle (NSA)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS
- **Infrastructure Layers**: Email
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: SP 800-90A; SP 800-90C; NIST SP 800-90C
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Entropy sources must be validated using specified health tests including repetition count and adaptive proportion; Min-entropy estimation methods are required for entropy source validation; Entropy sources are intended to be combined with Deterministic Random Bit Generator mechanisms from SP 800-90A; Two errata have been identified for future correction in this publication.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Developer, Compliance Officer, Researcher
- **Implementation Prerequisites**: SP 800-90A Rev. 1; SP 800-90C
- **Relevant PQC Today Features**: entropy-randomness
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: health tests (repetition count, adaptive proportion), min-entropy estimation methods, IID testing requirements
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: NIST SP 800-90B, entropy sources, min-entropy, noise source, random bit generation
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST-SP-800-90B.html (45,265 bytes, 4,475 extracted chars)
- **Extraction Timestamp**: 2026-04-15T08:54:37

---

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
- **Compliance Frameworks Referenced**: FIPS 203, BCP 78, BCP 79, RFC 2119, RFC 8174; RFC 7383
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
- **Deployment & Migration Complexity**: Post-Quantum Traditional Hybrid key exchange combining quantum-resistant and traditional algorithms; use of IKE_INTERMEDIATE or IKE_FOLLOWUP_KE messages for large packet sizes exceeding MTU; fragmentation support via RFC7383 to avoid IP fragmentation; rekeying of IKE or Child SA by stirring new shared secret into SKEYSEED and KEYMAT; negotiation of ML-KEM-512 and ML-KEM-768 in IKE_SA_INIT as quantum-resistant-only options
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: draft-ietf-ipsecme-ikev2-mlkem-03.html (72,091 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-15T07:20:00

---

---

## FISMA-NIST-SP-800-53r5

- **Reference ID**: FISMA-NIST-SP-800-53r5
- **Title**: Security and Privacy Controls for Information Systems and Organizations
- **Authors**: NIST
- **Publication Date**: 2020-09-01
- **Last Updated**: 2020-09-01
- **Document Status**: Published
- **Main Topic**: This publication provides a catalog of security and privacy controls for information systems and organizations to manage risk and protect assets from diverse threats.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Years mentioned: 2020; Keywords: required by
- **Applicable Regions / Bodies**: United States; U.S. Department of Commerce; National Institute of Standards and Technology; Office of Management and Budget; Department of Defense; Office of the Director of National Intelligence; Committee on National Security Systems
- **Leaders Contributions Mentioned**: Wilbur L. Ross, Jr.; Walter Copan; Dana Deasy; Matthew A. Kozma; John Sherman; Michael E. Waschull; Mark Hakun; Clifford M. Conner; Kevin Dulany; Charles H. Romine; Mark G. Hakun; Susan Dorr; Kevin Stine; Matthew Scholl; Chris Johnson; Ron Ross; Vicki Michetti; Victoria Pillitteri; McKay Tolboe; Dorian Pappas; Kelley Dempsey; Ehijele Olumese; Lydia Humphries; Daniel Faigin; Naomi Lefkovitz; Esten Porter; Julie Nethery Snyder; Christina Sames; Christian Enloe; David Black; Rich Graubart; Peter Duspiva; Kaitlin Boeckl; Eduardo Takamura; Ned Goren; Andrew Regenscheid; Jon Boyens
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: IoT, Cloud, Email
- **Standardization Bodies**: National Institute of Standards and Technology; Committee on National Security Systems
- **Compliance Frameworks Referenced**: FISMA; OMB Circular A-130; NIST Risk Management Framework; NIST SP 800-30; NIST SP 800-161
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must exercise due diligence in managing information security and privacy risk; Controls are flexible and customizable to meet mission and business needs; The catalog addresses both functionality and assurance perspectives for trustworthiness; Implementation supports compliance with laws, regulations, executive orders, and governmentwide policies; Risk management frameworks are essential for developing and maintaining protection measures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker, CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: compliance-strategy, pqc-risk-management, pqc-governance
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
- **Extraction Note**: v3 update: 10 dimensions extracted; base fields from prior enrichment
- **Source Document**: NIST_SP_800-53.pdf (6,073,678 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-15T14:04:38

---

---

## ETSI-TS-119-312

- **Reference ID**: ETSI-TS-119-312
- **Title**: ETSI TS 119 312: Cryptographic Suites for Electronic Signatures and Seals
- **Authors**: ETSI ESI
- **Publication Date**: 2021-07-01
- **Last Updated**: 2023-04-01
- **Document Status**: Published
- **Main Topic**: ETSI TS 119 312 specifies cryptographic suites for use in electronic signatures, time-stamping, and PKI within the EU trust-service framework under eIDAS. It defines approved algorithm suites and references RFC 3161 for Time-Stamp Protocols used by Trust Service Providers.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Europe; European Union; ETSI
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS; Electronic Signatures; Time-Stamping
- **Infrastructure Layers**: PKI; Trust Service Providers; Certificate Management
- **Standardization Bodies**: ETSI
- **Compliance Frameworks Referenced**: ETSI TS 119 312; RFC 3161; eIDAS
- **Classical Algorithms Referenced**: RSA; ECDSA; SHA-256; AES
- **Key Takeaways**: Defines approved cryptographic suites for EU trust-service providers; References RFC 3161 for time-stamp token profiles; Basis for eIDAS-compliant algorithm selection; Mandates algorithm suites for QES and AdES signatures.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Developer
- **Implementation Prerequisites**: eIDAS compliance; ETSI audit scheme
- **Relevant PQC Today Features**: Compliance, code-signing, standards-bodies, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Conformance testing via ETSI audit scheme
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: ETSI-TS-119-312.pdf (manual-fact-correction)
- **Extraction Timestamp**: 2026-04-26T02:15:00

---

## IEC 62443

- **Reference ID**: IEC 62443
- **Title**: IEC 62443: Industrial Automation and Control Systems Security
- **Authors**: IEC
- **Publication Date**: 2010-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Active International Standard
- **Main Topic**: IEC 62443 is a multi-part standard series for OT/ICS/SCADA cybersecurity covering security levels, zones, conduits, and lifecycle requirements. Part 4-2 defines technical security requirements for IACS components including embedded devices, host devices, network devices, and software applications.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: International; IEC
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: OT/ICS/SCADA; Industrial Control Systems; Embedded Devices
- **Standardization Bodies**: IEC
- **Compliance Frameworks Referenced**: IEC 62443; IEC 62443-4-2; IEC 62443-2-1; IEC 62443-3-3; IEC 62443-3-2
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: IEC 62443-4-2 specifies technical security requirements at the IACS component level; Four component types covered: embedded devices, host devices, network devices, and software applications; Four Security Levels (SL 1–4) define required capability against increasing attacker sophistication; Security Capability Levels provide verifiable requirements for component certification.
- **Security Levels & Parameters**: SL 1; SL 2; SL 3; SL 4
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; Operations; OT Engineer
- **Implementation Prerequisites**: IEC 62443-2-1 security management system; IEC 62443-3-3 system-level requirements
- **Relevant PQC Today Features**: Compliance, Assess, iot-ot-pqc, energy-utilities-pqc
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Component-level security capability assessment
- **Testing & Validation Methods**: IEC 62443-4-2 conformance testing; Security Level verification
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: IEC 62443-4-2 embedded device requirements
- **Supply Chain & Vendor Risk**: Component security certification via IEC 62443-4-2
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: IEC 62443 (manual-fact-correction)
- **Extraction Timestamp**: 2026-04-26T02:15:00

---

## IETF-RFC-8555

- **Reference ID**: IETF-RFC-8555
- **Title**: Automatic Certificate Management Environment (ACME)
- **Authors**: IETF
- **Publication Date**: 2019-03-01
- **Last Updated**: 2019-03-01
- **Document Status**: Published
- **Main Topic**: This document defines the Automatic Certificate Management Environment (ACME) protocol to automate domain validation and certificate issuance in the Web PKI.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Richard Barnes; Jacob Hoffman-Andrews; Daniel McCarney; James Kasten
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: HTTPS; TLS; PKIX; HTTP; DNS
- **Infrastructure Layers**: PKI; Certificate Authority; Domain Validation
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: RFC 8555; RFC 5280; RFC 8657; RFC 7638; RFC 6844; BCP 219
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ACME automates certificate issuance and domain validation to eliminate manual user interaction; The protocol supports extensions for identifiers beyond domain names such as IP addresses and telephone numbers; Existing ad hoc verification methods cause significant frustration and delay in HTTPS deployment; ACME enables mechanization of certificate management tasks including revocation and key rollover.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Operations
- **Implementation Prerequisites**: HTTPS support; DNS record management capability; Web server configuration for HTTP challenge; PKCS#10 Certificate Signing Request generation
- **Relevant PQC Today Features**: pki-workshop, tls-basics, crypto-agility
- **Source Document**: IETF_RFC_8555.html (manual-fact-correction)
- **Extraction Timestamp**: 2026-04-26T00:00:00

---

## IETF-RFC-4210-CMP

- **Reference ID**: IETF-RFC-4210-CMP
- **Title**: Certificate Management Protocol (CMP)
- **Authors**: IETF
- **Publication Date**: 2005-09-01
- **Last Updated**: 2023-12-01
- **Document Status**: Published
- **Main Topic**: This document specifies the Internet X.509 Public Key Infrastructure Certificate Management Protocol (CMP) for certificate creation and management.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: C. Adams; S. Farrell; T. Kause; T. Mononen
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: CMP; X.509v3; Diffie-Hellman
- **Infrastructure Layers**: PKI; Certification Authority; Registration Authority
- **Standardization Bodies**: IETF; Internet Society
- **Compliance Frameworks Referenced**: RFC 4210; RFC 9480; RFC 5652; RFC 6712; X.509
- **Classical Algorithms Referenced**: Diffie-Hellman
- **Key Takeaways**: CMP obsoletes RFC 2510 with updated message profiles and confirmation mechanisms; The protocol supports on-line interactions between PKI components including CAs and client systems; A new implicit confirmation method is introduced to reduce the number of protocol messages exchanged; Proof-of-Possession (POP) structures are defined for signature, encryption, and key agreement keys.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Researcher
- **Implementation Prerequisites**: Support for X.509v3 certificates; ASN.1 definitions; Version negotiation for RFC 2510 compatibility
- **Relevant PQC Today Features**: pki-workshop, tls-basics, crypto-agility, pqc-risk-management
- **Source Document**: IETF-RFC-4210-CMP.html (manual-fact-correction)
- **Extraction Timestamp**: 2026-04-26T00:00:00

---

## NIST-SP-800-140B

- **Reference ID**: NIST-SP-800-140B
- **Title**: CMVP Security Policy Requirements: CMVP Validation Authority Updates to ISO/IEC 19790 Annex B
- **Authors**: NIST CMVP
- **Publication Date**: 2020-03-01
- **Last Updated**: 2020-03-01
- **Document Status**: Published
- **Main Topic**: Specifies security policy content and ordering requirements for cryptographic modules validated under FIPS 140-3 via the CMVP.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA; SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; National Institute of Standards and Technology
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Cryptographic Module Validation Program; FIPS 140-3
- **Standardization Bodies**: NIST; CMVP; NVLAP
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS 203; FIPS 204; FIPS 205; NIST SP 800-140B; SP 800-140C; SP 800-140D; SP 800-140
- **Classical Algorithms Referenced**: AES; RSA; HMAC
- **Key Takeaways**: Security policies must document all security-relevant details for a cryptographic module in a standardized format; CMVP validation requires documented vendor evidence and test evidence per SP 800-140B requirements; Module boundary and algorithm coverage must be explicitly stated in the security policy.
- **Security Levels & Parameters**: FIPS 140-3 Security Levels 1-4
- **Hybrid & Transition Approaches**: Transition from FIPS 140-2 to FIPS 140-3
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; Vendor; Developer
- **Implementation Prerequisites**: FIPS 140-3 conformance; NVLAP accredited lab; CMVP validation process
- **Relevant PQC Today Features**: Compliance, Assess, Algorithms
- **Source Document**: NIST-SP-800-140B (manual-fact-correction)
- **Extraction Timestamp**: 2026-04-26T00:00:00

## draft-ietf-lamps-kyber-certificates

- **Reference ID**: draft-ietf-lamps-kyber-certificates
- **Title**: Internet X.509 PKI — Algorithm Identifiers for ML-KEM
- **Authors**: IETF LAMPS WG
- **Publication Date**: 2023-07-01
- **Last Updated**: 2025-08-01
- **Document Status**: Internet-Draft (Standards Track)
- **Main Topic**: Specification of algorithm identifiers, key formats, and conventions for using ML-KEM in X.509 Public Key Infrastructure certificates.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509, TLS
- **Infrastructure Layers**: PKI
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: ML-KEM certificates require specific OIDs assigned by NIST for algorithm identification; The parameters field in the AlgorithmIdentifier for ML-KEM public keys must be absent; Key usage bits must be set to keyEncipherment for ML-KEM certificates; Private keys can be stored as a 64-byte seed, an expanded key, or both to support interoperability; ML-KEM public key sizes are 800, 1184, and 1568 octets for security levels 512, 768, and 1024 respectively
- **Security Levels & Parameters**: ML-KEM-512, ML-KEM-768, ML-KEM-1024
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: ML-KEM-512 public key 800 octets; ML-KEM-768 public key 1184 octets; ML-KEM-1024 public key 1568 octets; ML-KEM-512 expanded private key 1632 octets; ML-KEM-768 expanded private key 2400 octets; ML-KEM-1024 expanded private key 3168 octets; Private key seed 64 octets
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Support for ASN.1 encoding; Cryptographically secure pseudorandom number generator (CSPRNG)
- **Relevant PQC Today Features**: Algorithms, pki-workshop, tls-basics
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Private Key Consistency Testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: draft-ietf-lamps-kyber-certificates.html (204,984 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:24:46

---

## draft-ietf-sshm-mlkem-hybrid-kex

- **Reference ID**: draft-ietf-sshm-mlkem-hybrid-kex
- **Title**: PQ/T Hybrid Key Exchange with ML-KEM in SSH
- **Authors**: IETF SSHM WG
- **Publication Date**: 2024-10-01
- **Last Updated**: 2025-09-01
- **Document Status**: Internet-Draft (Standards Track)
- **Main Topic**: Defines Post-Quantum Traditional (PQ/T) Hybrid key exchange methods combining ML-KEM and ECDH/X25519 for the SSH Transport Layer Protocol.
- **PQC Algorithms Covered**: ML-KEM
- **Quantum Threats Addressed**: Harvest-now-decrypt-later attack
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Panos Kampanakis, Douglas Stebila, Torben Hansen (Authors); Stephen Farrell (Document shepherd); Deb Cooley (Responsible AD); Thomas Fossati, Thomas Graf (Reviewers)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH, SSH Transport Layer Protocol
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, IESG, IANA
- **Compliance Frameworks Referenced**: FIPS 203
- **Classical Algorithms Referenced**: ECDH, X25519, SHA-256, SHA-384, Diffie-Hellman
- **Key Takeaways**: SSH key exchange is extended with PQ/T Hybrid methods to mitigate harvest-now-decrypt-later attacks; Hybrid methods ensure security is at least as strong as the most secure component scheme; Specific method names like mlkem768nistp256-sha256 are defined for SSH_MSG_KEXINIT; Implementations must perform length checks on C_INIT and S_REPLY to prevent length extension attacks; Encapsulation key checks defined in FIPS 203 Section 7.2 are mandatory before producing ciphertext.
- **Security Levels & Parameters**: ML-KEM-512, ML-KEM-768, ML-KEM-1024, nistp256, nistp384, x25519
- **Hybrid & Transition Approaches**: PQ/T Hybrid key exchange, combining ML-KEM with ECDH or X25519
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Support for SSH_MSG_KEX_HYBRID_INIT and SSH_MSG_KEX_HYBRID_REPLY; Implementation of ML-KEM KeyGen, Encaps, and Decaps; Adherence to FIPS 203 encapsulation key checks; Length validation of public keys and ciphertexts.
- **Relevant PQC Today Features**: hybrid-crypto, vpn-ssh-pqc, Algorithms, Migrate
- **Implementation Attack Surface**: Length extension attack attempts
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: draft-ietf-sshm-mlkem-hybrid-kex.html (87,062 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:29:29

---

## draft-vitap-ml-dsa-webauthn

- **Reference ID**: draft-vitap-ml-dsa-webauthn
- **Title**: ML-DSA for Web Authentication
- **Authors**: IETF / Individual (vitap)
- **Publication Date**: 2024-10-01
- **Last Updated**: 2025-06-01
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: Defines the integration of ML-DSA (FIPS 204) into Web Authentication (WebAuthn) by specifying COSE algorithm identifiers and implementation behaviors for passwordless authentication.
- **PQC Algorithms Covered**: ML-DSA, ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Quantum Threats Addressed**: Attacks involving a large-scale quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Aditya Mitra, Sibi S. Chakkaravarthy, Anisha Ghosh, Devi Priya VS
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: WebAuthn, FIDO2, COSE
- **Infrastructure Layers**: Secure storage, Key management
- **Standardization Bodies**: IETF, IANA, W3C
- **Compliance Frameworks Referenced**: FIPS 204, FIPS 186-5, BCP 78, BCP 79, BCP 14
- **Classical Algorithms Referenced**: ES256, RS256, RSA, SHA-256, Elliptic Curve Digital Signature Algorithm
- **Key Takeaways**: ML-DSA is necessary to secure WebAuthn against large-scale quantum computers as current defaults ES256 and RS256 are insecure; ML-DSA-44 and ML-DSA-65 are advised for WebAuthn due to smaller key and signature sizes compared to ML-DSA-87; Authenticators must use secure storage that prevents unauthorized export of cryptographic secrets; COSE representations for ML-DSA public keys are required for WebAuthn integration while private key representation is out of scope
- **Security Levels & Parameters**: ML-DSA-44, ML-DSA-65, ML-DSA-87
- **Hybrid & Transition Approaches**: Backward Compatibility Consideration
- **Performance & Size Considerations**: ML-DSA-44 Private Key 2560 bytes; ML-DSA-44 Public Key 1312 bytes; ML-DSA-44 Signature 2420 bytes; ML-DSA-65 Private Key 4032 bytes; ML-DSA-65 Public Key 1952 bytes; ML-DSA-65 Signature 3309 bytes; ML-DSA-87 Private Key 4896 bytes; ML-DSA-87 Public Key 2592 bytes; ML-DSA-87 Signature 4627 bytes
- **Target Audience**: Developer, Security Architect
- **Implementation Prerequisites**: Secure storage for cryptographic secrets; COSE algorithm support in WebAuthn clients; Handling large signatures and keys
- **Relevant PQC Today Features**: digital-id, algorithms, migration-program, crypto-agility
- **Implementation Attack Surface**: Unauthorized export of secrets; Storage security
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Backward compatibility considerations; Error handling and fallback mechanisms
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: draft-vitap-ml-dsa-webauthn.html (83,578 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:31:06

---

## draft-ietf-tls-key-share-prediction

- **Reference ID**: draft-ietf-tls-key-share-prediction
- **Title**: TLS Key Share Prediction
- **Authors**: IETF TLS WG
- **Publication Date**: 2024-06-01
- **Last Updated**: 2025-10-01
- **Document Status**: Internet-Draft (Standards Track)
- **Main Topic**: Defines a DNS-based mechanism for TLS 1.3 servers to advertise supported key share groups to enable client prediction and reduce handshake round-trips.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: David Benjamin
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.3
- **Infrastructure Layers**: DNS
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: x25519; secp256r1; ECDH
- **Key Takeaways**: Servers can declare supported TLS named groups in DNS using SVCB or HTTPS records to allow clients to predict key shares; Predicting key shares reduces the likelihood of HelloRetryRequest and improves performance during PQC transitions; Clients must continue sending all supported groups in the supported_groups extension to prevent downgrade attacks; Mispredictions may occur due to stale DNS records or configuration changes and must be handled via HelloRetryRequest
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Transition from one post-quantum KEM to another; Predicting both post-quantum KEMs consumes excessive bandwidth
- **Performance & Size Considerations**: Large keys and ciphertexts for post-quantum KEMs; Additional round-trip cost for unused key shares; Network and computational resource consumption
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: Support for SVCB or HTTPS resource records; TLS 1.3 implementation
- **Relevant PQC Today Features**: tls-basics; crypto-agility; migration-program
- **Implementation Attack Surface**: Downgrade attacks via DNS forgery; Attacker influence on named group selection via key_share presence
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Handling stale DNS records; Server configuration updates during transition; Backward compatibility with older servers
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: draft-ietf-tls-key-share-prediction.html (55,155 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:33:31

---

## draft-becker-cnsa2-ssh-profile

- **Reference ID**: draft-becker-cnsa2-ssh-profile
- **Title**: CNSA 2.0 Suite Profile for SSH
- **Authors**: NSA / IETF (Becker et al.)
- **Publication Date**: 2022-10-01
- **Last Updated**: 2025-01-01
- **Document Status**: Internet-Draft
- **Main Topic**: Defines a base SSH profile for US National Security Systems implementing the CNSA 2.0 Suite with quantum-resistant algorithms.
- **PQC Algorithms Covered**: ML-KEM; ML-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; US National Security Systems; U.S. Government
- **Leaders Contributions Mentioned**: Alison Becker; Casey Wynn
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: SSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: CNSA 2.0
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines an SSH profile for US National Security Systems using CNSA 2.0; It specifies required ML-KEM and ML-DSA algorithm selections; It applies to systems processing high-value information; The profile is publicly available for developers and operators
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Operations; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Compliance; Algorithms; vpn-ssh-pqc; migration-program
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
- **Source Document**: draft-becker-cnsa2-ssh-profile.html (42,080 bytes, 3,195 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:35:28

---

## draft-ietf-openpgp-nist-bp-comp

- **Reference ID**: draft-ietf-openpgp-nist-bp-comp
- **Title**: PQ/T Composite Schemes for OpenPGP using NIST and Brainpool Elliptic Curve Domain Parameters
- **Authors**: IETF OpenPGP WG
- **Publication Date**: 2024-06-01
- **Last Updated**: 2025-07-01
- **Document Status**: Internet-Draft
- **Main Topic**: Defines PQ/T composite schemes for OpenPGP combining ML-KEM and ML-DSA with ECDH and ECDSA using NIST and Brainpool elliptic curve domain parameters.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA
- **Quantum Threats Addressed**: Cryptographically relevant quantum computer
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Germany; Bodies: IETF, BSI, MTG AG, NIST
- **Leaders Contributions Mentioned**: Quynh Dang, Stephan Ehlen, Stavros Kousidis, Johannes Roth, Falko Strenzke
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: OpenPGP
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, NIST
- **Compliance Frameworks Referenced**: BCP 78, BCP 79, SP800-186, TR-03111
- **Classical Algorithms Referenced**: ECDH, ECDSA, NIST P-384, NIST P-521, brainpoolP384r1, brainpoolP512r1
- **Key Takeaways**: Extends OpenPGP PQC support to include NIST and Brainpool curves for regulatory compliance; Defines composite KEMs and signatures combining ML-KEM/ML-DSA with ECDH/ECDSA; Provides experimental codepoints for interoperability testing; Includes test vectors for specific composite scheme combinations
- **Security Levels & Parameters**: ML-KEM-768, ML-KEM-1024, ML-DSA-65, ML-DSA-87, NIST P-384, NIST P-521, brainpoolP384r1, brainpoolP512r1
- **Hybrid & Transition Approaches**: PQ/T composite schemes, hybrid KEMs, composite signatures
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer, Security Architect, Compliance Officer
- **Implementation Prerequisites**: OpenPGP protocol implementation, support for NIST and Brainpool domain parameters
- **Relevant PQC Today Features**: hybrid-crypto, email-signing, Algorithms, Compliance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Interoperability testing, Test Vectors
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: draft-ietf-openpgp-nist-bp-comp.html (347,269 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:36:35

---

## draft-spm-lake-pqsuites

- **Reference ID**: draft-spm-lake-pqsuites
- **Title**: Quantum-Resistant Cipher Suites for EDHOC
- **Authors**: IETF LAKE WG (Individual Submission)
- **Publication Date**: 2024-03-01
- **Last Updated**: 2025-03-01
- **Document Status**: Internet-Draft (Individual Submission)
- **Main Topic**: Defines new EDHOC cipher suites incorporating ML-KEM and ML-DSA for quantum-resistant key establishment in constrained IoT environments using the LAKE protocol.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, FN-DSA
- **Quantum Threats Addressed**: Cryptographically Relevant Quantum Computer (CRQC)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Göran Selander, John Preuß Mattsson
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: EDHOC, LAKE, COSE, X-wing
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF, LAKE Working Group, IANA
- **Compliance Frameworks Referenced**: CNSA 2.0, BCP 78, BCP 79
- **Classical Algorithms Referenced**: ECDSA, ECDHE, EdDSA, AES-CCM-16-128-128, SHAKE256, SHA-256, A256GCM, SHA-384, AES-CCM-16-64-128
- **Key Takeaways**: EDHOC can achieve post-quantum security by replacing classical ECC with ML-KEM for key exchange and ML-DSA for signatures; KEMs replace Diffie-Hellman procedures in EDHOC by transporting encapsulation keys and ciphertexts in existing message fields; ML-KEM-512 and ML-DSA-44 introduce significantly higher overhead compared to elliptic curve algorithms; New cipher suites are defined for Method 0 and PSK-based authentication, while Methods 1-3 currently lack standardized post-quantum alternatives; Cipher suite TBD3 is designated for high-security applications like government and finance using CNSA 2.0 algorithms.
- **Security Levels & Parameters**: ML-KEM-512, ML-KEM-768, ML-KEM-1024, ML-DSA-44, ML-DSA-85
- **Hybrid & Transition Approaches**: Hybrid KEMs, X-wing
- **Performance & Size Considerations**: ML-KEM-512 ciphertext 768 bytes; ML-KEM-768 ciphertext 1088 bytes; ML-KEM-1024 ciphertext 1568 bytes; significantly higher overhead compared to ECDHE/ECDSA/EdDSA
- **Target Audience**: Developer, Security Architect, Researcher
- **Implementation Prerequisites**: Familiarity with EDHOC [RFC9528]; COSE registered algorithms; support for SHAKE256 key derivation
- **Relevant PQC Today Features**: Algorithms, iot-ot-pqc, hybrid-crypto, crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: Lightweight Authenticated Key Exchange (LAKE); constrained IoT environments
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: draft-spm-lake-pqsuites.html (54,217 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:38:50

---

## arXiv-2603-28627

- **Reference ID**: arXiv-2603-28627
- **Title**: Shor's Algorithm is Possible with as Few as 10,000 Reconfigurable Atomic Qubits
- **Authors**: arXiv (neutral atom quantum computing researchers)
- **Publication Date**: 2026-03-31
- **Last Updated**: 2026-03-31
- **Document Status**: Preprint
- **Main Topic**: The document demonstrates that Shor's algorithm can be executed with as few as 10,000 reconfigurable atomic qubits, narrowing the timeline for practical quantum attacks on current public-key infrastructure.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's algorithm; practical quantum attacks on current public-key infrastructure
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Madelyn Cain; Qian Xu; Robbie King; Lewis R. B. Picard; Harry Levine; Manuel Endres; John Preskill; Hsin-Yuan Huang; Dolev Bluvstein
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: public-key infrastructure
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC; P-256; RSA-2048
- **Key Takeaways**: Shor's algorithm requires significantly fewer qubits (~10,000) than previously estimated due to advances in error correction and circuit design; Discrete logarithms on P-256 could be solved in a few days with 26,000 physical qubits; Factoring RSA-2048 remains one to two orders of magnitude longer than P-256 attacks; Neutral-atom architectures show theoretical capability for cryptographically relevant quantum computation; Substantial engineering challenges remain before practical deployment
- **Security Levels & Parameters**: 10,000 reconfigurable atomic qubits; 26,000 physical qubits; P-256; RSA-2048
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Runtime for discrete logarithms on P-256 is a few days with 26,000 physical qubits; Runtime for factoring RSA-2048 is one to two orders of magnitude longer
- **Target Audience**: Researcher; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; Timeline
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
- **Source Document**: arXiv-2603-28627.html (47,451 bytes, 5,422 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:41:30

---

## arXiv-2508-01694

- **Reference ID**: arXiv-2508-01694
- **Title**: Performance and Storage Analysis of CRYSTALS-Kyber as a Post-Quantum Replacement for RSA and ECC
- **Authors**: Cornell University
- **Publication Date**: 2025-08-30
- **Last Updated**: 2025-08-30
- **Document Status**: Preprint
- **Main Topic**: Empirical performance and storage analysis of CRYSTALS-Kyber as a post-quantum replacement for RSA and ECC, demonstrating its viability on commodity hardware.
- **PQC Algorithms Covered**: CRYSTALS-Kyber
- **Quantum Threats Addressed**: Shor's algorithm; quantum computer error correction technology advancement
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Nicolas Rodriguez Alvarez; Fernando Rodriguez Merino
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECC; SHA-1; SHA-2; AES
- **Key Takeaways**: Kyber provides robust security guarantees against quantum attacks while maintaining acceptable performance profiles for most contemporary applications; Migration to PQC may follow patterns similar to SHA-1 to SHA-2, leading to prolonged vulnerability periods; Kyber achieves faster operations and smaller key sizes than RSA; Implementation can utilize standard built-in processor acceleration features like AES-NI and ASIMD without specialized hardware
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Security Architect
- **Implementation Prerequisites**: Standard built-in processor acceleration features (AES-NI, ASIMD); commodity hardware
- **Relevant PQC Today Features**: Algorithms; Performance; Threats; Migrate
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Performance testing; empirical performance benchmarks
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Prolonged periods of vulnerability during migration; substantial security and economic consequences
- **Financial & Business Impact**: Substantial security and economic consequences from prolonged vulnerability
- **Organizational Readiness**: None detected
- **Source Document**: arXiv-2508-01694.html (47,054 bytes, 5,230 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:43:16

---

## 5G-Americas-PQCS-2025

- **Reference ID**: 5G-Americas-PQCS-2025
- **Title**: Post Quantum Computing Security
- **Authors**: 5G Americas
- **Publication Date**: 2025-02-01
- **Last Updated**: 2025-02-01
- **Document Status**: Published
- **Main Topic**: Industry white paper examining post-quantum cryptography impacts on 5G and telecommunications network security, covering algorithm readiness, protocol migration, and vendor ecosystem status.
- **PQC Algorithms Covered**: ML-KEM, ML-DSA, SLH-DSA
- **Quantum Threats Addressed**: CRQC, Shor’s Algorithm, Harvest Now, Decrypt Later, Grover’s algorithm
- **Migration Timeline Info**: CRQC estimates point to the 2030 - 2040 timeframe; NIST standardized first three PQC algorithms in August 2024
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKEv2, SSH, OAuth, X.509
- **Infrastructure Layers**: Hardware Security Modules (HSM), Certificate Authority (CA), Secure boot, Provisioning systems
- **Standardization Bodies**: NIST, IETF, 3GPP, GSMA
- **Compliance Frameworks Referenced**: NIST FIPS 203, NIST FIPS 204, NIST FIPS 205
- **Classical Algorithms Referenced**: RSA, ECDH, ECDSA, AES, SNOW, ZUC, Diffie-Hellman, MILENAGE, TUAK
- **Key Takeaways**: Stakeholders should start planning for PQC migration by educating executives and developing a cryptographic inventory; Hybrid migration approaches using both traditional and PQC algorithms are recommended to safeguard against compromise; Crypto agility is a crucial capability for systems to easily switch between cryptographic algorithms; 3GPP is expected to adopt profiles of IETF specifications for PQC into mobile network infrastructure once IETF work is completed
- **Security Levels & Parameters**: 128-bit key, 256-bit algorithms
- **Hybrid & Transition Approaches**: Hybrid migration approach, crypto agility, hybrid mechanisms combining traditional and PQC algorithms concurrently
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, CISO, Policy Maker
- **Implementation Prerequisites**: Developing a cryptographic inventory of assets; conducting a risk analysis and priority assessment; engaging with suppliers and customers on roadmap plans
- **Relevant PQC Today Features**: 5g-security, hybrid-crypto, crypto-agility, migration-program, pqc-risk-management
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Developing a cryptographic inventory of assets
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Engaging with suppliers and customers on roadmap plans and dependencies; Software Bill of Materials (SBOM) provided by a software supplier
- **Deployment & Migration Complexity**: Completely replacing traditional public key cryptography with PQC right away is not considered feasible due to complexity; Hybrid migration approach required
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Educating key executives and stakeholders on the urgency and risks; developing a cryptographic inventory; conducting a risk analysis and priority assessment
- **Source Document**: 5G-Americas-PQCS-2025.pdf (6,790,456 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:44:40

---

## CSA-Practitioners-Guide-PQC-2025

- **Reference ID**: CSA-Practitioners-Guide-PQC-2025
- **Title**: A Practitioner's Guide to Post-Quantum Cryptography
- **Authors**: Cloud Security Alliance (CSA)
- **Publication Date**: 2025-10-11
- **Last Updated**: 2025-10-11
- **Document Status**: Published
- **Main Topic**: A practitioner-focused guide from the Cloud Security Alliance providing a roadmap for assessing, planning, and mitigating quantum computing risks in cloud environments.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers; store now, decrypt later threats
- **Migration Timeline Info**: Cryptographically relevant quantum computers are projected to emerge as early as the 2030s
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Hybrid key exchange protocols
- **Infrastructure Layers**: Encryption in transit; encryption at rest
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: NIST FIPS-203; NIST FIPS-204; NIST FIPS-205; Cloud Controls Matrix
- **Classical Algorithms Referenced**: RSA; Diffie-Hellman; elliptic curve algorithms
- **Key Takeaways**: Identify vulnerable cryptographic components; assess store now, decrypt later threats; map out mitigation strategies for encryption in transit and at rest; maintain backward compatibility and resilience during the transition
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid key exchange protocols; backward compatibility
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISOs; Security Architects; IT Risk and Compliance Managers; Enterprise Architects; Cryptography and Data Protection Specialists; Cloud Security Professionals
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Migrate; Assess; pqc-risk-management; pqc-governance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Identify vulnerable cryptographic components
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Backward compatibility; resilience during the transition
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: CSA-Practitioners-Guide-PQC-2025.html (76,594 bytes, 9,102 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:48:18

---

## NIST-SP-800-22-R1A

- **Reference ID**: NIST-SP-800-22-R1A
- **Title**: SP 800-22 Rev. 1a: A Statistical Test Suite for Random and Pseudorandom Number Generators for Cryptographic Applications
- **Authors**: NIST
- **Publication Date**: 2010-04-01
- **Last Updated**: 2010-04-01
- **Document Status**: Published
- **Main Topic**: A statistical test suite defining 15 tests for evaluating the randomness quality of bit sequences produced by cryptographic random and pseudorandom number generators.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: United States; Bodies: National Institute of Standards and Technology, U.S. Department of Commerce
- **Leaders Contributions Mentioned**: Andrew Rukhin, Juan Soto, James Nechvatal, Miles Smid, Elaine Barker, Stefan Leigh, Mark Levenson, Mark Vangel, David Banks, Alan Heckert, James Dray, San Vo, Lawrence E Bassham III
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: National Institute of Standards and Technology
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: The document defines 15 statistical tests for evaluating randomness quality of cryptographic RNGs; Tests include Frequency, Runs, Chi-Squared, DFT, and Serial tests; The suite is used for validating entropy source output quality prior to NIST ESV submission; Decision rules are provided at the 1% significance level for each test
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher; Developer; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: entropy-randomness; Assess; Compliance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Statistical testing; Randomness testing; Conformance testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: Random Number Generators; Pseudorandom Number Generators; Entropy source output quality
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: NIST-SP-800-22-R1A.pdf (7,583,475 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:49:32

---

## BSI-AIS-20-31

- **Reference ID**: BSI-AIS-20-31
- **Title**: AIS 20/AIS 31: Functionality Classes and Evaluation Methodology for Deterministic and Physical Random Number Generators
- **Authors**: BSI
- **Publication Date**: 2011-09-01
- **Last Updated**: 2024-09-01
- **Document Status**: Published
- **Main Topic**: This document outlines evaluation criteria and functionality classes for deterministic and true random number generators as an update to the mathematical-technical reference for AIS 20 and AIS 31.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Germany; Bodies: Bundesamt für Sicherheit in der Informationstechnik (BSI)
- **Leaders Contributions Mentioned**: Matthias Peter; Werner Schindler; Kyan Adib-Ghiassi; Marco Bucci; Markus Dichtl; Ignacio Dieguez; Björn Fay; Jonas Fiege; Viktor Fischer; Robert Freire-Stoegbuchner; Adrian Gabriel; Berndt Gammel; Aron Gohr; Gabriel Goller; Rainer Göttfert; Patrick Haddad; Stefan Heiss; Tobias Hemmert; John Kelsey; Wolfgang Krupp; Mario Lamberger; Friederike Laus; Marc Le Guin; Raimondo Luzzi; Wolfgang Killmann; Kerry McKay; Florian Mendel; Stephan Müller; Matthias Nagel; Christoph Pacher; Jean-René Reinhard; Gen’ya Sakurai; Ernst Schulte-Geers; Torsten Schütze; Martin Steinbach; Jan “Kuba” Tatarkiewicz; Lars Tebelmann; Yannick Teglia; Meltem Sönmez Turan; Aurélie Uturald; Elaine Barker; Johannes Mittmann
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Bundesamt für Sicherheit in der Informationstechnik (BSI); National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: Common Criteria; AIS 20; AIS 31
- **Classical Algorithms Referenced**: AES; Hash; HMAC
- **Key Takeaways**: AIS 20 and AIS 31 define functionality classes for deterministic and true random number generators in the German Common Criteria certification scheme; The document serves as the mathematical-technical reference for evaluating RNGs to ensure cryptographic security; Specific functionality classes include DRG.1–DRG.4 for deterministic RNGs and PTG.1–PTG.3 for physical RNGs; Evaluation methodologies cover stochastic models, online tests, and statistical predictors for RNG validation
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: entropy-randomness; compliance-strategy; Assess
- **Implementation Attack Surface**: implementation attacks; side-channel; fault injection
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: statistical tests; online test; total failure test; start-up test; black box test suite Tirn; conformance testing
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: true random number generation; physical random number generators; entropy; min-entropy; randomness extraction; DRBG seeding; noise sources; stochastic models
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: BSI-AIS-20-31.pdf (6,139,459 bytes, 12,031 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:51:20

---

## QCCPA-2022

- **Reference ID**: QCCPA-2022
- **Title**: Quantum Computing Cybersecurity Preparedness Act (H.R.7535)
- **Authors**: US Congress
- **Publication Date**: 2022-12-21
- **Last Updated**: 2022-12-21
- **Document Status**: Enacted
- **Main Topic**: US legislation (S.11) requiring the Office of Management and Budget to prioritize and mandate the migration of Federal Government information technology systems to post-quantum cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Harvest Now Decrypt Later (adversaries stealing sensitive encrypted data today to decrypt later with quantum computers); integer factorization
- **Migration Timeline Info**: Inventory establishment within 180 days of enactment; agency reports due 1 year after enactment and ongoing; migration plans required 1 year after NIST issues PQC standards
- **Applicable Regions / Bodies**: Regions: United States; Bodies: Office of Management and Budget (OMB), Cybersecurity and Infrastructure Security Agency (CISA), National Institute of Standards and Technology (NIST), National Cyber Director, Federal Government executive agencies
- **Leaders Contributions Mentioned**: Ms. Hassan (introduced bill); Mr. Portman (co-introduced bill)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Information technology systems; cryptographic systems
- **Standardization Bodies**: National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Federal agencies must establish an inventory of cryptographic systems within 180 days of enactment; Agencies must report IT vulnerable to quantum decryption to OMB, CISA, and National Cyber Director annually; Migration plans are required one year after NIST issues PQC standards; Strategy should prioritize developing applications and software that support cryptographic agility
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Cryptographic agility
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; Compliance Officer; Security Architect
- **Implementation Prerequisites**: NIST issuance of post-quantum cryptography standards; establishment of cryptographic system inventory
- **Relevant PQC Today Features**: Compliance; Migrate; Assess; crypto-agility; pqc-governance; migration-program
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Inventory of each cryptographic system in use; inventory of information technology vulnerable to decryption by quantum computers
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Phased approach involving inventory, reporting, and planning; automated progress evaluation to the greatest extent practicable
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Requirement for governmentwide and industrywide approach; need for strategy for migration of IT systems
- **Source Document**: QCCPA-2022.pdf (35,524 bytes, 6,079 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:53:47

---

## G7-CEG-Financial-PQC-2026

- **Reference ID**: G7-CEG-Financial-PQC-2026
- **Title**: G7 Cyber Expert Group — Advancing a Coordinated Approach to PQC Transition for the Financial Sector
- **Authors**: G7 Cyber Expert Group; US Treasury; Bank of England
- **Publication Date**: 2026-01-01
- **Last Updated**: 2026-01-01
- **Document Status**: Published
- **Main Topic**: G7 Cyber Expert Group roadmap for a coordinated transition to post-quantum cryptography in the financial sector, outlining timelines, interoperability principles, and crypto agility guidance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers (CRQCs); Harvest now, decrypt later
- **Migration Timeline Info**: Overall target date for migration is 2035; Critical systems prioritization target is 2030-2032
- **Applicable Regions / Bodies**: Regions: G7 jurisdictions; Bodies: G7 Cyber Expert Group (CEG), National Institute of Standards and Technology (NIST), Financial Services Information Sharing and Analysis Center (FS-ISAC), Canadian Forum on Digital Infrastructure Resilience (CFDIR), UK National Cyber Security Centre (NCSC), European Quantum-Safe Financial Forum (EU-QSFF), Financial Stability Board (FSB), International Organization for Standardization (ISO), Internet Engineering Task Force (IETF), Bank for International Settlement (BIS), World Economic Forum (WEF), Cross Market Operational Resilience Group (CMORG), European Commission, Europol
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI; Key Management; Cloud KMS; Clearing or settlement platforms
- **Standardization Bodies**: National Institute of Standards and Technology (NIST); International Organization for Standardization (ISO); Internet Engineering Task Force (IETF)
- **Compliance Frameworks Referenced**: ISO 27001; ITIL
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Establish comparable migration timelines with a general target of 2035 and critical system targets of 2030-2032; Adopt a risk-based approach to prioritize critical systems while using non-critical use cases as early pilots; Incorporate cryptographic agility into transition plans to adapt to emerging threats and new standards; Collaborate across jurisdictions and with third-party vendors to manage dependencies and ensure interoperability; Conduct comprehensive inventory of cryptographic assets and third-party dependencies to identify gaps and plan migration.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid key exchange; Cryptographic agility; Dual-track approach
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Security Architect; Compliance Officer; Policy Maker; Operations
- **Implementation Prerequisites**: Comprehensive inventory of cryptographic assets; Mapped critical systems and functions; Defined key roles; Tailored migration plans; Assessment of system-wide post-quantum maturity
- **Relevant PQC Today Features**: Timeline; Threats; Migrate; Assess; crypto-agility; vendor-risk; migration-program; pqc-risk-management; pqc-governance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Comprehensive inventory of cryptographic assets; Mapped critical systems, functions, sensitive data, and communication protocols; Identified gaps in people, processes, organization, and technology capabilities
- **Testing & Validation Methods**: Migration Testing; Validation & Monitoring; Ecosystem-oriented quantum-resilience exercises; Testing and crisis coordination exercises
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: Management of external dependencies; Monitoring maturity of quantum technologies, standards, tools, and threats; Addressing availability of third-party solutions; Overcoming barriers related to limited transparency and obtaining detailed vendor roadmaps
- **Deployment & Migration Complexity**: Phased approach (Awareness & Preparation, Discovery & Inventory, Risk Assessment & Planning, Migration Execution, Migration Testing, Validation & Monitoring); Parallel or iterative activities; Long lead times for safe transition; Complexity of migration based on system complexity and criticality
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Executive-level risk awareness; Defined key roles; Governance and risk management embedding; Stakeholder dialogue; Capability building; Maturity assessment
- **Source Document**: G7-CEG-Financial-PQC-2026.pdf (384,613 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:55:30

---

## Malaysia-NACSA-PQC-2025

- **Reference ID**: Malaysia-NACSA-PQC-2025
- **Title**: Malaysia National Cryptography Policy and PQC Migration Plan 2025-2030
- **Authors**: NACSA Malaysia; Malaysia Ministry of Digital
- **Publication Date**: 2025-11-01
- **Last Updated**: 2025-11-01
- **Document Status**: Published
- **Main Topic**: Malaysia's National Cryptography Policy (MyKriptografi) and Post-Quantum Cryptography migration plan for 2025-2030 to protect national critical information infrastructure and ensure digital sovereignty.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Post-quantum threats; emerging technologies; artificial intelligence threats
- **Migration Timeline Info**: 2025-2030 migration plan; alignment with Malaysia Cyber Security Strategy (MCSS) 2025-2030; alignment with 13th Malaysia Plan (2026-2030)
- **Applicable Regions / Bodies**: Regions: Malaysia; Bodies: Agensi Keselamatan Siber Negara (NACSA), Majlis Keselamatan Negara (MKN), Jabatan Perdana Menteri (JPM), Kementerian Digital, Jabatan Digital Negara, Jabatan Standard Malaysia, Pos Digitcert Sdn. Bhd., MSC Trustgate.com Sdn. Bhd., Pusat Teknologi dan Pengurusan Kriptologi Malaysia (PTPKM), Malaysian Society for Cryptology Research (MSCR), Cyber Security Academia Malaysia (CSAM), Universiti Putra Malaysia (UPM), Universiti Teknologi Malaysia (UTM), Universiti Sains Malaysia (USM), Universiti Teknikal Malaysia Melaka (UTeM), MIMOS Berhad, MyDigital ID Sdn. Bhd., CyberSecurity Malaysia, Suruhanjaya Komunikasi dan Multimedia Malaysia, Bank Negara Malaysia, Polis Diraja Malaysia, Angkatan Tentera Malaysia, Kementerian Dalam Negeri, Kementerian Ekonomi, Kementerian Luar Negeri, Kementerian Sains, Teknologi dan Inovasi, Kementerian Pertahanan, Kementerian Kewangan, Jabatan Perkhidmatan Awam, Jabatan Peguam Negara, Pejabat Ketua Pegawai Keselamatan Kerajaan Malaysia
- **Leaders Contributions Mentioned**: YAB Dato’ Seri Anwar Bin Ibrahim (Prime Minister, endorsed MyKriptografi for national integrity and digital sovereignty); YM Raja Dato’ Nushirwan Bin Zainal Abidin (Director General of National Security, emphasized systematic cryptography strategy for national stability); YBRS. Ir. Dr. Megat Zuhastry Bin Megat Tajuddin (CEO of NACSA, committed to leading implementation, coordination, and technical capability development)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: National Critical Information Infrastructure (NCII); Public and private domains for data transfer, processing, and storage
- **Standardization Bodies**: Jabatan Standard Malaysia; International standards (referenced generally as "piawaian antarabangsa")
- **Compliance Frameworks Referenced**: Akta Keselamatan Siber 2024 [Akta 854]; Dasar Keselamatan Negara (DKN) 2021-2025; Malaysia Cyber Security Strategy (MCSS) 2025-2030; Dasar Kriptografi Negara (MyKriptografi)
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Malaysia has established a national cryptography policy (MyKriptografi) to regulate cryptographic technology usage and ensure compliance with international standards; A specific PQC migration plan is defined for the 2025-2030 period to protect National Critical Information Infrastructure (NCII) and government systems; NACSA and MKN are designated as the national coordinators for monitoring, coordinating, and enforcing cryptographic security aspects; The policy emphasizes developing local Research, Development, Commercialization, and Innovation (RDCI) capabilities in cryptography rather than just consuming technology; Implementation supports the broader Malaysia Cyber Security Strategy (MCSS) 2025-2030 to enhance national cyber resilience against post-quantum and AI threats
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Policy Maker; CISO; Compliance Officer; Security Architect
- **Implementation Prerequisites**: Compliance with Akta Keselamatan Siber 2024 [Akta 854]; Alignment with Dasar Keselamatan Negara (DKN) 2021-2025; Coordination with NACSA and MKN; Development of local RDCI capabilities
- **Relevant PQC Today Features**: migration-program; pqc-governance; compliance-strategy; pqc-risk-management; pqc-business-case
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Phased migration plan 2025-2030; Coordination required between government agencies, industry, and strategic partners; Emphasis on systematic and integrated strategy for NCII and non-NCII entities
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: Governance prerequisites defined by MyKriptografi; Requirement for systematic and integrated cryptography strategy; Need for local expertise development (RDCI); Board-level endorsement by Prime Minister and National Security Director General
- **Source Document**: Malaysia-NACSA-PQC-2025.pdf (20,102,555 bytes, 12,731 extracted chars)
- **Extraction Timestamp**: 2026-04-26T19:57:58

---

## Saudi-NCA-ECC2-2024

- **Reference ID**: Saudi-NCA-ECC2-2024
- **Title**: Saudi Arabia National Cybersecurity Authority — Essential Cybersecurity Controls ECC-2:2024
- **Authors**: Saudi NCA; National Cybersecurity Authority Saudi Arabia
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: Guide for implementing the Essential Cybersecurity Controls (ECC) developed by the National Cybersecurity Authority (NCA) of Saudi Arabia.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: Kingdom of Saudi Arabia; Bodies: National Cybersecurity Authority (NCA)
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: Essential Cybersecurity Controls (ECC), CCC, CSCC
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations must establish a dedicated cybersecurity function independent from IT/ICT functions; Cybersecurity strategies must be defined, documented, and approved by the head of the organization or delegate; Strategies must be reviewed periodically or upon changes to laws and regulations; A roadmap must be executed to implement the cybersecurity strategy including monitoring and corrective steps.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer; Security Architect; CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: pqc-governance; compliance-strategy; migration-program
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
- **Source Document**: Saudi-NCA-ECC2-2024.pdf (1,297,107 bytes, 13,603 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:01:13

---

## AU-ASD-ISM-Crypto-2024

- **Reference ID**: AU-ASD-ISM-Crypto-2024
- **Title**: ASD Information Security Manual — Guidelines for Cryptography (December 2024)
- **Authors**: ASD; Australian Signals Directorate; ACSC
- **Publication Date**: 2024-12-01
- **Last Updated**: 2024-12-01
- **Document Status**: Published
- **Main Topic**: ASD Information Security Manual guidelines for cryptography, including approved algorithms, key management, and encryption requirements for Australian government systems.
- **PQC Algorithms Covered**: ML-DSA, ML-KEM
- **Quantum Threats Addressed**: projected technological advances in quantum computing
- **Migration Timeline Info**: DH will not be approved for use beyond 2030
- **Applicable Regions / Bodies**: Regions: Australia; Bodies: Australian Signals Directorate (ASD), Department of Home Affairs
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: Key Management, High Assurance Cryptographic Equipment (HACE)
- **Standardization Bodies**: International Organization for Standardization (ISO), International Electrotechnical Commission (IEC), National Institute of Standards and Technology (NIST), Canadian Centre for Cyber Security
- **Compliance Frameworks Referenced**: FIPS 140-3, ISO/IEC 19790:2012, ISO/IEC 24759:2017, Common Criteria, Essential Eight, Protective Security Policy Framework
- **Classical Algorithms Referenced**: Diffie-Hellman (DH), Elliptic Curve Diffie-Hellman (ECDH), Elliptic Curve Digital Signature Algorithm (ECDSA), Rivest-Shamir-Adleman (RSA), Secure Hashing Algorithm 2 (SHA-2), Secure Hashing Algorithm 3 (SHA-3), Advanced Encryption Standard (AES)
- **Key Takeaways**: Organizations must disable unapproved cryptographic algorithms to prevent security risks; DH is deprecated for use beyond 2030 due to quantum computing threats; Full disk encryption is preferred over file-based encryption for data at rest; HACE is required for SECRET and TOP SECRET data protection; Keying material must be changed immediately upon suspected compromise.
- **Security Levels & Parameters**: 112 bits for non-classified data; 112 bits for OFFICIAL: Sensitive data; 112 bits for PROTECTED data; 128 bits for SECRET data; 192 bits for TOP SECRET data; 2048 bits modulus for DH
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Compliance Officer, Security Architect, CISO
- **Implementation Prerequisites**: ASD-Approved Cryptographic Algorithm (AACA) or high assurance cryptographic algorithm; Common Criteria evaluation against a Protection Profile for OFFICIAL: Sensitive or PROTECTED data; HACE for SECRET or TOP SECRET data
- **Relevant PQC Today Features**: Algorithms, Compliance, Migration-program, pqc-governance
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Common Criteria evaluation; Cryptographic Module Validation Program
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: cyber supply chain risk management
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: AU-ASD-ISM-Crypto-2024.pdf (1,204,322 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:02:54

---

## SPHINCS-Plus-Spec-v31

- **Reference ID**: SPHINCS-Plus-Spec-v31
- **Title**: SPHINCS+ Stateless Hash-Based Signature Scheme v3.1
- **Authors**: TU Eindhoven; Ruhr University Bochum; UC Berkeley
- **Publication Date**: 2022-06-15
- **Last Updated**: 2022-06-15
- **Document Status**: Final
- **Main Topic**: Official specification for the SPHINCS+ stateless hash-based signature scheme, detailing its construction, parameter sets, and security evaluation.
- **PQC Algorithms Covered**: SPHINCS+, SLH-DSA, XMSS, WOTS+, FORS
- **Quantum Threats Addressed**: Quantum cryptanalysis
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Jean-Philippe Aumasson, Daniel J. Bernstein, Ward Beullens, Christoph Dobraunig, Maria Eichlseder, Scott Fluhrer, Stefan-Lukas Gazdag, Andreas Hülsing, Panos Kampanakis, Stefan Kölbl, Tanja Lange, Martin M. Lauridsen, Florian Mendel, Ruben Niederhagen, Christian Rechberger, Joost Rijneveld, Peter Schwabe, Bas Westerbaan
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST, CFRG
- **Compliance Frameworks Referenced**: FIPS 205
- **Classical Algorithms Referenced**: SHA-2, SHAKE, Haraka
- **Key Takeaways**: SPHINCS+ is a stateless hash-based signature scheme relying solely on hash function security; The scheme uses a hypertree structure to authenticate few-time signature key pairs without maintaining state; Parameter sets are available for SHA-2 and SHAKE instantiations at security levels 1, 3, and 5; The design includes multi-target attack protection via keyed hash functions and tweakable hash functions; SPHINCS+ offers 'simple' and 'robust' instantiations trading off speed for security argument strength
- **Security Levels & Parameters**: Security levels 1, 3, and 5; SPHINCS+-SHA2; SPHINCS+-SHAKE; SPHINCS+-Haraka
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Researcher, Developer, Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, stateful-signatures, merkle-tree-certs
- **Implementation Attack Surface**: Side-channel protection
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: TRNG
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: SPHINCS-Plus-Spec-v31.pdf (1,017,014 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:05:18

---

## Classic-McEliece-Spec

- **Reference ID**: Classic-McEliece-Spec
- **Title**: Classic McEliece: conservative code-based cryptography
- **Authors**: TU Eindhoven; UC Berkeley; CWI Amsterdam
- **Publication Date**: 2017-11-30
- **Last Updated**: 2020-10-10
- **Document Status**: Round 4 Submission
- **Main Topic**: Specification modifications for Classic McEliece Round 4, specifically the removal of plaintext confirmation from the CCA transform to address patent concerns and simplify implementation.
- **PQC Algorithms Covered**: Classic McEliece
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States
- **Leaders Contributions Mentioned**: Shoup
- **PQC Products Mentioned**: libsecded
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHAKE256
- **Key Takeaways**: Removing plaintext confirmation eliminates concerns regarding U.S. patent 9912479 and simplifies the specification; Ciphertexts are reduced by 32 bytes due to the removal of plaintext confirmation; Implicit rejection is sufficient for proving IND-CCA2 security assuming OW-CPA security; Implementors should use error-correcting codes like SECDED to protect against private key bit-flip attacks in beyond-IND-CCA2 models; KEM specifications should remain modular and avoid integrating generic transformations like SECDED or label hashing.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Ciphertexts are 32 bytes smaller
- **Target Audience**: Developer; Security Architect
- **Implementation Prerequisites**: SECDED ECC DRAM hardware; libsecded software library
- **Relevant PQC Today Features**: Algorithms; Assess; pqc-risk-management
- **Implementation Attack Surface**: side-channel attacks; fault attacks; DRAM fault; single bit flip in stored private key
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: Classic-McEliece-Spec.pdf (61,293 bytes, 4,808 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:07:46

---

## UEFI-SPEC-2.10-SecureBoot

- **Reference ID**: UEFI-SPEC-2.10-SecureBoot
- **Title**: UEFI Specification 2.10 — Secure Boot and Driver Signing (Chapter 32)
- **Authors**: UEFI Forum
- **Publication Date**: 2023-08-01
- **Last Updated**: 2023-08-01
- **Document Status**: Published
- **Main Topic**: Defines UEFI Secure Boot mechanisms for authenticating firmware images via EFI_CERT_X509 entries and PKCS#7 SignedData verification.
- **PQC Algorithms Covered**: ML-DSA; SLH-DSA
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: PKCS#7; X.509
- **Infrastructure Layers**: Secure Boot database (db); dbx revocation
- **Standardization Bodies**: UEFI Forum, Inc.
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; ECDSA
- **Key Takeaways**: UEFI Secure Boot authenticates firmware images using EFI_CERT_X509 entries in the Secure Boot database; Signature verification relies on PKCS#7 SignedData at boot time; Current RSA and ECDSA signing keys must be replaced with ML-DSA or SLH-DSA for PQC migration; Key enrollment and dbx revocation processes are defined for managing trust anchors
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Firmware Developer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: code-signing; pki-workshop; migration-program; algorithms
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
- **Source Document**: UEFI-SPEC-2.10-SecureBoot.pdf (16,141,878 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:09:15

---

## ref-bindel-hybrid-sigs

- **Reference ID**: ref-bindel-hybrid-sigs
- **Title**: A note on hybrid signature schemes
- **Authors**: N. Bindel and B. Hale
- **Publication Date**: 2023-01-01
- **Last Updated**: 2023-01-01
- **Document Status**: Published
- **Main Topic**: This document presents work-in-progress on hybrid/composite digital signature schemes, analyzing design goals such as proof composability, non-separability, and compatibility.
- **PQC Algorithms Covered**: Dilithium, Falcon
- **Quantum Threats Addressed**: Quantum computers executing cryptanalysis; Harvest Now Decrypt Later (implied by Mosca's equation context)
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: United States; Department of Defense; U.S. Government
- **Leaders Contributions Mentioned**: Nina Bindel (author); Britta Hale (author)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: PKI (public key certificate chains)
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA, DSA
- **Key Takeaways**: Hybrid signature schemes must balance security properties like proof composability and non-separability with practical constraints like backwards compatibility; Strong Non-Separability prevents adversaries from stripping components but is mutually exclusive with backwards compatibility; Mosca's equation highlights the urgency of transitioning to post-quantum algorithms now rather than waiting for further cryptanalysis; Complex post-quantum algorithms may contain undiscovered subtleties, making hybridization a prudent risk mitigation strategy during the transition period.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid/composite signature schemes; parallel signing; concatenation approaches; backwards compatibility; forwards compatibility; weak non-separability; strong non-separability; simultaneous verification
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Cryptographer; Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: hybrid-crypto; crypto-agility; pqc-risk-management; migration-program
- **Implementation Attack Surface**: Downgrading attacks; signature stripping attacks; padding oracle attacks (implied by RSA context); parameter selection errors
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Formal security analysis (mentioned as future work); cryptanalysis
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Backwards compatibility challenges; system integration and testing time; acquisition and procurement delays; hardware encoding replacement
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: ref-bindel-hybrid-sigs.pdf (1,012,356 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:11:45

---

## ref-aardal-falcon-labrador

- **Reference ID**: ref-aardal-falcon-labrador
- **Title**: Aggregating falcon signatures with LaBRADOR
- **Authors**: M. A. Aardal et al.
- **Publication Date**: 2024-01-01
- **Last Updated**: 2024-01-01
- **Document Status**: Published
- **Main Topic**: The document presents a rigorous proof and method for aggregating Falcon post-quantum signatures using the LaBRADOR non-interactive argument of knowledge system.
- **PQC Algorithms Covered**: Falcon, LaBRADOR
- **Quantum Threats Addressed**: Quantum computers breaking currently deployed cryptographic protocols
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Marius A. Aardal, Diego F. Aranha, Katharina Boudgoust, Sebastian Kolby, Akira Takahashi
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: NIST
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: LaBRADOR can be rigorously adapted to aggregate Falcon signatures using non-interactive arguments of knowledge; Predicate Special Soundness (PSS) is introduced as a framework for evaluating knowledge error in complex Fiat-Shamir protocols; Using a 2-splitting ring instead of a high-splitting ring results in shorter proofs and more efficient ring computations; The approach can be adapted to synchronized models like Squirrel and Chipmunk to achieve sublinear aggregate signature sizes by eliminating salts
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: Aggregate signature sizes are reported in Section 7; compression rate of prior GPV-based schemes adapted to Falcon is about 60%; sublinear sizes achieved by eliminating salts
- **Target Audience**: Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, pqc-101, digital-assets
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
- **Source Document**: ref-aardal-falcon-labrador.pdf (1,250,273 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:13:46

---

## ref-gidney-factor-rsa-8h

- **Reference ID**: ref-gidney-factor-rsa-8h
- **Title**: How to factor 2048 bit RSA integers in 8 hours using 20 million noisy qubits
- **Authors**: C. Gidney and M. Eker
- **Publication Date**: 2021-04-15
- **Last Updated**: 2021-04-15
- **Document Status**: Published
- **Main Topic**: The document presents optimized quantum circuit constructions for Shor's algorithm to factor 2048-bit RSA integers and solve discrete logarithm problems, estimating the required physical qubits and runtime on noisy superconducting platforms.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: Shor's Algorithm
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Craig Gidney and Martin Ekerå combined techniques to reduce the cost of factoring integers and computing discrete logarithms; Peter Shor introduced polynomial time quantum algorithms for factoring and discrete logarithms; Griffiths-Niu, Zalka, Fowler, Håstad, Van Meter, Jones, Gheorghiu, Vedral, Beauregard, Häner, Roetteler, O’Gorman, and others contributed to historical cost estimates or algorithmic optimizations referenced in the text.
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: Diffie-Hellman key agreement protocol; Digital Signature Algorithm
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RSA; DLP (Discrete Logarithm Problem); Diffie-Hellman; Digital Signature Algorithm; Elliptic Curve DLP
- **Key Takeaways**: Optimized quantum constructions can factor 2048-bit RSA integers in approximately 8 hours using 20 million noisy qubits; The spacetime volume for factoring is reduced by a hundredfold compared to earlier estimates like Van Meter et al. 2009; Cost estimates depend heavily on physical assumptions such as gate error rates and cycle times, with doubling the error rate increasing qubit requirements by more than 10%; The work provides concrete cost estimates for RSA and DLP in finite fields to inform migration decisions to post-quantum secure systems; Derivatives of Shor's algorithm optimized for short DLP and Schnorr groups achieve significant cost improvements.
- **Security Levels & Parameters**: 2048-bit RSA; 1024-bit RSA; 3072-bit RSA; 10^-3 physical gate error rate; 1 microsecond surface code cycle time; 10 microseconds reaction time
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: 20 million physical qubits for 2048-bit RSA; 8 hours runtime for 2048-bit RSA; 3n + 0.002n lg n logical qubits; 0.3n^3 + 0.0005n^3 lg n Toffolis; 500n^2 + n^2 lg n measurement depth; 5.9 megaqubit-days minimum volume for 2048-bit RSA
- **Target Audience**: Researcher; Security Architect; Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Threats; Algorithms; Leaders; pqc-risk-management
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
- **Source Document**: ref-gidney-factor-rsa-8h.pdf (1,289,553 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:16:03

---

## eprint-2025-2059

- **Reference ID**: eprint-2025-2059
- **Title**: Compact, Efficient and Non-Separable Hybrid Signatures (Silithium)
- **Authors**: Julien Devevey; Morgane Guerreau; Maxime Roméas
- **Publication Date**: 2025-11-01
- **Last Updated**: 2025-11-01
- **Document Status**: Preprint
- **Main Topic**: Introduction of Silithium, a compact and efficient non-separable hybrid signature scheme combining EC-Schnorr and ML-DSA via an adapted Fiat-Shamir transform.
- **PQC Algorithms Covered**: ML-DSA
- **Quantum Threats Addressed**: Cryptographically relevant quantum computers
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Regions: France; Bodies: ANSSI, BSI, NLNCSA
- **Leaders Contributions Mentioned**: Julien Devevey, Morgane Guerreau, Maxime Roméas
- **PQC Products Mentioned**: Silithium
- **Protocols Covered**: SSH
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: IETF
- **Compliance Frameworks Referenced**: FIPS
- **Classical Algorithms Referenced**: EC-Schnorr, ECDSA, RSA, DSA, Falcon
- **Key Takeaways**: Hybridization balances long-term quantum threats with the need for algorithm maturity; Simple concatenation fails to ensure strong unforgeability and is vulnerable to separability attacks; Silithium achieves Strong Non-Separability (SNS) with smaller signatures and faster performance than concatenation; The proposed Hybrid EU-CMA security notion captures cross-protocol, separability, and recombination attacks during transition
- **Security Levels & Parameters**: ML-DSA-65
- **Hybrid & Transition Approaches**: Hybridization, Non-separable hybrid signatures, Strong Non-Separability (SNS), Simultaneous Verification (SV), Concatenation, Nested hybrids, Hygienic Hybridization
- **Performance & Size Considerations**: Reduces signature size compared to concatenation; Runs faster than concatenation
- **Target Audience**: Security Architect, Researcher, Developer
- **Implementation Prerequisites**: ML-DSA implementation supporting the “external µ” option during verification; Elliptic curve library; OpenSSL
- **Relevant PQC Today Features**: hybrid-crypto, Algorithms, crypto-agility, pqc-risk-management
- **Implementation Attack Surface**: Separability attacks; Recombination attacks; Cross-protocol attacks; Downgrade attacks; Upgrade attacks
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: Proof-of-concept OpenSSL implementation
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Minimal-overhead strategy; Phasing out pre-quantum component; Key lifecycle separation
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: eprint-2025-2059.pdf (812,780 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:18:46

---

## IETF-RFC-8996

- **Reference ID**: IETF-RFC-8996
- **Title**: RFC 8996: Deprecating TLS 1.0 and 1.1
- **Authors**: IETF
- **Publication Date**: 2021-03-01
- **Last Updated**: 2021-03-01
- **Document Status**: Published
- **Main Topic**: Formal deprecation of TLS 1.0, TLS 1.1, and DTLS 1.0 across the IETF protocol suite, mandating migration to TLS 1.2 or 1.3.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: K. Moriarty; S. Farrell
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS 1.0; TLS 1.1; TLS 1.2; TLS 1.3; DTLS 1.0; DTLS 1.2
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: NIST SP 800-52r2
- **Classical Algorithms Referenced**: SHA-1; MD5; 3DES; DES; IDEA; RSA; Diffie-Hellman; HKDF; AEAD
- **Key Takeaways**: TLS 1.0 and 1.1 must not be used due to reliance on weak SHA-1 hashes and lack of AEAD support; Migration to TLS 1.2 or 1.3 is mandated to reduce attack surface and misconfiguration risks; Fallback to deprecated TLS versions is prohibited in updated RFCs; Developers should remove support for older TLS versions to streamline maintenance and security.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: tls-basics; migration-program; compliance-strategy
- **Implementation Attack Surface**: BEAST; POODLE; CBC padding oracle; downgrade attacks; SHA-1 collision attacks
- **Cryptographic Discovery & Inventory**: None detected
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: Phasing out support for older versions; reducing attack surface; streamlining library and product maintenance
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: IETF-RFC-8996.html (141,407 bytes, 15,000 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:20:48

---

## IETF-RFC-7465

- **Reference ID**: IETF-RFC-7465
- **Title**: RFC 7465: Prohibiting RC4 Cipher Suites
- **Authors**: IETF
- **Publication Date**: 2015-02-01
- **Last Updated**: 2015-02-01
- **Document Status**: Published
- **Main Topic**: This document mandates that TLS clients and servers must not negotiate or use RC4 cipher suites due to known cryptographic weaknesses and statistical biases.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Andrei Popov (Author); Magnus Nystrom, Eric Rescorla, Joseph Salowey, Yaron Sheffer, Nagendra Modadugu (Discussions)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: Internet Engineering Task Force (IETF); Internet Engineering Steering Group (IESG)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: RC4; MD5; SHA
- **Key Takeaways**: TLS clients must not include RC4 cipher suites in ClientHello messages; TLS servers must not select RC4 cipher suites and must terminate handshakes if only RC4 is offered; RC4 is prohibited due to keystream biases allowing plaintext recovery; This requirement applies to all TLS versions including 1.0, 1.1, and 1.2
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Developer; Compliance Officer
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: tls-basics; crypto-agility; migration-program
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
- **Source Document**: IETF-RFC-7465.html (19,695 bytes, 8,222 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:23:03

---

## OWASP-CycloneDX-CBOM-Guide

- **Reference ID**: OWASP-CycloneDX-CBOM-Guide
- **Title**: OWASP CycloneDX: CBOM Authoritative Guide
- **Authors**: OWASP CycloneDX
- **Publication Date**: 2023-06-01
- **Last Updated**: 2024-09-01
- **Document Status**: Published
- **Main Topic**: The document introduces the OWASP CycloneDX Cryptography Bill of Materials (CBOM) specification for discovering, managing, and reporting on cryptographic assets to support quantum-safe transition and compliance.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: emerging quantum threats
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: CycloneDX
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: OWASP Foundation
- **Compliance Frameworks Referenced**: National Security Memorandum on Post-Quantum Cryptography; NIST Special Publication 1800-38B
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should use CBOM to catalog cryptographic dependencies and identify areas requiring upgrades; CBOM enables assessment of robustness against deprecated algorithms and expired certificates; The specification supports compliance with post-quantum cryptography standards like NSM and NIST SP 1800-38B; Enhanced cryptographic agility is achieved through detailed representation of algorithms, keys, and certificates.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect; Compliance Officer; CISO
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Assess; Compliance; Migrate; crypto-agility
- **Implementation Attack Surface**: None detected
- **Cryptographic Discovery & Inventory**: Cryptography Bill of Materials (CBOM); algorithm enumeration; certificate inventory; key material audit; deprecated cipher detection
- **Testing & Validation Methods**: None detected
- **QKD Protocols & Quantum Networking**: None detected
- **QRNG & Entropy Sources**: None detected
- **Constrained Device & IoT Suitability**: None detected
- **Supply Chain & Vendor Risk**: None detected
- **Deployment & Migration Complexity**: None detected
- **Financial & Business Impact**: None detected
- **Organizational Readiness**: None detected
- **Source Document**: OWASP-CycloneDX-CBOM-Guide.html (35,229 bytes, 3,291 extracted chars)
- **Extraction Timestamp**: 2026-04-26T20:24:44

---
