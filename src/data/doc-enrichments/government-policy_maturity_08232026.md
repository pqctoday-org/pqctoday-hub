---
generated: 2026-08-23
category: Compliance Frameworks
document_count: 27
requirement_count: 184
---

## 10-CFR-73-54-Protection-of-Digital-Computer-and-Communicatio
- **Source**: 10 CFR 73.54 — Protection of Digital Computer and Communication Systems and Networks
- **URL**: https://www.ecfr.gov/current/title-10/chapter-I/part-73/section-73.54
- **Requirement count**: 7
- **Governance**:
    - _T3 Repeatable · all_: Establish, implement, and maintain a cyber security program and plan approved by the Commission, incorporating defense-in-depth strategies and incident response measures.
    - _T3 Repeatable · all_: Develop and maintain written policies and implementing procedures to execute the cyber security plan, subject to periodic NRC inspection.
    - _T3 Repeatable · all_: Ensure personnel and contractors are trained on cyber security requirements and responsibilities to perform assigned duties.
    - _T3 Repeatable · all_: Evaluate and manage cyber risks as part of the cyber security program.
    - _T3 Repeatable · all_: Review the cyber security program as a component of the physical security program in accordance with specified periodicity requirements.
    - _T3 Repeatable · all_: Evaluate modifications to protected assets before implementation to ensure cyber security performance objectives are maintained.
    - _T3 Repeatable · all_: Retain all records and supporting technical documentation for the cyber security program until license termination, keeping superseded records for at least three years.

## 2026-Minimum-Elements-for-a-Software-Bill-of-Materials-SBOM
- **Source**: 2026 Minimum Elements for a Software Bill of Materials (SBOM)
- **URL**: https://www.cisa.gov/sites/default/files/2026-07/2026_cisa_sbom_minimum_elements_508c.pdf
- **Requirement count**: 7
- **Inventory**:
    - _T3 Repeatable · software_: Generate SBOMs satisfying updated minimum elements, including component hashes, licenses, and dependency relationships, using machine-processable formats.
    - _T3 Repeatable · software_: Request SBOMs from suppliers that satisfy the updated minimum elements to ensure supply chain transparency and risk-informed decisions.
    - _T3 Repeatable · software_: Use available tools to generate, ingest, and analyze SBOM data to support machine-speed actions and vulnerability management.
    - _T3 Repeatable · software_: Ensure SBOMs capture nested inventory structures, identifying first-party and third-party components and their subcomponents.
    - _T3 Repeatable · software_: Include SBOM author signature, tool version, and generation context to ensure data integrity and traceability.
    - _T3 Repeatable · software_: Explicitly identify unknown information within the SBOM to maintain data quality and transparency.
- **Observability**:
    - _T3 Repeatable · software_: Map SBOM data to security advisories and approved software databases to detect vulnerabilities and policy drift.

## 49-CFR-Part-236-Subpart-I-Positive-Train-Control-Systems
- **Source**: 49 CFR Part 236 Subpart I — Positive Train Control Systems
- **URL**: https://www.ecfr.gov/current/title-49/subtitle-B/chapter-II/part-236/subpart-I
- **Requirement count**: 10
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Undergo independent third-party Verification and Validation (V&V) to certify PTC system safety and compliance.
    - _T3 Repeatable · all_: Achieve PTC System Certification as required by statute and detailed in the regulations.
- **Governance**:
    - _T2 Risk-Informed · all_: Maintain records related to PTC system operations, maintenance, and compliance for retention.
    - _T2 Risk-Informed · all_: Develop and maintain an Operations and Maintenance Manual for the PTC system.
    - _T2 Risk-Informed · all_: Implement a training and qualification program for personnel working with or affected by PTC systems.
    - _T3 Repeatable · all_: Maintain an approved PTC Safety Plan (PTCSP) that defines system architecture, functionality, and safety standards for the PTC system.
    - _T3 Repeatable · all_: Submit a PTC Implementation Plan (PTCIP) detailing the implementation strategy and compliance with safety standards.
    - _T3 Repeatable · all_: Obtain FRA approval for the PTC Safety Plan (PTCSP) before system operation or modification.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Submit requests for amendments (RFA) for material modifications or discontinuances of the PTC system.
