---
generated: 2026-11-12
category: Technical Standards
document_count: 2
requirement_count: 13
---

## BIS-Paper-158
- **Source**: BIS Paper 158 — Quantum-Readiness Roadmap for Financial Systems
- **URL**: https://www.bis.org/publ/bppdf/bispap158.pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Implement robust governance structures for quantum-safe transition.
    - _T2 Risk-Informed · keys_: Mitigate Grover's-algorithm risk to symmetric cryptography by using AES with 256-bit keys for sensitive and classified information.
- **Inventory**:
    - _T2 Risk-Informed · all_: Organisations should initiate quantum-safe cryptographic transition preparations now, with broad internal awareness and a cryptographic inventory as critical foundations.
    - _T2 Risk-Informed · all_: Maintain comprehensive cryptographic inventories as part of quantum-readiness preparation.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: For long-lived signatures still valid when a CRQC exists, revoke and re-sign or counter-sign contracts with quantum-safe signatures.
    - _T3 Repeatable · software_: Legacy systems relying on TLS 1.2 should upgrade to TLS 1.3, which can support post-quantum algorithms, because TLS 1.2 cannot be configured with them.
    - _T3 Repeatable · software_: Equip devices that authenticate software updates with post-quantum digital signature verification at manufacture so they can verify future quantum-proof code signing.

## SAND2022-1118
- **Source**: Distributed Energy Resource Cybersecurity Standards Development - Final Project Report (SAND2022-1118)
- **URL**: https://www.osti.gov/servlets/purl/1843109
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Use established cybersecurity standards for DER communications and avoid proprietary security technologies.
    - _T2 Risk-Informed · certificates_: Establish a single root of trust for all utilities, DER aggregators, and OEM vendors using a neutral, third-party-operated root CA.
    - _T2 Risk-Informed · certificates_: Require mutual authentication between all systems and devices.
    - _T2 Risk-Informed · software_: Require at least TLS 1.2 and recommend TLS 1.3 for all DER communications.
    - _T2 Risk-Informed · software_: Adopt modern cipher suites possessing strong capabilities for DER communications.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Require key management through PKI with certificate revocation.
