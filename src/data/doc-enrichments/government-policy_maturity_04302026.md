---
generated: 2026-04-30
category: Compliance Frameworks
document_count: 42
requirement_count: 210
---

## ANSSI PQC Follow-up Paper

- **Source**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **URL**: https://cyber.gouv.fr/sites/default/files/document/follow_up_position_paper_on_post_quantum_cryptography.pdf
- **Requirement count**: 8
- **Governance**:
  - _T2 Risk-Informed · all_: Include the quantum threat in organizational risk analysis and consider quantum mitigation for relevant cryptographic products.
  - _T2 Risk-Informed · all_: Define a progressive transition strategy towards quantum-resistant cryptography for relevant cryptographic products.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Use ephemeral keys as much as possible for post-quantum KEMs to prevent decryption failure attacks.
  - _T2 Risk-Informed · keys_: Protect the state of stateful signature schemes (XMSS/LMS) against integrity violations and replay attacks.
  - _T2 Risk-Informed · libraries_: Dimension symmetric primitive parameters to ensure post-quantum security, using at least AES-256 equivalent for block ciphers and SHA2-384 for hash functions.
  - _T2 Risk-Informed · libraries_: Avoid modifying parameters of standardized post-quantum algorithm instances (e.g., CRYSTALS-Kyber, Dilithium, Falcon, XMSS, LMS, SPHINCS+).
  - _T2 Risk-Informed · libraries_: Use the highest possible NIST security level for post-quantum algorithms, preferably level-5 or level-3.
  - _T2 Risk-Informed · software_: Implement hybrid post-quantum mitigation for security products requiring confidentiality protection beyond 2030 or used after 2030 without updates.

## ANSSI-BSI-QKD-Position-Paper

- **Source**: ANSSI BSI QKD Position Paper
- **Requirement count**: 3
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Conduct rigorous evaluation of QKD systems to obtain assurance about the security of concrete implementations.
- **Governance**:
  - _T2 Risk-Informed · all_: Prioritize migration to post-quantum cryptography and symmetric keying over QKD for quantum-safe key establishment.
  - _T2 Risk-Informed · all_: Restrict QKD implementation to niche use cases where specific security requirements justify high costs and less expensive options are not feasible.

## ANSSI-PQC-FAQ-2025

- **Source**: ANSSI Post-Quantum Cryptography FAQ
- **URL**: https://cyber.gouv.fr/cryptographie-post-quantique-faq
- **Requirement count**: 7
- **Assurance / FIPS**:
  - _T3 Repeatable · libraries_: Implement hybridization of post-quantum and pre-quantum asymmetric algorithms where quantum protection is necessary, except for hash-based signatures.
  - _T3 Repeatable · software_: Use only cryptographic algorithms proven by the academic community and recommended by ANSSI for PQC migration.
- **Governance**:
  - _T2 Risk-Informed · all_: Include the quantum threat in risk analysis and consider quantum protection measures for affected cryptographic products.
- **Inventory**:
  - _T2 Risk-Informed · all_: Conduct an inventory of cryptographic products, algorithms, and critical data requiring protection beyond 2030 to identify transition priorities.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · software_: Integrate PQC requirements into IT system renewal cycles to anticipate transition costs and ensure timely replacement of non-compliant products.
  - _T3 Repeatable · software_: Cease purchasing products that do not integrate Post-Quantum Cryptography after 2030.
  - _T3 Repeatable · software_: Ensure products are capable of changing parameter sets for NIST-standardized post-quantum cryptographic algorithms to support crypto-agility.

## BSI-ANSSI-QKD-Position-2024

- **Source**: BSI/ANSSI/NLNCSA/SNCSA Joint Position Paper on QKD and Quantum Cryptography
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/Quantum_Positionspapier.pdf?__blob=publicationFile&v=4
- **Requirement count**: 3
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Conduct rigorous evaluation of QKD systems to obtain assurance about the security of concrete implementations, as theoretical security claims do not apply to actual devices.
- **Governance**:
  - _T2 Risk-Informed · all_: Prioritize migration to post-quantum cryptography and symmetric keying over QKD for quantum-safe key establishment, as QKD is not yet sufficiently mature for general use.
  - _T2 Risk-Informed · all_: Restrict QKD implementation to niche use cases where specific security requirements justify high costs and less expensive options are not feasible.

## CA-CFDIR-Quantum-Readiness-2023

- **Source**: Canada CFDIR Quantum-Readiness Best Practices and Guidelines
- **URL**: https://ised-isde.canada.ca/site/spectrum-management-telecommunications/sites/default/files/attachments/2023/cfdir-quantum-readiness-best-practices-v03.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T2 Risk-Informed · all_: Engage third-party vendors to assess their post-quantum cryptography roadmap and capabilities via standardized questionnaires.
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a quantum-readiness plan and conduct a risk assessment to prioritize migration efforts based on data sensitivity and system criticality.
- **Inventory**:
  - _T2 Risk-Informed · all_: Discover and document all cryptographic use cases within the organization's digital systems to establish a baseline for quantum-risk assessment.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan for the orderly transition to quantum-safe cryptography, accounting for long product lifetimes and migration timelines.