- **Observability**:
    - _T2 Risk-Informed · all_: Report errors, malfunctions, and initialization failures of the PTC system to the regulator.

## ANSSI-PQC-Position-2022
- **Source**: ANSSI Views on Post-Quantum Cryptography Transition
- **URL**: https://cyber.gouv.fr/en/publications/anssi-views-post-quantum-cryptography-transition
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Initiate a gradual overlap transition strategy to progressively increase trust in post-quantum algorithms while ensuring no security regression against classical threats.
    - _T2 Risk-Informed · all_: Address the transition from pre-quantum to post-quantum digital signatures before the existence of any Cryptographically Relevant Quantum Computer (CRQC) to avoid a posteriori impersonation attacks.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Avoid direct drop-in replacement of currently used algorithms in the short/medium term due to the immaturity of post-quantum cryptographic implementations.
    - _T2 Risk-Informed · libraries_: Implement hybrid mechanisms combining recognized pre-quantum public key algorithms with additional post-quantum secure algorithms to benefit from strong assurance against classical attacks.

## ASD-Australia-Information-Security-Manual-Guidelines-for-Cry
- **Source**: ASD (Australia) - Information Security Manual, Guidelines for Cryptography (verified current as of June 2026 release)
- **URL**: https://www.cyber.gov.au/business-government/asds-cyber-security-frameworks/ism/cyber-security-guidelines/guidelines-for-cryptography
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Assess cryptographic equipment, applications, and libraries via Common Criteria evaluation, FIPS 140-3, or independent security review to provide implementation assurance.
- **Governance**:
    - _T2 Risk-Informed · keys_: Develop, implement, and maintain well-documented cryptographic key management processes and procedures covering generation, distribution, storage, and destruction.
    - _T3 Repeatable · all_: Ensure only ASD-Approved Cryptographic Algorithms (AACAs) or high assurance algorithms are used by disabling unapproved algorithms or enforcing usage policies.
    - _T3 Repeatable · libraries_: Use cryptographic equipment, applications, or libraries that have completed a Common Criteria evaluation against an ASD-endorsed Protection Profile for OFFICIAL: Sensitive or PROTECTED data.
    - _T3 Repeatable · libraries_: Use cryptographic equipment, applications, or libraries with a Common Criteria evaluation against an ASD-endorsed Protection Profile to protect OFFICIAL: Sensitive or PROTECTED data in transit over insecure networks.
    - _T3 Repeatable · software_: Use High Assurance Cryptographic Equipment (HACE) issued an Approval for Use by ASD when encrypting media containing SECRET or TOP SECRET data.
    - _T3 Repeatable · software_: Use High Assurance Cryptographic Equipment (HACE) to protect SECRET and TOP SECRET data when communicated over insufficiently secure networks or public infrastructure.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Change keying material immediately when cryptographic equipment or associated keying material is compromised or suspected of being compromised.
- **Observability**:
    - _T2 Risk-Informed · keys_: Report the compromise or suspected compromise of cryptographic equipment or keying material to the CISO or delegate as soon as possible.

## CCCS-ITSAP40018
- **Source**: Guidance on Becoming Cryptographically Agile (ITSAP.40.018)
- **URL**: https://www.cyber.gc.ca/en/guidance/guidance-becoming-cryptographically-agile-itsap40018
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Ensure cryptographic implementations are validated under independent assurance programs like CMVP.
- **Governance**:
    - _T2 Risk-Informed · all_: Implement policies and procedures in IT change management to maintain the crypto inventory and manage configuration changes.
    - _T2 Risk-Informed · all_: Establish a procurement policy that requires cryptographic agility for future purchases.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create and maintain an inventory of all products using cryptography within the organization.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop a transition plan to upgrade non-agile products and legacy cryptography to agile alternatives.
- **Observability**:
    - _T2 Risk-Informed · all_: Use tools to scan systems and report on cryptography that may need replacement or configuration changes.

