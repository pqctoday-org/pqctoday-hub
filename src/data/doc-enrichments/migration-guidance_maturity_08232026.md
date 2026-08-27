---
generated: 2026-08-23
category: Technical Standards
document_count: 16
requirement_count: 99
---

## AU-ACSC-Quantum-Tech-Primer-Communications-2026
- **Source**: Quantum Technology Primer - Communications
- **URL**: https://www.cyber.gov.au/sites/default/files/2026-03/Quantum%20technology%20primer%20-%20Communications.pdf
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Prioritise strengthening security posture and planning for post-quantum cryptography (PQC) transition.
    - _T2 Risk-Informed · all_: Monitor evolving standards, invest in R&D, and assess vendor readiness for quantum-resistant solutions.
    - _T2 Risk-Informed · all_: Implement a plan for adopting new technologies and standardising protocols to support interoperability.
    - _T2 Risk-Informed · all_: Assess vendors for secure development practices and require transparency across the supply chain.
- **Inventory**:
    - _T2 Risk-Informed · all_: Establish a verifiable chain of trust across hardware, firmware, and software components to support supply chain integrity.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Implement robust key management processes including secure generation, distribution, storage, rotation, and destruction.

## AppViewX-47Day-Certs
- **Source**: Automating 47-Day Certificate Lifecycles
- **URL**: https://www.appviewx.com/blogs/automating-47-day-certificate-lifecycles/
- **Requirement count**: 7
- **Governance**:
    - _T3 Repeatable · certificates_: Form a cross-functional Machine Identity Management Working Group to define certificate policies, approved CAs, key lengths, and algorithm standards.
    - _T3 Repeatable · certificates_: Implement policy-driven management with dynamic compliance dashboards and automated compliance reporting to enforce standards and reduce audit preparation time.
- **Inventory**:
    - _T3 Repeatable · certificates_: Deploy agentless scanning across network segments, cloud platforms, and container orchestrators to discover all certificates and eliminate visibility gaps.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Automate critical workflows to renew certificates before expiration without human intervention for standard requests, ensuring continuous compliance.
    - _T4 Adaptive · certificates_: Integrate certificate lifecycle management with DevOps pipelines, CI/CD workflows, and ITSM platforms to enable zero-touch renewal and orchestration.
    - _T4 Adaptive · certificates_: Build crypto-agility to identify affected certificates, generate replacements, and deploy across environments in hours when post-quantum algorithms require deployment.
- **Observability**:
    - _T3 Repeatable · certificates_: Track key performance indicators including mean time to provision, certificate coverage, renewal success rate, and policy compliance to demonstrate automation value.

## CSA-PQC-Guide-2025
- **Source**: A Practitioner's Guide to Post-Quantum Cryptography
- **URL**: https://cloudsecurityalliance.org/artifacts/a-practitioners-guide-to-post-quantum-cryptography
- **Requirement count**: 8
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Monitor threat reports and technology availability periodically to adjust risk assessments and migration plans as PQC standards evolve.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a risk management program and classify data assets as a prerequisite for PQC migration planning, following CSA Cloud Controls Matrix principles.
    - _T2 Risk-Informed · all_: Assess risk immediately and periodically, considering business impact and likelihood of compromise, before determining mitigation strategies.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain an up-to-date inventory of business data assets, recording identification and value by Q-Day to assess risk from Store Now, Decrypt Later attacks.
    - _T2 Risk-Informed · certificates_: Identify X.509 certificates with expiration dates beyond the turn of the decade as high-priority assets for PQC migration due to long-term value.
    - _T2 Risk-Informed · keys_: Track operational data such as certificates and keys in a configuration management database (CMDB) to identify sensitive assets with long-term value.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Ensure Key Management Systems (KMS) and Hardware Security Modules (HSM) adopt PQC algorithms to protect encryption keys at rest.
    - _T2 Risk-Informed · software_: Plan for hybrid key exchange modes (e.g., TLS 1.3 with ML-KEM) as interim solutions while transitioning to pure PQC algorithms.

