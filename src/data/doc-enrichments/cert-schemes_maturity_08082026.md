---
generated: 2026-08-08
category: Certification Schemes
document_count: 1
requirement_count: 9
---

## NIST-SP-800-90A-R1
- **Source**: SP 800-90A Rev. 1: Recommendation for Random Number Generation Using Deterministic Random Bit Generators
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/a/r1/final
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Conduct implementation validation testing by an independent, accredited party to ensure DRBG mechanisms conform to specifications.
    - _T3 Repeatable · libraries_: Perform health testing immediately prior to or during normal operation to verify the DRBG mechanism continues to perform as validated.
    - _T3 Repeatable · libraries_: Use entropy input from an approved entropy source validated as conforming to SP 800-90B.
    - _T3 Repeatable · libraries_: Ensure the seed contains sufficient min-entropy to support the instantiated security strength of the DRBG.
    - _T3 Repeatable · libraries_: Maintain minimal documentation for DRBG implementations to support validation and operational integrity.
- **Governance**:
    - _T2 Risk-Informed · all_: Assign responsibility for requirements out-of-scope for CMVP/CAVP to entities using, implementing, installing, or configuring applications.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Reseed the DRBG at the end of the seedlife to maintain security strength and prevent state exhaustion.
- **Observability**:
    - _T3 Repeatable · libraries_: Implement health tests for Instantiate, Generate, Reseed, and Uninstantiate functions to detect operational failures.
    - _T3 Repeatable · libraries_: Handle errors encountered during health testing to ensure the DRBG mechanism does not produce output when compromised.
