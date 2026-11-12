---
generated: 2026-11-12
category: Compliance Frameworks
document_count: 20
requirement_count: 175
---

## AU-ASD-ISM-Crypto-2024
- **Source**: ASD Information Security Manual — Guidelines for Cryptography (December 2024)
- **URL**: https://www.cyber.gov.au/sites/default/files/2024-12/22.%20ISM%20-%20Guidelines%20for%20Cryptography%20(December%202024).pdf
- **Requirement count**: 18
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Use ASD-approved HACE for encrypting SECRET and TOP SECRET media and for protecting such data in transit; HACE must hold ASD Approval for Use and be operated per ACSI.
    - _T3 Repeatable · software_: Use cryptographic equipment/software that has completed a Common Criteria evaluation against a Protection Profile to encrypt OFFICIAL: Sensitive or PROTECTED media.
    - _T3 Repeatable · software_: Use Common Criteria-evaluated cryptographic equipment/software to protect OFFICIAL: Sensitive or PROTECTED data in transit over insufficiently secure or public networks.
- **Governance**:
    - _T2 Risk-Informed · all_: Permit only ASD-Approved Cryptographic Algorithms or high assurance algorithms in cryptographic equipment and software; disable unapproved algorithms (preferred) or prohibit them via usage policy.
    - _T2 Risk-Informed · all_: Use ASD-Approved Cryptographic Protocols or high assurance protocols to protect data communicated over network infrastructure.
    - _T2 Risk-Informed · all_: Use an ASD-Approved Cryptographic Algorithm or high assurance algorithm when encrypting media.
    - _T2 Risk-Informed · all_: Apply full disk encryption (or partial encryption with write-restricted access controls) for data at rest.
    - _T2 Risk-Informed · keys_: Develop, implement and maintain cryptographic key management processes and supporting procedures covering the key lifecycle from generation through destruction.
    - _T2 Risk-Informed · keys_: Report compromise or suspected compromise of cryptographic equipment or keying material to the CISO or delegate as soon as possible.
    - _T2 Risk-Informed · keys_: Apply minimum key sizes/curves by classification: DH modulus >=2048 bits (>=3072 for SECRET/TOP SECRET); ECDH/ECDSA >=224-bit for lower classifications, NIST P-256/384/521 for SECRET, P-384/521 for TOP SECRET.
    - _T2 Risk-Informed · keys_: Prefer ECDH over DH and use only suitable curves from NIST SP 800-186; select DH moduli per NIST SP 800-56A Rev. 3.
    - _T3 Repeatable · all_: Comply with ASD communications security doctrine (ACSIs) for management and operation of HACE; doctrine takes precedence over the guidelines in conflicts.
    - _T3 Repeatable · all_: Plan for post-quantum transition: DH, ECDH and ECDSA will not be approved beyond 2030; ML-DSA and ML-KEM are approved, preferring adherence to prerequisite FIPS publications.
    - _T3 Repeatable · software_: Enforce approved-algorithm policy technically by disabling all unapproved cryptographic algorithms in equipment and software rather than relying on user advice alone.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Key management procedures must address generation, registration, distribution, installation, usage, protection, storage, access, recovery and destruction of cryptographic keys.
    - _T2 Risk-Informed · keys_: Where practical, provide data recovery capability in cryptographic equipment/software for cases where the encryption key is lost, damaged or fails.
    - _T2 Risk-Informed · keys_: Transport keyed cryptographic equipment in accordance with the sensitivity or classification of its keying material.
    - _T2 Risk-Informed · keys_: Change keying material when it is compromised or suspected of being compromised.