## CA-TBS-SPIN-PQC-2025

- **Source**: Canada TBS SPIN 2025-01 — Migrating Government of Canada Systems to Post-Quantum Cryptography
- **URL**: https://www.canada.ca/en/government/system/digital-government/policies-standards/spin/migrating-government-canada-post-quantum-cryptography.html
- **Requirement count**: 4
- **Governance**:
  - _T3 Repeatable · all_: Develop and maintain a high-level departmental PQC migration plan with defined roles, responsibilities, and financial considerations for systems using cryptography.
  - _T3 Repeatable · all_: Report on PQC migration progress annually with incremental updates to the migration plan in accordance with Policy on Service and Digital.
  - _T3 Repeatable · all_: Designate a responsible departmental point of contact for migration planning and oversight within system records.
  - _T3 Repeatable · all_: Include procurement clauses in contracts for IT systems that support PQC compliance, CMVP certification, and cryptographic agility.

## CISA-Bad-Practices-PQC-2025

- **Source**: CISA/FBI Product Security Bad Practices (Updated — PQC Recommendation)
- **URL**: https://www.cisa.gov/resources-tools/resources/product-security-bad-practices
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Publicly document and explain why a KEV is not exploitable in the product if the manufacturer deems it cannot be exploited.
- **Governance**:
  - _T2 Risk-Informed · all_: Publish a memory safety roadmap by end of 2025 outlining prioritized approach to eliminating vulnerabilities in priority code components, including those handling cryptographic operations.
- **Inventory**:
  - _T3 Repeatable · software_: Maintain a machine-readable SBOM describing all first- and third-party software dependencies, both open source and proprietary, and provide this to customers.
- **Lifecycle / CLM**:
  - _T3 Repeatable · software_: Issue patches at no cost within 30 days of component patch availability for Known Exploited Vulnerabilities (KEVs) and clearly warn users of risks.

## CZ-NUKIB-Crypto-Requirements-2023

- **Source**: NUKIB Minimum Requirements for Cryptographic Algorithms
- **URL**: https://nukib.gov.cz/download/publications_en/Minimum%20Requirements%20for%20Cryptographic%20Algorithms.pdf
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Liable entities must take into account NUKIB cryptographic recommendations to protect information and communication system assets, as mandated by the Cyber Security Decree.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · libraries_: Plan for the replacement of quantum-vulnerable classical asymmetric algorithms with quantum-resistant cryptography in the near future.
  - _T2 Risk-Informed · software_: Use only NIST-standardized implementations (FIPS 203) for stand-alone post-quantum key establishment algorithms like ML-KEM-1024.
  - _T2 Risk-Informed · software_: Restrict the use of LMS and XMSS post-quantum signature algorithms exclusively to firmware and software integrity protection.
  - _T2 Risk-Informed · software_: Prefer standardized ML-KEM over original Kyber algorithms for hybrid key establishment, anticipating future approval of standardized versions only.

## DoD-CIO-PQC-Memo-2025

- **Source**: DoD CIO Memorandum — Preparing for Migration to Post Quantum Cryptography
- **URL**: https://dodcio.defense.gov/Portals/0/Documents/Library/PreparingForMigrationPQC.pdf
- **Requirement count**: 12
- **Governance**:
  - _T3 Repeatable · all_: Designate PQC migration leads in every Component responsible for inventory, coordination, risk management, and tracking readiness efforts.
  - _T3 Repeatable · all_: Submit contact information for PQC migration leads within 20 days and provide updated lists annually by September 30.
  - _T3 Repeatable · all_: Obtain cryptographic intake approval from the Director, DoD CIO PQC, before testing, evaluating, piloting, investing in, using, or acquiring any PQC-related technology.
  - _T3 Repeatable · all_: Obtain cryptographic deployment approval from the Director, DoD CIO PQC, before deploying any PQC-enabling or PQC-related technology.
  - _T3 Repeatable · all_: Submit relevant artifacts (test plans, results, acquisition artifacts, risk mitigations) immediately for any PQC engagement for review and risk assessment.
  - _T3 Repeatable · all_: Cease tests, pilots, or use of technology immediately if security issues are identified by the Director, DoD CIO PQC, and coordinate for remediation.
- **Inventory**:
  - _T3 Repeatable · all_: Identify and inventory all cryptography used in DoD information systems, including NSS, non-NSS, weapons systems, cloud, IoT, and OT, regardless of classification or location.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Phase out and replace cryptographic pre-shared keys (PSK) not provisioned through NSA KMI with NIST-approved asymmetric PQC algorithms by December 31, 2030.
  - _T3 Repeatable · keys_: Phase out and replace symmetric key establishment, agreement, and distribution protocols by December 31, 2030 (or 2031 for NSA CSfC registered solutions).
  - _T3 Repeatable · software_: Do not test, pilot, use, or procure commercial PSK-based solutions for quantum resistance effective immediately.
  - _T3 Repeatable · software_: Do not test, pilot, use, or procure commercial symmetric key establishment, agreement, or distribution protocols for quantum resistance effective immediately.
  - _T3 Repeatable · software_: Do not test, evaluate, pilot, use, or procure Quantum Confidentiality or Keying Technologies (e.g., QKD) for confidentiality, authenticity, or integrity unless excepted.