## CCN-TEC-009-BP-37-Spain-Recomendaciones-para-una-transicion
- **Source**: CCN-TEC 009 / BP-37 (Spain) - Recomendaciones para una transicion postcuantica segura
- **URL**: https://www.ccn.cni.es/eu/docman/documentos-publicos/boletines-pytec/495-ccn-tec-009-recomendaciones-transicion-postcuantica-segura/file
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a migration plan covering discovery, acquisition, deployment, and commissioning phases to prepare for post-quantum transition.
    - _T2 Risk-Informed · all_: Determine system risk levels according to the Spanish Post-Quantum Transition Roadmap to guide migration priorities.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Complete migration of high-risk systems to post-quantum cryptography before December 31, 2030.
    - _T2 Risk-Informed · all_: Complete migration of medium-risk systems to post-quantum cryptography before December 31, 2035.
    - _T2 Risk-Informed · all_: Migrate low-risk systems to post-quantum cryptography as much as possible before December 31, 2035.

## CISA-Quantum-Readiness-Roadmap
- **Source**: CISA/NSA/NIST Quantum-Readiness — Migration to Post-Quantum Cryptography
- **URL**: https://www.cisa.gov/sites/default/files/2023-08/Quantum%20Readiness_Final_CLEAR_508c%20(3).pdf
- **Requirement count**: 12
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a project management team to plan and scope the organization's migration to post-quantum cryptography.
    - _T2 Risk-Informed · all_: Include cybersecurity and privacy risk managers in the project team to prioritize assets based on CRQC impact.
    - _T2 Risk-Informed · all_: Engage with technology vendors to understand their quantum-readiness roadmaps and migration timelines.
    - _T2 Risk-Informed · all_: Plan for necessary changes to existing and future contracts to ensure PQC delivery and upgrades.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct proactive cryptographic discovery to identify reliance on quantum-vulnerable cryptography in IT and OT systems.
    - _T2 Risk-Informed · all_: Create a cryptographic inventory offering visibility into cryptography usage in IT and OT systems.
    - _T2 Risk-Informed · all_: Correlate cryptographic inventory with existing asset, identity, and access management inventories.
    - _T2 Risk-Informed · all_: Ask vendors for lists of embedded cryptography within their products to address discoverability gaps.
    - _T2 Risk-Informed · libraries_: Use discovery tools to identify quantum-vulnerable algorithms in applications, libraries, and firmware updates.
    - _T2 Risk-Informed · software_: Identify quantum-vulnerable cryptography in network protocols and CI/CD pipelines.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Feed the quantum-vulnerable inventory into risk assessment processes to prioritize PQC migration.
    - _T2 Risk-Informed · all_: Include details of vendor PQC update timelines and expected costs in the quantum-readiness roadmap.

## CRYPTREC-LS-0001-2022R2-List-of-Ciphers-to-be-Referred-to-fo
- **Source**: CRYPTREC LS-0001-2022R2 - List of Ciphers to be Referred to for Procurement in e-Government (CRYPTREC Ciphers List)
- **URL**: https://www.cryptrec.go.jp/list/cryptrec-ls-0001-2022r2.pdf
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Adopt cryptographic technologies listed in the CRYPTREC Recommended List for e-Government procurement, ensuring compliance with specified key length requirements.
    - _T2 Risk-Informed · all_: Restrict the use of technologies on the Operational Monitoring List to maintaining compatibility with existing systems; do not use for other purposes.
- **Inventory**:
    - _T2 Risk-Informed · libraries_: Ensure that MACs used with ECDH are limited to HMAC or CMAC as specified in the recommended list.
    - _T2 Risk-Informed · libraries_: Limit encryption using 64-bit block ciphers to 2^20 blocks per key, and CMAC generation to 2^21 blocks per key.
    - _T2 Risk-Informed · libraries_: Use only 128-bit block ciphers from the CRYPTREC list for XTS mode, restricted to storage device encryption following NIST SP800-38E.
    - _T2 Risk-Informed · libraries_: Ensure hash lengths are 256 bits or more when using SHAKE128 or SHAKE256.
    - _T2 Risk-Informed · libraries_: Recommend using a 96-bit initialization vector length for GCM mode.
    - _T2 Risk-Informed · libraries_: Use CBC-MAC with fixed message lengths for security reasons.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for the transition to Post-Quantum Cryptography (PQC) by referencing the PQC list for technologies resistant to Cryptographically Relevant Quantum Computers.

