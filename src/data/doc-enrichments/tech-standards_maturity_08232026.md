---
generated: 2026-08-23
category: Technical Standards
document_count: 31
requirement_count: 134
---

## BSI-AIS-20-31
- **Source**: AIS 20/AIS 31: Functionality Classes and Evaluation Methodology for Deterministic and Physical Random Number Generators
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Certification/Interpretations/AIS_31_Functionality_classes_for_random_number_generators_e_2024.pdf?__blob=publicationFile&v=3
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Subject RNGs must undergo formal evaluation against defined functionality classes within the Common Criteria certification scheme to prove compliance.
    - _T3 Repeatable · libraries_: Developers and evaluators must use this document as the mathematical-technical reference for certifying RNGs in the German CC scheme.
- **Governance**:
    - _T2 Risk-Informed · all_: Organizations must assign specific RNG functionality classes to cryptographic applications based on the security evaluation of the consuming devices.
    - _T2 Risk-Informed · all_: Implementations must adhere to BSI technical guidelines (e.g., TR 02102) which recommend appropriate functionality classes for implemented RNGs.

## ETSI-GS-QKD-008
- **Source**: ETSI GS QKD 008 - QKD Module Security Specification
- **URL**: https://www.etsi.org/deliver/etsi_gs/qkd/001_099/008/01.01.01_60/gs_qkd008v010101p.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Conduct pre-operational and conditional self-tests to verify critical functions and module integrity before and during operation.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document a QKD Module Security Policy specifying identification, authentication, access control, and physical security rules.
    - _T2 Risk-Informed · all_: Define roles and authentication mechanisms for operators to ensure authorized access to QKD module services.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Implement procedures for Sensitive Security Parameter (SSP) generation, establishment, entry, output, storage, and zeroization.
    - _T2 Risk-Informed · software_: Establish configuration management processes covering design, finite state modeling, development, vendor testing, and delivery.

## FIPS 186-5
- **Source**: Digital Signature Standard (DSS)
- **URL**: https://csrc.nist.gov/pubs/fips/186-5/final
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Use only cryptographic modules and algorithms approved for protecting Federal Government-sensitive information.
    - _T3 Repeatable · software_: Ensure any module implementing digital signature capability is designed and built in a secure manner.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a responsible authority to ensure the overall implementation provides an acceptable level of security.
    - _T2 Risk-Informed · keys_: Restrict digital signature key pairs from being used for other purposes.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Guard against the disclosure of private keys to maintain the security of the digital signature system.

## FIPS 203
- **Source**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure cryptographic modules implementing ML-KEM are designed and built securely, as conformance to the standard alone does not guarantee implementation security.
    - _T3 Repeatable · software_: Ensure the overall system implementation provides an acceptable level of security, as using a conforming product does not guarantee overall system security.
    - _T3 Repeatable · software_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations complying with this standard.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Guard against the disclosure of the decapsulation key, shared secret key, and randomness used by parties to maintain security guarantees.

## FIPS 204
- **Source**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure cryptographic modules implementing the standard are designed and built in a secure manner by the implementer.
    - _T3 Repeatable · libraries_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a responsible authority to ensure the overall implementation provides an acceptable level of security.
    - _T2 Risk-Informed · keys_: Guard against the disclosure of private keys to maintain the security of the digital signature system.
    - _T2 Risk-Informed · keys_: Restrict digital signature key pairs from being used for purposes other than digital signatures.

## FIPS 205
- **Source**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure cryptographic modules implementing this standard are validated for conformance via the NIST validation program.
    - _T3 Repeatable · software_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations.
- **Governance**:
    - _T2 Risk-Informed · keys_: Assign a responsible authority to ensure the overall implementation provides an acceptable level of security.
    - _T2 Risk-Informed · keys_: Prohibit the use of digital signature key pairs for purposes other than digital signatures.
    - _T2 Risk-Informed · keys_: Guard against the disclosure of private keys to maintain the security of the digital signature system.

## GSMA PQ.03 PQC Guidelines
- **Source**: Post-Quantum Cryptography Guidelines for Telecom Use Cases
- **URL**: https://www.gsma.com/newsroom/wp-content/uploads/PQ.03-Post-Quantum-Cryptography-Guidelines-for-Telecom-Use-Cases-v2.0-2.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Validate firmware and middleware compatibility for Post-Quantum Cryptography implementations to ensure correct operation.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a prioritized migration plan with defined governance, stakeholder engagement, and risk analysis for Post-Quantum Cryptography adoption.
    - _T2 Risk-Informed · all_: Implement ongoing crypto-governance processes to manage the operational phase of Post-Quantum Cryptography deployment.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct a comprehensive cryptographic discovery and analysis to identify all cryptographic assets, algorithms, and protocols within the telecom ecosystem.
    - _T2 Risk-Informed · all_: Maintain detailed cryptographic inventories for specific use cases, including sensitive data discovery and algorithmic dependencies.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop and execute a phased remediation strategy for migrating cryptographic algorithms, including hybrid schemes and legacy system handling.

