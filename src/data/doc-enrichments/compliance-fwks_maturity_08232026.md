---
generated: 2026-08-23
category: Compliance Frameworks
document_count: 10
requirement_count: 55
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
    - _T3 Repeatable · software_: Comply with ASD communications security doctrine for the management and operation of High Assurance Cryptographic Equipment (HACE).
    - _T3 Repeatable · software_: Operate HACE only if issued an Approval for Use by ASD and in accordance with the latest Australian Communications Security Instructions.
    - _T3 Repeatable · software_: Use ECDH in preference to DH for asymmetric cryptographic operations to promote interoperability and reduce data costs.

## CISA-PQC-CATEGORY-LIST-2026
- **Source**: CISA PQC Product Category List (Updated per EO 14306)
- **URL**: https://www.cisa.gov/resources-tools/resources/product-categories-technologies-use-post-quantum-cryptography-standards
- **Requirement count**: 2
- **Governance**:
    - _T3 Repeatable · all_: Plan acquisitions to procure only PQC-capable products for categories listed as widely available in CISA guidance.
    - _T3 Repeatable · all_: Procure only PQC-capable products once a category is listed as having widely available PQC-capable options.

## GSMA-PQ02
- **Source**: GSMA PQ.02: Guidelines for Quantum Risk Management for Telco
- **URL**: https://www.gsma.com/solutions-and-impact/technologies/security/post-quantum-cryptography-documents/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Perform a Quantum Cryptanalytic Risk Assessment to prioritize critical systems and data for mitigation.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish an organization-wide governance process to manage quantum risk and integrate it into Enterprise Risk Management.
    - _T2 Risk-Informed · all_: Identify an executive owner for quantum risk and update roles and responsibilities to include quantum risk management duties.
    - _T2 Risk-Informed · all_: Build board-level awareness of quantum risk to ensure proportionate decision-making in the right timeframes.
- **Inventory**:
    - _T2 Risk-Informed · all_: Determine the organization's current cryptographic estate by gathering an inventory of assets and their current cryptographic protection.
    - _T2 Risk-Informed · all_: Identify and record the storage lifetime required for each inventory asset to assess 'Store Now, Decrypt Later' risks.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Create a transition plan based on the Quantum Cryptanalytic Risk Assessment and informed by the organization's risk appetite.

## IN-CERTIN-QBOM-Guidelines-2025
- **Source**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **URL**: https://www.cert-in.org.in/PDF/TechnicalGuidelines-on-SBOM,QBOM&CBOM,AIBOM_and_HBOM_ver2.0.pdf
- **Requirement count**: 6
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

## Malaysia-NACSA-PQC-2025
- **Source**: Malaysia NACSA MyKriptografi Action Plan 2026-2030
- **URL**: https://www.nacsa.gov.my/pelan-tindakan-mykriptografi.php
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a structured implementation roadmap with clear priorities and measurable outcomes to operationalize the National Cryptography Policy across government and NCII entities.
    - _T2 Risk-Informed · all_: Define and execute 12 strategies, 32 programmes, and 80 activities focused on strengthening cryptographic governance and preparing for the quantum computing era.
    - _T2 Risk-Informed · all_: Mandate the utilization of National Trusted Cryptographic Products (PKTN) among National Critical Information Infrastructure (NCII) entities and industry stakeholders.

## NIST SP 800-53
- **Source**: NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0)
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Assess the effectiveness of security and privacy controls and authorize systems for operation as part of the risk management process.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a comprehensive risk management program to categorize systems and select security controls based on mission and business needs.
- **Observability**:
    - _T2 Risk-Informed · all_: Continuously monitor information systems to ensure ongoing compliance with security and privacy controls.

## NZISM-V3-9
- **Source**: New Zealand Information Security Manual (NZISM) v3.9 — November 2025
- **URL**: https://nzism.gcsb.govt.nz/
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Designate an Accreditation Authority (Agency Head or delegate) accountable for ICT risks and information security of all systems and services.
    - _T2 Risk-Informed · all_: Establish a formal Certification and Accreditation process to derive assurance over system design, implementation, and management.
    - _T2 Risk-Informed · all_: Formally record non-use of recommended controls, select compensating controls, and have residual risk signed off by the Accreditation Authority.
    - _T2 Risk-Informed · all_: Grant waivers or exceptions only when compliance is not practically possible, ensuring risk is managed and conditions are met within specified timeframes.
    - _T2 Risk-Informed · all_: Assign the Director-General of GCSB as the Accreditation Authority for systems processing NZEO or compartmented national security information.

## Saudi-NCA-ECC2-2024
- **Source**: Saudi Arabia National Cybersecurity Authority — Essential Cybersecurity Controls ECC-2:2024
- **URL**: https://cdn.nca.gov.sa/api/files/public/upload/86e09090-44e4-481f-bc28-355673607654_ECC--2024-EN.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Conduct periodic cybersecurity reviews and audits to verify compliance with the Essential Cybersecurity Controls.
    - _T2 Risk-Informed · all_: Ensure compliance with cybersecurity standards, laws, and regulations through continuous monitoring and assessment.
    - _T2 Risk-Informed · all_: Utilize the NCA Assessment and Compliance Tool to measure and report on compliance with ECC controls.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a cybersecurity governance framework including strategy, management, policies, and defined roles and responsibilities.
    - _T2 Risk-Informed · all_: Define and document cybersecurity policies and procedures to guide the implementation of security controls.
    - _T2 Risk-Informed · all_: Assign specific cybersecurity roles and responsibilities within the entity to ensure accountability.
    - _T2 Risk-Informed · all_: Implement a cybersecurity risk management process to identify and mitigate threats to information assets.
    - _T2 Risk-Informed · all_: Integrate cybersecurity considerations into information and technology project management processes.

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
