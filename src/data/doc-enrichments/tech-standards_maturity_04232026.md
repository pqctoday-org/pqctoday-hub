---
generated: 2026-04-23
category: Technical Standards
document_count: 2
requirement_count: 10
---

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

## RFC 9881

- **Source**: Algorithm Identifiers for ML-DSA in X.509 PKI
- **URL**: https://www.rfc-editor.org/rfc/rfc9881.html
- **Requirement count**: 5
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Configure CA implementations to explicitly specify ML-DSA algorithms using the defined OIDs when encoding signatures in certificates and CRLs.
  - _T3 Repeatable · certificates_: Ensure client implementations recognize the specific OIDs defined for ML-DSA when processing certificates and CRLs.
  - _T3 Repeatable · certificates_: Enforce that the keyUsage extension in certificates containing ML-DSA public keys includes at least one of: digitalSignature, nonRepudiation, keyCertSign, or cRLSign.
  - _T3 Repeatable · certificates_: Prohibit the use of keyEncipherment, dataEncipherment, keyAgreement, encipherOnly, or decipherOnly bits in the keyUsage extension for certificates containing ML-DSA public keys.
  - _T3 Repeatable · keys_: Adopt the seed format for encoding ML-DSA private keys to efficiently store both private and public key components.
