---
generated: 2026-08-15
category: Standardization Bodies
document_count: 1
requirement_count: 5
---

## ENISA PQC Guidelines
- **Source**: Post-Quantum Cryptography: Current State and Quantum Mitigation
- **URL**: https://www.enisa.europa.eu/publications/post-quantum-cryptography-current-state-and-quantum-mitigation
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Perform a thorough risk and cost-benefit analysis before implementing hybrid PQC or pre-shared key mixing strategies to mitigate quantum threats.
    - _T2 Risk-Informed · all_: Adopt a transition strategy that waits for national authorities to standardize PQC algorithms and provide a defined transition path.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Deploy AES-256 to mitigate the reduction in security level caused by Grover's algorithm on symmetric cryptography.
    - _T2 Risk-Informed · keys_: Plan for the timely roll-over of signature keys, acknowledging that timing the transition remains uncertain due to non-public quantum developments.
    - _T2 Risk-Informed · software_: Ensure post-quantum signature systems are in place before quantum computers arrive to prevent attackers from compromising OS upgrades.
