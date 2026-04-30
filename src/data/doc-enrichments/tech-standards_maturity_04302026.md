---
generated: 2026-04-30
category: Technical Standards
document_count: 11
requirement_count: 39
---

## ETSI-GS-QKD-008

- **Source**: ETSI GS QKD 008 - QKD Module Security Specification
- **URL**: https://www.etsi.org/deliver/etsi_gs/qkd/001_099/008/01.01.01_60/gs_qkd008v010101p.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Conduct pre-operational and conditional self-tests to verify the integrity of critical functions and cryptographic operations.
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document a QKD Module Security Policy specifying identification, authentication, access control, physical security, and attack mitigation measures.
- **Inventory**:
  - _T2 Risk-Informed · all_: Maintain documentation requirements summarizing the security attributes and configuration of the QKD module.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Implement procedures for the generation, establishment, entry, output, storage, and zeroization of Sensitive Security Parameters (SSPs).
  - _T2 Risk-Informed · software_: Establish configuration management processes covering design, development, vendor testing, and delivery to ensure module integrity.

## IETF RFC 8391

- **Source**: XMSS: eXtended Merkle Signature Scheme
- **URL**: https://www.rfc-editor.org/rfc/rfc8391.html
- **Requirement count**: 2
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Implement systems that strictly prevent the reuse of secret key states to maintain cryptographic security guarantees.
  - _T3 Repeatable · software_: Modify digital signature APIs to explicitly handle and manage the changing state of secret keys.

## IETF RFC 8554

- **Source**: Leighton-Micali Hash-Based Signatures
- **URL**: https://www.rfc-editor.org/rfc/rfc8554.html
- **Requirement count**: 2
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Implement strict state management to prevent reuse of secret key states; APIs must update state after every signature generation to maintain security guarantees.
  - _T3 Repeatable · keys_: Enforce single-use policy for private key states; once a specific private key value is used to sign a message, it MUST NOT be used to sign another message.

## ITU-T-X509-2019

- **Source**: ITU-T X.509 (2019): Public-key and attribute certificate frameworks (ISO/IEC 9594-8)
- **URL**: https://www.itu.int/rec/T-REC-X.509-201910-I/en
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · certificates_: Define and document certificate policies to govern the issuance, validation, and trust relationships of public-key and attribute certificates within the PKI framework.
- **Inventory**:
  - _T2 Risk-Informed · certificates_: Maintain a directory schema that allows PKI and PMI related data, including certificates and revocation lists, to be stored and managed systematically.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · certificates_: Implement mechanisms for certificate revocation by maintaining and distributing Certificate Revocation Lists (CRLs) and Attribute Certificate Revocation Lists (ACRLs).
- **Observability**:
  - _T2 Risk-Informed · certificates_: Utilize authorization validation lists to enable fast validation of certificates and enforce restrictions on communications to detect policy drift.

## NIST-SP-800-131A-Rev3

- **Source**: Transitioning the Use of Cryptographic Algorithms and Key Lengths (Rev 3)
- **URL**: https://csrc.nist.gov/pubs/sp/800/131/a/r3/ipd
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Establish documented key-management procedures and policies to define appropriate cryptographic usage and plan for algorithm transitions.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Implement procedures to transition to stronger cryptographic keys and retire deprecated algorithms according to the defined schedule.
  - _T2 Risk-Informed · software_: Plan for the retirement of specific algorithms (ECB, DSA, SHA-1) and transition to quantum-resistant algorithms as specified.

## NIST-SP-800-56C-R2

- **Source**: Recommendation for Key-Derivation Methods in Key-Establishment Schemes (Revision 2)
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-56Cr2.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
  - _T3 Repeatable · libraries_: Ensure implementations of specified key-derivation functions undergo conformance testing within the CAVP and CMVP frameworks to validate cryptographic correctness.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Define and agree upon the content, format, length, and generation method for any auxiliary shared secrets used in hybrid key-establishment schemes before deriving keying material.
  - _T2 Risk-Informed · keys_: Restrict the usage of derived keying material to secret keying material purposes such as encryption or integrity, and prohibit its use as a stream cipher key stream.

