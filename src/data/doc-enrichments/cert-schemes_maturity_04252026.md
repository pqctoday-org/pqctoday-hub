---
generated: 2026-04-25
category: Certification Schemes
document_count: 23
requirement_count: 196
---

## ANSSI PQC Position Paper

- **Source**: ANSSI Views on Post-Quantum Cryptography Transition
- **URL**: https://cyber.gouv.fr/sites/default/files/2022/04/anssi-avis-migration-vers-la-cryptographie-post-quantique.pdf
- **Requirement count**: 11
- **Governance**:
  - _T2 Risk-Informed · all_: Define a progressive transition strategy for cryptographic products to adopt quantum-resistant cryptography.
  - _T2 Risk-Informed · all_: Include the quantum threat in risk analysis and consider quantum protection measures for relevant cryptographic products.
  - _T2 Risk-Informed · all_: Mandate hybridation for products requiring post-quantum protection, except for specific hash-based signatures.
  - _T2 Risk-Informed · all_: Dimension symmetric primitives to ensure post-quantum security, targeting at least AES-256 and SHA2-384 levels.
  - _T2 Risk-Informed · all_: Avoid modifying normalized parameters for post-quantum algorithms like CRYSTALS-Kyber, Dilithium, Falcon, XMSS, and SPHINCS+.
  - _T2 Risk-Informed · all_: Use the highest possible NIST security level, preferably Level 5 or Level 3, for post-quantum algorithms.
  - _T2 Risk-Informed · all_: Protect the internal state of stateful signature algorithms like XMSS and LMS against integrity attacks and replay attacks.
  - _T2 Risk-Informed · all_: Ensure pre-shared keys used in hybridation are shared only between two parties and maintain their confidentiality and integrity.
  - _T2 Risk-Informed · all_: Use well-studied standards or modes with validated security proofs for cryptographic functions and hybridation.
  - _T2 Risk-Informed · all_: Require hybridation implementation for final products with post-quantum protection, unless using specific hash-based signatures.
  - _T2 Risk-Informed · all_: Include user guides recommending exclusive use of post-quantum algorithms in combination with classical algorithms for platform products.

## BSI TR-02102-2

- **Source**: Cryptographic Mechanisms: Recommendations for TLS
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-2.pdf
- **Requirement count**: 16
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Validate random number generators against BSI AIS 20/31 classes DRG.3, DRG.4, DRT.1, PTG.3, or NTG.1.
- **Inventory**:
  - _T3 Repeatable · software_: Inventory and restrict TLS cipher suites to those listed in the BSI recommendations with Perfect Forward Secrecy.
  - _T3 Repeatable · software_: Inventory and restrict Diffie-Hellman groups to approved named curves to avoid weak domain parameters.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Ensure ephemeral keys are deleted irrevocably after use and never stored persistently.
  - _T3 Repeatable · keys_: Store private cryptographic keys in certified hardware such as HSMs or chip cards.
  - _T3 Repeatable · software_: Enforce TLS 1.3 as the preferred protocol version and disable TLS 1.0 and TLS 1.1 immediately.
  - _T3 Repeatable · software_: Retire TLS 1.2 support by the end of 2031 due to lack of quantum-safe key agreement mechanisms.
  - _T3 Repeatable · software_: Discontinue DSA and DHE cipher suite recommendations by the end of 2029.
  - _T3 Repeatable · software_: Migrate away from RSA signatures with PKCS #1 v1.5 padding by the end of 2025.
  - _T3 Repeatable · software_: Disable the Heartbeat extension to prevent memory disclosure vulnerabilities.
  - _T3 Repeatable · software_: Implement the Encrypt-then-MAC extension for all CBC-mode cipher suites to prevent padding oracle attacks.
  - _T3 Repeatable · software_: Implement the Extended Master Secret extension to mitigate triple handshake attacks.
  - _T3 Repeatable · software_: Disable TLS data compression to prevent CRIME side-channel attacks.
  - _T3 Repeatable · software_: Reject client-initiated session renegotiation to prevent downgrade attacks.
  - _T3 Repeatable · software_: Avoid using 0-RTT data in TLS 1.3 PSK handshakes due to lack of replay protection.
  - _T3 Repeatable · software_: Plan migration to quantum-safe hybrid key agreement mechanisms by the end of 2031.