## CSA-Practitioners-Guide-PQC-2025
- **Source**: A Practitioner's Guide to Post-Quantum Cryptography
- **URL**: https://cloudsecurityalliance.org/artifacts/a-practitioners-guide-to-post-quantum-cryptography
- **Requirement count**: 9
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Monitor the availability of relevant PQC technologies and periodically reassess risk as data is added, deleted, or updated.
- **Governance**:
    - _T2 Risk-Informed · all_: Assess risk immediately and periodically, determining if data retains value by Q-Day, before planning and implementing mitigation strategies.
    - _T2 Risk-Informed · all_: Follow industry or sector-specific data identification and risk assessment guidelines if subjected to industrial or government regulations.
- **Inventory**:
    - _T2 Risk-Informed · all_: Maintain an up-to-date inventory of business data assets, recording identification and value by Q-Day to assess risk from Store Now, Decrypt Later attacks.
    - _T2 Risk-Informed · certificates_: Identify X.509 certificates with expiration dates beyond the turn of the decade as high-priority operational data with long-term value at risk from quantum attacks.
    - _T2 Risk-Informed · keys_: Track operational data such as certificates and keys in a configuration management database (CMDB) to identify sensitive assets with long-term value.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Ensure key management systems (KMS) and hardware security modules (HSM) use post-quantum cryptographic algorithms to protect encryption keys at rest.
    - _T2 Risk-Informed · libraries_: Plan for the cost and effort of compiling, building, and maintaining PQC modules for technology components where out-of-the-box support is not yet available.
    - _T2 Risk-Informed · software_: Adopt hybrid mode key exchange as an interim solution for encryption in transit protocols while transitioning to pure post-quantum cryptographic standards.

## Circle-PQC-Roadmap-2026
- **Source**: Circle's Post-Quantum Security Roadmap: Securing blockchains smart contracts and digital assets for the quantum era
- **URL**: https://6778953.fs1.hubspotusercontent-na1.net/hubfs/6778953/PDFs/quantum_paper.pdf
- **Requirement count**: 7
- **Assurance / FIPS**:
    - _T2 Risk-Informed · keys_: Delay post-quantum migration for HSM-protected keys until the hardware provider adds audited support, avoiding insecure key exports to non-hardened CPUs.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish migration policies that distinguish between disabling unsafe cryptographic controls and extinguishing asset holder economic interests, ensuring recovery mechanisms.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct a comprehensive inventory of quantum vulnerabilities across the development stack, infrastructure, and third-party vendors to assess organizational risk.
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Migrate wallet funds, including cold storage, securely to post-quantum addresses and upgrade backend custody infrastructure to support new key types.
    - _T3 Repeatable · software_: Implement a phased migration strategy: begin with readiness, proceed to hybrid dual-mode operation for compatibility, and finally switch to fully post-quantum systems.
    - _T3 Repeatable · software_: Deprecate support for non-quantum-secure blockchains and accounts in the final transition phase, contingent on ecosystem readiness and risk assessments.
    - _T3 Repeatable · software_: Adopt hybrid encryption algorithms (e.g., X25519MLKEM768) for privacy protection against harvest-now-decrypt-later attacks during the transition period.

## DigiCert-PQC-Maturity-Model
- **Source**: Post-Quantum Cryptography Maturity Model (white paper)
- **URL**: https://www.digicert.com/content/dam/digicert/pdfs/post-quantum-cryptography-maturity-model-whitepaper-en.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T4 Adaptive · software_: Actively test and deploy post-quantum cryptography within the network to ensure production systems are not disrupted.
- **Governance**:
    - _T4 Adaptive · all_: Thoroughly document organizational policies and standards around the use of encryption.