## RFC 9802

- **Source**: Use of HSS and XMSS Hash-Based Signature Algorithms in X.509 PKI
- **URL**: https://www.rfc-editor.org/rfc/rfc9802.html
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · certificates_: Define certificate policies specifying exact conditions for stateful HBS usage, restricting deployment to use cases with predictable signature counts and controlled signing environments.
  - _T2 Risk-Informed · certificates_: Restrict stateful HBS public keys in certificates to use cases with a predictable range of signatures falling safely below the maximum capacity.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Implement mechanisms for secure private key backup and restoration to manage stateful HBS keys, ensuring state persistence and preventing OTS key reuse.
- **Observability**:
  - _T3 Repeatable · keys_: Enforce state management strategies to track OTS key usage and prevent reuse, ensuring the private key state is updated and persisted after every signing operation.

## RFC 9810

- **Source**: Certificate Management Protocol (CMP) Updates for KEM
- **URL**: https://www.rfc-editor.org/rfc/rfc9810.html
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · certificates_: Define and document the roles and responsibilities of PKI entities (CA, RA, KGA) to ensure consistent administration and reduce operational risk.
  - _T2 Risk-Informed · certificates_: Establish policies for authorizing certificate requests based on specific Extended Key Usages (EKUs) to enforce role-based access control within the PKI.
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Implement automated Proof-of-Possession (POP) mechanisms for KEM keys during certificate issuance and key updates to verify private key control.
  - _T3 Repeatable · certificates_: Support automated Root CA key updates via protocol messages (RootCaKeyUpdateContent) to facilitate seamless trust anchor rotation without manual repository intervention.
- **Observability**:
  - _T3 Repeatable · certificates_: Utilize Certificate Transparency (CT) logs to monitor and detect unauthorized certificate issuance or policy drift in the PKI ecosystem.

## draft-ietf-lamps-pq-composite-kem-12

- **Source**: Composite ML-KEM for Use in X.509 PKI and CMS
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Assess FIPS certification implications when deploying hybrid schemes, particularly regarding combiner functions and non-approved algorithms.
- **Governance**:
  - _T2 Risk-Informed · all_: Define and document a policy for acceptable and deprecated algorithms to guide the selection of composite KEMs.
  - _T2 Risk-Informed · certificates_: Select a limited set of composite algorithms based on organizational needs rather than implementing all registered options.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · certificates_: Plan for backwards compatibility to ensure upgraded systems interoperate with legacy systems during migration.

## draft-ietf-lamps-pq-composite-sigs-15

- **Source**: Composite ML-DSA for Use in X.509 PKI and CMS
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-sigs/
- **Requirement count**: 3
- **Assurance / FIPS**:
  - _T2 Risk-Informed · libraries_: Assess whether deploying hybrid PQC algorithms invalidates existing FIPS certifications or compliance audits before implementation.
- **Governance**:
  - _T2 Risk-Informed · certificates_: Define policy for selecting a limited set of composite algorithms based on organizational environment needs rather than implementing all registered options.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · certificates_: Plan for the transition from traditional to hybrid algorithms as a stepping stone, acknowledging that PQ modules may not yet be fully hardened or certified.

## draft-ietf-pquip-hbs-state

- **Source**: Hash-based Signatures: State and Backup Management
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-pquip-hbs-state/
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Define operational policies restricting Stateful HBS deployment to environments with tight control, such as hardware security modules, due to state management risks.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Implement automated state synchronization and integrity checks to prevent OTS key reuse across distributed signers or after backup restoration.
  - _T3 Repeatable · keys_: Enforce strict backup management procedures that guarantee restored state does not lead to the reuse of previously consumed One-Time Signature keys.
- **Observability**:
  - _T3 Repeatable · keys_: Monitor and verify that the state counter is correctly updated after every signature generation to detect and prevent state drift or failure.
