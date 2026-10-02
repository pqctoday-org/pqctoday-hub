---
generated: 2026-10-01
category: Technical Standards
document_count: 4
requirement_count: 18
---

## Security-Considerations-for-ML-DSA
- **Source**: Security Considerations for ML-DSA
- **URL**: https://www.ietf.org/archive/id/draft-connolly-cfrg-ml-dsa-security-considerations-02.txt
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · keys_: Assess side-channel attack possibilities and use implementations resistant to such leakage.
    - _T2 Risk-Informed · keys_: Use hedged signing mode to mitigate fault injection and side-channel attacks.
    - _T2 Risk-Informed · keys_: Use available randomness sources for signing rather than falling back to deterministic signing on constrained platforms.
    - _T2 Risk-Informed · keys_: Define a fixed context string for a given protocol's use case to prevent cross-protocol attacks.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Zeroize signing keys when no longer needed to prevent later compromise.
    - _T2 Risk-Informed · keys_: Securely delete cached expanded signing key material when no longer needed.

## UK-PSTI-Regs-2023-1007
- **Source**: The Product Security and Telecommunications Infrastructure (Security Requirements for Relevant Connectable Products) Regulations 2023
- **URL**: https://www.legislation.gov.uk/uksi/2023/1007/pdfs/uksi_20231007_en.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Publish a point of contact for security issue reporting and specify timelines for acknowledgment and status updates.
    - _T2 Risk-Informed · all_: Publish the defined support period for security updates, ensuring it is accessible, clear, and free of charge.
    - _T2 Risk-Informed · all_: Retain a copy of the statement of compliance for the longer of 10 years or the defined support period.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Ensure passwords are unique per product or user-defined, and not derived from incremental counters or public identifiers without encryption.
    - _T2 Risk-Informed · software_: Provide security updates for the duration of the defined support period and publish any extensions to this period.

## US-FCC-24-26-Cyber-Trust-Mark
- **Source**: FCC 24-26 Report and Order: Cybersecurity Labeling for Internet of Things (U.S. Cyber Trust Mark)
- **URL**: https://docs.fcc.gov/public/attachments/FCC-24-26A1.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Obtain accreditation pursuant to all requirements associated with ISO/IEC 17065 for conformity assessment bodies certifying products, processes, and services.
- **Governance**:
    - _T2 Risk-Informed · all_: File an application with the Commission that includes a description of the organization structure and an explanation of how it will avoid personal and organizational conflict when processing applications.
    - _T2 Risk-Informed · all_: Demonstrate cybersecurity expertise, industry knowledge of IoT labeling requirements, and expert knowledge of NIST cybersecurity guidance and FCC rules associated with product compliance testing.
    - _T2 Risk-Informed · all_: Demonstrate the ability to securely handle large volumes of information and demonstrate internal security practices.

## draft-ietf-lake-pqsuites
- **Source**: Quantum-Resistant Cipher Suites for EDHOC (LAKE WG)
- **URL**: https://www.ietf.org/archive/id/draft-ietf-lake-pqsuites-01.txt
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Implementations MUST follow the side-channel requirements given in the specifications of ML-KEM and ML-DSA.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Generate a new encapsulation/decapsulation key pair for each LAKE session.
    - _T3 Repeatable · keys_: ML-KEM keys used for ephemeral key exchange MUST be freshly generated for each LAKE protocol session.
