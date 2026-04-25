---
generated: 2026-04-24
category: Certification Schemes
document_count: 6
requirement_count: 58
---

## ANSSI PQC Position Paper

- **Source**: ANSSI Views on Post-Quantum Cryptography Transition
- **URL**: https://cyber.gouv.fr/sites/default/files/2022/04/anssi-avis-migration-vers-la-cryptographie-post-quantique.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Undergo ANSSI security visa evaluation including mandatory hybridation analysis for post-quantum products.
  - _T3 Repeatable · all_: Ensure final products implementing post-quantum protection use hybridation unless using specific hash-based signatures.
  - _T3 Repeatable · libraries_: Implement hybridation modes using validated standards or well-studied modes with security proofs.
- **Governance**:
  - _T2 Risk-Informed · all_: Define a progressive transition strategy for cryptographic products to adopt quantum-resistant cryptography.
  - _T2 Risk-Informed · all_: Include the quantum threat in risk analysis and consider quantum protection measures for relevant cryptographic products.
  - _T2 Risk-Informed · all_: Mandate hybridation for products requiring post-quantum protection, except for specific hash-based signatures.
  - _T2 Risk-Informed · all_: Dimension symmetric primitives to ensure post-quantum security levels equivalent to AES-256 and SHA2-384.
  - _T2 Risk-Informed · libraries_: Avoid modifying normalized parameters for post-quantum algorithms like CRYSTALS-Kyber and CRYSTALS-Dilithium.
  - _T2 Risk-Informed · libraries_: Use the highest possible NIST security level (preferably Level 5 or 3) for post-quantum algorithms.
  - _T2 Risk-Informed · libraries_: Protect the internal state of signature algorithms like XMSS and LMS against integrity attacks and replay.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Prioritize hybrid post-quantum protection for products offering long-term confidentiality beyond 2030.

## BSI TR-02102-4

- **Source**: Cryptographic Mechanisms: Recommendations for SSH
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-4.pdf
- **Requirement count**: 12
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Ensure SSH implementations support only recommended algorithms with high priority and disable weak or obsolete algorithms.
  - _T2 Risk-Informed · software_: Prohibit the use of SSH-1 due to cryptographic vulnerabilities and mandate SSH-2.
  - _T3 Repeatable · software_: Validate that random number generators used for keys and signatures belong to approved classes DRG.3, DRG.4, DRT.1, PTG.3, or NTG.1.
- **Governance**:
  - _T2 Risk-Informed · all_: Adopt a security level of 120 bits for all cryptographic mechanisms as defined in organizational policy.
  - _T2 Risk-Informed · keys_: Establish policy requiring secure storage of private keys using certified hardware such as HSMs or chip cards.
- **Inventory**:
  - _T2 Risk-Informed · software_: Maintain an inventory of supported key exchange methods and their expiration dates to ensure compliance with security levels.
  - _T2 Risk-Informed · software_: Catalog encryption algorithms and their validity periods to manage cryptographic estate lifecycle.
  - _T2 Risk-Informed · software_: Record signature algorithms for server authentication and their discontinuation dates.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Define maximum periods of use for cryptographic mechanisms and discontinue usage after the specified year.
  - _T2 Risk-Informed · keys_: Plan migration to quantum-safe key agreement mechanisms by the end of 2031.
  - _T3 Repeatable · keys_: Enforce key re-exchange after one hour or one gigabyte of data transmitted to renew session keys.
  - _T3 Repeatable · keys_: Irrevocably delete ephemeral keys after use and ensure no persistent copies are stored.

## NIAP-CCEVS-MANUAL