## Canada CSE PQC Guidance
- **Source**: Roadmap for the migration to post-quantum cryptography for the Government of Canada (ITSM.40.001)
- **URL**: https://www.cyber.gc.ca/sites/default/files/itsm.40.001-migration-post-quantum-cryptography-government-canada-e.pdf
- **Requirement count**: 12
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Require established cyber security standards in systems to gain independent security review assurance and avoid vendor lock-in.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a tailored departmental PQC migration plan covering all systems the department is responsible for, and execute, track and report on it.
    - _T2 Risk-Informed · all_: Establish a cross-functional migration committee with a dedicated migration lead and at least one senior management member to secure executive support.
    - _T2 Risk-Informed · all_: Define accountability: the Designated Official for Cyber Security owns quantum risk; assign a PQC Migration Executive Lead and a Technical Lead for cross-organization coordination.
    - _T2 Risk-Informed · all_: Include a cost estimate with resource allocation in the migration plan and refine it as identification and transition proceed.
    - _T2 Risk-Informed · all_: Define an education strategy and brief senior executives on PQC migration impacts and progress, including emerging challenges.
    - _T2 Risk-Informed · all_: Embed PQC support requirements, including vendor contract clauses, in new procurements to avoid rework and lower migration cost.
    - _T2 Risk-Informed · all_: Prioritize migration of systems protecting confidentiality of data in transit over public networks (harvest-now-decrypt-later exposure), considering information lifespan, crypto agility and compromise impact.
- **Inventory**:
    - _T1 Partial · all_: Start with an initial, incomplete inventory and iteratively improve it, leveraging existing ITSM lifecycle and change-management data.
    - _T2 Risk-Informed · all_: Include in the migration plan the approaches for cryptographic discovery used to build an inventory of systems needing transition.
    - _T3 Repeatable · all_: Cover all cryptography use across network services, OS, applications, code pipelines and physical IT assets, on-premises, contracted or cloud, using multiple discovery methods and tools.
- **Observability**:
    - _T3 Repeatable · all_: Use software tools and services (SIEM, network inspection, EDR, scanners of hosts, logs and source code) to discover cryptography use.

## DORA-REG-2022-2554
- **Source**: Digital Operational Resilience Act (DORA) — Regulation EU 2022/2554
- **URL**: https://eur-lex.europa.eu/eli/reg/2022/2554/oj/eng
- **Requirement count**: 14
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Regularly test all anomaly detection mechanisms in accordance with the digital operational resilience testing requirements.
    - _T3 Repeatable · all_: Assess envisaged ICT third-party contractual arrangements, including in-depth analysis of subcontracting, to identify concentration risk before concluding them.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop and document an information security policy defining rules to protect availability, authenticity, integrity and confidentiality of data, information assets and ICT assets.
    - _T2 Risk-Informed · all_: Implement policies, procedures and controls limiting physical/logical access to information and ICT assets to approved functions, including sound administration of access rights.
    - _T2 Risk-Informed · all_: Obtain management-body approval of the ICT change management process through appropriate lines of management, with specific protocols in place.
    - _T2 Risk-Informed · all_: Put in place a comprehensive ICT business continuity policy with dedicated, documented arrangements, plans, procedures and mechanisms as part of the ICT risk management framework.
    - _T2 Risk-Informed · all_: Smaller exempted entities must still maintain a sound, documented ICT risk management framework detailing mechanisms and measures for ICT risk.
    - _T2 Risk-Informed · all_: Ensure ICT third-party contracts include harmonised key provisions and dedicated exit strategies with mandatory transition periods, enabling switch to other providers or in-house solutions.
    - _T3 Repeatable · keys_: Implement policies and protocols for strong authentication and protection of cryptographic keys, with encryption driven by approved data classification and ICT risk assessment.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Maintain appropriate and comprehensive documented policies for patches and updates.
    - _T3 Repeatable · software_: Operate documented, risk-based ICT change management so all changes to software, hardware, firmware and security parameters are recorded, tested, assessed, approved, implemented and verified, with management approval.
- **Observability**:
    - _T3 Repeatable · all_: Maintain mechanisms to promptly detect anomalous activities and ICT incidents, with multiple control layers, defined alert thresholds and automatic alerts to incident-response staff.
    - _T3 Repeatable · all_: Devote sufficient resources and capabilities to monitor user activity, ICT anomalies and ICT-related incidents, particularly cyber-attacks.
    - _T3 Repeatable · all_: Continuously monitor security and functioning of all ICT systems and promptly identify and detect sources of ICT risk and anomalies.

