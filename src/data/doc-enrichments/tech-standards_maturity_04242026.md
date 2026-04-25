---
generated: 2026-04-24
category: Technical Standards
document_count: 42
requirement_count: 195
---

## Draft-for-Public-Consultation-Quantum-Readiness-Index-Oct-2025

- **Source**: Draft for Public Consultation Quantum Readiness Index (Oct 2025)
- **Requirement count**: 7
- **Governance**:
  - _T2 Risk-Informed · all_: Establish a formal governance structure to mandate and institutionalize quantum risk management and migration.
  - _T2 Risk-Informed · all_: Ensure the organizational governance structure institutionalizes quantum risk alongside existing cyber risks.
  - _T4 Adaptive · all_: Facilitate conversations with organizational leaders and the Board regarding the state of quantum readiness to secure buy-in.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify crown jewels and prioritize critical business functions for quantum-safe migration supported by cryptographic asset management.
  - _T2 Risk-Informed · all_: Perform quantum risk assessment to identify and prioritize affected assets and data for migration.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Conduct technology experimentation and proof of concept projects to assess quantum-safe technologies before adoption.
- **Observability**:
  - _T2 Risk-Informed · all_: Understand organizational risk exposure of products and services from third-party vendors through external engagement.

## FIPS 186-5

- **Source**: Digital Signature Standard (DSS)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-5.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Utilize cryptographic algorithms and key generation techniques that are approved for protecting Federal Government-sensitive information.
  - _T2 Risk-Informed · software_: Ensure implementations conform to the standard through testing via the Cryptographic Module Validation Program.
- **Governance**:
  - _T2 Risk-Informed · keys_: Ensure the responsible authority in each agency or department verifies that the overall implementation provides an acceptable level of security.
  - _T2 Risk-Informed · keys_: Guard against the disclosure of private keys to maintain the security of the digital signature system.
  - _T2 Risk-Informed · software_: Ensure that any module implementing a digital signature capability is designed and built in a secure manner.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Restrict the use of digital signature key pairs to their intended purpose and do not use them for other purposes.

## FIPS 203

- **Source**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Employ cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations complying with this standard.
  - _T2 Risk-Informed · software_: Ensure exports of cryptographic modules implementing this standard comply with federal laws and are licensed by the Bureau of Industry and Security.
- **Governance**:
  - _T2 Risk-Informed · all_: Ensure overall implementation provides an acceptable level of security as determined by the responsible authority in each agency or department.
  - _T2 Risk-Informed · software_: Ensure that any module implementing key establishment capability is designed and built in a secure manner.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Guard against the disclosure of randomness used by parties, decapsulation keys, and shared secret keys to maintain security guarantees.

## FIPS 204

- **Source**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Ensure modules implementing digital signature capabilities are designed and built in a secure manner.
  - _T3 Repeatable · software_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in digital signature implementations.
- **Governance**:
  - _T2 Risk-Informed · keys_: Ensure private keys are guarded against disclosure to maintain digital signature system security.
  - _T2 Risk-Informed · keys_: Restrict digital signature key pairs to their intended purpose and prohibit use for other functions.
  - _T2 Risk-Informed · software_: Ensure the responsible authority verifies that the overall implementation provides an acceptable level of security.

## FIPS 205

- **Source**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Validate implementations for conformance to the algorithms specified in this standard through the NIST validation program.
- **Governance**:
  - _T2 Risk-Informed · all_: Ensure the responsible authority verifies that the overall implementation provides an acceptable level of security.
  - _T2 Risk-Informed · keys_: Guard against the disclosure of private keys to maintain the security of the digital signature system.
  - _T2 Risk-Informed · keys_: Restrict digital signature key pairs to their intended purpose and do not use them for other purposes.
  - _T2 Risk-Informed · software_: Ensure that any module implementing digital signature capability is designed and built in a secure manner.
  - _T2 Risk-Informed · software_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in digital signature implementations.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Review the standard every five years to assess its adequacy and adapt to advancements in science and technology.

