---
generated: 2026-09-11
category: Compliance Frameworks
document_count: 8
requirement_count: 72
---

## CISA-Bad-Practices-PQC-2025
- **Source**: CISA/FBI Product Security Bad Practices (Updated — PQC Recommendation)
- **URL**: https://www.cisa.gov/resources-tools/resources/product-security-bad-practices
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · software_: Publish a memory safety roadmap by end of 2025 outlining prioritized approach to eliminating memory safety vulnerabilities in priority code components.
    - _T2 Risk-Informed · software_: Establish a process for managing open source software incorporation, including security scanning, maintenance evaluation, and dependency monitoring.
    - _T2 Risk-Informed · software_: Integrate scanning for the presence of secrets or credentials in code into development processes to prevent hardcoded credentials.
- **Inventory**:
    - _T3 Repeatable · software_: Maintain a software bill of materials (SBOM) in an industry-standard, machine-readable format describing all first- and third-party dependencies and provide it to customers.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Begin supporting standardized post-quantum cryptographic algorithms consistent with NIST guidance and avoid known insecure algorithms like TLS 1.0/1.1, MD5, SHA-1, and DES.
    - _T2 Risk-Informed · software_: Include the cost of updating to new major versions of third-party open source dependencies in business planning to ensure security fixes for the product life.
    - _T3 Repeatable · software_: Issue a patch at no cost to users within 30 days of a patch becoming available for a component containing a Known Exploited Vulnerability (KEV).
- **Observability**:
    - _T2 Risk-Informed · software_: Provide customers with current and historical artifacts and capabilities sufficient to gather evidence of intrusion, including configuration changes, identity flows, and data access.
    - _T3 Repeatable · software_: Routinely monitor for Common Vulnerabilities and Exposures (CVEs) or other security-relevant alerts, such as end-of-life, in all open source software dependencies.

## EO-14144
- **Source**: Executive Order 14144 — Strengthening and Promoting Innovation in the Nation's Cybersecurity
- **URL**: https://www.federalregister.gov/documents/2025/01/17/2025-01470/strengthening-and-promoting-innovation-in-the-nations-cybersecurity
- **Requirement count**: 14
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Allow CISA to centrally verify the completeness of attestation forms and validate a sample of attestations using high-level artifacts.
    - _T3 Repeatable · software_: Respond to CISA notifications regarding incomplete attestations or insufficient artifacts and allow for public posting of validation results.
- **Governance**:
    - _T3 Repeatable · all_: Integrate cybersecurity supply chain risk management into enterprise-wide risk management activities per NIST SP 800-161 Revision 1.
    - _T3 Repeatable · all_: Provide annual updates to OMB regarding the completion of cybersecurity supply chain risk management implementation.
    - _T3 Repeatable · all_: Implement role-based access controls, least privilege, and separation of duties to govern CISA access to agency EDR solutions.
    - _T3 Repeatable · software_: Submit machine-readable secure software development attestations and high-level validation artifacts to CISA's RSAA repository.
    - _T3 Repeatable · software_: Provide a list of Federal Civilian Executive Branch agency software customers as part of the attestation submission.
    - _T3 Repeatable · software_: Implement secure software development, security, and operations practices based on NIST SP 800-218 (SSDF) as guided by the NIST consortium.
    - _T3 Repeatable · software_: Adopt security assessments and patching practices for open source software in accordance with joint CISA and OMB recommendations.
- **Inventory**:
    - _T3 Repeatable · all_: Provide CISA with a list of systems, endpoints, and data sets requiring additional controls or non-disruption periods for threat hunting.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Securely and reliably deploy patches and updates in accordance with updated NIST SP 800-53 guidance.
    - _T3 Repeatable · software_: Incorporate select practices for secure development and delivery of software from the updated NIST SSDF into OMB M-22-18 requirements.
