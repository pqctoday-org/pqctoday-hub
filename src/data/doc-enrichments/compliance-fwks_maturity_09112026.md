---
generated: 2026-09-11
category: Compliance Frameworks
document_count: 4
requirement_count: 48
---

## CMMC-2.0-MODEL
- **Source**: Cybersecurity Maturity Model Certification (CMMC) Model Overview v2.13
- **URL**: https://dodcio.defense.gov/CMMC/Documentation/
- **Requirement count**: 20
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Create and retain system audit logs and records to the extent needed to enable the monitoring, analysis, investigation, and reporting of unlawful or unauthorized system activity.
    - _T2 Risk-Informed · all_: Uniquely trace the actions of individual system users, so they can be held accountable for their actions.
    - _T2 Risk-Informed · all_: Review and update logged events.
    - _T2 Risk-Informed · all_: Alert in the event of an audit logging process failure.
    - _T2 Risk-Informed · all_: Correlate audit record review, analysis, and reporting processes for investigation and response to indications of unlawful, unauthorized, suspicious, or unusual activity.
    - _T2 Risk-Informed · all_: Provide audit record reduction and report generation to support on-demand analysis and reporting.
    - _T2 Risk-Informed · all_: Provide a system capability that compares and synchronizes internal system clocks with an authoritative source to generate time stamps for audit records.
    - _T2 Risk-Informed · all_: Protect audit information and audit logging tools from unauthorized access, modification, and deletion.
    - _T2 Risk-Informed · all_: Limit management of audit logging functionality to a subset of privileged users.
- **Governance**:
    - _T2 Risk-Informed · all_: Inform managers, systems administrators, and users of organizational systems of the security risks associated with their activities and of the applicable policies, standards, and procedures related to the security of those systems.
    - _T2 Risk-Informed · all_: Train personnel to carry out their assigned information security-related duties and responsibilities.
    - _T3 Repeatable · all_: Provide awareness training upon initial hire, following a significant cyber event, and at least annually, focused on recognizing and responding to threats from social engineering, advanced persistent threat actors, breaches, and suspicious…
    - _T3 Repeatable · all_: Include practical exercises in awareness training for all users, tailored by roles, to include general users, users with specialized roles, and privileged users, that are aligned with current threat scenarios and provide feedback to indivi…
- **Inventory**:
    - _T2 Risk-Informed · all_: Establish and maintain baseline configurations and inventories of organizational systems (including hardware, software, firmware, and documentation) throughout the respective system development life cycles.
    - _T3 Repeatable · all_: Establish and maintain an authoritative source and repository to provide a trusted source and accountability for approved and implemented system components.
    - _T3 Repeatable · all_: Employ automated discovery and management tools to maintain an up-to-date, complete, accurate, and readily available inventory of system components.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Track, review, approve or disapprove, and log changes to organizational systems.
    - _T2 Risk-Informed · all_: Analyze the security impact of changes prior to implementation.
    - _T2 Risk-Informed · all_: Define, document, approve, and enforce physical and logical access restrictions associated with changes to organizational systems.
    - _T3 Repeatable · all_: Employ automated mechanisms to detect misconfigured or unauthorized system components; after detection, remove the components or place the components in a quarantine or remediation network to facilitate patching, re-configuration, or other…

## IN-CERTIN-QBOM-Guidelines-2025
- **Source**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **URL**: https://www.cert-in.org.in/PDF/TechnicalGuidelines-on-SBOM,QBOM&CBOM,AIBOM_and_HBOM_ver2.0.pdf
- **Requirement count**: 14
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Adopt a risk-based approach for quantum readiness assessment involving cryptographic validation testing, independent security assessments, and adversarial simulations.
    - _T2 Risk-Informed · all_: Require service providers to provide quarterly migration progress reports regarding Post-Quantum Cryptography implementation.
    - _T2 Risk-Informed · all_: Include digital signatures for the model or AIBOM to ensure authenticity and integrity.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish cross-functional collaboration across cybersecurity, engineering, legal, compliance, and vendor management teams to govern the CBOM/QBOM lifecycle.
    - _T2 Risk-Informed · all_: Define roles and responsibilities and assign ownership for SBOM-related activities to key stakeholders.
    - _T2 Risk-Informed · all_: Implement tiered vendor Post-Quantum Cryptography (PQC) contractual requirements, mandating documentation of cryptographic implementations.
