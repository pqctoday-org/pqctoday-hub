---
generated: 2026-08-09
category: Compliance Frameworks
document_count: 3
requirement_count: 19
---

## ETSI-EN-319-411
- **Source**: ETSI EN 319 411-1 V1.5.1 (2025-04)
- **URL**: https://www.etsi.org/deliver/etsi_en/319400_319499/31941101/01.05.01_60/en_31941101v010501p.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Undergo regular compliance audits and assessments to verify adherence to the Certificate Policy and Certification Practice Statement.
- **Governance**:
    - _T3 Repeatable · certificates_: Maintain and publish a Certification Practice Statement (CPS) detailing operational procedures, security controls, and roles for certificate issuance and management.
    - _T3 Repeatable · certificates_: Define and document the roles and responsibilities of PKI participants, including the Certification Authority, Subscribers, and Registration Authorities.
    - _T3 Repeatable · certificates_: Establish and enforce policies for the identification and authentication of subscribers prior to certificate issuance.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Implement defined procedures for certificate application processing, issuance, renewal, re-keying, and revocation.
    - _T3 Repeatable · keys_: Define and enforce procedures for key pair generation, private key protection, and key changeover.
- **Observability**:
    - _T3 Repeatable · all_: Maintain audit logs of security-relevant events and ensure their integrity and confidentiality for forensic analysis.
    - _T3 Repeatable · certificates_: Provide certificate status services (CRL or OCSP) to allow subscribers to verify the validity and revocation status of certificates.

## EUDI-Wallet-ARF
- **Source**: EUDI Wallet ARF v3.0.0
- **URL**: https://raw.githubusercontent.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/v2.9.0/docs/architecture-and-reference-framework-main.md
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure Wallet Solutions undergo certification by Conformity Assessment Bodies to verify compliance with security and interoperability requirements.
    - _T3 Repeatable · software_: Maintain alignment with certification requirements and relevant standards as part of the continuous refinement of the Architecture and Reference Framework.
- **Governance**:
    - _T2 Risk-Informed · all_: Align implementation with the European Digital Identity Regulation and its implementing acts, which serve as the mandatory legal basis for the ecosystem.

## NSA CNSA 2.0 FAQ
- **Source**: CNSA 2.0 Frequently Asked Questions
- **URL**: https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Implement QR algorithms in NSS mission systems as NIAP validated products or with modules validated by NIST CMVP.
    - _T3 Repeatable · software_: Ensure signature verification code for LMS/XMSS is validated by NIST CAVP; ensure signing hardware is validated by NIST CMVP.
- **Governance**:
    - _T2 Risk-Informed · all_: Follow CJCSN 65104 and CNSSAM 01-07-NSM for high-grade equipment; follow CNSA 1.0 for commercial equipment until CNSSP 15 transition.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Transition all NSS products employing public-standard algorithms from Suite B or CNSA 1.0 to CNSA 2.0 algorithms in a timely fashion.
    - _T3 Repeatable · all_: Upgrade currently fielded NSS to CNSA 2.0 in a timely fashion unless a waiver is obtained through the approved process.
    - _T3 Repeatable · all_: Use only ML-KEM and ML-DSA as specified in FIPS 203 and 204; do not use non-standard CRYSTALS-Kyber or CRYSTALS-Dilithium.
    - _T3 Repeatable · software_: Use only FIPS-validated LMS or XMSS for firmware and software signing in NSS; do not use HSS, XMSSMT, or SLH-DSA.
    - _T3 Repeatable · software_: Implement signing and state management for LMS/XMSS in hardware (e.g., HSM) to prevent state reuse and ensure security.
