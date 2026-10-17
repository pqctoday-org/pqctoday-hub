---
generated: 2026-10-17
category: Technical Standards
document_count: 1
requirement_count: 11
---

## ANSSI-s-views-on-crypto-agility
- **Source**: ANSSI’s views on crypto-agility
- **URL**: https://messervices.cyber.gouv.fr/documents-guides/ANSSI-views-on-crypto-agility.pdf
- **Requirement count**: 11
- **Governance**:
    - _T2 Risk-Informed · all_: Consider crypto-agility features during the benefit/risk analysis of future products or systems.
    - _T2 Risk-Informed · all_: Conduct a threat analysis and evaluation of the worst-case implementation before implementing crypto-agility.
    - _T3 Repeatable · all_: Ensure algorithm selection/negotiation cannot result in an undesired algorithm; do not allow deprecated algorithms in new systems; restrict security downgrade, with cipher-suite blacklists or minimal configuration such as TLS_FALLBACK_SCSV.
    - _T3 Repeatable · all_: Protect cryptographic configuration with authentication (or at least integrity) methods and anti-replay means.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: For static (non-updatable) implementations, implement from the outset all algorithms the product may need and use configuration to select the desired subset.
    - _T3 Repeatable · all_: Implement algorithmic crypto-agility wherever the context allows; otherwise use the highest-security parameter set, and consider parameterisation agility only if efficiency prevents that.
    - _T3 Repeatable · all_: Implement crypto-agility consistently across all sub-systems so that components (e.g. protocols, signature handling) can adapt to new algorithm outputs and sizes.
    - _T3 Repeatable · keys_: Implement crypto-agility without breaking system functionality; handle old and new keys during transitions and size the system for the worst-case cryptographic volume and timing.
    - _T3 Repeatable · keys_: Do not use the same update keys across multiple devices, and protect the update key using a hardware security element.
    - _T3 Repeatable · software_: Protect integrity and authenticity of updates with the highest-confidence cryptographic mechanisms; do not share update keys across devices and protect the update key with a hardware security element.
    - _T3 Repeatable · software_: Implement protection against replay of outdated updates for software updates.
