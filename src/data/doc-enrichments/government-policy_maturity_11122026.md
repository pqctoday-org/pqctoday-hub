---
generated: 2026-11-12
category: Compliance Frameworks
document_count: 14
requirement_count: 119
---

## ANSSI PQC Follow-up Paper
- **Source**: ANSSI Views on Post-Quantum Cryptography Transition (2023 Follow-up)
- **URL**: https://cyber.gouv.fr/sites/default/files/document/follow_up_position_paper_on_post_quantum_cryptography.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Intermediate/platform products offering PQC without hybridation must provide a test hybridation implementation and user guidance to use PQC only combined with a recognized classical algorithm.
    - _T3 Repeatable · software_: End products with post-quantum mitigation must implement hybridation (except hash-based signatures XMSS/LMS/SPHINCS+) to obtain French security visa in phase 2.
    - _T3 Repeatable · software_: Submit products implementing hybrid PQC to ITSEF evaluation; phase-2 evaluation analyses all algorithms including PQC with mandatory hybridation and may report state-of-the-art PQ protection.
- **Governance**:
    - _T2 Risk-Informed · all_: Include the quantum threat in organizational risk analysis and consider adding quantum mitigation to relevant cryptographic products.
- **Lifecycle / CLM**:
    - _T1 Partial · software_: Experiment with and prototype hybrid post-quantum/pre-quantum solutions, especially for products requiring confidentiality beyond 2030 or likely used after 2030.
    - _T3 Repeatable · keys_: For stateful hash-based signatures (XMSS/LMS), protect the state in integrity and against replay, and use highest-security parameters without altering the hash function.
    - _T3 Repeatable · keys_: When using pre-shared keys for hybridation, protect their confidentiality and integrity and share each key between exactly two parties only.
    - _T3 Repeatable · libraries_: Size symmetric primitives to at least AES-256 security for block ciphers and SHA2-384 security for hash functions as a conservative post-quantum measure.
    - _T3 Repeatable · libraries_: Combine hybrid keys using a KDF-based standardized or well-studied combiner with proven security; avoid plain concatenation or XOR; ensure hybridation implementation security.

## EO-14144
- **Source**: Executive Order 14144 — Strengthening and Promoting Innovation in the Nation's Cybersecurity
- **URL**: https://www.federalregister.gov/documents/2025/01/17/2025-01470/strengthening-and-promoting-innovation-in-the-nations-cybersecurity
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · software_: Software providers to the Federal Government must submit machine-readable secure software development attestations, validating high-level artifacts, and a list of FCEB agency customers to CISA's RSAA, as implemented via FAR amendment.
    - _T4 Adaptive · software_: CISA must centrally verify completeness of all software attestations and continuously validate a sample of complete attestations against high-level artifacts; providers must be notified of deficiencies and may respond.
- **Governance**:
    - _T2 Risk-Informed · all_: FCEB agency heads must give CISA, within 90 days and periodically after, a list of systems, endpoints, and data sets requiring additional controls or non-disruption periods for threat hunting, with an explanation.
    - _T2 Risk-Informed · keys_: FCEB agencies must begin piloting or deploying commercial phishing-resistant authentication standards such as WebAuthn to inform federal identity, credentialing, and access management strategy.
    - _T3 Repeatable · all_: CISA access to agency EDR solutions must be governed by role-based access controls, least privilege, and separation of duties, with specific protections for statutorily restricted sensitive data.
    - _T4 Adaptive · software_: Results of attestation validation, including provider and software version, are publicly posted by the National Cyber Director, and failed attestations may be referred to the Attorney General.
- **Observability**:
    - _T3 Repeatable · all_: FCEB agencies must provide CISA with timely, sufficiently complete EDR and SOC telemetry and enroll EDR endpoints in CISA's Persistent Access Capability within 180 days of technical controls release.

