---
generated: 2026-08-08
category: Technical Standards
document_count: 3
requirement_count: 11
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

## draft-ietf-tls-ecdhe-mlkem-04
- **Source**: Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLSv1.3
- **URL**: https://www.ietf.org/archive/id/draft-ietf-tls-ecdhe-mlkem-05.txt
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure ML-KEM implementation is FIPS-certified when deploying X25519MLKEM768 to meet regulatory compliance requirements.
    - _T3 Repeatable · libraries_: Ensure ECDH implementation is FIPS-certified when deploying SecP256r1MLKEM768 or SecP384r1MLKEM1024 to meet regulatory compliance requirements.

## draft-ietf-tls-ecdhe-mlkem-05
- **Source**: Post-quantum hybrid ECDHE-MLKEM Key Agreement for TLS 1.3 (draft-ietf-tls-ecdhe-mlkem-05)
- **URL**: https://www.ietf.org/archive/id/draft-ietf-tls-ecdhe-mlkem-05.html
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure ML-KEM implementation is FIPS-certified when using X25519MLKEM768, or ECDH implementation is certified for SecP256r1/384r1 hybrids.
    - _T3 Repeatable · software_: Implement side-channel attack resistance for KEM operations, particularly against remote attackers, per NIST SP 800-227 guidelines.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Deprecate and remove support for experimental pre-standard Kyber768 code points (25497, 25498) in favor of ratified ML-KEM identifiers.