## CRYPTREC-LS-0003-2022R1-Criteria-for-Setting-Cryptographic-S
- **Source**: CRYPTREC LS-0003-2022R1 - Criteria for Setting Cryptographic Strength Requirements (Algorithm and Key-Length Selection)
- **URL**: https://www.cryptrec.go.jp/list/cryptrec-ls-0003-2022r1.pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Establish documented security strength requirements for algorithm and key length selection based on system operational lifespan and CRYPTREC lists.
- **Inventory**:
    - _T2 Risk-Informed · all_: Ensure selected algorithms and key lengths match CRYPTREC criteria; non-compliant selections are not considered valid use of recommended crypto.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Develop transition plans to facilitate easy changes to algorithms and key lengths to address unexpected vulnerabilities or strength degradation during operation.
    - _T2 Risk-Informed · all_: Plan for migration to Post-Quantum Cryptography (PQC) for systems with long operational lifespans using public key cryptography or signatures.

## Cabinet-Secretariat-Japan-PQC-Migration-Interim-Report-for-G
- **Source**: Cabinet Secretariat (Japan) - PQC Migration Interim Report for Government Institutions (2025-11)
- **URL**: https://www.cas.go.jp/jp/seisaku/pqc/pdf/report_202511.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Utilize only PQC algorithms that have undergone safety and implementation performance evaluation by CRYPTREC and are reflected in the CRYPTREC Cryptography List.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a PQC migration plan based on the government roadmap, assessing information sensitivity and usage to determine appropriate transition timelines for each system.
- **Inventory**:
    - _T2 Risk-Informed · all_: Construct a crypto inventory to identify cryptographic modules and algorithms in use, enabling detailed assessment of migration targets and priorities.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Target completion of migration to Post-Quantum Cryptography (PQC) by 2035, with earlier transitions for systems handling highly sensitive or long-term protected information.

## Czech-NUKIB-Crypto-Rec-2023
- **Source**: NUKIB Minimum Requirements for Cryptographic Algorithms (2025 revision)
- **URL**: https://nukib.gov.cz/download/publications_en/Minimum%20Requirements%20for%20Cryptographic%20Algorithms.pdf
- **Requirement count**: 13
- **Governance**:
    - _T2 Risk-Informed · all_: Liable entities must take into account NUKIB cryptographic recommendations to protect information and communication system assets as mandated by the Cyber Security Decree.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · libraries_: Plan for the replacement of quantum-vulnerable classical asymmetric algorithms with quantum-resistant cryptography in the near future.
    - _T3 Repeatable · keys_: Change encryption keys after at most 2^32 initialization vector values when using GCM or GMAC modes.
    - _T3 Repeatable · keys_: Do not repeat initialization vector values for a given key when using GCM, OFB, UMAC, or GMAC modes.
    - _T3 Repeatable · keys_: Do not repeat counter values for a given key when using CTR mode.
    - _T3 Repeatable · keys_: Use distinct keys for encryption and MAC calculation in composite Encrypt-then-MAC schemes.
    - _T3 Repeatable · keys_: Ensure hash function output length is at least 256 bits, preferably 384 bits or more.
    - _T3 Repeatable · keys_: Use Argon2id for password storage with minimum parameters: t=1, m=2GiB, p=4 or t=3, m=64MiB, p=4 for constrained environments.
    - _T3 Repeatable · libraries_: Implement stand-alone post-quantum key establishment algorithms (ML-KEM-1024) strictly according to the NIST FIPS 203 standard.
    - _T3 Repeatable · libraries_: Ensure hybrid quantum-resistant cryptography preserves security even if one component (classical or post-quantum) is broken.
    - _T3 Repeatable · libraries_: Use random, attacker-unpredictable initialization vectors for CBC and CFB modes.
    - _T3 Repeatable · libraries_: Do not use approved encryption modes (CTR, OFB, CBC, CFB) stand-alone; only use them within Encrypt-then-MAC schemes.
    - _T3 Repeatable · software_: Use post-quantum digital signature algorithms (LMS, XMSS) exclusively for firmware and software integrity protection.