## G7-Financial-PQC-Roadmap-2026
- **Source**: G7 Cyber Expert Group Financial Sector PQC Roadmap
- **URL**: https://home.treasury.gov/system/files/136/G7-CEG-Quantum-Roadmap.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T4 Adaptive · all_: Perform continuous validation and ongoing improvement of the migrated cryptographic posture.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish comparable migration timelines with milestones, targeting overall transition by about 2035 and adapting them to threat landscape, criticality and complexity.
    - _T3 Repeatable · all_: Embed quantum-resistant cryptography into existing organizational governance and risk management frameworks, with sustained executive engagement.
    - _T3 Repeatable · all_: Prioritize migration planning by exposure and systemic importance, applying accelerated timelines to critical systems (e.g., 2030-32) and extended timelines to lower-risk areas.
    - _T3 Repeatable · all_: Establish quantifiable metrics to track migration progress, demonstrate accountability, and enable recalibration, drawing on existing standards such as ISO 27001 and ITIL.
    - _T3 Repeatable · all_: Manage third-party and vendor cryptographic dependencies by collaborating with vendors and obtaining detailed vendor roadmaps for cloud and cryptographic services.
    - _T4 Adaptive · all_: Include cryptographic agility as a goal in transition plans so new cryptographic solutions can be adopted against emerging threats.
- **Observability**:
    - _T3 Repeatable · all_: Monitor maturity of quantum technologies, standards, tools and threats, and continuously monitor and validate migration progress.

## GDPR-REG-2016-679
- **Source**: General Data Protection Regulation (GDPR) — Regulation EU 2016/679
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32016R0679
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Be able to demonstrate compliance with the Regulation, including via the measures, safeguards and mechanisms identified in the impact assessment (evidence of compliance).
    - _T2 Risk-Informed · all_: When assessing personal data breaches, consider whether personal data were protected by appropriate technical protection measures that effectively limit the likelihood of misuse; this supports breach-notification decisions.
- **Governance**:
    - _T2 Risk-Informed · all_: Perform a data protection impact assessment before high-risk processing, documenting measures, safeguards and mechanisms that mitigate risk and demonstrate compliance with the Regulation.
- **Inventory**:
    - _T3 Repeatable · all_: Take reasonable steps, including technical measures, to inform other controllers processing the data of an erasure request so copies and replications are erased; requires knowing where personal data resides.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Ensure restriction of processing in automated filing systems is enforced by technical means and clearly indicated in the system, so restricted data cannot be further processed or changed.

## GSMA-PQ02
- **Source**: GSMA PQ.02: Guidelines for Quantum Risk Management for Telco
- **URL**: https://www.gsma.com/solutions-and-impact/technologies/security/post-quantum-cryptography-documents/
- **Requirement count**: 11
- **Governance**:
    - _T2 Risk-Informed · all_: Identify an executive owner for quantum risk and update organisational roles and responsibilities to include quantum risk.
    - _T2 Risk-Informed · all_: Create a transition plan based on the QCRA and informed by the organisation's risk appetite.
    - _T2 Risk-Informed · all_: Develop organisational capability and update education and training programs to increase understanding of quantum risk.
    - _T2 Risk-Informed · all_: Perform a QCRA to prioritise critical systems and data for mitigation, considering store-now-decrypt-later and future quantum-capable threat actors.
    - _T3 Repeatable · all_: Establish an organisation-wide governance process to manage quantum risk.
    - _T3 Repeatable · all_: Integrate quantum risk into Enterprise Risk Management and adapt an existing risk framework to manage it.
    - _T3 Repeatable · all_: Identify and manage residual risk arising from quantum threats.
    - _T3 Repeatable · all_: Perform a QCRA that is repeatable as threats and PQC standards evolve, with prioritisation based on data sensitivity, confidentiality length, cost and feasibility, plus monitoring of threats and implementation.
    - _T4 Adaptive · all_: Build board-level awareness of quantum risk.
- **Inventory**:
    - _T2 Risk-Informed · all_: Determine the cryptographic estate by inventorying assets (files, storage, communication channels) and their current cryptographic protection, recording required storage lifetime.
    - _T2 Risk-Informed · all_: Determine data assets, data protection requirements and data longevity, and prioritise assessment of critical applications and services.

