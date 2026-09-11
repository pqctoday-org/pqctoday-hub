---
generated: 2026-09-11
category: Certification Schemes
document_count: 7
requirement_count: 47
---

## CC-2022-CEM
- **Source**: Common Evaluation Methodology (CEM) 2022 R1
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CEM2022R1.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Verify that the conformance claim explicitly identifies the specific edition of the Common Criteria standard to which the product claims conformance.
    - _T3 Repeatable · all_: Validate that the conformance claim states whether the product is 'CC Part 2 conformant' or 'CC Part 2 extended' and 'CC Part 3 conformant' or 'CC Part 3 extended'.
    - _T3 Repeatable · all_: Examine the conformance claim to ensure it is consistent with the definition of any extended functional or assurance components.
    - _T3 Repeatable · all_: Check that the conformance claim identifies all functional packages to which the product claims conformance and verify the completeness of each package definition.
    - _T3 Repeatable · all_: Verify that the conformance claim for a PP-Configuration identifies the specific CC edition(s) to which the configuration and its components claim conformance.
    - _T3 Repeatable · all_: Examine the PP-Configuration conformance claim to determine compatibility between all CC versions related to the configuration and its constituent components.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document the roles and responsibilities of the sponsor, developer, evaluator, and evaluation authority within the certification scheme.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Identify and document all non-TOE hardware, software, and firmware available to the TOE to ensure the operational environment is fully specified for re-evaluation or deployment.
- **Observability**:
    - _T3 Repeatable · all_: Report a complete list of all Observation Reports (ORs) raised during the evaluation, including unique identifiers, titles, and current status.
    - _T3 Repeatable · all_: Document the issuing body, title, and unique reference (e.g., issue date and version number) for every item of evaluation evidence submitted.

