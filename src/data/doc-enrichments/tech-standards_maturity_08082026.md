---
generated: 2026-08-08
category: Technical Standards
document_count: 1
requirement_count: 6
---

## NIST SP 800-90A
- **Source**: Recommendation for Random Number Generation Using Deterministic Random Bit Generators Rev 1
- **URL**: https://csrc.nist.gov/publications/detail/sp/800-90a/rev-1/final
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Perform implementation validation testing using known answer tests to verify the correctness of the DRBG mechanism before deployment.
    - _T3 Repeatable · libraries_: Execute health tests on the Instantiate, Generate, Reseed, and Uninstantiate functions to detect implementation errors during operation.
    - _T3 Repeatable · libraries_: Implement error handling procedures to manage errors encountered during normal operation and health testing of the DRBG.
- **Governance**:
    - _T2 Risk-Informed · libraries_: Maintain minimal documentation for the DRBG implementation, including the algorithm used, security strength, and entropy source details.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Enforce automatic reseeding of the DRBG at the end of the seedlife to maintain cryptographic strength and prevent state exhaustion.
    - _T3 Repeatable · keys_: Securely remove the DRBG instantiation and its internal state when it is no longer needed to prevent leakage of sensitive material.