- **Observability**:
    - _T3 Repeatable · all_: Enroll endpoints using authorized EDR solutions in the CISA Persistent Access Capability program to enable timely threat hunting.
    - _T3 Repeatable · all_: Provide CISA with data of sufficient completeness and on required timelines to enable timely hunting and identification of novel cyber threats.

## EO-14306
- **Source**: Executive Order 14306 — Sustaining Select Cybersecurity Efforts (PQC Provisions)
- **URL**: https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a pilot program for a rules-as-code approach to create machine-readable versions of cybersecurity policy and guidance.
    - _T2 Risk-Informed · software_: Incorporate management of AI software vulnerabilities and compromises into existing vulnerability management processes, including incident tracking and response.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Support Transport Layer Security protocol version 1.3 or a successor version to prepare for the transition to post-quantum cryptography.

## EU-NIS-CG-Roadmap-v1.1
- **Source**: EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/117507
- **Requirement count**: 11
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a national PQC transition strategy and roadmap by the end of 2026, including a defined timeline and implementation plan.
    - _T2 Risk-Informed · all_: Integrate the quantum threat into the risk management processes of all relevant entities.
- **Inventory**:
    - _T2 Risk-Informed · all_: Establish mature cryptographic asset management to facilitate the transition to PQC and improve cryptographic agility.
    - _T2 Risk-Informed · all_: Create dependency maps of cryptographic assets as part of the initial steps for the PQC transition.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Complete the PQC transition for high-risk use cases by the end of 2030.
    - _T3 Repeatable · all_: Complete the PQC transition for medium-risk use cases by the end of 2035.
    - _T3 Repeatable · all_: Prohibit the standalone use of quantum-vulnerable public-key mechanisms for high-risk use cases after the end of 2030.
    - _T3 Repeatable · all_: Prohibit the standalone use of quantum-vulnerable public-key mechanisms for medium-risk use cases after the end of 2035.
    - _T3 Repeatable · all_: Use standardized and tested hybrid cryptographic solutions whenever feasible and suitable during the migration.
    - _T3 Repeatable · software_: Enable quantum-safe software and firmware upgrades by default by the end of 2030.
- **Observability**:
    - _T2 Risk-Informed · all_: Provide regular status updates to the NIS CG work stream on PQC to ensure harmonized implementation.

## EUDI-Wallet-ARF
- **Source**: EUDI Wallet ARF v3.0.0
- **URL**: https://raw.githubusercontent.com/eu-digital-identity-wallet/eudi-doc-architecture-and-reference-framework/v2.9.0/docs/architecture-and-reference-framework-main.md
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · keys_: Manage PID private keys exclusively on Level of Assurance High using WSCA/WSCD, prohibiting their use in standard keystores.
    - _T2 Risk-Informed · keys_: Implement access control measures for remote WSCDs (HSMs) to ensure only legitimate Wallet Instances can access critical assets, evaluated during certification.
    - _T2 Risk-Informed · software_: Support mandatory attestation formats (ISO/IEC 18013-5 and SD-JWT VC) in Wallet Units to ensure interoperability and compliance with ecosystem standards.
    - _T2 Risk-Informed · software_: Apply the HAIP profile for SD-JWT VCs to ensure interoperability between Wallet Units and Relying Parties by resolving specification options.
    - _T3 Repeatable · keys_: Ensure Wallet Secure Cryptographic Devices (WSCD) are assessed against assurance level high requirements as a prerequisite for certification under national schemes.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Implement state transitions for PIDs and attestations to handle expiration and revocation, ensuring they cannot transition back to Valid once expired or revoked.

