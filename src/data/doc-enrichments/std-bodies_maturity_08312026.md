---
generated: 2026-08-31
category: Standardization Bodies
document_count: 5
requirement_count: 25
---

## ANSSI-PG-083-v3-2026
- **Source**: Règles et Recommandations Concernant le Choix et le Dimensionnement des Mécanismes Cryptographiques (v3.00)
- **URL**: https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-mecanismes-crypto-3.00.pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Submit the relevance of ANSSI cryptographic implementations to prior validation by the system administrator or security officers.
    - _T2 Risk-Informed · all_: Adhere to defined rules as necessary conditions for recognizing the correct security level of cryptographic mechanisms.
    - _T2 Risk-Informed · all_: Follow post-quantum rules as necessary conditions for protection against quantum adversaries.

## ETSI TR 103 619
- **Source**: Migration Strategies and Recommendations for Quantum-Safe Schemes
- **URL**: https://www.etsi.org/deliver/etsi_tr/103600_103699/103619/01.01.01_60/tr_103619v010101p.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Conduct risk, data, and cryptographic assessments to evaluate the impact of quantum threats on the estate.
- **Governance**:
    - _T2 Risk-Informed · all_: Create a documented migration plan addressing orderly and disorderly transition scenarios for quantum-safe schemes.
- **Inventory**:
    - _T2 Risk-Informed · all_: Compile a comprehensive inventory of cryptographic assets, including infrastructure and suppliers, to support migration planning.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Establish trust management processes to handle certificate and trust anchor transitions during migration.
    - _T2 Risk-Informed · keys_: Define key management procedures specifically for the migration period to ensure continuity and security.
    - _T2 Risk-Informed · software_: Plan for isolation approaches and access controls for non-quantum-safe resources during the migration execution.

## NIST IR 8547
- **Source**: Transition to Post-Quantum Cryptography Standards
- **URL**: https://csrc.nist.gov/pubs/ir/8547/ipd
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a strategy to manage the transition to post-quantum cryptography, including the adoption of new algorithms and the deprecation of quantum-vulnerable ones.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify existing quantum-vulnerable cryptographic standards and the specific quantum-resistant standards required for transition across information technology products and services.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for the careful deprecation, controlled legacy use, and eventual removal of quantum-vulnerable algorithms as part of the transition strategy.

## NSA CNSA 2.0
- **Source**: Commercial National Security Algorithm Suite 2.0
- **URL**: https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Verify compliance with CNSA 2.0 for software- and firmware-signing on systems; do not assess against FIPS-validated, but require NSA-approved solutions.
    - _T3 Repeatable · software_: Require NIAP or NSA validation for all software and hardware providing cryptographic services, in addition to meeting CNSA requirements.
- **Governance**:
    - _T3 Repeatable · all_: Prohibit use of unapproved cryptographic algorithms; require specific waivers for any algorithm, implementation, or use case not approved by the National Manager.
    - _T3 Repeatable · all_: Measure compliance with CNSA 1.0 and 2.0 as part of the Risk Management Framework process, specifically assessing Security Control 12.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Transition all deployed software and firmware to CNSA 2.0-compliant signatures by 2030; new software must use CNSA 2.0 signing algorithms by 2025.
    - _T3 Repeatable · software_: Update or replace custom applications and legacy equipment by 2033 to meet CNSA 2.0 requirements.
    - _T3 Repeatable · software_: Prefer CNSA 2.0 algorithms when configuring systems during the transition period; exclusive use becomes mandatory by defined deadlines.
    - _T3 Repeatable · software_: Require waivers and compliance plans for legacy equipment and software not refreshed regularly to meet NIAP Protection Profile requirements.

## RFC-9958
- **Source**: RFC 9958
- **URL**: https://datatracker.ietf.org/doc/rfc9958/
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Evaluate trade-offs between security and performance when selecting post-quantum algorithms, considering constraints of devices and networks.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish long-term security planning and proactive assessment processes for cryptographic systems to address the threat of cryptographically relevant quantum computers.
    - _T2 Risk-Informed · all_: Coordinate transitions across organizations and ecosystems, planning for staged migrations where upgraded and non-upgraded agents must coexist.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Implement cryptographic agility to allow for the transition to post-quantum algorithms and hybrid schemes as standards evolve.
    - _T2 Risk-Informed · libraries_: Design cryptographic libraries and protocols to accommodate significant differences in resource utilization and key sizes between traditional and post-quantum algorithms.