## EC-Recommendation-2024-1101

- **Source**: European Commission Recommendation on Post-Quantum Cryptography (2024/1101)
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202401101
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a comprehensive national strategy for Post-Quantum Cryptography adoption, defining clear goals, milestones, and timelines to ensure a coordinated transition.
  - _T2 Risk-Informed · all_: Establish a dedicated sub-group of experts to define and develop the Coordinated Implementation Roadmap, ensuring coordination with national authorities and ENISA.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Define national transition plans aligned with the Coordinated Implementation Roadmap, including timelines for migrating digital infrastructures to Post-Quantum Cryptography.
- **Observability**:
  - _T2 Risk-Informed · all_: Submit relevant information to the Commission upon request to enable monitoring of progress in drafting the roadmap and the effectiveness of transition measures.

## ECCG-ACM-v2

- **Source**: ECCG Agreed Cryptographic Mechanisms Version 2.0
- **URL**: https://certification.enisa.europa.eu/document/download/a845662b-aee0-484e-9191-890c4cfa7aaa_en?filename=ECCG+Agreed+Cryptographic+Mechanisms+version+2.pdf
- **Requirement count**: 6
- **Governance**:
  - _T2 Risk-Informed · all_: Establish a policy classifying cryptographic mechanisms as 'recommended' or 'legacy' based on security levels (125-bit vs 100-bit) and state-of-the-art status.
  - _T2 Risk-Informed · all_: Mandate that new systems use recommended algorithms; require justification for using legacy mechanisms in new systems.
  - _T2 Risk-Informed · all_: Establish a periodic review cycle (every two years) to update the list of agreed mechanisms based on the state of the art.
  - _T3 Repeatable · all_: Enforce that agreed constructions only use agreed primitives; if a construction uses a legacy primitive, the resulting mechanism is classified as legacy.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Define validity periods and deprecation deadlines for legacy mechanisms, requiring phase-out as soon as practical.
  - _T2 Risk-Informed · all_: Implement a review process to downgrade recommended mechanisms to legacy or remove them if cryptanalytic improvements pose immediate threats.

## ETSI-EN-319-411

- **Source**: ETSI EN 319 411 — Requirements for Trust Service Providers Issuing Certificates
- **URL**: https://www.etsi.org/deliver/etsi_en/319400_319499/31941101/01.03.01_60/en_31941101v010301p.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Conduct compliance audits and assessments to verify adherence to the CPS and CP, including audit logging and records archival.
- **Governance**:
  - _T3 Repeatable · all_: Maintain a Certification Practice Statement (CPS) and Certificate Policy (CP) that define security requirements, roles, and operational procedures for certificate issuance and management.
  - _T3 Repeatable · all_: Define physical, procedural, and personnel security controls for facilities and operations supporting the PKI.
  - _T3 Repeatable · certificates_: Define and document specific roles and responsibilities for PKI participants, including Certification Authorities, Subscribers, and Registration Authorities.
- **Lifecycle / CLM**:
  - _T3 Repeatable · certificates_: Implement documented procedures for certificate application processing, issuance, renewal, re-keying, modification, and revocation.
  - _T3 Repeatable · certificates_: Define procedures for end of subscription and termination of Certification Authority or Registration Authority services.
  - _T3 Repeatable · keys_: Establish procedures for key pair generation, installation, protection, and changeover, ensuring private keys are protected within cryptographic modules.
- **Observability**:
  - _T3 Repeatable · certificates_: Provide certificate status services (CRL or OCSP) to allow relying parties to verify the validity and revocation status of certificates.

## ETSI-TR-104-016

- **Source**: A Repeatable Framework for Quantum-Safe Migrations
- **URL**: https://www.etsi.org/deliver/etsi_tr/104000_104099/104016/01.01.01_60/tr_104016v010101p.pdf
- **Requirement count**: 4
- **Governance**:
  - _T3 Repeatable · all_: Align quantum-safe migration programs, plans, and processes with enterprise architecture and departmental responsibilities.
- **Inventory**:
  - _T3 Repeatable · all_: Generate comprehensive asset inventories as part of the repeatable migration framework to identify the crypto estate.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Execute migration plans based on dependency analysis and risk assessment to transition from quantum-vulnerable to quantum-safe states.
- **Observability**:
  - _T3 Repeatable · all_: Produce Asset, Department, and Enterprise Migration Status Reports to track progress and detect drift in migration status.

## EU-BSI-PQC-Joint-Statement-2024

- **Source**: Joint Statement on PQC Migration by 21 EU Member State Cybersecurity Agencies
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Crypto/PQC-joint-statement.pdf
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a risk-oriented roadmap for the PQC transition, accounting for data sensitivity, protection periods, and mitigation of 'store now, decrypt later' attacks.
- **Inventory**:
  - _T2 Risk-Informed · all_: Perform a quantum threat analysis that includes a comprehensive inventory of assets requiring protection and applications utilizing cryptography.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan the migration with prioritization, involving all necessary business processes and budgeting for the transition to post-quantum cryptography.
  - _T2 Risk-Informed · all_: Protect systems handling sensitive data against quantum threats by the end of 2030 and develop detailed transition plans for PKI systems within the same timeframe.