## EO-14306
- **Source**: Executive Order 14306 — Sustaining Select Cybersecurity Efforts (PQC Provisions)
- **URL**: https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Issue and maintain agency-level requirements for the PQC transition: NSA sets them for National Security Systems and OMB for non-NSS, due by December 1, 2025.
    - _T2 Risk-Informed · all_: Align agency policies, investments and priorities to improve network visibility and security controls, with OMB issuing updated guidance (including A-130 revisions) within 3 years.
    - _T4 Adaptive · all_: Pilot machine-readable (rules-as-code) versions of cybersecurity policy and guidance published by OMB, NIST and CISA within one year, enabling policy-as-code adoption.
- **Inventory**:
    - _T2 Risk-Informed · software_: Use CISA's published list of product categories where PQC-capable products are widely available to inform which products to prioritize for PQC adoption and transition planning.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Federal agencies must support TLS 1.3 or a successor version, meeting the NSA (NSS) or OMB (non-NSS) requirements as soon as practicable and no later than January 2, 2030, to prepare for PQC transition.

## ETSI-EN-319-411
- **Source**: ETSI EN 319 411-1 V1.5.1 (2025-04)
- **URL**: https://www.etsi.org/deliver/etsi_en/319400_319499/31941101/01.05.01_60/en_31941101v010501p.pdf
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · certificates_: Provide third parties the capability to check and test all certificate types the TSP issues.
    - _T3 Repeatable · keys_: Generate TSP key pairs, including keys for revocation and registration services, only within a secure cryptographic device certified to EAL4+ (ISO/IEC 15408) or FIPS 140-2/140-3 level 3 / ISO/IEC 19790.
    - _T3 Repeatable · keys_: Operate the secure cryptographic device in its certified configuration per certification guidance documentation, or an equivalent configuration achieving the same security objective.
- **Governance**:
    - _T2 Risk-Informed · all_: Apply ETSI EN 319 401 organizational requirements (clause 7.1) and legal compliance requirements (REQ-7.13-01/-02) to TSP operations.
    - _T2 Risk-Informed · certificates_: Issue terms and conditions (including a PKI disclosure statement) for subscribers, subjects and relying parties, as part of the CPS/CP or a standalone document.
    - _T2 Risk-Informed · certificates_: Obtain a unique object identifier for the Certificate Policy in the form required by ISO/IEC 9594-8 / ITU-T X.509.
    - _T2 Risk-Informed · certificates_: Inform subscribers and relying parties how a specific policy adds to or further constrains the CP requirements.
    - _T2 Risk-Informed · certificates_: Keep certificate generation and revocation management organizationally independent and impartial, with a documented structure safeguarding impartiality; senior and trusted-role staff free from commercial or financial pressures.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Where the CA generates subject keys, delete all copies of the subject private key after delivery to the subject, except for documented permitted conditions.
    - _T3 Repeatable · keys_: Where the CA generates subject keys, secure issuance of the cryptographic device, including secure preparation, storage and distribution.

## EU-NIS-CG-Roadmap-v1.1
- **Source**: EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/117507
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Establish an initial national PQC transition roadmap by 31.12.2026 and initiate planning and pilots for high- and medium-risk use cases.
- **Inventory**:
    - _T2 Risk-Informed · all_: Establish and support mature cryptographic asset management (a structured cryptographic inventory) as a First Step to facilitate PQC transition and cryptographic agility, completed by end of 2026.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Complete PQC transition of high-risk use cases (data needing confidentiality 10+ years) by 31.12.2030; do not use quantum-vulnerable public-key mechanisms stand-alone after end of 2030.
    - _T3 Repeatable · all_: Use standardised and tested hybrid solutions (PQC combined with quantum-vulnerable algorithms) when migrating, whenever feasible and suitable.

## NIST SP 800-82 Rev. 3
- **Source**: Guide to Operational Technology (OT) Security
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-82r3.pdf
- **Requirement count**: 12
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Protect cryptographic hardware from physical tampering and uncontrolled electronic connections.
    - _T2 Risk-Informed · libraries_: When selecting cryptography to protect OT data at rest and in transit, choose a certified cryptographic system rather than unvalidated implementations.
    - _T3 Repeatable · libraries_: Federal organizations must use cryptographic modules that comply with FIPS 140-3 and are validated under the Cryptographic Module Validation Program (CMVP).