- **Inventory**:
    - _T2 Risk-Informed · all_: Document baseline information for each component including name, version, supplier, license, origin, dependencies, vulnerabilities, and checksums.
    - _T2 Risk-Informed · all_: Compile a comprehensive inventory of all critical components that make up the AI system, ensuring all dependencies are accounted for.
    - _T3 Repeatable · software_: Maintain a complete internal SBOM at the 'complete' level to identify and share vulnerability updates with consumers on a mandatory basis.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Track model lineage by maintaining clear records of model versions, retraining activities, and modifications to ensure accountability.
    - _T3 Repeatable · all_: Conduct scheduled reviews at least quarterly to verify the accuracy and completeness of the CBOM/QBOM, reflecting any additions or deprecations.
    - _T3 Repeatable · all_: Automate the generation of AIBOM as part of model development and deployment pipelines to ensure consistency and up-to-date records.
- **Observability**:
    - _T3 Repeatable · all_: Integrate security tools into the software development pipeline to automatically analyze SBOM data and identify vulnerabilities during build and packaging phases.
    - _T3 Repeatable · all_: Utilize automation to support real-time audit compliance with security policies and vulnerability management procedures.

## MICA-REG-2023-1114
- **Source**: Markets in Crypto-Assets Regulation (MiCA) — Regulation EU 2023/1114
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32023R1114
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Provide clients, at least once every three months and upon request, with a statement of position identifying crypto-assets, balance, value, and transfers during the period.
- **Governance**:
    - _T2 Risk-Informed · keys_: Establish a custody policy with internal rules and procedures to ensure the safekeeping or control of crypto-assets or the means of access to them.
    - _T2 Risk-Informed · keys_: Ensure internal procedures evidence that any movement affecting the registration of crypto-assets is evidenced by a transaction regularly registered in the client’s register of positions.
    - _T2 Risk-Informed · keys_: Ensure necessary procedures are in place to return crypto-assets held on behalf of clients, or the means of access, as soon as possible to those clients.
    - _T2 Risk-Informed · keys_: Lay down, maintain, and implement clear and transparent operating rules for the trading platform.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Keep a register of positions opened in the name of each client, corresponding to each client’s rights to the crypto-assets, and record movements as soon as possible.
    - _T2 Risk-Informed · keys_: Segregate holdings of crypto-assets on behalf of clients from own holdings and ensure means of access to client crypto-assets are clearly identified as such.

## UK-CMORG-PQC-Guidance-2025
- **Source**: CMORG Guidance for Post-Quantum Cryptography (UK Financial Sector)
- **URL**: https://www.cmorg.org.uk/sites/default/files/2025-06/CMORG%20-%20Guidance%20for%20Post-Quantum%20Cryptography%20-%20April%202025%20-%20TLP%20CLEAR%20(1).pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Conduct a risk assessment to evaluate the quantum vulnerability of each cryptographic asset, accounting for data longevity and migration timelines.
    - _T2 Risk-Informed · all_: Develop a prioritisation framework to address high-risk areas where data has long-term value or where cryptographic mechanisms are critical to operations.
    - _T2 Risk-Informed · all_: Assess third-party vendors' cryptographic protocols and readiness to adopt quantum-resistant algorithms, including SaaS, cloud, and hardware providers.
    - _T2 Risk-Informed · all_: Incorporate requirements for post-quantum cryptography in new contracts and service-level agreements to ensure vendor relationships align with quantum migration strategies.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create a comprehensive inventory of all cryptographic assets, identifying usage across data-in-transit, at-rest, and in-use, including algorithm and key details.
    - _T2 Risk-Informed · all_: Capture metadata for cryptographic assets including ownership, usage, and lifecycle management to ensure a full picture of the cryptographic landscape.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Implement crypto-agile systems that can quickly adapt to future cryptographic requirements and quantum threats to facilitate migration to quantum-safe algorithms.