## Europol-QSFF-Call-to-Action-2025

- **Source**: Europol Quantum Safe Financial Forum — Call to Action
- **URL**: https://www.europol.europa.eu/publications-events/publications/quantum-safe-financial-forum-call-to-action
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Establish transition plans with top management support, dedicated resources, and upskilled IT teams to manage the shift to quantum-safe cryptography.
  - _T2 Risk-Informed · all_: Coordinate with stakeholders, vendors, and policymakers to align roadmaps, identify dependencies, and establish common goals for the PQC transition.
- **Inventory**:
  - _T1 Partial · all_: Initiate cryptography inventory efforts to identify current cryptographic usage and dependencies within the financial ecosystem.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Integrate the transition to post-quantum cryptography into current operational roadmaps to avoid crypto-procrastination and manage migration timelines.

## FIPS 199

- **Source**: Standards for Security Categorization of Federal Information and Information Systems
- **URL**: https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.199.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Categorize all federal information and systems based on potential impact to confidentiality, integrity, and availability to establish security baselines.
  - _T2 Risk-Informed · all_: Determine security categories for information types by assessing potential impact levels (Low, Moderate, High) for each security objective.
  - _T2 Risk-Informed · all_: Protect system information, including cryptographic key management data, at a level commensurate with the most critical user information processed.

## FS-ISAC-PQC-Timeline-2026

- **Source**: The Timeline for Post Quantum Cryptographic Migration: A Position Paper on the Financial Sector's Global Transition
- **URL**: https://www.fsisac.com/hubfs/Knowledge/PQC/FS-ISAC-PQC-Timelines-White-Paper.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Develop an initial preparedness plan to address cybersecurity risks associated with quantum computing.
  - _T2 Risk-Informed · all_: Start migration efforts to post-quantum cryptography as soon as possible to prevent crypto-procrastination.
- **Inventory**:
  - _T2 Risk-Informed · all_: Maintain a cryptographic inventory to provide information on the firm's level of cryptographic agility.

## GSA-PQC-Buyers-Guide-2025

- **Source**: GSA Post-Quantum Cryptography Buyer's Guide
- **URL**: https://buy.gsa.gov/api/system/files/documents/final-508c-pqc_buyer-s_guide_2025.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
  - _T2 Risk-Informed · all_: Identify tools or methods to demonstrate conformance with secure encryption practices and evaluate security practices of developers and suppliers.
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a timeline and implementation plan to transition to quantum-resistant cryptography, assessing all uses of vulnerable cryptography in unclassified systems.
  - _T2 Risk-Informed · all_: Develop new standards, tools, and best practices for complying with PQC criteria, including evaluating software security and supplier practices.
- **Inventory**:
  - _T3 Repeatable · all_: Submit comprehensive, centralized inventory of CRQC-vulnerable systems, applications, databases, and cryptographic assets to ONCD and CISA via CyberScope.
  - _T3 Repeatable · all_: Include details on high-impact systems, High Value Assets, systems with data sensitive until 2035, and asymmetric encryption-based access controls in the inventory.
  - _T3 Repeatable · all_: Report lifecycle characteristics of data, including types and protection duration, and identify systems that may delay migration due to interoperability constraints.
  - _T3 Repeatable · all_: Submit annual updates of the cryptographic inventory and associated funding assessments for PQC migration following the initial submission.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Prioritize systems for transition based on organizational functions, goals, and needs, and develop cryptographic agility to adjust encryption mechanisms.

## IN-TEC-PQC-Migration-Report-2025

- **Source**: India TEC Technical Report TEC 910018:2025 — Migration to Post-Quantum Cryptography
- **URL**: https://www.tec.gov.in/pdf/TR/Final%20technical%20report%20on%20migration%20to%20PQC%2028-03-25.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T2 Risk-Informed · all_: Test and validate the implementation of PQC solutions, including requesting Proof of Concept or pilots from vendors.
- **Governance**:
  - _T2 Risk-Informed · all_: Identify critical digital infrastructure, data, and applications affected by quantum threats to enable proactive investment and migration planning.
  - _T2 Risk-Informed · all_: Conduct risk assessments and define post-quantum requirements as part of the vendor alignment and migration planning process.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Develop and implement a migration plan for transitioning to Post-Quantum Cryptography, including hybrid solutions and crypto-agility.

## Meta-PQC-Migration-2026

- **Source**: Post-Quantum Cryptography Migration at Meta: Framework, Lessons, and Takeaways
- **URL**: https://engineering.fb.com/2026/04/16/security/post-quantum-cryptography-migration-at-meta-framework-lessons-and-takeaways/
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Establish qualitative criteria to classify applications into high, moderate, and low priority based on susceptibility to quantum attacks.
  - _T2 Risk-Informed · libraries_: Adopt algorithms recommended by reputable public standardization bodies rather than deviating from established standards.