## GSMA-PQ03-v2-2024
- **Source**: GSMA PQ.03 Post-Quantum Cryptography Guidelines for Telecom Use Cases v2.0
- **URL**: https://www.gsma.com/newsroom/wp-content/uploads//PQ.03-Post-Quantum-Cryptography-Guidelines-for-Telecom-Use-Cases-v2.0-2.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Validate firmware and software implementations for PQC compatibility and security, ensuring middleware compatibility and infrastructure capacity.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a governance framework and decision-making process for PQC migration, including prioritization and stakeholder engagement.
    - _T2 Risk-Informed · all_: Perform business risk analysis to prioritize PQC migration efforts based on the sensitivity of data and criticality of network functions.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct a comprehensive cryptographic discovery and analysis to identify all cryptographic assets, algorithms, and protocols within the telecom ecosystem.
    - _T2 Risk-Informed · certificates_: Maintain a detailed cryptographic inventory for each specific use case, identifying sensitive data, cryptographic tools, and PKI implications.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop and execute a phased migration plan for transitioning cryptographic assets to post-quantum secure algorithms, including remediation execution.
    - _T2 Risk-Informed · keys_: Plan for the issuance and management of hybrid X.509 certificates and PQC key pairs, addressing dependencies and legacy system impacts.

## IETF RFC 8391
- **Source**: XMSS: eXtended Merkle Signature Scheme
- **URL**: https://www.rfc-editor.org/rfc/rfc8391.html
- **Requirement count**: 2
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Implement systems that prevent the reuse of secret key states to maintain cryptographic security guarantees.
    - _T3 Repeatable · software_: Modify digital signature APIs to handle and return updated secret key states, as classical APIs are insufficient.

## IETF RFC 8554
- **Source**: Leighton-Micali Hash-Based Signatures
- **URL**: https://www.rfc-editor.org/rfc/rfc8554.html
- **Requirement count**: 3
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Implement systems that strictly prevent the reuse of secret key states, as reuse destroys cryptographic security guarantees and enables forgery.
    - _T3 Repeatable · keys_: Ensure that once a private key value is used to sign a message, it is never used to sign another message.
    - _T3 Repeatable · software_: Modify digital signature APIs to handle dynamic secret key states, allowing the signature-generation algorithm to update the state after each use.

## IETF RFC 8784
- **Source**: Mixing Preshared Keys in IKEv2 for Post-quantum Security
- **URL**: https://www.rfc-editor.org/rfc/rfc8784.html
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · keys_: Define and document policy flags specifying whether the use of a specific PPK is mandatory or optional for communication with each responder.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Maintain a documented inventory of Post-quantum Preshared Keys (PPKs) and their unique identifiers (PPK_ID) for each IKE peer.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Enforce strict lifecycle boundaries by ensuring PPKs are used only during initial IKE SA setup and MUST NOT be used during rekey, resumption, or other subsequent operations.
- **Observability**:
    - _T3 Repeatable · software_: Implement automated detection and abort mechanisms when mandatory PPK usage is configured but the peer does not support or configure the required PPK.
    - _T3 Repeatable · software_: Automatically detect and fail negotiations if the responder does not recognize the PPK_ID provided by the initiator, ensuring immediate visibility into key mismatch errors.

## IETF-MTC-Draft-09
- **Source**: Merkle Tree Certificates (draft-ietf-plants-merkle-tree-certs-04)
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-plants-merkle-tree-certs/04/
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · certificates_: Define and manage trusted cosigners who verify correct operation and optionally mirror logs, establishing a multi-party trust model for certificate validity.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Implement automated log pruning to remove long-expired entries, ensuring log size scales by retention policy rather than log lifetime.
- **Observability**:
    - _T3 Repeatable · certificates_: Maintain public issuance logs where CAs sign views of their logs to assert issuance, enabling verification of correct operation via cosignatures.

## NIST-SP-800-56C-R2
- **Source**: Recommendation for Key-Derivation Methods in Key-Establishment Schemes (Revision 2)
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-56Cr2.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Entities using, implementing, installing, or configuring applications incorporating this Recommendation are responsible for requirements that may be out of scope for CAVP or CMVP validation testing.
    - _T3 Repeatable · software_: Ensure implementations of specified key-derivation functions undergo conformance testing within the CAVP and CMVP frameworks to validate cryptographic correctness.