## GSMA-PQC-Country-Survey-2025
- **Source**: GSMA Post-Quantum Government Initiatives by Country and Region (March 2025)
- **URL**: https://www.gsma.com/newsroom/wp-content/uploads//Post-Quantum-Government-Initiatives-by-Country-and-Region-02-Mar-2025-Clean.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Include PQC requirements in contracts with suppliers and vendors.
- **Inventory**:
    - _T1 Partial · all_: Begin planning for PQC transition by starting a cryptographic inventory of the organization's crypto estate.
    - _T2 Risk-Informed · all_: Create and maintain a cryptographic inventory as an early step in PQC transition planning.
    - _T2 Risk-Informed · all_: Financial services firms must develop a cryptographic inventory and an initial quantum-risk plan.
    - _T3 Repeatable · all_: Migrate to automated tooling for post-quantum cryptography discovery and inventory.

## HKMA-FINTECH-BLUEPRINT-2026
- **Source**: HKMA Fintech Promotion Blueprint (Fintech 2030) — Feb 2026
- **URL**: https://www.hkma.gov.hk/media/eng/doc/key-information/press-release/2026/20260203e3a1.pdf
- **Requirement count**: 2
- **Governance**:
    - _T2 Risk-Informed · all_: Integrate post-quantum cryptography (PQC) within cybersecurity frameworks to mitigate emerging quantum-related risks and ensure data protection and operational resilience.
    - _T2 Risk-Informed · all_: Establish robust governance for third-party and technology service provider risks, including a standardised cybersecurity baseline that providers must demonstrate compliance with during bank due diligence.

## IN-CERTIN-QBOM-Guidelines-2025
- **Source**: India CERT-In Technical Guidelines on SBOM, QBOM, CBOM, AIBOM, and HBOM v2.0
- **URL**: https://www.cert-in.org.in/PDF/TechnicalGuidelines-on-SBOM,QBOM&CBOM,AIBOM_and_HBOM_ver2.0.pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · software_: Government, public sector and essential-services organizations should include SBOM requirements in all software and solution purchase/procurement.
    - _T2 Risk-Informed · software_: Analyze critical components at every stage of the software lifecycle (design through update) and mandate SBOM usage for them.
    - _T3 Repeatable · software_: Make creation and provision of SBOMs a mandatory standard practice in software procurement and development.
- **Inventory**:
    - _T3 Repeatable · software_: Maintain accurate, up-to-date SBOMs across IT and OT environments to understand attack surface and respond to vulnerabilities.
    - _T3 Repeatable · software_: Keep SBOM accurate by updating it whenever new information about included components emerges, even if components themselves are unchanged.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Produce an SBOM for every new software component release and update it promptly for updates, upgrades, releases and patches; use standardized versioning consistently.
- **Observability**:
    - _T3 Repeatable · software_: Security teams should include SBOM inventory in the vulnerability management workflow, integrating with security tools to automate vulnerability detection and remediation.

## India-DST-NQM-Roadmap
- **Source**: India DST Task Force Report — Phased Roadmap for Migration to Post-Quantum Cryptography under NQM
- **URL**: https://dst.gov.in/sites/default/files/Report_TaskForce_PQMigration_4Feb26%20(v1).pdf
- **Requirement count**: 15
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Testing laboratories must hold ISO/IEC 17025 accreditation, demonstrated PQC testing expertise, qualified personnel and secure facilities compliant with national cybersecurity and privacy law.
    - _T3 Repeatable · keys_: Retain audit logs online at least 400 days and archive securely for at least seven years, aligned with NIST, ISO and CERT-In directions.
    - _T3 Repeatable · libraries_: Cryptographic modules/HSMs must be validated to FIPS 140 (or equivalent ISO/IEC 19790) and PQC implementations pass algorithm validation (CAVP/ACVP) as a prerequisite to module certification.
    - _T3 Repeatable · libraries_: PQC implementations must pass known-answer tests against versioned NIST test vectors, with re-testing required when new vectors are published, plus RNG statistical tests and static vulnerability analysis reports.
    - _T3 Repeatable · software_: Vendors must apply to a Certification Body (TEC, STQC, BIS or sector regulator) for a stated assurance level (L1–L4) with technical file, test records and reports.
- **Governance**:
    - _T2 Risk-Informed · all_: Government and CII deployments act as anchor adopters of validated indigenous quantum-safe technologies to ensure supply-chain resilience.
    - _T3 Repeatable · all_: Complete enterprise-wide PQC/hybrid adoption and operate PQC-only trust chains by the milestone deadlines (CII by 2029, enterprises by 2033).
    - _T3 Repeatable · all_: Maintain long-term vendor oversight, audits and continuous algorithm updates, and apply layered risk management to remaining legacy systems.
    - _T3 Repeatable · keys_: Control access to keys via role-based access control with least privilege, segregation of duties and multi-factor authentication.
