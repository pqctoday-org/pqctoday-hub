---
generated: 2026-08-30
category: Compliance Frameworks
document_count: 18
requirement_count: 100
---

## ANSSI PQC Follow-up Paper
- **Source**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **URL**: https://cyber.gouv.fr/sites/default/files/document/follow_up_position_paper_on_post_quantum_cryptography.pdf
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Include the quantum threat in organizational risk analysis and consider quantum mitigation for relevant cryptographic products.
    - _T2 Risk-Informed · all_: Define a progressive transition strategy towards quantum-resistant cryptography for relevant cryptographic products.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Use hybrid post-quantum mitigation for products requiring confidentiality protection beyond 2030 or likely to be used after 2030 without updates.
    - _T2 Risk-Informed · keys_: Use ephemeral keys as much as possible for post-quantum KEMs to prevent attacks like decryption failures.
    - _T2 Risk-Informed · keys_: Protect the state of stateful signature schemes (XMSS/LMS) in integrity and against replay attacks.
    - _T2 Risk-Informed · libraries_: Dimension symmetric primitive parameters to ensure conjectured post-quantum security, at least equivalent to AES-256 for block ciphers and SHA2-384 for hash functions.
    - _T2 Risk-Informed · libraries_: Avoid modifying parameters of standardized post-quantum algorithm instances (e.g., CRYSTALS-Kyber, Dilithium, Falcon, XMSS, LMS, SPHINCS+).
    - _T2 Risk-Informed · libraries_: Use the highest possible NIST security level for post-quantum algorithms, preferably level-5 or level-3.
    - _T2 Risk-Informed · libraries_: Use the actively secure version (IND-CCA) of post-quantum KEMs as standardized by NIST.

## ANSSI-PQC-FAQ-2025
- **Source**: ANSSI Post-Quantum Cryptography FAQ
- **URL**: https://cyber.gouv.fr/cryptographie-post-quantique-faq
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Ensure cryptographic products used in regulated scopes (defense, vital systems) are certified/qualified by ANSSI, with PQC obligations for qualification starting 2027.
- **Governance**:
    - _T2 Risk-Informed · all_: Include the quantum threat in organizational risk analysis and consider quantum protection measures for relevant cryptographic products.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct an inventory of cryptographic products, algorithms, and data requiring confidentiality/authenticity beyond 2030 to identify critical use cases for PQC transition.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Integrate PQC requirements into IT system renewal cycles and procurement strategies to ensure transition is anticipated and managed.
    - _T3 Repeatable · all_: Cease procurement of products that do not integrate Post-Quantum Cryptography (PQC) after the year 2030.
    - _T3 Repeatable · all_: Implement hybridization of post-quantum and pre-quantum asymmetric algorithms where quantum protection is necessary, as it is mandatory for regulated scopes.

## BSI-ANSSI-QKD-Position-2024
- **Source**: BSI/ANSSI/NLNCSA/SNCSA Joint Position Paper on QKD and Quantum Cryptography
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum_Positionspapier.pdf?__blob=publicationFile&v=4
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Conduct rigorous evaluation of concrete QKD implementations to obtain assurance about security, as theoretical claims do not apply to actual devices.
    - _T3 Repeatable · all_: Require standardized QKD protocols with precise, comprehensive security proofs that reflect realistic conditions before deployment.
- **Governance**:
    - _T2 Risk-Informed · all_: Prioritize migration to post-quantum cryptography and symmetric keying over QKD for quantum-safe key establishment.
    - _T2 Risk-Informed · all_: Restrict QKD deployment to niche use cases where specific security requirements justify high costs and less expensive options are not feasible.

## CA-CFDIR-Quantum-Readiness-2023
- **Source**: Canada CFDIR Quantum-Readiness Best Practices and Guidelines
- **URL**: https://ised-isde.canada.ca/site/spectrum-management-telecommunications/sites/default/files/attachments/2023/cfdir-quantum-readiness-best-practices-v03.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Assess the post-quantum posture of third parties using recommended questionnaires and engagement guidelines.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a plan to transition digital systems to quantum-resistant cryptographic technologies based on recommended best practices.
- **Inventory**:
    - _T2 Risk-Informed · all_: Discover and document all uses of cryptography within the organization to establish a baseline for quantum-risk assessment.
    - _T2 Risk-Informed · all_: Catalog technology vendor and supplier post-quantum cryptography capabilities to assess third-party risk.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for the migration of cryptographic systems, accounting for long product lifetimes and data protection requirements.