## FIPS 206

- **Source**: FFT over NTRU-Lattice-Based Digital Signature Algorithm (FN-DSA)
- **URL**: https://csrc.nist.gov/projects/post-quantum-cryptography
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Begin migrating systems to quantum-resistant cryptography immediately.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify where vulnerable algorithms are used to plan replacement or updates.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan to replace or update systems using vulnerable algorithms before deprecation.

## FIPS-180-4

- **Source**: Secure Hash Standard (SHS) — SHA-1, SHA-224, SHA-256, SHA-384, SHA-512
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Ensure only NIST-validated implementations of secure hash algorithms are deployed to comply with the standard.
- **Governance**:
  - _T2 Risk-Informed · all_: Assign the responsible authority in each agency or department to assure that the overall implementation provides an acceptable level of security.
  - _T2 Risk-Informed · all_: Implement either this Standard or FIPS 202 wherever a secure hash algorithm is required for Federal applications.

## GSMA-PQ03-v2-2024

- **Source**: GSMA PQ.03 Post-Quantum Cryptography Guidelines for Telecom Use Cases v2.0
- **URL**: https://www.gsma.com/newsroom/wp-content/uploads//PQ.03-Post-Quantum-Cryptography-Guidelines-for-Telecom-Use-Cases-v2.0-2.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Validate firmware and middleware compatibility to ensure correct implementation of Post-Quantum Cryptography algorithms.
  - _T2 Risk-Informed · software_: Test algorithm implementations to verify infrastructure capacity and middleware compatibility before deployment.
- **Governance**:
  - _T2 Risk-Informed · all_: Establish a governance framework and decision-making process to prioritize and plan the Post-Quantum Cryptography migration.
  - _T2 Risk-Informed · all_: Perform a business risk analysis to assess the impact of quantum computing threats on cryptographic assets.
  - _T3 Repeatable · all_: Implement ongoing crypto-governance processes to manage the lifecycle of cryptographic assets post-migration.
- **Inventory**:
  - _T2 Risk-Informed · all_: Conduct a comprehensive discovery and analysis of the cryptographic estate to identify all algorithms and protocols in use.
  - _T2 Risk-Informed · all_: Maintain a detailed cryptographic inventory for each specific telecom use case to support migration planning.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Develop and execute a remediation plan to migrate cryptographic systems to Post-Quantum algorithms.
  - _T2 Risk-Informed · all_: Analyze migration strategies and assess the impact of Post-Quantum Cryptography on specific system use cases.
  - _T2 Risk-Informed · all_: Define a migration process description and timeline (Gantt Chart) for transitioning to Post-Quantum Cryptography.

## IETF RFC 5649

- **Source**: Advanced Encryption Standard (AES) Key Wrap with Padding Algorithm
- **URL**: https://www.rfc-editor.org/rfc/rfc5649
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · keys_: Ensure key-encryption algorithms are at least as strong as other cryptographic algorithms employed in the overall system.
  - _T2 Risk-Informed · keys_: Restrict the use of AES Key Wrap and AES Key Wrap with Padding algorithms solely to the protection of cryptographic keying material.
  - _T2 Risk-Informed · keys_: Protect the key-encryption key (KEK) to prevent disclosure of all wrapped keys and compromise of protected traffic.

## IETF-ML-KEM-for-TLS-1.3

- **Source**: draft-ietf-tls-mlkem-07 - ML-KEM Post-Quantum Key Agreement for TLS 1.3
- **Requirement count**: 5
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Ensure ML-KEM keypair reuse counts adhere to FIPS 203 bounds if reuse is implemented.
  - _T2 Risk-Informed · keys_: Prohibit the reuse of randomness during the generation of ML-KEM ciphertexts.
- **Observability**:
  - _T2 Risk-Informed · software_: Abort TLS connections with an illegal_parameter alert if the client's encapsulation key fails the FIPS 203 check.
  - _T2 Risk-Informed · software_: Abort TLS connections with an illegal_parameter alert if the ciphertext length does not match the selected parameter set.
  - _T2 Risk-Informed · software_: Abort TLS connections with an internal_error alert if ML-KEM decapsulation fails for any reason.