- **Inventory**:
    - _T2 Risk-Informed · software_: Certification pre-assessment checks the product BOM including SBOM and CBOM and deployment environment documentation.
    - _T3 Repeatable · all_: Products submitted for certification must include a BOM covering software, cryptographic and hardware components (SBOM, CBOM, QBOM) in CERT-In formats, to support auditability.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Cloud HSM deployments must support full key lifecycle management (generation, storage, usage, rotation, archival, destruction) with keys generated and kept within validated HSM boundaries and no plaintext export.
    - _T3 Repeatable · keys_: Enforce mandatory key rotation policies per NIST SP 800-57 with shorter rotation periods for high-risk (Level 3 and 4) systems, and support automated rotation without service disruption.
    - _T3 Repeatable · keys_: Cryptographic key destruction must be irreversible and verifiable through audit evidence.
- **Observability**:
    - _T3 Repeatable · keys_: Generate immutable, tamper-evident audit logs for all key lifecycle events (creation, access, rotation, policy changes, destruction), exportable to external systems.

## Japan CRYPTREC Report 2024
- **Source**: Post-Quantum Cryptography Evaluation Report
- **URL**: https://www.cryptrec.go.jp/report/cryptrec-gl-2007-2024.pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Set the system migration preparation period by comparing information protection period (X) plus migration time (Y) against time to CRQC (Z), per Mosca's inequality.
    - _T2 Risk-Informed · all_: Account for harvest-now-decrypt-later risk in policy: current use of vulnerable cryptography is a risk for long-lived data regardless of the CRQC timeline.
    - _T3 Repeatable · all_: Align the organizational PQC transition target to national timelines (e.g., migrate cryptographic systems to PQC by around 2035 per NSM-10 and CNSA 2.0).

## NIS2-DIRECTIVE-2022-2555
- **Source**: Network and Information Security Directive 2 (NIS2)
- **URL**: https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=CELEX:32022L2555
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Implement cybersecurity risk-management measures and reporting obligations as entities of a type listed in Annex I or II (or identified as critical entities), forming the basis of documented security governance.
    - _T2 Risk-Informed · all_: Align cybersecurity risk-management practices, including supply chain security assessments and vulnerability disclosure, with international standards and industry best practices (e.g., ISO/IEC 30111, 29147).
    - _T2 Risk-Informed · all_: Apply state-of-the-art encryption as a data security measure when using innovative technologies (including AI) for cybersecurity, in compliance with Union data protection law.
    - _T2 Risk-Informed · software_: Establish procedures to handle vulnerabilities when discovered in network and information systems, and (for ICT product/service providers) procedures to receive vulnerability information from third parties.
    - _T3 Repeatable · software_: Operate a structured coordinated vulnerability disclosure process so vulnerabilities are reported to the manufacturer/provider and remediated before detailed information is publicly disclosed.

## NIST SP 800-53
- **Source**: NIST SP 800-53 Rev. 5 - Security and Privacy Controls (Release 5.2.0)
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-53r5.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Align non-repudiation and cryptographic mechanisms with the referenced FIPS standards, including FIPS 140-3 for cryptographic module validation.
    - _T3 Repeatable · all_: Establish a comprehensive risk management program that categorizes systems, selects and implements controls, assesses their effectiveness, authorizes systems for operation, and continuously monitors them.
    - _T3 Repeatable · all_: Perform security and privacy compliance checks, including baseline configuration verification, on system components before establishing internal connections.
    - _T3 Repeatable · software_: Validate the binding of information reviewer identity to information at transfer or release points between security domains, using mechanisms such as cryptographic checksums, and perform defined actions on validation errors.
