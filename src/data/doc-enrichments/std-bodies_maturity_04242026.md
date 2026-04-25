---
generated: 2026-04-24
category: Standardization Bodies
document_count: 5
requirement_count: 63
---

## ANSSI-PG-083-v3-2026

- **Source**: Règles et Recommandations Concernant le Choix et le Dimensionnement des Mécanismes Cryptographiques (v3.00)
- **URL**: https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-mecanismes-crypto-3.00.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Validate cryptographic implementations with system administrators or security personnel before deployment.
  - _T2 Risk-Informed · all_: Employ cryptographic mechanisms proven and recognized by the academic community.
  - _T2 Risk-Informed · all_: Target post-quantum security for mechanisms used beyond January 1, 2030 or at risk of retroactive attacks.

## BSI TR-02102-1

- **Source**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.pdf
- **Requirement count**: 23
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Discontinue sole use of classical asymmetric mechanisms and migrate to hybrid quantum-safe schemes.
  - _T2 Risk-Informed · keys_: Discontinue recommendation of DSA from 2029.
  - _T2 Risk-Informed · keys_: Extend conformance of RSA keys with length >= 2000 bits to end of 2023.
  - _T2 Risk-Informed · libraries_: Stop recommending PTG.2 random generators for general use.
  - _T2 Risk-Informed · software_: Implement hybridization combining quantum-safe mechanisms with previously recommended asymmetric mechanisms.
  - _T2 Risk-Informed · software_: Use Argon2id for password-based key derivation.
  - _T2 Risk-Informed · software_: Include MLS protocol in cryptographic implementations.
  - _T2 Risk-Informed · software_: Add CCM mode among recommended modes of operation.
  - _T2 Risk-Informed · software_: Add PKCS1.5 paddings among legacy mechanisms.
  - _T2 Risk-Informed · software_: Add AES-GCM-SIV and key wrapping to recommended mechanisms.
  - _T2 Risk-Informed · software_: Add standardized versions of hash-based signature procedures.
  - _T2 Risk-Informed · software_: Update random number generation following AIS 20/31 updates.
  - _T2 Risk-Informed · software_: Update PQ cryptography recommendations after NIST standards publication.
  - _T2 Risk-Informed · software_: Increase security level to 120 bits.
  - _T2 Risk-Informed · software_: Update key derivation and hybridization strategies.
  - _T2 Risk-Informed · software_: Include migration periods for PQ cryptography.
  - _T2 Risk-Informed · software_: Update side-channel analysis considerations.
  - _T2 Risk-Informed · software_: Update QKD considerations.
  - _T2 Risk-Informed · software_: Update seed generation for random number generators.
  - _T2 Risk-Informed · software_: Fundamentally restructure cryptography in context of quantum-safe requirements.
  - _T2 Risk-Informed · software_: Perform fundamental editorial revision of entire text.
  - _T2 Risk-Informed · software_: Make minor adjustments to layout.
  - _T2 Risk-Informed · software_: Update random generators especially regarding DRG.3 and NTG.1.

## NIST IR 8547

- **Source**: Transition to Post-Quantum Cryptography Standards
- **URL**: https://nvlpubs.nist.gov/nistpubs/ir/2024/NIST.IR.8547.ipd.pdf
- **Requirement count**: 7
- **Inventory**:
  - _T2 Risk-Informed · all_: Identify quantum-vulnerable cryptographic standards and the post-quantum standards to which products must transition.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan for the adoption of new PQC algorithms and the deprecation and removal of quantum-vulnerable algorithms.
  - _T2 Risk-Informed · all_: Consider hybrid solutions combining quantum-resistant and vulnerable algorithms as a temporary measure during transition.
  - _T3 Repeatable · certificates_: Update PKI components to issue and manage certificates using PQC algorithms and modify validation mechanisms.
  - _T3 Repeatable · keys_: Upgrade cryptographic hardware modules to support PQC algorithms with larger key sizes and different computational requirements.
  - _T3 Repeatable · libraries_: Update software cryptographic libraries to incorporate standardized PQC algorithms and ensure security against side-channel attacks.
  - _T3 Repeatable · software_: Modify IT applications to support PQC algorithms for encryption, signatures, and key exchange, including refactoring code and testing.