## BSI TR-02102-3

- **Source**: Cryptographic Mechanisms: Recommendations for IPsec
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-3.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Use random number generators from approved classes DRG.3, DRG.4, DRT.1, PTG.3, or NTG.1.
  - _T3 Repeatable · software_: Store private cryptographic keys in certified hardware such as chip cards or HSMs.
  - _T3 Repeatable · software_: Protect Security Association Database and Security Policy Database from manipulation.
  - _T3 Repeatable · software_: Identify and mitigate side-channel and fault attack vulnerabilities through expert involvement.
- **Governance**:
  - _T2 Risk-Informed · all_: Define security policies specifying SA lifetimes and data volume limits for renegotiation.
  - _T2 Risk-Informed · all_: Define security requirements for SA lifetimes based on application needs.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Renegotiate IKE-SAs and IPsec-SAs upon expiration of defined time or data volume limits.
  - _T3 Repeatable · all_: Limit IKE-SA lifetime to 24 hours and IPsec-SA lifetime to 4 hours in standard scenarios.
  - _T3 Repeatable · keys_: Irrevocably delete ephemeral keys immediately after use and prevent persistent storage.
  - _T3 Repeatable · keys_: Delete nonces and long-term keys immediately after single use in signature generation.
  - _T3 Repeatable · software_: Migrate from sole classical key agreement mechanisms to hybrid quantum-safe mechanisms by end of 2031.

## BSI TR-02102-4

- **Source**: Cryptographic Mechanisms: Recommendations for SSH
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-4.pdf
- **Requirement count**: 9
- **Governance**:
  - _T2 Risk-Informed · all_: Establish documented policy mandating SSH-2 usage and prohibiting SSH-1 due to cryptographic vulnerabilities.
  - _T2 Risk-Informed · keys_: Mandate secure storage of private keys using certified hardware to prevent copying, misuse, and manipulation.
  - _T2 Risk-Informed · keys_: Enforce policy requiring irrevocable deletion of ephemeral keys after use and prohibit persistent storage.
  - _T2 Risk-Informed · software_: Define policy to prioritize recommended strong algorithms over weak or obsolete algorithms specified in SSH standards.
  - _T2 Risk-Informed · software_: Require use of random number generators from approved classes (DRG.3, DRG.4, DRT.1, PTG.3, or NTG.1) for key generation.
- **Inventory**:
  - _T2 Risk-Informed · software_: Maintain inventory of supported key exchange methods and enforce usage limits based on defined end-of-life years.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · software_: Implement key re-exchange policy to renew session keys after one hour or one gigabyte of data transmitted.
  - _T2 Risk-Informed · software_: Plan migration to quantum-safe mechanisms by end of 2031 as sole use of classical key agreement is no longer recommended.
  - _T2 Risk-Informed · software_: Discontinue use of DSA signature algorithms by end of 2029.

## BSI-BSZ-METHOD

- **Source**: BSI BSZ — Accelerated Security Certification Evaluation Process (v2.1)
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/BSZ/BSZ-Evaluation.pdf?__blob=publicationFile&v=5
- **Requirement count**: 20
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Conduct evaluations including compliance and penetration tests and document the results in the Evaluation Technical Report.
  - _T3 Repeatable · all_: Create and submit the Evaluation Technical Report to the certification body and update it following comments.
  - _T3 Repeatable · all_: Sign the approved Evaluation Technical Report and submit it to the certification body.