- **Governance**:
    - _T2 Risk-Informed · all_: Apply cryptographic functions (encryption, digital signatures, hashing) to protect confidentiality and integrity of OT data at rest and in transit as part of the data security program.
    - _T2 Risk-Informed · all_: When OT data is held in the cloud or on vendor servers, perform a risk analysis of how the provider protects the data and whether additional countermeasures are needed.
    - _T2 Risk-Informed · all_: Develop, maintain, and validate documented disaster recovery and incident response plans for OT environments, including classification of incidents and step-by-step stakeholder actions.
    - _T2 Risk-Informed · all_: Establish a personnel security program with access agreements, screening for critical OT positions, and role-relevant training, coordinating with HR, IT, and physical security.
    - _T3 Repeatable · all_: Run risk management as a continuous process (frame, assess, respond, monitor) across organization, mission/business, and system levels, with monitoring results feeding back into risk framing.
    - _T3 Repeatable · all_: Use role-based and attribute-based access controls to enforce least privilege and separation of duties over OT systems.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify critical physical and electronic file types and data (e.g., PLC code, CAD/CAM files, network diagrams) that must be protected at rest, including where cryptographic protection is needed.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Implement an asset disposal program that wipes, sanitizes, or destroys critical data and media (including removable media, mobile devices, and OT hardware) at end of life.
- **Observability**:
    - _T3 Repeatable · all_: Monitor information flows from the OT security domain to other domains and across interconnections, using data diodes, firewalls, and ACLs to restrict flows.

## NSA CNSA 2.0 FAQ
- **Source**: CNSA 2.0 Frequently Asked Questions
- **URL**: https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/0/CSI_CNSA_2.0_FAQ_.PDF
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Use only CNSA 2.0-approved algorithms and parameters in NSS: AES-256, ML-KEM-1024, ML-DSA-87, SHA-384/512, and LMS/XMSS (NIST SP 800-208) for firmware/software signing.
- **Governance**:
    - _T2 Risk-Informed · all_: Follow CNSSP 15 and its transition timeframes as the policy basis for meeting NSS algorithm requirements.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Do not rely on larger RSA or ECC key sizes to address the quantum threat; plan replacement of RSA and ECC with quantum-resistant algorithms.
    - _T3 Repeatable · all_: Transition all uses of Suite B / CNSA 1.0 public-key algorithms (RSA, ECC) in NSS to CNSA 2.0 quantum-resistant algorithms, for both future designs and currently fielded equipment, per CNSSP 15 timeframes.

## NSM-10
- **Source**: National Security Memorandum 10 — Promoting U.S. Leadership in Quantum Computing
- **URL**: https://bidenwhitehouse.archives.gov/briefing-room/statements-releases/2022/05/04/national-security-memorandum-on-promoting-united-states-leadership-in-quantum-computing-while-mitigating-risks-to-vulnerable-cryptographic-systems/
- **Requirement count**: 14
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Provide annual NSS guidance on PQC migration, implementation, and oversight consistent with NSM-8, sharing best practices with OMB and the National Cyber Director.
    - _T2 Risk-Informed · all_: Conform to NIST and NSA standards for quantum-resistant cryptography; encourage conformance to international standards for interoperability.
- **Governance**:
    - _T2 Risk-Informed · all_: FCEB agencies must develop plans to upgrade non-NSS IT systems to quantum-resistant cryptography, addressing the most significant risks first, with cost estimates and cross-agency coordination.
    - _T2 Risk-Informed · all_: Prioritize timely transition of cryptographic systems to quantum-resistant cryptography, mitigating as much quantum risk as feasible by 2035.
    - _T3 Repeatable · all_: Prioritize cryptographic agility across all sectors to shorten transition time and enable seamless updates for future cryptographic standards.
