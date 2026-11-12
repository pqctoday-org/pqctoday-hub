---
generated: 2026-11-12
category: Certification Schemes
document_count: 24
requirement_count: 153
---

## ANSSI PQC Position Paper
- **Source**: Avis scientifique et technique de l'ANSSI sur la migration vers la cryptographie post-quantique
- **URL**: https://messervices.cyber.gouv.fr/documents-guides/anssi-avis-migration-vers-la-cryptographie-post-quantique.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Do not expect ANSSI approval of direct (non-hybrid) PQC replacement of pre-quantum algorithms in the short or medium term; treat PQC as immature when planning assurance of products.
    - _T2 Risk-Informed · all_: Product developers seeking ANSSI security visas must submit to a dedicated cryptographic evaluation within the certification scheme; algorithms should preferably be standardized by international bodies or backed by solid scientific publica…
    - _T3 Repeatable · all_: Ensure PQC deployments preserve pre-quantum security by using hybrid key establishment/signature mechanisms; for hybrid signatures, require both underlying signatures to be valid.
    - _T3 Repeatable · software_: Secure the implementation of the hybridization technique itself, not just the underlying algorithms, since hybridization is crucial to security in phases 1 and 2.
- **Governance**:
    - _T2 Risk-Informed · all_: Use state-of-the-art cryptographic algorithms by following ANSSI's published algorithm-selection guidance and technical reference for sizing algorithms when developing security products.
    - _T2 Risk-Informed · all_: Assess exposure to store-now-decrypt-later attacks and prioritize migration for data that must remain confidential long-term; plan migration of long-term-validity signatures before a CRQC emerges.
    - _T2 Risk-Informed · all_: Do not rely on QKD as a countermeasure to the quantum threat; at most use it as a complement (defense in depth) to algorithmic cryptography in niche applications.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Begin a gradual, phased transition from pre-quantum to post-quantum algorithms now, ensuring no regression in classical security while building confidence in PQC algorithms and their implementations.
    - _T2 Risk-Informed · keys_: Adjust symmetric key and hash sizes for quantum resistance: use 256-bit keys for AES and hash outputs of at least 384 bits for SHA-2 and SHA-3.

## ANSSI-PG-083-v3-2026
- **Source**: Règles et Recommandations Concernant le Choix et le Dimensionnement des Mécanismes Cryptographiques (v3.00)
- **URL**: https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-mecanismes-crypto-3.00.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Use curves conforming to the referential (FRP256v1, P-256/384/521, brainpool, B-283/409/571 per FIPS 186-5) for ECDSA/ECKCDSA; check protocol compatibility of signature properties (strong unforgeability).
- **Governance**:
    - _T3 Repeatable · all_: Where quantum resistance is targeted, comply with the post-quantum rules (règles post-quantiques) as a necessary condition to claim protection against a quantum adversary.
    - _T3 Repeatable · all_: Hybridize classical asymmetric mechanisms (ECIES-KEM, RSAES-OAEP, signatures) with post-quantum mechanisms, and hybridize ML-KEM/FrodoKEM/ML-DSA with a classical mechanism, to satisfy both classical and post-quantum asymmetric security rul…
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Retire non-conformant primitives such as two-key Triple-DES (112-bit key) which violate the minimum symmetric key size rule.
- **Observability**:
    - _T3 Repeatable · all_: Specify precisely the procedure to follow when fault-detection tests on a physical random generator detect a failure.

