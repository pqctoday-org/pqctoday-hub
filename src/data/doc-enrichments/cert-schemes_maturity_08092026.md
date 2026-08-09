---
generated: 2026-08-09
category: Certification Schemes
document_count: 1
requirement_count: 5
---

## NIST-SP-800-90C
- **Source**: SP 800-90C: Recommendation for Random Bit Generator (RBG) Constructions
- **URL**: https://csrc.nist.gov/pubs/sp/800/90/c/final
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Validate RBG constructions against SP 800-90C via CMVP/CAVP to prove compliance with specified security strengths and operational tests.
    - _T3 Repeatable · libraries_: Ensure entropy sources used in RBG constructions are validated for compliance with SP 800-90B to guarantee sufficient min-entropy.
- **Governance**:
    - _T2 Risk-Informed · all_: Adopt SP 800-90C requirements for RBG design and implementation, distinguishing between testable 'shall' requirements and administrative 'must' requirements.
- **Lifecycle / CLM**:
    - _T3 Repeatable · libraries_: Manage RBG instantiation and reseeding lifecycles using validated randomness sources (SP 800-90B/90C compliant) to maintain security strength.
- **Observability**:
    - _T3 Repeatable · libraries_: Implement health tests for entropy sources and non-entropy components; halt output and trigger failure handling upon test failure.
