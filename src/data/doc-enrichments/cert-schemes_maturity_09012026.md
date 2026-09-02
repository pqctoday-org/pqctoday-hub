---
generated: 2026-09-01
category: Certification Schemes
document_count: 4
requirement_count: 20
---

## COMMON-CRITERIA
- **Source**: Common Criteria for Information Technology Security Evaluation, CC:2022 Release 1, Part 1
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART1R1.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Conduct independent security evaluations of the TOE against a Security Target to establish confidence that security functionality and assurance measures meet specified requirements.
    - _T3 Repeatable · all_: Ensure evaluations adhere to strict conformance claims, prohibiting the evaluation scope from exceeding the defined conformance boundaries of the Protection Profile or Security Target.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish documented Security Targets (STs) that define the security objectives and requirements for the TOE, serving as the formal basis for evaluation and conformance claims.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Manage the composition of assurance for composite products by defining composition models (layered, network, embedded) and re-using evaluation results where applicable.
- **Observability**:
    - _T2 Risk-Informed · all_: Document and verify evaluation results for PP, PP-Configuration, and ST/TOE evaluations to provide evidence of compliance and security posture.

## NIAP-CCEVS-MANUAL
- **Source**: NIAP CCEVS Quality Manual (Scheme Publication #2)
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/scheme-pub-2.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Administer Common Criteria Testing Laboratories (CCTLs) through accreditation, proficiency testing, and audit records.
    - _T3 Repeatable · certificates_: Conduct internal audits and management reviews to verify the quality and integrity of the validation process and records.
- **Governance**:
    - _T3 Repeatable · all_: Define and enforce roles and responsibilities for NIAP personnel, including the Quality Manager, to ensure scheme integrity.
    - _T3 Repeatable · certificates_: Maintain a Product Compliant List (PCL) to track validated products and their current certification status within the scheme.
    - _T3 Repeatable · certificates_: Monitor the use of certificates to ensure they are not misused or applied to non-compliant configurations.
    - _T3 Repeatable · certificates_: Establish procedures for the withdrawal of certificates when products no longer meet scheme requirements or compliance is violated.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Manage the lifecycle of certificates through defined processes for issuance, recognition of partner certificates, and maintenance.
- **Observability**:
    - _T3 Repeatable · certificates_: Maintain detailed records of certificate issuance, maintenance, and withdrawal to support audit trails and status verification.

## NIAP-CCEVS-POLICY
- **Source**: NIAP CCEVS Policy Letter 26
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/policy-ltr-26.pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Establish policy to exclude products prohibited by statute or executive order from NIAP evaluation and certification for NSS use.
    - _T2 Risk-Informed · all_: Define authority for NIAP to refuse evaluation and certification of products subject to acquisition prohibitions for NSS.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Mandate vendor consultation with NIAP prior to contracting for evaluation if product may be affected by supply chain prohibitions.

## NIST-SP-800-90C
- **Source**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90C.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Validate RBG constructions against SP 800-90C via CMVP/CAVP to prove compliance with approved DRBG and entropy source requirements.
- **Governance**:
    - _T2 Risk-Informed · all_: Adhere to 'must' requirements for system administrators regarding RBG deployment, verified via documentation review by CMVP.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Ensure RBG constructions use validated randomness sources (SP 800-90B or SP 800-90C compliant) for initialization and reseeding.
- **Observability**:
    - _T3 Repeatable · libraries_: Implement and monitor health tests for RBG constructions to detect failures in entropy sources or DRBG operations as specified in Section 8.