## NIST-SP-800-63-3
- **Source**: NIST SP 800-63-4 Digital Identity Guidelines
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-63-4.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Establish processes for redress to address errors in identity proofing or authentication, ensuring program integrity and trust.
    - _T2 Risk-Informed · all_: Implement measures to maintain cybersecurity, fraud prevention, and identity program integrity throughout the digital identity lifecycle.
- **Governance**:
    - _T2 Risk-Informed · all_: Conduct initial impact assessment to identify potential harms and determine combined impact levels for user groups to inform assurance level selection.
    - _T2 Risk-Informed · all_: Tailor and document assurance levels by assessing privacy, customer experience, and threat resistance, and identifying compensating and supplemental controls.
    - _T2 Risk-Informed · all_: Create a Digital Identity Acceptance Statement to formally document the selected assurance levels and control baselines for the online service.
- **Observability**:
    - _T3 Repeatable · all_: Continuously evaluate and improve digital identity services using defined performance metrics and evaluation inputs to detect drift or issues.

## RFC 4251
- **Source**: The Secure Shell (SSH) Protocol Architecture
- **URL**: https://www.rfc-editor.org/rfc/rfc4251.html
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Implement mechanisms to verify host key correctness, such as comparing against a local database or using external channels for fingerprint verification.
    - _T2 Risk-Informed · software_: Provide configuration options to reject connections where host keys cannot be verified, preventing man-in-the-middle attacks.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document configuration policies for encryption, integrity, compression, public key, and key exchange algorithms, including preferred algorithm ordering.
    - _T2 Risk-Informed · keys_: Establish policy for host authentication methods and public key algorithms, considering the availability of trusted host keys for different algorithms.
    - _T2 Risk-Informed · software_: Define server-side policies requiring specific authentication methods for users, potentially based on user identity or access location.
    - _T2 Risk-Informed · software_: Define policies restricting the operations users are allowed to perform via the connection protocol to address security concerns.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Maintain a local database or CA-based trust store associating host names with public host keys to verify server identity.

## RFC 4301
- **Source**: Security Architecture for the Internet Protocol
- **URL**: https://www.rfc-editor.org/rfc/rfc4301.html
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Define and maintain Security Policy Database (SPD) entries that specify selectors and actions for IP traffic to enforce access control policies.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Support both manual and automated techniques for Security Association and key management to handle key establishment and maintenance.
- **Observability**:
    - _T3 Repeatable · all_: Implement auditing capabilities to record security-relevant events and actions within the IPsec system for review and analysis.

## RFC 4303
- **Source**: IP Encapsulating Security Payload (ESP)
- **URL**: https://www.rfc-editor.org/rfc/rfc4303.html
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · software_: Ensure ESP implementations support integrity-only service selection via management interfaces and SA management protocols.
    - _T2 Risk-Informed · software_: Ensure ESP implementations support confidentiality and integrity service combinations as mandatory service options.
    - _T2 Risk-Informed · software_: Ensure SA management protocols can negotiate the Extended Sequence Number feature for interoperable anti-replay service.
- **Observability**:
    - _T2 Risk-Informed · software_: Implement auditing capabilities for ESP processing as specified in the standard.

## RFC 5083
- **Source**: Using Advanced Encryption Standard (AES) Counter with CBC-MAC (AES-CCM) and AES Galois/Counter Mode (AES-GCM) Algorithms in the Cryptographic Message Syntax (CMS)
- **URL**: https://www.rfc-editor.org/rfc/rfc5083.html
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Verify the integrity of received authenticated-enveloped-data before releasing any plaintext; if verification fails, immediately destroy all recovered plaintext.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Generate a fresh, random content-authenticated-encryption key for each distinct content item to prevent key reuse and ensure proper key lifecycle management.

## RFC 5280
- **Source**: Internet X.509 Public Key Infrastructure Certificate and CRL Profile
- **URL**: https://www.rfc-editor.org/rfc/rfc5280.html
- **Requirement count**: 2
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Implementers MUST derive identical results from the certification path validation algorithm to ensure consistent certificate lifecycle processing and trust evaluation.
    - _T3 Repeatable · certificates_: Conforming implementations MUST identify and encode public key materials and digital signatures as described in RFC 3279, RFC 4055, and RFC 4491 when using those algorithms.