- **Inventory**:
    - _T2 Risk-Informed · certificates_: Document encryption practices and assess risks/gaps using a management platform with reporting, discovery, and visibility capabilities.
    - _T2 Risk-Informed · keys_: Identify Hardware Security Modules (HSMs) and verify their capability and timeline for quantum-safe upgrades.
    - _T3 Repeatable · certificates_: Consolidate certificates onto a single management platform to optimize visibility and control over all organizational assets.
- **Lifecycle / CLM**:
    - _T4 Adaptive · certificates_: Employ automation to maintain a current inventory of all digital certificates with full visibility and control.

## EPA-Guidance-on-Improving-Cybersecurity-at-Drinking-Water-an
- **Source**: EPA Guidance on Improving Cybersecurity at Drinking Water and Wastewater Systems (Aug 2024)
- **URL**: https://www.epa.gov/system/files/documents/2024-08/epa-guidance-on-improving-cybersecurity-at-drinking-water-and-wastewater-systems-1.pdf
- **Requirement count**: 4
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Use the EPA Cybersecurity Checklist or CISA CPGs to assess current cybersecurity practices and controls for gaps.
- **Governance**:
    - _T2 Risk-Informed · all_: Develop a risk mitigation plan with specific actions, resources, schedules, and responsibilities to reduce cyber risk.
    - _T2 Risk-Informed · all_: Incorporate cybersecurity strategies and resources into emergency response plans based on risk assessment findings.
- **Inventory**:
    - _T2 Risk-Informed · all_: Assess risks to electronic, computer, or automated systems utilized by the water system as part of risk and resilience assessments.

## FERC-Security-Program-for-Hydropower-Projects-Division-of-Da
- **Source**: FERC Security Program for Hydropower Projects (Division of Dam Safety and Inspections)
- **URL**: https://www.ferc.gov/sites/default/files/2020-04/security.pdf
- **Requirement count**: 8
- **Governance**:
    - _T2 Risk-Informed · all_: Designate a primary point of contact and alternate contacts to receive FERC security notifications and manage communications.
    - _T2 Risk-Informed · all_: Ensure the security contact and dam safety contact remain in communication for project responsibilities and operation.
    - _T2 Risk-Informed · all_: Involve responsible security staff and dam safety/operations managers in all major security-associated activities for the project site.
    - _T2 Risk-Informed · all_: Provide annual training and information updates to employees on security plans (physical and cyber) and threats.
    - _T2 Risk-Informed · all_: Coordinate procedures among various plans, such as the Emergency Action Plan and Security Plan, including Internal Emergency Response.
    - _T2 Risk-Informed · all_: Notify FERC Regional Office of any suspicious activity or incidents as soon as practical, usually within one working day.
    - _T2 Risk-Informed · all_: Have the security contact and all required security documents available for review by FERC D2SI Engineers during inspections.
    - _T2 Risk-Informed · all_: Include compliance with Computer Security and SCADA requirements in the Annual Security Compliance Certification Letter.

## GFMA-Quantum-Migration-Mapping-the-Emerging-Landscape-Octobe
- **Source**: GFMA — Quantum Migration: Mapping the Emerging Landscape (October 2025)
- **URL**: https://www.sifma.org/wp-content/uploads/2025/10/Quantum-Migration-October-2025-GFMA.pdf
- **Requirement count**: 7
- **Governance**:
    - _T2 Risk-Informed · all_: Establish internal accountability mechanisms for quantum migration with cross-functional leadership and reporting, leveraging existing cybersecurity oversight.
    - _T2 Risk-Informed · all_: Frame quantum migration in business terms to secure funding and executive sponsorship, ensuring clear understanding of risks and cost of inaction.
    - _T2 Risk-Informed · all_: Embed quantum readiness into ongoing compliance efforts such as DORA and PCI DSS 4.0 to reduce duplication and meet supervisory expectations.
    - _T2 Risk-Informed · all_: Ensure senior leadership drives internal education across the workforce regarding quantum risks and transition measures, tailored to technical expertise.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct discovery and inventorying of cryptographic assets to gain full visibility of systems and data relying on at-risk encryption protections.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Adopt a phased, risk-based approach for quantum upgrades, prioritizing critical functions by 2030/31 and all other upgrades by 2035.
    - _T2 Risk-Informed · all_: Coordinate remediation across financial institution group structures and the vendor supply chain to address low awareness of quantum risk among suppliers.

