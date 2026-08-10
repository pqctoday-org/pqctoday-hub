---
generated: 2026-08-09
category: Certification Schemes
document_count: 18
requirement_count: 119
---

## CC-2022-CEM
- **Source**: Common Evaluation Methodology (CEM) 2022 R1
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CEM2022R1.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Execute formal evaluation sub-activities against defined criteria to generate verifiable evidence and verdicts for the Target of Evaluation (TOE).
    - _T3 Repeatable · all_: Manage evaluation evidence and outputs through structured sub-tasks to ensure the integrity and traceability of the evaluation results.
    - _T3 Repeatable · all_: Perform independent testing and functional tests to verify that the TOE behaves as specified in the Security Target and Protection Profile.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document the responsibilities of evaluation roles (sponsor, developer, evaluator, certifier) to establish clear ownership and accountability for the evaluation process.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Implement configuration management capabilities to control changes to the TOE and its development artifacts throughout the evaluation lifecycle.
    - _T3 Repeatable · all_: Establish processes for flaw remediation to address vulnerabilities discovered during or after the evaluation process.
- **Observability**:
    - _T3 Repeatable · all_: Conduct vulnerability analysis to detect and assess security weaknesses in the TOE, ensuring visibility into potential policy drift or implementation flaws.

## CC-2022-PART1
- **Source**: Common Criteria 2022 Part 1 — Introduction and General Model (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART1R1.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Conduct independent security evaluations of IT products against defined Security Functional Requirements and Assurance Requirements.
    - _T3 Repeatable · all_: Ensure evaluation schemes make provision for independent assessment of cryptographic algorithm mathematical properties if required.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish administrative and legal frameworks for evaluation authorities to apply CC criteria and manage accreditation processes.
    - _T2 Risk-Informed · all_: Define organizational security policies (OSPs) as part of the Security Problem Definition to guide security objectives and requirements.
- **Inventory**:
    - _T2 Risk-Informed · all_: Define the Target of Evaluation (TOE) boundaries and operational environment to clearly scope the security evaluation.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Use evaluation results as input to the accreditation process for granting authority to operate IT products in their operational environment.

## CC-2022-PART3
- **Source**: Common Criteria 2022 Part 3 — Security Assurance Components (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART3R1.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Maintain a Configuration Management system that uniquely identifies and controls all TOE implementation representations to ensure traceability and integrity during evaluation.
    - _T3 Repeatable · all_: Implement systematic flaw remediation procedures that include tracking, analysis, and resolution of security vulnerabilities identified during development or operation.
    - _T3 Repeatable · all_: Provide complete functional specifications and architectural designs that map security functions to implementation details for independent verification.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish documented security problem definitions and objectives for the operational environment to guide the security requirements of the cryptographic module.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Define and enforce a measurable development life-cycle model with documented processes for TOE creation, modification, and delivery to ensure consistent quality.
- **Observability**:
    - _T3 Repeatable · all_: Implement operational user guidance and preparative procedures that enable administrators to configure and monitor the TOE securely in the operational environment.

## CMVP-MGMT-MANUAL
- **Source**: CMVP Management Manual
- **URL**: https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/CMVPMM.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Engage independent, NVLAP-accredited CST laboratories to perform conformance testing against FIPS 140-2 requirements for cryptographic modules.
    - _T3 Repeatable · all_: Provide vendor evidence (VE) and test evidence (TE) to demonstrate conformance to FIPS 140-2 assertions as defined in the Derived Test Requirements.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document roles and responsibilities for vendors, CST laboratories, and validation authorities within the cryptographic module validation program.
    - _T2 Risk-Informed · all_: Establish formal points of contact for NIST and CCCS to manage inquiries and guidance requests regarding the CMVP.
    - _T3 Repeatable · all_: Submit official Requests for Guidance (RFG) in a standardized format including proprietary status, applicable assertions, and suggested resolutions for binding policy interpretation.
    - _T3 Repeatable · all_: Maintain confidentiality of proprietary information exchanged between NIST, CCCS, and CST laboratories through non-disclosure agreements and ethical codes.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Adhere to the validation submission queue processing procedures, including initial validation, non-security relevant re-validation, and handling of HOLD statuses.
    - _T3 Repeatable · all_: Comply with the flaw discovery handling process and validation revocation procedures when security issues are identified in validated modules.
- **Observability**:
    - _T3 Repeatable · all_: Monitor the official CMVP website for validation lists, modules in process, and implementation under test to track the status of cryptographic modules.
    - _T3 Repeatable · all_: Collect and report programmatic metrics to the CMVP using the METRIX Collection Tool to ensure auditability and transparency of the validation process.

## EUCC v2.0 ACM
- **Source**: EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0
- **URL**: https://certification.enisa.europa.eu/document/download/f4657490-9757-4a97-8deb-fd4d6a1358ee_en?filename=EUCC_guidelines_Agreed+Cryptographic+Mechanisms+v2.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Verify that Protection Profiles and ICT products rely on agreed cryptographic mechanisms (ACM v2) during the evaluation process to provide required security services.
- **Governance**:
    - _T2 Risk-Informed · all_: Define cryptographic mechanisms in Protection Profiles and ICT products based on ECCG Agreed Cryptographic Mechanisms v2 to ensure compliance with EUCC certification requirements.

## FIPS-140-3-STANDARD
- **Source**: FIPS 140-3 — Security Requirements for Cryptographic Modules
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Procure only cryptographic modules validated against FIPS 140-3 by the CMVP; exclude modules on the Historical list from procurement decisions.
    - _T3 Repeatable · all_: Ensure cryptographic modules employ only Approved security functions as specified in FIPS, NIST SP 800-140C, or NIST SP 800-140D.
    - _T3 Repeatable · all_: Utilize independent, NVLAP-accredited Cryptographic and Security Testing (CST) laboratories for module compliance testing.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign a responsible authority within the agency to ensure the security of the system is sufficient and acceptable to the information owner.
    - _T2 Risk-Informed · all_: Acknowledge and accept any residual risk associated with the cryptographic module's security posture.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Select the security level of the cryptographic module based on the specific security requirements of the application and environment.

## NIAP-CCEVS-MANUAL
- **Source**: NIAP CCEVS Quality Manual (Scheme Publication #2)
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/scheme-pub-2.pdf
- **Requirement count**: 12
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Conduct scheduled internal audits of quality system functions to verify compliance with procedures and document findings for corrective action.
    - _T3 Repeatable · all_: Perform annual management reviews of the quality system, policy, and infrastructure, documenting minutes and retaining records for five years.
    - _T3 Repeatable · all_: Monitor the use of issued certificates and revoke them or pursue legal action if privileges are abused or integrity is compromised.
- **Governance**:
    - _T3 Repeatable · all_: Establish and enforce documented policies and procedures for scheme operations, ensuring adherence by all personnel and contractors as a condition of engagement.
    - _T3 Repeatable · all_: Define and assign specific roles and responsibilities for scheme management, including Director, Quality Manager, and Technical Oversight, with clear authority lines.
    - _T3 Repeatable · all_: Implement a formal Quality Policy endorsed by upper management to ensure impartiality, objectivity, and integrity in all validation activities.
    - _T3 Repeatable · all_: Maintain a Records Management Policy requiring accurate, traceable, and timely documentation of all evaluation and validation activities.
    - _T3 Repeatable · all_: Enforce confidentiality policies requiring all personnel and contractors to sign non-disclosure agreements protecting proprietary information.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Establish procedures for the issuance, maintenance, and withdrawal of CC certificates, including monitoring for compliance.
    - _T3 Repeatable · all_: Manage the accreditation and approval lifecycle of Common Criteria Testing Laboratories (CCTLs), including renewal and withdrawal.
- **Observability**:
    - _T3 Repeatable · all_: Maintain a public Product Compliant List (PCL) of all validated products, including Security Targets and validation reports, for transparency.
    - _T3 Repeatable · all_: Notify the community of any changes to the Approved CCTLs List, including additions, withdrawals, or scope modifications.

## NIAP-CCEVS-POLICY
- **Source**: NIAP CCEVS Policy Letter 26
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/policy-ltr-26.pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Establish policy to refuse evaluation and certification of products prohibited from use on National Security Systems by statute, executive order, or directive.
    - _T2 Risk-Informed · all_: Define authority for NIAP to refuse evaluation of products subject to acquisition prohibitions for National Security Systems.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Mandate vendor consultation with NIAP prior to contracting with a lab if the product may be affected by supply chain acquisition limitations.

## NIST-ACVP
- **Source**: NIST Automated Cryptographic Validation Protocol (ACVP)
- **URL**: https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Submit cryptographic algorithm implementations to NVLAP-accredited labs for ACVTS testing to obtain validation certificates listed on the Algorithm Validation Page.
    - _T3 Repeatable · libraries_: Ensure algorithm implementations successfully complete the cryptographic algorithm validation process to be listed as Approved security functions on FIPS 140 module validation certificates.
- **Governance**:
    - _T2 Risk-Informed · all_: Adhere to management activities and specific responsibilities outlined in the CAVP Management Manual for vendors, labs, and validation authorities.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Maintain records of validated implementations including vendor, implementation details, operational environment, validation date, and algorithm specifics via the validation list.

## NIST-FIPS-140-3-IG-Sep-2025-PQC
- **Source**: Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 20
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Ensure the Existing Validated Module (EVM) status is Active at the time of IUT submission to CMVP; if EVM becomes historical during validation, the IUT becomes historical upon completion.
    - _T3 Repeatable · all_: The Implementation Under Test (IUT) must inherit the Historical validation status if the Embedded Validated Module (EVM) moves to the historical list for any reason, such as sunset or algorithm transition.
    - _T3 Repeatable · all_: For bound modules, the EVM must be the same or higher security level as the IUT for all FIPS 140-3 sections, except Mitigation of Other Attacks, to ensure claimed security assurances.
    - _T3 Repeatable · all_: A FIPS 140-3 Implementation Under Test (IUT) cannot embed or bind to a FIPS 140-2 Existing Validated Module (EVM).
    - _T3 Repeatable · all_: The IUT submission must precisely identify the EVM by name, CMVP certificate number, and version(s), with clear distinctions between IUT and EVM functionality in the Security Policy and Test Report.
    - _T3 Repeatable · all_: Mark all references to EVM functionality in WebCyptik tables (e.g., Algorithms, Roles, SSPs, Self-Tests) with “[EVM]” to distinguish from IUT-native capabilities.
    - _T3 Repeatable · all_: If the IUT relies on the EVM to meet FIPS 140-3 requirements, the Test Report must demonstrate how the requirement is met without non-compliance to other requirements, considering disjoint boundaries.
    - _T3 Repeatable · all_: For software/firmware/hybrid modules, the IUT and EVM must operate on the same tested operational environments, or one must be within the other's.
    - _T3 Repeatable · all_: The IUT shall only use EVM services or algorithms that are approved at the time of the IUT submission to the CMVP, even if the EVM implements transitioned algorithms.
    - _T3 Repeatable · all_: For embedded modules where the EVM is a lower security level, the vendor must demonstrate the EVM meets the higher level requirements or the IUT meets them on behalf of the EVM.
    - _T3 Repeatable · all_: Any new validation submission of a module obtaining entropy from a previously-validated embedded module shall comply with SP 800-90B.
    - _T3 Repeatable · all_: The operational environment for a validated cryptographic algorithm implementation embedded in a module must be identical to or fully included in the module's tested operational environment.
    - _T3 Repeatable · all_: If an algorithm implementation is tested on one OS, it cannot be claimed to run on another OS for module testing; it must be tested on every claimed environment.
    - _T3 Repeatable · all_: If an algorithm implementation is tested on an X-bit processor, it cannot be claimed to run on different bit size processors without re-testing on the new platform.
    - _T3 Repeatable · all_: The CST Lab is responsible for verifying that vector set test results were generated using the specified operating environment supplied by the vendor.
    - _T3 Repeatable · all_: For sub-chip cryptographic subsystems, the physical boundary shall be defined as the single-chip physical boundary, and ISO/IEC 19790:2012 Section 7.7 requirements shall apply.
    - _T3 Repeatable · all_: Externally loaded firmware into a sub-chip cryptographic subsystem shall meet the Software/Firmware Load Test requirements of ISO/IEC 19790:2012 Section 7.10.3.4.
    - _T3 Repeatable · all_: Firmware stored and loaded inside the sub-chip cryptographic subsystem (except externally loaded) shall meet the pre-operational software/firmware integrity test requirements.
    - _T3 Repeatable · all_: The tester shall demonstrate that HMI ports are accessible and provably unmodifiable, with data, control, and status inputs/outputs under test program control.
    - _T3 Repeatable · all_: The tester shall verify and provide the vendor’s rationale in the validation report explaining existing risks and mitigations regarding intervening functional subsystems.

## NIST-FIPS140-3-IG-PQC
- **Source**: Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Ensure embedded modules (EVMs) are Active at submission; IUT inherits Historical status if EVM becomes Historical.
    - _T3 Repeatable · all_: Prohibit binding or embedding FIPS 140-2 modules within FIPS 140-3 modules.
    - _T3 Repeatable · all_: Mark Security Policy tables with [EVM] to distinguish IUT functionality from Embedded Validated Module services.
    - _T3 Repeatable · all_: Ensure bound EVM security level is same or higher than IUT, except for Mitigation of Other Attacks.
    - _T3 Repeatable · all_: Verify algorithm implementation operational environment matches CAVP test environment exactly.
    - _T3 Repeatable · all_: Re-test algorithm implementations if ported to different processor bit sizes or operating systems.
    - _T3 Repeatable · all_: Comply with SP 800-90B for entropy obtained from previously-validated embedded modules.
- **Inventory**:
    - _T3 Repeatable · all_: Precisely identify EVM by name, certificate number, and version in IUT submission documentation.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Re-validate algorithm implementations when reusing HDL on new FPGA hardware.
- **Observability**:
    - _T3 Repeatable · all_: Demonstrate HMI ports are provably unmodifiable and under test program control in sub-chip subsystems.

## NIST-SP-800-140A
- **Source**: NIST SP 800-140A — CMVP Documentation Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140A.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Provide vendor documentation fulfilling minimum requirements specified by the validation authority and management documentation for cryptographic modules undergoing independent verification.
    - _T3 Repeatable · all_: Verify that vendors provide documentation meeting minimum validation authority and management documentation requirements for cryptographic modules.

## NIST-SP-800-140B
- **Source**: NIST SP 800-140B Rev. 1: CMVP Security Policy Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Br1.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Document entropy sources and Random Bit Generator (RBG) types, distinguishing between approved and non-approved generators.
    - _T3 Repeatable · libraries_: Validate cryptographic algorithms against CAVP standards and link module validation to specific CAVP certificate numbers.
- **Governance**:
    - _T3 Repeatable · all_: Adhere to the CMVP-mandated security policy structure and evidence submission format for validation.
- **Inventory**:
    - _T3 Repeatable · keys_: Maintain a detailed registry of Sensitive Security Parameters (SSPs) including type, strength, generation method, and storage technique.
    - _T3 Repeatable · libraries_: Maintain a structured inventory of all vendor-affirmed security methods and algorithms, distinguishing approved from non-approved functions.
    - _T3 Repeatable · software_: Document the precise cryptographic boundary and Tested Operational Environment’s Physical Perimeter (TOEPP) for software/firmware modules.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Document procedural zeroization methods for Sensitive Security Parameters under operator control.
- **Observability**:
    - _T3 Repeatable · all_: Define and document the behavior of Environmental Failure Protection (EFP) and Environmental Failure Testing (EFT) regarding shutdown or zeroization.

## NIST-SP-800-140C
- **Source**: NIST SP 800-140C Rev. 2: CMVP-Approved Security Functions
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Cr2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Use only CMVP-approved security functions; preclude all others. Monitor the official CMVP web link for the current list of approved functions to ensure validation compliance.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain an inventory of cryptographic modules that strictly utilizes only those security functions listed as CMVP-approved, excluding any non-approved functions.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Establish a process to continuously monitor the CMVP website for updates to the list of approved security functions, as the document itself is superseded by the web link for future modifications.

## NIST-SP-800-140D
- **Source**: NIST SP 800-140D Rev. 2 — CMVP-Approved Sensitive Security Parameter Generation and Establishment Methods
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Dr2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Use only CMVP-approved sensitive security parameter generation and establishment methods; preclude all other methods.
- **Inventory**:
    - _T3 Repeatable · all_: Maintain an inventory of approved methods by referencing the current CMVP web list, which supersedes static document annexes.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Monitor the CMVP website for updates to approved methods, as future modifications will be made there to minimize publication revisions.

## NIST-SP-800-140E
- **Source**: NIST SP 800-140E — CMVP Approved Authentication Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140E.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Testers must review and affirm vendor documentation regarding authentication mechanism compliance and justifications.
    - _T3 Repeatable · all_: Validate that operator authentication acceptance is performed by the module or Operating Environment for FIPS 140-3 Levels 2-4.
    - _T3 Repeatable · all_: Ensure authentication mechanisms for protected communication services meet cryptographic strength requirements of SP 800-140C and SP 800-140D.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document justification for authentication mechanisms when SP 800-63B requirements cannot be met.

## NIST-SP-800-90B
- **Source**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/b/final
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Submit entropy sources to NVLAP-accredited labs for validation against SP 800-90B requirements, followed by CAVP/CMVP review, to obtain formal assurance of entropy rates.
    - _T3 Repeatable · all_: Collect and submit a sequential dataset of at least 1,000,000 raw noise source samples for validation testing to estimate min-entropy.
    - _T3 Repeatable · all_: Provide a conditioned sequential dataset of at least 1,000,000 outputs if using a non-listed conditioning component, for validation testing.
    - _T3 Repeatable · all_: Perform 1,000 restarts of the entropy source, collecting 1,000 samples per restart, to validate entropy consistency across restarts.
    - _T3 Repeatable · all_: Submit an initial entropy estimate based on design analysis and provide rationale for any Independent and Identically Distributed (IID) claims.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Design entropy sources to allow data collection from the noise source for validation or external health testing without harming the source.
- **Observability**:
    - _T3 Repeatable · all_: Implement health tests as an integral part of the entropy source design to detect failure modes and ensure continued expected operation.
    - _T3 Repeatable · all_: Implement continuous health tests on the noise source to detect failures quickly and with high probability during operation.

## NIST-SP-800-90C
- **Source**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/c/final
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Validate RBG constructions against SP 800-90C via CMVP/CAVP to prove compliance with specified security strengths and operational tests.
    - _T3 Repeatable · libraries_: Ensure entropy sources used in RBG constructions are validated for compliance with SP 800-90B to guarantee sufficient min-entropy.
- **Governance**:
    - _T2 Risk-Informed · all_: Adopt SP 800-90C requirements for RBG design and implementation, distinguishing between testable 'shall' requirements and administrative 'must' requirements.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Manage RBG instantiation and reseeding lifecycles using validated randomness sources (SP 800-90B/90C compliant) to maintain security strength.
- **Observability**:
    - _T3 Repeatable · libraries_: Implement health tests for entropy sources and non-entropy components; halt output and trigger failure handling upon test failure.
