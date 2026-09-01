---
generated: 2026-08-31
category: Certification Schemes
document_count: 5
requirement_count: 24
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
