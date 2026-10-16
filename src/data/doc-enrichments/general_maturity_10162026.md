---
generated: 2026-10-16
category: Technical Standards
document_count: 1
requirement_count: 4
---

## BSI-Hinweise-zu-aktuellen-Entwicklungen-um-Classic-McEliece
- **Source**: BSI: Hinweise zu aktuellen Entwicklungen um Classic McEliece
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/DE/BSI/Krypto/Hinweis_Classic_McEliece.pdf?__blob=publicationFile&v=2
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Ensure crypto-agility in the transition to Post-Quantum Cryptography to mitigate risks from cryptanalytic progress.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Do not use Classic McEliece in new developments or planning of new cryptographic applications.
    - _T2 Risk-Informed · keys_: Use FrodoKEM, ML-KEM, or HQC for key agreement in new developments, per TR-02102-1 recommendations.
    - _T2 Risk-Informed · keys_: Complete the transition to Post-Quantum Cryptography for key agreement by the end of 2031.