## EO-14409-Securing-the-Nation
- **Source**: Executive Order (June 2026): Securing the Nation Against Advanced Cryptographic Attacks
- **URL**: https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure covered contractors comply with NIST FIPS, including PQC-compliant algorithms, by December 31, 2030, via FAR amendments.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a PQC migration lead reporting to the CIO to oversee cryptographic inventory management and develop a prioritized migration plan.
    - _T2 Risk-Informed · all_: Develop and submit a plan to OMB and the National Cyber Director to accomplish the transition of HVAs and high impact systems to PQC.
- **Inventory**:
    - _T2 Risk-Informed · all_: Review the inventory of High Value Assets (HVAs) and high impact systems to identify cryptographic assets requiring PQC transition.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Transition all HVAs and high impact systems to use Post-Quantum Cryptography for key establishment by December 31, 2030.
    - _T3 Repeatable · software_: Transition all HVAs and high impact systems to use Post-Quantum Cryptography for digital signatures by December 31, 2031.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement vulnerability disclosure policies that incorporate reports of cryptographic vulnerabilities, including use of non-FIPS approved algorithms.

## EO-2026-06-22-Securing-the-Nation
- **Source**: Executive Order (June 22, 2026): Securing the Nation Against Advanced Cryptographic Attacks
- **URL**: https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Implement vulnerability disclosure policies that incorporate reports of cryptographic vulnerabilities, including use of non-FIPS approved algorithms.
    - _T3 Repeatable · libraries_: Ensure covered contractors comply with NIST FIPS, including PQC-compliant algorithms, by December 31, 2030, via FAR amendments.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a PQC migration lead reporting to the CIO to oversee cryptographic inventory management and develop a prioritized migration plan.
    - _T2 Risk-Informed · all_: Submit a plan to OMB and the National Cyber Director detailing the strategy to transition HVAs and high-impact systems to PQC.
- **Inventory**:
    - _T2 Risk-Informed · all_: Review the inventory of High Value Assets (HVAs) and high-impact systems to identify cryptographic assets requiring PQC transition.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Transition all HVAs and high-impact systems to use PQC for digital signatures by December 31, 2031.
    - _T3 Repeatable · keys_: Transition all HVAs and high-impact systems to use PQC for key establishment by December 31, 2030.
- **Observability**:
    - _T2 Risk-Informed · all_: Adopt minimum elements for a cryptographic bill of materials (CBOM) to enable automated assessment of cryptographic assets in hardware and software.

## EPA-America-s-Water-Infrastructure-Act-AWIA-Section-2013
- **Source**: EPA America's Water Infrastructure Act (AWIA) Section 2013
- **URL**: https://www.epa.gov/waterresilience/awia-section-2013
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Develop and maintain documented Risk and Resilience Assessments (RRAs) and Emergency Response Plans (ERPs) that address cybersecurity risks to electronic and automated systems.
    - _T2 Risk-Informed · all_: Certify completion of RRAs and ERPs to the EPA, establishing formal attestation of compliance with risk and resilience requirements.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Review and revise RRAs and ERPs at least once every five years to ensure continued relevance and incorporate findings from the RRA into the ERP.
- **Observability**:
    - _T2 Risk-Informed · all_: Include strategies in the ERP to aid in the detection of malevolent acts or natural hazards that threaten the security or resilience of the system.

## EU-NIS-Cooperation-Group-A-Coordinated-Implementation-Roadma
- **Source**: EU NIS Cooperation Group - A Coordinated Implementation Roadmap for the Transition to Post-Quantum Cryptography (2025-06-23)
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/117507
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Establish mature cryptographic asset management to facilitate the transition to PQC and improve cryptographic agility.
    - _T2 Risk-Informed · all_: Initiate a national PQC transition strategy by the end of 2026 and coordinate efforts at the EU level.
    - _T2 Risk-Informed · all_: Include the quantum threat as part of the risk management process for all relevant entities.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain a structured overview of cryptographic assets to support the PQC transition.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Transition high-risk use cases to PQC as soon as possible, no later than the end of 2030.
    - _T2 Risk-Informed · all_: Complete the PQC transition for as many systems as practically feasible by 2035.
    - _T2 Risk-Informed · all_: Use standardized and tested hybrid solutions whenever feasible and suitable during migration.

