---
generated: 2026-08-31
category: Compliance Frameworks
document_count: 6
requirement_count: 40
---

## AU-ASD-ISM-Crypto-2024
- **Source**: ASD Information Security Manual — Guidelines for Cryptography (December 2024)
- **URL**: https://www.cyber.gov.au/sites/default/files/2024-12/22.%20ISM%20-%20Guidelines%20for%20Cryptography%20(December%202024).pdf
- **Requirement count**: 7
- **Governance**:
    - _T3 Repeatable · keys_: Develop, implement, and maintain documented cryptographic key management processes and procedures covering the full key lifecycle.
    - _T3 Repeatable · keys_: Report compromise or suspected compromise of cryptographic equipment or keying material to the CISO or delegate immediately.
    - _T3 Repeatable · keys_: Change keying material immediately when cryptographic equipment or keying material is compromised or suspected of being compromised.
    - _T3 Repeatable · software_: Ensure cryptographic equipment and software use only ASD-Approved Cryptographic Algorithms or high assurance algorithms by disabling unapproved ones.
    - _T3 Repeatable · software_: Comply with ASD Communications Security Instructions for the management and operation of High Assurance Cryptographic Equipment.
    - _T3 Repeatable · software_: Operate High Assurance Cryptographic Equipment only if issued an Approval for Use by ASD and in accordance with latest instructions.
    - _T3 Repeatable · software_: Use ECDH in preference to Diffie-Hellman for asymmetric cryptographic operations to promote interoperability and reduce data cost.

## CISA-PQC-CATEGORY-LIST-2026
- **Source**: CISA PQC Product Category List (Updated per EO 14306)
- **URL**: https://www.cisa.gov/resources-tools/resources/product-categories-technologies-use-post-quantum-cryptography-standards
- **Requirement count**: 3
- **Governance**:
    - _T3 Repeatable · all_: Plan acquisitions to procure only PQC-capable products for categories listed as widely available in CISA guidance.
    - _T3 Repeatable · all_: Ensure procured products implement PQC for core features and all secondary functionality, such as software updates.
- **Inventory**:
    - _T2 Risk-Informed · all_: Use CISA product category lists to assess future technological needs and identify PQC-capable hardware and software.

## IN-CERTIN-QBOM-Guidelines-2025
- **Source**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **URL**: https://www.cert-in.org.in/PDF/TechnicalGuidelines-on-SBOM,QBOM&CBOM,AIBOM_and_HBOM_ver2.0.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Ensure SBOMs are used to streamline adherence to security regulations and provide transparency in software composition.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish defined roles and responsibilities for SBOM creation, management, and distribution within the organization.
    - _T2 Risk-Informed · software_: Mandate the inclusion of SBOM requirements in all software procurement and purchase processes.
- **Inventory**:
    - _T3 Repeatable · libraries_: Maintain a comprehensive inventory of all software components, libraries, and modules used in software construction.
    - _T3 Repeatable · software_: Document minimum elements for Cryptographic BOM (CBOM) including cryptographic assets and algorithms used.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Integrate SBOM inventory into the vulnerability management workflow to track and patch known vulnerabilities.
    - _T2 Risk-Informed · software_: Develop a quantum-readiness and migration strategy for cryptographic assets identified in the CBOM.

## India-DST-NQM-Roadmap
- **Source**: India DST Task Force Report — Phased Roadmap for Migration to Post-Quantum Cryptography under NQM
- **URL**: https://dst.gov.in/sites/default/files/Report_TaskForce_PQMigration_4Feb26%20(v1).pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a multidisciplinary Task Force to oversee, facilitate, and formulate guidelines for the phased transition to Post-Quantum Cryptography.
    - _T2 Risk-Informed · all_: Constitute dedicated sub-groups to define minimum frameworks for standards, testing, and certification of quantum-safe products and solutions.
    - _T2 Risk-Informed · all_: Assign responsibility for quantum resiliency, crypto agility, and PQC migration deliberations to a dedicated sub-group chaired by industry experts.
    - _T2 Risk-Informed · all_: Advise on the requirement of Indian Standards for PQC adoption to ensure national alignment and interoperability.
    - _T2 Risk-Informed · all_: Suggest measures for the establishment of National Evaluation and Testing infrastructure for Quantum Technologies and PQC solutions.
    - _T2 Risk-Informed · all_: Adopt common PQC procurement requirements to standardize acquisition of quantum-safe solutions across sectors.
    - _T2 Risk-Informed · all_: Address quantum-safe security through policy formulation, long-term planning, and coordinated national action rather than merely technical exercises.

## Saudi-NCA-ECC2-2024
- **Source**: Saudi Arabia National Cybersecurity Authority — Essential Cybersecurity Controls ECC-2:2024
- **URL**: https://cdn.nca.gov.sa/api/files/public/upload/86e09090-44e4-481f-bc28-355673607654_ECC--2024-EN.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Conduct periodic cybersecurity reviews and audits to verify ongoing compliance with the Essential Cybersecurity Controls and identify areas for improvement.
    - _T2 Risk-Informed · all_: Ensure compliance with cybersecurity standards, laws, and regulations through continuous monitoring and assessment by the NCA or self-assessment.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a cybersecurity governance framework defining strategy, management structures, and roles to ensure compliance with NCA policies and protect national interests.
    - _T2 Risk-Informed · all_: Define and document cybersecurity roles and responsibilities within the entity to ensure clear ownership of security obligations and adherence to the ECC.
    - _T2 Risk-Informed · all_: Develop and maintain formal cybersecurity policies and procedures that align with national laws and NCA standards to guide security operations.
    - _T2 Risk-Informed · all_: Implement a cybersecurity risk management process to identify, assess, and mitigate risks to information and technology assets in accordance with the ECC.
    - _T2 Risk-Informed · all_: Integrate cybersecurity considerations into information and technology project management to ensure security is addressed throughout the project lifecycle.
    - _T2 Risk-Informed · all_: Establish a cybersecurity awareness and training program to ensure personnel understand their security responsibilities and the entity's policies.
    - _T2 Risk-Informed · all_: Define cybersecurity requirements for human resources processes, including background checks and security obligations for employees and contractors.

## UK-CMORG-PQC-Guidance-2025
- **Source**: CMORG Guidance for Post-Quantum Cryptography (UK Financial Sector)
- **URL**: https://www.cmorg.org.uk/sites/default/files/2025-06/CMORG%20-%20Guidance%20for%20Post-Quantum%20Cryptography%20-%20April%202025%20-%20TLP%20CLEAR%20(1).pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Conduct risk assessments to evaluate quantum vulnerability of each asset, accounting for data shelf life, migration timelines, and algorithm-specific threat emergence.
    - _T2 Risk-Informed · all_: Develop a prioritisation framework to address high-risk areas first, focusing on long-lived sensitive data and systems with extensive third-party dependencies.
    - _T2 Risk-Informed · all_: Assess and align third-party vendor capabilities with quantum-resistant standards to facilitate a seamless transition, given reliance on external solutions.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create a comprehensive inventory of all cryptographic assets, identifying usage across data-in-transit, at-rest, and in-use, including metadata on ownership and lifecycle.
    - _T2 Risk-Informed · keys_: Track cryptographic algorithms and keys, capturing metadata such as ownership, usage, and lifecycle management to ensure a full picture of the landscape.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Adopt a phased approach for integrating Post-Quantum Cryptography standards, collaborating with vendors to minimize disruption during migration.
    - _T2 Risk-Informed · software_: Implement crypto-agile systems capable of quickly adapting to future cryptographic requirements and quantum threats during remediation.
