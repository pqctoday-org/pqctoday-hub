---
generated: 2026-08-30
category: Technical Standards
document_count: 6
requirement_count: 19
---

## NIST SP 800-208
- **Source**: Recommendation for Stateful Hash-Based Signature Schemes
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-208.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure implementations conform to the specification through Cryptographic Algorithm Validation Program (CAVP) and Cryptographic Module Validation Program (CMVP) testing frameworks.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Implementers are responsible for managing the state of keys to prevent reuse, as state maintenance is critical for the security of stateful hash-based signature schemes.

## NIST SP 800-227
- **Source**: Recommendations for Key-Encapsulation Mechanisms
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Implement approved KEMs within FIPS 140-validated cryptographic modules to ensure compliance with federal security standards.
    - _T3 Repeatable · libraries_: Ensure conforming implementations of approved KEMs satisfy all requirements specified in the standard.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Comply with NIST standards and validation requirements when implementing KEMs.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Manage cryptographic data associated with KEMs according to the guidelines provided for secure implementation.

## RFC 9802
- **Source**: Use of HSS and XMSS Hash-Based Signature Algorithms in X.509 PKI
- **URL**: https://www.rfc-editor.org/rfc/rfc9802.html
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · certificates_: Define certificate policies specifying conditions for stateful HBS use, ensuring predictable signature counts and secure signing environments.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Implement state management strategies to track OTS key usage and prevent reuse, including secure backup and restoration mechanisms.
- **Observability**:
    - _T3 Repeatable · certificates_: Enforce key usage extensions in CA certificates to include only digitalSignature, nonRepudiation, keyCertSign, or cRLSign for HBS algorithms.
    - _T3 Repeatable · certificates_: Enforce key usage extensions in end-entity certificates to include only digitalSignature, nonRepudiation, or cRLSign for HBS algorithms.

## draft-ietf-ipsecme-ikev2-mlkem
- **Source**: Post-quantum Hybrid Key Exchange with ML-KEM in IKEv2
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-ipsecme-ikev2-mlkem/
- **Requirement count**: 1
- **Observability**:
    - _T2 Risk-Informed · software_: Log errors when ciphertext validation fails during key exchange to enable detection of protocol anomalies or attacks.

## draft-ietf-lamps-cms-kyber-13
- **Source**: Use of ML-KEM in the Cryptographic Message Syntax (CMS)
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-lamps-cms-kyber/
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Implementations MUST confirm that the derived key length (L) is consistent with the key size of the key-encryption algorithm used.
    - _T3 Repeatable · software_: Implementations supporting ML-KEM-512 MUST support AES-Wrap-128; those supporting ML-KEM-768/1024 MUST support AES-Wrap-256 for key encryption.
    - _T3 Repeatable · software_: Implementations MUST support HKDF with SHA-256 for key derivation when using ML-KEM in CMS.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Implementations MUST protect ML-KEM private keys, key-encryption keys, content-encryption keys, and message-authentication keys during use and storage.

## draft-ietf-lamps-pq-composite-kem-12
- **Source**: Composite ML-KEM for Use in X.509 PKI and CMS
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-lamps-pq-composite-kem/
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Maintain documentation on the FIPS certification status of component modules, acknowledging that PQ components may not yet be fully certified.
- **Governance**:
    - _T2 Risk-Informed · all_: Define and document a policy for selecting a limited set of composite algorithms from the standard, rather than implementing all registered options.
    - _T2 Risk-Informed · all_: Establish a documented policy for determining which algorithms are deprecated and which are acceptable for use within the hybrid scheme.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Implement processes for Certificate Authorities to check for previous key revocation when handling composite keys to prevent key reuse vulnerabilities.