## PQCC-Inventory-Workbook-2025
- **Source**: Post-Quantum Cryptography Coalition (PQCC) PQC Inventory Workbook
- **URL**: https://pqcc.org/pqc-inventory-workbook/
- **Requirement count**: 11
- **Governance**:
    - _T2 Risk-Informed · all_: Assign a Point of Contact (POC) responsible for the cybersecurity risk associated with the organization's use of each system.
    - _T2 Risk-Informed · all_: Document the organization or sub-team responsible for each asset to track migration progress across subdivisions.
    - _T2 Risk-Informed · all_: Identify external vendor organizations and their Points of Contact to support vendor engagement during PQC migration.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create a centralized inventory to track cryptographic migration efforts at the system or asset level, identifying and defining systems to track.
    - _T2 Risk-Informed · all_: Categorize assets by priority (high, medium, or low) to support PQC planning and resource allocation.
    - _T2 Risk-Informed · all_: Populate the inventory with available information, including asset type, POC details, and PQC status.
    - _T2 Risk-Informed · all_: Update the inventory as new data or systems are identified to maintain currency.
    - _T2 Risk-Informed · all_: Record the current post-quantum status of each asset, distinguishing between 'Needs Attention', 'Unknown', and 'Resolved' states.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Define the planned disposition for each asset (refresh, replacement, decommission, or none) to synchronize PQC migration with lifecycle decisions.
    - _T2 Risk-Informed · all_: Record the estimated or planned date for the asset's disposition action to track upcoming changes.
- **Observability**:
    - _T2 Risk-Informed · all_: Track the currency of inventory data by recording the most recent date each row was reviewed or modified.

## QCCPA-2022
- **Source**: Quantum Computing Cybersecurity Preparedness Act (H.R.7535)
- **URL**: https://www.congress.gov/bill/117th-congress/house-bill/7535
- **Requirement count**: 2
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a plan to migrate information technology to post-quantum cryptography following NIST standards issuance.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain an inventory of all information technology in use that is vulnerable to decryption by quantum computers.

## UK-DSIT-CNI-PQC-Perspectives-2025
- **Source**: UK DSIT — Perspectives on the Plan for PQC Transition from CNI Sectors
- **URL**: https://assets.publishing.service.gov.uk/media/692820edb3b9afff34e960f6/Regulator_and_industry_perspectives_on_the_current_plan_for_PQC_transition.pdf
- **Requirement count**: 16
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a prioritised migration plan within one year of adopting the first set of NIST standards for PQC.
    - _T2 Risk-Informed · all_: Formulate a comprehensive strategy for adopting PQC to ensure a coordinated and synchronised transition.
    - _T2 Risk-Informed · all_: Develop a gradual transition strategy towards quantum-resistant cryptography for applicable cryptographic products.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify cryptographic services that require upgrades and develop a migration plan by 2028.
    - _T2 Risk-Informed · all_: Survey the existing cryptographic situation to establish a baseline for migration planning.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Execute highest-priority PQC migration activities and refine plans as PQC evolves by 2031.
    - _T3 Repeatable · all_: Complete migration to PQC for all systems, services and products by 2035.
    - _T3 Repeatable · all_: Make cryptographic mechanisms adaptable to new advancements and standards and able to replace outdated algorithms.
    - _T3 Repeatable · all_: Use PQC in hybrid mode in combination with classical algorithms rather than in isolation.
    - _T3 Repeatable · all_: Use hybrid post-quantum mitigation for security products needing long-term protection or use beyond 2030.
    - _T3 Repeatable · software_: Begin transitioning software and firmware signing immediately, support and prefer CNSA 2.0 by 2025, and exclusively use CNSA 2.0 by 2030.
    - _T3 Repeatable · software_: Support and prefer CNSA 2.0 for web browsers, servers, and cloud services by 2025, and exclusively use CNSA 2.0 by 2033.
    - _T3 Repeatable · software_: Support and prefer CNSA 2.0 for traditional networking equipment by 2026, and exclusively use CNSA 2.0 by 2030.
    - _T3 Repeatable · software_: Support and prefer CNSA 2.0 for operating systems by 2027, and exclusively use CNSA 2.0 by 2033.
    - _T3 Repeatable · software_: Support and prefer CNSA 2.0 for niche equipment by 2030, and exclusively use CNSA 2.0 by 2033.
    - _T3 Repeatable · software_: Update or replace custom applications and legacy equipment by 2033.