- **Inventory**:
    - _T2 Risk-Informed · all_: FCEB agency heads must deliver an annual inventory of IT systems vulnerable to CRQCs to CISA and the National Cyber Director, prioritizing High Value Assets and High Impact Systems.
    - _T2 Risk-Informed · all_: Agencies operating NSS must identify and document all instances of quantum-vulnerable cryptography and report them to the National Manager, on an ongoing basis.
    - _T2 Risk-Informed · software_: Agency cryptographic inventories must include current cryptographic methods, administrator protocols, and non-security software and firmware needing upgraded digital signatures.
    - _T3 Repeatable · all_: Establish inventory requirements for all deployed cryptographic systems with prioritized key IT assets, interim benchmarks, and a common, preferably automated, assessment process for migration progress.
    - _T3 Repeatable · all_: Develop programs for discovery and remediation of systems that do not use quantum-resistant cryptography or depend on vulnerable systems.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Continue to implement and, where needed, upgrade existing cryptographic implementations, transitioning to PQC only once NIST standards are complete and implemented in commercial products.
    - _T3 Repeatable · all_: Follow NIST's published timeline for deprecating quantum-vulnerable cryptography, aiming to move the maximum number of systems off it within a decade of initial standards publication.
    - _T3 Repeatable · all_: NSS operators must follow the National Manager's official timeline for deprecation of vulnerable cryptography until migration to quantum-resistant cryptography is complete.
    - _T3 Repeatable · keys_: NSS agencies must implement symmetric-key protections (e.g., HAIPE exclusion keys, VPN symmetric keys) by Dec 31, 2023 to protect quantum-vulnerable key exchanges where appropriate.

## OMB-M-23-02
- **Source**: OMB Memorandum M-23-02 — Migrating to Post-Quantum Cryptography
- **URL**: https://www.whitehouse.gov/wp-content/uploads/2022/11/M-23-02-M-Memo-on-Migrating-to-Post-Quantum-Cryptography.pdf
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a cryptographic inventory and migration lead for the organization within 30 days and identify that lead to OMB for government-wide coordination.
    - _T2 Risk-Informed · all_: Participate in the cryptographic migration working group and exchange PQC testing information and best practices with other agencies and private sector partners.
- **Inventory**:
    - _T2 Risk-Informed · all_: Include only actively used cryptographic systems in the inventory; exclude unused or inactive implementations not currently employed for key exchange, encrypted connections, or signatures.
    - _T3 Repeatable · all_: Document data lifecycle characteristics for each system, including data types and how long data and metadata need protection (time to live), to assess harvest-now-decrypt-later exposure.
    - _T3 Repeatable · all_: For FedRAMP-accredited cloud services, obtain cryptographic implementation inventories via the FedRAMP PMO rather than inventorying them independently.
    - _T3 Repeatable · certificates_: Identify asymmetric/PKI-based access control systems and other asymmetric algorithms (ECDH, ECDSA, RSA, DH, DSA, MQV) as CRQC-vulnerable in the inventory, including unlisted asymmetric algorithms not definitively quantum-resistant.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan the transition of cryptographic systems to quantum-resistant cryptography, aiming to mitigate as much quantum risk as feasible by 2035, prioritizing the most sensitive systems first.
    - _T3 Repeatable · software_: Test pre-standardized PQC in production environments with vendors, alongside currently approved algorithms, with appropriate monitoring and safeguards, and report test results on an ongoing basis.
- **Observability**:
    - _T3 Repeatable · all_: Support automated cryptographic discovery and assessment of PQC adoption progress for internet-accessible and internal systems, using existing capabilities such as CDM where feasible.

## PQCC-Inventory-Workbook-2025
- **Source**: Post-Quantum Cryptography Coalition (PQCC) PQC Inventory Workbook
- **URL**: https://pqcc.org/pqc-inventory-workbook/
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Assign a named point of contact accountable for the cybersecurity risk of each system and record contact details and owning org/sub-org to enable ownership tracking and inventory updates.
    - _T2 Risk-Informed · all_: Assign each asset a High/Medium/Low priority reflecting the significance of the security it provides and document the rationale to prioritize PQC migration resources and support periodic re-evaluation.
    - _T2 Risk-Informed · software_: Record the external vendor organization and vendor POC for each asset to support vendor engagement, patches, and upgrades during PQC migration.