- **Inventory**:
  - _T3 Repeatable · all_: Leverage automated monitoring tools to autonomously map cryptographic primitives used in production for high-fidelity data on active usage.
  - _T3 Repeatable · all_: Supplement automated discovery with developer reporting to capture cryptographic intent for new architectures and uncover legacy usage.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Implement guardrails by changing crypto standards and disallowing the creation of new keys and usage of affected APIs.

## NIST SP 800-111

- **Source**: Guide to Storage Encryption Technologies for End User Devices
- **URL**: https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-111.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Select storage encryption solutions that utilize FIPS-approved cryptographic features built into the operating system or devices.
- **Governance**:
  - _T2 Risk-Informed · all_: Evaluate and select authentication mechanisms that do not weaken security, avoiding single-factor authenticators like email passwords for encryption.
  - _T3 Repeatable · all_: Implement centralized management for storage encryption deployments to enforce policy, manage keys, and automate configuration updates.
- **Lifecycle / CLM**:
  - _T3 Repeatable · keys_: Plan and execute comprehensive key management processes including generation, storage, recovery, and destruction to ensure data availability.

## NIST SP 800-218

- **Source**: Secure Software Development Framework (SSDF) Version 1.1
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-218.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Integrate secure software development practices into existing SDLC and express requirements to third-party suppliers using SSDF conventions.
  - _T2 Risk-Informed · all_: Adopt a risk-based approach to determine which secure software development practices are relevant, appropriate, and effective for the organization.
  - _T2 Risk-Informed · all_: Ensure that people, processes, and technology are prepared to perform secure software development.

## NIST SP 800-37

- **Source**: Risk Management Framework for Information Systems and Organizations
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-37r2.pdf
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Establish responsibility and accountability for security controls implemented within information systems and inherited by those systems.
  - _T2 Risk-Informed · all_: Provide senior leaders with necessary information to make efficient, cost-effective risk management decisions about systems supporting missions.
  - _T3 Repeatable · all_: Implement continuous monitoring processes to promote near real-time risk management and ongoing information system authorization.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Incorporate security and privacy into the system development life cycle using a disciplined, structured, and flexible process.
- **Observability**:
  - _T3 Repeatable · all_: Execute continuous monitoring processes to enable near real-time risk management and ongoing authorization of information systems.

## NIST SP 800-66

- **Source**: Implementing the Health Insurance Portability and Accountability Act (HIPAA) Security Rule
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-66r2.pdf
- **Requirement count**: 7
- **Governance**:
  - _T2 Risk-Informed · all_: Designate a specific security official responsible for developing and implementing policies and procedures to ensure the security of electronic protected health information.
  - _T2 Risk-Informed · all_: Implement policies and procedures to prevent unauthorized access to electronic protected health information by workforce members.
  - _T2 Risk-Informed · all_: Implement policies and procedures for the regular review of security-related activity records, such as audit logs and access records.
  - _T2 Risk-Informed · all_: Implement policies and procedures to ensure the integrity of electronic protected health information by protecting it from improper alteration or destruction.
  - _T2 Risk-Informed · all_: Implement policies and procedures for the regular review of security-related activity records, such as audit logs and access records.
  - _T2 Risk-Informed · all_: Implement policies and procedures to periodically evaluate the security measures for electronic protected health information.
  - _T2 Risk-Informed · all_: Maintain written documentation of security policies and procedures as required by the Security Rule.

## NIST SP 800-82 Rev. 3

- **Source**: Guide to Operational Technology (OT) Security
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Establish OT cybersecurity governance structures and define OT-specific policies and procedures to manage security risks.
  - _T2 Risk-Informed · all_: Implement a Risk Management Framework for OT systems to categorize, select, implement, and assess security controls.
  - _T2 Risk-Informed · all_: Establish a charter for the OT cybersecurity program and present the business case to leadership to secure resources.

## NIST SP 800-88

- **Source**: Guidelines for Media Sanitization
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-88r1.pdf
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Define and assign specific roles and responsibilities for media sanitization, including Program Managers, CIOs, System Owners, and Security Officers.
  - _T2 Risk-Informed · all_: Document sanitization decisions and results to ensure accountability and traceability of media disposition activities.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Determine appropriate sanitization methods based on the security categorization of the information and the intended disposition of the media.
  - _T2 Risk-Informed · all_: Verify the effectiveness of sanitization methods and the competencies of personnel performing sanitization tasks.
  - _T2 Risk-Informed · all_: Control media throughout its lifecycle to prevent unauthorized access to residual data before, during, and after sanitization.

## NSA CNSA 2.0 FAQ

- **Source**: CNSA 2.0 Frequently Asked Questions
- **URL**: https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF
- **Requirement count**: 6
- **Assurance / FIPS**:
  - _T3 Repeatable · software_: Implement QR algorithms in NSS mission systems as NIAP validated products or with NIST CMVP validated modules.
  - _T3 Repeatable · software_: NSS code sources (signers) must produce signatures using hardware validated by NIST CMVP; no waivers granted for this requirement.
  - _T3 Repeatable · software_: Signature verification code must be validated by NIST’s Cryptographic Algorithm Validation Program (CAVP).
  - _T3 Repeatable · software_: Commercial vendors performing only signature verification must use CAVP-validated code to meet CNSA 2.0.
