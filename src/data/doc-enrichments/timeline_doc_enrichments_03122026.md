---
generated: 2026-03-12
collection: timeline
documents_processed: 4
enrichment_method: ollama-qwen3.5:27b
---

## Global:OASIS — PKCS#11 v3.2 Committee Specification Draft Publish

- **Reference ID**: Global:OASIS — PKCS#11 v3.2 Committee Specification Draft Publish
- **Title**: PKCS#11 v3.2 Committee Specification Draft Publish
- **Authors**: See document
- **Publication Date**: Not specified
- **Last Updated**: Not specified
- **Document Status**: Not specified
- **Main Topic**: This document defines data types, functions, and basic components of the PKCS #11 Cryptoki interface in Version 3.2 Committee Specification Draft 01.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: None detected
- **Leaders Contributions Mentioned**: Valerie Fenwick (Chair); Robert Relyea (Chair); Dieter Bong (Editor); Greg Scott (Editor)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: X.509; WTLS; TLS 1.3 (implied via Double Ratchet and x3dh sections but not explicitly named as protocol version); Extended Triple Diffie-Hellman; Double Ratchet
- **Infrastructure Layers**: HSM; Key Management; PKI
- **Standardization Bodies**: OASIS
- **Compliance Frameworks Referenced**: FIPS 186-4; BCP 14; RFC 2119; RFC 8174
- **Classical Algorithms Referenced**: RSA; DSA; ECDSA; EdDSA; XEdDSA; Diffie-Hellman; HMAC; AES; SHA-1
- **Key Takeaways**: The specification defines the PKCS #11 Cryptoki interface for managing cryptographic tokens and sessions; It includes mechanisms for classical algorithms like RSA, DSA, and Elliptic Curve cryptography; New features include support for Extended Triple Diffie-Hellman and Double Ratchet key derivation; The document supersedes PKCS #11 Specification Version 3.1; Machine-readable content in plain text files prevails over prose narrative in case of discrepancy
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: X9.42 Diffie-Hellman hybrid key derivation
- **Performance & Size Considerations**: None detected
- **Target Audience**: Developer; Security Architect; Compliance Officer
- **Implementation Prerequisites**: C or C++ compiler support for platform-dependent directives; Subscription to OASIS TC public comment list for feedback; Adherence to RF on RAND Terms Mode of the OASIS IPR Policy
- **Relevant PQC Today Features**: hsm-pqc, pki-workshop, crypto-agility, algorithms, tls-basics

---

## Global:CA/Browser Forum — Ballot SMC013 ML-DSA for S/MIME Adopted

- **Reference ID**: Global:CA/Browser Forum — Ballot SMC013 ML-DSA for S/MIME Adopted
- **Title**: Ballot SMC013 ML-DSA for S/MIME Adopted
- **Authors**: CA/Browser Forum S/MIME Certificate Working Group
- **Publication Date**: 2025-08-22
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: CA/Browser Forum adopts Ballot SMC013 to enable ML-DSA and ML-KEM post-quantum algorithms in S/MIME certificates with single-key/non-hybrid specifications.
- **PQC Algorithms Covered**: ML-DSA, ML-KEM
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: Ballot adopted as of August 22, 2025; intended to enable experimentation by Certificate Issuers
- **Applicable Regions / Bodies**: Bodies: CA/Browser Forum, U.S. National Institute of Standards and Technology (NIST)
- **Leaders Contributions Mentioned**: Stephen Davidson (proposed ballot); Andreas Henschel (endorsed ballot); Martijn Katerbarg (endorsed ballot); Client Wilson (endorsed Ballot SMC014); Ashish Dhiman (endorsed Ballot SMC014)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: S/MIME, DNSSEC
- **Infrastructure Layers**: PKI, Certificate Issuance
- **Standardization Bodies**: CA/Browser Forum, U.S. National Institute of Standards and Technology (NIST)
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: SHA-1
- **Key Takeaways**: CA/Browser Forum formally adopted ML-DSA and ML-KEM for S/MIME certificates; The ballot specifies single-key/non-hybrid PQC certificates that do not rely on pre-quantum algorithms; Adoption enables experimentation by Certificate Issuers subject to Root program requirements; No IPR Exclusion Notices were filed during the review period
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Single-key/non-hybrid PQC certificates
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Compliance Officer, Policy Maker
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Algorithms, email-signing, pki-workshop, pqc-governance

---

## Global:3GPP SA3 — TR 33.841 PQC Study Item Approved

- **Reference ID**: Global:3GPP SA3 — TR 33.841 PQC Study Item Approved
- **Title**: TR 33.841 PQC Study Item Approved
- **Authors**: 3GPP Security Working Group SA3
- **Publication Date**: 2025-05-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: 3GPP SA3 approved study item TR 33.841 to prepare 5G security protocols for post-quantum cryptography transition.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: None detected
- **Migration Timeline Info**: None detected
- **Applicable Regions / Bodies**: Bodies: 3GPP SA3
- **Leaders Contributions Mentioned**: None detected
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: TLS, IPSec, IKEv2
- **Infrastructure Layers**: 5G network infrastructure
- **Standardization Bodies**: 3GPP
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: 3GPP SA3 has approved the first standardization activity for quantum-resistant mobile network security; The study item covers hybrid PQC integration for TLS, IPSec, and IKEv2; The initiative focuses on preparing 5G security protocols for post-quantum transition.
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: Hybrid PQC integration
- **Performance & Size Considerations**: None detected
- **Target Audience**: Security Architect, Policy Maker, Researcher
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: 5g-security, hybrid-crypto, tls-basics, vpn-ssh-pqc

---

## International:GRI — Quantum Threat Timeline Report 2025

- **Reference ID**: International:GRI — Quantum Threat Timeline Report 2025
- **Title**: Quantum Threat Timeline Report 2025
- **Authors**: Global Risk Institute
- **Publication Date**: 2026-03-01
- **Last Updated**: Not specified
- **Document Status**: New
- **Main Topic**: Annual expert survey assessing the accelerated timeline for cryptographically relevant quantum computers to break standard cryptography.
- **PQC Algorithms Covered**: None detected
- **Quantum Threats Addressed**: CRQC; breaking standard cryptography
- **Migration Timeline Info**: 28-49% probability of a CRQC within 10 years; 51-70% probability within 15 years; majority consider a CRQC by 2035 quite likely
- **Applicable Regions / Bodies**: Canada; Global (experts from around the world)
- **Leaders Contributions Mentioned**: Dr. Michele Mosca (Co-Founder & CEO, evolutionQ Inc.); Dr. Marco Piani (Senior Research Analyst, evolutionQ Inc.)
- **PQC Products Mentioned**: None detected
- **Protocols Covered**: None detected
- **Infrastructure Layers**: None detected
- **Standardization Bodies**: None detected
- **Compliance Frameworks Referenced**: None detected
- **Classical Algorithms Referenced**: None detected
- **Key Takeaways**: Organizations should take immediate action to address the significant cyber risk of quantum computing; The timeline for a cryptographically relevant quantum computer has accelerated significantly from previous reports; Experts believe a CRQC is quite possible within 10 years and likely within 15 years; Quantum computers will eventually be powerful enough to break current cybersecurity protocols
- **Security Levels & Parameters**: None detected
- **Hybrid & Transition Approaches**: None detected
- **Performance & Size Considerations**: None detected
- **Target Audience**: CISO; Policy Maker; Security Architect
- **Implementation Prerequisites**: None detected
- **Relevant PQC Today Features**: Timeline; Threats; Leaders; pqc-risk-management

---