- **Inventory**:
    - _T1 Partial · all_: Identify and track assets whose full range of cryptographic algorithms is unknown, flagging them for further investigation rather than assuming they are safe.
    - _T2 Risk-Informed · all_: Establish a centralized cryptographic asset inventory that tracks PQC migration efforts at the system or asset level, with a unique entry ID per asset.
    - _T2 Risk-Informed · all_: Classify each asset's PQC status as Needs Attention, Unknown/May Need Attention, or Resolved/Doesn't Need Attention based on use of quantum-vulnerable algorithms (RSA, ECC, etc.), and document partial or unclear crypto information in a not…
    - _T3 Repeatable · all_: Timestamp each inventory row with its last review/modification date and update the inventory as new data or systems are identified, tracking the currency of data.
    - _T3 Repeatable · libraries_: Catalog the cryptographic algorithms in use per asset and evaluate each against quantum vulnerability, treating protocols implying asymmetric cryptography (TLS, SSH, IKE, PKI, X.509) as potentially vulnerable.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Document each asset's planned disposition (refresh, replacement, decommission, none) and date, and synchronize PQC migration changes with existing lifecycle decisions.

## PQCC-Migration-Roadmap-2025
- **Source**: Post-Quantum Cryptography Coalition (PQCC) PQC Migration Roadmap
- **URL**: https://pqcc.org/post-quantum-cryptography-migration-roadmap/
- **Requirement count**: 12
- **Governance**:
    - _T2 Risk-Informed · all_: Assess PQC relevancy and determine organizational migration aims and timeline based on data shelf-life, urgency, attack surface, criticality, and interdependencies; classify as urgent or regular adopter.
    - _T2 Risk-Informed · all_: Appoint an individual or team as PQC migration lead with defined role, responsibilities, and expected outcomes, positioned to work across leadership and technical roles.
    - _T2 Risk-Informed · all_: Develop a communications plan that identifies and aligns stakeholders and communicates the need for and process of PQC migration, including ROI, urgency, and cost questions.
    - _T2 Risk-Informed · all_: Engage vendors and internal system operators early to establish a cadence and obtain PQC solution timelines, costs, business impact, CBOM provision, and crypto-agility status.
    - _T2 Risk-Informed · all_: Define a discovery plan and budget for inventorying and asset prioritization based on information already gathered.
    - _T3 Repeatable · all_: Establish measures to track the impact of strategic messaging on stakeholder activities throughout the migration.
- **Inventory**:
    - _T2 Risk-Informed · all_: Review and document existing inventories, risk assessments, and CBOMs, including data/asset location, owner, operator, purpose, and usage, to identify gaps before new discovery efforts.
    - _T2 Risk-Informed · all_: Document technical details of important assets (operator, data protected, architecture, protocols, interfaces) and organize inventory by supplier to enable vendor contact.
    - _T3 Repeatable · all_: Build and maintain a centralized, documented inventory of cryptographic assets and cryptographic use to track enterprise-level migration and identify security gaps.
    - _T3 Repeatable · all_: Prioritize inventoried cryptographic assets for migration based on sensitivity and lifespan.
    - _T3 Repeatable · keys_: Identify inventory blind spots such as offline keys, keys in file structures inaccessible to automated tools, or keys of unknown format.
    - _T3 Repeatable · libraries_: Use automated tools to discover cryptographic algorithms across hardware, software modules, libraries, and embedded code, including key establishment/management and data-integrity algorithms.

## QCCPA-2022
- **Source**: Quantum Computing Cybersecurity Preparedness Act (H.R.7535)
- **URL**: https://www.congress.gov/bill/117th-congress/house-bill/7535
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Follow OMB guidance on migrating information technology to post-quantum cryptography; national security systems are excluded from the Act's scope.
    - _T2 Risk-Informed · all_: Provide funding and coordination information to support the OMB strategy addressing quantum-weakened encryption risk, including funding needed to secure agency IT against quantum adversaries.