## RFC 6962
- **Source**: Certificate Transparency
- **URL**: https://www.rfc-editor.org/rfc/rfc6962.html
- **Requirement count**: 3
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Submit newly issued certificate chains to public certificate transparency logs to obtain signed timestamps for issuance evidence.
- **Observability**:
    - _T3 Repeatable · certificates_: Monitor public certificate logs regularly to detect unauthorized or misissued certificates for domains under your control.
    - _T3 Repeatable · certificates_: Verify certificate inclusion in logs by demanding Merkle audit proofs from logs to ensure logged certificates are present and valid.

## RFC 7515
- **Source**: JSON Web Signature (JWS)
- **URL**: https://www.rfc-editor.org/rfc/rfc7515.html
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · certificates_: Implementers MUST NOT use SHA-1 for certificate thumbprints due to collision vulnerabilities.
    - _T2 Risk-Informed · keys_: Implementers MUST authenticate the origin of keys used for signing or verification to prevent unauthorized key usage.
    - _T2 Risk-Informed · keys_: Implementers MUST protect keys from unauthorized access and disclosure during storage and use.
    - _T2 Risk-Informed · software_: Implementers MUST validate the algorithm specified in the JOSE Header to prevent algorithm substitution attacks.
    - _T2 Risk-Informed · software_: Implementers MUST protect against algorithm downgrade attacks by enforcing allowed algorithms.
    - _T2 Risk-Informed · software_: Implementers MUST use constant-time comparison for signature verification to prevent timing attacks.
    - _T2 Risk-Informed · software_: Implementers MUST protect against replay attacks by validating timestamps or nonces where applicable.

## RFC 7517
- **Source**: JSON Web Key (JWK)
- **URL**: https://www.rfc-editor.org/rfc/rfc7517.html
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Ensure key entropy and random values are generated using a cryptographically secure random number generator to prevent compromise.
    - _T2 Risk-Informed · keys_: Protect private key material from disclosure by ensuring it is not exposed in logs, error messages, or unauthorized transmissions.
- **Governance**:
    - _T2 Risk-Informed · keys_: Register custom JWK parameter names in the IANA registry or use collision-resistant names to ensure standardized governance of key metadata.
    - _T2 Risk-Informed · keys_: Register extension values for key use and operations in IANA registries when operating in open environments to maintain common understanding.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Assign a unique Key ID (kid) to every JWK to enable distinct identification and tracking within the cryptographic estate.

## RFC 8725
- **Source**: JSON Web Token Best Current Practices
- **URL**: https://www.rfc-editor.org/rfc/rfc8725.html
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure JWT libraries validate cryptographic inputs, such as elliptic curve points, against specified standards before use to prevent key recovery attacks.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document the set of cryptographically current algorithms acceptable for JWT usage, ensuring they meet specific application security requirements.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Establish policies ensuring symmetric keys used for signing JWTs possess sufficient entropy to resist offline brute-force or dictionary attacks.
    - _T3 Repeatable · keys_: Enforce strict binding between cryptographic keys and specific algorithms, verifying this association during every cryptographic operation to prevent misuse.
- **Observability**:
    - _T3 Repeatable · software_: Implement automated validation of all cryptographic operations within JWTs, rejecting the entire token if any validation step fails, including nested structures.

## RFC 9449
- **Source**: OAuth 2.0 Demonstrating Proof of Possession (DPoP)
- **URL**: https://www.rfc-editor.org/rfc/rfc9449.html
- **Requirement count**: 5
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Generate a unique DPoP proof JWT for every HTTP request to ensure fresh cryptographic binding and prevent replay of proof artifacts.
    - _T3 Repeatable · keys_: Bind issued access and refresh tokens to the public key presented in the DPoP proof to constrain token usage to the key holder.
- **Observability**:
    - _T3 Repeatable · keys_: Verify that the public key in the received DPoP proof matches the public key to which the access token is bound.
    - _T3 Repeatable · keys_: Validate the signature of the DPoP proof JWT to confirm possession of the corresponding private key before processing the request.
    - _T3 Repeatable · keys_: Verify that the access token hash within the DPoP proof matches the access token presented in the request to ensure integrity.

## RFC-9162
- **Source**: Certificate Transparency Version 2.0
- **URL**: https://www.rfc-editor.org/rfc/rfc9162
- **Requirement count**: 3
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Submit all newly issued public TLS certificates to one or more Certificate Transparency logs.
- **Observability**:
    - _T3 Repeatable · certificates_: Monitor CT logs regularly to detect unauthorized certificate issuance for domains under your control.
    - _T3 Repeatable · certificates_: Verify inclusion proofs for certificates to ensure they are present in the CT log and detect log misbehavior.

