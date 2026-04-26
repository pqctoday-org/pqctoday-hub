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
- **Compliance Frameworks Referenced**: FIPS 140-3; FIPS 140-2; FIPS 203; FIPS 204; FIPS 205; FIPS 186-5; SP 800-140; SP 800-38D; SP 800-38E; SP 800-38G; SP 800-186; SP 800-107; SP 800-208; SP 800-90B; SP 800-90A; SP 800-108; SP 800-132; SP 800-56CREV2; SP 800-133; SP 800-67REV2; SP 800-63B; ISO/IEC 24759:2017(E)
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
