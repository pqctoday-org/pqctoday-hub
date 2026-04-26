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