## CC-2022-PART2
- **Source**: Common Criteria 2022 Part 2 — Security Functional Components (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART2R1.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Ensure cryptographic key generation algorithms and key sizes meet assigned standards.
    - _T2 Risk-Informed · keys_: Ensure cryptographic key distribution methods meet assigned standards.
    - _T2 Risk-Informed · keys_: Ensure cryptographic key access methods meet assigned standards.
    - _T2 Risk-Informed · keys_: Ensure cryptographic key derivation algorithms and key sizes meet assigned standards.
    - _T2 Risk-Informed · software_: Ensure cryptographic operations are performed using specified algorithms and key sizes that meet assigned standards.
    - _T2 Risk-Informed · software_: Ensure the Random Bit Generator (RBG) is seeded with a minimum specified amount of min-entropy from a defined noise source.
    - _T2 Risk-Informed · software_: Ensure the combination of noise sources for RBG seeding results in a minimum specified amount of min-entropy as defined by standards.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Define and enforce a lifecycle for cryptographic keys covering generation, distribution, access, derivation, and destruction.
    - _T2 Risk-Informed · keys_: Specify the timing and events for cryptographic key destruction and the method used to destroy them.
- **Observability**:
    - _T2 Risk-Informed · keys_: Audit the success and failure of cryptographic key management activities including generation, distribution, access, derivation, and destruction.
    - _T2 Risk-Informed · software_: Audit the success and failure of cryptographic operations, including the type of operation and applicable modes.

## CC-2022-PART3
- **Source**: Common Criteria 2022 Part 3 — Security Assurance Components (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART3R1.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Ensure the conformance claim is consistent with the extended components definition to maintain evaluation integrity.
    - _T3 Repeatable · all_: Provide a description of the security architecture of the TSF to allow analysis of domain separation, self-protection, and non-bypassability.
    - _T3 Repeatable · software_: Design and implement specific subsets of the TSF with well-structured internals, providing justification for the characteristics used to judge structure.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document the conformance claim for the security target, specifying whether it is CC Part 2 conformant or extended, and CC Part 3 conformant or extended.
    - _T2 Risk-Informed · all_: Provide a rationale for the conformance claim to justify the selected conformance type and scope.
    - _T2 Risk-Informed · all_: Specify the conformance type (exact, strict, or demonstrable) required for any Security Target to the PP-Module within a PP-Configuration.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify all Protection Profiles and packages to which the security target claims conformance to establish a complete inventory of dependencies.
    - _T2 Risk-Informed · all_: Identify all functional and assurance packages to which the PP-Module claims conformance, detailing if they are conformant, augmented, or tailored.

## NIST-ACVP
- **Source**: NIST Automated Cryptographic Validation Protocol (ACVP)
- **URL**: https://pages.nist.gov/ACVP/draft-fussell-acvp-spec.html
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Control access to the ACVP client so that only an administrator or other authorized user can send and receive ACVP messages to prevent probing for weaknesses.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and agree upon an authentication scheme between the client and server owning entities, including validation authorities, to secure ACVP communication.
- **Inventory**:
    - _T2 Risk-Informed · software_: Maintain software identification (SWID) tags and Common Platform Enumeration (CPE) names for cryptographic modules to support dependency tracking and validation registration.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement client-side error handling that triggers an indication of the failed operation and a detailed error description, logging this to a local facility for traceability.

## NIST-SP-800-140E
- **Source**: NIST SP 800-140E — CMVP Approved Authentication Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140E.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Ensure operator authentication acceptance is performed by the module or Operating Environment for all FIPS 140-3 levels above Level 1.
    - _T3 Repeatable · all_: Use SP 800-63B as the framework for authentication requirements and provide justification whenever SP 800-63B requirements cannot be met.
    - _T3 Repeatable · all_: Require testers to review and affirm vendor documentation regarding authentication mechanisms and SP 800-63B compliance.
    - _T3 Repeatable · all_: Assess normative SP 800-63B sections 5, 6, and 7, and informative sections 8 and 10 for each authenticator used in the module.
- **Governance**:
    - _T2 Risk-Informed · all_: Define roles for vendors, testing labs, and CMVP to address authentication issues in cryptographic module design, manufacture, and testing.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Apply SP 800-63B Section 6 lifecycle management requirements to the authentication mechanisms employed by the cryptographic module.

## NIST-SP-800-140F
- **Source**: NIST SP 800-140F — CMVP Approved Non-Invasive Attack Mitigation Test Methods
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140F.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Utilize CMVP-approved non-invasive attack mitigation test metrics to demonstrate cryptographic module conformance, superseding ISO/IEC 19790 Annex F and ISO/IEC 24759 paragraph 6.18.
    - _T3 Repeatable · all_: Provide vendor evidence and testing laboratory evidence to demonstrate conformity with the specified non-invasive attack mitigation test metrics.
- **Governance**:
    - _T2 Risk-Informed · all_: Adhere to the specific normative references ISO/IEC 19790:2012 (including 2015 corrections) and ISO/IEC 24759:2017 for validation testing procedures.

## NIST-SP-800-90B
- **Source**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/b/final
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Assign responsibility for requirements out-of-scope for CAVP or CMVP validation to entities using, implementing, installing, or configuring applications that incorporate the Recommendation.
    - _T3 Repeatable · all_: Conduct conformance testing for entropy source implementations within the framework of the Cryptographic Algorithm Validation Program (CAVP) and the Cryptographic Module Validation Program (CMVP).
    - _T3 Repeatable · all_: Provide an interface to obtain raw, digitized noise source data for validation testing or external health testing without harm to the entropy source, potentially restricted to test mode.
- **Governance**:
    - _T2 Risk-Informed · all_: Utilize only vetted conditioning components (keyed or unkeyed) as specified in the Recommendation for entropy source design to ensure compliance with approved algorithms.
- **Observability**:
    - _T3 Repeatable · all_: Implement a HealthTest interface that allows requests to the entropy source to conduct tests of its health, ensuring test execution is acceptable to FIPS 140 validation.