- **Governance**:
  - _T3 Repeatable · all_: Ensure the ITSEF complies with process-specific requirements and provides information on ongoing evaluation procedures to the certification body.
  - _T3 Repeatable · all_: Immediately notify the certification body of any delays in scheduled procedures to allow for schedule adjustment.
  - _T3 Repeatable · all_: Ensure the ITSEF is responsible for the technical correctness and truthful documentation of evaluation results.
  - _T3 Repeatable · all_: Implement adequate security measures to protect the TOE and confidential information when using test equipment outside ITSEF premises.
  - _T3 Repeatable · all_: Identify updates or additions to the Evaluation Technical Report using change markers and provide both marked and clean versions.
  - _T3 Repeatable · all_: Include names and perceived roles of all individuals involved in the preparation of the Evaluation Technical Report.
  - _T3 Repeatable · all_: Sign the final Evaluation Technical Report with specific wording by the project manager and the Quality Management Officer.
  - _T3 Repeatable · all_: Encrypt all transmitted documents with the corresponding procedure key when exchanging documents electronically.
  - _T3 Repeatable · all_: Ensure processes within the ITSEF enable adequate information exchange between participants and access to relevant manufacturer information.
  - _T3 Repeatable · all_: Enable the certification body to monitor individual evaluation steps on the ITSEF premises where necessary.
  - _T3 Repeatable · all_: Take fundamental technical decisions made by the certification body into account independently in future procedures.
  - _T3 Repeatable · all_: Observe specific requirements for evaluators working from their home office as defined in the AH-Evaluatoren document.
  - _T3 Repeatable · all_: Notify the certification body of any substantial findings regarding security risks or deviations that would prevent certification.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Archive all evidence relevant to the evaluation and the evaluated product for the period of validity of the certificate plus three years.
  - _T3 Repeatable · all_: Archive the evaluation object after completion of the evaluation in accordance with BSI certification body specifications.
  - _T3 Repeatable · all_: Assess Impact Analysis Reports for re-evaluations or recertifications to determine evaluation effort.
- **Observability**:
  - _T3 Repeatable · all_: Provide brief status reports regarding compliance with the agreed schedule to the applicant.

## CC-2022-CEM

- **Source**: Common Evaluation Methodology (CEM) 2022 R1
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CEM2022R1.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Conduct rigorous evaluation of security architecture, functional specifications, and implementation representations to verify conformance with defined security requirements.
  - _T3 Repeatable · all_: Perform comprehensive vulnerability analysis and independent testing to confirm the absence of exploitable weaknesses in the Target of Evaluation.
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document the responsibilities of evaluation roles including sponsors, evaluators, and certifiers to ensure clear ownership of the security evaluation process.
  - _T3 Repeatable · all_: Establish and enforce a formal evaluation process with defined objectives, inputs, sub-activities, and outputs to ensure repeatable security assessments.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Implement formal configuration management capabilities and flaw remediation procedures to manage changes and updates throughout the product lifecycle.
  - _T3 Repeatable · all_: Define and document the life-cycle stages, delivery procedures, and development security measures to ensure consistent product evolution and secure distribution.
- **Observability**:
  - _T3 Repeatable · all_: Execute functional and depth testing to verify expected behavior and detect deviations in the Target of Evaluation's security functions.

## CC-2022-PART2

