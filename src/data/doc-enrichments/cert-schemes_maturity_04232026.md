---
generated: 2026-04-23
category: Certification Schemes
document_count: 3
requirement_count: 33
---

## CMVP-MGMT-MANUAL

- **Source**: CMVP Management Manual
- **URL**: https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/CMVPMM.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Maintain a publicly accessible list of validated cryptographic modules and modules in process to verify current validation status.
  - _T3 Repeatable · all_: Implement a formal process for handling flaw discovery and validation revocation to ensure only compliant modules remain on the validated list.
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document distinct roles and responsibilities for vendors, laboratories, validation authorities, and users within the cryptographic module validation program.
  - _T3 Repeatable · all_: Establish formal Request for Guidance (RFG) procedures requiring written submission with specific elements including applicable standards, assertions, and a clear resolution statement.
  - _T3 Repeatable · all_: Enforce a mandatory chain of communication where vendors under contract must route all test requirement questions through their contracted CST laboratory before contacting validation authorities.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Establish a formal process for requesting transition period extensions when cryptographic modules require additional time to meet new standards.
  - _T3 Repeatable · all_: Adhere to defined validation deadlines and re-validation processes for non-security relevant changes to maintain module status.
- **Observability**:
  - _T3 Repeatable · all_: Collect and report programmatic metrics regarding the CMVP and CAVP to monitor program performance and status.
  - _T3 Repeatable · all_: Retain collected metrics data and maintain audit trails for the CMVP and CAVP programmatic metrics.

## NIST-FIPS-140-3-IG-Sep-2025-PQC

- **Source**: FIPS 140-3 Implementation Guidance — September 2025 PQC update
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 14
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Identify embedded validated modules by name, certificate number, and version in the Security Policy and validation test report.
  - _T3 Repeatable · software_: Mark all references to embedded module functionality with [EVM] in Security Policy tables to distinguish IUT from EVM services.
  - _T3 Repeatable · software_: Ensure the embedded validated module (EVM) status is Active at the time of IUT submission to CMVP.
  - _T3 Repeatable · software_: Inherit the Historical validation status if the embedded validated module moves to the historical list for any reason.
  - _T3 Repeatable · software_: Only claim EVM services or algorithms as approved if they were approved at the time of IUT submission.
  - _T3 Repeatable · software_: Prohibit binding or embedding a FIPS 140-3 IUT to a FIPS 140-2 EVM.
  - _T3 Repeatable · software_: Verify that the operational environment of the embedded algorithm implementation is identical to or fully included in the module's tested environment.
  - _T3 Repeatable · software_: Ensure the embedded validated module is the same or higher security level as the IUT for all FIPS 140-3 sections except Mitigation of other attacks.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Re-validate algorithm implementations if the operational environment changes, such as moving from a 32-bit to a 64-bit platform.
  - _T3 Repeatable · software_: Re-validate algorithm implementations if the operating system changes from the one tested during CAVP validation.
  - _T3 Repeatable · software_: Re-validate algorithm implementations when porting HDL from one FPGA device to another new hardware implementation.
- **Observability**:
  - _T3 Repeatable · software_: Demonstrate in the Test Report how relied-upon FIPS requirements are met when an IUT depends on an EVM.
  - _T3 Repeatable · software_: Provide a mapping of HMI ports to physical I/O pins or internal test interfaces for sub-chip cryptographic subsystems.
  - _T3 Repeatable · software_: Verify and document vendor rationale for risks posed by intervening functional subsystems in single-chip embodiments.

## NIST-FIPS140-3-IG-PQC

- **Source**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Identify embedded validated modules by name, certificate number, and version in the Security Policy and validation test report.
  - _T3 Repeatable · software_: Mark all references to embedded module functionality with [EVM] in Security Policy tables to distinguish IUT from EVM services.
  - _T3 Repeatable · software_: Ensure the embedded validated module (EVM) status is Active at the time of IUT submission to CMVP.
  - _T3 Repeatable · software_: Inherit the Historical validation status if the embedded validated module moves to the historical list for any reason.
  - _T3 Repeatable · software_: Only claim EVM services or algorithms as approved if they were approved at the time of IUT submission.
  - _T3 Repeatable · software_: Verify that the operational environment of the embedded algorithm implementation matches the module's tested environment.
  - _T3 Repeatable · software_: Ensure the embedded validated module is the same or higher security level as the IUT for all FIPS 140-3 sections except Mitigation of other attacks.
- **Inventory**:
  - _T3 Repeatable · software_: Clearly distinguish IUT functionality from EVM functionality in the Security Policy and validation test report.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Re-validate algorithm implementations if the operational environment changes, such as moving from a 32-bit to a 64-bit platform.
  - _T3 Repeatable · software_: Re-validate algorithm implementations if the operating system changes from the one tested during CAVP validation.