## IETF-RFC-7465

- **Source**: RFC 7465: Prohibiting RC4 Cipher Suites
- **URL**: https://www.rfc-editor.org/rfc/rfc7465
- **Requirement count**: 2
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Configure TLS clients to exclude RC4 cipher suites from ClientHello messages.
  - _T3 Repeatable · software_: Configure TLS servers to reject RC4 cipher suite selection and terminate handshakes if only RC4 is offered.

## IETF-RFC-8996

- **Source**: RFC 8996: Deprecating TLS 1.0 and 1.1
- **URL**: https://www.rfc-editor.org/rfc/rfc8996
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · software_: Establish policy mandating a minimum protocol version of TLS 1.2 or DTLS 1.2 for all deployments.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Prohibit negotiation of TLS 1.0 and TLS 1.1 in all implementations and close connections attempting to use these versions.
  - _T3 Repeatable · software_: Deprecate and remove support for DTLS 1.0, ensuring implementations do not negotiate this version.

## KMIP-V2-1-OASIS

- **Source**: Key Management Interoperability Protocol (KMIP) Version 2.1
- **URL**: https://docs.oasis-open.org/kmip/kmip-spec/v2.1/os/kmip-spec-v2.1-os.html
- **Requirement count**: 10
- **Governance**:
  - _T2 Risk-Informed · keys_: Define and enforce cryptographic usage masks to restrict key operations to authorized purposes.
  - _T2 Risk-Informed · keys_: Establish policies for key extraction restrictions to prevent unauthorized key material exposure.
  - _T2 Risk-Informed · keys_: Implement access controls by defining rights and roles for key management operations.
- **Inventory**:
  - _T2 Risk-Informed · keys_: Categorize cryptographic assets using object groups and types for effective estate management.
  - _T3 Repeatable · keys_: Maintain a complete inventory of cryptographic objects by querying and locating all managed keys.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Automate key rotation by configuring rotate interval and automatic rotation attributes.
  - _T3 Repeatable · keys_: Enforce key destruction schedules by setting destroy dates and executing destroy operations.
  - _T3 Repeatable · keys_: Manage key state transitions including activation, deactivation, and compromise handling.
- **Observability**:
  - _T2 Risk-Informed · keys_: Track key usage limits and monitor for threshold breaches to ensure compliance.
  - _T3 Repeatable · keys_: Enable audit logging of key management operations to detect policy drift and unauthorized access.

## NIST CSWP 39

- **Source**: Considerations for Achieving Cryptographic Agility
- **URL**: https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.39.pdf
- **Requirement count**: 9
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a comprehensive strategic and tactical plan integrating crypto agility into the organization's overall risk management framework.
  - _T2 Risk-Informed · all_: Ensure employees, partners, and suppliers involved in cryptographic design and deployment consider and adopt crypto agility practices.
  - _T2 Risk-Informed · all_: Establish a systems approach to provide mechanisms enabling transitions to alternative algorithms while limiting vulnerable algorithm use.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify and coordinate among stakeholders including protocol designers, implementers, operators, and executives to manage crypto agility.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Implement capabilities to replace and adapt cryptographic algorithms in protocols, applications, and infrastructure without disrupting operations.
  - _T2 Risk-Informed · all_: Facilitate migrations between cryptographic algorithms without significant changes to the application using them.
  - _T2 Risk-Informed · all_: Adopt new cryptographic algorithms and stop the use of vulnerable algorithms in applications without disrupting the running system.
  - _T2 Risk-Informed · all_: Maintain interoperability when introducing new cryptographic algorithms and prevent the use of vulnerable algorithms in protocols.
  - _T2 Risk-Informed · all_: Seamlessly and rapidly transition away from vulnerable cryptographic algorithms and adopt new, stronger ones without significant infrastructure changes.

## NIST CSWP 48