- **Inventory**:
    - _T2 Risk-Informed · all_: Each executive agency must maintain an inventory of all information technology in use that is vulnerable to decryption by quantum computers.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Once NIST issues post-quantum cryptography standards, each executive agency must develop a plan to migrate its IT to post-quantum cryptography per OMB guidance.

## WH-PQC-Report-2024
- **Source**: White House Report on Post-Quantum Cryptography (July 2024)
- **URL**: https://bidenwhitehouse.archives.gov/wp-content/uploads/2024/07/REF_PQC-Report_FINAL_Send.pdf
- **Requirement count**: 13
- **Governance**:
    - _T2 Risk-Informed · all_: Develop funding estimates for migrating cryptography to PQC and sustain investment in inventory and migration activities.
    - _T3 Repeatable · all_: Participate in the interagency PQC migration working group and coordinate migration efforts with OMB, CISA, NIST and ONCD.
- **Inventory**:
    - _T2 Risk-Informed · all_: Perform an annual manual cryptographic inventory, researching each hardware/software item to identify cryptography used and cataloging key attributes of quantum-vulnerable cryptography.
    - _T2 Risk-Informed · software_: Identify systems that cannot support PQC algorithms (insufficient processing, memory, bandwidth, or non-changeable cryptography) as early as feasible through the inventory process.
    - _T3 Repeatable · all_: Maintain a comprehensive, ongoing cryptographic inventory of quantum-vulnerable public-key cryptography as the baseline for PQC migration planning and tracking.
    - _T3 Repeatable · all_: Adopt and evolve automated cryptographic inventory capability, supplemented by manual inventory because automated tools may lack visibility across the entire network or compatibility with all systems.
    - _T4 Adaptive · all_: Keep the inventory continuously current by updating it as hardware and software are patched, updated, or refreshed, and iteratively improve inventory methods, breadth and fidelity.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop a prioritized PQC migration plan following OMB guidance, due within one year of NIST's first PQC standards being adopted.
    - _T2 Risk-Informed · all_: Start PQC migration before a CRQC is operational to counter record-now-decrypt-later attacks, using strong classical cryptography now and prioritizing migration to PQC once available.
    - _T3 Repeatable · all_: Continuously re-assess migration prioritization and timelines once PQC migration begins.
    - _T3 Repeatable · all_: Plan migration to account for interoperability, since mismatched PQC and non-PQC endpoints can fail secure and cause operational impact.
    - _T3 Repeatable · software_: Replace or update non-PQC-compatible hardware and software, and incorporate system modernization timelines into PQC migration planning.
    - _T3 Repeatable · software_: Test pre-standardized and standardized PQC on agency networks, including in production with monitoring and safeguards alongside current validated algorithms, to find unsupported systems and dependencies.

## eIDAS-2-Regulation
- **Source**: eIDAS 2.0 Regulation (EU 2024/1183)
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1183
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Conformity of electronic identification schemes to be notified with the cybersecurity requirements (incl. assurance-level requirements) must be certified by designated conformity assessment bodies under a relevant Regulation (EU) 2019/881…
    - _T3 Repeatable · all_: Qualified trust service providers outsourcing operations to a third country must ensure adequate guarantees so that supervisory activities and audits can be enforced as if carried out in the Union; otherwise qualified status may be withdra…
    - _T3 Repeatable · certificates_: Qualified electronic attestations of attributes must meet Annex V requirements, and compliance must be evaluated against the Commission's reference standards, specifications and procedures.
- **Governance**:
    - _T2 Risk-Informed · all_: Qualified trust service providers must use cryptographic methods reflecting current best practices and trustworthy implementations of those algorithms to ensure security and reliability of trust services.
    - _T2 Risk-Informed · all_: Public sector bodies requiring electronic identification and authentication for online services must accept conformant European Digital Identity Wallets; large private relying parties required to use strong user authentication must also ac…
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Revocation of qualified electronic attestations of attributes must be irreversible: once revoked, the attestation permanently loses validity and its status can never be reverted.
- **Observability**:
    - _T3 Repeatable · certificates_: Security breaches or compromises of electronic identification schemes must be handled under defined procedures, including supervisory body action such as suspension or withdrawal of qualified status of affected certificates.