## McKinsey-PQC-Preparation
- **Source**: When and how to prepare for post-quantum cryptography
- **URL**: https://www.mckinsey.com/capabilities/mckinsey-digital/our-insights/when-and-how-to-prepare-for-post-quantum-cryptography
- **Requirement count**: 6
- **Governance**:
    - _T2 Risk-Informed · all_: Build long-term relationships with suppliers, regulators, and peers to stay updated on emerging standards.
- **Inventory**:
    - _T2 Risk-Informed · all_: Assess data shelf life and system development cycles to identify high-priority assets requiring quantum mitigation.
    - _T2 Risk-Informed · all_: Create a shared internal understanding of data and system sensitivity to quantum threats via standardized cataloging.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Prepare operationally and financially for retrofitting systems, including physical access for hardware updates.
    - _T2 Risk-Informed · software_: Ensure hardware and software architectures are modular to facilitate future retrofitting with PQC solutions.
    - _T2 Risk-Informed · software_: Separate hardware and software components to maintain flexibility for emerging PQC algorithms.

## NIST-SP-800-57-Pt1-R5
- **Source**: Recommendation for Key Management: Part 1 – General (Revision 5)
- **URL**: https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf
- **Requirement count**: 5
- **Assurance / FIPS**:
    - _T2 Risk-Informed · libraries_: Ensure cryptographic modules used for operations comply with FIPS 140 standards and associated test requirements.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish clear guidance and oversight for the proper management of cryptographic keys to ensure controls are followed.
    - _T2 Risk-Informed · all_: Establish a framework and guidance to support establishing cryptographic key management within the organization.
- **Inventory**:
    - _T2 Risk-Informed · keys_: Implement key-inventory management processes to track cryptographic keying material.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Manage cryptographic keys throughout their lifecycle, including secure generation, storage, distribution, use, and destruction.

## NL-PQC-Migration-Handbook-2024
- **Source**: The PQC Migration Handbook (2nd Edition)
- **URL**: https://publications.tno.nl/publication/34643386/fXcPVHsX/TNO-2024-pqc-en.pdf
- **Requirement count**: 5
- **Governance**:
    - _T2 Risk-Informed · all_: Review and update cryptographic policies based on evolving regulatory requirements and risk assessments.
    - _T2 Risk-Informed · all_: Integrate quantum risk assessment into existing risk management procedures.
    - _T2 Risk-Informed · all_: Form a dedicated team to oversee the PQC migration and ensure business processes facilitate transition.
- **Inventory**:
    - _T2 Risk-Informed · all_: Perform cryptographic asset discovery to create a comprehensive inventory of all cryptography in use.
- **Lifecycle / CLM**:
    - _T3 Repeatable · all_: Establish cryptographic agility to quickly modify or replace deployed primitives without significant disruption.

## PKI-Consortium-Launches-the-CBOM-Profiles-Working-Group
- **Source**: PKI Consortium Launches the CBOM Profiles Working Group
- **URL**: https://pkic.org/2026/06/08/pki-consortium-launches-the-cbom-profiles-working-group/
- **Requirement count**: 3
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a centralized, vendor-agnostic baseline for cryptographic metadata mapping to prevent fragmentation of digital supply chain trust and ensure consistent profile definitions.
- **Inventory**:
    - _T2 Risk-Informed · all_: Adopt a neutral, open methodology for defining Cryptographic Bill of Materials (CBOM) profiles to ensure consistent inventory of cryptographic assets across systems and supply chains.
    - _T2 Risk-Informed · all_: Map CBOM profiles to industry-standard BOM formats such as SPDX and CycloneDX to facilitate interoperability and standardized ingestion of cryptographic asset data.