## BSI TR-02102-1
- **Source**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · certificates_: Ensure public keys are distributed through a reliable, manipulation-protected mechanism (e.g., PKI) to verifiers.
- **Governance**:
    - _T2 Risk-Informed · keys_: For high-assurance or long-lived applications, select longer EC key lengths than minimum and use verifiably randomly generated curve parameters to maintain a security buffer.
    - _T2 Risk-Informed · software_: For protocols such as MLS, define and document the cipher suite (KEM, AEAD, hash, signature) using only the recommended suites.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Plan and execute migration from classical-only asymmetric mechanisms to hybrid combinations with a quantum-safe KEM and key derivation before the end of 2031.
    - _T3 Repeatable · all_: Retire sole use of classical asymmetric schemes (RSA, DLIES, ECIES, DH, ECDH) by end of 2031; track the recommendation expiry dates for each scheme.
    - _T3 Repeatable · certificates_: Complete migration to quantum-safe signature schemes by 2035 at the latest, planning a long migration period especially for signature schemes within a PKI.
    - _T3 Repeatable · certificates_: Phase out DSA usage by 2029 due to its discontinuation in the referenced standard.
    - _T3 Repeatable · keys_: Use quantum-safe KEMs (FrodoKEM, Classic McEliece, ML-KEM) in a hybrid manner with a classical mechanism, with only the specified approved parameter sets.
    - _T3 Repeatable · software_: Ensure products with lifetime beyond 2030 can be upgraded to quantum-resistant methods, and that the software/firmware upgrade mechanism supports post-quantum signatures for integrity and authenticity.

## BSI-BSZ-METHOD
- **Source**: BSI BSZ — Accelerated Security Certification Evaluation Process (v2.1)
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/BSZ/BSZ-Evaluation.pdf?__blob=publicationFile&v=5
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Ensure the accredited evaluation facility complies with the scheme's evaluation process requirements for fixed-time certification and re-recognition to maintain licensing and conduct evaluations correctly.
    - _T3 Repeatable · all_: Facility must ensure technical correctness and truthful documentation of its evaluation results.
    - _T3 Repeatable · software_: Conduct an Extended Follow-Up Evaluation, including an Impact Analysis Report assessment and re-testing of changed TOE configuration, when the evaluation outcome is negative or the TOE changes.
- **Governance**:
    - _T2 Risk-Informed · all_: Define roles and responsibilities across evaluation phases among facility, applicant/manufacturer and certification body, including archiving of the evaluated object per certification body specifications.
    - _T3 Repeatable · all_: Specify any use of test equipment outside the facility premises at kick-off, and implement adequate security measures protecting the TOE, confidential information and evaluator knowledge.
- **Observability**:
    - _T3 Repeatable · all_: Immediately notify the certification body of any delays in scheduled evaluation procedures and provide process and content information on ongoing evaluations.
    - _T3 Repeatable · all_: Provide the certification body with information on the process and content of ongoing evaluation procedures.

## CC-2022-CEM
- **Source**: Common Evaluation Methodology (CEM) 2022 R1
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CEM2022R1.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Define scheme-level disposal rules for evaluation evidence at evaluation conclusion: return, archive, or destroy.
    - _T3 Repeatable · all_: Place all evaluation evidence under configuration control, so each item and specific document version can be identified and located after receipt, supporting reproducible validation evidence.
    - _T3 Repeatable · all_: Protect evaluation evidence from alteration or loss throughout evaluation to preserve the integrity of the assurance record.
    - _T3 Repeatable · all_: Record evaluation work in sufficient detail that procedures, events, observations and results can be reconstructed later, providing an auditable trail of validation activity.
    - _T3 Repeatable · all_: Report scheme identifiers, ETR configuration identifiers, and ST/TOE identifiers in the evaluation report so the evaluation authority can unambiguously verify what was evaluated and the verdicts assigned.
    - _T3 Repeatable · all_: Report evaluation conclusions, the overall verdict against the Security Target, and recommendations (including shortcomings found) to the evaluation authority.
    - _T3 Repeatable · all_: Maintain a list of all evaluation evidence items (issuing body, title, unique reference/version) in the evaluation report.
- **Governance**:
    - _T2 Risk-Informed · all_: Impose and document confidentiality requirements on evaluators handling sponsor/developer sensitive evidence, covering receipt, handling, storage and disposal, as agreed between sponsor and evaluator within scheme rules.
    - _T2 Risk-Informed · all_: Identify in the evaluation report the developer and sponsor roles responsible for producing and sponsoring the evaluated product.