## CA-TBS-SPIN-PQC-2025
- **Source**: Canada TBS SPIN 2025-01 — Migrating Government of Canada Systems to Post-Quantum Cryptography
- **URL**: https://www.canada.ca/en/government/system/digital-government/policies-standards/spin/migrating-government-canada-post-quantum-cryptography.html
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a high-level departmental PQC migration plan clarifying roles, responsibilities, and financial requirements for systems using cryptography.
    - _T2 Risk-Informed · all_: Report on PQC migration progress annually with incremental updates to the departmental migration plan.
    - _T2 Risk-Informed · all_: Designate a responsible departmental point of contact for migration planning and oversight within system records.
    - _T2 Risk-Informed · all_: Include procurement clauses in contracts for IT systems supporting PQC compliance, CMVP certification, and cryptographic agility.
- **Inventory**:
    - _T2 Risk-Informed · all_: Update IT system records to include cryptographic details, components, algorithms, protocols, dependencies, and vendor lifecycle information.
    - _T2 Risk-Informed · all_: Identify high-priority systems for PQC migration, including those susceptible to 'harvest now, decrypt later' threats.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Begin transitioning responsible systems to quantum-safe cryptography by April 1, 2028.
    - _T2 Risk-Informed · all_: Complete PQC migration of high-priority systems by the end of 2031.
    - _T2 Risk-Informed · all_: Complete PQC migration of remaining systems by the end of 2035.

## CZ-NUKIB-Crypto-Requirements-2023
- **Source**: NUKIB Minimum Requirements for Cryptographic Algorithms v4.0
- **URL**: https://nukib.gov.cz/download/publications_en/Minimum%20Requirements%20for%20Cryptographic%20Algorithms.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Implement stand-alone post-quantum key establishment algorithm ML-KEM-1024 according to the NIST standard FIPS 203.
- **Governance**:
    - _T2 Risk-Informed · all_: Liable entities under the Cyber Security Act must take into account NUKIB cryptographic recommendations to protect information and communication system assets.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for the replacement of quantum-vulnerable classical asymmetric algorithms with suitable quantum-resistant cryptography in the near future.
    - _T2 Risk-Informed · software_: Use stand-alone post-quantum digital signature algorithms (LMS, XMSS) only for firmware and software integrity protection.

## EU-BSI-PQC-Joint-Statement-2024
- **Source**: Joint Statement on PQC Migration by 21 EU Member State Cybersecurity Agencies
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/PQC-joint-statement.pdf
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a risk-oriented roadmap for the PQC transition, considering data sensitivity, protection periods, and mitigation of 'store now, decrypt later' attacks.
    - _T2 Risk-Informed · all_: Design transition plans to reinforce global resilience, engaging with EU member state work streams on PQC roadmaps.
- **Inventory**:
    - _T2 Risk-Informed · all_: Perform a quantum threat analysis that includes a comprehensive inventory of assets requiring protection and applications utilizing cryptography.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan the migration with prioritization, involving all necessary business processes and budgeting for the transition to post-quantum cryptography.
    - _T2 Risk-Informed · all_: Protect systems handling sensitive data against 'store now, decrypt later' attacks as soon as possible, no later than the end of 2030.
    - _T2 Risk-Informed · certificates_: Develop detailed transition plans for public-key infrastructure (PKI) systems by the end of 2030 to ensure timely migration.

## Europol-QSFF-Call-to-Action-2025
- **Source**: Europol Quantum Safe Financial Forum — Call to Action
- **URL**: https://www.europol.europa.eu/cms/sites/default/files/documents/Quantum-safe-financial-forum-2025.pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Establish and initiate transition plans with top management support, dedicating resources and upskilling IT teams to manage the quantum-safe cryptography transition.
    - _T2 Risk-Informed · all_: Coordinate with stakeholders, vendors, and policymakers to develop aligned transition roadmaps, identifying dependencies and critical paths for a unified approach.
- **Inventory**:
    - _T1 Partial · all_: Conduct cryptography inventory efforts to identify current cryptographic usage and prepare for the update to post-quantum cryptography.

## NIST SP 800-82 Rev. 3
- **Source**: Guide to Operational Technology (OT) Security
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Establish OT cybersecurity governance structures and define OT-specific policies and procedures to manage security risks within the operational technology environment.
    - _T2 Risk-Informed · all_: Implement a Risk Management Framework for OT systems to categorize, select, implement, and assess security controls tailored to OT environments.
    - _T2 Risk-Informed · all_: Build and train a cross-functional team to implement the OT cybersecurity program, ensuring defined roles and responsibilities for security operations.
    - _T2 Risk-Informed · all_: Establish a charter for the OT cybersecurity program and present a business case to leadership to secure resources and organizational support.

