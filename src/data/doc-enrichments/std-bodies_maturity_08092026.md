---
generated: 2026-08-09
category: Standardization Bodies
document_count: 6
requirement_count: 51
---

## ANSSI-PG-083-v3-2026
- **Source**: Règles et Recommandations Concernant le Choix et le Dimensionnement des Mécanismes Cryptographiques (v3.00)
- **URL**: https://messervices.cyber.gouv.fr/documents-guides/anssi-guide-mecanismes-crypto-3.00.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a documented policy for selecting and sizing cryptographic mechanisms based on ANSSI rules and recommendations.
    - _T2 Risk-Informed · all_: Assign responsibility to the system administrator or security officer to validate the relevance of cryptographic implementations.
    - _T2 Risk-Informed · all_: Define a review cycle of 2 to 5 years to update cryptographic parameters and policies based on the state of the art.
    - _T2 Risk-Informed · all_: Mandate the use of post-quantum security for mechanisms intended for use beyond January 1, 2030, or at risk of retroactive attacks.
    - _T2 Risk-Informed · all_: Require the use of cryptographic mechanisms that are proven and recognized by the academic community.

## ETSI TR 103 619
- **Source**: Migration Strategies and Recommendations for Quantum-Safe Schemes
- **URL**: https://www.etsi.org/deliver/etsi_tr/103600_103699/103619/01.01.01_60/tr_103619v010101p.pdf
- **Requirement count**: 13
- **Governance**:
    - _T2 Risk-Informed · all_: Appoint a single migration inventory manager responsible for compiling the inventory and reporting to the migration planning manager.
    - _T2 Risk-Informed · all_: Allocate specific budget for inventory compilation, acknowledging potential significant costs if no equivalent inventory exists.
    - _T4 Adaptive · all_: Integrate migration roles into the existing organization to ensure migration is treated as a board-level strategic activity.
- **Inventory**:
    - _T2 Risk-Informed · all_: Compile a comprehensive inventory of cryptographic assets, processes, and dependencies to identify items impacted by quantum computing threats.
    - _T2 Risk-Informed · all_: Identify third-party dependencies and liable parties for assets not under direct organizational control within the inventory.
    - _T2 Risk-Informed · all_: Document roots of trust, trust chains, and functions for assets relying on specific trust management frameworks.
    - _T2 Risk-Informed · keys_: Assess the ability of devices to generate and store key pairs for the target Quantum Safe Cryptography solution.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Create a migration plan detailing which assets will be migrated, when, and in what orderly sequence based on dependencies.
    - _T2 Risk-Informed · all_: Ensure cryptographic agility in new or updated PKI entities to facilitate future algorithm switches if vulnerabilities are found.
    - _T2 Risk-Informed · all_: Migrate Hardware Based Security Environments (HBSEs) to support QSC algorithms before migrating dependent assets.
    - _T2 Risk-Informed · all_: Maintain cryptographic protections during transition; do not remove non-QSC encryption before imposing QSC encryption.
    - _T2 Risk-Informed · certificates_: Plan for new PKCs containing Quantum Safe public keys and ensure PKI entities can handle larger QSC primitives.
    - _T2 Risk-Informed · certificates_: Establish new trust anchors and certificate chains with Quantum Safe signatures, supporting hybrid modes if backwards compatibility is required.

## NIST CSWP 39
- **Source**: Considerations for Achieving Cryptographic Agility
- **URL**: https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.39-upd1.pdf
- **Requirement count**: 13
- **Governance**:
    - _T2 Risk-Informed · all_: Integrate crypto agility into the organization’s overall risk management framework and develop a comprehensive strategic plan.
    - _T2 Risk-Informed · all_: Ensure employees, partners, and suppliers involved in cryptographic design and deployment consider and adopt crypto agility practices.
    - _T2 Risk-Informed · all_: Include cryptographic transitions as an important part of the organization-wide risk management program.
    - _T2 Risk-Informed · all_: Use local policy to select algorithms and limit allowable combinations during session establishment.
    - _T3 Repeatable · all_: Change configuration settings to prohibit the use of particular vulnerable algorithms to force algorithm transition.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Design systems to facilitate algorithm changes throughout their lifetimes to avoid costly replacements.
    - _T2 Risk-Informed · all_: Specify new algorithms before current ones weaken to the breaking point to allow timely migration.
    - _T2 Risk-Informed · all_: Use key expiration and revocation as important tools for cryptographic algorithm transition.
    - _T2 Risk-Informed · all_: Introduce new signature algorithms well before the original algorithm is phased out to ensure global acceptance.
    - _T2 Risk-Informed · all_: Plan for significant growth in the size of cryptographic data, including public keys and signatures.