## RFC-9258
- **Source**: Importing External Pre-Shared Keys (PSKs) for TLS 1.3
- **URL**: https://datatracker.ietf.org/doc/html/rfc9258
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · keys_: Minimize the transition period for noncompliant configurations where PSKs are reused across TLS 1.2 and 1.3 during incremental deployment.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Provision separate PSKs for TLS 1.3 and prior versions to prevent related outputs and security problems from key reuse.
    - _T3 Repeatable · keys_: Ensure each external PSK is associated with at most one hash function to satisfy source-independence requirements for KDFs.
    - _T3 Repeatable · keys_: Restrict imported keys to TLS PSK usage only; do not use input keys for other purposes or derived keys for non-TLS purposes.
    - _T3 Repeatable · keys_: Include channel binding and context information in ImportedIdentity to mitigate reflection attacks and ensure proper key context.
    - _T3 Repeatable · keys_: Provision ALPN, QUIC transport parameters, and other early data settings alongside EPSKs when importing for early data use.
    - _T3 Repeatable · keys_: Deprecate hash functions by removing corresponding KDFs from the set of target KDFs used for importing keys.

## Rosenpass-Protocol
- **Source**: Rosenpass: Formally Verified Post-Quantum Protocol for WireGuard
- **URL**: https://rosenpass.eu/whitepaper.pdf
- **Requirement count**: 3
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Manage cryptographic library dependencies by phasing out deprecated hash functions (BLAKE2b) in favor of approved alternatives (SHAKE256).
    - _T3 Repeatable · keys_: Automate ephemeral key generation and immediate zeroization of temporary variables to ensure forward secrecy and prevent key recovery from hardware theft.
    - _T3 Repeatable · keys_: Enforce automated key exchange intervals (130s initiator, 120s responder) to regularly rotate shared keys and maintain post-quantum secure connections.

## SEC2-v2
- **Source**: SEC 2 v2: Recommended Elliptic Curve Domain Parameters
- **URL**: https://www.secg.org/sec2-v2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Implement a validation process to verify that cryptographic implementations use a subset of the recommended parameters to claim compliance.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Establish a policy to select ECC domain parameters from the SEC 2 recommended list to ensure interoperability and standard compliance.
    - _T2 Risk-Informed · libraries_: Define a review cycle for cryptographic parameters to ensure they remain up to date with cryptographic advances.

## draft-ietf-cose-falcon-04
- **Source**: FN-DSA for JOSE and COSE
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-cose-falcon/04/
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Implement FN-DSA with constant-time Gaussian sampling to prevent side-channel leakage, as required by the algorithm's security properties.
- **Governance**:
    - _T2 Risk-Informed · software_: Profiles relying on Hash Envelope with FN-DSA must explicitly specify permitted hash algorithms and the verification procedure.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Validate all algorithm-related key parameters, including ensuring the 'alg' value matches the intended algorithm variant, before using FN-DSA public keys.
    - _T3 Repeatable · keys_: Ensure FN-DSA public key representations are of the AKP key type and contain the public key value before use.

## draft-ietf-pquip-hbs-state
- **Source**: Hash-based Signatures: State and Backup Management
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-pquip-hbs-state/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Assess operational costs and training needs for personnel managing Stateful HBS state and backup complexities.
- **Governance**:
    - _T2 Risk-Informed · keys_: Define policy restricting Stateful HBS to use cases with tight signing environment control, avoiding general-purpose unrestricted signing.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Implement automated state updates for every signature generation to prevent OTS key reuse and ensure correct index tracking.
    - _T3 Repeatable · keys_: Enforce synchronization mechanisms for distributed signers to prevent concurrent use of the same OTS key.
    - _T3 Repeatable · keys_: Establish procedures for merging state from different devices or handling partial state transfers to avoid overlap and failure.
    - _T3 Repeatable · keys_: Design backup mechanisms that strictly prevent the restoration and reuse of previously consumed OTS keys.
- **Observability**:
    - _T3 Repeatable · keys_: Configure and monitor warning thresholds for state consumption to detect approaching signature limits or anomalies.

## draft-ietf-tls-ecdhe-mlkem-04
- **Source**: Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3
- **URL**: https://www.ietf.org/archive/id/draft-ietf-tls-ecdhe-mlkem-05.txt
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure ML-KEM implementation is FIPS-certified when deploying X25519MLKEM768 to meet regulatory compliance requirements.
    - _T3 Repeatable · libraries_: Ensure ECDH implementation is FIPS-certified when deploying SecP256r1MLKEM768 or SecP384r1MLKEM1024 to meet regulatory compliance requirements.