- **Source**: Mappings of Migration to PQC Project Capabilities to Risk Framework Documents
- **URL**: https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.48.ipd.pdf
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Adhere to security objectives and controls identified in risk framework documents to ensure responsible implementation of PQC migration capabilities.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify and inventory cryptographic assets including hardware, software, and services to support risk management and prioritization decisions.
  - _T2 Risk-Informed · software_: Discover quantum-vulnerable cryptographic algorithms used in code development pipelines, software development lifecycle, and repository components.
  - _T2 Risk-Informed · software_: Discover quantum-vulnerable cryptographic algorithms in network services, protocols, and end-user systems including applications and libraries.
  - _T3 Repeatable · all_: Correlate cryptographic discovery tool outputs with previously inventoried hardware, software, and services to maintain a comprehensive asset view.

## NIST IR 8105

- **Source**: Report on Post-Quantum Cryptography
- **URL**: https://nvlpubs.nist.gov/nistpubs/ir/2016/NIST.IR.8105.pdf
- **Requirement count**: 2
- **Governance**:
  - _T2 Risk-Informed · all_: Establish documented plans to prepare information security systems for resistance against quantum computing threats.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Prioritize crypto agility to facilitate the migration from current cryptosystems to quantum-resistant counterparts.

## NIST IR 8547

- **Source**: Transition to Post-Quantum Cryptography Standards
- **URL**: https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf
- **Requirement count**: 1
- **Governance**:
  - _T2 Risk-Informed · all_: Establish a documented transition strategy to adopt post-quantum algorithms and deprecate quantum-vulnerable ones.

## NIST NCCoE SP 1800-38A

- **Source**: Migration to Post-Quantum Cryptography: Preparation for Considering the Implementation and Adoption of Quantum Safe Cryptography
- **URL**: https://www.nccoe.nist.gov/sites/default/files/2023-04/pqc-migration-nist-sp-1800-38a-preliminary-draft.pdf
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a risk-based playbook for migration involving people, processes, and technology to mitigate enterprise risk.
- **Inventory**:
  - _T2 Risk-Informed · all_: Establish complete visibility and inventory of cryptography usage across the organization, including partners and data associations, to prioritize migration.
  - _T3 Repeatable · all_: Deploy discovery tools to detect and report the presence of quantum-vulnerable cryptography in systems, services, and development pipelines.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan for the replacement or update of hardware, software, and services using quantum-vulnerable algorithms to protect against future attacks.

## NIST SP 800-108

- **Source**: Recommendation for Key Derivation Using Pseudorandom Functions
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-108r1-upd1.pdf
- **Requirement count**: 2
- **Governance**:
  - _T2 Risk-Informed · keys_: Document and enforce mitigations for key control risks when using CMAC as the pseudorandom function in key derivation.
  - _T2 Risk-Informed · keys_: Establish policy to prefer HMAC or KMAC over CMAC for key derivation unless AES is the only primitive or resource constraints dictate otherwise.

## NIST SP 800-207

- **Source**: Zero Trust Architecture
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-207.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Formulate specific policies for the Zero Trust Architecture candidate based on identified risks and processes.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify all actors, assets, and key processes within the enterprise to establish a baseline for Zero Trust deployment.
- **Observability**:
  - _T2 Risk-Informed · all_: Implement monitoring capabilities during the initial deployment phase to observe the Zero Trust Architecture.

## NIST SP 800-208

- **Source**: Recommendation for Stateful Hash-Based Signature Schemes
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-208.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Validate implementations of specified functions through the Cryptographic Algorithm Validation Program (CAVP) and Cryptographic Module Validation Program (CMVP).
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Implement strict state maintenance procedures to prevent one-time signature key reuse, which compromises security.

## NIST SP 800-227

- **Source**: Recommendations for Key-Encapsulation Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Implement approved KEMs only within FIPS 140-validated cryptographic modules to ensure compliance with federal security standards.
  - _T3 Repeatable · software_: Ensure conforming implementations of approved KEMs satisfy all requirements specified in NIST standards and undergo validation.