## FDA-Cybersecurity-in-Medical-Devices-Premarket-Guidance-2023
- **Source**: FDA — Cybersecurity in Medical Devices: Premarket Guidance 2023
- **URL**: https://www.fda.gov/media/119933/download
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Conduct cybersecurity testing and submit documentation demonstrating reasonable assurance of security.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish and document plans and procedures to provide reasonable assurance of cybersecurity for cyber devices.
    - _T2 Risk-Informed · all_: Implement a Secure Product Development Framework (SPDF) to manage cybersecurity risks within the Quality Management System.
- **Inventory**:
    - _T2 Risk-Informed · software_: Create and submit a Software Bill of Materials (SBOM) for cyber devices as part of premarket documentation.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Document processes for managing modifications that may impact cybersecurity throughout the device lifecycle.
- **Observability**:
    - _T2 Risk-Informed · all_: Include event detection and logging controls in the security architecture to monitor device activity.

## FDA-DSCSA-Standards-for-the-Interoperable-Exchange-of-Inform
- **Source**: FDA — DSCSA Standards for the Interoperable Exchange of Information
- **URL**: https://www.fda.gov/media/171796/download
- **Requirement count**: 3
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Transition to electronic-based methods for product tracing and verification by November 27, 2023, as mandated by DSCSA section 582(g)(1).
    - _T3 Repeatable · all_: Adhere to FDA-established standards for the secure, interoperable, electronic exchange of transaction information and transaction statements.
- **Observability**:
    - _T3 Repeatable · all_: Verify product at the package level using electronic methods to ensure traceability and security within the distribution supply chain.

## Federal-PKI-Policy-Authority
- **Source**: Federal PKI Policy Authority
- **URL**: https://www.idmanagement.gov/fpki/
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T3 Repeatable · certificates_: Conduct independent annual compliance audits for all FPKI supporting functions and CA elements to verify adherence to Certificate Policies.
    - _T3 Repeatable · certificates_: Submit annual review packages and audit results to the FPKI Policy Authority to demonstrate ongoing compliance with FPKI requirements.
    - _T3 Repeatable · certificates_: Perform annual conformance testing for PIV and PIV-I credentials using approved tools and submit test artifacts to the FIPS 201 Evaluation Program.
- **Governance**:
    - _T3 Repeatable · certificates_: Maintain documented Certificate Policies and Profiles for all FPKI-affiliated CAs, including Common, Bridge, and Public Trust TLS policies.
    - _T3 Repeatable · certificates_: Operate Certification Authorities in strict compliance with the applicable Federal Common or Bridge Certificate Policy and Certification Practice Statement.
    - _T3 Repeatable · certificates_: Define and document roles and responsibilities for Registration Agents and enrollment agents under the Federal PKI Common Policy Framework.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Plan for cryptographic migration by updating trust stores with new intermediate CA certificates to maintain interoperability during FBCA G5 transition.
- **Observability**:
    - _T3 Repeatable · certificates_: Establish incident management procedures to report security incidents, such as key compromises or data breaches, to FPKI Authorities and relying parties.

## HHS-HIPAA-Security-Rule-45-CFR-Part-164-Subpart-C
- **Source**: HHS HIPAA Security Rule — 45 CFR Part 164 Subpart C
- **URL**: https://www.ecfr.gov/current/title-45/subtitle-A/subchapter-C/part-164/subpart-C
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Implement policies and procedures to prevent, detect, contain, and correct security violations regarding electronic protected health information.
    - _T2 Risk-Informed · all_: Identify a security official responsible for the development and implementation of required security policies and procedures.
    - _T2 Risk-Informed · all_: Conduct an accurate and thorough risk analysis of potential risks and vulnerabilities to the confidentiality, integrity, and availability of ePHI.
    - _T2 Risk-Informed · all_: Implement security measures sufficient to reduce risks and vulnerabilities to a reasonable and appropriate level.
    - _T2 Risk-Informed · all_: Apply appropriate sanctions against workforce members who fail to comply with security policies and procedures.
    - _T2 Risk-Informed · all_: Review and modify security measures as needed to continue reasonable protection, and update documentation of such measures.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement procedures to regularly review records of information system activity, such as audit logs and security incident tracking reports.