- **Source**: Common Criteria 2022 Part 2 — Security Functional Components (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART2R1.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
  - _T3 Repeatable · keys_: Enforce documented procedures for cryptographic key generation, distribution, access, and destruction to ensure lifecycle integrity.
  - _T3 Repeatable · software_: Implement and validate random bit generation services with defined seeding mechanisms and health monitoring capabilities.
- **Governance**:
  - _T2 Risk-Informed · all_: Define and manage policies for the selection and review of audit events to ensure comprehensive coverage of security activities.
- **Observability**:
  - _T3 Repeatable · all_: Generate audit records for all security-relevant events including cryptographic operations and key management activities.
  - _T3 Repeatable · all_: Analyze audit data to detect potential violations and anomalies in cryptographic usage patterns.
  - _T3 Repeatable · all_: Ensure audit data is stored in a protected location with guarantees of availability and actions defined for potential data loss.

## CC-2022-PART3

- **Source**: Common Criteria 2022 Part 3 — Security Assurance Components (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART3R1.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Define measurable life-cycle models for security evaluation to ensure repeatable assurance processes.
  - _T3 Repeatable · all_: Implement systematic flaw remediation procedures to address identified security vulnerabilities.
  - _T3 Repeatable · all_: Establish conformance claims to validate that the TOE meets specified security requirements.
- **Governance**:
  - _T2 Risk-Informed · all_: Document security objectives for the operational environment to define ownership and policy scope.
  - _T2 Risk-Informed · all_: Define developer-defined life-cycle processes to establish documented policy for development activities.
- **Inventory**:
  - _T3 Repeatable · all_: Ensure configuration management coverage extends to all parts of the TOE to maintain a complete inventory.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Utilize a configuration management system to control changes to the TOE throughout its lifecycle.
  - _T3 Repeatable · all_: Define and enforce delivery procedures to ensure the integrity of the TOE during distribution.
  - _T3 Repeatable · all_: Maintain coverage of problem tracking within the configuration management system to manage defects.
- **Observability**:
  - _T3 Repeatable · all_: Implement flaw reporting procedures to detect and track security issues within the TOE.

## CMVP-MGMT-MANUAL

- **Source**: CMVP Management Manual
- **URL**: https://csrc.nist.gov/CSRC/media/Projects/cryptographic-module-validation-program/documents/CMVPMM.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Engage only NVLAP accredited Cryptographic and Security Testing (CST) laboratories to perform conformance testing for module validation.
  - _T3 Repeatable · all_: Submit validation reports and evidence for review and approval by the CMVP Validation Authorities to obtain a validation certificate.
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document roles and responsibilities for vendors, laboratories, and validation authorities within the CMVP framework.
  - _T2 Risk-Informed · all_: Establish formal channels for requesting official guidance on FIPS 140-2 test requirements and policy interpretations.
  - _T2 Risk-Informed · all_: Maintain confidentiality agreements and non-disclosure protocols for proprietary information exchanged between NIST, CCCS, and CST laboratories.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Adhere to validation deadlines and manage the status of modules in process, including handling HOLD statuses.
  - _T3 Repeatable · all_: Follow established processes for validation revocation and flaw discovery handling to maintain module integrity.
- **Observability**:
  - _T3 Repeatable · all_: Monitor the official CMVP website for updates to validation lists, notices, and programmatic policy changes.
  - _T3 Repeatable · all_: Collect and report programmatic metrics regarding validation activities using the METRIX Collection Tool.

## EUCC v2.0 ACM

- **Source**: EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0
- **URL**: https://certification.enisa.europa.eu/document/download/f4657490-9757-4a97-8deb-fd4d6a1358ee_en?filename=EUCC_guidelines_Agreed+Cryptographic+Mechanisms+v2.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
  - _T2 Risk-Informed · all_: Developers must consider using agreed cryptographic mechanisms defined in ACM v2 for ICT products submitted to EUCC certification.
  - _T2 Risk-Informed · all_: Evaluators must verify that protection profiles and ICT products preferably rely on agreed cryptographic mechanisms defined in ACM v2.

## FIPS-140-3-STANDARD

- **Source**: FIPS 140-3 — Security Requirements for Cryptographic Modules
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Utilize independent, accredited Cryptographic and Security Testing (CST) laboratories to validate cryptographic modules against FIPS 140-3.
  - _T3 Repeatable · all_: Employ only approved security functions, including algorithms and key management techniques, specified in FIPS or referenced NIST Special Publications.
  - _T3 Repeatable · all_: Submit test reports demonstrating compliance to the CMVP for review and validation prior to deployment.
- **Governance**:
  - _T2 Risk-Informed · all_: Establish documented security policies defining roles, services, and authentication for cryptographic modules as required by the standard.
  - _T2 Risk-Informed · all_: Ensure the responsible authority in each agency verifies that the security provided by a module is sufficient and acceptable to the information owner.
  - _T2 Risk-Informed · all_: Acknowledge and accept any residual risk associated with the cryptographic module's security posture.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Develop acquisition plans for FIPS 140-3 compliant products and avoid using the CMVP Historical list for procurement decisions.
  - _T2 Risk-Informed · all_: Review the standard at least every five years to consider necessary updates or replacement due to technological changes.

## NIAP-CCEVS-MANUAL

- **Source**: NIAP CCEVS Quality Manual (Scheme Publication #2)
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/scheme-pub-2.pdf
- **Requirement count**: 12
- **Governance**:
  - _T3 Repeatable · all_: Establish and enforce documented policies and procedures for scheme operations, ensuring adherence by all personnel and contractors.
  - _T3 Repeatable · all_: Define and document specific roles and responsibilities for NIAP management, including Director, Quality Manager, and Technical Oversight Team.
  - _T3 Repeatable · all_: Implement a formal Quality Policy endorsed by upper-level management to ensure impartiality, objectivity, and integrity in all activities.
  - _T3 Repeatable · all_: Enforce confidentiality policies requiring all personnel and contractors to sign non-disclosure agreements protecting proprietary information.
  - _T3 Repeatable · all_: Maintain a formal Records Management Policy ensuring records are accurate, traceable, and stored securely to demonstrate effective implementation of procedures.
  - _T3 Repeatable · all_: Establish a formal process for handling complaints and appeals regarding NIAP decisions, ensuring prompt response and corrective action.
  - _T3 Repeatable · all_: Conduct annual Management Reviews of the quality system and policy, documenting minutes and distributing them to relevant management.
  - _T3 Repeatable · all_: Implement a documented internal audit schedule to verify compliance with quality system procedures and track corrective actions.
  - _T3 Repeatable · all_: Ensure all personnel meet defined qualifications for their assigned roles and receive periodic training on Standard Operating Procedures.
  - _T3 Repeatable · all_: Approve and monitor Common Criteria Testing Laboratories (CCTLs), adding or removing them from the approved list based on accreditation status.
  - _T3 Repeatable · all_: Maintain a Product Compliant List (PCL) of all successfully evaluated and validated products, including Security Targets and validation reports.
  - _T3 Repeatable · all_: Monitor the use of issued CC certificates and revoke them or pursue legal action against abuse or misuse.

## NIAP-CCEVS-POLICY

- **Source**: NIAP CCEVS Policy Letter 26
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/policy-ltr-26.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Establish policy to exclude products prohibited by statute or executive order from NIAP evaluation and certification for National Security Systems.
  - _T2 Risk-Informed · all_: Define authority for NIAP to refuse evaluation and certification of products subject to acquisition prohibitions for National Security Systems.
  - _T2 Risk-Informed · all_: Mandate vendor engagement with NIAP prior to contracting with a CCTL if the product may be affected by supply chain legislation limitations.

## NIST-ACVP

- **Source**: NIST Automated Cryptographic Validation Protocol (ACVP)
- **URL**: https://csrc.nist.gov/projects/cryptographic-algorithm-validation-program
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T3 Repeatable · libraries_: Submit cryptographic algorithm implementations to NVLAP-accredited laboratories for testing via Production ACVTS to obtain validation certificates.
  - _T3 Repeatable · libraries_: Ensure algorithm implementations successfully complete the cryptographic algorithm validation process to be listed as Approved security functions on FIPS 140 module validation certificates.
  - _T3 Repeatable · libraries_: Validate Random Number Generation implementations against DRBG requirements through the CAVP Automated Cryptographic Validation Protocol.
- **Governance**:
  - _T2 Risk-Informed · all_: Adhere to management activities and specific responsibilities defined in the CAVP Management Manual for vendors, laboratories, and validation authorities.

## NIST-FIPS-140-3-IG-Sep-2025-PQC

- **Source**: FIPS 140-3 Implementation Guidance — September 2025 PQC update
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Identify embedded or bound validated modules by name, certificate number, and version in the Security Policy and test report.
  - _T3 Repeatable · all_: Mark all references to EVM functionality with [EVM] in Security Policy tables to distinguish IUT from EVM capabilities.
  - _T3 Repeatable · all_: Ensure the Existing Validated Module (EVM) status is Active at the time of IUT submission to the CMVP.
  - _T3 Repeatable · all_: Verify that the operational environment of the validated algorithm implementation matches the module's tested environment exactly.
  - _T3 Repeatable · all_: Demonstrate in the Test Report how the IUT meets FIPS 140-3 requirements when relying on an EVM for specific functions.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Accept that the IUT inherits the Historical validation status if the EVM moves to the Historical list.
  - _T3 Repeatable · all_: Re-validate algorithm implementations when porting to new hardware or different processor bit sizes.
  - _T3 Repeatable · all_: Re-validate algorithm implementations when moving from one operating system to another.
- **Observability**:
  - _T3 Repeatable · all_: Provide a mapping of HMI ports to physical I/O pins or internal test interfaces to ensure provable control during testing.
  - _T3 Repeatable · all_: Verify and document vendor rationale for risks posed by intervening functional subsystems in sub-chip cryptographic subsystems.

## NIST-FIPS140-3-IG-PQC

- **Source**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Identify embedded or bound validated modules by name, certificate number, and version in the Security Policy and test report.
  - _T3 Repeatable · all_: Ensure the existing validated module (EVM) status is Active at the time of submission to the CMVP.
  - _T3 Repeatable · all_: Verify that the operational environment of the embedded algorithm implementation matches the module's tested environment.
  - _T3 Repeatable · all_: Demonstrate how the IUT meets FIPS 140-3 requirements when relying on an EVM for specific functions.
  - _T3 Repeatable · all_: Ensure the EVM security level is equal to or higher than the IUT for bound modules, except for Mitigation of Other Attacks.
  - _T3 Repeatable · all_: Prohibit binding or embedding a FIPS 140-3 IUT to a FIPS 140-2 EVM.
  - _T3 Repeatable · all_: Ensure new validation submissions obtaining entropy from a previously validated embedded module comply with SP 800-90B.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Accept that the IUT inherits the Historical validation status if the EVM moves to the Historical list.
  - _T3 Repeatable · all_: Re-test algorithm implementations when porting to a different processor bit size or operating system.
- **Observability**:
  - _T3 Repeatable · all_: Mark all references to EVM functionality with [EVM] in the Security Policy tables to distinguish IUT and EVM services.

## NIST-SP-800-140A

- **Source**: NIST SP 800-140A — CMVP Documentation Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140A.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Provide vendor documentation meeting minimum validation authority requirements for cryptographic modules undergoing independent verification.
  - _T3 Repeatable · all_: Verify that vendors supply documentation fulfilling minimum validation authority requirements for cryptographic modules.

## NIST-SP-800-140B

- **Source**: NIST SP 800-140B: CMVP Security Policy Requirements
- **URL**: https://csrc.nist.gov/publications/detail/sp/800-140b/final
- **Requirement count**: 2
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Modify, add, or delete Vendor Evidence and Test Evidence to align with validation authority requirements for cryptographic modules.
- **Governance**:
  - _T2 Risk-Informed · all_: Establish documented security policy content and ordering for cryptographic modules as mandated by the validation authority.

## NIST-SP-800-140D

- **Source**: NIST SP 800-140D — CMVP Approved SSP Generation and Establishment Methods
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140D.pdf
- **Requirement count**: 14
- **Assurance / FIPS**:
  - _T3 Repeatable · keys_: Utilize only CMVP-approved methods for sensitive security parameter generation and establishment, precluding all other methods.
  - _T3 Repeatable · keys_: Adhere to NIST SP 800-131A Rev. 2 for transitioning cryptographic algorithms and key lengths in parameter generation.
  - _T3 Repeatable · keys_: Implement key establishment techniques for DSA, RSA, and ECDSA strictly according to FIPS 186-4.
  - _T3 Repeatable · keys_: Execute pair-wise key establishment using discrete logarithm cryptography per NIST SP 800-56A Rev. 3.
  - _T3 Repeatable · keys_: Execute pair-wise key establishment using integer factorization cryptography per NIST SP 800-56B Rev. 2.
  - _T3 Repeatable · keys_: Derive keys using pseudorandom functions in accordance with NIST SP 800-108 Revised.
  - _T3 Repeatable · keys_: Derive keys from passwords for storage applications following NIST SP 800-132.
  - _T3 Repeatable · keys_: Utilize existing application-specific key derivation functions as defined in NIST SP 800-135 Rev. 1.
  - _T3 Repeatable · keys_: Apply key-derivation methods in key-establishment schemes per NIST SP 800-56C Rev. 1.
  - _T3 Repeatable · keys_: Perform key derivation through extraction-then-expansion according to NIST SP 800-56C.
  - _T3 Repeatable · keys_: Wrap keys using block cipher modes of operation as specified in NIST SP 800-38F.
  - _T3 Repeatable · keys_: Generate cryptographic keys strictly following NIST SP 800-133 Rev. 1.
  - _T3 Repeatable · keys_: Implement deterministic random bit generators for random number generation per NIST SP 800-90A Rev. 1.
  - _T3 Repeatable · keys_: Validate entropy sources used for random number generation in accordance with NIST SP 800-90B.

## NIST-SP-800-140E

- **Source**: NIST SP 800-140E — CMVP Approved Authentication Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140E.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Ensure authentication mechanisms for cryptographic modules meet CMVP-approved requirements and align with SP 800-63B standards.
  - _T3 Repeatable · software_: Validate that operator authentication is performed by the module or Operating Environment for FIPS 140-3 levels above Level 1.
  - _T3 Repeatable · software_: Confirm that authentication mechanisms used at FIPS 140-3 Level 2 or higher meet the specified approved mechanisms in Table 1.
- **Governance**:
  - _T2 Risk-Informed · software_: Establish documented justification when SP 800-63B authentication requirements cannot be met for cryptographic modules.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · software_: Incorporate lifecycle management and session management practices from SP 800-63B for authenticators in cryptographic modules.

## NIST-SP-800-90A-R1

- **Source**: SP 800-90A Rev. 1: Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/a/r1/final
- **Requirement count**: 8
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Conduct implementation validation testing by an independent accredited party to ensure conformance with DRBG specifications.
  - _T3 Repeatable · software_: Perform health testing immediately prior to or during normal operation to verify the implementation continues to perform as validated.
  - _T3 Repeatable · software_: Validate that the entropy source used for DRBG seeding conforms to SP 800-90B requirements.
  - _T3 Repeatable · software_: Ensure conformance testing for DRBG implementations is conducted within the CMVP and CAVP frameworks.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Reseed the DRBG mechanism at the end of the seedlife to maintain security strength and prevent state exhaustion.
  - _T3 Repeatable · software_: Uninstantiate the DRBG to securely terminate the instantiation and clear internal state when no longer needed.
- **Observability**:
  - _T3 Repeatable · software_: Implement health tests for the Instantiate, Generate, Reseed, and Uninstantiate functions to detect operational failures.
  - _T3 Repeatable · software_: Define and handle errors encountered during normal operation and during health testing to ensure system integrity.

## NIST-SP-800-90B

- **Source**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/b/final
- **Requirement count**: 11
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Submit entropy sources to NVLAP-accredited laboratories for validation testing against SP 800-90B requirements to obtain assurance of entropy rates.
  - _T3 Repeatable · software_: Collect a sequential dataset of at least 1,000,000 raw samples from the noise source for validation testing.
  - _T3 Repeatable · software_: Collect a conditioned sequential dataset of at least 1,000,000 consecutive outputs if a non-listed conditioning component is used.
  - _T3 Repeatable · software_: Perform restart tests by restarting the entropy source 1,000 times and collecting 1,000 consecutive samples for each restart.
  - _T3 Repeatable · software_: Provide rationale and analysis to support any claim that the noise source generates Independent and Identically Distributed (IID) samples.
  - _T3 Repeatable · software_: Provide an initial entropy estimate for the noise source outputs based on the submitter's analysis of the noise source.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Ensure the entropy source design accounts for variations in noise source behavior that may affect the entropy rate of the output.
- **Observability**:
  - _T3 Repeatable · software_: Implement health tests as an integral part of the entropy source design to ensure the noise source continues to operate as expected.
  - _T3 Repeatable · software_: Design health tests to detect likely failure modes of the entropy source and noise source quickly with high probability.
  - _T3 Repeatable · software_: Categorize health tests into start-up tests, continuous tests, and on-demand tests to monitor entropy source health.
  - _T3 Repeatable · software_: Provide an interface to conduct health tests on the entropy source to verify operational status.

## NIST-SP-800-90C

- **Source**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/c/final
- **Requirement count**: 6
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Validate RBG constructions against SP 800-90C using accredited testing labs to ensure conformance with specified requirements.
  - _T3 Repeatable · software_: Ensure RBG constructions use entropy sources validated for compliance with SP 800-90B or SP 800-90C.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Reseed DRBGs using validated randomness sources to maintain security strength and prevent state compromise.
  - _T3 Repeatable · software_: Manage RBG construction lifecycle by instantiating and reseeding DRBGs according to specified procedures.
- **Observability**:
  - _T3 Repeatable · software_: Implement health testing for RBG components to detect failures in entropy sources and non-entropy-source components.
  - _T3 Repeatable · software_: Handle failures in entropy sources and non-entropy-source components as specified in the testing section.
