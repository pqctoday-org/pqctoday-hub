---
generated: 2026-08-31
category: Technical Standards
document_count: 2
requirement_count: 12
---

## EU PQC Recommendation
- **Source**: Recommendation on Coordinated Implementation Roadmap for PQC Transition
- **URL**: https://ec.europa.eu/newsroom/dae/redirection/document/104249
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Submit relevant information to the Commission upon request to enable monitoring of progress and assessment of the effectiveness of PQC transition measures.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a dedicated sub-group of the NIS Cooperation Group to coordinate the development of the PQC Coordinated Implementation Roadmap and align national transition plans.
    - _T2 Risk-Informed · all_: Develop a comprehensive national strategy for PQC adoption with clear goals, milestones, and timelines, aligned with the EU Coordinated Implementation Roadmap.
    - _T2 Risk-Informed · all_: Cooperate with ENISA and cybersecurity experts to evaluate and select PQC algorithms for adoption as EU standards to ensure harmonized implementation.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Define a coordinated implementation roadmap with a clear timeline for different phases and milestones, including the use of hybrid schemes for transition.
    - _T2 Risk-Informed · all_: Ensure the PQC Coordinated Implementation Roadmap is available within two years of the recommendation's publication to guide national transition plans.

## draft-kwiatkowski-pquip-pqc-migration-00
- **Source**: Guidance for migration to Post-Quantum Cryptography
- **URL**: https://www.ietf.org/archive/id/draft-kwiatkowski-pquip-pqc-migration-00.html
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Align migration strategies with established standards such as FIPS and anticipate the certification process for post-quantum algorithms.
- **Governance**:
    - _T2 Risk-Informed · all_: Define PQC migration objectives based on a formal assessment of risk tolerance regarding data and asset safeguarding.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct discovery initiatives to build a comprehensive inventory of cryptographic assets and assess their relevance to PQC migration.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · certificates_: Update PKI infrastructure, including CAs and certificate formats, to handle PQC keys and certificates during the migration phase.
    - _T2 Risk-Informed · keys_: Prioritize cryptographic agility in protocols to support efficient key rollover and algorithm negotiation during PQC transition.
- **Observability**:
    - _T2 Risk-Informed · all_: Implement continuous monitoring and evaluation to track migration progress and adapt to evolving quantum capabilities.