- **Governance**:
    - _T2 Risk-Informed · all_: Exercise due diligence in managing information security and privacy risk through documented, risk-based management processes tied to applicable laws, regulations and governmentwide policies.
    - _T2 Risk-Informed · all_: Define and mandate common secure configurations (e.g., USGCB, STIGs) at the organization, mission, or system level so that configuration settings are consistently specified.
    - _T2 Risk-Informed · all_: Configure systems to provide only mission-essential capabilities and prohibit or restrict defined functions, ports, protocols, software and services.
    - _T3 Repeatable · all_: Implement replay-resistant authentication mechanisms (e.g., nonces or cryptographic authenticators) for privileged and/or non-privileged account access.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Accept and electronically verify PIV-compliant credentials, with issuer adequacy and reliability authorized per SP 800-79-2.
- **Observability**:
    - _T3 Repeatable · all_: Manage, apply and verify configuration settings for defined system components using automated mechanisms, and respond to unauthorized configuration changes with defined actions such as alerting or restoring settings.
    - _T3 Repeatable · all_: Take defined actions in response to unauthorized changes to configuration settings, including alerting designated personnel or restoring established settings.

## NY-DFS-23-NYCRR-500-A2
- **Source**: NY DFS 23 NYCRR Part 500 — Cybersecurity Requirements (Amendment 2)
- **URL**: https://www.dfs.ny.gov/system/files/documents/2023/12/rf23_nycrr_part_500_amend02_20231101.pdf
- **Requirement count**: 14
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Class A companies must design and conduct independent audits of their cybersecurity program based on risk assessment.
    - _T3 Repeatable · all_: Conduct penetration testing at least annually by a qualified party, and run automated vulnerability scans at risk-based frequency and after material changes.
    - _T3 Repeatable · all_: Retain transaction reconstruction records at least five years and cybersecurity audit trail records at least three years.
- **Governance**:
    - _T2 Risk-Informed · all_: Maintain written cybersecurity policies, approved at least annually by a senior officer or senior governing body, with procedures developed, documented and implemented in line with the policy and based on the risk assessment.
    - _T2 Risk-Informed · all_: Designate a CISO responsible for overseeing and implementing the cybersecurity program; if the CISO is third-party or affiliate-employed, retain compliance responsibility and designate a senior internal overseer.
    - _T2 Risk-Informed · all_: Base the cybersecurity program on a documented risk assessment and cover core functions: identify, protect, detect, respond, recover and regulatory reporting.
    - _T2 Risk-Informed · all_: Make all cybersecurity program documentation, including adopted affiliate program provisions, available to the regulator on request.
    - _T3 Repeatable · keys_: Limit privileged accounts and user access to least privilege, review all access privileges at least annually, and promptly terminate access on departure.
    - _T4 Adaptive · all_: Have the CISO report in writing at least annually to the senior governing body on program effectiveness, material risks, events and remediation plans, and ensure board-level oversight with adequate resourcing.
    - _T4 Adaptive · all_: Senior governing body must oversee cybersecurity risk management: maintain sufficient understanding, regularly review management reports, and confirm management has allocated sufficient resources.
- **Inventory**:
    - _T2 Risk-Informed · all_: Include asset inventory, device management and end-of-life management in the written cybersecurity policy and procedures.
- **Observability**:
    - _T3 Repeatable · all_: Maintain a monitoring process to be promptly informed of new vulnerabilities and remediate in a timely, risk-prioritized manner.
    - _T3 Repeatable · all_: Securely maintain audit trails designed to detect and respond to material cybersecurity events.
    - _T4 Adaptive · all_: Class A companies must monitor privileged access activity and implement a privileged access management solution.

## PCI-DSS-QRG
- **Source**: PCI DSS Quick Reference Guide: Understanding the Payment Card Industry Data Security Standard version 3.0
- **URL**: https://www.pcisecuritystandards.org/documents/PCIDSS_QRGv3.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Use Council-approved assessors (QSAs) and scanning vendors (ASVs) to assess and validate compliance, with Reports on Compliance or SAQs as applicable.
    - _T3 Repeatable · all_: Use only PCI SSC-tested and approved PIN transaction devices and prefer validated payment applications and P2PE solutions.
- **Governance**:
    - _T2 Risk-Informed · all_: Maintain documented security policies and operational procedures (e.g., firewall/router) that are in use and known to all affected parties.
    - _T2 Risk-Informed · keys_: Protect stored cardholder data and encrypt its transmission across open, public networks.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Review configuration rule sets on a defined periodic schedule (at least every six months) and change vendor-supplied defaults before deployment.
    - _T3 Repeatable · all_: Securely remove unnecessary cardholder data storage and never store sensitive authentication data after authorization.