- **Governance**:
  - _T2 Risk-Informed · all_: Follow CJCSN 65104 and CNSSAM 01-07-NSM for high-grade equipment; follow CNSA 1.0 for commercial equipment until CNSSP 15 transition.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Upgrade all fielded NSS employing public-standard algorithms to CNSA 2.0 in a timely fashion, unless a waiver is obtained.

## NSM-10

- **Source**: National Security Memorandum 10 — Promoting U.S. Leadership in Quantum Computing
- **URL**: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2022/05/04/national-security-memorandum-on-promoting-united-states-leadership-in-quantum-computing-while-mitigating-risks-to-vulnerable-cryptographic-systems/
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Agencies funding quantum research must identify a liaison to the National Quantum Coordination Office to share information and best practices within 90 days.
  - _T3 Repeatable · all_: Federal agencies must develop and submit plans to upgrade non-NSS IT systems to quantum-resistant cryptography, prioritizing significant risks and coordinating with OMB.
- **Inventory**:
  - _T3 Repeatable · all_: Federal agencies must deliver an annual inventory of IT systems vulnerable to CRQCs, including cryptographic methods and key assets, to CISA and the National Cyber Director.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: NIST shall release a proposed timeline for the deprecation of quantum-vulnerable cryptography standards to facilitate migration to quantum-resistant alternatives.
- **Observability**:
  - _T3 Repeatable · all_: The National Cyber Director must deliver an annual status report on FCEB agencies' progress in migrating to quantum-resistant cryptography, including funding assessments.

## OMB-M-23-02

- **Source**: OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography
- **URL**: https://www.whitehouse.gov/wp-content/uploads/2022/11/M-23-02-M-Memo-on-Migrating-to-Post-Quantum-Cryptography.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
  - _T2 Risk-Informed · software_: Engage in testing pre-standardized PQC in production environments with appropriate monitoring and safeguards alongside current approved algorithms.
- **Governance**:
  - _T2 Risk-Informed · all_: Designate a cryptographic inventory and migration lead within 30 days to coordinate agency-wide PQC transition efforts.
- **Inventory**:
  - _T3 Repeatable · all_: Submit an annual prioritized inventory of CRQC-vulnerable cryptographic systems to ONCD and CISA by May 4, 2023, and annually thereafter.
  - _T3 Repeatable · all_: Inventory must include FISMA ID, FIPS 199 categorization, HVA ID, algorithm details, service type, key length, software origin, OS version, and hosting environment.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Submit an assessment of funding required to migrate inventoried systems to post-quantum cryptography within 30 days of each annual inventory submission.
- **Observability**:
  - _T2 Risk-Informed · all_: Participate in the development of automated tooling strategies for assessing agency progress towards PQC adoption, including discovery of internet-accessible and internal systems.

## QCCPA-2022

- **Source**: Quantum Computing Cybersecurity Preparedness Act (H.R.7535)
- **URL**: https://www.congress.gov/bill/117th-congress/house-bill/7535
- **Requirement count**: 6
- **Inventory**:
  - _T3 Repeatable · all_: Establish and maintain an inventory of each cryptographic system in use, as mandated by OMB rule or binding guidance.
  - _T3 Repeatable · all_: Report an inventory of all information technology vulnerable to quantum decryption to OMB, CISA, and the National Cyber Director.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Develop a plan to migrate information technology to post-quantum cryptography following NIST standards issuance.
  - _T3 Repeatable · all_: Designate and prioritize information technology for migration based on quantum decryption risk.
- **Observability**:
  - _T3 Repeatable · all_: Implement an automated process to evaluate progress on migrating information technology to post-quantum cryptography.
  - _T3 Repeatable · all_: Submit annual reports on the progress of executive agencies in adopting post-quantum cryptography standards.

## Saudi-NCA-ECC2-2024

- **Source**: Saudi Arabia National Cybersecurity Authority — Essential Cybersecurity Controls ECC-2:2024
- **URL**: https://nca.gov.sa/
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Define, document, and approve a cybersecurity strategy supported by the head of the organization or delegate, aligning with laws and regulations.
  - _T2 Risk-Informed · all_: Establish a dedicated, independent cybersecurity function that reports directly to the head of the organization or delegate, separate from IT/ICT.
  - _T2 Risk-Informed · all_: Fill the cybersecurity function head position and critical supervisory roles with full-time, experienced Saudi cybersecurity professionals.
  - _T3 Repeatable · all_: Execute a roadmap to implement the cybersecurity strategy, defining priorities, monitoring initiatives, and taking corrective steps as necessary.
  - _T3 Repeatable · all_: Periodically review and update the cybersecurity strategy according to a documented plan, upon regulatory changes, or material organizational changes.

## Saudi-NCA-NCS1-2020