## NIST SP 800-56A

- **Source**: Recommendation for Pair-Wise Key-Establishment Schemes Using Discrete Logarithm Cryptography
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-56Ar3.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
  - _T3 Repeatable · keys_: Implementers must validate that key-establishment implementations conform to this recommendation via CAVP and CMVP frameworks.
  - _T3 Repeatable · keys_: Entities deploying this standard must ensure requirements indicated by 'shall' are met, even if out-of-scope for CAVP or CMVP validation.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Key pair owners must provide assurance of correct generation, private-key validity, public-key validity, pair-wise consistency, and possession of the private key.
  - _T3 Repeatable · keys_: Public key recipients must validate static and ephemeral public keys and verify the owner's possession of the corresponding private keys.
  - _T3 Repeatable · keys_: Implementers must execute specific public key validation routines, including full and partial validation for FFC and ECC schemes.
  - _T3 Repeatable · keys_: Organizations must manage key pairs according to common requirements for static and ephemeral pairs and specific requirements for each type.
  - _T3 Repeatable · keys_: Implementers must manage domain parameters, including selection, generation, and ensuring assurances of their validity.

## NIST SP 800-90

- **Source**: Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90Ar1.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Document the DRBG implementation details including the specific mechanism, parameters, and security strength used.
  - _T3 Repeatable · software_: Implement health testing for DRBG functions including Instantiate, Generate, Reseed, and Uninstantiate to verify correct operation.
  - _T3 Repeatable · software_: Perform Known Answer Testing (KAT) to validate the DRBG implementation against standard test vectors.
  - _T3 Repeatable · software_: Implement error handling procedures for errors encountered during normal operation and during health testing.
- **Governance**:
  - _T2 Risk-Informed · keys_: Ensure entropy input and seed privacy are maintained to prevent compromise of the DRBG internal state.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Reseed the DRBG instantiation at the end of the seed life to maintain security strength.
  - _T3 Repeatable · keys_: Securely remove DRBG instantiations by executing the Uninstantiate function to clear internal state.

## NIST SP 800-90A

- **Source**: Recommendation for Random Number Generation Using Deterministic Random Bit Generators Rev 1
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90Ar1.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Maintain minimal documentation for the DRBG implementation to support validation and operational understanding.
  - _T3 Repeatable · software_: Implement health testing procedures including Known Answer Tests for Instantiate, Generate, Reseed, and Uninstantiate functions to verify correct operation.
  - _T3 Repeatable · software_: Define and implement error handling procedures for errors encountered during normal operation and during health testing.
  - _T3 Repeatable · software_: Conduct implementation validation testing to ensure the DRBG mechanism conforms to the specified algorithmic requirements.

## NIST SP 800-90B

- **Source**: Recommendation for the Entropy Sources Used for Random Bit Generation
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-90B.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Conduct conformance testing for entropy source implementations within the CAVP and CMVP frameworks to validate compliance with specified requirements.
  - _T3 Repeatable · software_: Ensure that requirements indicated by the word 'shall' are met by entities using, implementing, installing, or configuring applications, even if out-of-scope for CAVP or CMVP validation.

## NIST-CSWP-36A

- **Source**: Protecting Subscriber Identifiers with Subscription Concealed Identifier (SUCI): Applying 5G Cybersecurity and Privacy Capabilities
- **URL**: https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.36A.ipd.pdf
- **Requirement count**: 7
- **Governance**:
  - _T2 Risk-Informed · keys_: Configure SUCI to use a non-null encryption cipher scheme to conceal subscriber identifiers, except for emergency services access.
  - _T2 Risk-Informed · keys_: Restrict the use of null encryption schemes for SUCI to scenarios where the device is unknown or requesting emergency services.
- **Inventory**:
  - _T2 Risk-Informed · keys_: Verify that SUCI is configured to use a non-null encryption cipher scheme.
  - _T2 Risk-Informed · software_: Verify that 5G equipment vendors support the SUCI capability before deployment.
  - _T2 Risk-Informed · software_: Confirm that SUCI is enabled on the operator's 5G networks.
  - _T2 Risk-Informed · software_: Ensure that SUCI information is available on subscribers' SIMs.