- **Observability**:
    - _T3 Repeatable · all_: Track all observation reports raised during evaluation with unique identifiers and current status, and report the complete list to the evaluation authority.

## CC-2022-PART2
- **Source**: Common Criteria 2022 Part 2 — Security Functional Components (R1)
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART2R1.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Perform cryptographic operations only with specified algorithms and key sizes, conforming to declared standards.
    - _T3 Repeatable · all_: Seed the random bit generator from a declared noise source (hardware or software) that provides a specified minimum number of bits of min-entropy; entropy sources must be identified and evaluated.
    - _T3 Repeatable · all_: When combining multiple noise sources, use a defined combining operation and standard-conformant derivation function so that the combined entropy input meets a specified minimum min-entropy.
    - _T3 Repeatable · keys_: Generate cryptographic keys using specified algorithms and key sizes that conform to a declared list of standards, enabling evaluators to verify conformance.
    - _T3 Repeatable · keys_: Distribute cryptographic keys only through a specified distribution method conforming to declared standards.
    - _T3 Repeatable · keys_: Control cryptographic key access (e.g., backup, archival, recovery) via a specified access method that conforms to declared standards.
    - _T3 Repeatable · keys_: Derive cryptographic keys only from specified input parameters using a specified derivation algorithm and key sizes that meet declared standards.
- **Governance**:
    - _T3 Repeatable · all_: Define and document the interface through which RBG output is exposed as a service to external entities, specifying the interface type.
- **Inventory**:
    - _T3 Repeatable · all_: Identify and document the number and type of noise sources (software and hardware) used to seed the RBG.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Manage cryptographic keys across their full life cycle, covering generation, distribution, access, derivation and destruction, each per specified algorithms, methods and standards.
    - _T3 Repeatable · keys_: Destroy cryptographic keys and keying material when no longer needed or upon other defined circumstances, using a specified destruction method that meets declared standards.

## CMVP-MGMT-MANUAL
- **Source**: FIPS 140-3 Cryptographic Module Validation Program Management Manual
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS-140-3-CMVP%20Management%20Manual.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Do not treat IUT or MIP list posting as validation; rely on actual CMVP validation status when claiming a module is validated.
    - _T3 Repeatable · libraries_: Retain a mapping from CSTL-consolidated documentation back to original vendor source documentation as part of the validation records.

## COMMON-CRITERIA
- **Source**: Common Criteria for Information Technology Security Evaluation, CC:2022 Release 1, Part 1
- **URL**: https://www.commoncriteriaportal.org/files/ccfiles/CC2022PART1R1.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Define the security problem (threats, OSPs, assumptions) in the SPD for any evaluated product, since evaluation result usefulness depends on SPD quality; invest in well-defined derivation processes.
    - _T3 Repeatable · all_: Where independent assessment of cryptographic algorithm mathematical properties is required, ensure the evaluation scheme provides for such assessments, since the CC does not cover them.
    - _T3 Repeatable · libraries_: For products combining components of differing assurance needs (e.g. cryptographic library, key storage unit), use a multi-assurance PP-Configuration so each sub-TSF is evaluated at assurance consistent with its security needs.
- **Governance**:
    - _T2 Risk-Informed · all_: Accreditors must make separate provisions for assessing non-IT-related security properties, which the CC does not cover, so that organizational governance addresses scope gaps.

## ENISA PQC Guidelines
- **Source**: Post-Quantum Cryptography: Current State and Quantum Mitigation
- **URL**: https://www.enisa.europa.eu/publications/post-quantum-cryptography-current-state-and-quantum-mitigation
- **Requirement count**: 1
- **Governance**:
    - _T2 Risk-Informed · keys_: Protect data that must remain confidential beyond the arrival of quantum computers with alternative means, since intercepted public-key-encrypted ciphertext cannot be protected retroactively.