## Saudi-NCA-ECC2-2024
- **Source**: Saudi Arabia National Cybersecurity Authority — Essential Cybersecurity Controls ECC-2:2024
- **URL**: https://cdn.nca.gov.sa/api/files/public/upload/86e09090-44e4-481f-bc28-355673607654_ECC--2024-EN.pdf
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Take all necessary measures to ensure ongoing, continuous compliance with the controls; NCA verifies via self-assessment, compliance-tool reports and/or field audits.
- **Governance**:
    - _T2 Risk-Informed · all_: Identify, document and approve a cybersecurity strategy with Authorized Official (head of entity or delegate) support, aligned with legislative and regulatory requirements.
    - _T2 Risk-Informed · all_: Define, document and approve the governance organizational structure and cybersecurity roles and responsibilities for all parties implementing controls.

## Singapore-CSA-Quantum-Safe-Handbook
- **Source**: Quantum-Safe Handbook and Quantum Readiness Index
- **URL**: https://isomer-user-content.by.gov.sg/36/11227d39-4350-4ded-9046-d62f99f561ab/Draft%20for%20Public%20Consultation%20-%20Quantum-Safe%20Handbook%20(Oct%202025).pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Conduct a risk assessment as the starting point for quantum-safe migration to identify exposure, priorities and risk management strategies, using the organisation's enterprise risk management framework or established best practices.
    - _T2 Risk-Informed · all_: Use risk assessment outcomes to prioritise preparation and allocate resources, scoping migration effort rather than tackling organisation-wide migration at once.
    - _T2 Risk-Informed · all_: Develop a multi-year quantum-safe migration roadmap that tracks what must be prepared now versus what can wait as standards mature, and plan for phased migration of systems.
    - _T3 Repeatable · all_: Continuously monitor quantum-safe and standards developments, consider the operating context in migration plans, and incorporate cryptographic agility where practical.

## TSA-SD-PIPELINE-2021-02G
- **Source**: TSA Security Directive Pipeline-2021-02G
- **URL**: https://www.tsa.gov/sites/default/files/signed_security_directive_pipeline-2021-02g_and_transmittal_memo_508c.pdf
- **Requirement count**: 14
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Develop a Cybersecurity Assessment Plan, submit an annual update for TSA approval, and submit an annual report of prior-year assessment results to proactively assess control effectiveness and resolve vulnerabilities.
    - _T3 Repeatable · all_: Provide TSA with documentation and access as required to establish compliance, enabling TSA inspection against the approved Implementation Plan.
- **Governance**:
    - _T2 Risk-Informed · all_: Retain sole accountability for compliance when security measures are delegated to a Managed Security Service Provider or Authorized Representative; ownership of compliance cannot be outsourced.
    - _T2 Risk-Informed · all_: Define Authorized Representatives who are formally empowered to coordinate or conduct required activities, with both Owner/Operator and Representative liable for non-compliance.
    - _T2 Risk-Informed · all_: Notify TSA in writing within 60 days if no Critical Cyber Systems exist, and reevaluate and notify within 60 days of any change in operations.
    - _T3 Repeatable · all_: Establish, obtain TSA approval for, and implement and maintain a Cybersecurity Implementation Plan describing the specific cybersecurity measures and schedule for achieving required outcomes.
    - _T3 Repeatable · all_: Develop and maintain an up-to-date Cybersecurity Incident Response Plan to reduce operational disruption risk from cybersecurity incidents affecting IT/OT systems.
    - _T3 Repeatable · all_: Enforce access policies based on least privilege and separation of duties, restrict shared accounts, and document compensating controls where not technically feasible.
    - _T3 Repeatable · all_: Encrypt OT system content in transit whenever OT services traverse the IT system, as part of network segmentation controls.
    - _T3 Repeatable · certificates_: Maintain a schedule for reviewing existing domain trust relationships and policies to manage domain trusts.
    - _T3 Repeatable · keys_: Define authenticator (memorized secret) reset schedules, with documented mitigations and timeframes for components that cannot meet the schedule.
