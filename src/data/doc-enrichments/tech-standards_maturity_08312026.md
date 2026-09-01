---
generated: 2026-08-31
category: Technical Standards
document_count: 2
requirement_count: 9
---

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
