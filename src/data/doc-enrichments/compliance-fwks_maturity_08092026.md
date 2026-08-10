---
generated: 2026-08-09
category: Compliance Frameworks
document_count: 6
requirement_count: 34
---

## CISA-PQC-CATEGORY-LIST-2026
- **Source**: CISA PQC Product Category List (Updated per EO 14306)
- **URL**: https://www.cisa.gov/resources-tools/resources/product-categories-technologies-use-post-quantum-cryptography-standards
- **Requirement count**: 2
- **Governance**:
    - _T3 Repeatable · all_: Plan acquisitions to procure only PQC-capable products for categories listed as widely available in CISA guidance.
    - _T3 Repeatable · all_: Procure only PQC-capable products for categories identified in Table 2 as having widely available PQC standards.

## FISMA-NIST-SP-800-53r5
- **Source**: NIST SP 800-53 Rev. 5 Release 5.2.0 — Security and Privacy Controls for Information Systems and Organizations
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Assess the effectiveness of security and privacy controls and authorize systems for operation.
    - _T2 Risk-Informed · all_: Continuously monitor information systems to ensure ongoing compliance with security and privacy controls.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a comprehensive risk management program to categorize systems and select security controls meeting mission needs.
    - _T2 Risk-Informed · all_: Define organizational responsibilities for security and privacy controls as part of the risk management framework.
    - _T2 Risk-Informed · all_: Collaborate with records officers to align security controls with federal records retention and deletion policies.

## IL-INCD-Cybersecurity-Strategy-2025
- **Source**: Israel National Cybersecurity Strategy 2025-2028
- **URL**: https://www.gov.il/BlobFolder/news/cyber_strategy_2025/en/israel_national_cybersecurity_strategy_feb2025.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a dedicated national law defining 'essential organizations' and stipulating mandatory obligations for effective cyber risk management and incident reporting.
    - _T2 Risk-Informed · all_: Define sectoral regulator powers to supervise and enforce the implementation of national cybersecurity provisions by essential organizations.
    - _T2 Risk-Informed · all_: Formulate a comprehensive national policy defining a normative framework for assuring digital identity, clarifying government roles in standards and mechanisms.
    - _T2 Risk-Informed · all_: Incorporate appropriate cybersecurity requirements into government tenders and contracts starting from the planning phase to embed security across the supply chain.
    - _T2 Risk-Informed · all_: Update methodologies for securing critical infrastructure entities to anticipate emerging threats and instill principles of preparedness for surprises.

## IN-CERTIN-QBOM-Guidelines-2025
- **Source**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **URL**: https://www.cert-in.org.in/PDF/TechnicalGuidelines-on-SBOM,QBOM&CBOM,AIBOM_and_HBOM_ver2.0.pdf
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Define roles, responsibilities, timelines, and resource requirements in a comprehensive project plan for the SBOM program.
    - _T2 Risk-Informed · all_: Establish secure storage for SBOMs, segregating them in dedicated repositories and integrating with asset management applications.
    - _T2 Risk-Informed · all_: Mandate SBOM provision by suppliers in purchase orders or contracts, specifying elements, delivery timeframe, and method.
    - _T2 Risk-Informed · all_: Include author name and timestamp in internal SBOMs to trace integrity and identify the developer responsible for updates.
    - _T2 Risk-Informed · all_: Establish threat hunting teams to assess vulnerability to newly discovered threats using CERT-In alerts and SBOM data.
    - _T3 Repeatable · all_: Implement stringent access controls, encryption, and periodic audits to ensure secure configuration management of SBOMs.

## India-DST-Quantum-Safe-Roadmap-2026
- **Source**: India DST Task Force Report — Phased Roadmap for Migration to Post-Quantum Cryptography under NQM
- **URL**: https://dst.gov.in/sites/default/files/Report_TaskForce_PQMigration_4Feb26%20(v1).pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Conduct independent validation, monitoring, and capacity-building to ensure sustained progress.
    - _T3 Repeatable · all_: Maintain long-term vendor oversight, audits, and continuous algorithm updates.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish leadership, governance, and cross-functional quantum risk management structures.
    - _T3 Repeatable · all_: Enforce a policy prohibiting new deployments of classical-only cryptographic systems.
    - _T3 Repeatable · software_: Mandate Cryptographic Bills of Materials (CBOM) submissions from vendors starting FY 2027–28.
    - _T4 Adaptive · all_: Implement board-level oversight, resource allocation, and cross-functional accountability for PQC migration.
- **Inventory**:
    - _T2 Risk-Informed · all_: Inventory cryptographic assets and assess quantum risk as part of foundational migration steps.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Establish crypto agility to rapidly update algorithms, keys, and protocols without business disruption.
    - _T3 Repeatable · libraries_: Upgrade PKI, HSMs, KMS, and libraries to PQC-ready versions during high-priority migration.

## UK-CMORG-PQC-Guidance-2025
- **Source**: CMORG Guidance for Post-Quantum Cryptography (UK Financial Sector)
- **URL**: https://www.cmorg.org.uk/sites/default/files/2025-06/CMORG%20-%20Guidance%20for%20Post-Quantum%20Cryptography%20-%20April%202025%20-%20TLP%20CLEAR%20(1).pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Capture ownership metadata in the cryptographic inventory to establish clear accountability for cryptographic assets and their lifecycle management.
    - _T2 Risk-Informed · all_: Conduct risk assessments to evaluate quantum vulnerability of each asset, considering data longevity and migration timelines to prioritize transition efforts.
    - _T2 Risk-Informed · all_: Develop a prioritization framework to address high-risk areas with long-term data value or critical operational dependencies first.
    - _T2 Risk-Informed · all_: Incorporate Post-Quantum Cryptography requirements into new vendor contracts and service-level agreements to align third-party relationships with migration strategies.
    - _T2 Risk-Informed · all_: Assess vendor readiness for PQC standards and engage in dialogue to accelerate the adoption of quantum-resistant algorithms in third-party offerings.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create a comprehensive inventory of all cryptographic assets, identifying usage across data-in-transit, at-rest, and in-use, including metadata for ownership and lifecycle.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Implement crypto-agile systems capable of adapting to future cryptographic requirements and quantum threats to facilitate seamless migration.