- **Observability**:
    - _T2 Risk-Informed · all_: Provide a way to determine when deployed implementations have shifted from old algorithms to more desirable ones.
    - _T2 Risk-Informed · all_: Use mechanisms like SMIME Capabilities or EDNS(0) to signal acceptance and use of new algorithms.
    - _T2 Risk-Informed · all_: Monitor cryptographic research results to discover new attacks and assess impacts to existing security protocols.

## NIST IR 8547
- **Source**: Transition to Post-Quantum Cryptography Standards
- **URL**: https://csrc.nist.gov/pubs/ir/8547/ipd
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a clear roadmap and realistic timeline for transitioning to post-quantum cryptography, balancing urgency with the need to minimize disruption across critical systems.
    - _T2 Risk-Informed · all_: Engage in public-private collaboration with industry, standards organizations, and agencies to facilitate and accelerate the adoption of post-quantum cryptography.
    - _T2 Risk-Informed · all_: Carefully consider the security, costs, and complexity of hybrid solutions in your environment when specifying cryptographic protocols and technologies.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify existing quantum-vulnerable cryptographic standards and the quantum-resistant standards to which information technology products and services will need to transition.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for the careful deprecation, controlled legacy use, and eventual removal of quantum-vulnerable algorithms that are currently widespread in technological infrastructures.
    - _T2 Risk-Informed · all_: Consider hybrid solutions that incorporate quantum-resistant and quantum-vulnerable algorithms as temporary measures to hedge against flaws and accommodate legacy requirements.
    - _T2 Risk-Informed · certificates_: Update PKI components to issue, distribute, and manage certificates using PQC algorithms, including modifying validation and revocation mechanisms.
    - _T2 Risk-Informed · libraries_: Update software cryptographic libraries to incorporate standardized PQC algorithms, optimizing implementations for performance and ensuring security against side-channel attacks.
    - _T2 Risk-Informed · software_: Modify IT applications and services to support PQC algorithms for encryption, digital signatures, and key exchange, including refactoring code and conducting extensive testing.

## NSA CNSA 2.0
- **Source**: Commercial National Security Algorithm Suite 2.0
- **URL**: https://media.defense.gov/2025/May/30/2003728741/-1/-1/0/CSA_CNSA_2.0_ALGORITHMS.PDF
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Verify compliance with CNSA 2.0 for software- and firmware-signing as part of the Risk Management Framework (RMF) process.
    - _T3 Repeatable · all_: Require NSA-approved solutions rather than FIPS-validated modules for National Security Systems assessment.
- **Governance**:
    - _T3 Repeatable · all_: Enforce mandatory use of NSA-approved CNSA 2.0 algorithms for National Security Systems; prohibit unapproved algorithms without specific waivers.
    - _T3 Repeatable · all_: Report progress on updating to CNSA 1.0 and CNSA 2.0 as part of responsibilities under NSM-8 and NSM-10.
    - _T3 Repeatable · software_: Require NIAP or NSA validation for all software and hardware providing cryptographic services in National Security Systems.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Transition all deployed software and firmware to CNSA 2.0-compliant signatures by 2030; new software must use CNSA 2.0 by 2025.
    - _T3 Repeatable · software_: Retire legacy equipment and software not refreshed regularly; require waivers and compliance plans for non-compliant legacy assets.

## draft-ietf-pquip-pqc-engineers-14
- **Source**: Post-Quantum Cryptography for Engineers
- **URL**: https://datatracker.ietf.org/doc/draft-ietf-pquip-pqc-engineers/
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Conduct integration, testing, auditing, and re-certification of cryptographic environments as part of the PQC migration preparation phase.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a documented migration timeline and risk assessment strategy to address 'harvest now, decrypt later' threats and long-lived signature validity.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Evaluate and integrate post-quantum algorithms into cryptographic libraries, accounting for significant differences in resource utilization and key sizes.
    - _T2 Risk-Informed · software_: Plan for staged migrations where upgraded agents co-exist with non-upgraded agents, requiring protocol redesign rather than simple algorithm replacement.