## NSM-10
- **Source**: National Security Memorandum 10 — Promoting U.S. Leadership in Quantum Computing
- **URL**: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2022/05/04/national-security-memorandum-on-promoting-united-states-leadership-in-quantum-computing-while-mitigating-risks-to-vulnerable-cryptographic-systems/
- **Requirement count**: 5
- **Governance**:
    - _T3 Repeatable · all_: Federal agencies must develop and execute a plan to upgrade non-NSS IT systems to quantum-resistant cryptography, prioritizing significant risks and coordinating for interoperability.
    - _T3 Repeatable · all_: Federal agencies must not procure commercial quantum-resistant cryptographic solutions for enterprise/mission IT until NIST standards are released, though testing pre-standardized solutions is recommended.
- **Inventory**:
    - _T3 Repeatable · all_: Federal agencies must deliver an annual inventory of IT systems vulnerable to CRQCs, detailing current cryptographic methods, system administrator protocols, and key assets.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: NIST must release a proposed timeline for the deprecation of quantum-vulnerable cryptography, aiming to migrate systems off vulnerable crypto within a decade of initial standards publication.
- **Observability**:
    - _T3 Repeatable · all_: OMB must establish requirements for inventorying deployed cryptographic systems, including a common, preferably automated, assessment process for evaluating migration progress.

## NSM-8
- **Source**: National Security Memorandum 8 — Improving the Cybersecurity of National Security, DoD, and IC Systems
- **URL**: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2022/01/19/memorandum-on-improving-the-cybersecurity-of-national-security-department-of-defense-and-intelligence-community-systems/
- **Requirement count**: 9
- **Governance**:
    - _T3 Repeatable · all_: Agencies must update plans to prioritize resources for cloud adoption and Zero Trust Architecture implementation within 60 days.
    - _T3 Repeatable · all_: Agencies must develop a plan to implement Zero Trust Architecture incorporating NIST SP 800-207 and CNSS instructions within 60 days.
    - _T3 Repeatable · all_: Agencies must report cloud and Zero Trust implementation plans to the CNSS and National Manager within 60 days.
    - _T3 Repeatable · all_: Agencies must identify and maintain an inventory of systems designated as National Security Systems (NSS) within 90 days.
    - _T3 Repeatable · all_: Agencies must authorize exceptions for non-compliant encryption or inability to implement MFA/encryption, subject to National Manager review.
    - _T3 Repeatable · all_: Agencies must not authorize new systems to operate without NSA-approved encryption algorithms, absent an authorized exception.
    - _T3 Repeatable · all_: Agencies must report instances of non-compliant encryption, transition timelines, and exceptions to the National Manager within 180 days.
    - _T3 Repeatable · all_: Agencies must adhere to software standards developed under EO 14028 for software used on NSS, unless an exception is authorized.
    - _T3 Repeatable · all_: Agencies must notify the National Manager, SecDef, and DNI before re-designating an NSS as non-NSS.

## OMB-M-23-02
- **Source**: OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography
- **URL**: https://www.whitehouse.gov/wp-content/uploads/2022/11/M-23-02-M-Memo-on-Migrating-to-Post-Quantum-Cryptography.pdf
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a cryptographic inventory and migration lead within 30 days to coordinate PQC transition efforts.
- **Inventory**:
    - _T2 Risk-Informed · all_: Submit a prioritized inventory of CRQC-vulnerable cryptographic systems to ONCD and CISA annually.
    - _T2 Risk-Informed · keys_: Report cryptographic algorithm, service provided, and key/module length for each vulnerable system.
    - _T2 Risk-Informed · software_: Identify vendor and type (COTS/GOTS/Custom) for software packages containing vulnerable crypto systems.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Submit annual funding assessments for migrating inventoried systems to post-quantum cryptography.
- **Observability**:
    - _T1 Partial · all_: Participate in the development of automated tooling strategies for assessing PQC adoption progress.

## SG-MAS-Quantum-Advisory-2024
- **Source**: MAS Advisory on Addressing Cybersecurity Risks Associated with Quantum Computing
- **URL**: https://www.mas.gov.sg/-/media/mas-media-library/regulation/circulars/trpd/mas-quantum-advisory/mas-quantum-advisory.pdf
- **Requirement count**: 8
- **Governance**:
    - _T2 Risk-Informed · all_: Review internal policies, standards, and procedures to ensure relevance during the transition to quantum security solutions.
    - _T2 Risk-Informed · all_: Ensure senior management and third-party vendors understand quantum threats and support the transition to quantum security solutions.
    - _T2 Risk-Informed · all_: Work with third-party IT vendors to assess supply chain risks from quantum threats and request quantum-resistant solutions when available.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify and maintain an inventory of cryptographic solutions, including algorithm, key length, ownership, and system location, to determine vulnerability to quantum threats.
    - _T2 Risk-Informed · all_: Classify IT and data assets dependent on vulnerable cryptographic solutions based on sensitivity, criticality, and risk exposure to prioritize migration efforts.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop risk mitigation strategies for assets that cannot be migrated to PQC and plan for contingency scenarios where quantum risks materialize early.
    - _T2 Risk-Informed · all_: Assess existing system infrastructures for crypto-agility support and consider upgrades to address limitations hindering the transition to quantum security.
