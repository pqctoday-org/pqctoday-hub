---
generated: 2026-08-08
category: Technical Standards
document_count: 5
requirement_count: 43
---

## ASC-X9-IR-F01-2022
- **Source**: ASC X9 IR 01-2022 — Quantum Computing Risks to the Financial Services Industry
- **URL**: https://x9.org/wp-content/uploads/2022/11/X9F-Quantum-Computing-Risk-Study-Group-IR-F01-2022_20221129-Published-PDF.pdf
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Engage in proof-of-concept activities to validate that selected quantum-safe controls are appropriate for the organization.
- **Governance**:
    - _T2 Risk-Informed · all_: Incorporate quantum-enabled attacks into Business Impact Assessments (BIAs), Business Continuity (BC), and Disaster Recovery (DR) planning.
    - _T2 Risk-Informed · all_: Assess and understand the organization's specific situation to properly mitigate quantum-risk, recognizing there is no cookie-cutter solution.
    - _T2 Risk-Informed · all_: Plan a migration to post-quantum cryptography without waiting for NIST to complete its standardization process.
    - _T2 Risk-Informed · all_: Keep up to date with the state of the art in quantum computing to better inform migration plans.
    - _T2 Risk-Informed · all_: Create a quantum-safe migration strategy and roadmap with timelines, milestones, and logical ordering of steps.
    - _T2 Risk-Informed · all_: Engage suppliers to learn their quantum-safe migration plans and coordinate accordingly.
- **Inventory**:
    - _T2 Risk-Informed · all_: Perform asset, cryptographic, and standards inventories to identify quantum-vulnerable cryptography and supply chain dependencies.

## ENISA PQC Guidelines
- **Source**: Post-Quantum Cryptography: Current State and Quantum Mitigation
- **URL**: https://www.enisa.europa.eu/publications/post-quantum-cryptography-current-state-and-quantum-mitigation
- **Requirement count**: 9
- **Governance**:
    - _T2 Risk-Informed · all_: Engage with NIST discussions to ensure specific use cases are covered by emerging post-quantum standards.
- **Inventory**:
    - _T2 Risk-Informed · all_: Create a catalogue of all public-key cryptography usage, including software updates and third-party products, to prepare for migration.
    - _T2 Risk-Informed · all_: Create a catalogue of public-key cryptography usage, including software updates and third-party products, to prepare for migration.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Adopt hybrid implementations combining pre-quantum and post-quantum schemes to mitigate risks during the standardization transition.
    - _T2 Risk-Informed · keys_: Mix pre-shared keys into all keys established via public-key cryptography to mitigate quantum threats.
    - _T2 Risk-Informed · keys_: Mix pre-shared keys into key derivation for systems requiring long-term confidentiality, ensuring unique PSKs per device.
    - _T2 Risk-Informed · software_: Implement hybrid cryptographic schemes combining pre-quantum and post-quantum algorithms for data requiring long-term confidentiality.
    - _T2 Risk-Informed · software_: Integrate post-quantum signature schemes into hard-to-upgrade devices now to ensure secure service continuity.
    - _T2 Risk-Informed · software_: Include post-quantum signature schemes in hard-to-upgrade devices now to ensure secure continuity of service and OS upgrades.

## ENISA-State-of-Cybersecurity-2024
- **Source**: 2024 Report on the State of Cybersecurity in the Union
- **URL**: https://www.enisa.europa.eu/publications/2024-report-on-the-state-of-the-cybersecurity-in-the-union
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Implement policies and procedures to assess the effectiveness of cybersecurity risk-management measures, including regular audits by supervisory authorities or independent third parties.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a framework for internal cybersecurity risk management, governance, and control overseen by the highest level of management.
    - _T2 Risk-Informed · all_: Establish documented policies and procedures regarding the use of cryptography and, where appropriate, encryption as part of cybersecurity risk management measures.
    - _T2 Risk-Informed · all_: Define and review ICT security policies annually; document security measures, practices, and procedures to ensure management-approved risk management frameworks are in place.
    - _T2 Risk-Informed · all_: Ensure top management actively approves cybersecurity risk management measures and participates in dedicated cybersecurity training to drive organizational maturity.
- **Observability**:
    - _T2 Risk-Informed · all_: Establish processes and tools to report cybersecurity incidents with significant impact to competent authorities or CSIRTs as mandated by NIS2, eIDAS, and EECC.
    - _T2 Risk-Informed · all_: Implement mechanisms for regular cooperation and information exchange on risks, threats, and incidents between competent authorities and critical entities.

## NIST NCCoE SP 1800-38C
- **Source**: Migration to Post-Quantum Cryptography (Preliminary Draft)
- **URL**: https://www.nccoe.nist.gov/sites/default/files/2023-12/pqc-migration-nist-sp-1800-38c-preliminary-draft.pdf
- **Requirement count**: 15
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Verify that cryptographic libraries support both classical and quantum-safe algorithms to facilitate hybrid migration strategies.
    - _T3 Repeatable · software_: Test pre-standardized post-quantum implementations in a lab environment to ensure interoperability before production deployment.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a Quantum-Readiness Roadmap to guide the migration from vulnerable to post-quantum cryptography.
    - _T2 Risk-Informed · all_: Determine supply chain quantum-readiness to assess vendor capabilities for post-quantum migration.
    - _T2 Risk-Informed · software_: Determine supply chain quantum-readiness by discussing roadmaps with technology vendors.
- **Inventory**:
    - _T2 Risk-Informed · all_: Prepare a cryptographic inventory to identify quantum-vulnerable assets as part of the migration roadmap.
    - _T2 Risk-Informed · all_: Take inventory of cryptographic assets as part of PQ readiness planning and roadmaps.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Extend key management systems to facilitate quantum-resistant device lifecycle management.
    - _T2 Risk-Informed · keys_: Utilize cloud-based platforms for provisioning and managing security credentials for IoT devices running quantum-resistant algorithms.
    - _T2 Risk-Informed · software_: Track incremental changes in draft standard specifications to prevent interoperability failures during implementation updates.
    - _T2 Risk-Informed · software_: Use temporary group identifiers for draft implementations to manage backward compatibility breaking changes before final standards are assigned.
    - _T3 Repeatable · software_: Implement phased removal of deprecated cryptographic method names to manage backward compatibility during standard evolution.
    - _T3 Repeatable · software_: Use version-specific temporary names for cryptographic methods to maintain interoperability when draft specifications change.
- **Observability**:
    - _T2 Risk-Informed · software_: Use tools to discover the use of vulnerable cryptography as an essential step in migration.
    - _T3 Repeatable · software_: Benchmark performance metrics of post-quantum algorithms to optimize implementations and identify bottlenecks.

## PSD2-Directive-EU-2015-2366
- **Source**: Directive (EU) 2015/2366 on payment services in the internal market (PSD2)
- **URL**: https://www.legislation.gov.uk/eudr/2015/2366/data.htm
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a framework to mitigate security risks and maintain effective incident management procedures.
    - _T2 Risk-Informed · all_: Provide competent authorities with regular updated assessments of security risks and response measures.
    - _T2 Risk-Informed · all_: Report major security incidents to competent authorities without undue delay.
    - _T2 Risk-Informed · all_: Put in place an effective complaints procedure with short, clearly defined timeframes for replies.
