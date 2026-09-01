---
generated: 2026-08-31
category: Compliance Frameworks
document_count: 4
requirement_count: 16
---

## EO-14306
- **Source**: Executive Order 14306 — Sustaining Select Cybersecurity Efforts (PQC Provisions)
- **URL**: https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/
- **Requirement count**: 3
- **Governance**:
    - _T4 Adaptive · all_: Participate in or align with pilot programs establishing rules-as-code approaches for machine-readable cybersecurity policy.
- **Inventory**:
    - _T2 Risk-Informed · software_: Monitor CISA-released list of product categories where post-quantum cryptography products are widely available.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Support TLS 1.3 or successor versions by January 2, 2030, to prepare for post-quantum cryptography transition.

## EUCC v2.0 ACM
- **Source**: EU Cybersecurity Certification Agreed Cryptographic Mechanisms v2.0
- **URL**: https://certification.enisa.europa.eu/document/download/f4657490-9757-4a97-8deb-fd4d6a1358ee_en?filename=EUCC_guidelines_Agreed+Cryptographic+Mechanisms+v2.pdf
- **Requirement count**: 2
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Evaluators should verify that protection profiles and ICT products preferably rely on agreed cryptographic mechanisms as defined in ACM v2 to provide the security services evaluated under the EUCC scheme.
- **Governance**:
    - _T2 Risk-Informed · all_: Developers of protection profiles and ICT products should consider using the agreed cryptographic mechanisms defined in ACM v2 when deciding which mechanisms cover their need for cryptographic protection.

## EUDI-Wallet-ARF
- **Source**: EUDI Wallet ARF v3.0.0
- **URL**: https://raw.githubusercontent.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/v2.9.0/docs/architecture-and-reference-framework-main.md
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Implement Wallet Solution certification processes and risk management frameworks as defined in the ecosystem architecture.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a structured cooperation framework with Member States and the Commission to exchange best practices and advise on policy initiatives for digital identity wallets.
    - _T2 Risk-Informed · all_: Align implementation with the legally binding European Digital Identity Regulation and its adopted implementing and delegated acts.

## NSA CNSA 2.0 FAQ
- **Source**: CNSA 2.0 Frequently Asked Questions
- **URL**: https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Implement QR algorithms in NSS mission systems as NIAP validated products or with modules validated by NIST CMVP.
    - _T3 Repeatable · software_: Use only FIPS-validated LMS or XMSS hash-based signatures for firmware and software signing in NSS.
    - _T3 Repeatable · software_: Ensure signature verification code for NSS is validated by NIST’s Cryptographic Algorithm Validation Program (CAVP).
    - _T3 Repeatable · software_: Require NSS code sources (signers) to produce signatures using hardware validated by NIST CMVP; no waivers granted.
- **Governance**:
    - _T2 Risk-Informed · all_: Follow CJCSN 65104 and CNSSAM 01-07-NSM for high-grade equipment cryptographic modernization planning.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Transition all NSS products using public-standard algorithms from Suite B or CNSA 1.0 to CNSA 2.0 algorithms in a timely fashion.
    - _T3 Repeatable · all_: Upgrade currently fielded NSS to CNSA 2.0 in a timely fashion unless a waiver is obtained through the approved process.
    - _T3 Repeatable · software_: Implement signing and state management for LMS/XMSS in hardware (e.g., HSM) to prevent state reuse and weaken security.
