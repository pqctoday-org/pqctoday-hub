---
generated: 2026-08-08
category: Compliance Frameworks
document_count: 4
requirement_count: 30
---

## Canada CSE PQC Guidance
- **Source**: Roadmap for the migration to post-quantum cryptography for the Government of Canada (ITSM.40.001)
- **URL**: https://www.cyber.gc.ca/sites/default/files/itsm.40.001-migration-post-quantum-cryptography-government-canada-e.pdf
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Report on PQC migration progress annually to TBS starting April 2026, ensuring accountability and compliance with government-wide milestones.
    - _T3 Repeatable · all_: Complete migration of high-priority systems by end of 2031 and remaining systems by end of 2035, ensuring quantum-vulnerable algorithms are disabled, isolated, or tunnelled.
- **Governance**:
    - _T3 Repeatable · all_: Establish a departmental PQC migration plan with a dedicated executive lead (DOCS) and technical lead to ensure oversight, accountability, and cross-departmental coordination.
    - _T3 Repeatable · all_: Include financial planning, education strategy, and procurement policies in the migration plan to support resource allocation and staff awareness of quantum threats.
    - _T3 Repeatable · all_: Mandate PQC compliance in procurement contracts, requiring vendors to support Cyber Centre recommendations and ensuring cryptographic modules are certified.
- **Inventory**:
    - _T3 Repeatable · all_: Conduct cryptographic discovery to build an inventory of systems using cryptography, including components, versions, security controls, and hosting platforms.
    - _T3 Repeatable · all_: Prioritize systems for migration based on risk assessment, specifically targeting those susceptible to 'harvest now, decrypt later' threats and protecting confidentiality in transit.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Integrate PQC transition activities into existing IT change management processes, including impact assessments, rollback playbooks, and staging environments for testing.
    - _T3 Repeatable · all_: Plan for backwards compatibility during transition, supporting PQC while maintaining legacy cryptography, followed by a second stage to disable vulnerable algorithms.

## NZISM-V3-9
- **Source**: New Zealand Information Security Manual (NZISM) v3.9 — November 2025
- **URL**: https://nzism.gcsb.govt.nz/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Agencies MUST retain records of risk assessments and decisions regarding non-compliance with baseline controls to support governance and auditing.
    - _T3 Repeatable · all_: Agencies MUST record and formally acknowledge residual risks when good practice controls are not implemented, with agreement from the Accreditation Authority.
- **Governance**:
    - _T2 Risk-Informed · all_: Agencies SHOULD review decisions to be non-compliant with controls at least annually to ensure residual risk remains acceptable.
    - _T3 Repeatable · all_: System owners MUST obtain formal dispensation from the Accreditation Authority for any non-compliance with baseline controls, including cryptographic requirements.
    - _T3 Repeatable · all_: System owners MUST complete a risk assessment documenting reasons for non-compliance, alternative mitigations, and residual risk before seeking dispensation.
    - _T3 Repeatable · all_: Agencies MUST consult originating agencies or foreign governments before deciding to be non-compliant with controls for systems processing their classified information.
    - _T3 Repeatable · all_: Agencies MUST formally consult interested parties before deciding to be non-compliant with baseline controls for All-of-Government systems.

## Saudi-NCA-ECC2-2024
- **Source**: Saudi Arabia National Cybersecurity Authority — Essential Cybersecurity Controls ECC-2:2024
- **URL**: https://nca.gov.sa/
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Periodically review the implementation of cybersecurity controls, including cryptography, by the entity.
    - _T2 Risk-Informed · all_: Conduct independent audits of cybersecurity control implementation by parties other than the cybersecurity department, adhering to GAAS.
    - _T2 Risk-Informed · all_: Document audit results, including scope, observations, and remediation plans, and present them to the supervisory committee and Authorized Official.
- **Governance**:
    - _T2 Risk-Informed · all_: Identify, document, and approve cybersecurity policies and procedures, including cryptographic controls, and have them approved by the Authorized Official.
    - _T2 Risk-Informed · all_: Identify, document, and approve specific cybersecurity requirements for cryptography within the entity.
    - _T2 Risk-Informed · all_: Implement approved cybersecurity requirements for cryptography within the entity.
    - _T2 Risk-Informed · all_: Adhere to National Cryptographic Standards published by NCA, selecting appropriate standard levels based on data sensitivity and risk assessment.

## Singapore-CSA-Quantum-Safe-Handbook
- **Source**: Quantum-Safe Handbook and Quantum Readiness Index
- **URL**: https://isomer-user-content.by.gov.sg/36/11227d39-4350-4ded-9046-d62f99f561ab/Draft%20for%20Public%20Consultation%20-%20Quantum-Safe%20Handbook%20(Oct%202025).pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Identify the individual accountable for quantum-safe migration decisions and plan approval to ensure clear ownership.
    - _T2 Risk-Informed · all_: Apply the RACI model to define Responsible, Accountable, Consulted, and Informed stakeholders for coordinated execution.
    - _T2 Risk-Informed · all_: Update procurement policies to explicitly require cryptographic specifications, agility, and vendor post-quantum roadmaps.
    - _T2 Risk-Informed · all_: Embed quantum-safe requirements into existing governance structures, including cryptographic policies and risk registers.
    - _T2 Risk-Informed · all_: Review contractual clauses to address PQC support, algorithm update mechanisms, and SLAs for quantum-safe transitions.
    - _T2 Risk-Informed · all_: Assess third-party vendors’ maturity in quantum-safe implementation and migration timelines to manage supply chain risk.
    - _T2 Risk-Informed · all_: Brief senior leadership on the quantum threat to secure approval for necessary resources and migration timelines.
