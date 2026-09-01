---
generated: 2026-09-01
category: Technical Standards
document_count: 1
requirement_count: 5
---

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