- **Observability**:
  - _T2 Risk-Informed · software_: Monitor network traffic and device logs to verify that SUPI is being encrypted into ciphertext.

## NIST-FIPS140-3-IG-PQC

- **Source**: FIPS 140-3 Implementation Guidance for Post-Quantum Cryptography
- **URL**: https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Implement continuous monitoring and logging of self-test failures to detect cryptographic module anomalies immediately.
- **Governance**:
  - _T2 Risk-Informed · software_: Define and document the security policy for each cryptographic module to ensure consistent implementation of approved functions.
- **Inventory**:
  - _T2 Risk-Informed · software_: Maintain a documented list of all cryptographic components and their validation status to ensure only approved modules are deployed.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · software_: Establish a process for managing Common Vulnerabilities and Exposures (CVEs) affecting validated cryptographic modules.
- **Observability**:
  - _T3 Repeatable · software_: Configure modules to perform periodic self-tests and report results to ensure ongoing compliance with security requirements.

## NIST-PQC-Workshop-Yassir-2020

- **Source**: NIST PQC Workshop — Post-Quantum Cryptography Standardization Presentation (Yassir 2020)
- **Requirement count**: 6
- **Governance**:
  - _T2 Risk-Informed · all_: Uplift cryptographic policy to explicitly address post-quantum cryptography requirements.
  - _T3 Repeatable · software_: Mandate that systems are certified for crypto agility before initiating post-quantum cryptography transition.
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify and inventory high-risk data assets to prioritize protection during the post-quantum transition.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · software_: Ensure the cryptographic solution provider supports the application and its data throughout the entire lifecycle.
  - _T2 Risk-Informed · software_: Require cryptographic solutions to maintain backward compatibility to process ciphertext generated by older versions.
  - _T2 Risk-Informed · software_: Commit cryptographic solutions to supporting future NIST standards, including post-quantum cryptography.

## NIST-SP-800-230-ipd

- **Source**: Additional SLH-DSA Parameter Sets for Limited-Signature Use Cases (Initial Public Draft)
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-230.ipd.pdf
- **Requirement count**: 2
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Evaluate specific use cases to ensure the 2^24 signature limit is never exceeded during a signing key's lifetime.
  - _T2 Risk-Informed · keys_: Assess the number of signing devices, signature generation frequency, and intended operational lifespan to prevent exceeding the signature limit.

## NIST-SP-800-38D

- **Source**: Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode (GCM) and GMAC
- **URL**: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-38d.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Validate implementations against this recommendation within the Cryptographic Module Validation Program (CMVP) framework.
- **Governance**:
  - _T2 Risk-Informed · all_: Adhere to requirements indicated by the word 'shall' to ensure conformance with the standard.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Ensure uniqueness of initialization vectors (IVs) for every key to prevent security compromise.
  - _T2 Risk-Informed · keys_: Establish keys and construct IVs according to specified deterministic or RBG-based methods to maintain uniqueness.

## Quantum-Ready-FN-DSA-FIPS-206-Nears-Draft-Approval-from-NIST-DigiCert

- **Source**: Quantum-Ready FN-DSA (FIPS 206) Nears Draft Approval from NIST | DigiCert
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · certificates_: Establish a policy to delay production implementation of FN-DSA until the standard is finalized to avoid naming and OID confusion.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · certificates_: Plan for the integration of FN-DSA into root and intermediate certificates while evaluating its suitability for leaf certificates based on signing frequency.
  - _T2 Risk-Informed · software_: Initiate preparation activities including exploring draft algorithms and testing implementations to build crypto-agility for future standard finalization.

## RFC 4251