- **Source**: NIAP CCEVS Quality Manual (Scheme Publication #2)
- **URL**: https://www.niap-ccevs.org/Documents_and_Guidance/ccevs/scheme-pub-2.pdf
- **Requirement count**: 12
- **Governance**:
  - _T3 Repeatable · all_: Establish and enforce documented policies for scheme operations, ensuring adherence to CCRA and ISO/IEC 17065 requirements.
  - _T3 Repeatable · all_: Define and document specific roles and responsibilities for NIAP management positions including Director, Quality Manager, and Technical Lead.
  - _T3 Repeatable · all_: Implement a formal Quality Policy endorsed by upper-level management to ensure impartiality and consistency in evaluations.
  - _T3 Repeatable · all_: Maintain a documented Records Management Policy ensuring traceability and reproducibility of all evaluation and validation activities.
  - _T3 Repeatable · all_: Enforce adherence to policies and procedures as a condition of employment or contract for all personnel and contractors.
  - _T3 Repeatable · all_: Establish a formal process for handling complaints and appeals regarding NIAP decisions or actions.
  - _T3 Repeatable · all_: Conduct annual management reviews of the quality system and policy to ensure continued effectiveness.
  - _T3 Repeatable · all_: Implement internal audit schedules to verify compliance with quality system procedures and document findings.
  - _T3 Repeatable · all_: Require all personnel performing work for NIAP to sign non-disclosure agreements regarding proprietary information.
  - _T3 Repeatable · all_: Maintain a Product Compliant List (PCL) of all successfully evaluated and validated products with their Security Targets.
  - _T3 Repeatable · all_: Monitor the performance of participating Common Criteria Testing Laboratories (CCTLs) for adherence to scheme terms.
  - _T3 Repeatable · all_: Establish procedures for the approval and monitoring of contractors performing validation or technical oversight functions.

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
  - _T3 Repeatable · software_: Reseed the DRBG mechanism to acquire additional bits that affect the internal state before the seedlife expires.
  - _T3 Repeatable · software_: Uninstantiate the DRBG to terminate the instantiation and securely clear internal state.
- **Observability**:
  - _T3 Repeatable · software_: Implement health tests for the Instantiate, Generate, Reseed, and Uninstantiate functions to detect operational failures.
  - _T3 Repeatable · software_: Define and handle errors encountered during normal operation and health testing to ensure system integrity.

## NIST-SP-800-90B

- **Source**: SP 800-90B: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/b/final
- **Requirement count**: 10
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Submit entropy sources to NVLAP-accredited laboratories for validation testing against SP 800-90B requirements before deployment.
  - _T3 Repeatable · software_: Collect a sequential dataset of at least 1,000,000 raw samples from the noise source for validation testing.
  - _T3 Repeatable · software_: Collect a conditioned sequential dataset of at least 1,000,000 consecutive outputs if a non-listed conditioning component is used.
  - _T3 Repeatable · software_: Perform restart tests by restarting the entropy source 1000 times and collecting 1000 consecutive samples for each restart.
  - _T3 Repeatable · software_: Provide rationale and analysis to support any claim that the noise source generates Independent and Identically Distributed (IID) samples.
  - _T3 Repeatable · software_: Provide an initial entropy estimate for the noise source outputs based on the submitter's analysis of the design.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Ensure the entropy source design accounts for variations in noise source behavior that may affect the entropy rate of the output.
- **Observability**:
  - _T3 Repeatable · software_: Implement health tests to ensure the noise source and entropy source continue to operate as expected and detect failures quickly.
  - _T3 Repeatable · software_: Include health tests capable of detecting likely failure modes for the entropy source and specifically the noise source.
  - _T3 Repeatable · software_: Categorize health tests into start-up, continuous, and on-demand tests to monitor entropy source status.

## NIST-SP-800-90C

- **Source**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/c/final
- **Requirement count**: 5
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Validate RBG constructions against SP 800-90C using accredited testing labs to ensure conformance with specified requirements.
  - _T3 Repeatable · software_: Ensure RBG constructions use entropy sources validated for compliance with SP 800-90B or SP 800-90C.
  - _T3 Repeatable · software_: Verify that RBG constructions meet minimum entropy requirements for seed material to ensure cryptographic security.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Define and enforce reseed procedures for RBG constructions to maintain security strength over time.
- **Observability**:
  - _T3 Repeatable · software_: Implement health testing for RBG components to detect failures in entropy sources and non-entropy-source components.