## ICAO-Assembly-Resolution-A41-19-Aviation-Cybersecurity
- **Source**: ICAO Assembly Resolution A41-19 — Aviation Cybersecurity
- **URL**: https://www.icao.int/sites/default/files/sp-files/aviationcybersecurity/Documents/A41-19.pdf
- **Requirement count**: 10
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a competent national authority for aviation cybersecurity and define its interaction with concerned national agencies.
    - _T2 Risk-Informed · all_: Define the responsibilities of national agencies and industry stakeholders regarding cybersecurity in civil aviation.
    - _T2 Risk-Informed · all_: Develop and implement a robust cybersecurity risk management framework drawing on safety and security risk management practices.
    - _T2 Risk-Informed · all_: Establish policies and instruments to ensure critical aviation systems are secure by design, protected, resilient, and that data is secured.
    - _T2 Risk-Informed · all_: Encourage government/industry coordination regarding aviation cybersecurity strategies, policies, and plans.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement system monitoring, incident detection, and reporting methods for critical aviation systems.
    - _T2 Risk-Informed · all_: Develop and practice incident recovery plans and carry out forensic analysis of cyber incidents.
    - _T2 Risk-Informed · all_: Share information to help identify critical vulnerabilities that need to be addressed.
    - _T2 Risk-Informed · all_: Collaborate in identifying, protecting, and monitoring common vulnerabilities and data flows at civil/military interfaces.
    - _T2 Risk-Informed · all_: Participate in mechanisms for systematic sharing of information on cyber threats, incidents, trends, and mitigation efforts.

## IMO-MSC-FAL-1-Circ-3-Rev-2-Guidelines-on-Maritime-Cyber-Risk
- **Source**: IMO MSC-FAL.1/Circ.3/Rev.2 — Guidelines on Maritime Cyber Risk Management
- **URL**: https://wwwcdn.imo.org/localresources/en/OurWork/Security/Documents/MSC-FAL.1-Circ.3-Rev.2%20-%20Guidelines%20On%20Maritime%20Cyber%20Risk%20Management%20(Secretariat)%20(1).pdf
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Senior management must embed a culture of cyber risk awareness and ensure a holistic, flexible cyber risk management regime is in continuous operation.
    - _T2 Risk-Informed · all_: Define personnel roles and responsibilities for cyber risk management and identify systems, assets, data, and capabilities that pose risks to ship operations.
    - _T2 Risk-Informed · all_: Ensure the level of cyber risk awareness and preparedness is appropriate to the roles and responsibilities within the cyber risk management system.

## IMO-Maritime-Cyber-Risk-Management-Guidelines
- **Source**: IMO Maritime Cyber Risk Management Guidelines
- **URL**: https://wwwcdn.imo.org/localresources/en/OurWork/Security/Documents/MSC-FAL.1-Circ.3-Rev.3.pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a person or entity accountable for planning, resourcing, and executing cybersecurity activities with necessary authority and expertise.
    - _T2 Risk-Informed · all_: Establish and monitor risk management strategy, expectations, and policies. Define personnel roles and responsibilities for cyber risk management.
    - _T2 Risk-Informed · all_: Ensure senior management embeds a culture of cyber risk awareness and ensures a holistic, flexible, and continuously evaluated cyber risk management regime.
- **Inventory**:
    - _T2 Risk-Informed · all_: Establish and maintain an inventory of digital systems on board the ship, including internal/external dependencies and network connections.
    - _T2 Risk-Informed · all_: Identify systems, assets, services, data, and capabilities, including interdependencies and supply chain elements, that pose risks if disrupted.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Establish a hardware and software approval process to control the installation and maintenance of systems.
- **Observability**:
    - _T2 Risk-Informed · all_: Carry out risk assessments of critical systems to identify threats, vulnerabilities, and assess likelihood and impact of cyber incidents.

## India-TEC-910018-2025
- **Source**: India TEC Technical Report TEC 910018:2025 — Migration to Post-Quantum Cryptography
- **URL**: https://www.tec.gov.in/pdf/TR/Final%20technical%20report%20on%20migration%20to%20PQC%2028-03-25.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Validate the implementation of post-quantum cryptography and request proof of concept or pilots from vendors.
- **Governance**:
    - _T2 Risk-Informed · all_: Create executive awareness and prepare for proactive investments to respond to quantum threats affecting critical digital infrastructure.