## Requirements-and-Gaps-for-Post-Quantum-Certificate-Rotation
- **Source**: Requirements and Gaps for Post-Quantum Certificate Rotation in Multi-Tenant Public Key Infrastructure Environments
- **URL**: https://datatracker.ietf.org/doc/draft-vicente-pquip-multitenant-pki-requirements/
- **Requirement count**: 8
- **Governance**:
    - _T3 Repeatable · certificates_: Enforce algorithm policy consistency checks at issuance time to ensure certificates comply with the tenant's declared cryptographic policy before issuance.
    - _T3 Repeatable · certificates_: Maintain per-transaction audit records to demonstrate that each issued certificate was algorithm-compliant at the time of issuance.
    - _T3 Repeatable · certificates_: Map tenant algorithm posture against compliance deadline frameworks (e.g., CNSA 2.0) and generate gap reports for certificates requiring migration.
    - _T3 Repeatable · certificates_: Provide aggregate and per-tenant compliance progress metrics suitable for regulatory reporting.
- **Lifecycle / CLM**:
    - _T3 Repeatable · certificates_: Implement mechanisms to order certificate rotation actions across multi-tenant environments to avoid service disruption from violating trust chain or dependency constraints.
    - _T3 Repeatable · certificates_: Support awareness of network topology context to inform the sequencing of certificate rotation operations.
- **Observability**:
    - _T3 Repeatable · certificates_: Detect whether algorithms in active certificates are consistent with the tenant's current cryptographic policy.
    - _T3 Repeatable · certificates_: Provide a per-tenant view of algorithm consistency across the entire active certificate population.

## SecBoulevard-Carielli-CryptoAgility-2025
- **Source**: Forrester (Sandy Carielli) on Cryptoagility: Shared Intel Q&A
- **URL**: https://securityboulevard.com/2025/03/shared-intel-qa-forrester-highlights-why-companies-need-to-strive-for-cryptoagility-today/
- **Requirement count**: 4
- **Governance**:
    - _T2 Risk-Informed · software_: Assess technology vendors' cryptoagility efforts and PQC migration roadmaps as part of third-party risk management and RFP processes.
- **Inventory**:
    - _T2 Risk-Informed · all_: Conduct a cryptographic inventory covering homegrown software, purchased software, devices, and infrastructure to identify algorithms in use.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · all_: Plan for a three-to-five-year cryptographic migration timeline involving planning, piloting, testing, and managing third-party dependencies.
    - _T2 Risk-Informed · libraries_: Avoid hardcoding algorithms; favor libraries and systems that simplify migrating between algorithms to enable cryptoagility.

## Singapore IMDA Cyber Security Guide
- **Source**: Post-Quantum Cryptography Readiness Guide
- **URL**: https://isomer-user-content.by.gov.sg/36/350e4bd5-fa25-4609-8e78-5e159d9da245/CSA%27s%20Quantum-Safe%20Handbook%20V1%20Dtd%2016%20Jul%2026.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T2 Risk-Informed · all_: Utilize the Quantum Readiness Index (QRI) to self-assess readiness and identify capability gaps.
- **Governance**:
    - _T2 Risk-Informed · all_: Establish a RACI matrix to define roles and responsibilities for quantum-safe migration activities.
    - _T2 Risk-Informed · all_: Conduct risk assessments to prioritize migration efforts based on organizational risk appetite and data sensitivity.
- **Inventory**:
    - _T1 Partial · all_: Identify and inventory cryptographic dependencies across software libraries, hardware modules, and protocols.
- **Lifecycle / CLM**:
    - _T2 Risk-Informed · keys_: Implement rapid and regular rotation of encryption keys to mitigate Harvest-Now-Decrypt-Later threats.
    - _T2 Risk-Informed · software_: Prioritize replacement of public-key cryptography relying on integer factoring or discrete logarithms.
