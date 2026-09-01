---
generated: 2026-08-31
category: Certification Schemes
document_count: 9
requirement_count: 42
---

## CMVP-MGMT-MANUAL
- **Source**: CMVP Management Manual
- **URL**: https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/CMVPMM.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Submit cryptographic modules for formal validation by accredited CST laboratories to obtain a validation certificate.
    - _T3 Repeatable · all_: Undergo re-validation for non-security relevant changes to maintain the validity of the cryptographic module certification.
    - _T3 Repeatable · all_: Adhere to the flaw discovery handling process to address security vulnerabilities in validated cryptographic modules.
    - _T3 Repeatable · all_: Accept validation revocation if the cryptographic module no longer meets the requirements or if flaws are not addressed.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document roles and responsibilities for vendors, CST laboratories, validation authorities, and users within the cryptographic module validation program.
    - _T2 Risk-Informed · all_: Establish formal agreements between validation authority organizations to manage the Cryptographic Module Validation Program.
    - _T2 Risk-Informed · all_: Maintain programmatic directives, policies, and internal guidance documentation to govern the CMVP operations.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Manage the validation submission queue and adhere to validation deadlines for initial and re-validation processes.
    - _T2 Risk-Informed · all_: Request transition period extensions when necessary to manage the lifecycle of cryptographic modules during standard updates.
- **Observability**:
    - _T3 Repeatable · all_: Monitor the official CMVP website for updates to the cryptographic module validation lists and certificate status.

## FIPS-140-3-STANDARD
- **Source**: FIPS 140-3 — Security Requirements for Cryptographic Modules
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Procure only cryptographic modules validated against FIPS 140-3 by CMVP; exclude modules on the Historical list from procurement decisions.
    - _T3 Repeatable · all_: Ensure cryptographic modules employ only Approved security functions as specified in FIPS, NIST SP 800-140C, or NIST SP 800-140D.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign a responsible authority within the agency to ensure the security of the system is sufficient and acceptable to the information owner.
    - _T2 Risk-Informed · all_: Ensure the operator acknowledges and accepts any residual risk associated with the cryptographic module's security provision.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Select the security level for validation based on the specific application environment and security services required.

## NIST-ACVP
- **Source**: NIST Automated Cryptographic Validation Protocol (ACVP)
- **URL**: https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Submit cryptographic algorithm implementations to NVLAP-accredited labs for ACVTS testing to obtain validation certificates.
    - _T3 Repeatable · libraries_: Ensure algorithm implementations pass ACVTS black-box testing to be listed on the Algorithm Validation Page.
    - _T3 Repeatable · libraries_: Complete cryptographic algorithm validation as a prerequisite for FIPS 140 module validation.
- **Governance**:
    - _T2 Risk-Informed · all_: Adhere to CAVP Management Manual responsibilities for vendors, labs, and validation authorities.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Maintain records of validated implementations including vendor, environment, and validation date via the validation list.

## NIST-SP-800-140A
- **Source**: NIST SP 800-140A — CMVP Documentation Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140A.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Provide vendor documentation fulfilling minimum requirements specified by the validation authority and management documentation for cryptographic modules undergoing independent verification.
    - _T3 Repeatable · all_: Verify that vendors provide documentation fulfilling minimum requirements specified by the validation authority and management documentation during independent testing.

## NIST-SP-800-140B
- **Source**: NIST SP 800-140B Rev. 1: CMVP Security Policy Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Br1.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Submit security policy with illustrative diagrams or photographs demonstrating module structure and cryptographic boundary.
- **Governance**:
    - _T3 Repeatable · all_: Define precise physical and cryptographic boundaries for the module, including TOEPP components and logical layers.
    - _T3 Repeatable · all_: Document Sensitive Security Parameter (SSP) management, including generation, storage, I/O methods, and strength.
- **Inventory**:
    - _T3 Repeatable · all_: Inventory all module versions in the security policy, ensuring each is represented separately or annotated for coverage.

## NIST-SP-800-140C
- **Source**: NIST SP 800-140C Rev. 2: CMVP-Approved Security Functions
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Cr2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Use only CMVP-approved security functions; preclude all others. Monitor the official CMVP web link for the current list of approved functions to ensure validation compliance.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain an inventory of cryptographic modules that strictly utilizes only those security functions listed as CMVP-approved, excluding any non-approved functions.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Establish a process to continuously monitor the CMVP website for updates to the list of approved security functions, as the list is maintained online rather than in static documents.

## NIST-SP-800-140D
- **Source**: NIST SP 800-140D Rev. 2 — CMVP-Approved Sensitive Security Parameter Generation and Establishment Methods
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Dr2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · keys_: Use only CMVP-approved methods for sensitive security parameter generation and establishment; preclude all other methods.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Update cryptographic implementations to align with the dynamic list of approved methods maintained on the CMVP website.
- **Observability**:
    - _T3 Repeatable · keys_: Monitor the CMVP website for the current list of approved sensitive security parameter generation and establishment methods.

## NIST-SP-800-140E
- **Source**: NIST SP 800-140E — CMVP Approved Authentication Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140E.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Mandate that testers review and affirm vendor documentation regarding authentication mechanisms and their compliance with SP 800-63B normative sections.
    - _T3 Repeatable · all_: Validate that authentication mechanisms meet the cryptographic strength requirements of SP 800-140C and SP 800-140D when used for module-provided protected communication services.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document authentication mechanisms per FIPS 140-3 security levels, ensuring operator authentication is performed by the module or Operating Environment for levels above 1.
    - _T2 Risk-Informed · all_: Establish policy requiring vendors to use SP 800-63B as a framework for authentication and provide justification for any deviations from its requirements.

## NIST-SP-800-90B
- **Source**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/b/final
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Validate entropy sources using NIST SP 800-90B specified tests and estimation methods to determine min-entropy before deployment in RBGs.
    - _T3 Repeatable · all_: Perform initial entropy estimation and restart tests as part of the validation process to establish the min-entropy floor for the noise source.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign responsibility for entropy source validation and health test configuration to entities implementing or configuring applications incorporating this Recommendation.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Document the validation track (IID vs. non-IID) and the specific entropy estimation methods used for each entropy source in the system inventory.
- **Observability**:
    - _T3 Repeatable · all_: Implement continuous health tests (Repetition Count or Adaptive Proportion) on the entropy source to detect failures in real-time.
    - _T3 Repeatable · all_: Define and implement a failure response mechanism for health tests, such as halting output or replacing the entropy source, upon test failure.