- **Source**: The Secure Shell (SSH) Protocol Architecture
- **URL**: https://www.rfc-editor.org/rfc/rfc4251.html
- **Requirement count**: 6
- **Governance**:
  - _T2 Risk-Informed · keys_: Define policy specifying preferred encryption, integrity, compression, and public key algorithms for each direction.
  - _T2 Risk-Informed · keys_: Establish policy defining public key algorithms and key exchange methods for host authentication based on trusted host keys.
  - _T2 Risk-Informed · keys_: Implement policy to reject unverified host keys by default to mitigate man-in-the-middle risks.
  - _T2 Risk-Informed · software_: Configure server policy to require specific authentication methods per user, potentially based on user location.
- **Inventory**:
  - _T2 Risk-Informed · keys_: Maintain a local database or CA trust store associating host names with public host keys for verification.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Implement a process to save new host keys locally upon first connection and compare against them on future connections.

## RFC 4301

- **Source**: Security Architecture for the Internet Protocol
- **URL**: https://www.rfc-editor.org/rfc/rfc4301.html
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document security policies for IPsec traffic flows, including access control rules and cryptographic algorithm selection, to ensure consistent deployment across the organization.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Implement mechanisms for both manual and automated management of Security Associations and cryptographic keys to support key lifecycle operations.
  - _T2 Risk-Informed · keys_: Support manual and automated techniques for Security Association and key management to facilitate the establishment, maintenance, and termination of cryptographic sessions.
- **Observability**:
  - _T2 Risk-Informed · all_: Establish auditing capabilities to monitor and record IPsec security events, ensuring visibility into policy enforcement and traffic processing.

## RFC 4303

- **Source**: IP Encapsulating Security Payload (ESP)
- **URL**: https://www.rfc-editor.org/rfc/rfc4303.html
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · software_: Configure management interfaces to support integrity-only ESP as a selectable service option.
  - _T2 Risk-Informed · software_: Ensure SA management protocols support negotiation of the Extended Sequence Number feature for interoperability.
- **Observability**:
  - _T2 Risk-Informed · software_: Implement anti-replay services by verifying sequence numbers to detect replayed packets.

## RFC 5280

- **Source**: Internet X.509 Public Key Infrastructure Certificate and CRL Profile
- **URL**: https://www.rfc-editor.org/rfc/rfc5280.html
- **Requirement count**: 5
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Implement certification path validation procedures that derive consistent results for certificate chains.
  - _T3 Repeatable · certificates_: Encode public key materials and digital signatures according to specified standards when using identified algorithms.
  - _T3 Repeatable · certificates_: Mark the policy mappings extension as critical in certificates.
  - _T3 Repeatable · certificates_: Mark the policy constraints extension as critical in certificates.
- **Observability**:
  - _T3 Repeatable · certificates_: Detect and mitigate risks of circular dependencies in CRL distribution points and access extensions.

## RFC 6962

- **Source**: Certificate Transparency
- **URL**: https://www.rfc-editor.org/rfc/rfc6962.html
- **Requirement count**: 3
- **Observability**:
  - _T3 Repeatable · certificates_: Monitor certificate logs regularly to detect unexpected certificate issuance for domains under your control.
  - _T3 Repeatable · certificates_: Verify log integrity by demanding proofs of inclusion for certificates to detect incorrect log operation.
  - _T3 Repeatable · certificates_: Detect log misbehavior by comparing tree roots and consistency proofs to identify divergent log states.

## RFC 9420

- **Source**: The Messaging Layer Security (MLS) Protocol
- **URL**: https://www.rfc-editor.org/rfc/rfc9420.html
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Establish policy for handling unknown extension values by ignoring them while ensuring senders insert random GREASE values to test extensibility compliance.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Implement automated key rotation and state evolution using asynchronous ratcheting trees to ensure forward secrecy and post-compromise security without manual intervention.
  - _T3 Repeatable · keys_: Enforce strict validation of credential expiry and revocation status before accepting client credentials to maintain group integrity.