- **Source**: Saudi NCA — National Cryptographic Standards (NCS-1:2020)
- **URL**: https://nca.gov.sa/
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Establish documented cryptographic standards and policies defining minimum acceptable requirements for protecting national data, systems, and networks.
  - _T2 Risk-Informed · all_: Define and implement cryptographic strength levels (MODERATE or ADVANCED) based on the nature and sensitivity of protected assets.
  - _T2 Risk-Informed · certificates_: Define and enforce policies for Public Key Infrastructure (PKI), including accepted algorithms and certificate validity periods.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · keys_: Implement Key Lifecycle Management (KLM) processes to manage keys from creation through destruction, ensuring standardized usage.
  - _T2 Risk-Informed · keys_: Adhere to defined key protection and lifetime requirements as specified in the Key Lifecycle Management section.

## TNO-PQC-Migration-WP-2025

- **Source**: Migration to Post-Quantum Cryptography — Whitepaper 2025
- **Requirement count**: 3
- **Governance**:
  - _T2 Risk-Informed · all_: Develop a proactive quantum migration plan and assess the time value of confidential data versus quantum threat likelihood.
  - _T2 Risk-Informed · all_: Define action triggers based on quantum resource estimation, such as setting alarms for specific qubit counts to initiate pre-prepared action plans.
  - _T2 Risk-Informed · all_: Prioritize the adoption of low-cost mitigations as soon as practical to shore up defenses against quantum threats.

## UK-NCSC-Migration-Timelines-2025

- **Source**: NCSC PQC Migration Timelines Guidance
- **URL**: https://www.ncsc.gov.uk/guidance/pqc-migration-timelines
- **Requirement count**: 10
- **Governance**:
  - _T2 Risk-Informed · all_: Define migration goals and build an initial plan for migration by 2028, addressing sector-specific risks and regulatory requirements.
  - _T2 Risk-Informed · all_: Develop a migration plan including timelines for research, procurement, testing, and rollout, accounting for business continuity and rollback plans.
  - _T2 Risk-Informed · all_: Decide on a migration strategy (in-place, re-platform, retire, run until EOL, or tolerate risk) for each system, service, or product.
- **Inventory**:
  - _T2 Risk-Informed · all_: Carry out a full discovery exercise to assess the estate and identify services and infrastructure depending on cryptography that need upgrading to PQC.
  - _T2 Risk-Informed · all_: Build a clear understanding of the current estate, including key services, data records, protection methods, and system mappings.
  - _T2 Risk-Informed · all_: Ensure processes exist for identifying and managing assets (software and hardware) effectively, including version information and patch levels.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Complete migration to PQC of all systems, services, and products by 2035.
  - _T2 Risk-Informed · all_: Carry out early, highest-priority PQC migration activities and refine the plan into a thorough roadmap by 2031.
  - _T2 Risk-Informed · all_: Identify criteria for ending support for traditional algorithms to ensure full security against quantum threats once sole dependence is removed.
  - _T2 Risk-Informed · certificates_: Plan for the co-existence of traditional PKI and PQC PKI, potentially using parallel infrastructures or cross-signing during the transition.

## UK-NCSC-PQC-Whitepaper-2024

- **Source**: NCSC White Paper — Next Steps in Preparing for Post-Quantum Cryptography
- **URL**: https://www.ncsc.gov.uk/whitepaper/next-steps-preparing-for-post-quantum-cryptography
- **Requirement count**: 8
- **Assurance / FIPS**:
  - _T3 Repeatable · libraries_: Operational systems must only use post-quantum cryptography based on robust implementations of final standards, not earlier drafts.
  - _T3 Repeatable · software_: Operational systems must use protocol implementations based on RFCs, not on Internet Drafts.
- **Governance**:
  - _T2 Risk-Informed · all_: System owners must communicate with IT suppliers regarding their plans for supporting post-quantum cryptography in products.
  - _T2 Risk-Informed · all_: Technical system and risk owners must begin financial planning for updating systems to use post-quantum cryptography.
  - _T2 Risk-Informed · keys_: Use LMS and XMSS only in situations where it is possible to manage state in a trusted manner for the lifetime of the signing key.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Plan PQC upgrades to take place within broader technology refreshes as systems are updated or replaced at end of supported lifecycle.
  - _T2 Risk-Informed · all_: If using PQ/T hybrid schemes, use them as an interim measure within a flexible framework enabling straightforward migration to PQC-only.
  - _T2 Risk-Informed · software_: Ensure devices are updated to post-quantum cryptography when available by following guidance on keeping devices and software up to date.

## US-CISA-ACDI-Strategy-2024

- **Source**: CISA Strategy for Migrating to Automated PQC Discovery and Inventory Tools
- **URL**: https://www.cisa.gov/sites/default/files/2024-09/Strategy-for-Migrating-to-Automated-PQC-Discovery-and-Inventory-Tools.pdf
- **Requirement count**: 4
- **Inventory**:
  - _T2 Risk-Informed · all_: Manually collect inventory data items not supported by automated tools, including FISMA identifiers, system categorization, and data lifecycle characteristics.
  - _T3 Repeatable · all_: Deploy automated cryptographic discovery and inventory (ACDI) tools to identify CRQC-vulnerable systems and collect algorithm, service, and key length data.
  - _T3 Repeatable · software_: Integrate ACDI tools with the Continuous Diagnostics and Mitigation (CDM) Program to automate the collection of cryptographic system characteristics.
