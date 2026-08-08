---
generated: 2026-08-08
category: Technical Standards
document_count: 1
requirement_count: 6
---

## FIPS-198
- **Source**: FIPS 198-1, The Keyed-Hash Message Authentication Code (HMAC)
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.198-1.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Ensure modules containing HMAC implementations are designed and built in a secure manner.
    - _T3 Repeatable · libraries_: Implement HMAC using cryptographic algorithms and key management techniques approved for protecting Federal government sensitive information.
    - _T3 Repeatable · libraries_: Use an Approved cryptographic hash function for HMAC calculations.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Ensure keys used for HMAC applications are not used for other purposes.
    - _T3 Repeatable · keys_: Hash keys longer than the block size using the Approved hash function before use in HMAC.
    - _T3 Repeatable · keys_: Use only the leftmost bits of the HMAC output when truncation is applied.