- **Observability**:
  - _T3 Repeatable · software_: Detect and reject malformed protocol messages, including those with invalid variable-length integer encodings or non-minimal bit usage, to prevent state desynchronization.
  - _T3 Repeatable · software_: Monitor for and provide clear error reporting when vector sizes exceed available storage to prevent resource exhaustion attacks.

## RFC 9847

- **Source**: IANA Registry Updates for TLS and DTLS
- **URL**: https://www.rfc-editor.org/rfc/rfc9847.html
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · software_: Establish documented policy prohibiting the use of TLS mechanisms marked as discouraged in IANA registries.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · software_: Retire or disable TLS cipher suites using NULL encryption, EXPORT, anon, RC4, DES, IDEA, MD5, or SHA-1 as they are marked discouraged.
  - _T2 Risk-Informed · software_: Retire or disable TLS supported groups (elliptic curves) marked as discouraged in the IANA registry.
  - _T2 Risk-Informed · software_: Retire or disable TLS hash algorithms marked as discouraged, specifically MD5, SHA-1, and SHA-224.
- **Observability**:
  - _T2 Risk-Informed · software_: Maintain an inventory of deployed TLS mechanisms and cross-reference against IANA registry 'Recommended' status to detect discouraged items.

## RFC-9763

- **Source**: Related Certificates for Use in Multiple Authentications within a Protocol
- **URL**: https://www.rfc-editor.org/rfc/rfc9763.html
- **Requirement count**: 7
- **Governance**:
  - _T2 Risk-Informed · certificates_: Define local policy to determine sufficient freshness for CSR request times.
  - _T2 Risk-Informed · certificates_: Establish local policy to assess the suitability of related certificates, including validity period remaining.
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Retrieve and validate the referenced certificate using standard path validation rules before issuing a new certificate.
  - _T3 Repeatable · certificates_: Verify the signature in the CSR attribute using the public key of the referenced certificate to confirm ownership.
  - _T3 Repeatable · certificates_: Ensure the related certificate contains the key usage and extended key usage OIDs asserted in the new certificate.
  - _T3 Repeatable · certificates_: Restrict the RelatedCertificate extension to end-entity certificates only within certificate chains.
  - _T3 Repeatable · certificates_: Include only certificates listed in the CSR's relatedCertRequest attribute within the RelatedCertificate extension.

## RFC-9935

- **Source**: Internet X.509 PKI — Algorithm Identifiers for ML-KEM
- **URL**: https://www.rfc-editor.org/rfc/rfc9935
- **Requirement count**: 4
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Retain and export the seed value when generating ML-KEM private keys to ensure deterministic key derivation and prevent irreversible loss of the seed.
  - _T2 Risk-Informed · keys_: Use the seed format for ML-KEM private keys as the recommended representation to ensure compact storage and efficient key management.
  - _T2 Risk-Informed · keys_: Include the public key and expanded private key in the seed-only format to enable key pair consistency checks during import operations.
- **Observability**:
  - _T2 Risk-Informed · keys_: Parse ML-KEM private keys using explicit ASN.1 context-specific tags rather than heuristics like length to correctly identify key variants.

## Signal-PQXDH-Spec

- **Source**: PQXDH: The Post-Quantum Extended Diffie-Hellman Protocol
- **URL**: https://signal.org/docs/specifications/pqxdh/
- **Requirement count**: 7
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document specific parameter sets including curves, hash functions, and PQKEM algorithms for the application.
  - _T2 Risk-Informed · keys_: Implement logic to distinguish between one-time and last-resort PQKEM keys to manage key usage policies.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Delete previous private keys for signed prekeys after a retention period to ensure forward secrecy.
  - _T3 Repeatable · keys_: Delete ephemeral private keys and shared secrets immediately after calculating the session key.
  - _T3 Repeatable · keys_: Rotate signed curve and last-resort PQKEM prekeys periodically and replace previous values on the server.
  - _T3 Repeatable · keys_: Delete one-time prekeys from the server immediately after they are used in a protocol run.
- **Observability**:
  - _T2 Risk-Informed · keys_: Verify signatures on all prekeys before protocol execution and abort if validation fails.