## ENISA-PQC-Integration-Study-2022
- **Source**: ENISA Post-Quantum Cryptography Integration Study
- **URL**: https://www.enisa.europa.eu/sites/default/files/publications/Post%20Quantum%20Cryptography-%20Integration%20Publication.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Deploy hybrid/double-encryption and double-signature schemes combining pre-quantum and PQC algorithms so security holds even if the PQC scheme or its software is flawed; adopt combined modes where compliance demands.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Track the NIST PQC standardisation outcomes (selected algorithms, fourth-round candidates, new signature call) and plan migration to standardised algorithms as they are published.
- **Observability**:
    - _T4 Adaptive · libraries_: Anticipate that PQC cryptanalysis and software maturity are less established; monitor for new attacks (e.g., SIKE/SIDH breaks) and be prepared to replace algorithms rapidly, supporting crypto-agility.

## EUCC v2.0 ACM
- **Source**: EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0
- **URL**: https://certification.enisa.europa.eu/document/download/a845662b-aee0-484e-9191-890c4cfa7aaa_en?filename=ECCG+Agreed+Cryptographic+Mechanisms+version+2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Re-evaluate cryptographic mechanisms against the document on its two-year revision cycle to keep assurance of agreed status current.
- **Governance**:
    - _T3 Repeatable · all_: Build new cryptographic systems on recommended algorithms and key sizes; justify any use of legacy mechanisms by backwards-compatibility reasons.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Phase out legacy cryptographic mechanisms as soon as practical and track their validity periods and deprecation deadlines (e.g., L[2031]).

## FIPS-140-3-STANDARD
- **Source**: FIPS 140-3 — Security Requirements for Cryptographic Modules
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.140-3.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Use cryptographic modules designed and implemented in conformance with FIPS 140-3 when operated by or on behalf of federal agencies; modules validated under the CMVP are considered conforming.
    - _T2 Risk-Informed · libraries_: Select the FIPS 140-3 security level (1-4) for each module according to the security requirements of the application and environment and the services the module provides.
    - _T3 Repeatable · libraries_: Procure and deploy cryptographic modules that have been validated under the CMVP to FIPS 140-3 by an accredited CST laboratory, and use the CMVP validated modules list (not the Historical list) for procurement decisions.
    - _T3 Repeatable · libraries_: Submit modules for independent testing by NVLAP-accredited CST laboratories and have the test report reviewed and validated by the CMVP to demonstrate compliance.
    - _T3 Repeatable · libraries_: Ensure modules employ only Approved security functions (FIPS-specified algorithms, SP 800-140C functions, SP 800-140D SSP establishment methods and key management/authentication techniques).
    - _T3 Repeatable · libraries_: Verify that module documentation and security policy satisfy CMVP requirements (SP 800-140A Documentation, SP 800-140B Security Policy) as part of validation evidence.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a responsible authority within the organization to ensure the security of the system using cryptographic modules is sufficient and acceptable.
    - _T2 Risk-Informed · libraries_: Assign the operator/responsible authority accountability for determining that module security is sufficient and acceptable to the information owner, and for acknowledging and accepting residual risk; validation alone is not sufficient.
    - _T3 Repeatable · all_: Review and track revisions of the standard and its normative references (ISO/IEC 19790, ISO/IEC 24759, NIST SP 800-140 series) as the latest editions apply and the standard is reviewed at least every five years.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Identify cryptographic modules in use, spanning hardware, software, firmware, or combinations, so each can be mapped to a CMVP validation and security level.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Develop acquisition plans for products compliant with FIPS 140-3 and plan for transition from FIPS 140-2 validated modules given the testing transition schedule (FIPS 140-2 testing ends, 140-3 testing begins 18 months after approval).

