---
generated: 2026-08-08
category: Compliance Frameworks
document_count: 6
requirement_count: 48
---

## APRA-CPS-234
- **Source**: APRA Prudential Standard CPS 234 Information Security
- **URL**: https://www.apra.gov.au/standards/cps-234
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Evaluate the design of information security controls for assets managed by related parties or third parties.
    - _T2 Risk-Informed · all_: Undertake systematic testing and assurance regarding the effectiveness of information security controls.
- **Governance**:
    - _T2 Risk-Informed · all_: Clearly define information security roles and responsibilities for the Board, senior management, and individuals with decision-making authority.
    - _T2 Risk-Informed · all_: Maintain an information security policy framework that provides direction on responsibilities for all parties obligated to maintain security.
    - _T2 Risk-Informed · all_: Ensure the Board is ultimately responsible for maintaining information security commensurate with threats to information assets.
- **Inventory**:
    - _T2 Risk-Informed · all_: Classify information assets, including those managed by third parties, by criticality and sensitivity based on potential impact.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Implement information security controls commensurate with the stage of the information asset's lifecycle, from planning to decommissioning.

## CISA-Quantum-Readiness-Roadmap
- **Source**: CISA/NSA/NIST Quantum-Readiness — Migration to Post-Quantum Cryptography
- **URL**: https://www.cisa.gov/sites/default/files/2023-08/Quantum%20Readiness_Final_CLEAR_508c%20(3).pdf
- **Requirement count**: 13
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a project management team to plan and scope the organization's migration to post-quantum cryptography.
    - _T2 Risk-Informed · all_: Include cybersecurity and privacy risk managers in the project team to prioritize assets based on CRQC impact.
    - _T2 Risk-Informed · all_: Engage with technology vendors to understand their quantum-readiness roadmaps and migration timelines.
    - _T2 Risk-Informed · all_: Plan for necessary changes to existing and future contracts to ensure PQC delivery and upgrades.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct proactive cryptographic discovery to identify reliance on quantum-vulnerable cryptography in IT and OT systems.
    - _T2 Risk-Informed · all_: Create a cryptographic inventory offering visibility into cryptography usage in IT and OT systems.
    - _T2 Risk-Informed · all_: Correlate cryptographic inventory with existing asset, identity, and access management inventories.
    - _T2 Risk-Informed · all_: Include estimates on the length of protection required for sensitive datasets in the inventory.
    - _T2 Risk-Informed · libraries_: Use discovery tools to identify quantum-vulnerable algorithms in applications, libraries, and firmware.
    - _T2 Risk-Informed · software_: Identify quantum-vulnerable cryptography in network protocols and CI/CD pipelines.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Feed the quantum-vulnerable inventory into risk assessment processes to prioritize PQC migration.
    - _T2 Risk-Informed · all_: Prioritize migration for high-impact systems, ICS, and systems with long-term confidentiality needs.
    - _T2 Risk-Informed · software_: Include vendor PQC update timelines and costs in the organization's quantum-readiness roadmap.

## EO-14306
- **Source**: Executive Order 14306 — Sustaining Select Cybersecurity Efforts (PQC Provisions)
- **URL**: https://www.whitehouse.gov/presidential-actions/2025/06/sustaining-select-efforts-to-strengthen-the-nations-cybersecurity-and-amending-executive-order-13694-and-executive-order-14144/
- **Requirement count**: 3
- **Governance**:
    - _T4 Adaptive · all_: Participate in or align with pilot programs establishing rules-as-code approaches for machine-readable cybersecurity policy.
- **Inventory**:
    - _T2 Risk-Informed · software_: Monitor CISA-released list of product categories where post-quantum cryptography products are widely available.
- **Lifecycle / CLM**:
    - _T3 Repeatable · software_: Support TLS 1.3 or successor versions by January 2, 2030, to prepare for post-quantum cryptography transition.

## EO-2026-06-22-Securing-the-Nation
- **Source**: Executive Order (June 22, 2026): Securing the Nation Against Advanced Cryptographic Attacks
- **URL**: https://www.whitehouse.gov/presidential-actions/2026/06/securing-the-nation-against-advanced-cryptographic-attacks/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Ensure covered contractors comply with NIST FIPS, including PQC-compliant algorithms, by December 31, 2030, via FAR amendments.
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a PQC migration lead reporting to the CIO to oversee cryptographic inventory management and develop a prioritized migration plan.
    - _T2 Risk-Informed · all_: Submit a plan to OMB and the National Cyber Director detailing the strategy to transition High Value Assets and high impact systems to PQC.
- **Inventory**:
    - _T2 Risk-Informed · all_: Review the inventory of High Value Assets and high impact systems to identify cryptographic assets requiring transition to PQC.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Transition all High Value Assets and high impact systems to use PQC for digital signatures by December 31, 2031.
    - _T3 Repeatable · keys_: Transition all High Value Assets and high impact systems to use PQC for key establishment by December 31, 2030.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement vulnerability disclosure policies that incorporate reports of cryptographic vulnerabilities, including use of non-FIPS approved algorithms.

## EU-NIS-CG-Roadmap-v1.1
- **Source**: EU NIS Cooperation Group — Coordinated Implementation Roadmap for PQC Transition v1.1
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/117507
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Establish mature cryptographic asset management to facilitate the transition to PQC and improve cryptographic agility.
    - _T2 Risk-Informed · all_: Initiate a national PQC transition strategy by the end of 2026 and coordinate efforts at the EU level.
    - _T2 Risk-Informed · all_: Include the quantum threat as part of the risk management processes for all relevant entities.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain a structured overview of cryptographic assets to support the PQC transition.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Transition high-risk use cases to PQC as soon as possible, no later than the end of 2030.
    - _T2 Risk-Informed · all_: Complete the PQC transition for as many systems as practically feasible by 2035.
    - _T2 Risk-Informed · all_: Use standardized and tested hybrid solutions whenever feasible and suitable during migration.

## OMB-M-26-15
- **Source**: OMB Memorandum M-26-15 — Execution of the Migration to Post-Quantum Cryptography
- **URL**: https://www.whitehouse.gov/wp-content/uploads/2026/06/M-26-15-Execution-of-the-Migration-to-Post-Quantum-Cryptography.pdf
- **Requirement count**: 11
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Submit a PQC Migration Plan to OMB and ONCD within 120 days, aligning with NIST IR 8547.
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
    - _T3 Repeatable · all_: Use automation for compliance reporting to monitor cryptographic posture and policy enforcement.
