---
generated: 2026-08-08
category: Compliance Frameworks
document_count: 1
requirement_count: 9
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
