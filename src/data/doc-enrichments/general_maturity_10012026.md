---
generated: 2026-10-01
category: Technical Standards
document_count: 1
requirement_count: 6
---

## Security-Considerations-for-ML-DSA
- **Source**: Security Considerations for ML-DSA
- **URL**: https://www.ietf.org/archive/id/draft-connolly-cfrg-ml-dsa-security-considerations-02.txt
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · keys_: Assess side-channel attack possibilities and use implementations resistant to such leakage.
    - _T2 Risk-Informed · keys_: Use hedged signing mode to mitigate fault injection and side-channel attacks.
    - _T2 Risk-Informed · keys_: Use available randomness sources for signing rather than falling back to deterministic signing on constrained platforms.
    - _T2 Risk-Informed · keys_: Define a fixed context string for a given protocol's use case to prevent cross-protocol attacks.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Zeroize signing keys when no longer needed to prevent later compromise.
    - _T2 Risk-Informed · keys_: Securely delete cached expanded signing key material when no longer needed.