- **Inventory**:
    - _T2 Risk-Informed · all_: Identify critical digital infrastructures, including data and applications, that will be affected by cryptographically relevant quantum computers.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Prepare for a smooth transition to quantum-safe cryptography by identifying critical assets beforehand.
    - _T2 Risk-Informed · all_: Conduct risk assessments and define post-quantum requirements as part of the migration plan preparation.

## NTIA-SBOM-Minimum-Elements-2021
- **Source**: The Minimum Elements For a Software Bill of Materials (SBOM)
- **URL**: https://www.ntia.gov/sites/default/files/publications/sbom_minimum_elements_report_0.pdf
- **Requirement count**: 3
- **Governance**:
    - _T3 Repeatable · software_: Define operational practices for SBOM requests, generation, and use, including frequency, depth, known unknowns, distribution, access control, and error accommodation.
- **Inventory**:
    - _T3 Repeatable · software_: Generate machine-readable SBOMs using standard formats (SPDX, CycloneDX, SWID) to support automation and scaling across the software ecosystem.
    - _T3 Repeatable · software_: Document baseline component data including Supplier, Component Name, Version, Unique Identifiers, Dependency Relationship, Author, and Timestamp.

## OMB-M-26-15
- **Source**: OMB Memorandum M-26-15 — Execution of the Migration to Post-Quantum Cryptography
- **URL**: https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf
- **Requirement count**: 12
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Submit a PQC Migration Plan to OMB and ONCD within 120 days, aligning with NIST IR 8547.
    - _T2 Risk-Informed · all_: Engage FedRAMP-authorized cloud service providers to delineate PQC migration responsibilities within the shared responsibility model.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish or update internal governance structure to oversee PQC migration with clearly defined roles and responsibilities for leadership teams.
    - _T2 Risk-Informed · all_: Integrate PQC readiness and implementation functions into existing governance structures, aligning with cybersecurity governance principles.
    - _T2 Risk-Informed · all_: Designate accountable officials and establish governance frameworks during the initial strategy and planning phase of the migration.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct inventory of cryptographic systems, including High Value Assets and high impact systems, to support risk-based prioritization.
    - _T3 Repeatable · all_: Use automation to achieve a comprehensive and continuously updated understanding of the cryptographic posture.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Execute prioritized migration of cryptographic systems to mitigate quantum risk by December 31, 2030.
    - _T3 Repeatable · all_: Incorporate PQC upgrades into planned cloud migrations, software development lifecycles, and hardware-refresh schedules.
    - _T3 Repeatable · all_: Identify systems incapable of supporting PQC or hybrid cryptography and prioritize them for replacement or decommissioning.
    - _T3 Repeatable · all_: Ensure all systems are cryptographically agile during the prioritized migration and signature migration phases.
- **Observability**:
    - _T3 Repeatable · all_: Use automation for compliance reporting to monitor the status of the PQC migration.

## https-nukib-gov-cz-download-publications-en-Annex-20to-20the
- **Source**: NUKIB — Annex to the document "Minimum Requirements for Cryptographic Algorithms" (Quantum threat and quantum-resistant cryptography)
- **URL**: https://nukib.gov.cz/download/publications_en/Annex%20to%20the%20document_Minimum%20Requirements%20for%20Cryptographic%20Algorithms.pdf
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Adopt NUKIB's position on the standalone use of ML-KEM and ML-DSA Level 5 for quantum-resistant cryptography, aligning with NSA CNSA 2.0 rationale.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · software_: Transition to quantum-resistant cryptography in high-priority areas, specifically for long-lived data and firmware update signatures, as recommended by NUKIB.
    - _T2 Risk-Informed · software_: Implement hybrid quantum-resistant cryptography for key establishment and digital signatures as the recommended approach during the transition period.
    - _T2 Risk-Informed · software_: Ensure cryptographic agility to facilitate the incorporation of post-quantum algorithms into existing cryptographic protocols and systems.
