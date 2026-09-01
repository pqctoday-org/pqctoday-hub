---
generated: 2026-08-31
category: Technical Standards
document_count: 1
requirement_count: 4
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