## NIAP-CCEVS-MANUAL
- **Source**: NIAP CCEVS Quality Manual (Scheme Publication #2)
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/scheme-pub-2.pdf
- **Requirement count**: 3
- **Governance**:
    - _T3 Repeatable · all_: Protect sensitive or proprietary information relating to products under evaluation with procedures that are routinely followed.
- **Observability**:
    - _T3 Repeatable · all_: Maintain a system for creating, storing, accessing, archiving, and disposing of records documenting validation activities, including retention of email and electronic submissions and certificate management records.
    - _T3 Repeatable · certificates_: Monitor use of certificates and logos for compliance, and provide procedures for certificate withdrawal when validation is no longer valid.

## NIAP-CCEVS-POLICY
- **Source**: NIAP CCEVS Policy Letter 26
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/policy-ltr-26.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Use only COTS IA and IA-enabled products evaluated through NSA-approved NIAP processes and listed on the NIAP Product Compliant List when protecting National Security Systems.
    - _T3 Repeatable · all_: Before engaging a CCTL for NIAP evaluation, confirm the product is not prohibited from use on National Security Systems by statute, executive order, or applicable directive; NIAP may refuse evaluation and certification of prohibited or soo…
- **Governance**:
    - _T2 Risk-Informed · all_: Vendors who may be affected by acquisition prohibitions must proactively contact NIAP before contracting with a CCTL, as part of a documented pre-evaluation engagement process.
    - _T2 Risk-Informed · all_: Track supply chain legislation (NDAA, SECURE Technology Act) and implementing policies that restrict federal acquisition of products, and assign ownership for assessing their impact on certification eligibility.

## NIST-ACVP
- **Source**: NIST Automated Cryptographic Validation Protocol (ACVP)
- **URL**: https://pages.nist.gov/ACVP/draft-fussell-acvp-spec.html
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Operators of a validation authority server must secure the ACVP channel with HTTPS, TLS 1.2 or greater, and mutual authentication; clients intended for use with a validation authority must meet the same requirements.
    - _T3 Repeatable · libraries_: Use ACVP to automatically verify cryptographic module implementations at a rate that matches industry development cycles, so validated crypto carrying CVE fixes can be deployed quickly.
    - _T3 Repeatable · libraries_: Register module algorithm capabilities with the validation server and obtain a 'passed' disposition for each test vector set before the algorithm is considered ready for validation.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Agree an authentication scheme between client and server owning entities, including validation authority servers, for ACVP test sessions; strength may range from basic HTTP authentication to TLS mutual certificate authentication.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Maintain a described inventory of the vendor, module, operational environment and dependency records for modules under validation, as these are the resources the ACVP server tracks.

## NIST-FIPS140-3-IG-PQC
- **Source**: Implementation Guidance for FIPS 140-3 and the Cryptographic Module Validation Program
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Reuse physical security test evidence across platforms only when characteristics are identical; any difference requires full testing for that category, otherwise documentation analysis by the CST lab.
    - _T3 Repeatable · keys_: Require a pair-wise consistency test for every public/private key pair generated by the module.
    - _T3 Repeatable · libraries_: Use only cryptographic modules validated by CMVP through NVLAP-accredited CST laboratories testing conformance to FIPS 140-3, and verify algorithms against CAVP validation lists.
    - _T3 Repeatable · libraries_: Confirm each approved algorithm in use has a CAVP certificate matching the required algorithm/mode/revision combination, and verify it via the CAVP validation search.
    - _T3 Repeatable · libraries_: Ensure modules perform cryptographic algorithm self-tests (CASTs) prior to first operational use of each algorithm, including entropy sources, DRBGs, and PQC algorithms (ML-KEM, ML-DSA, SLH-DSA).
    - _T3 Repeatable · libraries_: Include entropy sources used for random bit generation (SP 800-90B) and DRBGs (SP 800-90A) in required self-testing before operational use.
- **Governance**:
    - _T2 Risk-Informed · all_: Track that IG guidance is subject to change by NIST and CCCS, and maintain awareness of updates when implementing and validating modules.
    - _T2 Risk-Informed · libraries_: Restrict approved component-validation-list functions (e.g., KDFs, RSA primitives) to their specified protocol context, enforced in the module or by operator guidance in the Security Policy.
    - _T2 Risk-Informed · libraries_: Document configuration and secure-deployment instructions for module links (e.g., RADIUS tunneled over IPsec/TLS, MACsec peer links) in the module Security Policy.

## NIST-SP-800-140A
- **Source**: NIST SP 800-140A — CMVP Documentation Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140A.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Organizations seeking FIPS 140-3 validation must follow the formal scheme: supply CMVP-specified evidence to an accredited CSTL, and apply CMVP modifications to ISO/IEC 19790 Annex A and ISO/IEC 24759 using the specified editions.
    - _T3 Repeatable · libraries_: Vendors must supply the CSTL with cryptographic module documentation that meets at least the minimum documentation requirements set by the CMVP validation authority, as evidence for validation.
    - _T3 Repeatable · libraries_: Testing laboratories must verify that vendor-supplied documentation for a cryptographic module satisfies at least the validation authority's minimum documentation requirements before conformity is demonstrated.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Vendors and operators must track the CMVP validation authority's modifications, additions, and deletions to vendor and test evidence, and align module documentation with the current requirement set.

## NIST-SP-800-140B
- **Source**: NIST SP 800-140B Rev. 1: CMVP Security Policy Requirements
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Br1.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Produce a CMVP security policy following the ISO/IEC 19790 Annex B section order (General through Mitigation of other attacks), marking non-applicable sections as such, as part of validation evidence.
    - _T3 Repeatable · libraries_: List all vendor-affirmed security methods in the vendor-provided non-proprietary security policy.
    - _T3 Repeatable · libraries_: Specify in the security policy the nominal and high/low operating temperature range, and whether EFP/EFT features force shutdown or zeroise unprotected SSPs along with the temperature range met.
    - _T3 Repeatable · libraries_: Link algorithm entries in the security policy to CAVP certificate numbers; select only tested algorithms, modes and properties, listing each operating environment separately where tested in multiple OEs.
    - _T3 Repeatable · libraries_: Submit structured security policy data via Web Cryptik or schema-conformant JSON, with text/images in the provided Word template.
    - _T3 Repeatable · software_: For software/firmware/hybrid modules, include in the security policy a block diagram showing the module's logical object relative to the OS, supporting applications, cryptographic boundary and tested operational environment (TOEPP).
- **Inventory**:
    - _T3 Repeatable · keys_: Maintain an SSP table covering type, strength, security functions, CAVP certificate numbers, generation location/method, import/export methods, establishment methods and related SSPs.
    - _T3 Repeatable · keys_: Specify electronic and manual SSP input/output methods, and SSP storage areas, formats (encrypted/plaintext) and persistence types (dynamic/static).
    - _T3 Repeatable · libraries_: Document the tested operational environment's physical perimeter (TOEPP) with a description and components list, and precisely define the module's physical TOEPP and cryptographic boundaries.

## NIST-SP-800-140C
- **Source**: NIST SP 800-140C Rev. 2: CMVP-Approved Security Functions
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Cr2.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Restrict cryptographic modules to CMVP-approved security functions only; do not use security functions outside the CMVP-approved list in modules claiming FIPS 140-3 validation.
    - _T3 Repeatable · libraries_: Verify module security functions against the current CMVP-published approved list, which is maintained online and changes outside the publication, rather than a static document copy.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Treat the CMVP-approved security functions list as superseding ISO/IEC 19790 Annex C and ISO/IEC 24759 6.15 when defining policy on permitted cryptographic functions in validated modules.
- **Observability**:
    - _T3 Repeatable · libraries_: Monitor the CMVP website for updates to the approved security function list, as future modifications are published there without revising the document.

## NIST-SP-800-140D
- **Source**: NIST SP 800-140D Rev. 2 — CMVP-Approved Sensitive Security Parameter Generation and Establishment Methods
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Dr2.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Maintain documented, auditable evidence that each module's SSP generation and establishment methods are CMVP-approved, as the document is intended for vendors, testing labs and the CMVP in validation testing.
    - _T3 Repeatable · keys_: Use only CMVP-approved sensitive security parameter (SSP) generation and establishment methods in cryptographic modules submitted for validation; all other SSP generation/establishment methods are precluded.
    - _T3 Repeatable · keys_: Consult the current CMVP-published list of approved SSP generation and establishment methods (maintained on the CMVP website) rather than relying on a static copy, since the list changes without revision of this publication.
- **Governance**:
    - _T2 Risk-Informed · keys_: Vendors and testing labs must apply the CMVP validation authority's replacement of ISO/IEC 19790 Annex D / ISO/IEC 24759 para 6.16 SSP methods, using the specified editions ISO/IEC 19790:2012 (with 2015 corrections) and ISO/IEC 24759:2017…
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Track superseding revisions of this document (SP 800-140Dr2 replaces Dr1, which replaced earlier ISO/IEC 19790 Annex D and ISO/IEC 24759 6.16 content) and ensure vendor/lab processes apply the current edition.
- **Observability**:
    - _T3 Repeatable · keys_: Track changes to the CMVP-approved SSP method list on the CMVP website and re-evaluate module SSP generation/establishment methods and validation status when the list is updated.

## NIST-SP-800-140E
- **Source**: NIST SP 800-140E — CMVP Approved Authentication Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140E.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Vendors must use SP 800-63B as the framework for module authentication requirements and provide documented justification whenever any SP 800-63B requirement cannot be met.
    - _T3 Repeatable · software_: Validation testers (CSTLs) must review and affirm vendor authentication documentation, including justifications for unmet SP 800-63B requirements, as part of module validation evidence.
    - _T3 Repeatable · software_: Above Level 1, perform operator authentication acceptance within the module or the Operating Environment, and confine mechanisms to those permitted per FIPS 140-3 security level (Table 1), assessing each against SP 800-63B Sections 5-7 (no…
- **Governance**:
    - _T2 Risk-Informed · software_: Where authentication is used at FIPS 140-3 Level 1, treat it as meeting Level 2 requirements as a minimum, even though authentication is not required at Level 1.
    - _T3 Repeatable · software_: At Level 4, restrict operator authentication to multi-factor mechanisms (multi-factor crypto software or device); Level 3 permits a broader enumerated set of mechanisms.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Manage authenticator lifecycle and session management per normative SP 800-63B Sections 6 and 7 for authentication mechanisms used by validated modules.

## NIST-SP-800-90A-R1
- **Source**: SP 800-90A Rev. 1: Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- **URL**: https://www.nist.gov/publications/recommendation-random-number-generation-using-deterministic-random-bit-generators-2
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Subject DRBG implementations to formal conformance validation under CMVP and CAVP; treat requirements outside validation scope as the responsibility of the entity using, implementing, installing or configuring the application.
    - _T3 Repeatable · libraries_: Use only entropy sources validated as conforming to SP 800-90B (approved entropy sources) as the randomness source for the DRBG.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign ownership of 'shall' requirements that fall outside CMVP/CAVP testing to the implementing and deploying entities, so such obligations are not left unowned.
    - _T2 Risk-Informed · libraries_: Instantiate DRBGs at the highest security strength required by any consuming purpose, and do not use output for applications requiring higher strength than the instantiation supports.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Support the instantiate, reseed and uninstantiate lifecycle functions so DRBG state is refreshed with new entropy and zeroized when no longer needed.
    - _T3 Repeatable · libraries_: Maintain a diversity of approved DRBG mechanisms so a timely transition to a different mechanism class is possible if new attacks are found.
- **Observability**:
    - _T3 Repeatable · libraries_: Implement health testing in DRBG implementations immediately prior to or during normal operation to confirm they continue to perform as validated.
    - _T3 Repeatable · libraries_: Ensure the DRBG mechanism includes a health test function that determines whether the mechanism continues to function correctly.

## NIST-SP-800-90B
- **Source**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/b/final
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Understand that entropy source validation may be needed to satisfy legal restrictions, policies, or directives, and pursue validation accordingly.
    - _T3 Repeatable · all_: Validate entropy sources through NVLAP-accredited laboratory testing against SP 800-90B, followed by CAVP and CMVP review of results, to obtain assurance of the stated entropy rate.
    - _T3 Repeatable · all_: Collect validation data under controlled, attestable conditions: by the submitter with a lab witness, by the lab, or in advance with a documented data-generation specification and a signed attestation that it was followed.
    - _T3 Repeatable · all_: Associate any relevant hardware or software version updates with the validation data collected from the entropy source under validation, so evidence traces to the exact version.
    - _T3 Repeatable · all_: Document the data collection method so that a lab or submitter can replicate the collection later, and document why collection does not interfere with the noise source.
    - _T3 Repeatable · all_: For non-vetted conditioning components, supply a description, narrowest internal width, output block size, mathematical evidence of suitability, and justification of behavior under non-independent noise data.
    - _T3 Repeatable · libraries_: Use only vetted conditioning components (HMAC, CMAC, CBC-MAC, approved hash functions, Hash_df, Block_Cipher_df) with CAVP-tested correct implementation to claim full-entropy outputs without additional proofs.
- **Observability**:
    - _T3 Repeatable · all_: Implement noise-source health tests that raise an alarm on significant entropy decrease, noise source failure, or hardware failure, tailored to the source's expected statistical behavior.
    - _T3 Repeatable · all_: Apply health tests to noise source outputs before conditioning, and run start-up health tests after power-up or reboot and before first use of the entropy source.

## NIST-SP-800-90C
- **Source**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90C.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure the randomness source used to seed an RBG1 construction is a validated RBG2(P) or RBG3 construction, or a root RBGC whose initial randomness source is an RBG3 or full-entropy source, and document this in user documentation or securi…
    - _T3 Repeatable · libraries_: Provide documentation justifying the independence of all validated entropy sources from all other validated and non-validated entropy sources employed by the RBG.
    - _T3 Repeatable · libraries_: For RBG3 constructions, state in the security policy the fallback security strength the DRBG supports if the entropy source fails.
    - _T3 Repeatable · libraries_: Use only vetted conditioning functions listed in SP 800-90B when performing external conditioning of entropy-source output.
    - _T3 Repeatable · libraries_: Obtain RBG implementations whose designs can be validated by CMVP/CAVP and tested by accredited labs; track CMVP Implementation Guidance for requirements that later become testable.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Document in the security policy the conditions under which RBG2/RBG3 DRBGs are reseeded (e.g., on application request or at time intervals) and whether the RBG3 DRBG can be accessed directly.
    - _T2 Risk-Informed · libraries_: Provide users with guidance for fulfilling non-testable RBG requirements, since lab validation cannot verify them.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Document the RBG components within the security boundary, the features supported (e.g., direct DRBG access), and sub-DRBG limits and supported security strengths for RBG1 implementations.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Do not reseed sub-DRBGs; terminate and re-instantiate when seedlife expires, and ensure sub-DRBG seed material is not reused or exported from the security boundary.
- **Observability**:
    - _T3 Repeatable · libraries_: Document the health tests performed by the RBG, including the periodic intervals at which each test is executed, as part of validation documentation.
    - _T3 Repeatable · libraries_: Terminate use of a sub-DRBG whenever its seedlife is exceeded or any of its health tests fails.