## NSA CNSA 2.0

- **Source**: Commercial National Security Algorithm Suite 2.0
- **URL**: https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF
- **Requirement count**: 16
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Verify that commercial products are NIAP-validated against approved protection profiles and configured correctly per CNSSP 15.
  - _T3 Repeatable · all_: Ensure solutions are NSA-approved rather than relying solely on FIPS validation for National Security Systems.
- **Governance**:
  - _T3 Repeatable · all_: Enforce mandatory use of CNSA 2.0 algorithms for National Security Systems by specified deadlines and require waivers for non-compliant legacy equipment.
  - _T3 Repeatable · all_: Verify CNSA 2.0 compliance for software and firmware signing as part of the Risk Management Framework process.
  - _T3 Repeatable · all_: Report progress on updating to CNSA 1.0 and CNSA 2.0 as a responsibility under NSM-8 and NSM-10.
  - _T3 Repeatable · all_: Ensure cryptographic services are validated by NIAP or NSA and meet CNSA requirements.
  - _T3 Repeatable · software_: Mandate exclusive use of CNSA 2.0 signing algorithms for all software and firmware by 2030.
  - _T3 Repeatable · software_: Require new software and firmware to utilize CNSA 2.0 signing algorithms by 2025.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Update or replace custom applications and legacy equipment to meet CNSA 2.0 standards by 2033.
  - _T3 Repeatable · all_: Ensure older equipment meets CNSA 2.0 protection profile requirements at its next update to remain NIAP compliant.
  - _T3 Repeatable · all_: Begin transitioning to CNSA 2.0 algorithms immediately for software and firmware signing.
  - _T3 Repeatable · all_: Support and prefer CNSA 2.0 algorithms for web browsers, servers, and cloud services by 2025.
  - _T3 Repeatable · all_: Support and prefer CNSA 2.0 algorithms for traditional networking equipment by 2026.
  - _T3 Repeatable · all_: Support and prefer CNSA 2.0 algorithms for operating systems by 2027.
  - _T3 Repeatable · all_: Support and prefer CNSA 2.0 algorithms for niche equipment by 2030.
  - _T3 Repeatable · software_: Transition deployed software and firmware not compliant with CNSA 1.0 to CNSA 2.0 algorithms by 2025.

## draft-ietf-pquip-pqc-engineers-14

- **Source**: Post-Quantum Cryptography for Engineers
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-pquip-pqc-engineers/
- **Requirement count**: 14
- **Governance**:
  - _T2 Risk-Informed · all_: Coordinate transitions between organizations and ecosystems due to the wide-ranging impact of PQC.
  - _T2 Risk-Informed · all_: Prepare for significant protocol redesign rather than simple algorithm replacement due to PQC properties.
  - _T2 Risk-Informed · all_: Evaluate trade-offs between security and performance when implementing post-quantum algorithms.
  - _T2 Risk-Informed · all_: Ensure backward compatibility with current systems during the transition phase.
  - _T2 Risk-Informed · all_: Remain vigilant and prepare early for quantum computing advances that may be ahead of public research.
  - _T2 Risk-Informed · all_: Address the 'harvest now, decrypt later' threat by implementing quantum-safe strategies immediately.
  - _T2 Risk-Informed · all_: Recognize that current best practices for side-channel resistance may be insufficient against quantum adversaries.
  - _T2 Risk-Informed · all_: Replace traditional algorithms with either PQC KEMs or PQC signatures based on their specific function.
  - _T2 Risk-Informed · all_: Account for API differences when incorporating KEMs into protocols or applications.
- **Inventory**:
  - _T2 Risk-Informed · all_: Assess and evaluate available technologies to understand the crypto estate before transitioning.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan for staged migrations where upgraded agents coexist with non-upgraded agents.
  - _T2 Risk-Informed · all_: Minimize the transition timeframe to reduce the security gap where data remains vulnerable.
  - _T2 Risk-Informed · all_: Consider long lifetimes for authentication use-cases such as firmware, legal documents, and embedded certificates.
  - _T2 Risk-Informed · all_: Evaluate the actual migration timeline honestly to understand exposure risks.