- **Inventory**:
    - _T3 Repeatable · all_: Identify the Owner/Operator's Critical Cyber Systems and document methodology/rationale for identification, subject to TSA review and possible addition of systems.
    - _T3 Repeatable · all_: Maintain a list and description of IT/OT interdependencies, all external connections to the OT system, and zone boundaries for Critical Cyber Systems.
- **Observability**:
    - _T3 Repeatable · all_: Implement continuous monitoring and detection policies and procedures to prevent, detect, and respond to cybersecurity threats and anomalies affecting Critical Cyber Systems.

## UK NCSC PQC Guidance
- **Source**: Preparing for Quantum-Safe Cryptography
- **URL**: https://www.ncsc.gov.uk/paper/preparing-for-quantum-safe-cryptography
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T2 Risk-Informed · software_: Ensure adopted cryptographic products are based on standardised algorithms so that security level is verifiable and interoperable with future standards-compliant products.
- **Governance**:
    - _T2 Risk-Informed · all_: Factor quantum-safe cryptography transition into long-term organisational roadmaps and long-term investment decisions, including planning for the threat of quantum computer attacks.
    - _T2 Risk-Informed · all_: Organisations managing their own cryptographic infrastructure must incorporate quantum-safe transition into long-term plans, noting ETSI and NIST transition-planning work when making investment decisions.
    - _T2 Risk-Informed · all_: Plan and manage cryptographic transition carefully, recognising security risks as systems and keys change and business-continuity risks from unforeseen dependencies on cryptographic components.
    - _T2 Risk-Informed · all_: Do not adopt non-standardised quantum-safe cryptography early; policy should require standards-compliant products to avoid unverifiable security levels, interoperability failure and double transition costs.
    - _T2 Risk-Informed · all_: Select quantum-safe algorithms and products according to the standardisation outcome (NIST), and prefer standards-compliant QSC products as the recommended mitigation once available.
    - _T2 Risk-Informed · all_: Assess data-confidentiality lifetime and engage the regulator for mitigation advice where long-term cryptographic protection of data is needed, given harvest-now-decrypt-later risk.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct investigatory work to identify which systems are high priority for quantum-safe transition, e.g. those processing sensitive personal data or with long-dated certificate expiry.
    - _T2 Risk-Informed · certificates_: Identify high-value, root-level public keys and long-lived certificates intended for long operational life, as these are exposed to future signature-forgery risk and are hardest to replace.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Account for key-management and usability challenges when considering pre-placed symmetric keys as an interim mitigation; not suitable as a general-purpose solution.
    - _T3 Repeatable · all_: Plan to run conventional and quantum-safe cryptography in parallel during an interim period, maintaining continued support for conventional public-key cryptography to ease transition.

## UK-CMORG-PQC-Guidance-2025
- **Source**: CMORG Guidance for Post-Quantum Cryptography (UK Financial Sector)
- **URL**: https://www.cmorg.org.uk/sites/default/files/2025-06/CMORG%20-%20Guidance%20for%20Post-Quantum%20Cryptography%20-%20April%202025%20-%20TLP%20CLEAR%20(1).pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a structured, phased PQC transition roadmap and treat quantum-safe migration as a planned, managed priority within long-term plans.
    - _T2 Risk-Informed · all_: Develop a prioritisation framework so high-risk systems (long-lived sensitive data, operationally critical crypto, heavy third-party dependencies) are addressed first and resources managed effectively.
    - _T2 Risk-Informed · software_: Assess each vendor's (SaaS, cloud, hardware, software) cryptographic protocols, support for PQC standards and readiness for quantum-resistant algorithms, and review vendor cryptographic roadmaps.
    - _T3 Repeatable · all_: Incorporate PQC requirements into new vendor contracts and service-level agreements, and engage key vendors to signal demand and accelerate PQC in their offerings.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create a comprehensive inventory of all cryptographic assets, identifying where cryptography is used across data-in-transit, data-at-rest and data-in-use.
    - _T3 Repeatable · keys_: Inventory must track algorithms and keys and capture metadata such as ownership, usage and lifecycle management, combining documented known assets with detailed scans.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Implement new internationally recognised PQC standards (e.g. NIST algorithms) in remediation; hybrid classical/PQC solutions are supported to ease transition.