- **Observability**:
  - _T3 Repeatable · all_: Report PQC adoption metrics and inventory data to ONCD and CISA via CyberScope and CDM dashboards.

## US-CISA-PQC-OT-2024

- **Source**: CISA Post-Quantum Considerations for Operational Technology
- **URL**: https://www.cisa.gov/sites/default/files/2024-10/Post-Quantum%20Considerations%20for%20Operational%20Technology%20(508).pdf
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Develop and implement a post-quantum cryptography transition plan, identifying necessary personnel and resources immediately.
- **Inventory**:
  - _T2 Risk-Informed · all_: Inventory OT systems to identify cryptographic dependencies and assets requiring post-quantum mitigation.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · libraries_: Ensure crypto-agility in applications and protocols to facilitate transition to post-quantum algorithms.
  - _T2 Risk-Informed · software_: Apply quantum mitigation considerations to platform update schedules and upgrade lifecycles.

## US-NSA-CNSA-2.0-2022

- **Source**: NSA Commercial National Security Algorithm Suite 2.0 (CNSA 2.0)
- **URL**: https://www.quantum.gov/nsa-releases-future-quantum-resistant-algorithm-requirements-for-national-security-systems/
- **Requirement count**: 1
- **Governance**:
  - _T2 Risk-Informed · all_: Plan, prepare, and budget for the transition to quantum-resistant algorithms to assure sustained protection of National Security Systems.

## US-QCCPA-2022

- **Source**: Quantum Computing Cybersecurity Preparedness Act (Public Law 117-260)
- **URL**: https://www.govinfo.gov/content/pkg/PLAW-117publ260/pdf/PLAW-117publ260.pdf
- **Requirement count**: 4
- **Inventory**:
  - _T3 Repeatable · all_: Establish and maintain a current inventory of IT systems vulnerable to quantum decryption, prioritized per OMB guidance criteria.
- **Lifecycle / CLM**:
  - _T3 Repeatable · all_: Develop a plan to migrate agency IT systems to post-quantum cryptography, prioritized according to OMB guidance.
- **Observability**:
  - _T3 Repeatable · all_: Report the quantum-vulnerable IT inventory and required data to OMB, CISA, and the National Cyber Director annually and on an ongoing basis.
  - _T3 Repeatable · all_: Implement an automated process to evaluate progress on migrating IT systems to post-quantum cryptography.

## WH-PQC-Report-2024

- **Source**: White House Report on Post-Quantum Cryptography (July 2024)
- **URL**: https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/07/REF_PQC-Report_FINAL_Send.pdf
- **Requirement count**: 5
- **Governance**:
  - _T2 Risk-Informed · all_: Develop deliberate multi-year migration plans using cryptographic inventories to manage interoperability and operational impacts.
- **Inventory**:
  - _T3 Repeatable · all_: Perform annual manual cryptographic inventory to identify quantum-vulnerable algorithms and catalog key attributes, supplementing automated tools.
  - _T3 Repeatable · all_: Maintain an ongoing, iterative cryptographic inventory that is updated during hardware/software patching and lifecycle refreshes.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Identify systems unable to support PQC algorithms early in the migration planning process.
  - _T3 Repeatable · all_: Prioritize migration of high-impact systems, high-value assets, and data sensitive until 2035 to post-quantum cryptography.

## catalogue-produits-services-profils-de-protection-sites-certifies-qualifies-agrees-anssi

- **Source**: Catalogue Produits Services Profils de Protection Sites Certifies Qualifies Agrees Anssi
- **Requirement count**: 4
- **Assurance / FIPS**:
  - _T3 Repeatable · all_: Use only products, services, and conformity assessment bodies with valid ANSSI certification, qualification, or approval status.
- **Inventory**:
  - _T2 Risk-Informed · all_: Maintain an inventory of cryptographic assets cross-referenced against the ANSSI catalogue to verify valid certification status.
- **Lifecycle / CLM**:
  - _T2 Risk-Informed · all_: Avoid acquiring products or services with a 'moderate' recommendation level for new projects; plan for renewal before expiration.
  - _T3 Repeatable · all_: Retire products and services with a 'critical' recommendation level, indicating end of validity or known vulnerabilities.

## eIDAS-2-Regulation

- **Source**: eIDAS 2.0 Regulation (EU 2024/1183)
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183
- **Requirement count**: 4
- **Governance**:
  - _T2 Risk-Informed · all_: Establish a European Digital Identity Framework with documented rules for trusted digital identities, ensuring user control and security by design.
  - _T2 Risk-Informed · all_: Implement clear and uniform rules for providers of electronic attestations of attributes to ensure harmonized trust services across the Union.
  - _T2 Risk-Informed · all_: Define specific safeguards to prevent providers from combining personal data from identity services with data from other services.
  - _T2 Risk-Informed · all_: Ensure personal data related to European Digital Identity Wallets is kept logically separate from any other data held by the provider.