- **Observability**:
    - _T2 Risk-Informed · all_: Monitor ongoing quantum computing developments for cybersecurity threats and risks impacting financial services and their mitigation.

## US-CISA-ACDI-Strategy-2024
- **Source**: CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools
- **URL**: https://www.cisa.gov/sites/default/files/2024-09/Strategy-for-Migrating-to-Automated-PQC-Discovery-and-Inventory-Tools.pdf
- **Requirement count**: 4
- **Inventory**:
    - _T2 Risk-Informed · all_: Manually collect inventory data items (e.g., FISMA ID, categorization, HVA status) that cannot be detected by currently available automated tools.
    - _T3 Repeatable · all_: Deploy automated cryptography discovery and inventory (ACDI) tools to detect and catalog CRQC-vulnerable cryptographic systems across FCEB assets.
    - _T3 Repeatable · software_: Integrate ACDI tools with the Continuous Diagnostics and Mitigation (CDM) Program to automate the collection of cryptographic characteristics for reporting.
- **Observability**:
    - _T3 Repeatable · all_: Report PQC adoption metrics and inventory data to ONCD and CISA via CyberScope as part of the annual submission process.

## US-CISA-PQC-OT-2024
- **Source**: CISA Post-Quantum Considerations for Operational Technology
- **URL**: https://www.cisa.gov/sites/default/files/2024-10/Post-Quantum%20Considerations%20for%20Operational%20Technology%20(508).pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Develop and implement a post-quantum cryptography transition plan, identifying necessary personnel and resources to address CRQC threats.
- **Inventory**:
    - _T2 Risk-Informed · all_: Inventory OT systems to identify cryptographic dependencies and assets requiring post-quantum mitigation.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Use quantum-resistant algorithms where appropriate to mitigate risks from cryptanalytically relevant quantum computers.
    - _T2 Risk-Informed · libraries_: Ensure crypto-agility in applications and protocols to facilitate the transition to quantum-resistant algorithms.
    - _T2 Risk-Informed · software_: Apply quantum mitigation considerations to platform update schedules and upgrade lifecycles to ensure timely transition.

## US-QCCPA-2022
- **Source**: Quantum Computing Cybersecurity Preparedness Act (Public Law 117-260)
- **URL**: https://www.govinfo.gov/content/pkg/PLAW-117publ260/pdf/PLAW-117publ260.pdf
- **Requirement count**: 4
- **Governance**:
    - _T3 Repeatable · all_: Develop a plan to migrate agency IT to post-quantum cryptography consistent with OMB-mandated prioritization.
- **Inventory**:
    - _T3 Repeatable · all_: Establish and maintain a current inventory of IT systems vulnerable to quantum decryption, prioritized by risk criteria.
- **Observability**:
    - _T3 Repeatable · all_: Implement an automated process to evaluate progress on migrating IT to post-quantum cryptography.
    - _T3 Repeatable · all_: Report the inventory of vulnerable IT and required data to OMB, CISA, and the National Cyber Director annually.

## WH-PQC-Report-2024
- **Source**: White House Report on Post-Quantum Cryptography (July 2024)
- **URL**: https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/07/REF_PQC-Report_FINAL_Send.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Develop deliberate multi-year plans for PQC migration, focusing on interoperability and operational impacts.
- **Inventory**:
    - _T3 Repeatable · all_: Perform annual manual cryptographic inventory to discover quantum-vulnerable algorithms and catalog key attributes, supplementing automated tools.
    - _T3 Repeatable · all_: Maintain a comprehensive and ongoing cryptographic inventory as a baseline for PQC migration, updating it iteratively as systems change.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Prioritize migration of high-impact systems, high-value assets, and data sensitive until 2035 to post-quantum cryptography.
    - _T2 Risk-Informed · all_: Identify systems that cannot support PQC algorithms early in the migration planning process.

## eIDAS-2-Regulation
- **Source**: eIDAS 2.0 Regulation (EU 2024/1183)
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Integrate privacy-preserving cryptographic technologies, such as zero-knowledge proofs, into the European Digital Identity Wallet.
- **Governance**:
    - _T3 Repeatable · certificates_: Implement technical measures to keep personal data related to European Digital Identity Wallets logically separate from any other data held by the provider.
    - _T3 Repeatable · certificates_: Prevent providers from combining personal data obtained when providing other services with data processed for European Digital Identity Wallet services.
- **Observability**:
    - _T3 Repeatable · certificates_: Provide a default-active dashboard allowing users to track all transactions, including time, counterpart, and data shared, with non-repudiable authenticity.
