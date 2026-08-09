---
generated: 2026-08-09
category: Technical Standards
document_count: 4
requirement_count: 21
---

## FIPS 186-5
- **Source**: Digital Signature Standard (DSS)
- **URL**: https://csrc.nist.gov/pubs/fips/186-5/final
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Use only cryptographic algorithms and key generation techniques approved for protecting Federal Government-sensitive information.
    - _T3 Repeatable · libraries_: Ensure cryptographic modules implementing digital signatures are validated for conformance to the standard.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a responsible authority to ensure the overall implementation provides an acceptable level of security.
    - _T2 Risk-Informed · keys_: Establish policies to guard against the disclosure of signatory private keys to maintain system security.
    - _T2 Risk-Informed · keys_: Enforce policy that digital signature key pairs are not used for other purposes.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for the transition from FIPS 186-4 to FIPS 186-5 within the one-year transition period.

## FIPS 203
- **Source**: Module-Lattice-Based Key-Encapsulation Mechanism Standard (ML-KEM)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.203.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Validate implementations for conformance to the ML-KEM algorithms using the NIST validation program.
    - _T3 Repeatable · libraries_: Ensure cryptographic modules implementing ML-KEM are designed and built in a secure manner by the implementer.
- **Governance**:
    - _T2 Risk-Informed · all_: Ensure the overall implementation provides an acceptable level of security, as conformance to the standard does not guarantee system security.
    - _T2 Risk-Informed · all_: Use only cryptographic algorithms approved for protecting Federal Government-sensitive information in implementations.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Guard against the disclosure of the decapsulation key, shared secret key, and randomness used by the parties.

## FIPS 204
- **Source**: Module-Lattice-Based Digital Signature Standard (ML-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure cryptographic modules implementing this standard are designed and built securely by the implementer.
    - _T3 Repeatable · libraries_: Utilize only cryptographic algorithms approved for protecting Federal Government-sensitive information in digital signature implementations.
    - _T3 Repeatable · software_: Verify that the overall implementation provides an acceptable level of security, as conformance to the standard alone does not guarantee security.
- **Governance**:
    - _T2 Risk-Informed · keys_: Establish policy prohibiting the use of digital signature key pairs for purposes other than digital signatures.
    - _T2 Risk-Informed · keys_: Implement controls to guard against the disclosure of signatory private keys to maintain system security.

## FIPS 205
- **Source**: Stateless Hash-Based Digital Signature Standard (SLH-DSA)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure modules implementing digital signature capabilities are designed and built in a secure manner.
    - _T3 Repeatable · software_: Employ only cryptographic algorithms approved for protecting Federal Government-sensitive information.
- **Governance**:
    - _T2 Risk-Informed · keys_: Assign a responsible authority to ensure the overall implementation provides an acceptable level of security.
    - _T2 Risk-Informed · keys_: Prohibit the use of digital signature key pairs for purposes other than digital signatures.
    - _T2 Risk-Informed · keys_: Guard against the disclosure of signatory private keys to maintain system security.
